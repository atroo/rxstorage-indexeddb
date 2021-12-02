"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generatePouchKeyRange = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _variables = require("./variables");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var extend = require("pouchdb-extend");

var combinationFields = ["$or", "$nor", "$not"];
var logicalMatchers = ["$eq", "$gt", "$gte", "$lt", "$lte"]; // TODO: types

var generatePouchKeyRange = function generatePouchKeyRange(query, indexes) {
  // TODO: don't mutate query
  if (query.selector) {
    query.selector = massageSelector(query.selector);
  }

  if (query.sort) {
    query.sort = massageSort(query.sort);
  }

  validateFindRequest(query);
  return transformMangoIntoPouchKeyRange(query.selector, indexes);
  /**
   * Based on "getMultiFieldQueryOpts" and "getSingleFieldCoreQueryPlan" pouch functions (pouch-find lib)
   * @param selector
   * @param indexes
   * @returns
   */

  function transformMangoIntoPouchKeyRange(selector, indexes) {
    var cloneSelector = Object.assign({}, selector);

    var _loop = function _loop(i) {
      var _combinedOpts;

      var index = indexes[i];
      var compound = index.value.length > 1;
      var memoMatcher = void 0;

      if (!compound) {
        memoMatcher = cloneSelector[index.name];

        if (Object.keys(memoMatcher).some(isNonLogicalMatcher)) {
          return "continue";
        }
      } else {
        index.value.forEach(function (part) {
          var matcher = cloneSelector[part];

          if (!matcher || Object.keys(matcher).some(isNonLogicalMatcher)) {
            return;
          }

          if (!memoMatcher) {
            memoMatcher = part;
            delete cloneSelector[part];
          } else {
            var usingGtlt = "$gt" in matcher || "$gte" in matcher || "$lt" in matcher || "$lte" in matcher;
            var previousKeys = Object.keys(memoMatcher);
            var previousWasEq = arrayEquals(previousKeys, ["$eq"]);
            var previousWasSame = arrayEquals(previousKeys, Object.keys(matcher));
            var gtltLostSpecificity = usingGtlt && !previousWasEq && !previousWasSame;

            if (!gtltLostSpecificity) {
              delete cloneSelector[part];
            }
          }
        });

        if (!memoMatcher) {
          return "continue";
        }
      }

      delete cloneSelector[index.name];
      userOperators = Object.keys(memoMatcher);
      var combinedOpts = null;

      for (j = 0; j < userOperators.length; j++) {
        userOperator = userOperators[j];
        userValue = memoMatcher[userOperator];
        newOpts = getMultiFieldCoreQueryPlan(userOperator, userValue);

        if (combinedOpts) {
          combinedOpts = mergeObjects([combinedOpts, newOpts]);
        } else {
          combinedOpts = newOpts;
        }
      }

      var startkey = "startkey" in combinedOpts ? (_combinedOpts = combinedOpts) === null || _combinedOpts === void 0 ? void 0 : _combinedOpts.startkey : _variables.COLLATE_LO;
      var endkey = "endkey" in combinedOpts ? combinedOpts.endkey : _variables.COLLATE_HI;
      var inclusiveStart = void 0;

      if ("inclusive_start" in combinedOpts) {
        inclusiveStart = combinedOpts.inclusive_start;
      }

      var inclusiveEnd = void 0;

      if ("inclusive_end" in combinedOpts) {
        inclusiveEnd = combinedOpts.inclusive_end;
      }

      return {
        v: {
          queryOpts: {
            startkey: startkey,
            endkey: endkey,
            inclusiveStart: inclusiveStart,
            inclusiveEnd: inclusiveEnd
          },
          inMemoryFields: Object.keys(cloneSelector),
          field: index.name
        }
      };
    };

    for (var i = 0; i < indexes.length; i += 1) {
      var userOperators;
      var j;
      var userOperator;
      var userValue;
      var newOpts;

      var _ret = _loop(i);

      if (_ret === "continue") continue;
      if (typeof _ret === "object") return _ret.v;
    }

    return {
      queryOpts: null,
      inMemoryFields: Object.keys(cloneSelector),
      field: null
    };
  }
};
/**
 * Snippets from pouchdb-find that allow to transform Mango query
 */


