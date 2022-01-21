"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBrowserKeyObjectStorageInstance = exports.RxBrowserKeyObjectStorageInstance = void 0;
exports.createBrowserKeyValueStorageLocalState = createBrowserKeyValueStorageLocalState;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _rxdb = require("rxdb");

var _rxjs = require("rxjs");

var _dbHelpers = require("./db-helpers");

var _utils = require("./utils");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var instanceId = 1;

var RxBrowserKeyObjectStorageInstance = /*#__PURE__*/function () {
  function RxBrowserKeyObjectStorageInstance(databaseName, collectionName, options, internals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {// this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);

    this.changes$ = new _rxjs.Subject();
    this.instanceId = instanceId++;
    this.closed = false;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.options = options;
    this.internals = internals;
  }

  var _proto = RxBrowserKeyObjectStorageInstance.prototype;

  _proto.bulkWrite = /*#__PURE__*/function () {
    var _bulkWrite = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(documentWrites) {
      var ret, db, txn, store, eventBulk, writeRowById, startTime, _iterator, _step, writeRow, id, documentInDbCursor, writeDoc, docInDb, previous, newRevHeight, newRevision, err, docCpy, endTime, event, previousDoc, doc, eventId, storageChangeEvent;

      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(documentWrites.length === 0)) {
                _context.next = 2;
                break;
              }

              throw (0, _dbHelpers.newRxError)("P2", {
                args: {
                  documentWrites: documentWrites
                }
              });

            case 2:
              ret = {
                success: {},
                error: {}
              };

              if (!this.closed) {
                _context.next = 5;
                break;
              }

              return _context.abrupt("return", ret);

            case 5:
              _context.next = 7;
              return this.getLocalState().getDb();

            case 7:
              db = _context.sent;
              txn = db.transaction(this.collectionName, "readwrite");
              store = txn.store;
              eventBulk = {
                id: (0, _rxdb.randomCouchString)(10),
                events: []
              };
              writeRowById = new Map();
              startTime = Date.now();
              _iterator = _createForOfIteratorHelperLoose(documentWrites);

            case 14:
              if ((_step = _iterator()).done) {
                _context.next = 54;
                break;
              }

              writeRow = _step.value;
              id = writeRow.document._id;
              writeRowById.set(id, writeRow);
              _context.next = 20;
              return store.openCursor(id);

            case 20:
              documentInDbCursor = _context.sent;
              writeDoc = Object.assign({}, writeRow.document);
              docInDb = documentInDbCursor === null || documentInDbCursor === void 0 ? void 0 : documentInDbCursor.value;
              previous = writeRow.previous ? writeRow.previous : docInDb;
              newRevHeight = previous ? (0, _rxdb.parseRevision)(previous._rev).height + 1 : 1;
              newRevision = newRevHeight + "-" + (0, _rxdb.createRevision)(writeRow.document);
              writeDoc._rev = newRevision;

              if (!docInDb) {
                _context.next = 44;
                break;
              }

              if (!(!writeRow.previous || docInDb._rev !== writeRow.previous._rev)) {
                _context.next = 34;
                break;
              }

              // conflict error
              err = {
                isError: true,
                status: 409,
                documentId: id,
                writeRow: writeRow
              };
              ret.error[id] = err;
              return _context.abrupt("continue", 52);

            case 34:
              if (writeRow.document._deleted) {
                _context.next = 40;
                break;
              }

              docCpy = Object.assign({}, writeDoc);
              _context.next = 38;
              return documentInDbCursor.update(docCpy);

            case 38:
              _context.next = 42;
              break;

            case 40:
              _context.next = 42;
              return documentInDbCursor["delete"]();

            case 42:
              _context.next = 47;
              break;

            case 44:
              if (writeRow.document._deleted) {
                _context.next = 47;
                break;
              }

              _context.next = 47;
              return store.add(Object.assign({}, writeDoc));

            case 47:
              ret.success[id] = writeDoc;
              endTime = Date.now();
              event = void 0;

              if (!writeRow.previous) {
                // was insert
                event = {
                  operation: "INSERT",
                  doc: writeDoc,
                  id: id,
                  previous: null
                };
              } else if (writeRow.document._deleted) {
                // was delete
                // we need to add the new revision to the previous doc
                // so that the eventkey is calculated correctly.
                // Is this a hack? idk.
                previousDoc = Object.assign({}, writeRow.previous);
                previousDoc._rev = newRevision;
                event = {
                  operation: "DELETE",
                  doc: null,
                  id: id,
                  previous: previousDoc
                };
              } else {
                // was update
                event = {
                  operation: "UPDATE",
                  doc: writeDoc,
                  id: id,
                  previous: writeRow.previous
                };
              }

              if (writeRow.document._deleted && (!writeRow.previous || writeRow.previous._deleted)) {
                /**
                 * An already deleted document was added to the storage engine,
                 * do not emit an event because it does not affect anything.
                 */
              } else {
                doc = event.operation === "DELETE" ? event.previous : event.doc;
                eventId = (0, _utils.getEventKey)(true, doc._id, doc._rev ? doc._rev : "");
                storageChangeEvent = {
                  eventId: eventId,
                  documentId: id,
                  change: event,
                  startTime: startTime,
                  endTime: endTime
                };
                eventBulk.events.push(storageChangeEvent);
              }

            case 52:
              _context.next = 14;
              break;

            case 54:
              txn.commit();
              this.changes$.next(eventBulk);
              return _context.abrupt("return", ret);

            case 57:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function bulkWrite(_x) {
      return _bulkWrite.apply(this, arguments);
    }

    return bulkWrite;
  }();

  _proto.findLocalDocumentsById = /*#__PURE__*/function () {
    var _findLocalDocumentsById = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(ids) {
      var ret, localState, db, store, _iterator2, _step2, id, documentInDb;

      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              ret = {};

              if (!this.closed) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return", ret);

            case 3:
              localState = this.getLocalState();
              _context2.next = 6;
              return localState.getDb();

            case 6:
              db = _context2.sent;
              _context2.next = 9;
              return db.transaction(this.collectionName, "readwrite").store;

            case 9:
              store = _context2.sent;
              _iterator2 = _createForOfIteratorHelperLoose(ids);

            case 11:
              if ((_step2 = _iterator2()).done) {
                _context2.next = 19;
                break;
              }

              id = _step2.value;
              _context2.next = 15;
              return store.get(id);

            case 15:
              documentInDb = _context2.sent;

              if (documentInDb && !documentInDb._deleted) {
                ret[id] = documentInDb;
              }

            case 17:
              _context2.next = 11;
              break;

            case 19:
              return _context2.abrupt("return", ret);

            case 20:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function findLocalDocumentsById(_x2) {
      return _findLocalDocumentsById.apply(this, arguments);
    }

    return findLocalDocumentsById;
  }();

  _proto.changeStream = function changeStream() {
    return this.changes$.asObservable();
  };

  _proto.close = /*#__PURE__*/function () {
    var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
      var localState, db;
      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              this.changes$.complete();
              localState = this.getLocalState();
              _context3.next = 4;
              return localState.getDb();

            case 4:
              db = _context3.sent;
              db.close();

              _dbHelpers.IDB_DATABASE_STATE_BY_NAME["delete"]((0, _dbHelpers.getDbName)(this.databaseName, this.collectionName));

              this.closed = true;

            case 8:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function close() {
      return _close.apply(this, arguments);
    }

    return close;
  }();

  _proto.remove = /*#__PURE__*/function () {
    var _remove = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
      var localState;
      return _regenerator["default"].wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              localState = this.getLocalState();
              _context4.next = 3;
              return localState.removeDb();

            case 3:
              this.closed = true;

            case 4:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function remove() {
      return _remove.apply(this, arguments);
    }

    return remove;
  }();

  _proto.getLocalState = function getLocalState() {
    var localState = this.internals.databaseState;

    if (!localState) {
      throw new Error("localState(keyVal storage) is undefind (dbName: " + this.databaseName + ")");
    }

    return localState;
  };

  return RxBrowserKeyObjectStorageInstance;
}();

exports.RxBrowserKeyObjectStorageInstance = RxBrowserKeyObjectStorageInstance;

function createBrowserKeyValueStorageLocalState(_x3, _x4) {
  return _createBrowserKeyValueStorageLocalState.apply(this, arguments);
}

function _createBrowserKeyValueStorageLocalState() {
  _createBrowserKeyValueStorageLocalState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(params, idbSettings) {
    var primaryPath, databaseState;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            primaryPath = "_id";
            _context6.next = 3;
            return (0, _dbHelpers.createIdbDatabase)({
              databaseName: params.databaseName,
              collectionName: params.collectionName,
              primaryPath: "_id",
              schema: {
                indexes: [],
                version: 0
              },
              idbSettings: idbSettings
            });

          case 3:
            databaseState = _context6.sent;
            return _context6.abrupt("return", {
              databaseState: databaseState,
              changesCollectionName: (0, _dbHelpers.getChangesCollName)(),
              primaryPath: primaryPath
            });

          case 5:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return _createBrowserKeyValueStorageLocalState.apply(this, arguments);
}

var createBrowserKeyObjectStorageInstance = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(_params, idbSettings) {
    var params, internals, instance;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            params = _objectSpread(_objectSpread({}, _params), {}, {
              databaseName: _params.databaseName + "-key-object"
            });
            _context5.next = 3;
            return createBrowserKeyValueStorageLocalState(params, idbSettings);

          case 3:
            internals = _context5.sent;
            instance = new RxBrowserKeyObjectStorageInstance(params.databaseName, params.collectionName, {}, internals);
            /**
             * TODO: should we do extra steps to enable CORRECT multiinstance?
             */

            return _context5.abrupt("return", instance);

          case 6:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function createBrowserKeyObjectStorageInstance(_x5, _x6) {
    return _ref.apply(this, arguments);
  };
}();

exports.createBrowserKeyObjectStorageInstance = createBrowserKeyObjectStorageInstance;
//# sourceMappingURL=rx-browser-key-object-storage-instance.js.map