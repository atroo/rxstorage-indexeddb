"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBrowserStorageLocalState = exports.createBrowserStorageInstance = exports.RxStorageBrowserInstance = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _rxjs = require("rxjs");

var _dbHelpers = require("./db-helpers");

var _find = require("./find");

var _rxdb = require("rxdb");

var _utils = require("./utils");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var instanceId = 1; // TODO: attachments: should we add "digest" and "length" to attachment ourself?

var RxStorageBrowserInstance = /*#__PURE__*/function () {
  //   public readonly primaryPath: keyof RxDocType;
  function RxStorageBrowserInstance(databaseName, collectionName, options, schema, internals // public readonly options: Readonly<BrowserStorageSettings> // public readonly databaseSettings: BrowserStorageSettings, // public readonly idleQueue: IdleQueue
  ) {// this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);

    this.changes$ = new _rxjs.Subject();
    this.instanceId = instanceId++;
    this.closed = false;
    this.lastChangefeedSequence = 0;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.options = options;
    this.schema = schema;
    this.internals = internals;
  }

  var _proto = RxStorageBrowserInstance.prototype;

  _proto.query = /*#__PURE__*/function () {
    var _query = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(preparedQuery) {
      var db, rows;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!this.closed) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return", Promise.resolve({
                documents: []
              }));

            case 2:
              _context.next = 4;
              return this.getLocalState().getDb();

            case 4:
              db = _context.sent;
              _context.next = 7;
              return (0, _find.find)(db, this.collectionName, preparedQuery);

            case 7:
              rows = _context.sent;
              return _context.abrupt("return", {
                documents: rows
              });

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function query(_x) {
      return _query.apply(this, arguments);
    }

    return query;
  }();

  _proto.bulkWrite = /*#__PURE__*/function () {
    var _bulkWrite = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(documentWrites) {
      var ret, eventBulk, db, txn, store, _iterator, _step, writeRow, startTime, id, documentInDbCursor, documentInDb, insertedIsDeleted, newRevision, writeDoc, revInDb, err, newRevHeight, _newRevision, previous, _change, _writeDoc, change;

      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!(documentWrites.length === 0)) {
                _context2.next = 2;
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
              eventBulk = {
                id: (0, _rxdb.randomCouchString)(10),
                events: []
              };

              if (!this.closed) {
                _context2.next = 6;
                break;
              }

              return _context2.abrupt("return", ret);

            case 6:
              _context2.next = 8;
              return this.getLocalState().getDb();

            case 8:
              db = _context2.sent;
              txn = db.transaction(this.collectionName, "readwrite");
              store = txn.store;
              _iterator = _createForOfIteratorHelperLoose(documentWrites);

            case 12:
              if ((_step = _iterator()).done) {
                _context2.next = 64;
                break;
              }

              writeRow = _step.value;
              startTime = Date.now();
              id = writeRow.document[this.internals.primaryPath];
              _context2.next = 18;
              return store.openCursor(id);

            case 18:
              documentInDbCursor = _context2.sent;
              documentInDb = documentInDbCursor === null || documentInDbCursor === void 0 ? void 0 : documentInDbCursor.value;

              if (documentInDb) {
                _context2.next = 33;
                break;
              }

              /**
               * It is possible to insert already deleted documents,
               * this can happen on replication.
               */
              insertedIsDeleted = writeRow.document._deleted ? true : false;

              if (!insertedIsDeleted) {
                _context2.next = 24;
                break;
              }

              return _context2.abrupt("continue", 62);

            case 24:
              // insert new document
              newRevision = "1-" + (0, _rxdb.createRevision)(writeRow.document);
              writeDoc = Object.assign({}, writeRow.document, {
                _rev: newRevision,
                _deleted: insertedIsDeleted,
                _attachments: writeRow.document._attachments
              });
              _context2.next = 28;
              return store.add(writeDoc);

            case 28:
              this.addChangeDocumentMeta(id);
              eventBulk.events.push({
                eventId: (0, _utils.getEventKey)(false, id, newRevision),
                documentId: id,
                change: {
                  doc: writeDoc,
                  id: id,
                  operation: "INSERT",
                  previous: null
                },
                startTime: startTime,
                endTime: Date.now()
              });
              ret.success[id] = writeDoc;
              _context2.next = 62;
              break;

            case 33:
              // update existing document
              revInDb = documentInDb._rev;

              if (!(!writeRow.previous && !documentInDb._deleted || !!writeRow.previous && revInDb !== writeRow.previous._rev)) {
                _context2.next = 39;
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
              _context2.next = 62;
              break;

            case 39:
              newRevHeight = (0, _rxdb.getHeightOfRevision)(revInDb) + 1;
              _newRevision = newRevHeight + "-" + (0, _rxdb.createRevision)(writeRow.document);

              if (!(writeRow.previous && !writeRow.previous._deleted && writeRow.document._deleted)) {
                _context2.next = 50;
                break;
              }

              _context2.next = 44;
              return documentInDbCursor["delete"]();

            case 44:
              this.addChangeDocumentMeta(id); // TODO: do I need this here.

              previous = Object.assign({}, writeRow.previous);
              previous._rev = _newRevision;
              _change = {
                id: id,
                operation: "DELETE",
                previous: previous,
                doc: null
              };
              eventBulk.events.push({
                eventId: (0, _utils.getEventKey)(false, id, _newRevision),
                documentId: id,
                change: _change,
                startTime: startTime,
                endTime: Date.now()
              });
              return _context2.abrupt("continue", 62);

            case 50:
              if (!writeRow.document._deleted) {
                _context2.next = 52;
                break;
              }

              throw (0, _dbHelpers.newRxError)("SNH", {
                args: {
                  writeRow: writeRow
                }
              });

            case 52:
              _writeDoc = Object.assign({}, writeRow.document, {
                _rev: _newRevision,
                _deleted: false
              });
              _context2.next = 55;
              return documentInDbCursor.update(_writeDoc);

            case 55:
              this.addChangeDocumentMeta(id);
              change = null;

              if (writeRow.previous && writeRow.previous._deleted && !_writeDoc._deleted) {
                change = {
                  id: id,
                  operation: "INSERT",
                  previous: null,
                  doc: _writeDoc
                };
              } else if (writeRow.previous && !writeRow.previous._deleted && !_writeDoc._deleted) {
                change = {
                  id: id,
                  operation: "UPDATE",
                  previous: writeRow.previous,
                  doc: _writeDoc
                };
              }

              if (change) {
                _context2.next = 60;
                break;
              }

              throw (0, _dbHelpers.newRxError)("SNH", {
                args: {
                  writeRow: writeRow
                }
              });

            case 60:
              eventBulk.events.push({
                eventId: (0, _utils.getEventKey)(false, id, _newRevision),
                documentId: id,
                change: change,
                startTime: startTime,
                endTime: Date.now()
              });
              ret.success[id] = _writeDoc;

            case 62:
              _context2.next = 12;
              break;

            case 64:
              txn.commit();
              this.changes$.next(eventBulk);
              return _context2.abrupt("return", ret);

            case 67:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function bulkWrite(_x2) {
      return _bulkWrite.apply(this, arguments);
    }

    return bulkWrite;
  }();

  _proto.bulkAddRevisions = /*#__PURE__*/function () {
    var _bulkAddRevisions = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(documents) {
      var eventBulk, localState, db, txn, store, _iterator2, _step2, docData, startTime, id, documentInDbCursor, documentInDb, newWriteRevision, oldRevision, mustUpdate, docDataCpy, change;

      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!(documents.length === 0)) {
                _context3.next = 2;
                break;
              }

              throw (0, _dbHelpers.newRxError)("P3", {
                args: {
                  documents: documents
                }
              });

            case 2:
              if (!this.closed) {
                _context3.next = 4;
                break;
              }

              return _context3.abrupt("return");

            case 4:
              eventBulk = {
                id: (0, _rxdb.randomCouchString)(10),
                events: []
              };
              localState = this.getLocalState();
              _context3.next = 8;
              return localState.getDb();

            case 8:
              db = _context3.sent;
              txn = db.transaction(this.collectionName, "readwrite");
              store = txn.store;
              _iterator2 = _createForOfIteratorHelperLoose(documents);

            case 12:
              if ((_step2 = _iterator2()).done) {
                _context3.next = 34;
                break;
              }

              docData = _step2.value;
              startTime = Date.now();
              id = docData[this.internals.primaryPath];
              _context3.next = 18;
              return store.openCursor(id);

            case 18:
              documentInDbCursor = _context3.sent;
              documentInDb = documentInDbCursor === null || documentInDbCursor === void 0 ? void 0 : documentInDbCursor.value;

              if (documentInDb) {
                _context3.next = 27;
                break;
              }

              _context3.next = 23;
              return store.add(Object.assign({}, docData));

            case 23:
              eventBulk.events.push({
                documentId: id,
                eventId: (0, _utils.getEventKey)(false, id, docData._rev),
                change: {
                  doc: docData,
                  id: id,
                  operation: "INSERT",
                  previous: null
                },
                startTime: startTime,
                endTime: Date.now()
              });
              this.addChangeDocumentMeta(id);
              _context3.next = 32;
              break;

            case 27:
              newWriteRevision = (0, _rxdb.parseRevision)(docData._rev);
              oldRevision = (0, _rxdb.parseRevision)(documentInDb._rev);
              mustUpdate = false;

              if (newWriteRevision.height !== oldRevision.height) {
                // height not equal, compare base on height
                if (newWriteRevision.height > oldRevision.height) {
                  mustUpdate = true;
                }
              } else if (newWriteRevision.hash > oldRevision.hash) {
                // equal height but new write has the 'winning' hash
                mustUpdate = true;
              }

              if (mustUpdate) {
                docDataCpy = Object.assign({}, docData);
                documentInDbCursor.update(docDataCpy);
                change = null;

                if (documentInDb._deleted && !docData._deleted) {
                  change = {
                    id: id,
                    operation: "INSERT",
                    previous: null,
                    doc: docData
                  };
                } else if (!documentInDb._deleted && !docData._deleted) {
                  change = {
                    id: id,
                    operation: "UPDATE",
                    previous: documentInDb,
                    doc: docData
                  };
                } else if (!documentInDb._deleted && docData._deleted) {
                  change = {
                    id: id,
                    operation: "DELETE",
                    previous: documentInDb,
                    doc: null
                  };
                } else if (documentInDb._deleted && docData._deleted) {
                  change = null;
                }

                if (change) {
                  eventBulk.events.push({
                    documentId: id,
                    eventId: (0, _utils.getEventKey)(false, id, docData._rev),
                    change: change,
                    startTime: startTime,
                    endTime: Date.now()
                  });
                  this.addChangeDocumentMeta(id);
                }
              }

            case 32:
              _context3.next = 12;
              break;

            case 34:
              txn.commit();
              this.changes$.next(eventBulk);

            case 36:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function bulkAddRevisions(_x3) {
      return _bulkAddRevisions.apply(this, arguments);
    }

    return bulkAddRevisions;
  }();

  _proto.findDocumentsById = /*#__PURE__*/function () {
    var _findDocumentsById = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(ids, deleted) {
      var ret, localState, db, store, _iterator3, _step3, id, documentInDb;

      return _regenerator["default"].wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              ret = {};

              if (!this.closed) {
                _context4.next = 3;
                break;
              }

              return _context4.abrupt("return", ret);

            case 3:
              localState = this.getLocalState();
              _context4.next = 6;
              return localState.getDb();

            case 6:
              db = _context4.sent;
              _context4.next = 9;
              return db.transaction(this.collectionName, "readwrite").store;

            case 9:
              store = _context4.sent;
              _iterator3 = _createForOfIteratorHelperLoose(ids);

            case 11:
              if ((_step3 = _iterator3()).done) {
                _context4.next = 19;
                break;
              }

              id = _step3.value;
              _context4.next = 15;
              return store.get(id);

            case 15:
              documentInDb = _context4.sent;

              if (documentInDb && (!documentInDb._deleted || deleted)) {
                ret[id] = documentInDb;
              }

            case 17:
              _context4.next = 11;
              break;

            case 19:
              return _context4.abrupt("return", ret);

            case 20:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function findDocumentsById(_x4, _x5) {
      return _findDocumentsById.apply(this, arguments);
    }

    return findDocumentsById;
  }();

  _proto.getChangedDocuments = /*#__PURE__*/function () {
    var _getChangedDocuments = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(options) {
      var localState, desc, keyRange, changesCollectionName, db, store, cursor, changedDocuments, value, useForLastSequence, ret;
      return _regenerator["default"].wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (!this.closed) {
                _context5.next = 2;
                break;
              }

              return _context5.abrupt("return", {
                changedDocuments: [],
                lastSequence: options.sinceSequence
              });

            case 2:
              localState = this.getLocalState();
              desc = options.direction === "before";
              keyRange = options.direction === "after" ? IDBKeyRange.lowerBound(options.sinceSequence, true) : IDBKeyRange.upperBound(options.sinceSequence, true);
              changesCollectionName = this.getChangesCollectionName();
              _context5.next = 8;
              return localState.getDb();

            case 8:
              db = _context5.sent;
              store = db.transaction(changesCollectionName, "readwrite").store;
              _context5.next = 12;
              return store.index("sequence").openCursor(keyRange, desc ? "prev" : "next");

            case 12:
              cursor = _context5.sent;
              changedDocuments = [];

            case 14:
              if (!cursor) {
                _context5.next = 22;
                break;
              }

              value = cursor.value;
              changedDocuments.push(value);
              _context5.next = 19;
              return cursor["continue"]();

            case 19:
              cursor = _context5.sent;
              _context5.next = 14;
              break;

            case 22:
              if (options.limit) {
                changedDocuments = changedDocuments.slice(0, options.limit);
              }

              changedDocuments = changedDocuments.map(function (result) {
                return {
                  id: result.id,
                  sequence: result.sequence
                };
              });
              useForLastSequence = !desc ? changedDocuments[changedDocuments.length - 1] : changedDocuments[0];
              ret = {
                changedDocuments: changedDocuments,
                lastSequence: useForLastSequence ? useForLastSequence.sequence : options.sinceSequence
              };
              return _context5.abrupt("return", ret);

            case 27:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function getChangedDocuments(_x6) {
      return _getChangedDocuments.apply(this, arguments);
    }

    return getChangedDocuments;
  }();

  _proto.changeStream = function changeStream() {
    return this.changes$.asObservable();
  };

  _proto.getAttachmentData = /*#__PURE__*/function () {
    var _getAttachmentData = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(_documentId, _attachmentId) {
      var localState, db, doc, attachment;
      return _regenerator["default"].wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              localState = this.getLocalState();
              _context6.next = 3;
              return localState.getDb();

            case 3:
              db = _context6.sent;
              _context6.next = 6;
              return db.get(this.collectionName, _documentId);

            case 6:
              doc = _context6.sent;

              if (doc) {
                _context6.next = 9;
                break;
              }

              throw new Error("doc does not exist");

            case 9:
              attachment = doc._attachments[_attachmentId];
              return _context6.abrupt("return", attachment.data);

            case 11:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function getAttachmentData(_x7, _x8) {
      return _getAttachmentData.apply(this, arguments);
    }

    return getAttachmentData;
  }();

  _proto.close = /*#__PURE__*/function () {
    var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
      var localState, db;
      return _regenerator["default"].wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              this.changes$.complete();
              localState = this.getLocalState();
              _context7.next = 4;
              return localState.getDb();

            case 4:
              db = _context7.sent;
              db.close();

              _dbHelpers.IDB_DATABASE_STATE_BY_NAME["delete"]((0, _dbHelpers.getDbName)(this.databaseName, this.collectionName));

              this.closed = true;

            case 8:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function close() {
      return _close.apply(this, arguments);
    }

    return close;
  }();

  _proto.remove = /*#__PURE__*/function () {
    var _remove = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
      var localState;
      return _regenerator["default"].wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              localState = this.getLocalState();
              _context8.next = 3;
              return localState.removeDb();

            case 3:
              this.closed = true;

            case 4:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function remove() {
      return _remove.apply(this, arguments);
    }

    return remove;
  }();

  _proto.getLocalState = function getLocalState() {
    var localState = this.internals.databaseState;

    if (!localState) {
      throw new Error("localState is undefind (dbName: " + this.databaseName + ")");
    }

    return localState;
  };

  _proto.getChangesCollectionName = function getChangesCollectionName() {
    return this.internals.changesCollectionName;
  }
  /**
   * Adds an entry to the changes feed
   * that can be queried to check which documents have been
   * changed since sequence X.
   */
  ;

  _proto.addChangeDocumentMeta =
  /*#__PURE__*/
  function () {
    var _addChangeDocumentMeta = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(id) {
      var localState, changesCollectionName, db, store, cursor, lastDoc, nextFeedSequence;
      return _regenerator["default"].wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              localState = this.getLocalState();
              changesCollectionName = this.getChangesCollectionName();
              _context9.next = 4;
              return localState.getDb();

            case 4:
              db = _context9.sent;
              store = db.transaction(changesCollectionName, "readwrite").store;

              if (this.lastChangefeedSequence) {
                _context9.next = 12;
                break;
              }

              _context9.next = 9;
              return store.index("sequence").openCursor(null, "prev");

            case 9:
              cursor = _context9.sent;
              lastDoc = cursor === null || cursor === void 0 ? void 0 : cursor.value;

              if (lastDoc) {
                this.lastChangefeedSequence = lastDoc.sequence;
              }

            case 12:
              nextFeedSequence = this.lastChangefeedSequence + 1;
              _context9.next = 15;
              return store.put({
                eventId: id,
                sequence: nextFeedSequence
              });

            case 15:
              this.lastChangefeedSequence = nextFeedSequence;

            case 16:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));

    function addChangeDocumentMeta(_x9) {
      return _addChangeDocumentMeta.apply(this, arguments);
    }

    return addChangeDocumentMeta;
  }();

  return RxStorageBrowserInstance;
}();

exports.RxStorageBrowserInstance = RxStorageBrowserInstance;

var createBrowserStorageLocalState = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(params, idbSettings) {
    var primaryPath, databaseState;
    return _regenerator["default"].wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            primaryPath = (0, _dbHelpers.getPrimaryFieldOfPrimaryKey)(params.schema.primaryKey);
            _context10.next = 3;
            return (0, _dbHelpers.createIdbDatabase)({
              databaseName: params.databaseName,
              collectionName: params.collectionName,
              primaryPath: primaryPath,
              schema: params.schema,
              idbSettings: idbSettings
            });

          case 3:
            databaseState = _context10.sent;
            return _context10.abrupt("return", {
              databaseState: databaseState,
              changesCollectionName: (0, _dbHelpers.getChangesCollName)(),
              primaryPath: primaryPath
            });

          case 5:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));

  return function createBrowserStorageLocalState(_x10, _x11) {
    return _ref.apply(this, arguments);
  };
}();

exports.createBrowserStorageLocalState = createBrowserStorageLocalState;

var createBrowserStorageInstance = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(_params, idbSettings) {
    var params, internals, instance;
    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            /**
             * every collection name must have suffix: ${collName}-${coll.version}.
             * Otherwise migration will break.
             * Reason: when collection version changes rxdb copies data from collection
             * and creates new one and old one is deleted.
             */
            params = _objectSpread(_objectSpread({}, _params), {}, {
              collectionName: _params.collectionName + "-" + _params.schema.version
            });
            _context11.next = 3;
            return createBrowserStorageLocalState(params, idbSettings);

          case 3:
            internals = _context11.sent;
            instance = new RxStorageBrowserInstance(params.databaseName, params.collectionName, {}, params.schema, internals);
            /**
             * TODO: should we do extra steps to enable CORRECT multiinstance?
             */

            return _context11.abrupt("return", instance);

          case 6:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11);
  }));

  return function createBrowserStorageInstance(_x12, _x13) {
    return _ref2.apply(this, arguments);
  };
}();

exports.createBrowserStorageInstance = createBrowserStorageInstance;
//# sourceMappingURL=rx-browser-storage-instance.js.map