exports.generatePouchKeyRange = generatePouchKeyRange;

function massageSelector(input) {
  var result = _objectSpread({}, input);

  var wasAnded = false;

  if ("$and" in result) {
    result = mergeAndedSelectors(result["$and"]);
    wasAnded = true;
  }

  if ("$not" in result) {
    //This feels a little like forcing, but it will work for now,
    //I would like to come back to this and make the merging of selectors a little more generic
    result["$not"] = mergeAndedSelectors([result["$not"]]);
  }

  var fields = Object.keys(result);

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var matcher = result[field];

    if (typeof matcher !== "object" || matcher === null) {
      matcher = {
        $eq: matcher
      };
    } else if ("$ne" in matcher && !wasAnded) {
      // I put these in an array, since there may be more than one
      // but in the "mergeAnded" operation, I already take care of that
      matcher.$ne = [matcher.$ne];
    }

    result[field] = matcher;
  }

  return result;
}

function mergeAndedSelectors(selectors) {
  // sort to ensure that e.g. if the user specified
  // $and: [{$gt: 'a'}, {$gt: 'b'}], then it's collapsed into
  // just {$gt: 'b'}
  var res = {};
  selectors.forEach(function (selector) {
    Object.keys(selector).forEach(function (field) {
      var matcher = selector[field];

      if (typeof matcher !== "object") {
        matcher = {
          $eq: matcher
        };
      }

      if (isCombinationalField(field)) {
        if (matcher instanceof Array) {
          res[field] = matcher.map(function (m) {
            return mergeAndedSelectors([m]);
          });
        } else {
          res[field] = mergeAndedSelectors([matcher]);
        }
      } else {
        var fieldMatchers = res[field] = res[field] || {};
        Object.keys(matcher).forEach(function (operator) {
          var value = matcher[operator];

          if (operator === "$gt" || operator === "$gte") {
            return mergeGtGte(operator, value, fieldMatchers);
          } else if (operator === "$lt" || operator === "$lte") {
            return mergeLtLte(operator, value, fieldMatchers);
          } else if (operator === "$ne") {
            return mergeNe(value, fieldMatchers);
          } else if (operator === "$eq") {
            return mergeEq(value, fieldMatchers);
          }

          fieldMatchers[operator] = value;
        });
      }
    });
  });
  return res;
}

function isCombinationalField(field) {
  return combinationFields.indexOf(field) > -1;
} // normalize the "sort" value


function massageSort(sort) {
  if (!Array.isArray(sort)) {
    throw new Error("invalid sort json - should be an array");
  }

  return sort.map(function (sorting) {
    if (typeof sorting === "string") {
      var _obj;

      var obj = (_obj = {}, _obj[sorting] = "asc", _obj);
      return obj;
    } else {
      return sorting;
    }
  });
}

function validateFindRequest(requestDef) {
  if (typeof requestDef.selector !== "object") {
    throw new Error("you must provide a selector when you find()");
  }
  /*var selectors = requestDef.selector['$and'] || [requestDef.selector];
  for (var i = 0; i < selectors.length; i++) {
    var selector = selectors[i];
    var keys = Object.keys(selector);
    if (keys.length === 0) {
      throw new Error('invalid empty selector');
    }
    //var selection = selector[keys[0]];
    /*if (Object.keys(selection).length !== 1) {
      throw new Error('invalid selector: ' + JSON.stringify(selection) +
        ' - it must have exactly one key/value');
    }
  }*/

} // collapse logically equivalent gt/gte values


