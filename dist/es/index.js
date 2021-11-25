"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rxBrowserStorage = require("./rx-browser-storage");

Object.keys(_rxBrowserStorage).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _rxBrowserStorage[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _rxBrowserStorage[key];
    }
  });
});

var _translateMangoQuery = require("./translate-mango-query");

Object.keys(_translateMangoQuery).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _translateMangoQuery[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _translateMangoQuery[key];
    }
  });
});
//# sourceMappingURL=index.js.map