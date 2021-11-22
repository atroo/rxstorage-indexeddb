export type Foo = (hey?: string | number) => void;

export const foo: Foo = async () => {
  console.log("foo");
  await Promise.resolve(1);
  return [1].includes(1);
};
