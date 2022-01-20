"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDatabaseState = exports.getChangesCollName = exports.genIndexName = exports.createIdbDatabase = exports.IDB_DATABASE_STATE_BY_NAME = exports.CHANGES_COLLECTION_SUFFIX = void 0;
exports.getPrimaryFieldOfPrimaryKey = getPrimaryFieldOfPrimaryKey;
exports.newRxError = newRxError;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var _rxdb = require("rxdb");

var _rxError = require("./rx-error");

var _dbMetaHelpers = require("./db-meta-helpers");

var _utils = require("./utils");

var _asyncLock = _interopRequireDefault(require("async-lock"));

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";
exports.CHANGES_COLLECTION_SUFFIX = CHANGES_COLLECTION_SUFFIX;
var IDB_DATABASE_STATE_BY_NAME = new Map();
exports.IDB_DATABASE_STATE_BY_NAME = IDB_DATABASE_STATE_BY_NAME;

var getChangesCollName = function getChangesCollName(collName) {
  return collName + CHANGES_COLLECTION_SUFFIX;
};

exports.getChangesCollName = getChangesCollName;

var genIndexName = function genIndexName(index) {
  if (Array.isArray(index)) {
    return index.join(".");
  }

  return index;
};

exports.genIndexName = genIndexName;
var lock = new _asyncLock["default"]();
/**
 * Can be called several times for the same db
 * Save all new collections data in map and run migration once db requessted (getDb)
 *
 * @param databaseName
 * @param collectionName
 * @param primaryPath
 * @param schema
 * @returns
 */

