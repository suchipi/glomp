import fs from "fs";
import path from "path";
import os from "os";
import { runJobs } from "parallel-park";

/**
 * Create a new glomp instance that traverses and resolves paths relative to
 * the specified `rootDir`. If `rootDir` isn't present, it defaults to
 * `process.cwd()`.
 */
export default function glomp(): Glomp {
  return new Glomp();
}

function resolvePath(somePath: string, rootDir: string): string {
  let resolvedPath = somePath;
  if (!path.isAbsolute(somePath)) {
    resolvedPath = path.resolve(rootDir, somePath);
  }

  return resolvedPath.replace(/\/$/, "");
}

function clone(someGlomp: Glomp) {
  const newGlomp = new Glomp();
  newGlomp.rules = someGlomp.rules.slice();
  return newGlomp;
}

/**
 * An object that traverses the filesystem looking for files that
 * match a user-defined set of rules. Use the methods on the `Glomp`
 * instance to add filtering rules, then run `findMatches` or
 * `findMatchesSync` to search the filesystem for files that match
 * those filtering rules.
 */
export class Glomp {
  rules: Array<
    (info: { rootDir: string; absolutePath: string; isDir: boolean }) => boolean
  > = [];

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new rule
   * specifying that only files within the specified directory should be
   * included in the results from `findMatches` or `findMatchesSync`.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  withinDir(someDir: string): Glomp {
    return this.customRule((info) => {
      const dir = resolvePath(someDir, info.rootDir);
      return info.absolutePath.startsWith(dir);
    });
  }

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new rule
   * specifying that files within the specified directory should _NOT_ be
   * included in the results from `findMatches` or `findMatchesSync`.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  excludeDir(someDir: string): Glomp {
    return this.customRule((info) => {
      const dir = resolvePath(someDir, info.rootDir);
      return !info.absolutePath.startsWith(dir);
    });
  }

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new rule
   * specifying that only files with the specified filetype extension should
   * be included in the results from `findMatches` or `findMatchesSync`.
   */
  withExtension(extension: string): Glomp {
    let resolvedExtension = extension;
    if (!extension.startsWith(".")) {
      resolvedExtension = "." + resolvedExtension;
    }

    return this.customRule((info) => {
      if (info.isDir) return true;
      return info.absolutePath.endsWith(extension);
    });
  }

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new rule
   * specifying that files with the specified filetype extension should _NOT_
   * be included in the results from `findMatches` or `findMatchesSync`.
   */
  excludeExtension(extension: string): Glomp {
    let resolvedExtension = extension;
    if (!extension.startsWith(".")) {
      resolvedExtension = "." + resolvedExtension;
    }

    return this.customRule((info) => {
      if (info.isDir) return true;
      return !info.absolutePath.endsWith(resolvedExtension);
    });
  }

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new rule
   * specifying that only files which are **immediate children** of the
   * specified directory should be included in the results from `findMatches`
   * or `findMatchesSync`.
   *
   * This means that files that exist in subdirectories of the specified
   * directory will _NOT_ be included. If you want to include all files
   * *including* those in subdirectories, use `withinDir` instead.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  immediateChildrenOfDir(someDir: string): Glomp {
    return this.customRule((info) => {
      const dir = resolvePath(someDir, info.rootDir);

      if (info.isDir) {
        if (dir.startsWith(info.absolutePath)) {
          // Need to descend past here to find its children
          return true;
        } else {
          return false;
        }
      }

      return path.dirname(info.absolutePath) === dir;
    });
  }

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new rule
   * specifying that files which are **immediate children** of the specified
   * directory should _NOT_ be included in the results from `findMatches` or
   * `findMatchesSync`. However, files that exist in subdirectories of the
   * specified directory _will_ be included. If you want to exclude all of
   * the contents of a directory, including files in subdirectories of that
   * directory, use `excludeDir` instead.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  excludeImmediateChildrenOfDir(someDir: string): Glomp {
    return this.customRule((info) => {
      if (info.isDir) return true;
      const dir = resolvePath(someDir, info.rootDir);

      return path.dirname(info.absolutePath) !== dir;
    });
  }

