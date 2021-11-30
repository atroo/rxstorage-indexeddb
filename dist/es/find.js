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
    var metaDB, indexedCols, translatedSelector, rows, keyRange;
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

            if (!(translatedSelector.field && translatedSelector.queryOpts)) {
              _context.next = 15;
              break;
            }

            keyRange = (0, _idbKeyRange.generateKeyRange)(translatedSelector.queryOpts);
            _context.next = 11;
            return db.getAllFromIndex(collectionName, translatedSelector.field, keyRange);

          case 11:
            rows = _context.sent;
            console.log("rows from index", rows);
            _context.next = 19;
            break;

          case 15:
            _context.next = 17;
            return db.getAll(collectionName);

          case 17:
            rows = _context.sent;
            console.log("all rows", rows);

          case 19:
            if (translatedSelector.inMemoryFields.length) {
              rows = filterInMemoryFields(rows, query, translatedSelector.inMemoryFields);
              console.log("filtered rows: ", rows);
            }

            return _context.abrupt("return", rows);

          case 21:
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