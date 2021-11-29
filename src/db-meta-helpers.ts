import { IDBPDatabase, openDB } from "idb";
import { IMetaDB } from "./types/browser-storeage-state";

let openConnection: IDBPDatabase<IMetaDB>;

export const getDbMeta = async () => {
  if (openConnection) {
    return openConnection;
  }

  const db = await openDB<IMetaDB>("rx-browser-storage-meta", 1, {
    upgrade: (db) => {
      const versionChangeStore = db.createObjectStore("versionChange", {
        keyPath: "dbName",
      });

      versionChangeStore.createIndex("version", "version");

      const indexedColsMetaStore = db.createObjectStore("indexedCols", {
        keyPath: "collection",
      });

      indexedColsMetaStore.createIndex("name", "name");
      indexedColsMetaStore.createIndex("value", "value");
    },
  });

  openConnection = db;

  return openConnection;
};
