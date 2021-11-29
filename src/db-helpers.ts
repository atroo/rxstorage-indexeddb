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

export const createIdbDatabase = <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: Pick<RxJsonSchema<RxDocType>, "indexes" | "version">,
  metaDb: IDBPDatabase<IMetaDB>
) => {
  console.log("DB NAME");
  const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  let version = schema.version + 1;
  let meta: BrowserStorageState["meta"] = [];
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
      // return dbState;
    }

    meta = meta.concat(dbState.meta);
  }

  const indexes: string[] = [];
  if (schema.indexes) {
    // TODO: compund indexes;
    schema.indexes.forEach((idx) => {
      if (!Array.isArray(idx)) {
        indexes.push(idx);
      }
    });
  }

  const changesCollectionName = getChangesCollName(collectionName);

  meta.push({
    collectionName,
    primaryPath,
    indexes,
  });

  /** should I created this only once or for every db?? */
  meta.push({
    collectionName: changesCollectionName,
    primaryPath: "eventId",
    indexes: ["sequence"],
  });

  // TODO: ADD IT ONlY ONCE
  meta.push({
    collectionName: getIndexesMetaCollName(collectionName),
    primaryPath: INDEXES_META_PRIMARY_KEY,
    indexes: ["keyPath"],
  });

  console.log("META!!!: ", meta);

  const newDbState: BrowserStorageState = {
    getDb: async () => {
      const dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
      console.log("REQ DATBASE: ", [...(dataBaseState?.meta as any)]);
      if (!dataBaseState) {
        throw new Error("dataBase state is undefined");
      }

      if (dataBaseState.db && !dataBaseState.meta.length) {
        console.log("ALREADY EXISTS: ", [...(dataBaseState?.meta as any)]);
        return dataBaseState.db;
      }

      if (dataBaseState.db) {
        dataBaseState.db.close();
      }

      // TODO: manage version change.
      const db = await openDB(`${databaseName}.db`, dataBaseState.version, {
        async upgrade(db) {
          const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
          const meta = dbState?.meta;
          console.log("META:", meta);
          if (!meta) {
            return;
          }
          console.log("storesData:", meta);
          for (const storeData of meta) {
            /**
             * Construct loki indexes from RxJsonSchema indexes.
             * TODO what about compound indexes?
             */
            const store = db.createObjectStore(storeData.collectionName, {
              keyPath: storeData.primaryPath,
            });

            storeData.indexes.forEach((idxName) => {
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

      IDB_DATABASE_STATE_BY_NAME.set(databaseName, { ...dataBaseState, db });
      db.addEventListener("versionchange", () => {
        console.log("versionchange fired");
      });

      const indexesStore = db.transaction(
        getIndexesMetaCollName(collectionName),
        "readwrite"
      ).store;

      /**
       * Store meta data about index
       * Use it later to understand what index to use to query data
       *
       */

      const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
      const meta = dbState?.meta;
      if (!meta) {
        return db;
      }

      for (const storeData of meta) {
        if (storeData.primaryPath === INDEXES_META_PRIMARY_KEY) {
          continue;
        }

        await indexesStore.put({
          [INDEXES_META_PRIMARY_KEY]: storeData.primaryPath,
          keyPath: storeData.primaryPath,
        });

        const indexes = storeData.indexes;
        for (const index of indexes) {
          await indexesStore.put({
            [INDEXES_META_PRIMARY_KEY]: index,
            keyPath: index,
          });
        }
      }

      // clear meta after transaction went successfully
      IDB_DATABASE_STATE_BY_NAME.set(databaseName, {
        ...dataBaseState,
        db,
        meta: [],
      });

      return db;
    },
    collections: dbState
      ? dbState.collections.concat(collectionName)
      : [collectionName],
    upgradeVersion: dbState ? dbState.upgradeVersion : 0,
    changesCollectionName,
    version,
    meta,
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
