export const heroSchema1 = {
  title: "hero schema1",
  version: 0,
  description: "describes a simple hero1",
  // primaryKey: {
  //   key: "id",
  //   fields: ["name", "color"],
  //   separator: "|",
  // },
  primaryKey: "name",
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    myVersion: {
      type: "number",
    },
    name: {
      type: "string",
    },
    color: {
      type: "string",
    },
    healthpoints: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
    secret: {
      type: "string",
    },
    birthyear: {
      type: "number",
      final: true,
      minimum: 1900,
      maximum: 2050,
    },
    skills: {
      type: "array",
      maxItems: 5,
      uniqueItems: true,
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          damage: {
            type: "number",
          },
        },
      },
    },
  },
  attachments: {
    encrypted: false,
  },
  // required: ["name", "color"],
  indexes: [["secret", "color"]],
};
