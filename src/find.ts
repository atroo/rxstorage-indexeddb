import { IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
import { translateMangoQuerySelector } from ".";
import { getDbMeta } from "./db-meta-helpers";
import { generateKeyRange } from "./idb-key-range";
const { filterInMemoryFields } = require("pouchdb-selector-core");

export const find = async <RxDocType>(
  db: IDBPDatabase<unknown>,
  collectionName: string,
  query: MangoQuery<RxDocType>
) => {
  const metaDB = await getDbMeta();
  const indexedCols = await metaDB.getAllFromIndex(
    "indexedCols",
    "dbNameCollection",
    IDBKeyRange.bound([db.name, collectionName], [db.name, collectionName])
  );
  const translatedSelector = translateMangoQuerySelector(query, indexedCols);

  let rows;
  if (translatedSelector.field && translatedSelector.queryOpts) {
    const keyRange = generateKeyRange(translatedSelector.queryOpts);
    rows = await db.getAllFromIndex(
      collectionName,
      translatedSelector.field,
      keyRange
    );
  } else {
    rows = await db.getAll(collectionName);
  }

  if (translatedSelector.inMemoryFields.length) {
    rows = filterInMemoryFields(
      rows.map((row) => {
        // make data compatible with filterInMemoryFields
        // TODO: copy and change this util
        return { doc: row };
      }),
      query,
      translatedSelector.inMemoryFields
    );
  }

  return rows;
};
