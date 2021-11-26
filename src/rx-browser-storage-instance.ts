import {
  BulkWriteRow,
  MangoQuery,
  MangoQuerySortDirection,
  MangoQuerySortPart,
  RxDocumentData,
  RxDocumentWriteData,
  RxJsonSchema,
  RxStorageBulkWriteError,
  RxStorageBulkWriteResponse,
  RxStorageChangeEvent,
  RxStorageInstance,
  RxStorageInstanceCreationParams,
  RxStorageQueryResult,
} from "rxdb/dist/types/types";
import { Subject } from "rxjs";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";
import {
  getIdbDatabase,
  getPrimaryFieldOfPrimaryKey,
  IDB_DATABASE_STATE_BY_NAME,
  newRxError,
} from "./db-helpers";
import {
  ChangeEvent,
  DeterministicSortComparator,
  QueryMatcher,
} from "event-reduce-js/dist/lib/types";
import { find } from "./find";
import { createRevision, getHeightOfRevision } from "rxdb";
import { getEventKey } from "./utils";
const { filterInMemoryFields } = require("pouchdb-selector-core");

let instanceId = 1;

export class RxStorageBrowserInstance<RxDocType>
  implements
    RxStorageInstance<
      RxDocType,
      BrowserStorageInternals,
      BrowserStorageSettings
    >
{
  //   public readonly primaryPath: keyof RxDocType;
  private changes$: Subject<RxStorageChangeEvent<RxDocumentData<RxDocType>>> =
    new Subject();
  public readonly instanceId = instanceId++;
  private closed = false;
  private lastChangefeedSequence: number = 0;

  constructor(
    public readonly databaseName: string,
    public readonly collectionName: string,
    public readonly schema: Readonly<RxJsonSchema<RxDocType>>,
    public readonly internals: BrowserStorageInternals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {
    // this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }

  prepareQuery(mutateableQuery: MangoQuery<RxDocType>) {
    return mutateableQuery;
  }

  getSortComparator(query: MangoQuery<RxDocType>) {
    // TODO if no sort is given, use sort by primary.
    // This should be done inside of RxDB and not in the storage implementations.
    const sortOptions: MangoQuerySortPart<RxDocType>[] = query.sort
      ? (query.sort as any)
      : [
          {
            [this.internals.primaryPath]: "asc",
          },
        ];

    const fun: DeterministicSortComparator<RxDocType> = (
      a: RxDocType,
      b: RxDocType
    ) => {
      let compareResult: number = 0;
      sortOptions.forEach((sortPart) => {
        const fieldName: string = Object.keys(sortPart)[0];
        const direction: MangoQuerySortDirection = Object.values(sortPart)[0];
        const directionMultiplier = direction === "asc" ? 1 : -1;
        const valueA: any = (a as any)[fieldName];
        const valueB: any = (b as any)[fieldName];
        if (valueA === valueB) {
          return;
        } else {
          if (valueA > valueB) {
            compareResult = 1 * directionMultiplier;
          } else {
            compareResult = -1 * directionMultiplier;
          }
        }
      });

      /**
       * Two different objects should never have the same sort position.
       * We ensure this by having the unique primaryKey in the sort params
       * at this.prepareQuery()
       */
      if (!compareResult) {
        throw newRxError("SNH", { args: { query, a, b } });
      }

      return compareResult as 1 | -1;
    };

    return fun;
  }

  getQueryMatcher(query: MangoQuery<RxDocType>) {
    const fun: QueryMatcher<RxDocumentWriteData<RxDocType>> = (
      doc: RxDocumentWriteData<RxDocType>
    ) => {
      console.log("getQueryMatcher doc:", doc);
      const { _attachments, _deleted, _rev, ...json } = doc;
      const inMemoryFields = Object.keys(json);
      return filterInMemoryFields([json], query, inMemoryFields).length > 0;
    };

    return fun;
  }

  async query(
    preparedQuery: MangoQuery<RxDocType>
  ): Promise<RxStorageQueryResult<RxDocType>> {
    const db = this.getLocalState().db;
    const rows = await find(db, this.collectionName, preparedQuery);
    return rows;
  }

  async bulkWrite(
    documentWrites: BulkWriteRow<RxDocType>[]
  ): Promise<RxStorageBulkWriteResponse<RxDocType>> {
    if (documentWrites.length === 0) {
      throw newRxError("P2", {
        args: {
          documentWrites,
        },
      });
    }

    const db = this.getLocalState().db;
    const txn = db.transaction(this.collectionName, "readwrite");
    const store = txn.store;

    const ret: RxStorageBulkWriteResponse<RxDocType> = {
      success: new Map(),
      error: new Map(),
    };

    for (const writeRow of documentWrites) {
      const startTime = Date.now();
      const id: string = (writeRow.document as any)[this.internals.primaryPath];
      // TODO: probably will have problems here.
      const documentInDbCursor = await store.openCursor(
        this.internals.primaryPath
      );
      const documentInDb = documentInDbCursor?.value;
      if (!documentInDb) {
        // insert new document
        const newRevision = "1-" + createRevision(writeRow.document);

        /**
         * It is possible to insert already deleted documents,
         * this can happen on replication.
         */
        const insertedIsDeleted = writeRow.document._deleted ? true : false;
        if (!insertedIsDeleted) {
          // TODO: purge documents
          continue;
        }

        const writeDoc = Object.assign({}, writeRow.document, {
          _rev: newRevision,
          _deleted: insertedIsDeleted,
          // TODO attachments are currently not working with lokijs
          _attachments: {} as any,
        });

        await store.add(writeDoc);
        this.addChangeDocumentMeta(id);
        this.changes$.next({
          eventId: getEventKey(false, id, newRevision),
          documentId: id,
          change: {
            doc: writeDoc,
            id,
            operation: "INSERT",
            previous: null,
          },
          startTime,
          endTime: Date.now(),
        });
        ret.success.set(id, writeDoc as any);
      } else {
        // update existing document
        const revInDb: string = documentInDb._rev;

        // inserting a deleted document is possible
        // without sending the previous data.
        // TODO: purge document
        // if (!writeRow.previous && documentInDb._deleted) {
        //   writeRow.previous = documentInDb;
        // }

        if (
          (!writeRow.previous && !documentInDb._deleted) ||
          (!!writeRow.previous && revInDb !== writeRow.previous._rev)
        ) {
          // conflict error
          const err: RxStorageBulkWriteError<RxDocType> = {
            isError: true,
            status: 409,
            documentId: id,
            writeRow: writeRow,
          };
          ret.error.set(id, err);
        } else {
          const newRevHeight = getHeightOfRevision(revInDb) + 1;
          const newRevision =
            newRevHeight + "-" + createRevision(writeRow.document);

          if (
            writeRow.previous &&
            !writeRow.previous._deleted &&
            writeRow.document._deleted
          ) {
            // TODO: purge
            await documentInDbCursor.delete();
            this.addChangeDocumentMeta(id); // TODO: do I need this here.
            const previous = Object.assign({}, writeRow.previous);
            previous._rev = newRevision;
            const change = {
              id,
              operation: "DELETE" as "DELETE",
              previous,
              doc: null,
            };
            this.changes$.next({
              eventId: getEventKey(false, id, newRevision),
              documentId: id,
              change,
              startTime,
              endTime: Date.now(),
            });
            continue;
          }

          if (writeRow.document._deleted) {
            throw newRxError("SNH", { args: { writeRow } });
          }

          const writeDoc: any = Object.assign({}, writeRow.document, {
            $loki: documentInDb.$loki,
            _rev: newRevision,
            _deleted: false,
            _attachments: {}, // TODO: attachments
          });
          await documentInDbCursor.update(writeDoc);
          this.addChangeDocumentMeta(id);

          // TODO: stripIdbKey(writeDoc) ?
          let change: ChangeEvent<RxDocumentData<RxDocType>> | null = null;
          if (
            writeRow.previous &&
            writeRow.previous._deleted &&
            !writeDoc._deleted
          ) {
            change = {
              id,
              operation: "INSERT",
              previous: null,
              doc: writeDoc,
            };
          } else if (
            writeRow.previous &&
            !writeRow.previous._deleted &&
            !writeDoc._deleted
          ) {
            change = {
              id,
              operation: "UPDATE",
              previous: writeRow.previous,
              doc: writeDoc,
            };
          }
          if (!change) {
            throw newRxError("SNH", { args: { writeRow } });
          }
          this.changes$.next({
            eventId: getEventKey(false, id, newRevision),
            documentId: id,
            change,
            startTime,
            endTime: Date.now(),
          });
          ret.success.set(id, writeDoc);
        }
      }
    }

    txn.commit();
    return ret;
  }

  private getLocalState() {
    const localState = this.internals.localState;
    if (!localState) {
      throw new Error(`localState is undefind (dbName: ${this.databaseName})`);
    }

    return localState;
  }

  /**
   * Adds an entry to the changes feed
   * that can be queried to check which documents have been
   * changed since sequence X.
   */
  private async addChangeDocumentMeta(id: string) {
    const localState = this.getLocalState();
    const changesCollectionName = localState.changesCollectionName;
    const db = localState.db;
    const store = db.transaction(changesCollectionName, "readwrite").store;

    if (!this.lastChangefeedSequence) {
      const cursor = await store.index("sequence").openCursor(null, "prev");
      const lastDoc = cursor?.value;
      if (lastDoc) {
        this.lastChangefeedSequence = lastDoc.sequence;
      }
    }

    const nextFeedSequence = this.lastChangefeedSequence + 1;

    await store.add({
      id,
      sequence: nextFeedSequence,
    });

    this.lastChangefeedSequence = nextFeedSequence;
  }
}

export const createBrowserStorageLocalState = async <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
) => {
  const primaryPath = getPrimaryFieldOfPrimaryKey(
    params.schema.primaryKey
  ).toString();
  const databaseState = await getIdbDatabase(
    params.databaseName,
    params.collectionName,
    primaryPath,
    params.schema
  );

  return {
    databaseState,
    primaryPath,
  };
};

export const createBrowserStorageInstance = async <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
) => {
  const internals: BrowserStorageInternals =
    await createBrowserStorageLocalState(params);

  const instance = new RxStorageBrowserInstance(
    params.databaseName,
    params.collectionName,
    params.schema,
    internals
  );

  /**
   * TODO: should we do extra steps to enable CORRECT multiinstance?
   */

  return instance;
};
