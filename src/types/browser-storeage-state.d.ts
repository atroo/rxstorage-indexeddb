import { DBSchema, IDBPDatabase } from "idb";

/**
 * @param {number} upgradeVersion Will increment every time new collection are added.
 *  Reason: new collections can be added only via "upgrade" callback.
 * @param {number} version Compound value from upgrade version and schema version.
 *  Can be used to detect migrations.
 */
export interface BrowserStorageState {
  getDb: (deleteCollections?: string[]) => Promise<IDBPDatabase<unknown>>;
  removeCollection: () => Promise<IDBPDatabase<unknown>>;
  db?: IDBPDatabase<unknown>;
  updateNeeded: boolean;
  newCollections: Array<{
    collectionName: string;
    indexes: Array<string | string[]>;
    primaryPath: string;
    version: number;
  }>;
  metaData: IMetaDB["dbMetaData"]["value"];
}

export interface IMetaDB extends DBSchema {
  dbMetaData: {
    key: string;
    value: {
      version: number;
      collections: Array<{ name: string; version: number }>;
      dbName: string;
    };
    indexes: {
      dbName: string;
    };
  };
  indexedCols: {
    key: string[];
    value: {
      dbName: string;
      name: string;
      value: string | string[];
      collection: string;
      primary?: boolean;
    };
    indexes: {
      dbNameCollection: string;
    };
  };
}

export type Index = IMetaDB["indexedCols"]["value"];
