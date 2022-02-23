import fs from "fs";
import path from "path";
import { runJobs } from "parallel-park";

export default function glomp(rootDir: string = process.cwd()): Glomp {
  return new Glomp(rootDir);
}

export class Glomp {
  rules: Array<(absolutePath: string, isDir: boolean) => boolean> = [];
  rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  resolvePath(somePath: string) {
    let resolvedPath = somePath;
    if (!path.isAbsolute(somePath)) {
      resolvedPath = path.resolve(this.rootDir, somePath);
    }

    return resolvedPath.replace(/\/$/, "");
  }

  withinDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, _isDir) => {
      return absolutePath.startsWith(dir);
    });
    return this;
  }

  excludeDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, _isDir) => {
      return !absolutePath.startsWith(dir);
    });
    return this;
  }

  withExtension(extension: string): this {
    this.rules.push((absolutePath, isDir) => {
      if (isDir) return true;
      return absolutePath.endsWith(extension);
    });
    return this;
  }

  excludeExtension(extension: string): this {
    this.rules.push((absolutePath, _isDir) => {
      return !absolutePath.endsWith(extension);
    });
    return this;
  }

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

  excludeImmediateChildrenOfDir(someDir: string): this {
    const dir = this.resolvePath(someDir);
    this.rules.push((absolutePath, isDir) => {
      if (isDir) return true;

      return path.dirname(absolutePath) !== dir;
    });
    return this;
  }

  customRule(rule: (absolutePath: string, isDir: boolean) => boolean) {
    this.rules.push(rule);
    return this;
  }

  async findMatches(): Promise<Array<string>> {
    const searchPaths = [this.rootDir];

    const matches: Array<string> = [];

    await runJobs(searchPaths, async (dir) => {
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
    });

    return matches;
  }

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
