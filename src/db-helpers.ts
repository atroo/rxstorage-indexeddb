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
import { getDbMeta } from "./db-meta-helpers";

export const CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";

export const IDB_DATABASE_STATE_BY_NAME: Map<string, BrowserStorageState> =
  new Map();

export const getChangesCollName = (collName: string) => {
  return collName + CHANGES_COLLECTION_SUFFIX;
};

export const genIndexName = (index: string | string[]) => {
  if (Array.isArray(index)) {
    return index.join(".");
  }

  return index;
};

/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 * TODO: handle properly primaryPath.
 */

let getDbPromise: Promise<IDBPDatabase<unknown>>;

export const createIdbDatabase = async <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: Pick<RxJsonSchema<RxDocType>, "indexes" | "version">
) => {
  // in order to avoid race conditions make user wait until
  // connection is established if somebody request db before
  await getDbPromise;

  const metaDB = await getDbMeta();
  let metaData: BrowserStorageState["metaData"];
  const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  if (dbState?.metaData) {
    metaData = dbState.metaData;
  } else {
    // Store "version" data in seperate db to properly handle indexeddb version update.
    const reqMetaData = await metaDB.getFromIndex(
      "dbMetaData",
      "dbName",
      databaseName
    );
    if (reqMetaData) {
      metaData = reqMetaData;
    } else {
      metaData = {
        version: 0,
        collections: [],
        dbName: databaseName,
      };
    }
  }

  let updateNeeded = metaData.collections.indexOf(collectionName) === -1;

  const indexes: string | string[] = [];
  if (schema.indexes) {
    schema.indexes.forEach((idx) => {
      if (!Array.isArray(idx)) {
        indexes.push(idx);
      }
    });
  }

  const newCollections: BrowserStorageState["newCollections"] = [];
  const changesCollectionName = getChangesCollName(collectionName);

  if (updateNeeded) {
    newCollections.push({
      collectionName,
      primaryPath,
      indexes,
    });

    newCollections.push({
      collectionName: changesCollectionName,
      primaryPath: "eventId",
      indexes: ["sequence"],
    });
  }

  const newDbState: BrowserStorageState = {
    ...dbState,
    getDb: async () => {
      getDbPromise = new Promise(async (resolve) => {
        const dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
        if (!dataBaseState) {
          throw new Error("dataBase state is undefined");
        }

        if (!dataBaseState.updateNeeded && dataBaseState.db) {
          return resolve(dataBaseState.db);
        }

        const metaData = dataBaseState.metaData;
        if (dataBaseState.updateNeeded) {
          metaData.version += 1;
        }

        const newCollections = dataBaseState.newCollections;

        const db = await openDB(databaseName, metaData.version, {
          async upgrade(db) {
            if (!newCollections.length) {
              return;
            }
            for (const collectionData of newCollections) {
              /**
               * Construct loki indexes from RxJsonSchema indexes.
               * TODO what about compound indexes?
               */
              const store = db.createObjectStore(
                collectionData.collectionName,
                {
                  keyPath: collectionData.primaryPath,
                }
              );

              collectionData.indexes.forEach((index) => {
                store.createIndex(genIndexName(index), index);
              });
            }
          },
          blocking() {
            // Make sure to add a handler to be notified if another page requests a version
            // change. We must close the database. This allows the other page to upgrade the database.
            // If you don't do this then the upgrade won't happen until the user closes the tab.
            //
            db.close();
          },
          terminated() {},
        });

        /**
         * Store meta data about indexes
         * Use it later to understand what index to use to query data
         *
         */
        if (newCollections.length) {
          const indexedColsStore = metaDB.transaction(
            "indexedCols",
            "readwrite"
          ).store;

          for (const collData of newCollections) {
            const indexes = collData.indexes;
            indexes.forEach((index) => {
              indexedColsStore.put({
                dbName: databaseName,
                collection: collData.collectionName,
                name: genIndexName(index),
                value: index,
              });
            });
          }
        }

        // clear newCollections transaction went successfully
        const newDbState: BrowserStorageState = {
          ...dataBaseState,
          updateNeeded: false,
          db,
          newCollections: [],
          metaData: {
            ...dataBaseState.metaData,
            collections: metaData.collections.concat(
              newCollections.map((coll) => {
                return coll.collectionName;
              })
            ),
          },
        };

        await metaDB.put("dbMetaData", newDbState.metaData);
        IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);

        resolve(db);
      });

      return getDbPromise;
    },
    metaData,
    updateNeeded,
    newCollections: [
      ...(dbState ? dbState.newCollections : []),
      ...newCollections,
    ],
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
