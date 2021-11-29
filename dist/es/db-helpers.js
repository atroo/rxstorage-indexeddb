"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIdbDatabase = exports.IDB_DATABASE_STATE_BY_NAME = exports.CHANGES_COLLECTION_SUFFIX = void 0;
exports.getPrimaryFieldOfPrimaryKey = getPrimaryFieldOfPrimaryKey;
exports.newRxError = newRxError;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var _rxdb = require("rxdb");

var _rxError = require("./rx-error");

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var CHANGES_COLLECTION_SUFFIX = "-rxdb-changes";
exports.CHANGES_COLLECTION_SUFFIX = CHANGES_COLLECTION_SUFFIX;
var IDB_DATABASE_STATE_BY_NAME = new Map();
/**
 * TODO: migrations
 * 1) Before updating store we need to copy all data to somewhere else.
 * 2) Created new store.
 * 3) Put old data to new store.
 *
 * TODO: "close" notifications ?
 */
// poc

exports.IDB_DATABASE_STATE_BY_NAME = IDB_DATABASE_STATE_BY_NAME;
var storesData = [];
var openedDb;

var getIdbDatabase = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(databaseName, collectionName, primaryPath, schema) {
    var dbState, version, newCollectionAdded, indexes, changesCollectionName, newDbState;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log("DB NAME");
            dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
            version = schema.version + 1;

            if (!dbState) {
              _context2.next = 16;
              break;
            }

            newCollectionAdded = dbState.collections.indexOf(collectionName) === -1;

            if (newCollectionAdded) {
              dbState.upgradeVersion += 1;
            }

            version += dbState.upgradeVersion;

            if (!(dbState.version === version)) {
              _context2.next = 11;
              break;
            }

            return _context2.abrupt("return", dbState);

          case 11:
            console.log("db name: ", databaseName);
            console.log("col name: ", collectionName);
            console.log("primary path: ", primaryPath);
            console.log("schema: ", schema);
            console.log("---------------------"); // dbState.db.close();

          case 16:
            indexes = [];

            if (schema.indexes) {
              schema.indexes.forEach(function (idx) {
                if (!Array.isArray(idx)) {
                  indexes.push(idx);
                }
              });
            }

            changesCollectionName = collectionName + CHANGES_COLLECTION_SUFFIX;
            storesData.push({
              collectionName: collectionName,
              primaryPath: primaryPath,
              indexes: indexes
            });
            /** should I created this only once or for every db?? */

            storesData.push({
              collectionName: changesCollectionName,
              primaryPath: "eventId",
              indexes: ["sequence"]
            });
            newDbState = {
              getDb: function () {
                var _getDb = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                  var db;
                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!openedDb) {
                            _context.next = 2;
                            break;
                          }

                          return _context.abrupt("return", openedDb);

                        case 2:
                          _context.next = 4;
                          return (0, _idb.openDB)(databaseName + ".db", 1, {
                            upgrade: function upgrade(db) {
                              console.log("storesData:", storesData);

                              var _loop = function _loop() {
                                var storeData = _step.value;

                                /**
                                 * Construct loki indexes from RxJsonSchema indexes.
                                 * TODO what about compound indexes?
                                 */
                                var store = db.createObjectStore(storeData.collectionName, {
                                  keyPath: storeData.primaryPath
                                });
                                storeData.indexes.forEach(function (idxName) {
                                  store.createIndex(idxName, idxName);
                                });
                              };

                              for (var _iterator = _createForOfIteratorHelperLoose(storesData), _step; !(_step = _iterator()).done;) {
                                _loop();
                              } // const store = db.createObjectStore(collectionName, {
                              //   keyPath: primaryPath,
                              // });
                              // const indices: string[] = [];
                              // if (schema.indexes) {
                              //   schema.indexes.forEach((idx) => {
                              //     if (!Array.isArray(idx)) {
                              //       indices.push(idx);
                              //     }
                              //   });
                              // }
                              // indices.forEach((idxName) => {
                              //   store.createIndex(idxName, idxName);
                              // });
                              // const changesStore = db.createObjectStore(changesCollectionName, {
                              //   keyPath: "eventId",
                              // });
                              // changesStore.createIndex("sequence", "sequence");

                            },
                            blocked: function blocked() {
                              alert("Please close all other tabs with this site open!");
                            },
                            blocking: function blocking() {
                              // Make sure to add a handler to be notified if another page requests a version
                              // change. We must close the database. This allows the other page to upgrade the database.
                              // If you don't do this then the upgrade won't happen until the user closes the tab.
                              //
                              db.close();
                              alert("A new version of this page is ready. Please reload or close this tab!");
                            },
                            terminated: function terminated() {}
                          });

                        case 4:
                          db = _context.sent;
                          openedDb = db;
                          return _context.abrupt("return", openedDb);

                        case 7:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                function getDb() {
                  return _getDb.apply(this, arguments);
                }

                return getDb;
              }(),
              collections: dbState ? dbState.collections.concat(collectionName) : [collectionName],
              upgradeVersion: dbState ? dbState.upgradeVersion : 0,
              changesCollectionName: changesCollectionName,
              version: version
            };
            IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);
            return _context2.abrupt("return", newDbState);

          case 24:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function getIdbDatabase(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

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