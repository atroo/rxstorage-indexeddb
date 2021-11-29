import { IDBPDatabase, openDB } from "idb";
import { overwritable, RxJsonSchema } from "rxdb";
import {
  CompositePrimaryKey,
  PrimaryKey,
  RxErrorKey,
  RxErrorParameters,
} from "rxdb/dist/types/types";
import { BrowserStorageState, IMetaDB } from "./types/browser-storeage-state";
import { RxError } from "./rx-error";
import { getDbMeta } from "./db-meta-helpers";
import { metadata } from "core-js/fn/reflect";

export const CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";
export const INDEXES_META_COLLECTION_SUFFIX = "-idb-meta";
export const INDEXES_META_PRIMARY_KEY = "indexNameIdbMeta";

export const IDB_DATABASE_STATE_BY_NAME: Map<string, BrowserStorageState> =
  new Map();

export const getChangesCollName = (collName: string) => {
  return collName + CHANGES_COLLECTION_SUFFIX;
};

export const getIndexesMetaCollName = (collName: string) => {
  return collName + INDEXES_META_COLLECTION_SUFFIX;
};

/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 */

let getDbPromise: Promise<IDBPDatabase<unknown>>;

export const createIdbDatabase = async <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: Pick<RxJsonSchema<RxDocType>, "indexes" | "version">
) => {
  await getDbPromise;
  console.log("DB NAME");

  const metaDB = await getDbMeta();
  let metaData: BrowserStorageState["metaData"];
  const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  if (dbState?.metaData) {
    metaData = dbState.metaData;
  } else {
    const reqMetaData = await metaDB.getFromIndex(
      "dbMetaData",
      "dbName",
      databaseName
    );
    if (reqMetaData) {
      metaData = reqMetaData;
      console.log("reqMetaData:", reqMetaData);
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
    // TODO: compund indexes;
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

    // TODO: create one changes collection per database ?
    newCollections.push({
      collectionName: changesCollectionName,
      primaryPath: "eventId",
      indexes: ["sequence"],
    });

    console.log("NEW COLLECTIONS!!!: ", newCollections);

    metaData = {
      ...metaData,
      collections: metaData.collections.concat(
        newCollections.map((coll) => {
          return coll.collectionName;
        })
      ),
    };
  }

  const newDbState: BrowserStorageState = {
    getDb: async () => {
      getDbPromise = new Promise(async (resolve) => {
        const dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
        console.log("REQ DATBASE: ", [
          ...(dataBaseState?.newCollections as any),
        ]);
        if (!dataBaseState) {
          throw new Error("dataBase state is undefined");
        }

        if (!dataBaseState.updateNeeded && dataBaseState.db) {
          console.log("ALREADY EXISTS: ", [
            ...(dataBaseState?.newCollections as any),
          ]);
          resolve(dataBaseState.db);
        }

        const metaData = dataBaseState.metaData;
        if (dataBaseState.updateNeeded) {
          metaData.version += 1;
        }

        // TODO: manage version change.
        const db = await openDB(`${databaseName}.db`, metaData.version, {
          async upgrade(db) {
            const newCollections = dataBaseState.newCollections;
            console.log("NEW COLLECTIONS:", newCollections);
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

              collectionData.indexes.forEach((idxName) => {
                // FIXME
                store.createIndex(idxName as string, idxName);
              });
            }
          },
          blocked() {
            // alert("Please close all other tabs with this site open!");
          },
          blocking() {
            // Make sure to add a handler to be notified if another page requests a version
            // change. We must close the database. This allows the other page to upgrade the database.
            // If you don't do this then the upgrade won't happen until the user closes the tab.
            //
            db.close();
            // alert(
            //   "A new version of this page is ready. Please reload or close this tab!"
            // );
          },
          terminated() {},
        });

        db.addEventListener("versionchange", () => {
          console.log("versionchange fired");
        });

        // const indexesStore = db.transaction(
        //   getIndexesMetaCollName(collectionName),
        //   "readwrite"
        // ).store;

        /**
         * Store meta data about index
         * Use it later to understand what index to use to query data
         *
         */

        // const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
        // const meta = dbState?.meta;
        // if (!meta) {
        //   return db;
        // }

        // for (const storeData of meta) {
        //   if (storeData.primaryPath === INDEXES_META_PRIMARY_KEY) {
        //     continue;
        //   }

        //   await indexesStore.put({
        //     [INDEXES_META_PRIMARY_KEY]: storeData.primaryPath,
        //     keyPath: storeData.primaryPath,
        //   });

        //   const indexes = storeData.indexes;
        //   for (const index of indexes) {
        //     await indexesStore.put({
        //       [INDEXES_META_PRIMARY_KEY]: index,
        //       keyPath: index,
        //     });
        //   }
        // }

        // clear meta after transaction went successfully
        IDB_DATABASE_STATE_BY_NAME.set(databaseName, {
          ...dataBaseState,
          db,
          newCollections: [],
          metaData,
        });

        await metaDB.put("dbMetaData", metaData);

        resolve(db);
      });

      return getDbPromise;
    },
    changesCollectionName,
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
