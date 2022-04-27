"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateKeyRange = void 0;

var _variables = require("./variables");

// From pouch indexeddb adapter
var COUCH_COLLATE_HI = "\uFFFF"; // actually used as {"\uffff": {}}

var IDB_NULL = Number.MIN_SAFE_INTEGER;
var IDB_FALSE = Number.MIN_SAFE_INTEGER + 1;
var IDB_TRUE = Number.MIN_SAFE_INTEGER + 2; // Adapted from: https://www.w3.org/TR/IndexedDB/#compare-two-keys
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
  } // CouchDB and so PouchdB defaults to true. We need to make this explicit as
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
    var start = convertKeys(opts.startkey, opts.compound);
    var end = convertKeys(opts.endkey, opts.compound);

    if (start === end) {
      return IDBKeyRange.only(start);
    }

    if (defined(opts, "startkey") && !defined(opts, "endkey")) {
      return IDBKeyRange.lowerBound(start, !opts.inclusiveStart);
    }

    if (!defined(opts, "startkey") && defined(opts, "endkey")) {
      return IDBKeyRange.upperBound(end, !opts.inclusiveEnd);
    }

    if (defined(opts, "startkey") && defined(opts, "endkey")) {
      return IDBKeyRange.bound(start, end, !opts.inclusiveStart, !opts.inclusiveEnd);
    }

    return IDBKeyRange.only([0]);
  } catch (err) {
    console.error("Could not generate keyRange", err, opts);
    throw Error("Could not generate key range with " + JSON.stringify(opts));
  }
};

exports.generateKeyRange = generateKeyRange;

function convertKey(k, exact) {
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
    } else if (typeof k === "object" && k.hasOwnProperty(COUCH_COLLATE_HI)) {
      return IDB_COLLATE_HI;
    }
  }

  return k;
} // Converts a valid CouchDB key into a valid IndexedDB one


function convertKeys(keys, compound) {
  if (!keys.length) {
    return keys;
  }

  if (keys.length === 1 && !compound) {
    return convertKey(keys[0]);
  }

  return keys.map(function (k) {
    return convertKey(k);
  });
}
//# sourceMappingURL=idb-key-range.js.map