  /**
   * Return a new Glomp with all the rules of this Glomp plus a new custom
   * rule that determines whether paths should be included in the results from
   * `findMatches` or `findMatchesSync`.
   *
   * Rules are functions with this signature:
   * ```ts
   * function myRule(info: {
   *   absolutePath: string,
   *   isDir: boolean,
   *   rootDir: string
   * }): boolean;
   * ```
   *
   * The rule function will be called repeatedly with absolute paths referring
   * to files and folders on disk, and should return either true or false.
   *
   * When `info.isDir` is false, that means that Glomp is asking you:
   *
   * "`info.absolutePath` refers to a file. Should this file be included in the
   * results from `findMatches` or `findMatchesSync`?""
   *
   * - If the answer is no, return `false`, indicating that this file should
   *   _NOT_ be included in the output.
   *
   * - If the answer is yes, return `true`, indicating that this file _should_
   *   be included in the output.
   *
   * When `info.isDir` is true, that means that Glomp is asking you:
   *
   * "`info.absolutePath` refers to a directory. Could there be any files in this
   * directory that should be included in the results from `findMatches` or
   * `findMatchesSync`?"
   *
   * - If the answer is yes, return `true`, indicating that the contents of
   *   the directory should be searched through.
   *
   * - If you know that that folder won't have any files you want, then
   *   return `false`, indicating that there is no need to search through the
   *   contents of that firectory.
   *
   * `info.rootDir` contains the absolute path to the root directory passed to
   * `findMatches` or `findMatchesSync`.
   *
   * Internally, all the rule-defining methods on a Glomp use the same
   * rule mechanism as `customRule`.
   */
  customRule(
    rule: (info: {
      rootDir: string;
      absolutePath: string;
      isDir: boolean;
    }) => boolean
  ): Glomp {
    const newGlomp = clone(this);
    newGlomp.rules.push(rule);
    return newGlomp;
  }

  /**
   * Create a new Glomp by combining the rules in this Glomp with the rules in
   * another Glomp.
   *
   * The new Glomp will only match files that satisfy the rules in both Glomps.
   *
   * @param other The other Glomp to combine with.
   */
  and(other: Glomp): Glomp {
    const newGlomp = clone(this);

    newGlomp.rules.push(...other.rules);

    return newGlomp;
  }

  /**
   * Create a new Glomp by combining the rules in this Glomp with the rules in
   * another Glomp.
   *
   * The new Glomp will only match files that satisfy the rules in this Glomp
   * and DO NOT satisfy the rules in the other Glomp.
   *
   * This is the same as .and(other.inverse()), but using it makes your code
   * easier to read, because the "inverse" part would otherwise be at the
   * bottom of a long chain.
   *
   * @param other The other Glomp to combine with.
   */
  andNot(other: Glomp): Glomp {
    return this.and(other.inverse());
  }

  /**
   * Create a new Glomp by combining the rules in this Glomp with the rules in
   * another Glomp.
   *
   * The new Glomp will match files that satisfy the rules in either this Glomp or the other one.
   *
   * @param other The other Glomp to combine with.
   */
  or(other: Glomp): Glomp {
    const newGlomp = new Glomp();

    newGlomp.rules.push((info) => {
      const selfIsHappy = this.rules.every((rule) => rule(info));
      if (selfIsHappy) return true;
      const otherIsHappy = other.rules.every((rule) => rule(info));
      return selfIsHappy || otherIsHappy;
    });

    return newGlomp;
  }

  /**
   * Create a new Glomp by inverting all the rules in this glomp.
   *
   * The new Glomp will exclude files that this Glomp matches.
   *
   * @param other The other Glomp to combine with.
   */
  inverse() {
    const newGlomp = clone(this);

    newGlomp.rules = this.rules.map((rule) => {
      return (info) => {
        // We still want to be able to traverse into directories properly,
        // so only invert the rule when we're talking about a file.
        if (info.isDir) return true;
        return !rule(info);
      };
    });

    return newGlomp;
  }

