"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIdbDatabase = exports.CHANGES_COLLECTION_SUFFIX = void 0;
exports.getPrimaryFieldOfPrimaryKey = getPrimaryFieldOfPrimaryKey;
exports.newRxError = newRxError;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var _rxdb = require("rxdb");

var _rxError = require("./rx-error");

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

var getIdbDatabase = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(databaseName, collectionName, primaryPath, schema) {
    var dbState, version, newCollectionAdded, db, newDbState;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dbState = IDB_DATABASE_STATE_BY_NAME.get(databaseName);
            version = schema.version;

            if (!dbState) {
              _context.next = 11;
              break;
            }

            newCollectionAdded = dbState.collections.indexOf(collectionName) === -1;

            if (newCollectionAdded) {
              dbState.upgradeVersion += 1;
            }

            version += dbState.upgradeVersion;

            if (!(dbState.version === version)) {
              _context.next = 10;
              break;
            }

            return _context.abrupt("return", dbState);

          case 10:
            dbState.db.close();

          case 11:
            _context.next = 13;
            return (0, _idb.openDB)(databaseName + ".db", version, {
              upgrade: function upgrade(db) {
                var store = db.createObjectStore(collectionName, {
                  keyPath: primaryPath
                });
                /**
                 * Construct loki indexes from RxJsonSchema indexes.
                 * TODO what about compound indexes?
                 */

                /**
                 * Construct loki indexes from RxJsonSchema indexes.
                 * TODO what about compound indexes?
                 */
                var indices = [];

                if (schema.indexes) {
                  schema.indexes.forEach(function (idx) {
                    if (!Array.isArray(idx)) {
                      indices.push(idx);
                    }
                  });
                }

                indices.forEach(function (idxName) {
                  store.createIndex(idxName, idxName);
                });
                var changesCollectionName = collectionName + CHANGES_COLLECTION_SUFFIX;
                var changesStore = db.createObjectStore(changesCollectionName, {
                  keyPath: "eventId"
                });
                changesStore.createIndex("sequence", "sequence");
              },
              blocked: function blocked() {
                alert("Please close all other tabs with this site open!");
              },
              blocking: function blocking() {// Make sure to add a handler to be notified if another page requests a version
                // change. We must close the database. This allows the other page to upgrade the database.
                // If you don't do this then the upgrade won't happen until the user closes the tab.
                //
                //   db.close();
                //   alert(
                //     "A new version of this page is ready. Please reload or close this tab!"
                //   );
              },
              terminated: function terminated() {}
            });

          case 13:
            db = _context.sent;
            newDbState = {
              db: db,
              collections: dbState ? dbState.collections.concat(collectionName) : [collectionName],
              upgradeVersion: dbState ? dbState.upgradeVersion : 0,
              version: version
            };
            IDB_DATABASE_STATE_BY_NAME.set(databaseName, newDbState);
            return _context.abrupt("return", newDbState);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
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
//# sourceMappingURL=helpers.js.map