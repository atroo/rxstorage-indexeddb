import { MangoQuery, MangoQuerySelector, MangoQuerySortPart } from "rxdb";
import { ITranslatedQuery } from "./types/translate-mango-query";
import { COLLATE_HI, COLLATE_LO } from "./variables";
const extend = require("pouchdb-extend");
console.log("Extend: ", extend);

const combinationFields = ["$or", "$nor", "$not"];
type LogicalOperator = "$eq" | "$lte" | "$gte" | "$lt" | "$gt";
const logicalMatchers: LogicalOperator[] = [
  "$eq",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
];

export const translateMangoQuerySelector = <RxDocType>(
  query: MangoQuery<RxDocType>
): ITranslatedQuery => {
  if (query.selector) {
    query.selector = massageSelector(query.selector);
  }
  if (query.sort) {
    query.sort = massageSort(query.sort);
  }

  validateFindRequest(query);

  if (Object.keys(query.selector).length <= 1) {
    return getSingleFieldCoreQueryPlan(query.selector);
  }

  return getMultiFieldQueryOpts(query.selector);
};

/**
 * Snippets from pouchdb-find that allow to translate Mango query
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

function getSingleFieldQueryOptsFor(userOperator: string, userValue: any) {
  switch (userOperator) {
    case "$eq":
      return { key: [userValue] };
    case "$lte":
      return { endkey: [userValue] };
    case "$gte":
      return { startkey: [userValue] };
    case "$lt":
      return {
        endkey: [userValue],
        inclusive_end: false,
      };
    case "$gt":
      return {
        startkey: [userValue],
        inclusive_start: false,
      };
  }
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

function getSingleFieldCoreQueryPlan<RxDocType>(
  selector: MangoQuerySelector<RxDocType>
) {
  const fields = Object.keys(selector);
  const field = fields[0];
  //ignoring this because the test to exercise the branch is skipped at the moment
  /* istanbul ignore next */
  var matcher = selector[field] || {};
  var inMemoryFields: string[] = [];

  var userOperators = Object.keys(matcher) as LogicalOperator[];

  var combinedOpts: Record<any, any>;

  userOperators.forEach(function (userOperator) {
    if (isNonLogicalMatcher(userOperator)) {
      inMemoryFields.push(field);
    }

    var userValue = matcher[userOperator];

    var newQueryOpts = getSingleFieldQueryOptsFor(userOperator, userValue);

    if (combinedOpts) {
      combinedOpts = mergeObjects([combinedOpts, newQueryOpts]);
    } else {
      combinedOpts = newQueryOpts as Record<any, any>;
    }
  });

  return {
    queryOpts: combinedOpts!,
    inMemoryFields: inMemoryFields,
    fields,
  };
}

function getMultiFieldQueryOpts<RxDocType>(
  selector: MangoQuerySelector<RxDocType>
) {
  const fields = Object.keys(selector);

  let inMemoryFields: string[] = [];
  let startkey = [];
  let endkey = [];
  let inclusiveStart: boolean | undefined = undefined;
  let inclusiveEnd: boolean | undefined = undefined;

  function finish(i: number) {
    if (inclusiveStart !== false) {
      startkey.push(COLLATE_LO);
    }
    if (inclusiveEnd !== false) {
      endkey.push(COLLATE_HI);
    }
    // keep track of the fields where we lost specificity,
    // and therefore need to filter in-memory
    inMemoryFields = fields.slice(i);
  }

  for (var i = 0, len = fields.length; i < len; i++) {
    var indexField = fields[i];

    var matcher = selector[indexField];

    if (!matcher) {
      // fewer fields in user query than in index
      finish(i);
      break;
    } else if (i > 0) {
      if (
        (Object.keys(matcher) as LogicalOperator[]).some(isNonLogicalMatcher)
      ) {
        // non-logical are ignored
        finish(i);
        break;
      }
      var usingGtlt =
        "$gt" in matcher ||
        "$gte" in matcher ||
        "$lt" in matcher ||
        "$lte" in matcher;
      var previousKeys = Object.keys(selector[fields[i - 1]]);
      var previousWasEq = arrayEquals(previousKeys, ["$eq"]);
      var previousWasSame = arrayEquals(previousKeys, Object.keys(matcher));
      var gtltLostSpecificity = usingGtlt && !previousWasEq && !previousWasSame;
      if (gtltLostSpecificity) {
        finish(i);
        break;
      }
    }

    var userOperators = Object.keys(matcher);

    let combinedOpts: Record<any, any> | null = null;

    for (var j = 0; j < userOperators.length; j++) {
      var userOperator = userOperators[j];
      var userValue = matcher[userOperator];

      var newOpts = getMultiFieldCoreQueryPlan(userOperator, userValue);

      if (combinedOpts) {
        combinedOpts = mergeObjects([combinedOpts, newOpts]);
      } else {
        combinedOpts = newOpts as any;
      }
    }

    startkey.push(
      "startkey" in combinedOpts! ? combinedOpts?.startkey : COLLATE_LO
    );
    endkey.push("endkey" in combinedOpts! ? combinedOpts.endkey : COLLATE_HI);
    if ("inclusive_start" in combinedOpts!) {
      inclusiveStart = combinedOpts.inclusive_start;
    }
    if ("inclusive_end" in combinedOpts!) {
      inclusiveEnd = combinedOpts.inclusive_end;
    }
  }

  var res: any = {
    startkey: startkey,
    endkey: endkey,
  };

  if (typeof inclusiveStart !== "undefined") {
    res.inclusive_start = inclusiveStart;
  }
  if (typeof inclusiveEnd !== "undefined") {
    res.inclusive_end = inclusiveEnd;
  }

  return {
    queryOpts: res,
    inMemoryFields: inMemoryFields,
    fields: fields,
  };
}

function isNonLogicalMatcher(matcher: LogicalOperator) {
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
