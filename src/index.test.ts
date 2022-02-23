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
  const g = glomp(fixturesDir);

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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

test("rootDir and resolvePath", async () => {
  const g = glomp(fixturesDir);
  expect(g.rootDir).toBe(fixturesDir);
  expect(g.resolvePath("./hi")).toBe(path.join(fixturesDir, "hi"));
  expect(g.resolvePath("/tmp/something")).toBe("/tmp/something");
  expect(g.resolvePath("dir-1/dir-b/")).toBe(
    path.join(fixturesDir, "dir-1/dir-b")
  );
});

test("withinDir", async () => {
  const g = glomp(fixturesDir).withinDir("dir-1");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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
  const g = glomp(fixturesDir).excludeDir("dir-1");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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
  const g = glomp(fixturesDir).excludeDir("dir-1").excludeDir("dir-2");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/blah.h",
      "<fixtures>/hello.txt",
    ]
  `);
});

test("withExtension", async () => {
  const g = glomp(fixturesDir).withExtension(".txt");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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
  const g = glomp(fixturesDir).excludeExtension(".txt");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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
  const g = glomp(fixturesDir).withExtension(".ts").excludeExtension(".d.ts");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("combining withExtension and excludeExtension (other way around)", async () => {
  const g = glomp(fixturesDir).excludeExtension(".d.ts").withExtension(".ts");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("immediateChildrenOfDir", async () => {
  const g = glomp(fixturesDir).immediateChildrenOfDir("dir-1");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/fox.ts",
    ]
  `);
});

test("immediateChildrenOfDir 2", async () => {
  const g = glomp(fixturesDir).immediateChildrenOfDir("dir-1/dir-b");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-1/dir-b/smiley.cfg",
    ]
  `);
});

test("excludeImmediateChildrenOfDir", async () => {
  const g = glomp(fixturesDir).excludeImmediateChildrenOfDir("dir-1");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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
  const g = glomp(fixturesDir).excludeImmediateChildrenOfDir("dir-1/dir-b");

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

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
  const g = glomp(fixturesDir).customRule((absolutePath, isDir) => {
    if (isDir) return true;

    // Should match fixtures/dir-2 and fixtures/dir-1/dir-b/dir-2
    return /dir-2/.test(absolutePath);
  });

  const results1 = await g.findMatches();
  const results2 = g.findMatchesSync();

  expect(results2).toEqual(results1);
  expect(makeRelative(results1)).toMatchInlineSnapshot(`
    [
      "<fixtures>/dir-2/foof.txt",
      "<fixtures>/dir-2/potato.d.ts",
      "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
    ]
  `);
});
