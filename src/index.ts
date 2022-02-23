import fs from "fs";
import path from "path";
import os from "os";
import { runJobs } from "parallel-park";

/**
 * Create a new glomp instance that traverses and resolves paths relative to
 * the specified `rootDir`. If `rootDir` isn't present, it defaults to
 * `process.cwd()`.
 */
export default function glomp(rootDir: string = process.cwd()): Glomp {
  return new Glomp(rootDir);
}

/**
 * An object that traverses the filesystem looking for files that
 * match a user-defined set of rules. Use the methods on the `Glomp`
 * instance to add filtering rules, then run `findMatches` or
 * `findMatchesSync` to search the filesystem for files that match
 * those filtering rules.
 */
export class Glomp {
  rules: Array<(absolutePath: string, isDir: boolean) => boolean> = [];
  rootDir: string;

  /**
   * Create a new glomp instance that traverses and resolves paths relative to
   * the specified `rootDir`.
   */
  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * A utility function that resolves `somePath` relative to this Glomp's
   * rootDir, and strips a trailing slash off of the end of said path, if
   * present.
   *
   * If `somePath` is absolute, it not be resolved relative to rootDir, but the
   * trailing slash will still be stripped off.
   */
  resolvePath(somePath: string): string {
    let resolvedPath = somePath;
    if (!path.isAbsolute(somePath)) {
      resolvedPath = path.resolve(this.rootDir, somePath);
    }

    return resolvedPath.replace(/\/$/, "");
  }

  /**
   * Add a rule to this Glomp specifying that only files within
   * the specified directory should be included in the results
   * from `findMatches` or `findMatchesSync`.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  withinDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, _isDir) => {
      return absolutePath.startsWith(dir);
    });
    return this;
  }

  /**
   * Add a rule to this Glomp specifying that files within
   * the specified directory should _NOT_ be included in the results
   * from `findMatches` or `findMatchesSync`.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  excludeDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, _isDir) => {
      return !absolutePath.startsWith(dir);
    });
    return this;
  }

  /**
   * Add a rule to this Glomp specifying that only files with the
   * specified filetype extension should be included in the results
   * from `findMatches` or `findMatchesSync`.
   */
  withExtension(extension: string): this {
    let resolvedExtension = extension;
    if (!extension.startsWith(".")) {
      resolvedExtension = "." + resolvedExtension;
    }

    this.rules.push((absolutePath, isDir) => {
      if (isDir) return true;
      return absolutePath.endsWith(extension);
    });
    return this;
  }

  /**
   * Add a rule to this Glomp specifying that files with the specified filetype
   * extension should _NOT_ be included in the results from `findMatches` or
   * `findMatchesSync`.
   */
  excludeExtension(extension: string): this {
    this.rules.push((absolutePath, _isDir) => {
      return !absolutePath.endsWith(extension);
    });
    return this;
  }

  /**
   * Add a rule to this Glomp specifying that only files which are
   * **immediate children** of the specified directory should be included in
   * the results from `findMatches` or `findMatchesSync`. This means that files
   * that exist in subdirectories of the specified directotry will _NOT_ be
   * included. If you want to include all files *including* those in
   * subdirectories, use `withinDir` instead.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  immediateChildrenOfDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, isDir) => {
      if (isDir) {
        if (dir.startsWith(absolutePath)) {
          // Need to descend past here to find its children
          return true;
        } else {
          return false;
        }
      }

      return path.dirname(absolutePath) === dir;
    });
    return this;
  }

  /**
   * Add a rule to this Glomp specifying that files which are
   * **immediate children** of the specified directory should _NOT_ be
   * included in the results from `findMatches` or `findMatchesSync`. However,
   * files that exist in subdirectories of the specified directory _will_ be
   * included. If you want to exclude all of the contents of a directory,
   * including files in subdirectories of that directory, use `excludeDir`
   * instead.
   *
   * If `someDir` isn't an absolute path, it will be resolved into
   * an absolute path by using the Glomp's rootDir property as
   * the directory to resolve from. If this isn't desired, pass
   * in an absolute path instead.
   */
  excludeImmediateChildrenOfDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, isDir) => {
      if (isDir) return true;

      return path.dirname(absolutePath) !== dir;
    });
    return this;
  }

  /**
   * Add a custom rule to this Glomp that determines whether paths should
   * be included in the results from `findMatches` or `findMatchesSync`.
   *
   * Rules are functions with this signature:
   * ```ts
   * function myRule(absolutePath: string, isDir: boolean): boolean;
   * ```
   *
   * The rule function will be called repeatedly with absolute paths referring
   * to files and folders on disk, and should return either true or false.
   *
   * When `isDir` is false, that means that Glomp is asking you:
   *
   * "`absolutePath` refers to a file. Should this file be included in the
   * results from `findMatches` or `findMatchesSync`?""
   *
   * - If the answer is no, return `false`, indicating that this file should
   *   _NOT_ be included in the output.
   *
   * - If the answer is yes, return `true`, indicating that this file _should_
   *   be included in the output.
   *
   * When `isDir` is true, that means that Glomp is asking you:
   *
   * "`absolutePath` refers to a directory. Could there be any files in this
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
   * Internally, all the rule-defining methods on a Glomp use the same
   * rule mechanism as `customRule`.
   */
  customRule(rule: (absolutePath: string, isDir: boolean) => boolean) {
    this.rules.push(rule);
    return this;
  }

  /**
   * Asynchronously scan through folders in the filesystem, finding files
   * that match the rules that have been defined on this Glomp instance.
   *
   * To define rules on this Glomp instance, use any of these methods:
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
  async findMatches({
    concurrency = os.cpus().length - 1,
  }: {
    /**
     * How many concurrent fs-scanning Promises are allowed at one time.
     *
     * Default to os.cpus().length - 1.
     */
    concurrency?: number;
  } = {}): Promise<Array<string>> {
    const searchPaths = [this.rootDir];

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
              shouldTraverse = rule(pathToChild, true);
              if (!shouldTraverse) break;
            }

            if (shouldTraverse) {
              searchPaths.push(pathToChild);
            }
          } else {
            let doesMatch = true;
            for (const rule of this.rules) {
              doesMatch = rule(pathToChild, false);
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
   * Synchronously scans through folders in the filesystem, finding files
   * that match the rules that have been defined on this Glomp instance.
   *
   * To define rules on this Glomp instance, use any of these methods:
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
  findMatchesSync(): Array<string> {
    const searchPaths = [this.rootDir];

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
            shouldTraverse = rule(pathToChild, true);
            if (!shouldTraverse) break;
          }

          if (shouldTraverse) {
            searchPaths.push(pathToChild);
          }
        } else {
          let doesMatch = true;
          for (const rule of this.rules) {
            doesMatch = rule(pathToChild, false);
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
