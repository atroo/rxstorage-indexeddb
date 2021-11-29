"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.find = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _ = require(".");

var _dbHelpers = require("./db-helpers");

var _idbKeyRange = require("./idb-key-range");

var _require = require("pouchdb-selector-core"),
    filterInMemoryFields = _require.filterInMemoryFields;

var find = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(db, collectionName, query) {
    var collName, indexesMetaStore, indexNameIndex, indexesMeta, indexesMetaCursor, translatedSelector, firstIndexedField, opts, keyRange, store, index, cursor, rows, key, value, inMemoryFields;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            collName = (0, _dbHelpers.getIndexesMetaCollName)(collectionName);
            console.log("COLL NAME: ", collName);
            indexesMetaStore = db.transaction((0, _dbHelpers.getIndexesMetaCollName)(collectionName)).store;
            indexNameIndex = indexesMetaStore.index(_dbHelpers.INDEXES_META_PRIMARY_KEY);
            indexesMeta = [];
            _context.next = 7;
            return indexNameIndex.openCursor();

          case 7:
            indexesMetaCursor = _context.sent;

          case 8:
            if (!indexesMetaCursor) {
              _context.next = 15;
              break;
            }

            indexesMeta.push(indexesMetaCursor.value);
            _context.next = 12;
            return indexesMetaCursor["continue"]();

          case 12:
            indexesMetaCursor = _context.sent;
            _context.next = 8;
            break;

          case 15:
            console.log("indexesMeta:", indexesMeta);
            translatedSelector = (0, _.translateMangoQuerySelector)(query); // TODO: use indexed field to generate opts

            firstIndexedField = translatedSelector.fields[0]; // TODO: can be undefined?

            opts = {
              startkey: translatedSelector.queryOpts.startkey ? translatedSelector.queryOpts.startkey[0] : undefined,
              endkey: translatedSelector.queryOpts.endkey ? translatedSelector.queryOpts.endkey[0] : undefined,
              inclusive_start: translatedSelector.queryOpts.inclusive_start,
              inclusive_end: translatedSelector.queryOpts.inclusive_end
            };
            keyRange = (0, _idbKeyRange.generateKeyRange)(opts);
            store = db.transaction(collectionName, "readwrite").store;
            index = store.index(firstIndexedField);
            _context.next = 24;
            return index.openCursor(keyRange);

          case 24:
            cursor = _context.sent;
            rows = [];

          case 26:
            if (!cursor) {
              _context.next = 35;
              break;
            }

            key = cursor.key;
            value = cursor.value;
            rows.push(value);
            _context.next = 32;
            return cursor["continue"]();

          case 32:
            cursor = _context.sent;
            _context.next = 26;
            break;

          case 35:
            // TODO: currently that there should be single indexed key.
            // And everything else should be in memory fields.
            if (translatedSelector.fields.length > 1) {
              inMemoryFields = translatedSelector.fields.slice(1);
              rows = filterInMemoryFields(rows, query, inMemoryFields);
            }

            return _context.abrupt("return", rows);

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function find(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.find = find;
//# sourceMappingURL=find.js.map