"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDbMeta = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _idb = require("idb");

var openConnection;

var getDbMeta = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var db;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!openConnection) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return", openConnection);

          case 2:
            _context.next = 4;
            return (0, _idb.openDB)("rx-browser-storage-meta", 1, {
              upgrade: function upgrade(db) {
                // store version, collections
                var dbMetaDataStore = db.createObjectStore("dbMetaData", {
                  keyPath: "dbName"
                });
                dbMetaDataStore.createIndex("dbName", "dbName");
                var indexedColsStore = db.createObjectStore("indexedCols", {
                  keyPath: "collection"
                });
                indexedColsStore.createIndex("collection", "collection");
              },
              blocking: function blocking() {
                db.close();
              }
            });

          case 4:
            db = _context.sent;
            openConnection = db;
            return _context.abrupt("return", openConnection);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getDbMeta() {
    return _ref.apply(this, arguments);
  };
}();

exports.getDbMeta = getDbMeta;
//# sourceMappingURL=db-meta-helpers.js.map