  /**
   * Asynchronously scan through the specified folder, finding files
   * that match the rules that have been defined on this Glomp instance.
   *
   * To define rules, use any of these methods:
   * - `withinDir`
   * - `excludeDir`
   * - `withExtension`
   * - `excludeExtension`
   * - `immediateChildrenOfDir`
   * - `excludeImmediateChildrenOfDir`
   * - `customRule`
   *
   * After the relevant directories have all been searched, the Promise
   * returned from this function will resolve to an Array of absolute path
   * strings to any located files that match your rules.
   *
   * Note that ONLY PATHS TO FILES WILL BE RETURNED, _NOT_ PATHS TO
   * FOLDERS! This is an intentional design decision of `glomp`.
   *
   * ---
   *
   * In order to scan the filesystem quickly, multiple Promises will run
   * concurrently to scan the filesystem. If you'd like to, you can customize
   * how many Promises run in parallel by passing an object with a
   * `concurrency` property on it, set to a number.
   *
   * A higher concurrency number will attempt to perform more fs operations at
   * once, while a lower one will stretch the fs operations out over time,
   * limiting CPU and disk usage at the expense of clock run-time.
   *
   * The concurrency value defaults to the number of CPUs your system has
   * minus one.
   */
  async findMatches(
    rootDir: string,
    {
      concurrency = os.cpus().length - 1,
    }: {
      /**
       * How many concurrent fs-scanning Promises are allowed at one time.
       *
       * Default to os.cpus().length - 1.
       */
      concurrency?: number;
    } = {}
  ): Promise<Array<string>> {
    const searchPaths = [rootDir];

    const matches: Array<string> = [];

    await runJobs(
      searchPaths,
      async (dir) => {
        const dirStats = await fs.promises.stat(dir);
        const isDir = dirStats.isDirectory();
        if (!isDir) {
          throw new Error(
            "Expected path to be a directory, but it wasn't: " + dir
          );
        }

        const children = await fs.promises.readdir(dir);
        for (const child of children) {
          const pathToChild = path.join(dir, child);

          const childStats = await fs.promises.stat(pathToChild);
          if (childStats.isDirectory()) {
            let shouldTraverse = true;
            for (const rule of this.rules) {
              shouldTraverse = rule({
                absolutePath: pathToChild,
                isDir: true,
                rootDir,
              });
              if (!shouldTraverse) break;
            }

            if (shouldTraverse) {
              searchPaths.push(pathToChild);
            }
          } else {
            let doesMatch = true;
            for (const rule of this.rules) {
              doesMatch = rule({
                absolutePath: pathToChild,
                isDir: false,
                rootDir,
              });
              if (!doesMatch) break;
            }
            if (doesMatch) {
              matches.push(pathToChild);
            }
          }
        }
      },
      { concurrency }
    );

    return matches;
  }

  /**
   * Synchronously scans through the specified folder, finding files
   * that match the rules that have been defined on this Glomp instance.
   *
   * To define rules, use any of these methods:
   * - `withinDir`
   * - `excludeDir`
   * - `withExtension`
   * - `excludeExtension`
   * - `immediateChildrenOfDir`
   * - `excludeImmediateChildrenOfDir`
   * - `customRule`
   *
   * After the relevant directories have all been searched, this function will
   * return an Array of absolute path strings to any located files that match
   * your rules.
   *
   * Note that ONLY PATHS TO FILES WILL BE RETURNED, _NOT_ PATHS TO
   * FOLDERS! This is an intentional design decision of `glomp`.
   */
  findMatchesSync(rootDir: string): Array<string> {
    const searchPaths = [rootDir];

    const matches: Array<string> = [];

    const searchPathsIterable = searchPaths[Symbol.iterator]();
    for (const dir of searchPathsIterable) {
      const dirStats = fs.statSync(dir);
      const isDir = dirStats.isDirectory();
      if (!isDir) {
        throw new Error(
          "Expected path to be a directory, but it wasn't: " + dir
        );
      }

      const children = fs.readdirSync(dir);
      for (const child of children) {
        const pathToChild = path.join(dir, child);

        const childStats = fs.statSync(pathToChild);
        if (childStats.isDirectory()) {
          let shouldTraverse = true;
          for (const rule of this.rules) {
            shouldTraverse = rule({
              absolutePath: pathToChild,
              isDir: true,
              rootDir,
            });
            if (!shouldTraverse) break;
          }

          if (shouldTraverse) {
            searchPaths.push(pathToChild);
          }
        } else {
          let doesMatch = true;
          for (const rule of this.rules) {
            doesMatch = rule({
              absolutePath: pathToChild,
              isDir: false,
              rootDir,
            });
            if (!doesMatch) break;
          }
          if (doesMatch) {
            matches.push(pathToChild);
          }
        }
      }
    }

    return matches;
  }
}
