import { DBSchema, IDBPDatabase } from "idb";

/**
 * @param {number} upgradeVersion Will increment every time new collection are added.
 *  Reason: new collections can be added only via "upgrade" callback.
 * @param {number} version Compound value from upgrade version and schema version.
 *  Can be used to detect migrations.
 */
export interface BrowserStorageState {
  getDb: () => IDBPDatabase<unknown>;
  removeDb: () => Promise<void>;
  _db: IDBPDatabase<unknown> | undefined;
}

export interface IMetaDB extends DBSchema {
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
