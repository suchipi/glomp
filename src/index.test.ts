import path from "path";
import { test, expect } from "vitest";
import glomp from "./index";

const fixturesDir = path.join(__dirname, "fixtures");

function makeRelative(paths: Array<string>) {
  return paths.map((somePath) =>
    somePath.replace(new RegExp("^" + fixturesDir), "<fixtures>")
  );
}

test("no rules", async () => {
  const g = glomp();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("withinDir", async () => {
  const g = glomp().withinDir("dir-1");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("excludeDir", async () => {
  const g = glomp().excludeDir("dir-1");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
    ]
  `);
});

test("double excludeDir", async () => {
  const g = glomp().excludeDir("dir-1").excludeDir("dir-2");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
    ]
  `);
});

test("withExtension", async () => {
  const g = glomp().withExtension(".txt");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/hello.txt",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("excludeExtension", async () => {
  const g = glomp().excludeExtension(".txt");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
    ]
  `);
});

test("combining withExtension and excludeExtension", async () => {
  const g = glomp().withExtension(".ts").excludeExtension(".d.ts");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("combining withExtension and excludeExtension (other way around)", async () => {
  const g = glomp().excludeExtension(".d.ts").withExtension(".ts");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("immediateChildrenOfDir", async () => {
  const g = glomp().immediateChildrenOfDir("dir-1");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("immediateChildrenOfDir 2", async () => {
  const g = glomp().immediateChildrenOfDir("dir-1/dir-b");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/dir-b/smiley.cfg",
    ]
  `);
});

test("excludeImmediateChildrenOfDir", async () => {
  const g = glomp().excludeImmediateChildrenOfDir("dir-1");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);

  // Note that the non-immediate children of dir-1 (fox.ts) is excluded,
  // but deeper children of dir-1 are included.
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("excludeImmediateChildrenOfDir 2", async () => {
  const g = glomp().excludeImmediateChildrenOfDir("dir-1/dir-b");

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  // Note that the non-immediate children of dir-b (smiley.cfg) is excluded,
  // but deeper children of dir-b are included.
  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("customRule", async () => {
  const g = glomp().customRule(({ absolutePath, isDir }) => {
    if (isDir) return true;

    // Should match fixtures/dir-2 and fixtures/dir-1/dir-b/dir-2
    return /dir-2/.test(absolutePath);
  });

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("and", async () => {
  const g = glomp().withinDir("dir-2").and(glomp().withExtension(".txt"));

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-2/foof.txt",
    ]
  `);
});

test("or", async () => {
  const g = glomp().withinDir("dir-2").or(glomp().withExtension(".txt"));

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/hello.txt",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("inverse", async () => {
  const g = glomp().withExtension(".txt").inverse();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
    ]
  `);
});

test("andNot", async () => {
  const g = glomp().withinDir("dir-2").andNot(glomp().withExtension(".txt"));

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-2/potato.d.ts",
    ]
  `);
});

test("immediateChildrenOfDir and inverse", async () => {
  const g = glomp().immediateChildrenOfDir("dir-1").inverse();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("excludeImmediateChildrenOfDir and inverse", async () => {
  const g = glomp().excludeImmediateChildrenOfDir("dir-1").inverse();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);

  // Note that the non-immediate children of dir-1 (fox.ts) is excluded,
  // but deeper children of dir-1 are included.
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("withExtension and inverse", async () => {
  const g = glomp().withExtension(".ts").inverse();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-1/dir-b/smiley.cfg",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});

test("excludeExtension and inverse", async () => {
  const g = glomp().excludeExtension(".ts").inverse();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-2/potato.d.ts",
    ]
  `);
});

test("or and inverse", async () => {
  const g = glomp()
    .withExtension(".h")
    .or(glomp().withExtension(".cfg"))
    .inverse();

  const results1 = await g.findMatches(fixturesDir);
  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/hello.txt",
      "<fixtures>/dir-1/fox.ts",
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});
