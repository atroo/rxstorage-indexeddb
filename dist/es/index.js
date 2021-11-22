"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foo = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var foo = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            console.log("foo");
            _context.next = 3;
            return Promise.resolve(1);

          case 3:
            return _context.abrupt("return", [1].includes(1));

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function foo() {
    return _ref.apply(this, arguments);
  };
}();

exports.foo = foo;
//# sourceMappingURL=index.js.map