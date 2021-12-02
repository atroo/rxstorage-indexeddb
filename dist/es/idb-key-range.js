"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateKeyRange = void 0;

var _variables = require("./variables");

var IDB_NULL = Number.MIN_SAFE_INTEGER;
var IDB_FALSE = Number.MIN_SAFE_INTEGER + 1;
var IDB_TRUE = Number.MIN_SAFE_INTEGER + 2; // From pouch indexeddb adapter
// Adapted from: https://www.w3.org/TR/IndexedDB/#compare-two-keys
// Importantly, *there is no upper bound possible* in idb. The ideal data
// structure an infintely deep array:
//   var IDB_COLLATE_HI = []; IDB_COLLATE_HI.push(IDB_COLLATE_HI)
// But IDBKeyRange is not a fan of shenanigans, so I've just gone with 12 layers
// because it looks nice and surely that's enough!

var IDB_COLLATE_LO = Number.NEGATIVE_INFINITY;
var IDB_COLLATE_HI = [[[[[[[[[[[[]]]]]]]]]]]]; // TODO: create type for opts

var generateKeyRange = function generateKeyRange(opts) {
  function defined(obj, k) {
    return obj[k] !== void 0;
  } // Converts a valid CouchDB key into a valid IndexedDB one


  function convert(key, exact) {
    // The first item in every native index is doc.deleted, and we always want
    // to only search documents that are not deleted.
    // "foo" -> [0, "foo"]
    // var filterDeleted = [0].concat(key);
    var filterDeleted = Array.isArray(key) ? key : [key];
    return filterDeleted.map(function (k) {
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
        if (k === _variables.COLLATE_LO) {
          return IDB_COLLATE_LO;
        } else if (k.hasOwnProperty(_variables.COLLATE_HI)) {
          return IDB_COLLATE_HI;
        }
      }

      return k;
    });
  } // CouchDB and so PouchdB defaults to true. We need to make this explicit as
  // we invert these later for IndexedDB.


  if (!defined(opts, "inclusive_end")) {
    opts.inclusive_end = true;
  }

  if (!defined(opts, "inclusive_start")) {
    opts.inclusive_start = true;
  }

  if (opts.descending) {
    // Flip before generating. We'll check descending again later when performing
    // an index request
    var realEndkey = opts.startkey,
        realInclusiveEnd = opts.inclusive_start;
    opts.startkey = opts.endkey;
    opts.endkey = realEndkey;
    opts.inclusive_start = opts.inclusive_end;
    opts.inclusive_end = realInclusiveEnd;
  }

  try {
    if (defined(opts, "key")) {
      return IDBKeyRange.only(convert(opts.key, true));
    }

    if (defined(opts, "startkey") && !defined(opts, "endkey")) {
      return IDBKeyRange.lowerBound(convert(opts.startkey), opts.inclusive_start);
    }

    if (!defined(opts, "startkey") && defined(opts, "endkey")) {
      return IDBKeyRange.upperBound(convert(opts.endkey), opts.inclusive_end);
    }

    if (defined(opts, "startkey") && defined(opts, "endkey")) {
      if (opts.startkey === opts.endkey) {
        return IDBKeyRange.only(convert(opts.startkey, true));
      }

      return IDBKeyRange.bound(convert(opts.startkey), convert(opts.endkey), !opts.inclusive_start, !opts.inclusive_end);
    }

    return IDBKeyRange.only([0]);
  } catch (err) {
    console.error("Could not generate keyRange", err, opts);
    throw Error("Could not generate key range with " + JSON.stringify(opts));
  }
};

exports.generateKeyRange = generateKeyRange;
//# sourceMappingURL=idb-key-range.js.map