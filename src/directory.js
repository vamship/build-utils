'use strict';

import _path from 'path';

const _sepRegexp = new RegExp(_path.sep.replace(/\\/g, '\\\\'), 'g');

/**
 * Abstract representation of a directory, with methods for traversal and
 * glob pattern generation.
 */
export class Directory {
    /**
     * @param {String} path The path represented by this directory.
     */
    constructor(path) {
        if (typeof path !== 'string') {
            throw new Error('Invalid path specified (arg #1)');
        }

        let relativePath = path.replace(process.cwd(), '');
        this._name = _path.basename(_path.resolve(path));
        this._path = _path.join(relativePath, `.${_path.sep}`);

        this._absolutePath = _path.join(_path.resolve(path), _path.sep);
        this._globPath = this._absolutePath.replace(_sepRegexp, '/');

        this._children = [];
    }

    /**
     * Creates a folder tree based on an object that describes the tree
     * structure.
     *
     * @param {String} rootPath A string that represents the path to the root
     *        directory of the tree.
     * @param {Object} tree An object representation of the tree structure.
     * @return {Directory} A directory object that represents the root of
     *         the tree.
     */
    static createTree(rootPath, tree) {
        if (typeof rootPath !== 'string') {
            throw new Error('Invalid rootPath (arg #1)');
        }
        if (!tree || tree instanceof Array || typeof tree !== 'object') {
            throw new Error('Invalid tree (arg #2)');
        }

        function createRecursive(parent, tree) {
            if (typeof parent === 'string') {
                parent = new Directory(parent);
            }

            if (tree && !(tree instanceof Array) && typeof tree === 'object') {
                for (let dirName in tree) {
                    let child = parent.addChild(dirName);
                    createRecursive(child, tree[dirName]);
                }
            }
            return parent;
        }

        return createRecursive(rootPath, tree);
    }

    /**
     * Traverses a directory tree, invoking the callback function at each level
     * of the tree.
     *
     * @param {Directory} root The root level of the tree to traverse.
     * @param {Function} callback The callback function that is invoked as each
     *        directory is traversed.
     */
    static traverseTree(root, callback) {
        if (!(root instanceof Directory)) {
            throw new Error('Invalid root directory (arg #1)');
        }
        if (typeof callback !== 'function') {
            throw new Error('Invalid callback function (arg #2)');
        }
        function traverseRecursive(parent, level) {
            callback(parent, level);
            level++;
            parent.getChildren().forEach((child) => {
                traverseRecursive(child, level);
            });
        }

        return traverseRecursive(root, 0);
    }

    /**
     * Returns the name of the directory.
     *
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * Returns the relative path to this directory.
     *
     * @return {String}
     */
    get path() {
        return this._path;
    }

    /**
     * Returns the absolute path to this directory.
     *
     * @type {String}
     */
    get absolutePath() {
        return this._absolutePath;
    }

    /**
     * Returns the glob path to the file.
     */
    get globPath() {
        return this._globPath;
    }

    /**
     * Adds a child directory object to the current directory.
     *
     * @param {String} name Name of the child directory.
     */
    addChild(name) {
        if (typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid directory name specified (arg #1)');
        }
        if (name.match(/[\\/:]/)) {
            throw new Error(
                'Directory name cannot include path separators (:, \\ or /)'
            );
        }
        const child = new Directory(_path.join(this.path, name));
        this._children.push(child);

        return child;
    }

    /**
     * Retrieves a child directory object by recursively searching through the
     * current directory's child tree.
     *
     * @param {String} path The relative path to the child directory, with
     *        each path element separated by "/".
     * @return {Directory} A directory reference for the specified child. If
     *         a child is not found at the specified path, an error will be
     *         thrown.
     */
    getChild(path) {
        if (typeof path !== 'string' || path.length <= 0) {
            throw new Error('Invalid child path specified (arg #1)');
        }
        const tokens = path.split('/');
        const child = tokens.reduce((result, name) => {
            if (!result) {
                return result;
            }
            const children = result.getChildren();
            return children.find((child) => child.name === name);
        }, this);

        if (!child) {
            throw new Error(`Child not found at path: [${path}]`);
        }
        return child;
    }

    /**
     * Returns an array containing all first level children of the current
     * directory.
     *
     * @return {Directory[]} An array of first level children for the directory.
     */
    getChildren() {
        return this._children.slice();
    }

    /**
     * Returns the path to a file within the current directory. This file
     * does not have to actually exist on the file system, and can also be the
     * name of a directory.
     *
     * @param {String} fileName The name of the file.
     * @return {String} The path to the file including the current directory
     *         path.
     */
    getFilePath(fileName) {
        if (typeof fileName !== 'string') {
            fileName = '';
        }
        return _path.join(this.absolutePath, fileName);
    }

    /**
     * Returns a glob path to a file within the current directory. This file
     * does not have to actually exist on the file system, and can also be the
     * name of a directory.
     *
     * @param {String} fileName The name of the file.
     * @return {String} The path to the file including the current directory
     *         path.
     */
    getFileGlob(fileName) {
        if (typeof fileName !== 'string') {
            fileName = '';
        }
        return _path.join(this.absolutePath, fileName).replace(_sepRegexp, '/');
    }

    /**
     * Gets a string glob that can be used to match all folders/files in the
     * current folder and all sub folders, optionally filtered by file
     * extension.
     *
     * @param {String} [extension] An optional extension to use when generating
     *        a globbing pattern.
     */
    getAllFilesGlob(extension) {
        if (typeof extension !== 'string') {
            extension = '*';
        } else {
            extension = `*.${extension}`;
        }
        return `${this.globPath}**/${extension}`;
    }
}
