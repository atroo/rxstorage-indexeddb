"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEventKey = void 0;

var getEventKey = function getEventKey(isLocal, primary, revision) {
  var prefix = isLocal ? "local" : "non-local";
  var eventKey = prefix + "|" + primary + "|" + revision;
  return eventKey;
};

exports.getEventKey = getEventKey;
//# sourceMappingURL=utils.js.map