var createIdbDatabase = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(settings) {
    var metaDB, metaData, dbState, reqMetaData, updateNeeded, foundCol, indexes, newCollections, changesCollectionName, newDbState;
    return _regenerator["default"].wrap(function _callee4$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return (0, _dbMetaHelpers.getDbMeta)();

          case 2:
            metaDB = _context5.sent;
            dbState = IDB_DATABASE_STATE_BY_NAME.get(settings.databaseName);

            if (!(dbState !== null && dbState !== void 0 && dbState.metaData)) {
              _context5.next = 8;
              break;
            }

            metaData = dbState.metaData;
            _context5.next = 12;
            break;

          case 8:
            _context5.next = 10;
            return metaDB.get("dbMetaData", settings.databaseName);

          case 10:
            reqMetaData = _context5.sent;

            if (reqMetaData) {
              metaData = reqMetaData;
            } else {
              metaData = {
                version: 0,
                collections: [],
                dbName: settings.databaseName
              };
            }

          case 12:
            updateNeeded = true;
            foundCol = metaData.collections.find(function (col) {
              return col.name === settings.collectionName;
            });

            if (foundCol) {
              updateNeeded = false;
            }

            indexes = [];

            if (settings.schema.indexes) {
              settings.schema.indexes.forEach(function (idx) {
                if (!(0, _utils.validateIndexValues)(idx)) {
                  return;
                }

                indexes.push(idx);
              });
            }

            newCollections = [];
            changesCollectionName = getChangesCollName(settings.collectionName);

            if (updateNeeded) {
              newCollections.push({
                collectionName: settings.collectionName,
                primaryPath: settings.primaryPath,
                indexes: indexes,
                version: settings.schema.version
              });
              newCollections.push({
                collectionName: changesCollectionName,
                primaryPath: "eventId",
                indexes: ["sequence"],
                version: 1
              });
            }

            newDbState = _objectSpread(_objectSpread({}, dbState), {}, {
              getDb: function () {
                var _getDb = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
                  var deleteCollections,
                      _args3 = arguments;
                  return _regenerator["default"].wrap(function _callee2$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          deleteCollections = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : [];
                          return _context3.abrupt("return", lock.acquire(settings.databaseName, /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                            var dataBaseState, newCollections, updateNeeded, metaData, db, indexedColsStore, _loop2, _iterator3, _step3, metaDataCollections, _iterator4, _step4, colName, newDbState;

                            return _regenerator["default"].wrap(function _callee$(_context2) {
                              while (1) {
                                switch (_context2.prev = _context2.next) {
                                  case 0:
                                    dataBaseState = getDatabaseState(settings.databaseName);
                                    newCollections = dataBaseState.newCollections;
                                    updateNeeded = newCollections.length > 0 || deleteCollections.length > 0;

                                    if (!(!updateNeeded && dataBaseState.db)) {
                                      _context2.next = 5;
                                      break;
                                    }

                                    return _context2.abrupt("return", dataBaseState.db);

                                  case 5:
                                    metaData = dataBaseState.metaData;

                                    if (updateNeeded) {
                                      metaData.version += 1;
                                    }

                                    _context2.next = 9;
                                    return (0, _idb.openDB)(settings.databaseName, metaData.version, {
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

                                        for (var _iterator2 = _createForOfIteratorHelperLoose(deleteCollections), _step2; !(_step2 = _iterator2()).done;) {
                                          var colName = _step2.value;
                                          db.deleteObjectStore(colName);
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

                                  case 9:
                                    db = _context2.sent;

                                    if (!newCollections.length) {
                                      _context2.next = 18;
                                      break;
                                    }

                                    indexedColsStore = metaDB.transaction("indexedCols", "readwrite").store;
                                    _loop2 = /*#__PURE__*/_regenerator["default"].mark(function _loop2() {
                                      var collData, reqIndexesMeta, indexesMeta, indexes;
                                      return _regenerator["default"].wrap(function _loop2$(_context) {
                                        while (1) {
                                          switch (_context.prev = _context.next) {
                                            case 0:
                                              collData = _step3.value;
                                              _context.next = 3;
                                              return indexedColsStore.get([settings.databaseName, collData.collectionName]);

                                            case 3:
                                              reqIndexesMeta = _context.sent;
                                              indexesMeta = reqIndexesMeta ? reqIndexesMeta : {
                                                dbName: settings.databaseName,
                                                collection: collData.collectionName,
                                                indexes: []
                                              };
                                              indexes = collData.indexes;
                                              indexes.forEach(function (index) {
                                                indexesMeta.indexes.push({
                                                  name: genIndexName(index),
                                                  value: index
                                                });
                                              }); // primary also can be counted as indexedData, but it should be handled differently.
                                              // use "primary to dect that it is actually "primary" field.

                                              // primary also can be counted as indexedData, but it should be handled differently.
                                              // use "primary to dect that it is actually "primary" field.
                                              indexesMeta.indexes.push({
                                                name: collData.primaryPath,
                                                value: collData.primaryPath,
                                                primary: true
                                              });
                                              indexedColsStore.put(indexesMeta);

                                            case 9:
                                            case "end":
                                              return _context.stop();
                                          }
                                        }
                                      }, _loop2);
                                    });
                                    _iterator3 = _createForOfIteratorHelperLoose(newCollections);

                                  case 14:
                                    if ((_step3 = _iterator3()).done) {
                                      _context2.next = 18;
                                      break;
                                    }

                                    return _context2.delegateYield(_loop2(), "t0", 16);

                                  case 16:
                                    _context2.next = 14;
                                    break;

                                  case 18:
                                    metaDataCollections = metaData.collections.concat(newCollections.map(function (coll) {
                                      return {
                                        name: coll.collectionName,
                                        version: coll.version
                                      };
                                    }));
                                    /**
                                     * exclude deleted collections from meta.
                                     */

                                    if (!deleteCollections) {
                                      _context2.next = 28;
                                      break;
                                    }

                                    metaDataCollections = metaDataCollections.filter(function (coll) {
                                      return deleteCollections.indexOf(coll.name) === -1;
                                    });
                                    _iterator4 = _createForOfIteratorHelperLoose(deleteCollections);

                                  case 22:
                                    if ((_step4 = _iterator4()).done) {
                                      _context2.next = 28;
                                      break;
                                    }

                                    colName = _step4.value;
                                    _context2.next = 26;
                                    return metaDB["delete"]("indexedCols", [settings.databaseName, colName]);

                                  case 26:
                                    _context2.next = 22;
                                    break;

                                  case 28:
                                    // transaction went successfully. clear "newCollections"
                                    newDbState = _objectSpread(_objectSpread({}, dataBaseState), {}, {
                                      db: db,
                                      newCollections: [],
                                      metaData: _objectSpread(_objectSpread({}, dataBaseState.metaData), {}, {
                                        collections: metaDataCollections
                                      }),
                                      locked: undefined
                                    });
                                    _context2.next = 31;
                                    return metaDB.put("dbMetaData", newDbState.metaData);

                                  case 31:
                                    IDB_DATABASE_STATE_BY_NAME.set(settings.databaseName, newDbState);
                                    return _context2.abrupt("return", db);

                                  case 33:
                                  case "end":
                                    return _context2.stop();
                                }
                              }
                            }, _callee);
                          }))));

                        case 2:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee2);
                }));

                function getDb() {
                  return _getDb.apply(this, arguments);
                }

                return getDb;
              }(),
              removeCollection: function () {
                var _removeCollection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
                  var dataBaseState;
                  return _regenerator["default"].wrap(function _callee3$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          dataBaseState = getDatabaseState(settings.databaseName);
                          return _context4.abrupt("return", dataBaseState.getDb([settings.collectionName, getChangesCollName(settings.collectionName)]));

                        case 2:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee3);
                }));

                function removeCollection() {
                  return _removeCollection.apply(this, arguments);
                }

                return removeCollection;
              }(),
              metaData: metaData,
              newCollections: [].concat(dbState ? dbState.newCollections : [], newCollections)
            });
            IDB_DATABASE_STATE_BY_NAME.set(settings.databaseName, newDbState);
            return _context5.abrupt("return", newDbState);

          case 23:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee4);
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