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
import { IdbSettings } from "./types";

export const CHANGES_COLLECTION_NAME = "rxdb-changes";

export const IDB_DATABASE_STATE_BY_NAME: Map<string, BrowserStorageState> =
  new Map();

export const getChangesCollName = () => {
  return CHANGES_COLLECTION_NAME;
};

export const genIndexName = (index: string | string[]) => {
  if (Array.isArray(index)) {
    return index.join(".");
  }

  return index;
};

export const getDbName = (dbName: string, collectionName: string) => {
  return `${dbName}-${collectionName}`;
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

export const createIdbDatabase = async <RxDocType>(settings: {
  databaseName: string;
  collectionName: string;
  primaryPath: string;
  schema: Pick<RxJsonSchema<RxDocType>, "indexes" | "version">;
  idbSettings: IdbSettings;
}) => {
  const indexes: Array<string | string[]> = [];
  if (settings.schema.indexes) {
    settings.schema.indexes.forEach((idx) => {
      if (!validateIndexValues(idx)) {
        return;
      }

      indexes.push(idx as string | string[]);
    });
  }

  const newCollections = [
    {
      collectionName: settings.collectionName,
      primaryPath: settings.primaryPath,
      indexes,
    },
    {
      collectionName: CHANGES_COLLECTION_NAME,
      primaryPath: "eventId",
      indexes: ["sequence"],
    },
  ];

  const dbName = getDbName(settings.databaseName, settings.collectionName);

  const db = await openDB(dbName, 1, {
    upgrade(db) {
      for (const collectionData of newCollections) {
        const store = db.createObjectStore(collectionData.collectionName, {
          keyPath: collectionData.primaryPath,
        });

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
      settings.idbSettings.blocking?.();
      db.close();
    },
    terminated() {},
  });

  /**
   * Store meta data about indexes
   * Use it later to understand what index to use to query data
   *
   */
  const metaDB = await getDbMeta();
  const indexedColsStore = metaDB.transaction("indexedCols", "readwrite").store;

  for (const collData of newCollections) {
    const reqIndexesMeta = await indexedColsStore.get([
      settings.databaseName,
      collData.collectionName,
    ]);
    const indexesMeta: IMetaDB["indexedCols"]["value"] = reqIndexesMeta
      ? reqIndexesMeta
      : {
          dbName: settings.databaseName,
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

  const state: BrowserStorageState = {
    _db: db,
    getDb() {
      return db;
    },
    removeDb() {
      return deleteDB(dbName);
    },
  };

  IDB_DATABASE_STATE_BY_NAME.set(dbName, state);

  return state;
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
