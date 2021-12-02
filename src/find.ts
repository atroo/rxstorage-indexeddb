import { IDBPCursorWithValue, IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
import { getDbMeta } from "./db-meta-helpers";
import { generateKeyRange } from "./idb-key-range";
import { generatePouchKeyRange } from "./pouch-key-range";
const { filterInMemoryFields } = require("pouchdb-selector-core");

// TODO: types

export const find = async <RxDocType>(
  db: IDBPDatabase<unknown>,
  collectionName: string,
  query: MangoQuery<RxDocType>
) => {
  const metaDB = await getDbMeta();
  const indexedCols = await metaDB.getAll(
    "indexedCols",
    IDBKeyRange.bound([db.name, collectionName], [db.name, collectionName])
  );

  console.log("indexedCols", indexedCols);
  const translatedSelector = generatePouchKeyRange(query, indexedCols);

  const store = db.transaction(collectionName).store;
  let cursor: IDBPCursorWithValue<
    unknown,
    ArrayLike<any>,
    string,
    unknown,
    "readonly"
  > | null;
  if (translatedSelector.field && translatedSelector.queryOpts) {
    const keyRange = generateKeyRange(translatedSelector.queryOpts);
    const index = store.index(translatedSelector.field);
    cursor = await index.openCursor(keyRange);
  } else {
    cursor = await store.openCursor();
  }

  let rows = await getRows(cursor);

  /**
   * Filter in Memory Fields will take care of sort, limit and skip.
   * TODO: if there's indexed field, then use IDBKeyRange to sort data.
   */

  rows = filterInMemoryFields(
    rows.map((row) => {
      // make data compatible with filterInMemoryFields
      // TODO: fork "pouchdb-selector-core" and adapt lib for our uses case.
      return { doc: row };
    }),
    query,
    translatedSelector.inMemoryFields
  );
  return rows.map((row) => {
    return row.doc;
  });
};

const getRows = async (
  cursor: IDBPCursorWithValue | null,
  limit = Infinity
) => {
  const rows = [];
  let i = 0;
  while (cursor && i < limit) {
    rows.push(cursor.value);
    i += 1;
    cursor = await cursor.continue();
  }

  return rows;
};
