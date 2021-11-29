"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIndexesMetaCollName = exports.getChangesCollName = exports.createIdbDatabase = exports.INDEXES_META_PRIMARY_KEY = exports.INDEXES_META_COLLECTION_SUFFIX = exports.IDB_DATABASE_STATE_BY_NAME = exports.CHANGES_COLLECTION_SUFFIX = void 0;
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
var INDEXES_META_COLLECTION_SUFFIX = "-idb-meta";
exports.INDEXES_META_COLLECTION_SUFFIX = INDEXES_META_COLLECTION_SUFFIX;
var INDEXES_META_PRIMARY_KEY = "indexNameIdbMeta";
exports.INDEXES_META_PRIMARY_KEY = INDEXES_META_PRIMARY_KEY;
var IDB_DATABASE_STATE_BY_NAME = new Map();
exports.IDB_DATABASE_STATE_BY_NAME = IDB_DATABASE_STATE_BY_NAME;

var getChangesCollName = function getChangesCollName(collName) {
  return collName + CHANGES_COLLECTION_SUFFIX;
};

exports.getChangesCollName = getChangesCollName;

var getIndexesMetaCollName = function getIndexesMetaCollName(collName) {
  return collName + INDEXES_META_COLLECTION_SUFFIX;
};
/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 */


exports.getIndexesMetaCollName = getIndexesMetaCollName;
var getDbPromise;

