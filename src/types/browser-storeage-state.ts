import { IDBPDatabase } from "idb";

/**
 * @param {number} upgradeVersion Will increment every time new collection are added.
 *  Reason: new collections can be added only via "upgrade" callback.
 * @param {number} version Compound value from upgrade version and schema version.
 *  Can be used to detect migrations.
 */
export interface BrowserStorageState {
  db: IDBPDatabase<unknown>;
  collections: string[];
  upgradeVersion: number;
  version: number;
  changesCollectionName: string;
}
