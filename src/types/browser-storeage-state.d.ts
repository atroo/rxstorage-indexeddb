import { DBSchema, IDBPDatabase } from "idb";

/**
 * @param {number} upgradeVersion Will increment every time new collection are added.
 *  Reason: new collections can be added only via "upgrade" callback.
 * @param {number} version Compound value from upgrade version and schema version.
 *  Can be used to detect migrations.
 */
export interface BrowserStorageState {
  getDb: () => Promise<IDBPDatabase<unknown>>;
  removeDb: () => Promise<IDBPDatabase<unknown>>;
  _db: IDBPDatabase<unknown> | undefined;
}

export interface IMetaDB extends DBSchema {
  dbMetaData: {
    key: string;
    value: {
      version: number;
      collections: Array<{ name: string; version: number }>;
      dbName: string;
    };
  };
  indexedCols: {
    key: string[];
    value: {
      dbName: string;
      collection: string;
      indexes: Array<{
        name: string;
        value: string | string[];
        primary?: boolean;
      }>;
    };
  };
}

export type Index = IMetaDB["indexedCols"]["value"]["indexes"][0];
