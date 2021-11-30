import {
  BlobBuffer,
  BulkWriteRow,
  ChangeStreamOnceOptions,
  MangoQuery,
  MangoQuerySortDirection,
  MangoQuerySortPart,
  RxDocumentData,
  RxDocumentWriteData,
  RxJsonSchema,
  RxStorageBulkWriteError,
  RxStorageBulkWriteResponse,
  RxStorageChangedDocumentMeta,
  RxStorageChangeEvent,
  RxStorageInstance,
  RxStorageInstanceCreationParams,
  RxStorageQueryResult,
} from "rxdb/dist/types/types";
import { Observable, Subject } from "rxjs";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";
import {
  createIdbDatabase,
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
import { createRevision, getHeightOfRevision, parseRevision } from "rxdb";
import { getEventKey } from "./utils";
import { deleteDB } from "idb";
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
    public readonly options: Readonly<BrowserStorageSettings>,
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
    const db = await this.getLocalState().getDb();
    const rows = await find(db, this.collectionName, preparedQuery);
    return { documents: rows };
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

    const db = await this.getLocalState().getDb();
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
      const documentInDbCursor = await store.openCursor(id);
      const documentInDb = documentInDbCursor?.value;
      if (!documentInDb) {
        // insert new document
        const newRevision = "1-" + createRevision(writeRow.document);

        /**
         * It is possible to insert already deleted documents,
         * this can happen on replication.
         */
        const insertedIsDeleted = writeRow.document._deleted ? true : false;
        if (insertedIsDeleted) {
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

  async bulkAddRevisions(
    documents: RxDocumentData<RxDocType>[]
  ): Promise<void> {
    if (documents.length === 0) {
      throw newRxError("P3", {
        args: {
          documents,
        },
      });
    }

    const localState = this.getLocalState();
    const db = await localState.getDb();
    const txn = db.transaction(this.collectionName, "readwrite");
    const store = txn.store;

    // TODO: stripKey(documentInDb) ?
    for (const docData of documents) {
      const startTime = Date.now();
      const id: string = (docData as any)[this.internals.primaryPath];
      // TODO: probably will have problems here.
      const documentInDbCursor = await store.openCursor(id);
      const documentInDb = documentInDbCursor?.value;
      if (!documentInDb) {
        // document not here, so we can directly insert
        await store.add(Object.assign({}, docData));

        this.changes$.next({
          documentId: id,
          eventId: getEventKey(false, id, docData._rev),
          change: {
            doc: docData,
            id,
            operation: "INSERT",
            previous: null,
          },
          startTime,
          endTime: Date.now(),
        });
        this.addChangeDocumentMeta(id);
      } else {
        const newWriteRevision = parseRevision(docData._rev);
        const oldRevision = parseRevision(documentInDb._rev);

        let mustUpdate: boolean = false;
        if (newWriteRevision.height !== oldRevision.height) {
          // height not equal, compare base on height
          if (newWriteRevision.height > oldRevision.height) {
            mustUpdate = true;
          }
        } else if (newWriteRevision.hash > oldRevision.hash) {
          // equal height but new write has the 'winning' hash
          mustUpdate = true;
        }
        if (mustUpdate) {
          const docDataCpy = Object.assign({}, docData);
          documentInDbCursor.update(docDataCpy);
          let change: ChangeEvent<RxDocumentData<RxDocType>> | null = null;
          if (documentInDb._deleted && !docData._deleted) {
            change = {
              id,
              operation: "INSERT",
              previous: null,
              doc: docData,
            };
          } else if (!documentInDb._deleted && !docData._deleted) {
            change = {
              id,
              operation: "UPDATE",
              previous: documentInDb,
              doc: docData,
            };
          } else if (!documentInDb._deleted && docData._deleted) {
            change = {
              id,
              operation: "DELETE",
              previous: documentInDb,
              doc: null,
            };
          } else if (documentInDb._deleted && docData._deleted) {
            change = null;
          }
          if (change) {
            this.changes$.next({
              documentId: id,
              eventId: getEventKey(false, id, docData._rev),
              change,
              startTime,
              endTime: Date.now(),
            });
            this.addChangeDocumentMeta(id);
          }
        }
      }
    }

    txn.commit();
  }

  async findDocumentsById(
    ids: string[],
    deleted: boolean
  ): Promise<Map<string, RxDocumentData<RxDocType>>> {
    const localState = this.getLocalState();
    const ret: Map<string, RxDocumentData<RxDocType>> = new Map();

    const db = await localState.getDb();
    const store = await db.transaction(this.collectionName, "readwrite").store;
    for (const id of ids) {
      const documentInDb = await store.get(id);
      if (documentInDb && (!documentInDb._deleted || deleted)) {
        // TODO: stripKey(documentInDb) ?
        ret.set(id, documentInDb);
      }
    }

    return ret;
  }

  async getChangedDocuments(options: ChangeStreamOnceOptions): Promise<{
    changedDocuments: RxStorageChangedDocumentMeta[];
    lastSequence: number;
  }> {
    const localState = this.getLocalState();

    const desc = options.direction === "before";
    const operator = options.direction === "after" ? "$gt" : "$lt";

    const changesCollectionName = localState.changesCollectionName;
    const db = await localState.getDb();
    const store = db.transaction(changesCollectionName, "readwrite").store;
    let cursor = await store
      .index("sequence")
      .openCursor(null, desc ? "prev" : "next");
    let changedDocuments = [];
    while (cursor) {
      const value = cursor.value;
      changedDocuments.push(value);
      cursor = await cursor.continue();
    }

    if (options.limit) {
      changedDocuments = changedDocuments.slice(0, options.limit);
    }

    changedDocuments = changedDocuments.map((result) => {
      return {
        id: result.id,
        sequence: result.sequence,
      };
    });

    const useForLastSequence = !desc
      ? changedDocuments[changedDocuments.length - 1]
      : changedDocuments[0];

    const ret: {
      changedDocuments: RxStorageChangedDocumentMeta[];
      lastSequence: number;
    } = {
      changedDocuments,
      lastSequence: useForLastSequence
        ? useForLastSequence.sequence
        : options.sinceSequence,
    };

    return ret;
  }

  changeStream(): Observable<RxStorageChangeEvent<RxDocumentData<RxDocType>>> {
    return this.changes$.asObservable();
  }

  getAttachmentData(
    _documentId: string,
    _attachmentId: string
  ): Promise<BlobBuffer> {
    // TODO: attacments
    throw new Error(
      "Attachments are not implemented in the lokijs RxStorage. Make a pull request."
    );
  }

  async close(): Promise<void> {
    this.closed = true;
    this.changes$.complete();
    IDB_DATABASE_STATE_BY_NAME.delete(this.databaseName);

    const localState = this.getLocalState();
    const db = await localState.getDb();
    db.close();
  }
  async remove(): Promise<void> {
    this.close();
    // TODO: it can be a problem actually.
    // The connection is not actually closed until all transactions created using this connection are complete.
    await deleteDB(this.databaseName);
    this.closed = true;
  }

  private getLocalState() {
    const localState = this.internals.databaseState;
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
    const db = await localState.getDb();
    const store = db.transaction(changesCollectionName, "readwrite").store;

    if (!this.lastChangefeedSequence) {
      const cursor = await store.index("sequence").openCursor(null, "prev");
      const lastDoc = cursor?.value;
      if (lastDoc) {
        this.lastChangefeedSequence = lastDoc.sequence;
      }
    }

    const nextFeedSequence = this.lastChangefeedSequence + 1;

    await store.put({
      eventId: id,
      sequence: nextFeedSequence,
    });

    this.lastChangefeedSequence = nextFeedSequence;
  }
}

export const createBrowserStorageLocalState = async <RxDocType>(
  params: RxStorageInstanceCreationParams<RxDocType, BrowserStorageSettings>
): Promise<BrowserStorageInternals> => {
  const primaryPath = getPrimaryFieldOfPrimaryKey(
    params.schema.primaryKey
  ).toString();
  const databaseState = await createIdbDatabase(
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
    {},
    params.schema,
    internals
  );

  /**
   * TODO: should we do extra steps to enable CORRECT multiinstance?
   */

  return instance;
};
