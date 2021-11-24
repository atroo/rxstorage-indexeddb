import { MangoQuery, MangoQuerySelector } from "rxdb";

const combinationFields = ["$or", "$nor", "$not"];

export const translateMangoQuery = <RxDocType>(
  query: MangoQuery<RxDocType>
) => {
  if (query.selector) {
    query.selector = massageSelector(query.selector);
  }
  if (query.sort) {
    query.sort = massageSort(query.sort);
  }

  validateFindRequest(query);
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
