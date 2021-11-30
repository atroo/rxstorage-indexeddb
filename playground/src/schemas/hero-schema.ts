export const heroSchema = {
  title: "hero schema",
  version: 1,
  description: "describes a simple hero",
  primaryKey: "name",
  type: "object",
  properties: {
    version: {
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
  required: ["name", "color"],
};
