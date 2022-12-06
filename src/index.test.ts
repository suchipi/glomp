import path from "path";
import { test, expect } from "vitest";
import glomp, { Glomp } from "./index";

const fixturesDir = path.join(__dirname, "fixtures");

function makeRelative(paths: Array<string>) {
  return paths.map((somePath) =>
    somePath.replace(new RegExp("^" + fixturesDir), "<fixtures>")
  );
}

async function run(g: Glomp) {
  const traces: Array<string> = [];
  g.trace = (message) =>
    traces.push(message.replace(new RegExp(fixturesDir, "g"), "<fixtures>"));

  const results1 = await g.findMatches(fixturesDir);
  g.trace = undefined;

  const results2 = g.findMatchesSync(fixturesDir);

  expect(results2).toEqual(results1);

  return {
    traces: "\n" + traces.join("\n\n"),
    results: makeRelative(results1),
  };
}

test("no rules", async () => {
  const g = glomp;

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    ",
    }
  `);
});

test("withinDir", async () => {
  const g = glomp.withinDir("dir-1");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("withinDir multiple elements", async () => {
  const g = glomp.withinDir("dir-1/dir-b");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/dir-b/smiley.cfg",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeDir", async () => {
  const g = glomp.excludeDir("dir-1");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
      ],
      "traces": "
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeDir multiple elements", async () => {
  const g = glomp.excludeDir("dir-1/dir-b");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
      ],
      "traces": "
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("double excludeDir", async () => {
  const g = glomp.excludeDir("dir-1").excludeDir("dir-2");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
      ],
      "traces": "
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    excludeDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("withExtension", async () => {
  const g = glomp.withExtension(".txt");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/hello.txt",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeExtension", async () => {
  const g = glomp.excludeExtension(".txt");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
      ],
      "traces": "
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("combining withExtension and excludeExtension", async () => {
  const g = glomp.withExtension(".ts").excludeExtension(".d.ts");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
      ],
      "traces": "
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("combining withExtension and excludeExtension (other way around)", async () => {
  const g = glomp.excludeExtension(".d.ts").withExtension(".ts");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
      ],
      "traces": "
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".d.ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("immediateChildrenOfDir", async () => {
  const g = glomp.immediateChildrenOfDir("dir-1");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
      ],
      "traces": "
    immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("immediateChildrenOfDir 2", async () => {
  const g = glomp.immediateChildrenOfDir("dir-1/dir-b");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/dir-b/smiley.cfg",
      ],
      "traces": "
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    immediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeImmediateChildrenOfDir", async () => {
  const g = glomp.excludeImmediateChildrenOfDir("dir-1");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeImmediateChildrenOfDir 2", async () => {
  const g = glomp.excludeImmediateChildrenOfDir("dir-1/dir-b");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    excludeImmediateChildrenOfDir(\\"dir-1/dir-b\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("customRule", async () => {
  const g = glomp.customRule(({ absolutePath, isDir }) => {
    if (isDir) return true;

    // Should match fixtures/dir-2 and fixtures/dir-1/dir-b/dir-2
    return /dir-2/.test(absolutePath);
  }, "myCustomRule");

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    myCustomRule with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("customRule (no name)", async () => {
  const g = glomp.customRule(({ absolutePath, isDir }) => {
    if (isDir) return true;

    // Should match fixtures/dir-2 and fixtures/dir-1/dir-b/dir-2
    return /dir-2/.test(absolutePath);
  });

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    <anonymous> with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("and", async () => {
  const g = glomp.withinDir("dir-2").and(glomp.withExtension(".txt"));

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-2/foof.txt",
      ],
      "traces": "
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("or", async () => {
  const g = glomp.withinDir("dir-2").or(glomp.withExtension(".txt"));

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/hello.txt",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    or(
      withinDir(\\"dir-2\\"),
      withExtension(\\".txt\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("inverse", async () => {
  const g = glomp.withExtension(".txt").inverse();

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
      ],
      "traces": "
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("andNot", async () => {
  const g = glomp.withinDir("dir-2").andNot(glomp.withExtension(".txt"));

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-2/potato.d.ts",
      ],
      "traces": "
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withinDir(\\"dir-2\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".txt\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("immediateChildrenOfDir and inverse", async () => {
  const g = glomp.immediateChildrenOfDir("dir-1").inverse();

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of immediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeImmediateChildrenOfDir and inverse", async () => {
  const g = glomp.excludeImmediateChildrenOfDir("dir-1").inverse();

  // This means "only the immediate children of dir"
  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
      ],
      "traces": "
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of excludeImmediateChildrenOfDir(\\"dir-1\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("withExtension and inverse", async () => {
  const g = glomp.withExtension(".ts").inverse();

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/blah.h",
        "<fixtures>/hello.txt",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-1/dir-b/smiley.cfg",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("excludeExtension and inverse", async () => {
  const g = glomp.excludeExtension(".ts").inverse();

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/potato.d.ts",
      ],
      "traces": "
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of inversion of withExtension(\\".ts\\") with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});

test("or and inverse", async () => {
  const g = glomp.withExtension(".h").or(glomp.withExtension(".cfg")).inverse();

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/hello.txt",
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    inversion of or(
      withExtension(\\".h\\"),
      withExtension(\\".cfg\\")
    ) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("withAbsolutePathMatchingRegExp", async () => {
  const g = glomp.withAbsolutePathMatchingRegExp(/dir-2/);

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-2/foof.txt",
        "<fixtures>/dir-2/potato.d.ts",
        "<fixtures>/dir-1/dir-b/dir-2/blah.txt",
      ],
      "traces": "
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withAbsolutePathMatchingRegExp(/dir-2/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true",
    }
  `);
});

test("withNameMatchingRegExp", async () => {
  // dir- in the regexp here verifies that we're only matching
  // against file name, not against the entire file path
  const g = glomp.withNameMatchingRegExp(/dir-|fo/);

  expect(await run(g)).toMatchInlineSnapshot(`
    {
      "results": [
        "<fixtures>/dir-1/fox.ts",
        "<fixtures>/dir-2/foof.txt",
      ],
      "traces": "
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/blah.h\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/hello.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/fox.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/foof.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-2/potato.d.ts\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2\\",
      \\"isDir\\": true,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> true
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/smiley.cfg\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false
    
    withNameMatchingRegExp(/dir-|fo/) with {
      \\"absolutePath\\": \\"<fixtures>/dir-1/dir-b/dir-2/blah.txt\\",
      \\"isDir\\": false,
      \\"rootDir\\": \\"<fixtures>\\"
    } -> false",
    }
  `);
});
