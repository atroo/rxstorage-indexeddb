"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIndexesMetaCollName = exports.getIdbDatabase = exports.getChangesCollName = exports.INDEXES_META_PRIMARY_KEY = exports.INDEXES_META_COLLECTION_SUFFIX = exports.IDB_DATABASE_STATE_BY_NAME = exports.CHANGES_COLLECTION_SUFFIX = void 0;
exports.getPrimaryFieldOfPrimaryKey = getPrimaryFieldOfPrimaryKey;
exports.newRxError = newRxError;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var _rxdb = require("rxdb");

var _rxError = require("./rx-error");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

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

var getIdbDatabase = function getIdbDatabase(databaseName, collectionName, primaryPath, schema) {
  console.log("DB NAME");
  var dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
  var version = schema.version + 1;
  var meta = [];

  if (dbState) {
    var newCollectionAdded = dbState.collections.indexOf(collectionName) === -1;

    if (newCollectionAdded) {
      dbState.upgradeVersion += 1;
    }

    version += dbState.upgradeVersion;

    if (dbState.version === version) {
      /**
       * nothing has changed. no need to create new connection
       */
      // return dbState;
    }

    meta = meta.concat(dbState.meta);
  }

  var indexes = [];

  if (schema.indexes) {
    // TODO: compund indexes;
    schema.indexes.forEach(function (idx) {
      if (!Array.isArray(idx)) {
        indexes.push(idx);
      }
    });
  }

  var changesCollectionName = getChangesCollName(collectionName);
  meta.push({
    collectionName: collectionName,
    primaryPath: primaryPath,
    indexes: indexes
  });
  /** should I created this only once or for every db?? */

  meta.push({
    collectionName: changesCollectionName,
    primaryPath: "eventId",
    indexes: ["sequence"]
  }); // TODO: ADD IT ONlY ONCE

  meta.push({
    collectionName: getIndexesMetaCollName(collectionName),
    primaryPath: INDEXES_META_PRIMARY_KEY,
    indexes: ["keyPath"]
  });
  console.log("META!!!: ", meta);
  var newDbState = {
    getDb: function () {
      var _getDb = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var dataBaseState, db, indexesStore, dbState, meta, _iterator2, _step2, _indexesStore$put, storeData, _indexes, _iterator3, _step3, _indexesStore$put2, index;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                dataBaseState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
                console.log("REQ DATBASE: ", [].concat(dataBaseState === null || dataBaseState === void 0 ? void 0 : dataBaseState.meta));

                if (dataBaseState) {
                  _context2.next = 4;
                  break;
                }

                throw new Error("dataBase state is undefined");

              case 4:
                if (!(dataBaseState.db && !dataBaseState.meta.length)) {
                  _context2.next = 7;
                  break;
                }

                console.log("ALREADY EXISTS: ", [].concat(dataBaseState === null || dataBaseState === void 0 ? void 0 : dataBaseState.meta));
                return _context2.abrupt("return", dataBaseState.db);

              case 7:
                if (dataBaseState.db) {
                  dataBaseState.db.close();
                } // TODO: manage version change.


                _context2.next = 10;
                return (0, _idb.openDB)(databaseName + ".db", dataBaseState.version, {
                  upgrade: function () {
                    var _upgrade = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(db) {
                      var dbState, meta, _loop, _iterator, _step;

                      return _regenerator["default"].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
                              meta = dbState === null || dbState === void 0 ? void 0 : dbState.meta;
                              console.log("META:", meta);

                              if (meta) {
                                _context.next = 5;
                                break;
                              }

                              return _context.abrupt("return");

                            case 5:
                              console.log("storesData:", meta);

                              _loop = function _loop() {
                                var storeData = _step.value;

                                /**
                                 * Construct loki indexes from RxJsonSchema indexes.
                                 * TODO what about compound indexes?
                                 */
                                var store = db.createObjectStore(storeData.collectionName, {
                                  keyPath: storeData.primaryPath
                                });
                                storeData.indexes.forEach(function (idxName) {
                                  // FIXME
                                  store.createIndex(idxName, idxName);
                                });
                              };

                              for (_iterator = _createForOfIteratorHelperLoose(meta); !(_step = _iterator()).done;) {
                                _loop();
                              }

                            case 8:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee);
                    }));

                    function upgrade(_x) {
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

              case 10:
                db = _context2.sent;
                IDB_DATABASE_STATE_BY_NAME.set(databaseName, _objectSpread(_objectSpread({}, dataBaseState), {}, {
                  db: db
                }));
                db.addEventListener("versionchange", function () {
                  console.log("versionchange fired");
                });
                indexesStore = db.transaction(getIndexesMetaCollName(collectionName), "readwrite").store;
                /**
                 * Store meta data about index
                 * Use it later to understand what index to use to query data
                 *
                 */

                dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
                meta = dbState === null || dbState === void 0 ? void 0 : dbState.meta;

                if (meta) {
                  _context2.next = 18;
                  break;
                }

                return _context2.abrupt("return", db);

              case 18:
                _iterator2 = _createForOfIteratorHelperLoose(meta);

              case 19:
                if ((_step2 = _iterator2()).done) {
                  _context2.next = 35;
                  break;
                }

                storeData = _step2.value;

                if (!(storeData.primaryPath === INDEXES_META_PRIMARY_KEY)) {
                  _context2.next = 23;
                  break;
                }

                return _context2.abrupt("continue", 33);

              case 23:
                _context2.next = 25;
                return indexesStore.put((_indexesStore$put = {}, _indexesStore$put[INDEXES_META_PRIMARY_KEY] = storeData.primaryPath, _indexesStore$put.keyPath = storeData.primaryPath, _indexesStore$put));

              case 25:
                _indexes = storeData.indexes;
                _iterator3 = _createForOfIteratorHelperLoose(_indexes);

              case 27:
                if ((_step3 = _iterator3()).done) {
                  _context2.next = 33;
                  break;
                }

                index = _step3.value;
                _context2.next = 31;
                return indexesStore.put((_indexesStore$put2 = {}, _indexesStore$put2[INDEXES_META_PRIMARY_KEY] = index, _indexesStore$put2.keyPath = index, _indexesStore$put2));

              case 31:
                _context2.next = 27;
                break;

              case 33:
                _context2.next = 19;
                break;

              case 35:
                // clear meta after transaction went successfully
                IDB_DATABASE_STATE_BY_NAME.set(databaseName, _objectSpread(_objectSpread({}, dataBaseState), {}, {
                  db: db,
                  meta: []
                }));
                return _context2.abrupt("return", db);

              case 37:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function getDb() {
        return _getDb.apply(this, arguments);
      }

      return getDb;
    }(),
    collections: dbState ? dbState.collections.concat(collectionName) : [collectionName],
    upgradeVersion: dbState ? dbState.upgradeVersion : 0,
    changesCollectionName: changesCollectionName,
    version: version,
    meta: meta
  };
  IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);
  return newDbState;
};

exports.getIdbDatabase = getIdbDatabase;

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