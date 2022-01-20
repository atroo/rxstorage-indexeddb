"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RxBrowserStorage = void 0;
exports.getRxSBrowserIdbStorage = getRxSBrowserIdbStorage;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _rxdb = require("rxdb");

var _dbHelpers = require("./db-helpers");

var _rxBrowserKeyObjectStorageInstance = require("./rx-browser-key-object-storage-instance");

var _rxBrowserStorageInstance = require("./rx-browser-storage-instance");

var _excluded = ["_attachments", "_deleted", "_rev"];

var _require = require("pouchdb-selector-core"),
    filterInMemoryFields = _require.filterInMemoryFields;

var RxBrowserStorageStatics = {
  hashKey: "md5",
  hash: function hash(data) {
    return Promise.resolve((0, _rxdb.hash)(data));
  },
  prepareQuery: function prepareQuery(schema, mutateableQuery) {
    return mutateableQuery;
  },
  getSortComparator: function getSortComparator(schema, query) {
    var _ref;

    // TODO if no sort is given, use sort by primary.
    // This should be done inside of RxDB and not in the storage implementations.
    var sortOptions = query.sort ? query.sort : [(_ref = {}, _ref[(0, _dbHelpers.getPrimaryFieldOfPrimaryKey)(schema.primaryKey)] = "asc", _ref)];

    var fun = function fun(a, b) {
      var compareResult = 0;
      sortOptions.forEach(function (sortPart) {
        var fieldName = Object.keys(sortPart)[0];
        var direction = Object.values(sortPart)[0];
        var directionMultiplier = direction === "asc" ? 1 : -1;
        var valueA = a[fieldName];
        var valueB = b[fieldName];

        if (valueA === valueB) {
          return;
        } else {
          if (valueA > valueB) {
            compareResult = 1 * directionMultiplier;
          } else {
            compareResult = -1 * directionMultiplier;
          }
        }
      });
      /**
       * Two different objects should never have the same sort position.
       * We ensure this by having the unique primaryKey in the sort params
       * at this.prepareQuery()
       */

      if (!compareResult) {
        throw (0, _dbHelpers.newRxError)("SNH", {
          args: {
            query: query,
            a: a,
            b: b
          }
        });
      }

      return compareResult;
    };

    return fun;
  },
  getQueryMatcher: function getQueryMatcher(schema, query) {
    var fun = function fun(doc) {
      var _attachments = doc._attachments,
          _deleted = doc._deleted,
          _rev = doc._rev,
          json = (0, _objectWithoutPropertiesLoose2["default"])(doc, _excluded);
      var inMemoryFields = Object.keys(json);
      return filterInMemoryFields([json], query, inMemoryFields).length > 0;
    };

    return fun;
  }
};

var RxBrowserStorage = /*#__PURE__*/function () {
  function RxBrowserStorage() {
    this.name = "atroo-browser-storage";
    this.statics = RxBrowserStorageStatics;
  }

  var _proto = RxBrowserStorage.prototype;

  _proto.createStorageInstance = /*#__PURE__*/function () {
    var _createStorageInstance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(params) {
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", (0, _rxBrowserStorageInstance.createBrowserStorageInstance)(params));

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function createStorageInstance(_x) {
      return _createStorageInstance.apply(this, arguments);
    }

    return createStorageInstance;
  }();

  _proto.createKeyObjectStorageInstance = /*#__PURE__*/function () {
    var _createKeyObjectStorageInstance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(params) {
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              params.collectionName = params.collectionName + "-key-object";
              return _context2.abrupt("return", (0, _rxBrowserKeyObjectStorageInstance.createBrowserKeyObjectStorageInstance)(params));

            case 2:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    function createKeyObjectStorageInstance(_x2) {
      return _createKeyObjectStorageInstance.apply(this, arguments);
    }

    return createKeyObjectStorageInstance;
  }();

  return RxBrowserStorage;
}();

exports.RxBrowserStorage = RxBrowserStorage;

function getRxSBrowserIdbStorage() {
  var databaseSettings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var storage = new RxBrowserStorage();
  return storage;
}
//# sourceMappingURL=rx-browser-storage.js.map