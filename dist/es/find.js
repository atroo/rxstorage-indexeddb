"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.find = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _ = require(".");

var _dbMetaHelpers = require("./db-meta-helpers");

var _idbKeyRange = require("./idb-key-range");

var _require = require("pouchdb-selector-core"),
    filterInMemoryFields = _require.filterInMemoryFields;

var find = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(db, collectionName, query) {
    var metaDB, indexedCols, translatedSelector, rows, store, keyRange, index, cursor, _cursor;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _dbMetaHelpers.getDbMeta)();

          case 2:
            metaDB = _context.sent;
            _context.next = 5;
            return metaDB.getAllFromIndex("indexedCols", "dbNameCollection", IDBKeyRange.bound([db.name, collectionName], [db.name, collectionName]));

          case 5:
            indexedCols = _context.sent;
            translatedSelector = (0, _.translateMangoQuerySelector)(query, indexedCols);
            rows = [];
            store = db.transaction(collectionName).store;

            if (!(translatedSelector.field && translatedSelector.queryOpts)) {
              _context.next = 20;
              break;
            }

            keyRange = (0, _idbKeyRange.generateKeyRange)(translatedSelector.queryOpts);
            index = store.index(translatedSelector.field);
            _context.next = 14;
            return index.openCursor(keyRange);

          case 14:
            cursor = _context.sent;
            _context.next = 17;
            return getRows(cursor, query.limit);

          case 17:
            rows = _context.sent;
            _context.next = 26;
            break;

          case 20:
            _context.next = 22;
            return store.openCursor();

          case 22:
            _cursor = _context.sent;
            _context.next = 25;
            return getRows(_cursor, query.limit);

          case 25:
            rows = _context.sent;

          case 26:
            if (translatedSelector.inMemoryFields.length) {
              rows = filterInMemoryFields(rows.map(function (row) {
                // make data compatible with filterInMemoryFields
                // TODO: copy and change this util
                return {
                  doc: row
                };
              }), query, translatedSelector.inMemoryFields);
            }

            return _context.abrupt("return", rows);

          case 28:
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

var getRows = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(cursor) {
    var limit,
        rows,
        i,
        _args2 = arguments;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            limit = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : Infinity;
            rows = [];
            i = 0;

          case 3:
            if (!(cursor && i < limit)) {
              _context2.next = 11;
              break;
            }

            rows.push(cursor.value);
            i += 1;
            _context2.next = 8;
            return cursor["continue"]();

          case 8:
            cursor = _context2.sent;
            _context2.next = 3;
            break;

          case 11:
            return _context2.abrupt("return", rows);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function getRows(_x4) {
    return _ref2.apply(this, arguments);
  };
}();
//# sourceMappingURL=find.js.map