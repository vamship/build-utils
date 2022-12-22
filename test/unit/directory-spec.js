import { Directory } from '../../src/directory.js';
import _path from 'path';
import {
    getAllButString,
    getAllButObject,
    getAllButArray,
    makeOptional,
    getAllButFunction,
} from '../utils/data-generator.js';
import { jest } from '@jest/globals';

function _createPath(...components) {
    return components.join(_path.sep);
}

describe('[Directory]', () => {
    function _createTree() {
        return {
            src: {
                handlers: null,
                devices: null,
                data: null,
            },
            test: {
                unit: {
                    handlers: null,
                    devices: null,
                    data: null,
                },
            },
            working: null,
            '.tmp': null,
            '.coverage': null,
        };
    }

    describe('[Static Members]', () => {
        it('should expose the expected static members', () => {
            expect(typeof Directory.createTree).toBe('function');
            expect(typeof Directory.traverseTree).toBe('function');
        });

        describe('createTree()', () => {
            function _verifyDirectory(parent, name) {
                const child = parent.getChildren().find((dir) => {
                    return dir.name === name;
                });
                expect(child).toBeInstanceOf(Directory);

                const expectedPath = _path.join(parent.path, name, _path.sep);
                expect(child.path).toBe(expectedPath);
                return child;
            }

            function _verifyLeaves(parent, ...children) {
                children.forEach((childName) => {
                    const child = _verifyDirectory(parent, childName);
                    expect(child.getChildren()).toEqual([]);
                });
            }

            getAllButString().forEach((rootPath) => {
                it(`should throw an error if invoked without a valid root path (value=${typeof rootPath})`, () => {
                    const error = 'Invalid rootPath (arg #1)';
                    const tree = _createTree();
                    const wrapper = () => Directory.createTree(rootPath, tree);
                    expect(wrapper).toThrowError(error);
                });
            });

            getAllButObject().forEach((tree) => {
                it(`should throw an error if invoked without a valid tree object (value=${typeof tree})`, () => {
                    const error = 'Invalid tree (arg #2)';
                    const rootPath = '.';
                    const wrapper = () => Directory.createTree(rootPath, tree);
                    expect(wrapper).toThrowError(error);
                });
            });

            it('should return a directory with no children if the tree is empty', () => {
                const rootPath = '.';
                const tree = _createTree();
                const root = Directory.createTree(rootPath, tree);

                expect(root).toBeInstanceOf(Directory);
                expect(root.path).toBe(_createPath('.', ''));
            });

            it('should add a child directory for each member of the tree', () => {
                const rootPath = './';
                const tree = {
                    foo: null,
                    bar: null,
                    baz: null,
                    chaz: null,
                    faz: null,
                };
                const root = Directory.createTree(rootPath, tree);
                _verifyLeaves(root, 'foo', 'bar', 'baz', 'chaz', 'faz');
            });

            it('should create a sub tree for each child that references an object', () => {
                const rootPath = './';
                const tree = _createTree();
                const root = Directory.createTree(rootPath, tree);

                expect(root.getChildren()).toHaveLength(5);
                _verifyLeaves(root, 'working', '.tmp', '.coverage');

                const src = _verifyDirectory(root, 'src');
                expect(src.getChildren()).toHaveLength(3);
                _verifyLeaves(src, 'handlers', 'devices', 'data');

                const test = _verifyDirectory(root, 'test');
                expect(test.getChildren()).toHaveLength(1);

                const unit = _verifyDirectory(test, 'unit');
                expect(unit.getChildren()).toHaveLength(3);
                _verifyLeaves(unit, 'handlers', 'devices', 'data');
            });

            it('should not add subtrees if the values are not objects', () => {
                const rootPath = './';
                const tree = {
                    foo: 'foobar',
                    bar: 123,
                    baz: true,
                    chaz: [],
                    faz: () => {},
                    raz: null,
                    zaz: undefined,
                };
                const root = Directory.createTree(rootPath, tree);
                _verifyLeaves(
                    root,
                    'foo',
                    'bar',
                    'baz',
                    'chaz',
                    'faz',
                    'raz',
                    'zaz'
                );
            });
        });

        describe('traverseTree()', () => {
            getAllButObject({}).forEach((root) => {
                it(`should throw an error if invoked without a directory object (value=${typeof root})`, () => {
                    const error = 'Invalid root directory (arg #1)';
                    const callback = jest.fn(() => undefined);
                    const wrapper = () =>
                        Directory.traverseTree(root, callback);
                    expect(wrapper).toThrowError(error);
                });
            });

            getAllButFunction().forEach((callback) => {
                it(`should throw an error if invoked without a callback (value=${typeof callback})`, () => {
                    const error = 'Invalid callback function (arg #2)';
                    const root = Directory.createTree('.', { foo: { bar: 1 } });
                    const wrapper = () =>
                        Directory.traverseTree(root, callback);
                    expect(wrapper).toThrowError(error);
                });
            });

            it('should invoke the callback for each directory in the tree', () => {
                // We're going to use the naming convention of directories to
                // test the traversal. Specifically, the directory level is encoded
                // into the name.
                const dirs = {
                    level_1_0: {
                        level_2_0: {
                            level_3_0: {},
                        },
                        level_2_1: {
                            level_3_1: {},
                        },
                    },
                    level_1_1: {},
                };
                const rootDir = 'foo';
                const root = Directory.createTree(rootDir, dirs);
                const callback = jest.fn((dir, level) => {
                    if (dir.name !== rootDir) {
                        const [_, l1] = dir.name.split('_');
                        expect(level).toEqual(parseInt(l1));
                    } else {
                        expect(level).toEqual(0);
                    }
                });

                Directory.traverseTree(root, callback);

                // There are 7 levels in our input including the root level
                expect(callback.mock.calls.length).toEqual(7);
            });
        });
    });

    describe('ctor()', () => {
        getAllButString().forEach((path) => {
            it(`should throw an error if invoked without a valid path (value=${typeof path})`, () => {
                const error = 'Invalid path (arg #1)';
                const wrapper = () => new Directory(path);
                expect(wrapper).toThrowError(error);
            });
        });
    });

    describe('[properties]', () => {
        it('[name] should return the directory name', () => {
            const expectedName = 'foo';
            const dir = new Directory(_path.join(process.cwd(), expectedName));
            expect(dir.name).toBe(expectedName);
        });

        it('[path] should return the relative path to the directory', () => {
            const expectedPath = 'foo';
            const dir = new Directory(_path.join(process.cwd(), 'foo'));
            expect(dir.path).toBe(`${_path.sep}${expectedPath}${_path.sep}`);
        });

        it('[absolutePath] should return the relative path to the directory', () => {
            const path = 'foo';
            const dir = new Directory(path);
            expect(dir.absolutePath).toBe(
                `${_path.join(process.cwd(), path)}${_path.sep}`
            );
        });

        it('[globPath] should return the path used to generate glob patterns', () => {
            const path = 'foo';
            const dir = new Directory(path);
            // The glob path will different from the absolute path in windows,
            // where the separator will be '\', not '/'. On linux/mac both of
            // these paths will be the same.
            expect(dir.globPath).toBe(`${_path.join(process.cwd(), path)}/`);
        });
    });

    describe('addChild()', () => {
        getAllButString('').forEach((name) => {
            it(`should throw an error if invoked without a valid name (value=${typeof name})`, () => {
                const error = 'Invalid directory name (arg #1)';
                const dir = new Directory('foo');
                const wrapper = () => dir.addChild(name);
                expect(wrapper).toThrowError(error);
            });
        });

        ['foo/bar', 'foo\\bar', 'foo:bar'].forEach((name) => {
            it(`should throw an error if the directory name contains invalid characters (value=${name})`, () => {
                const error =
                    'Directory name cannot include path separators (:, \\ or /)';
                const dir = new Directory('foo');
                const wrapper = () => dir.addChild(name);
                expect(wrapper).toThrowError(error);
            });
        });

        it('should create and add a child node to the current directory', () => {
            const expectedName = 'bar';
            const dir = new Directory('foo');

            expect(dir.getChildren()).toHaveLength(0);
            dir.addChild(expectedName);

            const children = dir.getChildren();
            expect(children).toHaveLength(1);
            expect(children[0].name).toEqual(expectedName);
            expect(children[0].path).toEqual(
                `${dir.path}${expectedName}${_path.sep}`
            );
        });
    });

    describe('getChildren()', () => {
        it('should return an empty array if the directory has no children', () => {
            const dir = new Directory('foo');
            expect(dir.getChildren()).toEqual([]);
        });

        it('should return a list of first level children if the directory has children', () => {
            const dirNames = ['foo', 'bar', 'baz'];
            const tree = dirNames.reduce((result, dirName) => {
                result[dirName] = 1;
                return result;
            }, {});
            const dir = Directory.createTree('.', tree);

            const children = dir.getChildren();
            expect(children).toHaveLength(dirNames.length);
            dirNames.forEach((expectedName, index) => {
                expect(children[index].name).toBe(expectedName);
            });
        });

        it('should omit all lower level children of the directory', () => {
            const dirNames = ['foo', 'bar', 'baz'];
            const tree = dirNames.reduce((result, dirName) => {
                result[dirName] = dirNames.reduce((childRes, childDirName) => {
                    childRes[`${childDirName}_child`] = 1;
                    return childRes;
                }, {});
                return result;
            }, {});
            const dir = Directory.createTree('.', tree);

            const children = dir.getChildren();
            expect(children).toHaveLength(dirNames.length);
            dirNames.forEach((expectedName, index) => {
                expect(children[index].name).toBe(expectedName);
            });
        });
    });

    describe('getChild()', () => {
        getAllButString('').forEach((childPath) => {
            it(`should throw an error if invoked without a valid child path (value=${typeof childPath})`, () => {
                const error = 'Invalid childPath (arg #1)';
                const dir = new Directory('foo');
                const wrapper = () => dir.getChild(childPath);
                expect(wrapper).toThrowError(error);
            });
        });

        it('should throw an error if the child node does not exist in the tree', () => {
            const badPath = 'this/does/not/exist';
            const error = `Child not found at path: [${badPath}]`;
            const dir = Directory.createTree('.', _createTree());
            const wrapper = () => dir.getChild(badPath);
            expect(wrapper).toThrowError(error);
        });

        it('should return a reference to a child at the appropriate path', () => {
            const tree = {
                foo: {
                    bar: {
                        baz: null,
                    },
                },
                foo2: {
                    bar2: null,
                    baz2: null,
                },
                '.tmp': null,
            };
            const dir = Directory.createTree('.', tree);

            [
                { path: 'foo', nodeName: 'foo' },
                { path: 'foo2/bar2', nodeName: 'bar2' },
                { path: 'foo/bar/baz', nodeName: 'baz' },
                { path: '.tmp', nodeName: '.tmp' },
            ].forEach(({ path, nodeName }) => {
                const child = dir.getChild(path);
                expect(child.name).toEqual(nodeName);
            });
        });
    });

    describe('getFilePath()', () => {
        getAllButString('').forEach((fileName) => {
            it(`should return the absolute path of the directory if the filename is invalid (value=${typeof fileName})`, () => {
                const dir = new Directory('foo');
                const filePath = dir.getFilePath(fileName);

                expect(filePath).toEqual(dir.absolutePath);
            });
        });

        ['bar', 'bar.txt', 'foo/bar.txt'].forEach((fileName) => {
            it(`should return the absolute file path if a valid filename is provided (value=${fileName})`, () => {
                const dir = new Directory('foo');
                const filePath = dir.getFilePath(fileName);

                expect(filePath).toEqual(`${dir.absolutePath}${fileName}`);
            });
        });
    });

    describe('getFileGlob()', () => {
        getAllButString('').forEach((fileName) => {
            it(`should return the absolute path of the directory if the filename is invalid (value=${typeof fileName})`, () => {
                const dir = new Directory('foo');
                const glob = dir.getFileGlob(fileName);

                expect(glob).toEqual(
                    dir.absolutePath.replace(/\\/g, _path.sep)
                );
            });
        });

        ['bar', 'bar.txt', 'foo/bar.txt'].forEach((fileName) => {
            it(`should return a glob pattern if a valid filename is provided (value=${fileName})`, () => {
                const dir = new Directory('foo');
                const glob = dir.getFileGlob(fileName);

                expect(glob).toEqual(
                    `${dir.absolutePath}${fileName}`.replace(/\\/g, _path.sep)
                );
            });
        });
    });

    describe('getAllFilesGlob()', () => {
        getAllButString().forEach((extension) => {
            it(`should use * as the glob pattern if a valid extension is not specified (value=${typeof extension})`, () => {
                const dir = new Directory('foo');
                const glob = dir.getAllFilesGlob(extension);

                expect(glob).toEqual(
                    `${dir.absolutePath.replace(/\\/g, _path.sep)}**/*`
                );
            });
        });

        ['js', 'py', 'txt'].forEach((extension) => {
            it(`should return a glob pattern that uses the specified file extension (value=${extension})`, () => {
                const dir = new Directory('foo');
                const glob = dir.getAllFilesGlob(extension);

                expect(glob).toEqual(
                    `${dir.absolutePath.replace(/\\/g, _path.sep)}**/*.${extension}`
                );
            });
            
        });
    });
});
