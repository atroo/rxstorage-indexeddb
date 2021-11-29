"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RxBrowserStorage = void 0;
exports.getRxSBrowserIdbStorage = getRxSBrowserIdbStorage;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _rxdb = require("rxdb");

var _rxBrowserKeyObjectStorageInstance = require("./rx-browser-key-object-storage-instance");

var _rxBrowserStorageInstance = require("./rx-browser-storage-instance");

var RxBrowserStorage = /*#__PURE__*/function () {
  function RxBrowserStorage() {
    this.name = "atroo-browser-storage";
  }

  var _proto = RxBrowserStorage.prototype;

  _proto.hash = function hash(data) {
    return Promise.resolve((0, _rxdb.hash)(data));
  };

  _proto.createStorageInstance = /*#__PURE__*/function () {
    var _createStorageInstance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(params) {
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log("PARAMS: ", params);
              return _context.abrupt("return", (0, _rxBrowserStorageInstance.createBrowserStorageInstance)(params));

            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function createStorageInstance(_x) {
      return _createStorageInstance.apply(this, arguments);
    }

    return createStorageInstance;
  }();

  _proto.createKeyObjectStorageInstance = /*#__PURE__*/function () {
    var _createKeyObjectStorageInstance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(params) {
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              params.collectionName = params.collectionName + "-key-object";
              console.log("PARAMS1", params);
              return _context2.abrupt("return", (0, _rxBrowserKeyObjectStorageInstance.createBrowserKeyObjectStorageInstance)(params));

            case 3:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    function createKeyObjectStorageInstance(_x2) {
      return _createKeyObjectStorageInstance.apply(this, arguments);
    }

    return createKeyObjectStorageInstance;
  }();

  return RxBrowserStorage;
}();

exports.RxBrowserStorage = RxBrowserStorage;

function getRxSBrowserIdbStorage() {
  var databaseSettings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var storage = new RxBrowserStorage();
  return storage;
}
//# sourceMappingURL=rx-browser-storage.js.map