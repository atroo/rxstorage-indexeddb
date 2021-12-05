import { MangoQuery, MangoQuerySelector, MangoQuerySortPart } from "rxdb";
import { Index } from "./types/browser-storeage-state";
import { IPouchKeyRangeData, IQueryOpts } from "./types/pouch-key-range";
import { isIndexValid } from "./utils";
import { COLLATE_HI, COLLATE_LO } from "./variables";
const extend = require("pouchdb-extend");
const combinationFields = ["$or", "$nor", "$not"];
const logicalMatchers = ["$eq", "$gt", "$gte", "$lt", "$lte"];

// TODO: types

export const generatePouchKeyRange = <RxDocType>(
  query: MangoQuery<RxDocType>,
  indexes: Index[]
): IPouchKeyRangeData => {
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
  function transformMangoIntoPouchKeyRange<RxDocType>(
    selector: MangoQuerySelector<RxDocType>,
    indexes: Index[]
  ) {
    let queryOpts: IQueryOpts = {
      startkey: [],
      endkey: [],
    };
    selector = Object.assign({}, selector);

    for (let i = 0; i < indexes.length; i += 1) {
      const index = indexes[i];
      const compound = Array.isArray(index.value);
      let keyRangeOptsData: ReturnType<
        typeof keyRangeOptsFromIndex | typeof keyRangeOptsFromCompoundIndex
      >;
      if (compound) {
        keyRangeOptsData = keyRangeOptsFromCompoundIndex(selector, index);
      } else {
        keyRangeOptsData = keyRangeOptsFromIndex(selector, index);
      }

      if (!keyRangeOptsData) {
        continue;
      }

      selector = keyRangeOptsData.selector;
      queryOpts = keyRangeOptsData.queryOpts;

      return {
        queryOpts,
        inMemoryFields: Object.keys(selector),
        field: index.name,
        notIndexed: index.primary,
      };
    }

    // index field is was not found. use first valid field.
    const fields = Object.keys(selector);
    for (let i = 0; i < fields.length; i += 1) {
      const f = fields[i];
      if (!isIndexValid(f)) {
        // composite keys are invalid. skip
        continue;
      }

      const keyRangeOptsData = keyRangeOptsFromIndex(selector, {
        name: f,
        value: f,
      });

      if (!keyRangeOptsData) {
        continue;
      }

      console.log("KEY RANGE OPTS:", keyRangeOptsData);
      delete keyRangeOptsData.selector[f];
      return {
        queryOpts: keyRangeOptsData.queryOpts,
        inMemoryFields: Object.keys(keyRangeOptsData.selector),
        field: f,
        notIndexed: true,
      };
    }

    return {
      queryOpts: null,
      inMemoryFields: Object.keys(selector),
      field: null,
    };
  }
};

function keyRangeOptsFromIndex<RxDocType>(
  selector: MangoQuerySelector<RxDocType>,
  index: Index
) {
  const cloneSelector = Object.assign({}, selector);
  let queryOpts: IQueryOpts = {
    startkey: [],
    endkey: [],
  };

  const matcher = cloneSelector[index.name];
  if (!matcher) {
    return null;
  }

  if (Object.keys(matcher).some(isNonLogicalMatcher)) {
    return null;
  }

  delete cloneSelector[index.name];
  queryOpts = generateQueryOpts(matcher, queryOpts);

  return {
    queryOpts,
    selector: cloneSelector,
  };
}

function keyRangeOptsFromCompoundIndex<RxDocType>(
  selector: MangoQuerySelector<RxDocType>,
  index: Index
) {
  const cloneSelector = Object.assign({}, selector);
  let queryOpts: IQueryOpts = {
    startkey: [],
    endkey: [],
  };

  let matcher: Record<string, any> | null = null;

  for (const part of index.value) {
    const partMatcher: Record<string, any> | null = selector[part];
    if (!partMatcher || Object.keys(partMatcher).some(isNonLogicalMatcher)) {
      // wasn't able generate valid key range. go to next index.
      matcher = null;
      break;
    }

    matcher = partMatcher;

    // still add this field inMemoryFields
    // Reason: https://stackoverflow.com/questions/26196599/weird-behavior-of-idbkeyrange-with-a-compound-index
    // delete cloneSelector[part];

    queryOpts = generateQueryOpts(partMatcher, queryOpts);
  }

  if (!matcher) {
    return null;
  }

  return {
    selector: cloneSelector,
    queryOpts: { ...queryOpts, compound: true },
  };
}

