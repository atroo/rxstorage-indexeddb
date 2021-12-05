import { deleteDB, IDBPDatabase, openDB } from "idb";
import { overwritable, RxJsonSchema } from "rxdb";
import {
  CompositePrimaryKey,
  PrimaryKey,
  RxErrorKey,
  RxErrorParameters,
} from "rxdb/dist/types/types";
import {
  BrowserStorageState,
  IMetaDB,
  Index,
} from "./types/browser-storeage-state";
import { RxError } from "./rx-error";
import { getDbMeta } from "./db-meta-helpers";
import { validateIndexValues } from "./utils";
import AsyncLock from "async-lock";

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

const lock = new AsyncLock();

/**
 * Can be called several times for the same db
 * Save all new collections data in map and run migration once db requessted (getDb)
 *
 * @param databaseName
 * @param collectionName
 * @param primaryPath
 * @param schema
 * @returns
 */

export const createIdbDatabase = async <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: Pick<RxJsonSchema<RxDocType>, "indexes" | "version">
) => {
  const metaDB = await getDbMeta();
  let metaData: BrowserStorageState["metaData"];
  const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  if (dbState?.metaData) {
    metaData = dbState.metaData;
  } else {
    // Store "version" data in seperate db to properly handle indexeddb version update.
    const reqMetaData = await metaDB.get("dbMetaData", databaseName);
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

  let updateNeeded = true;
  const foundCol = metaData.collections.find(
    (col) => col.name === collectionName
  );
  if (foundCol) {
    updateNeeded = false;
  }

  const indexes: Array<string | string[]> = [];
  if (schema.indexes) {
    schema.indexes.forEach((idx) => {
      if (!validateIndexValues(idx)) {
        return;
      }

      indexes.push(idx);
    });
  }

  const newCollections: BrowserStorageState["newCollections"] = [];
  const changesCollectionName = getChangesCollName(collectionName);

  if (updateNeeded) {
    newCollections.push({
      collectionName,
      primaryPath,
      indexes,
      version: schema.version,
    });

    newCollections.push({
      collectionName: changesCollectionName,
      primaryPath: "eventId",
      indexes: ["sequence"],
      version: 1,
    });
  }

  const newDbState: BrowserStorageState = {
    ...dbState,
    getDb: async (deleteCollections: string[] = []) => {
      // lock db request.
      // without lock somebody else can request database while idb update is still running.
      // this will lead to unexpected results
      return lock.acquire(databaseName, async () => {
        const dataBaseState = getDatabaseState(databaseName);

        const newCollections = dataBaseState.newCollections;
        const updateNeeded =
          newCollections.length > 0 || deleteCollections.length > 0;

        if (!updateNeeded && dataBaseState.db) {
          return dataBaseState.db;
        }

        const metaData = dataBaseState.metaData;
        if (updateNeeded) {
          metaData.version += 1;
        }

        const db = await openDB(databaseName, metaData.version, {
          upgrade(db) {
            for (const collectionData of newCollections) {
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

            for (const colName of deleteCollections) {
              db.deleteObjectStore(colName);
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
            const reqIndexesMeta = await indexedColsStore.get([
              databaseName,
              collData.collectionName,
            ]);
            const indexesMeta: IMetaDB["indexedCols"]["value"] = reqIndexesMeta
              ? reqIndexesMeta
              : {
                  dbName: databaseName,
                  collection: collData.collectionName,
                  indexes: [],
                };

            const indexes = collData.indexes;
            indexes.forEach((index) => {
              indexesMeta.indexes.push({
                name: genIndexName(index),
                value: index,
              });
            });
            // primary also can be counted as indexedData, but it should be handled differently.
            // use "primary to dect that it is actually "primary" field.
            indexesMeta.indexes.push({
              name: collData.primaryPath,
              value: collData.primaryPath,
              primary: true,
            });

            indexedColsStore.put(indexesMeta);
          }
        }

        let metaDataCollections = metaData.collections.concat(
          newCollections.map((coll) => {
            return { name: coll.collectionName, version: coll.version };
          })
        );

        /**
         * exclude deleted collections from meta.
         */
        if (deleteCollections) {
          metaDataCollections = metaDataCollections.filter((coll) => {
            return deleteCollections.indexOf(coll.name) === -1;
          });

          for (const colName of deleteCollections) {
            /**
             * also delete indexes meta along with store. they're not needed anymore
             * DO NOT do this via "upgrade" callback as upgrade transaction can be finish while
             * indexes meta being removed
             */
            await metaDB.delete("indexedCols", [databaseName, colName]);
          }
        }

        // transaction went successfully. clear "newCollections"
        const newDbState: BrowserStorageState = {
          ...dataBaseState,
          db,
          newCollections: [],
          metaData: {
            ...dataBaseState.metaData,
            collections: metaDataCollections,
          },
          locked: undefined,
        };

        await metaDB.put("dbMetaData", newDbState.metaData);
        IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);

        return db;
      });
    },
    removeCollection: async () => {
      const dataBaseState = getDatabaseState(databaseName);
      return dataBaseState.getDb([
        collectionName,
        getChangesCollName(collectionName),
      ]);
    },
    metaData,
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
): string {
  if (typeof primaryKey === "string") {
    return primaryKey;
  } else {
    return (primaryKey as CompositePrimaryKey<RxDocType>).key as string;
  }
}

export function newRxError(
  code: RxErrorKey,
  parameters?: RxErrorParameters
): RxError {
  return new RxError(code, overwritable.tunnelErrorMessage(code), parameters);
}

export const getDatabaseState = (databaseName: string) => {
  const dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  if (!dataBaseState) {
    throw new Error("dataBase state is undefined");
  }

  return dataBaseState;
};
