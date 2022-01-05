"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _browserStorage = require("./browser-storage");

Object.keys(_browserStorage).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _browserStorage[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _browserStorage[key];
    }
  });
});

var _browserStoreageState = require("./browser-storeage-state");

Object.keys(_browserStoreageState).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _browserStoreageState[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _browserStoreageState[key];
    }
  });
});

var _pouchKeyRange = require("./pouch-key-range");

Object.keys(_pouchKeyRange).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _pouchKeyRange[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _pouchKeyRange[key];
    }
  });
});
//# sourceMappingURL=index.d.js.map