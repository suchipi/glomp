/**
 * An object that traverses the filesystem looking for files that
 * match a user-defined set of rules. Use the methods on the `Glomp`
 * instance to add filtering rules, then run `findMatches` or
 * `findMatchesSync` to search the filesystem for files that match
 * those filtering rules.
 */
export declare class Glomp {
    rules: Array<(info: {
        rootDir: string;
        absolutePath: string;
        isDir: boolean;
    }) => boolean>;
    trace?: (message: string) => void;
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
    withinDir(someDir: string): Glomp;
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
    excludeDir(someDir: string): Glomp;
    /**
     * Return a new Glomp with all the rules of this Glomp plus a new rule
     * specifying that only files with the specified filetype extension should
     * be included in the results from `findMatches` or `findMatchesSync`.
     */
    withExtension(extension: string): Glomp;
    /**
     * Return a new Glomp with all the rules of this Glomp plus a new rule
     * specifying that files with the specified filetype extension should _NOT_
     * be included in the results from `findMatches` or `findMatchesSync`.
     */
    excludeExtension(extension: string): Glomp;
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
    immediateChildrenOfDir(someDir: string): Glomp;
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
    excludeImmediateChildrenOfDir(someDir: string): Glomp;
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
    customRule(rule: (info: {
        rootDir: string;
        absolutePath: string;
        isDir: boolean;
    }) => boolean, name?: string): Glomp;
    /**
     * Create a new Glomp by combining the rules in this Glomp with the rules in
     * another Glomp.
     *
     * The new Glomp will only match files that satisfy the rules in both Glomps.
     *
     * @param other The other Glomp to combine with.
     */
    and(other: Glomp): Glomp;
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
    andNot(other: Glomp): Glomp;
    /**
     * Create a new Glomp by combining the rules in this Glomp with the rules in
     * another Glomp.
     *
     * The new Glomp will match files that satisfy the rules in either this Glomp or the other one.
     *
     * @param other The other Glomp to combine with.
     */
    or(other: Glomp): Glomp;
    /**
     * Create a new Glomp by inverting all the rules in this glomp.
     *
     * The new Glomp will exclude files that this Glomp matches.
     *
     * @param other The other Glomp to combine with.
     */
    inverse(): Glomp;
    /**
     * Return a new Glomp with all the rules of this Glomp plus a new rule
     * specifying that the entire absolute path to a file must match the provided
     * regular expression.
     */
    withAbsolutePathMatchingRegExp(regexp: RegExp): Glomp;
    /**
     * Return a new Glomp with all the rules of this Glomp plus a new rule
     * specifying that filenames must match the provided regular expression.
     */
    withNameMatchingRegExp(regexp: RegExp): Glomp;
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
     * - `withAbsolutePathMatchingRegExp`
     * - `withNameMatchingRegExp`
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
    findMatches(rootDir: string, { concurrency, }?: {
        /**
         * How many concurrent fs-scanning Promises are allowed at one time.
         *
         * Default to os.cpus().length - 1.
         */
        concurrency?: number;
    }): Promise<Array<string>>;
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
    findMatchesSync(rootDir: string): Array<string>;
}
/**
 * The default Glomp instance, from which all other Glomps can be created.
 */
declare const glomp: Glomp;
export default glomp;
