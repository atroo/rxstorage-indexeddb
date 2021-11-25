"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBrowserStorageLocalState = exports.createBrowserStorageInstance = exports.RxStorageBrowserInstance = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _rxjs = require("rxjs");

var _helpers = require("./helpers");

var instanceId = 1;

var RxStorageBrowserInstance = /*#__PURE__*/function () {
  //   public readonly primaryPath: keyof RxDocType;
  function RxStorageBrowserInstance(databaseName, collectionName, schema, internals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {// this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);

    this.changes$ = new _rxjs.Subject();
    this.instanceId = instanceId++;
    this.closed = false;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.schema = schema;
    this.internals = internals;
  }

  var _proto = RxStorageBrowserInstance.prototype;

  _proto.prepareQuery = function prepareQuery(mutateableQuery) {
    return mutateableQuery;
  };

  _proto.getSortComparator = function getSortComparator(query) {
    var _ref;

    // TODO if no sort is given, use sort by primary.
    // This should be done inside of RxDB and not in the storage implementations.
    var sortOptions = query.sort ? query.sort : [(_ref = {}, _ref[this.internals.primaryPath] = "asc", _ref)];

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
        throw (0, _helpers.newRxError)("SNH", {
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
  };

  _proto.getQueryMatcher = function getQueryMatcher(query) {
    var fun = function fun(doc) {// query.
    };

    return fun;
  };

  return RxStorageBrowserInstance;
}();

exports.RxStorageBrowserInstance = RxStorageBrowserInstance;

var createBrowserStorageLocalState = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(params) {
    var primaryPath, databaseState;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            primaryPath = (0, _helpers.getPrimaryFieldOfPrimaryKey)(params.schema.primaryKey).toString();
            _context.next = 3;
            return (0, _helpers.getIdbDatabase)(params.databaseName, params.collectionName, primaryPath, params.schema);

          case 3:
            databaseState = _context.sent;
            return _context.abrupt("return", {
              databaseState: databaseState,
              primaryPath: primaryPath
            });

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function createBrowserStorageLocalState(_x) {
    return _ref2.apply(this, arguments);
  };
}();

exports.createBrowserStorageLocalState = createBrowserStorageLocalState;

var createBrowserStorageInstance = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(params) {
    var internals, instance;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return createBrowserStorageLocalState(params);

          case 2:
            internals = _context2.sent;
            instance = new RxStorageBrowserInstance(params.databaseName, params.collectionName, params.schema, internals);
            /**
             * TODO: should we do extra steps to enable CORRECT multiinstance?
             */

            return _context2.abrupt("return", instance);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function createBrowserStorageInstance(_x2) {
    return _ref3.apply(this, arguments);
  };
}();

exports.createBrowserStorageInstance = createBrowserStorageInstance;
//# sourceMappingURL=rx-browser-storage-instance.js.map