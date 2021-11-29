import { IDBPDatabase, openDB } from "idb";
import { overwritable, RxJsonSchema } from "rxdb";
import {
  CompositePrimaryKey,
  PrimaryKey,
  RxErrorKey,
  RxErrorParameters,
} from "rxdb/dist/types/types";
import { BrowserStorageState } from "./types/browser-storeage-state";
import { RxError } from "./rx-error";

export const CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";

export const IDB_DATABASE_STATE_BY_NAME: Map<string, BrowserStorageState> =
  new Map();

/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 */

// poc
const storesData: any[] = [];
let openedDb: IDBPDatabase<unknown>;

export const getIdbDatabase = async <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: Pick<RxJsonSchema<RxDocType>, "indexes" | "version">
) => {
  console.log("DB NAME");
  const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  let version = schema.version + 1;
  if (dbState) {
    const newCollectionAdded =
      dbState.collections.indexOf(collectionName) === -1;
    if (newCollectionAdded) {
      dbState.upgradeVersion += 1;
    }

    version += dbState.upgradeVersion;

    if (dbState.version === version) {
      /**
       * nothing has changed. no need to create new connection
       */
      return dbState;
    } else {
      console.log("db name: ", databaseName);
      console.log("col name: ", collectionName);
      console.log("primary path: ", primaryPath);
      console.log("schema: ", schema);
      console.log("---------------------");
      // dbState.db.close();
    }
  }

  const indexes: string[] = [];
  if (schema.indexes) {
    schema.indexes.forEach((idx) => {
      if (!Array.isArray(idx)) {
        indexes.push(idx);
      }
    });
  }

  const changesCollectionName = collectionName + CHANGES_COLLECTION_SUFFIX;

  storesData.push({
    collectionName,
    primaryPath,
    indexes,
  });

  /** should I created this only once or for every db?? */
  storesData.push({
    collectionName: changesCollectionName,
    primaryPath: "eventId",
    indexes: ["sequence"],
  });

  const newDbState: BrowserStorageState = {
    getDb: async () => {
      if (openedDb) {
        return openedDb;
      }

      const db = await openDB(`${databaseName}.db`, 1, {
        upgrade(db) {
          console.log("storesData:", storesData);
          for (const storeData of storesData) {
            /**
             * Construct loki indexes from RxJsonSchema indexes.
             * TODO what about compound indexes?
             */
            const store = db.createObjectStore(storeData.collectionName, {
              keyPath: storeData.primaryPath,
            });

            storeData.indexes.forEach((idxName: string) => {
              store.createIndex(idxName, idxName);
            });
          }

          // const store = db.createObjectStore(collectionName, {
          //   keyPath: primaryPath,
          // });

          // const indices: string[] = [];
          // if (schema.indexes) {
          //   schema.indexes.forEach((idx) => {
          //     if (!Array.isArray(idx)) {
          //       indices.push(idx);
          //     }
          //   });
          // }

          // indices.forEach((idxName) => {
          //   store.createIndex(idxName, idxName);
          // });

          // const changesStore = db.createObjectStore(changesCollectionName, {
          //   keyPath: "eventId",
          // });
          // changesStore.createIndex("sequence", "sequence");
        },
        blocked() {
          alert("Please close all other tabs with this site open!");
        },
        blocking() {
          // Make sure to add a handler to be notified if another page requests a version
          // change. We must close the database. This allows the other page to upgrade the database.
          // If you don't do this then the upgrade won't happen until the user closes the tab.
          //
          db.close();
          alert(
            "A new version of this page is ready. Please reload or close this tab!"
          );
        },
        terminated() {},
      });

      openedDb = db;

      return openedDb;
    },
    collections: dbState
      ? dbState.collections.concat(collectionName)
      : [collectionName],
    upgradeVersion: dbState ? dbState.upgradeVersion : 0,
    changesCollectionName,
    version,
  };

  IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);

  return newDbState;
};

export function getPrimaryFieldOfPrimaryKey<RxDocType>(
  primaryKey: PrimaryKey<RxDocType>
): keyof RxDocType {
  if (typeof primaryKey === "string") {
    return primaryKey as any;
  } else {
    return (primaryKey as CompositePrimaryKey<RxDocType>).key;
  }
}

export function newRxError(
  code: RxErrorKey,
  parameters?: RxErrorParameters
): RxError {
  return new RxError(code, overwritable.tunnelErrorMessage(code), parameters);
}