var createIdbDatabase = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(databaseName, collectionName, primaryPath, schema) {
    var metaDB, metaData, dbState, reqMetaData, updateNeeded, indexes, newCollections, changesCollectionName, newDbState;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return getDbPromise;

          case 2:
            console.log("DB NAME");
            _context4.next = 5;
            return (0, _dbMetaHelpers.getDbMeta)();

          case 5:
            metaDB = _context4.sent;
            dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);

            if (!(dbState !== null && dbState !== void 0 && dbState.metaData)) {
              _context4.next = 11;
              break;
            }

            metaData = dbState.metaData;
            _context4.next = 15;
            break;

          case 11:
            _context4.next = 13;
            return metaDB.getFromIndex("dbMetaData", "dbName", databaseName);

          case 13:
            reqMetaData = _context4.sent;

            if (reqMetaData) {
              metaData = reqMetaData;
              console.log("reqMetaData:", reqMetaData);
            } else {
              metaData = {
                version: 0,
                collections: [],
                dbName: databaseName
              };
            }

          case 15:
            updateNeeded = metaData.collections.indexOf(collectionName) === -1;
            indexes = [];

            if (schema.indexes) {
              // TODO: compund indexes;
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
                indexes: indexes
              }); // TODO: create one changes collection per database ?

              newCollections.push({
                collectionName: changesCollectionName,
                primaryPath: "eventId",
                indexes: ["sequence"]
              });
              console.log("NEW COLLECTIONS!!!: ", newCollections);
              metaData = _objectSpread(_objectSpread({}, metaData), {}, {
                collections: metaData.collections.concat(newCollections.map(function (coll) {
                  return coll.collectionName;
                }))
              });
            }

            newDbState = {
              getDb: function () {
                var _getDb = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          getDbPromise = new Promise( /*#__PURE__*/function () {
                            var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(resolve) {
                              var dataBaseState, metaData, db;
                              return _regenerator["default"].wrap(function _callee2$(_context2) {
                                while (1) {
                                  switch (_context2.prev = _context2.next) {
                                    case 0:
                                      dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
                                      console.log("REQ DATBASE: ", [].concat(dataBaseState === null || dataBaseState === void 0 ? void 0 : dataBaseState.newCollections));

                                      if (dataBaseState) {
                                        _context2.next = 4;
                                        break;
                                      }

                                      throw new Error("dataBase state is undefined");

                                    case 4:
                                      if (!dataBaseState.updateNeeded && dataBaseState.db) {
                                        console.log("ALREADY EXISTS: ", [].concat(dataBaseState === null || dataBaseState === void 0 ? void 0 : dataBaseState.newCollections));
                                        resolve(dataBaseState.db);
                                      }

                                      metaData = dataBaseState.metaData;

                                      if (dataBaseState.updateNeeded) {
                                        metaData.version += 1;
                                      } // TODO: manage version change.


                                      _context2.next = 9;
                                      return (0, _idb.openDB)(databaseName + ".db", metaData.version, {
                                        upgrade: function () {
                                          var _upgrade = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(db) {
                                            var newCollections, _loop, _iterator, _step;

                                            return _regenerator["default"].wrap(function _callee$(_context) {
                                              while (1) {
                                                switch (_context.prev = _context.next) {
                                                  case 0:
                                                    newCollections = dataBaseState.newCollections;
                                                    console.log("NEW COLLECTIONS:", newCollections);

                                                    if (newCollections.length) {
                                                      _context.next = 4;
                                                      break;
                                                    }

                                                    return _context.abrupt("return");

                                                  case 4:
                                                    _loop = function _loop() {
                                                      var collectionData = _step.value;

                                                      /**
                                                       * Construct loki indexes from RxJsonSchema indexes.
                                                       * TODO what about compound indexes?
                                                       */
                                                      var store = db.createObjectStore(collectionData.collectionName, {
                                                        keyPath: collectionData.primaryPath
                                                      });
                                                      collectionData.indexes.forEach(function (idxName) {
                                                        // FIXME
                                                        store.createIndex(idxName, idxName);
                                                      });
                                                    };

                                                    for (_iterator = _createForOfIteratorHelperLoose(newCollections); !(_step = _iterator()).done;) {
                                                      _loop();
                                                    }

                                                  case 6:
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
                                        blocked: function blocked() {// alert("Please close all other tabs with this site open!");
                                        },
                                        blocking: function blocking() {
                                          // Make sure to add a handler to be notified if another page requests a version
                                          // change. We must close the database. This allows the other page to upgrade the database.
                                          // If you don't do this then the upgrade won't happen until the user closes the tab.
                                          //
                                          db.close(); // alert(
                                          //   "A new version of this page is ready. Please reload or close this tab!"
                                          // );
                                        },
                                        terminated: function terminated() {}
                                      });

                                    case 9:
                                      db = _context2.sent;
                                      db.addEventListener("versionchange", function () {
                                        console.log("versionchange fired");
                                      }); // const indexesStore = db.transaction(
                                      //   getIndexesMetaCollName(collectionName),
                                      //   "readwrite"
                                      // ).store;

                                      /**
                                       * Store meta data about index
                                       * Use it later to understand what index to use to query data
                                       *
                                       */
                                      // const dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
                                      // const meta = dbState?.meta;
                                      // if (!meta) {
                                      //   return db;
                                      // }
                                      // for (const storeData of meta) {
                                      //   if (storeData.primaryPath === INDEXES_META_PRIMARY_KEY) {
                                      //     continue;
                                      //   }
                                      //   await indexesStore.put({
                                      //     [INDEXES_META_PRIMARY_KEY]: storeData.primaryPath,
                                      //     keyPath: storeData.primaryPath,
                                      //   });
                                      //   const indexes = storeData.indexes;
                                      //   for (const index of indexes) {
                                      //     await indexesStore.put({
                                      //       [INDEXES_META_PRIMARY_KEY]: index,
                                      //       keyPath: index,
                                      //     });
                                      //   }
                                      // }
                                      // clear meta after transaction went successfully

                                      IDB_DATABASE_STATE_BY_NAME.set(databaseName, _objectSpread(_objectSpread({}, dataBaseState), {}, {
                                        db: db,
                                        newCollections: [],
                                        metaData: metaData
                                      }));
                                      _context2.next = 14;
                                      return metaDB.put("dbMetaData", metaData);

                                    case 14:
                                      resolve(db);

                                    case 15:
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

                        case 2:
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
              changesCollectionName: changesCollectionName,
              metaData: metaData,
              updateNeeded: updateNeeded,
              newCollections: [].concat(dbState ? dbState.newCollections : [], newCollections)
            };
            IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);
            return _context4.abrupt("return", newDbState);

          case 24:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
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