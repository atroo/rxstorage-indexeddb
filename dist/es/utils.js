"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateIndexValues = exports.isIndexValid = exports.getEventKey = void 0;

var getEventKey = function getEventKey(isLocal, primary, revision) {
  var prefix = isLocal ? "local" : "non-local";
  var eventKey = prefix + "|" + primary + "|" + revision;
  return eventKey;
};
/**
 * let's assume for now that indexes like "hey[].ho" are invalid
 * @param {string} index
 * @returns {boolean}
 */


exports.getEventKey = getEventKey;

var isIndexValid = function isIndexValid(index) {
  return index.split(".").length === 1;
};
/**
 *
 * @param {string | string[]} index
 * @returns {boolean}
 */


exports.isIndexValid = isIndexValid;

var validateIndexValues = function validateIndexValues(index) {
  if (typeof index === "string") {
    return isIndexValid(index);
  }

  return index.every(function (part) {
    return isIndexValid(part);
  });
};

exports.validateIndexValues = validateIndexValues;
//# sourceMappingURL=utils.js.map