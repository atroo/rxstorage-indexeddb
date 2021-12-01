"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getChangesCollName = exports.genIndexName = exports.createIdbDatabase = exports.IDB_DATABASE_STATE_BY_NAME = exports.CHANGES_COLLECTION_SUFFIX = void 0;
exports.getPrimaryFieldOfPrimaryKey = getPrimaryFieldOfPrimaryKey;
exports.newRxError = newRxError;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var _rxdb = require("rxdb");

var _rxError = require("./rx-error");

var _dbMetaHelpers = require("./db-meta-helpers");

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
/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 * TODO: handle properly primaryPath.
 */


exports.genIndexName = genIndexName;
var getDbPromise;

var createIdbDatabase = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(databaseName, collectionName, primaryPath, schema) {
    var metaDB, metaData, dbState, reqMetaData, updateNeeded, foundCol, indexes, newCollections, changesCollectionName, newDbState;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return getDbPromise;

          case 2:
            _context5.next = 4;
            return (0, _dbMetaHelpers.getDbMeta)();

          case 4:
            metaDB = _context5.sent;
            dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);

            if (!(dbState !== null && dbState !== void 0 && dbState.metaData)) {
              _context5.next = 10;
              break;
            }

            metaData = dbState.metaData;
            _context5.next = 14;
            break;

          case 10:
            _context5.next = 12;
            return metaDB.getFromIndex("dbMetaData", "dbName", databaseName);

          case 12:
            reqMetaData = _context5.sent;

            if (reqMetaData) {
              metaData = reqMetaData;
            } else {
              metaData = {
                version: 0,
                collections: [],
                dbName: databaseName
              };
            }

          case 14:
            updateNeeded = true;
            foundCol = metaData.collections.find(function (col) {
              return col.name === collectionName;
            });

            if (foundCol && (foundCol === null || foundCol === void 0 ? void 0 : foundCol.version) === schema.version) {
              updateNeeded = false;
            }

            if (foundCol) {
              console.log("Tries to add same collection", collectionName + ": " + schema.version);
            }

            indexes = [];

            if (schema.indexes) {
              schema.indexes.forEach(function (idx) {
                if (!Array.isArray(idx)) {
                  indexes.push(idx);
                }
              });
            }

            newCollections = [];
            changesCollectionName = getChangesCollName(collectionName);

            if (updateNeeded) {
              newCollections.push({
                collectionName: collectionName,
                primaryPath: primaryPath,
                indexes: indexes,
                version: schema.version
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
                var _getDb = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.next = 2;
                          return getDbPromise;

                        case 2:
                          getDbPromise = new Promise( /*#__PURE__*/function () {
                            var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(resolve) {
                              var dataBaseState, metaData, newCollections, db, newDbState;
                              return _regenerator["default"].wrap(function _callee2$(_context2) {
                                while (1) {
                                  switch (_context2.prev = _context2.next) {
                                    case 0:
                                      dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);

                                      if (dataBaseState) {
                                        _context2.next = 4;
                                        break;
                                      }

                                      console.trace("no db state");
                                      throw new Error("dataBase state is undefined");

                                    case 4:
                                      if (!(!dataBaseState.updateNeeded && dataBaseState.db)) {
                                        _context2.next = 6;
                                        break;
                                      }

                                      return _context2.abrupt("return", resolve(dataBaseState.db));

                                    case 6:
                                      metaData = dataBaseState.metaData;

                                      if (dataBaseState.updateNeeded) {
                                        metaData.version += 1;
                                      }

                                      newCollections = dataBaseState.newCollections;
                                      _context2.next = 11;
                                      return (0, _idb.openDB)(databaseName, metaData.version, {
                                        upgrade: function () {
                                          var _upgrade = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(db) {
                                            var _iterator, _step, collectionData;

                                            return _regenerator["default"].wrap(function _callee$(_context) {
                                              while (1) {
                                                switch (_context.prev = _context.next) {
                                                  case 0:
                                                    if (newCollections.length) {
                                                      _context.next = 2;
                                                      break;
                                                    }

                                                    return _context.abrupt("return");

                                                  case 2:
                                                    for (_iterator = _createForOfIteratorHelperLoose(newCollections); !(_step = _iterator()).done;) {
                                                      collectionData = _step.value;

                                                      try {
                                                        (function () {
                                                          var store = db.createObjectStore(collectionData.collectionName, {
                                                            keyPath: collectionData.primaryPath
                                                          });
                                                          collectionData.indexes.forEach(function (index) {
                                                            store.createIndex(genIndexName(index), index);
                                                          });
                                                        })();
                                                      } catch (error) {
                                                        console.log(error);
                                                        console.log("STORE EXISTS: ", collectionData.collectionName);
                                                      }
                                                    }

                                                  case 3:
                                                  case "end":
                                                    return _context.stop();
                                                }
                                              }
                                            }, _callee);
                                          }));

                                          function upgrade(_x6) {
                                            return _upgrade.apply(this, arguments);
                                          }

                                          return upgrade;
                                        }(),
                                        blocking: function blocking() {
                                          // Make sure to add a handler to be notified if another page requests a version
                                          // change. We must close the database. This allows the other page to upgrade the database.
                                          // If you don't do this then the upgrade won't happen until the user closes the tab.
                                          //
                                          db.close();
                                        },
                                        terminated: function terminated() {}
                                      });

                                    case 11:
                                      db = _context2.sent;

                                      /**
                                       * Store meta data about indexes
                                       * Use it later to understand what index to use to query data
                                       *
                                       */
                                      if (newCollections.length) {
                                        (function () {
                                          var indexedColsStore = metaDB.transaction("indexedCols", "readwrite").store;

                                          var _loop = function _loop() {
                                            var collData = _step2.value;
                                            var indexes = collData.indexes;
                                            indexes.forEach(function (index) {
                                              indexedColsStore.put({
                                                dbName: databaseName,
                                                collection: collData.collectionName,
                                                name: genIndexName(index),
                                                value: index
                                              });
                                            });
                                          };

                                          for (var _iterator2 = _createForOfIteratorHelperLoose(newCollections), _step2; !(_step2 = _iterator2()).done;) {
                                            _loop();
                                          }
                                        })();
                                      } // clear newCollections transaction went successfully


                                      newDbState = _objectSpread(_objectSpread({}, dataBaseState), {}, {
                                        updateNeeded: false,
                                        db: db,
                                        newCollections: [],
                                        metaData: _objectSpread(_objectSpread({}, dataBaseState.metaData), {}, {
                                          collections: metaData.collections.concat(newCollections.map(function (coll) {
                                            return {
                                              name: coll.collectionName,
                                              version: coll.version
                                            };
                                          }))
                                        })
                                      });
                                      _context2.next = 16;
                                      return metaDB.put("dbMetaData", newDbState.metaData);

                                    case 16:
                                      IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);
                                      resolve(db);

                                    case 18:
                                    case "end":
                                      return _context2.stop();
                                  }
                                }
                              }, _callee2);
                            }));

                            return function (_x5) {
                              return _ref2.apply(this, arguments);
                            };
                          }());
                          return _context3.abrupt("return", getDbPromise);

                        case 4:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3);
                }));

                function getDb() {
                  return _getDb.apply(this, arguments);
                }

                return getDb;
              }(),
              deleteDb: function () {
                var _deleteDb = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
                  var dataBaseState;
                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          console.log("WILL delete db: ", databaseName);
                          _context4.next = 3;
                          return getDbPromise;

                        case 3:
                          dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);

                          if (dataBaseState) {
                            _context4.next = 6;
                            break;
                          }

                          throw new Error("deleteDb: dataBase state is undefined");

                        case 6:
                          if (dataBaseState.db) {
                            dataBaseState.db.close();
                          }

                          _context4.next = 9;
                          return (0, _idb.deleteDB)(databaseName);

                        case 9:
                          IDB_DATABASE_STATE_BY_NAME.set(databaseName, _objectSpread(_objectSpread({}, dataBaseState), {}, {
                            db: undefined
                          }));

                        case 10:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4);
                }));

                function deleteDb() {
                  return _deleteDb.apply(this, arguments);
                }

                return deleteDb;
              }(),
              metaData: metaData,
              updateNeeded: updateNeeded,
              newCollections: [].concat(dbState ? dbState.newCollections : [], newCollections)
            });
            IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);
            return _context5.abrupt("return", newDbState);

          case 26:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function createIdbDatabase(_x, _x2, _x3, _x4) {
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
//# sourceMappingURL=db-helpers.js.map