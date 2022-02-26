# glomp

> Lightweight, clearly-defined alternative to file glob strings

## The Problem

File globs like `./src/**/*.js` are great... until you get to know them.

- Globbing libraries are big and complicated
- The behavior of `**` and `*` differs depending on the library or context (for instance, bash treats `**/*` differently depending on if the globstar option is set, but the globstar option isn't available in older versions of bash)
- Debugging globs is _hard_
- It's not always obvious how libraries will interpret non-absolute glob paths
  - For instance, `./package.json` could refer to lots of different files depending on what the current working directory is when the library parses files
- Some libraries include files starting with a `.` in their results by default, but others don't
- Some libraries automatically expand folder globs to end with `**/*`, and others don't.
  - For instance, in tsconfig, `src` means `src/**/*`, but in bash, `src` only means `src`.
- It's not obvious how they compose together; does a file need to match _all_ of the globs in the list, or just one?

If you work with glob strings a lot, this kind of stuff starts to bite you over and over, and it gets old. Despite their prevalence, glob strings are _far_ from standardized.

This is particularly annoying when you consider that for 90% of projects, they only care about a particular subset of glob syntax, but we're using these huge globbing libraries despite that.

## This Library's Solution

So, this library provides a way to find files on disk that match a particular pattern, but it _doesn't_ use glob strings. This makes it:

- Easier to debug (just drop a console.log in the relevant match rule function)
- Easier to understand (the library is very small, and its semantics are clearly-defined)
- Composable (combine multiple patterns together using `.and`, `.andNot`, `.or`, and `.inverse`)

Here's a taste of what it looks like:

```ts
// Instead of this:
import fastGlob from "fast-glob";

const filePaths = await fastGlob([
  "**/*.ts",
  "!**/*.d.ts",
  "!node_modules/**/*",
]);

// You do this:
import glomp from "glomp";

const filePaths = await glomp()
  .withExtension(".ts")
  .excludeExtension(".d.ts")
  .excludeDir("node_modules")
  .findMatches(process.cwd());
```

## API Documentation

Please see [api/index.d.ts](https://github.com/suchipi/glomp/blob/main/api/index.d.ts) for API documentation. There are lots of comments.

## License

MIT
