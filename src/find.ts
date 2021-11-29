import { IDBPDatabase } from "idb";
import { MangoQuery } from "rxdb/dist/types/types";
import { translateMangoQuerySelector } from ".";
import { getIndexesMetaCollName, INDEXES_META_PRIMARY_KEY } from "./db-helpers";
import { generateKeyRange } from "./idb-key-range";
import { IIdbKeyRangeOptions, IIndex } from "./types/translate-mango-query";
const { filterInMemoryFields } = require("pouchdb-selector-core");

export const find = async <RxDocType>(
  db: IDBPDatabase<unknown>,
  collectionName: string,
  query: MangoQuery<RxDocType>
) => {
  const collName = getIndexesMetaCollName(collectionName);
  console.log("COLL NAME: ", collName);
  const indexesMetaStore = db.transaction(
    getIndexesMetaCollName(collectionName)
  ).store;

  const indexNameIndex = indexesMetaStore.index(INDEXES_META_PRIMARY_KEY);
  const indexesMeta: IIndex[] = [];
  let indexesMetaCursor = await indexNameIndex.openCursor();
  while (indexesMetaCursor) {
    indexesMeta.push(indexesMetaCursor.value);
    indexesMetaCursor = await indexesMetaCursor.continue();
  }

  console.log("indexesMeta:", indexesMeta);

  const translatedSelector = translateMangoQuerySelector(query);

  // TODO: use indexed field to generate opts
  const firstIndexedField = translatedSelector.fields[0]; // TODO: can be undefined?
  const opts: IIdbKeyRangeOptions = {
    startkey: translatedSelector.queryOpts.startkey
      ? translatedSelector.queryOpts.startkey[0]
      : undefined,
    endkey: translatedSelector.queryOpts.endkey
      ? translatedSelector.queryOpts.endkey[0]
      : undefined,
    inclusive_start: translatedSelector.queryOpts.inclusive_start,
    inclusive_end: translatedSelector.queryOpts.inclusive_end,
  };

  const keyRange = generateKeyRange(opts);

  const store = db.transaction(collectionName, "readwrite").store;
  const index = store.index(firstIndexedField);
  let cursor = await index.openCursor(keyRange);

  let rows = [];
  while (cursor) {
    const key = cursor.key;
    const value = cursor.value;
    rows.push(value);
    cursor = await cursor.continue();
  }

  // TODO: currently that there should be single indexed key.
  // And everything else should be in memory fields.
  if (translatedSelector.fields.length > 1) {
    const inMemoryFields = translatedSelector.fields.slice(1);
    rows = filterInMemoryFields(rows, query, inMemoryFields);
  }

  return rows;
};
