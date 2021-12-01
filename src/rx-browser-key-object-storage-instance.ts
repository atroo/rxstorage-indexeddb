import { ChangeEvent } from "event-reduce-js/dist/lib/types";
import { createRevision, parseRevision } from "rxdb";
import {
  BulkWriteLocalRow,
  RxKeyObjectStorageInstanceCreationParams,
  RxLocalDocumentData,
  RxLocalStorageBulkWriteResponse,
  RxStorageBulkWriteLocalError,
  RxStorageChangeEvent,
  RxStorageKeyObjectInstance,
} from "rxdb/dist/types/types";
import { Observable, Subject } from "rxjs";
import {
  createIdbDatabase,
  getChangesCollName,
  IDB_DATABASE_STATE_BY_NAME,
  newRxError,
} from "./db-helpers";
import {
  BrowserStorageInternals,
  BrowserStorageSettings,
} from "./types/browser-storage";
import { getEventKey } from "./utils";

let instanceId = 1;

export class RxBrowserKeyObjectStorageInstance<RxDocType>
  implements
    RxStorageKeyObjectInstance<BrowserStorageInternals, BrowserStorageSettings>
{
  private changes$: Subject<
    RxStorageChangeEvent<RxLocalDocumentData<RxDocType>>
  > = new Subject();
  public readonly instanceId = instanceId++;
  private closed = false;

  constructor(
    public readonly databaseName: string,
    public readonly collectionName: string,
    public readonly options: Readonly<BrowserStorageSettings>,
    public readonly internals: BrowserStorageInternals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {
    // this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }

  async bulkWrite<RxDocType>(
    documentWrites: BulkWriteLocalRow<RxDocType>[]
  ): Promise<RxLocalStorageBulkWriteResponse<RxDocType>> {
    if (documentWrites.length === 0) {
      throw newRxError("P2", {
        args: {
          documentWrites,
        },
      });
    }

    const ret: RxLocalStorageBulkWriteResponse<RxDocType> = {
      success: new Map(),
      error: new Map(),
    };

    if (this.closed) {
      return ret;
    }

    const db = await this.getLocalState().getDb();
    const txn = db.transaction(this.collectionName, "readwrite");
    const store = txn.store;

    const writeRowById: Map<string, BulkWriteLocalRow<RxDocType>> = new Map();
    const startTime = Date.now();

    for (const writeRow of documentWrites) {
      const id = writeRow.document._id;
      writeRowById.set(id, writeRow);
      const documentInDbCursor = await store.openCursor(id);
      const writeDoc = Object.assign({}, writeRow.document);
      const docInDb = documentInDbCursor?.value;
      const previous = writeRow.previous ? writeRow.previous : docInDb;
      const newRevHeight = previous
        ? parseRevision(previous._rev).height + 1
        : 1;
      const newRevision =
        newRevHeight + "-" + createRevision(writeRow.document);
      writeDoc._rev = newRevision;
      if (docInDb) {
        if (!writeRow.previous || docInDb._rev !== writeRow.previous._rev) {
          // conflict error
          const err: RxStorageBulkWriteLocalError<RxDocType> = {
            isError: true,
            status: 409,
            documentId: id,
            writeRow: writeRow,
          };
          ret.error.set(id, err);
          continue;
        } else if (!writeRow.document._deleted) {
          const docCpy: any = Object.assign({}, writeDoc);
          await documentInDbCursor.update(docCpy);
        } else {
          // TODO: purge
          await documentInDbCursor.delete();
        }
      } else if (!writeRow.document._deleted) {
        // TODO: purge
        await store.add(Object.assign({}, writeDoc));
      }

      ret.success.set(id, writeDoc);

      const endTime = Date.now();

      let event: ChangeEvent<RxLocalDocumentData<RxDocType>>;
      if (!writeRow.previous) {
        // was insert
        event = {
          operation: "INSERT",
          doc: writeDoc,
          id: id,
          previous: null,
        };
      } else if (writeRow.document._deleted) {
        // was delete

        // we need to add the new revision to the previous doc
        // so that the eventkey is calculated correctly.
        // Is this a hack? idk.
        const previousDoc = Object.assign({}, writeRow.previous);
        previousDoc._rev = newRevision;

        event = {
          operation: "DELETE",
          doc: null,
          id,
          previous: previousDoc,
        };
      } else {
        // was update
        event = {
          operation: "UPDATE",
          doc: writeDoc,
          id: id,
          previous: writeRow.previous,
        };
      }

      if (
        writeRow.document._deleted &&
        (!writeRow.previous || writeRow.previous._deleted)
      ) {
        /**
         * An already deleted document was added to the storage engine,
         * do not emit an event because it does not affect anything.
         */
      } else {
        const doc: RxLocalDocumentData<RxDocType> =
          event.operation === "DELETE"
            ? (event.previous as any)
            : (event.doc as any);
        const eventId = getEventKey(true, doc._id, doc._rev ? doc._rev : "");
        const storageChangeEvent: RxStorageChangeEvent<
          RxLocalDocumentData<RxDocType>
        > = {
          eventId,
          documentId: id,
          change: event,
          startTime,
          endTime,
        };
        // TODO: fix type
        this.changes$.next(storageChangeEvent as any);
      }
    }

    txn.commit();
    return ret;
  }

  async findLocalDocumentsById<RxDocType = any>(
    ids: string[]
  ): Promise<Map<string, RxLocalDocumentData<RxDocType>>> {
    const ret: Map<string, RxLocalDocumentData<RxDocType>> = new Map();

    if (this.closed) {
      return ret;
    }

    const localState = this.getLocalState();

    const db = await localState.getDb();
    const store = await db.transaction(this.collectionName, "readwrite").store;
    for (const id of ids) {
      const documentInDb = await store.get(id);
      if (documentInDb && !documentInDb._deleted) {
        ret.set(id, documentInDb);
      }
    }

    return ret;
  }
  changeStream(): Observable<
    RxStorageChangeEvent<RxLocalDocumentData<{ [key: string]: any }>>
  > {
    return this.changes$.asObservable();
  }

  async close(): Promise<void> {
    this.closed = true;

    if (!IDB_DATABASE_STATE_BY_NAME.get(this.databaseName)) {
      // already closed.
      // different instance could already close db.
      return;
    }

    this.changes$.complete();
    const localState = this.getLocalState();
    const db = await localState.getDb();
    db.close();
    IDB_DATABASE_STATE_BY_NAME.delete(this.databaseName);
  }
  async remove(): Promise<void> {
    const localState = this.getLocalState();
    await localState.removeCollection();
    this.closed = true;
  }

  private getLocalState() {
    const localState = this.internals.databaseState;
    if (!localState) {
      throw new Error(
        `localState(keyVal storage) is undefind (dbName: ${this.databaseName})`
      );
    }

    return localState;
  }
}

export async function createBrowserKeyValueStorageLocalState(
  params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageSettings>
): Promise<BrowserStorageInternals> {
  const primaryPath = "_id";

  const databaseState = await createIdbDatabase(
    params.databaseName,
    params.collectionName,
    "_id",
    { indexes: [], version: 0 }
  );

  return {
    databaseState,
    changesCollectionName: getChangesCollName(params.collectionName),
    primaryPath,
  };
}

export const createBrowserKeyObjectStorageInstance = async <RxDocType>(
  _params: RxKeyObjectStorageInstanceCreationParams<BrowserStorageInternals>
) => {
  const params: typeof _params = {
    ..._params,
    databaseName: _params.databaseName + "-key-object",
  };

  const internals = await createBrowserKeyValueStorageLocalState(params);

  const instance = new RxBrowserKeyObjectStorageInstance<RxDocType>(
    params.databaseName,
    params.collectionName,
    {},
    internals
  );

  /**
   * TODO: should we do extra steps to enable CORRECT multiinstance?
   */

  return instance;
};