function mergeGtGte(operator, value, fieldMatchers) {
  if (typeof fieldMatchers.$eq !== "undefined") {
    return; // do nothing
  }

  if (typeof fieldMatchers.$gte !== "undefined") {
    if (operator === "$gte") {
      if (value > fieldMatchers.$gte) {
        // more specificity
        fieldMatchers.$gte = value;
      }
    } else {
      // operator === '$gt'
      if (value >= fieldMatchers.$gte) {
        // more specificity
        delete fieldMatchers.$gte;
        fieldMatchers.$gt = value;
      }
    }
  } else if (typeof fieldMatchers.$gt !== "undefined") {
    if (operator === "$gte") {
      if (value > fieldMatchers.$gt) {
        // more specificity
        delete fieldMatchers.$gt;
        fieldMatchers.$gte = value;
      }
    } else {
      // operator === '$gt'
      if (value > fieldMatchers.$gt) {
        // more specificity
        fieldMatchers.$gt = value;
      }
    }
  } else {
    fieldMatchers[operator] = value;
  }
} // collapse logically equivalent lt/lte values


function mergeLtLte(operator, value, fieldMatchers) {
  if (typeof fieldMatchers.$eq !== "undefined") {
    return; // do nothing
  }

  if (typeof fieldMatchers.$lte !== "undefined") {
    if (operator === "$lte") {
      if (value < fieldMatchers.$lte) {
        // more specificity
        fieldMatchers.$lte = value;
      }
    } else {
      // operator === '$gt'
      if (value <= fieldMatchers.$lte) {
        // more specificity
        delete fieldMatchers.$lte;
        fieldMatchers.$lt = value;
      }
    }
  } else if (typeof fieldMatchers.$lt !== "undefined") {
    if (operator === "$lte") {
      if (value < fieldMatchers.$lt) {
        // more specificity
        delete fieldMatchers.$lt;
        fieldMatchers.$lte = value;
      }
    } else {
      // operator === '$gt'
      if (value < fieldMatchers.$lt) {
        // more specificity
        fieldMatchers.$lt = value;
      }
    }
  } else {
    fieldMatchers[operator] = value;
  }
} // combine $ne values into one array


function mergeNe(value, fieldMatchers) {
  if ("$ne" in fieldMatchers) {
    // there are many things this could "not" be
    fieldMatchers.$ne.push(value);
  } else {
    // doesn't exist yet
    fieldMatchers.$ne = [value];
  }
} // add $eq into the mix


function mergeEq(value, fieldMatchers) {
  // these all have less specificity than the $eq
  // TODO: check for user errors here
  delete fieldMatchers.$gt;
  delete fieldMatchers.$gte;
  delete fieldMatchers.$lt;
  delete fieldMatchers.$lte;
  delete fieldMatchers.$ne;
  fieldMatchers.$eq = value;
}

function getSingleFieldQueryOptsFor(userOperator, userValue) {
  switch (userOperator) {
    case "$eq":
      return {
        key: [userValue]
      };

    case "$lte":
      return {
        endkey: [userValue]
      };

    case "$gte":
      return {
        startkey: [userValue]
      };

    case "$lt":
      return {
        endkey: [userValue],
        inclusive_end: false
      };

    case "$gt":
      return {
        startkey: [userValue],
        inclusive_start: false
      };
  }
}

function getMultiFieldCoreQueryPlan(userOperator, userValue) {
  switch (userOperator) {
    case "$eq":
      return {
        startkey: userValue,
        endkey: userValue
      };

    case "$lte":
      return {
        endkey: userValue
      };

    case "$gte":
      return {
        startkey: userValue
      };

    case "$lt":
      return {
        endkey: userValue,
        inclusive_end: false
      };

    case "$gt":
      return {
        startkey: userValue,
        inclusive_start: false
      };
  }
}

function isNonLogicalMatcher(matcher) {
  return logicalMatchers.indexOf(matcher) === -1;
}

function arrayEquals(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (var i = 0, len = arr1.length; i < len; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

function mergeObjects(arr) {
  var res = {};

  for (var i = 0, len = arr.length; i < len; i++) {
    res = extend(true, res, arr[i]);
  }

  return res;
}
//# sourceMappingURL=pouch-key-range.js.map