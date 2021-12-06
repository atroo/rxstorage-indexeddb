"use strict";

var _pouchKeyRange = require("./pouch-key-range");

test("generate pouch key range", function () {
  var indexes = [{
    name: "secret.color",
    value: ["secret", "color"]
  }, {
    name: "name",
    value: "name",
    primary: true
  }];
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {}
  }, indexes)).toEqual({
    field: null,
    queryOpts: null,
    inMemoryFields: []
  });
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {
      color: {
        $gte: "blue",
        $lte: "jade"
      }
    }
  }, indexes)).toEqual({
    queryOpts: {
      startkey: ["blue"],
      endkey: ["jade"]
    },
    inMemoryFields: [],
    field: "color",
    notIndexed: true
  });
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {
      color: {
        $gte: "blue",
        $lte: "jade"
      },
      secret: {
        $gte: "definite_marsupial",
        $lte: "grumpy_fox"
      }
    }
  }, indexes)).toEqual({
    queryOpts: {
      startkey: ["definite_marsupial", "blue"],
      endkey: ["grumpy_fox", "jade"],
      compound: true
    },
    inMemoryFields: ["color", "secret"],
    field: "secret.color"
  });
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {
      color: {
        $gt: "blue",
        $lt: "jade"
      },
      secret: {
        $gte: "definite_marsupial",
        $lte: "grumpy_fox"
      }
    }
  }, indexes)).toEqual({
    queryOpts: {
      startkey: ["definite_marsupial", "blue"],
      endkey: ["grumpy_fox", "jade"],
      inclusiveStart: false,
      inclusiveEnd: false,
      compound: true
    },
    inMemoryFields: ["color", "secret"],
    field: "secret.color"
  });
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {
      color: {
        $gte: "blue",
        $lte: "jade",
        $exists: true
      },
      secret: {
        $gte: "definite_marsupial",
        $lte: "grumpy_fox"
      }
    }
  }, indexes)).toEqual({
    queryOpts: {
      startkey: ["definite_marsupial"],
      endkey: ["grumpy_fox"]
    },
    inMemoryFields: ["color"],
    field: "secret",
    notIndexed: true
  });
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {
      color: {
        $gte: "blue",
        $lte: "tan"
      },
      secret: {
        $eq: "vague_cardinal"
      }
    }
  }, indexes)).toEqual({
    queryOpts: {
      startkey: ["vague_cardinal", "blue"],
      endkey: ["vague_cardinal", "tan"],
      compound: true
    },
    inMemoryFields: ["color", "secret"],
    field: "secret.color"
  });
  expect((0, _pouchKeyRange.generatePouchKeyRange)({
    selector: {
      color: {
        $gte: "blue",
        $lte: "tan",
        $exists: true
      },
      secret: {
        $eq: "vague_cardinal"
      }
    }
  }, indexes)).toEqual({
    queryOpts: {
      startkey: ["vague_cardinal"],
      endkey: ["vague_cardinal"]
    },
    inMemoryFields: ["color"],
    field: "secret",
    notIndexed: true
  });
});
//# sourceMappingURL=pouch-key-range.test.js.map