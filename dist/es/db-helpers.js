"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDbName = exports.getDatabaseState = exports.getChangesCollName = exports.genIndexName = exports.createIdbDatabase = exports.IDB_DATABASE_STATE_BY_NAME = exports.CHANGES_COLLECTION_NAME = void 0;
exports.getPrimaryFieldOfPrimaryKey = getPrimaryFieldOfPrimaryKey;
exports.newRxError = newRxError;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var _rxdb = require("rxdb");

var _rxError = require("./rx-error");

var _dbMetaHelpers = require("./db-meta-helpers");

var _utils = require("./utils");

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var CHANGES_COLLECTION_NAME = "rxdb-changes";
exports.CHANGES_COLLECTION_NAME = CHANGES_COLLECTION_NAME;
var IDB_DATABASE_STATE_BY_NAME = new Map();
exports.IDB_DATABASE_STATE_BY_NAME = IDB_DATABASE_STATE_BY_NAME;

var getChangesCollName = function getChangesCollName() {
  return CHANGES_COLLECTION_NAME;
};

exports.getChangesCollName = getChangesCollName;

var genIndexName = function genIndexName(index) {
  if (Array.isArray(index)) {
    return index.join(".");
  }

  return index;
};

exports.genIndexName = genIndexName;

var getDbName = function getDbName(dbName, collectionName) {
  return dbName + "-" + collectionName;
};

exports.getDbName = getDbName;

var createIdbDatabase = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(settings) {
    var indexes, newCollections, dbName, db, metaDB, indexedColsStore, _i, _newCollections, collData, reqIndexesMeta, indexesMeta, state;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            indexes = [];

            if (settings.schema.indexes) {
              settings.schema.indexes.forEach(function (idx) {
                if (!(0, _utils.validateIndexValues)(idx)) {
                  return;
                }

                indexes.push(idx);
              });
            }

            newCollections = [{
              collectionName: settings.collectionName,
              primaryPath: settings.primaryPath,
              indexes: indexes
            }, {
              collectionName: CHANGES_COLLECTION_NAME,
              primaryPath: "eventId",
              indexes: ["sequence"]
            }];
            dbName = getDbName(settings.databaseName, settings.collectionName);
            _context.next = 6;
            return (0, _idb.openDB)(dbName, 1, {
              upgrade: function upgrade(db) {
                var _loop = function _loop() {
                  var collectionData = _step.value;
                  var store = db.createObjectStore(collectionData.collectionName, {
                    keyPath: collectionData.primaryPath
                  });
                  collectionData.indexes.forEach(function (index) {
                    store.createIndex(genIndexName(index), index);
                  });
                };

                for (var _iterator = _createForOfIteratorHelperLoose(newCollections), _step; !(_step = _iterator()).done;) {
                  _loop();
                }
              },
              blocking: function blocking() {
                var _settings$idbSettings, _settings$idbSettings2;

                // Make sure to add a handler to be notified if another page requests a version
                // change. We must close the database. This allows the other page to upgrade the database.
                // If you don't do this then the upgrade won't happen until the user closes the tab.
                //
                (_settings$idbSettings = (_settings$idbSettings2 = settings.idbSettings).blocking) === null || _settings$idbSettings === void 0 ? void 0 : _settings$idbSettings.call(_settings$idbSettings2);
                db.close();
              },
              terminated: function terminated() {}
            });

          case 6:
            db = _context.sent;
            _context.next = 9;
            return (0, _dbMetaHelpers.getDbMeta)();

          case 9:
            metaDB = _context.sent;
            indexedColsStore = metaDB.transaction("indexedCols", "readwrite").store;
            _i = 0, _newCollections = newCollections;

          case 12:
            if (!(_i < _newCollections.length)) {
              _context.next = 25;
              break;
            }

            collData = _newCollections[_i];
            _context.next = 16;
            return indexedColsStore.get([settings.databaseName, collData.collectionName]);

          case 16:
            reqIndexesMeta = _context.sent;

            if (!reqIndexesMeta) {
              _context.next = 19;
              break;
            }

            return _context.abrupt("continue", 22);

          case 19:
            indexesMeta = {
              dbName: settings.databaseName,
              collection: collData.collectionName,
              indexes: collData.indexes.map(function (index) {
                return {
                  name: genIndexName(index),
                  value: index
                };
              })
            }; // primary also can be counted as indexedData, but it should be handled differently.
            // use "primary to dect that it is actually "primary" field.

            indexesMeta.indexes.push({
              name: collData.primaryPath,
              value: collData.primaryPath,
              primary: true
            });
            indexedColsStore.put(indexesMeta);

          case 22:
            _i++;
            _context.next = 12;
            break;

          case 25:
            state = {
              _db: db,
              getDb: function getDb() {
                return db;
              },
              removeDb: function removeDb() {
                return (0, _idb.deleteDB)(dbName);
              }
            };
            IDB_DATABASE_STATE_BY_NAME.set(dbName, state);
            return _context.abrupt("return", state);

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function createIdbDatabase(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.createIdbDatabase = createIdbDatabase;

function getPrimaryFieldOfPrimaryKey(primaryKey) {
  if (typeof primaryKey === "string") {
    return primaryKey;
  } else {
    return primaryKey.key;
  }
}

function newRxError(code, parameters) {
  return new _rxError.RxError(code, _rxdb.overwritable.tunnelErrorMessage(code), parameters);
}

var getDatabaseState = function getDatabaseState(databaseName) {
  var dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);

  if (!dataBaseState) {
    throw new Error("dataBase state is undefined");
  }

  return dataBaseState;
};

exports.getDatabaseState = getDatabaseState;
//# sourceMappingURL=db-helpers.js.map