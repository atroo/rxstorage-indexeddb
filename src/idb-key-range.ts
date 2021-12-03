import { EndKey, IIdbKeyRangeOptions, StartKey } from "./types/pouch-key-range";
import {
  COLLATE_LO as COUCH_COLLATE_LO,
  COLLATE_HI as COUCH_COLLATE_HI,
} from "./variables";

var IDB_NULL = Number.MIN_SAFE_INTEGER;
var IDB_FALSE = Number.MIN_SAFE_INTEGER + 1;
var IDB_TRUE = Number.MIN_SAFE_INTEGER + 2;

// From pouch indexeddb adapter

// Adapted from: https://www.w3.org/TR/IndexedDB/#compare-two-keys
// Importantly, *there is no upper bound possible* in idb. The ideal data
// structure an infintely deep array:
//   var IDB_COLLATE_HI = []; IDB_COLLATE_HI.push(IDB_COLLATE_HI)
// But IDBKeyRange is not a fan of shenanigans, so I've just gone with 12 layers
// because it looks nice and surely that's enough!
var IDB_COLLATE_LO = Number.NEGATIVE_INFINITY;
var IDB_COLLATE_HI = [[[[[[[[[[[[]]]]]]]]]]]];

// TODO: create type for opts
export const generateKeyRange = (opts: IIdbKeyRangeOptions) => {
  function defined(obj: any, k: string) {
    return obj[k] !== void 0;
  }

  // Converts a valid CouchDB key into a valid IndexedDB one
  function convert(keys: any, exact?: boolean) {
    return keys.map(function (k: any) {
      // null, true and false are not indexable by indexeddb. When we write
      // these values we convert them to these constants, and so when we
      // query for them we need to convert the query also.
      if (k === null && exact) {
        // for non-exact queries we treat null as a collate property
        // see `if (!exact)` block below
        return IDB_NULL;
      } else if (k === true) {
        return IDB_TRUE;
      } else if (k === false) {
        return IDB_FALSE;
      }

      if (!exact) {
        // We get passed CouchDB's collate low and high values, so for non-exact
        // ranged queries we're going to convert them to our IDB equivalents
        if (k === COUCH_COLLATE_LO) {
          return IDB_COLLATE_LO;
        } else if (k.hasOwnProperty(COUCH_COLLATE_HI)) {
          return IDB_COLLATE_HI;
        }
      }

      return k;
    });
  }

  // CouchDB and so PouchdB defaults to true. We need to make this explicit as
  // we invert these later for IndexedDB.
  if (!defined(opts, "inclusiveEnd")) {
    opts.inclusiveEnd = true;
  }
  if (!defined(opts, "inclusiveStart")) {
    opts.inclusiveStart = true;
  }

  if (opts.descending) {
    // Flip before generating. We'll check descending again later when performing
    // an index request
    var realEndkey = opts.startkey,
      realInclusiveEnd = opts.inclusiveStart;

    opts.startkey = opts.endkey;
    opts.endkey = realEndkey;
    opts.inclusiveStart = opts.inclusiveEnd;
    opts.inclusiveEnd = realInclusiveEnd;
  }

  try {
    if (defined(opts, "key")) {
      return IDBKeyRange.only(convert(opts.key, true));
    }

    if (defined(opts, "startkey") && !defined(opts, "endkey")) {
      return IDBKeyRange.lowerBound(
        convert(opts.startkey),
        !opts.inclusiveStart
      );
    }

    if (!defined(opts, "startkey") && defined(opts, "endkey")) {
      return IDBKeyRange.upperBound(convert(opts.endkey), !opts.inclusiveEnd);
    }

    if (defined(opts, "startkey") && defined(opts, "endkey")) {
      if (opts.startkey === opts.endkey) {
        return IDBKeyRange.only(convert(opts.startkey, true));
      }

      return IDBKeyRange.bound(
        convert(opts.startkey),
        convert(opts.endkey),
        !opts.inclusiveStart,
        !opts.inclusiveEnd
      );
    }

    return IDBKeyRange.only([0]);
  } catch (err) {
    console.error("Could not generate keyRange", err, opts);
    throw Error("Could not generate key range with " + JSON.stringify(opts));
  }
};
