import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
export var foo = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
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
//# sourceMappingURL=index.js.map