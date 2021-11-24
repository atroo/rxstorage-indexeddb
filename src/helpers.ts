import { openDB } from "idb";
import { RxJsonSchema } from "rxdb";

export const CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";

const IDB_DATABASE_STATE_BY_NAME: Map<string, Promise<any>> = new Map();

export const getIdbDatabase = async <RxDocType>(
  databaseName: string,
  collectionName: string,
  primaryPath: string,
  schema: RxJsonSchema<RxDocType>
) => {
  const db = await openDB(`${databaseName}.db`, schema.version, {
    upgrade(db) {
      const store = db.createObjectStore(collectionName, {
        keyPath: primaryPath,
      });

      /**
       * Construct loki indexes from RxJsonSchema indexes.
       * TODO what about compound indexes?
       */
      const indices: string[] = [];
      if (schema.indexes) {
        schema.indexes.forEach((idx) => {
          if (!Array.isArray(idx)) {
            indices.push(idx);
          }
        });
      }

      indices.forEach((idxName) => {
        store.createIndex(idxName, idxName);
      });

      const changesCollectionName = collectionName + CHANGES_COLLECTION_SUFFIX;
      const changesStore = db.createObjectStore(changesCollectionName, {
        keyPath: "eventId",
      });
      changesStore.createIndex("sequence", "sequence");
    },
  });

  return {
    database: db,
    collections: {},
  };
};