function generateQueryOpts(
  matcher: Record<string, any>,
  queryOpts: IQueryOpts
): IQueryOpts {
  const userOperators = Object.keys(matcher);

  let combinedOpts: Record<any, any> | null = null;

  for (var j = 0; j < userOperators.length; j++) {
    var userOperator = userOperators[j];
    var userValue = matcher[userOperator];

    var newOpts = getMultiFieldCoreQueryPlan(userOperator, userValue);

    if (combinedOpts) {
      combinedOpts = mergeObjects([combinedOpts, newOpts]) as IQueryOpts;
    } else {
      combinedOpts = newOpts as IQueryOpts;
    }
  }

  const startkey =
    combinedOpts && "startkey" in combinedOpts
      ? combinedOpts.startkey
      : COLLATE_LO;
  const endkey =
    combinedOpts && "endkey" in combinedOpts ? combinedOpts.endkey : COLLATE_HI;

  let inclusiveStart;
  if (combinedOpts && "inclusive_start" in combinedOpts!) {
    inclusiveStart = combinedOpts.inclusive_start;
  }
  let inclusiveEnd;
  if (combinedOpts && "inclusive_end" in combinedOpts) {
    inclusiveEnd = combinedOpts.inclusive_end;
  }

  return {
    startkey: [...queryOpts.startkey, startkey],
    endkey: [...queryOpts.endkey, endkey],
    inclusiveStart:
      inclusiveStart !== undefined ? inclusiveStart : queryOpts.inclusiveStart,
    inclusiveEnd:
      inclusiveEnd !== undefined ? inclusiveEnd : queryOpts.inclusiveEnd,
  };
}

/**
 * Snippets from pouchdb-find that allow to transform Mango query
 */

function massageSelector<RxDocType>(input: MangoQuerySelector<RxDocType>) {
  let result = { ...input };
  let wasAnded = false;
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
      matcher = { $eq: matcher };
    } else if ("$ne" in matcher && !wasAnded) {
      // I put these in an array, since there may be more than one
      // but in the "mergeAnded" operation, I already take care of that
      matcher.$ne = [matcher.$ne];
    }
    result[field] = matcher;
  }

  return result;
}

function mergeAndedSelectors(selectors: any[]) {
  // sort to ensure that e.g. if the user specified
  // $and: [{$gt: 'a'}, {$gt: 'b'}], then it's collapsed into
  // just {$gt: 'b'}
  var res: Record<string, any> = {};

  selectors.forEach(function (selector) {
    Object.keys(selector).forEach(function (field) {
      var matcher = selector[field];
      if (typeof matcher !== "object") {
        matcher = { $eq: matcher };
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
        var fieldMatchers = (res[field] = res[field] || {});
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

function isCombinationalField(field: string) {
  return combinationFields.indexOf(field) > -1;
}

// normalize the "sort" value
function massageSort<RxDocType>(sort: MangoQuerySortPart<RxDocType>[]) {
  if (!Array.isArray(sort)) {
    throw new Error("invalid sort json - should be an array");
  }
  return sort.map(function (sorting) {
    if (typeof sorting === "string") {
      const obj = {
        [sorting as string]: "asc",
      } as MangoQuerySortPart<RxDocType>;
      return obj;
    } else {
      return sorting;
    }
  });
}

function validateFindRequest<RxDocType>(requestDef: MangoQuery<RxDocType>) {
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
}

// collapse logically equivalent gt/gte values
function mergeGtGte(
  operator: string,
  value: string | number,
  fieldMatchers: any
) {
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
}

// collapse logically equivalent lt/lte values
function mergeLtLte(
  operator: string,
  value: string | number,
  fieldMatchers: any
) {
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
}

// combine $ne values into one array
function mergeNe(value: string | number, fieldMatchers: any) {
  if ("$ne" in fieldMatchers) {
    // there are many things this could "not" be
    fieldMatchers.$ne.push(value);
  } else {
    // doesn't exist yet
    fieldMatchers.$ne = [value];
  }
}

// add $eq into the mix
function mergeEq(value: string | number, fieldMatchers: any) {
  // these all have less specificity than the $eq
  // TODO: check for user errors here
  delete fieldMatchers.$gt;
  delete fieldMatchers.$gte;
  delete fieldMatchers.$lt;
  delete fieldMatchers.$lte;
  delete fieldMatchers.$ne;
  fieldMatchers.$eq = value;
}

function getMultiFieldCoreQueryPlan(userOperator: string, userValue: any) {
  switch (userOperator) {
    case "$eq":
      return {
        startkey: userValue,
        endkey: userValue,
      };
    case "$lte":
      return {
        endkey: userValue,
      };
    case "$gte":
      return {
        startkey: userValue,
      };
    case "$lt":
      return {
        endkey: userValue,
        inclusive_end: false,
      };
    case "$gt":
      return {
        startkey: userValue,
        inclusive_start: false,
      };
  }
}

function isNonLogicalMatcher(matcher: string) {
  return logicalMatchers.indexOf(matcher) === -1;
}

function arrayEquals(arr1: any[], arr2: any[]) {
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

function mergeObjects(arr: any[]) {
  var res = {};
  for (var i = 0, len = arr.length; i < len; i++) {
    res = extend(true, res, arr[i]);
  }
  return res;
}
