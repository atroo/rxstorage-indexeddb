"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.find = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _dbMetaHelpers = require("./db-meta-helpers");

var _idbKeyRange = require("./idb-key-range");

var _pouchKeyRange = require("./pouch-key-range");

var _require = require("pouchdb-selector-core"),
    filterInMemoryFields = _require.filterInMemoryFields; // TODO: types


var find = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(db, collectionName, query) {
    var metaDB, indexesMeta, indexedCols, pouchKeyRangeData, store, cursor, keyRange, index, rows;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _dbMetaHelpers.getDbMeta)();

          case 2:
            metaDB = _context.sent;
            _context.next = 5;
            return metaDB.get("indexedCols", [db.name, collectionName]);

          case 5:
            indexesMeta = _context.sent;
            indexedCols = indexesMeta ? indexesMeta.indexes : [];
            pouchKeyRangeData = (0, _pouchKeyRange.generatePouchKeyRange)(query, indexedCols);
            store = db.transaction(collectionName).store;

            if (!(pouchKeyRangeData.field && pouchKeyRangeData.queryOpts)) {
              _context.next = 19;
              break;
            }

            keyRange = (0, _idbKeyRange.generateKeyRange)(pouchKeyRangeData.queryOpts);
            index = pouchKeyRangeData.notIndexed ? store : store.index(pouchKeyRangeData.field);
            _context.next = 14;
            return index.openCursor(keyRange);

          case 14:
            cursor = _context.sent;
            console.log("index name: ", pouchKeyRangeData.field);
            console.log("keyRange: ", keyRange);
            _context.next = 22;
            break;

          case 19:
            _context.next = 21;
            return store.openCursor();

          case 21:
            cursor = _context.sent;

          case 22:
            _context.next = 24;
            return getRows(cursor);

          case 24:
            rows = _context.sent;

            /**
             * Filter in Memory Fields will take care of sort, limit and skip.
             * TODO: if there's indexed field, then use IDBKeyRange to sort data.
             */
            console.log("in memory fields: ", pouchKeyRangeData.inMemoryFields);
            rows = filterInMemoryFields(rows.map(function (row) {
              // make data compatible with filterInMemoryFields
              // TODO: fork "pouchdb-selector-core" and adapt lib for our uses case.
              return {
                doc: row
              };
            }), query, pouchKeyRangeData.inMemoryFields);
            return _context.abrupt("return", rows.map(function (row) {
              return row.doc;
            }));

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