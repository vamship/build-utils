import { expect } from 'chai';
import { spy } from 'sinon';
import { Directory } from '../../src/directory.js';
import _path from 'path';
import {
    getAllButString,
    getAllButObject,
    getAllButFunction,
} from '../utils/data-generator.js';

function _createPath(...components) {
    return components.join(_path.sep);
}

describe('[Directory]', function () {
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

    describe('[Static Members]', function () {
        it('should expose the expected static members', function () {
            expect(typeof Directory.createTree).to.equal('function');
            expect(typeof Directory.traverseTree).to.equal('function');
        });

        describe('createTree()', function () {
            function _verifyDirectory(parent, name) {
                const child = parent.getChildren().find((dir) => {
                    return dir.name === name;
                });
                expect(child).to.be.an.instanceof(Directory);

                const expectedPath = _path.join(parent.path, name, _path.sep);
                expect(child.path).to.equal(expectedPath);
                return child;
            }

            function _verifyLeaves(parent, ...children) {
                children.forEach((childName) => {
                    const child = _verifyDirectory(parent, childName);
                    expect(child.getChildren()).to.deep.equal([]);
                });
            }

            getAllButString().forEach((rootPath) => {
                it(`should throw an error if invoked without a valid root path (value=${typeof rootPath})`, function () {
                    const error = 'Invalid rootPath (arg #1)';
                    const tree = _createTree();
                    const wrapper = () => Directory.createTree(rootPath, tree);
                    expect(wrapper).to.throw(error);
                });
            });

            getAllButObject().forEach((tree) => {
                it(`should throw an error if invoked without a valid tree object (value=${typeof tree})`, function () {
                    const error = 'Invalid tree (arg #2)';
                    const rootPath = '.';
                    const wrapper = () => Directory.createTree(rootPath, tree);
                    expect(wrapper).to.throw(error);
                });
            });

            it('should return a directory with no children if the tree is empty', function () {
                const rootPath = '.';
                const tree = _createTree();
                const root = Directory.createTree(rootPath, tree);

                expect(root).to.be.an.instanceof(Directory);
                expect(root.path).to.equal(_createPath('.', ''));
            });

            it('should add a child directory for each member of the tree', function () {
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

            it('should create a sub tree for each child that references an object', function () {
                const rootPath = './';
                const tree = _createTree();
                const root = Directory.createTree(rootPath, tree);

                expect(root.getChildren()).to.have.lengthOf(5);
                _verifyLeaves(root, 'working', '.tmp', '.coverage');

                const src = _verifyDirectory(root, 'src');
                expect(src.getChildren()).to.have.lengthOf(3);
                _verifyLeaves(src, 'handlers', 'devices', 'data');

                const test = _verifyDirectory(root, 'test');
                expect(test.getChildren()).to.have.lengthOf(1);

                const unit = _verifyDirectory(test, 'unit');
                expect(unit.getChildren()).to.have.lengthOf(3);
                _verifyLeaves(unit, 'handlers', 'devices', 'data');
            });

            it('should not add subtrees if the values are not objects', function () {
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
                    'zaz',
                );
            });
        });

        describe('traverseTree()', function () {
            getAllButObject({}).forEach((root) => {
                it(`should throw an error if invoked without a directory object (value=${typeof root})`, function () {
                    const error = 'Invalid root directory (arg #1)';
                    const callback = spy();
                    const wrapper = () =>
                        Directory.traverseTree(root, callback);
                    expect(wrapper).to.throw(error);
                });
            });

            getAllButFunction().forEach((callback) => {
                it(`should throw an error if invoked without a callback (value=${typeof callback})`, function () {
                    const error = 'Invalid callback function (arg #2)';
                    const root = Directory.createTree('.', { foo: { bar: 1 } });
                    const wrapper = () =>
                        Directory.traverseTree(root, callback);
                    expect(wrapper).to.throw(error);
                });
            });

            it('should invoke the callback for each directory in the tree', function () {
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
                const callback = spy((dir, level) => {
                    if (dir.name !== rootDir) {
                        const l1 = dir.name.split('_')[1];
                        expect(level).to.equal(parseInt(l1));
                    } else {
                        expect(level).to.equal(0);
                    }
                });

                Directory.traverseTree(root, callback);

                // There are 7 levels in our input including the root level
                expect(callback.callCount).to.equal(7);
            });
        });
    });

    describe('ctor()', function () {
        getAllButString().forEach((path) => {
            it(`should throw an error if invoked without a valid path (value=${typeof path})`, function () {
                const error = 'Invalid path (arg #1)';
                const wrapper = () => new Directory(path);
                expect(wrapper).to.throw(error);
            });
        });
    });

    describe('[properties]', function () {
        it('[name] should return the directory name', function () {
            const expectedName = 'foo';
            const dir = new Directory(_path.join(process.cwd(), expectedName));
            expect(dir.name).to.equal(expectedName);
        });

        it('[path] should return the relative path to the directory', function () {
            const expectedPath = 'foo';
            const dir = new Directory(_path.join(process.cwd(), 'foo'));
            expect(dir.path).to.equal(
                `${_path.sep}${expectedPath}${_path.sep}`,
            );
        });

        it('[absolutePath] should return the relative path to the directory', function () {
            const path = 'foo';
            const dir = new Directory(path);
            expect(dir.absolutePath).to.equal(
                `${_path.join(process.cwd(), path)}${_path.sep}`,
            );
        });

        it('[globPath] should return the path used to generate glob patterns', function () {
            const path = 'foo';
            const dir = new Directory(path);
            // The glob path will different from the absolute path in windows,
            // where the separator will be '\', not '/'. On linux/mac both of
            // these paths will be the same.
            expect(dir.globPath).to.equal(
                `${_path.join(process.cwd(), path)}/`,
            );
        });
    });

    describe('exists()', function () {
        it('should return true if the directory exists', async function () {
            const dir = new Directory('.');
            expect(dir.exists()).to.be.true;
        });

        it('should return false if the directory does not exist', async function () {
            const dir = new Directory('this/does/not/exist');
            expect(dir.exists()).to.be.false;
        });
    });

    describe('addChild()', function () {
        getAllButString('').forEach((name) => {
            it(`should throw an error if invoked without a valid name (value=${typeof name})`, function () {
                const error = 'Invalid directory name (arg #1)';
                const dir = new Directory('foo');
                const wrapper = () => dir.addChild(name);
                expect(wrapper).to.throw(error);
            });
        });

        ['foo/bar', 'foo\\bar', 'foo:bar'].forEach((name) => {
            it(`should throw an error if the directory name contains invalid characters (value=${name})`, function () {
                const error =
                    'Directory name cannot include path separators (:, \\ or /)';
                const dir = new Directory('foo');
                const wrapper = () => dir.addChild(name);
                expect(wrapper).to.throw(error);
            });
        });

        it('should create and add a child node to the current directory', function () {
            const expectedName = 'bar';
            const dir = new Directory('foo');

            expect(dir.getChildren()).to.have.lengthOf(0);
            dir.addChild(expectedName);

            const children = dir.getChildren();
            expect(children).to.have.lengthOf(1);
            expect(children[0].name).to.equal(expectedName);
            expect(children[0].path).to.equal(
                `${dir.path}${expectedName}${_path.sep}`,
            );
        });
    });

    describe('getChildren()', function () {
        it('should return an empty array if the directory has no children', function () {
            const dir = new Directory('foo');
            expect(dir.getChildren()).to.deep.equal([]);
        });

        it('should return a list of first level children if the directory has children', function () {
            const dirNames = ['foo', 'bar', 'baz'];
            const tree = dirNames.reduce((result, dirName) => {
                result[dirName] = 1;
                return result;
            }, {});
            const dir = Directory.createTree('.', tree);

            const children = dir.getChildren();
            expect(children).to.have.lengthOf(dirNames.length);
            dirNames.forEach((expectedName, index) => {
                expect(children[index].name).to.equal(expectedName);
            });
        });

        it('should omit all lower level children of the directory', function () {
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
            expect(children).to.have.lengthOf(dirNames.length);
            dirNames.forEach((expectedName, index) => {
                expect(children[index].name).to.equal(expectedName);
            });
        });
    });

    describe('getChild()', function () {
        getAllButString('').forEach((childPath) => {
            it(`should throw an error if invoked without a valid child path (value=${typeof childPath})`, function () {
                const error = 'Invalid childPath (arg #1)';
                const dir = new Directory('foo');
                const wrapper = () => dir.getChild(childPath);
                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if the child node does not exist in the tree', function () {
            const badPath = 'this/does/not/exist';
            const error = `Child not found at path: [${badPath}]`;
            const dir = Directory.createTree('.', _createTree());
            const wrapper = () => dir.getChild(badPath);
            expect(wrapper).to.throw(error);
        });

        it('should return a reference to a child at the appropriate path', function () {
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
                expect(child.name).to.equal(nodeName);
            });
        });
    });

    describe('getFilePath()', function () {
        getAllButString('').forEach((fileName) => {
            it(`should return the absolute path of the directory if the filename is invalid (value=${typeof fileName})`, function () {
                const dir = new Directory('foo');
                const filePath = dir.getFilePath(fileName);

                expect(filePath).to.equal(dir.absolutePath);
            });
        });

        ['bar', 'bar.txt', 'foo/bar.txt'].forEach((fileName) => {
            it(`should return the absolute file path if a valid filename is provided (value=${fileName})`, function () {
                const dir = new Directory('foo');
                const filePath = dir.getFilePath(fileName);

                expect(filePath).to.equal(`${dir.absolutePath}${fileName}`);
            });
        });
    });

    describe('getFileGlob()', function () {
        getAllButString('').forEach((fileName) => {
            it(`should return the absolute path of the directory if the filename is invalid (value=${typeof fileName})`, function () {
                const dir = new Directory('foo');
                const glob = dir.getFileGlob(fileName);

                expect(glob).to.equal(
                    dir.absolutePath.replace(/\\/g, _path.sep),
                );
            });
        });

        ['bar', 'bar.txt', 'foo/bar.txt'].forEach((fileName) => {
            it(`should return a glob pattern if a valid filename is provided (value=${fileName})`, function () {
                const dir = new Directory('foo');
                const glob = dir.getFileGlob(fileName);

                expect(glob).to.equal(
                    `${dir.absolutePath}${fileName}`.replace(/\\/g, _path.sep),
                );
            });
        });
    });

    describe('getAllFilesGlob()', function () {
        getAllButString().forEach((extension) => {
            it(`should use * as the glob pattern if a valid extension is not specified (value=${typeof extension})`, function () {
                const dir = new Directory('foo');
                const glob = dir.getAllFilesGlob(extension);

                expect(glob).to.equal(
                    `${dir.absolutePath.replace(/\\/g, _path.sep)}**/*`,
                );
            });
        });

        ['js', 'py', 'txt'].forEach((extension) => {
            it(`should return a glob pattern that uses the specified file extension (value=${extension})`, function () {
                const dir = new Directory('foo');
                const glob = dir.getAllFilesGlob(extension);

                expect(glob).to.equal(
                    `${dir.absolutePath.replace(
                        /\\/g,
                        _path.sep,
                    )}**/*.${extension}`,
                );
            });
        });
    });

    describe('getAllHiddenFilesGlob()', function () {
        getAllButString().forEach((extension) => {
            it(`should use .* as the glob pattern if a valid extension is not specified (value=${typeof extension})`, function () {
                const dir = new Directory('foo');
                const glob = dir.getAllHiddenFilesGlob(extension);

                expect(glob).to.equal(
                    `${dir.absolutePath.replace(/\\/g, _path.sep)}**/.*`,
                );
            });
        });

        ['js', 'py', 'txt'].forEach((extension) => {
            it(`should return a glob pattern that uses the specified file extension (value=${extension})`, function () {
                const dir = new Directory('foo');
                const glob = dir.getAllHiddenFilesGlob(extension);

                expect(glob).to.equal(
                    `${dir.absolutePath.replace(
                        /\\/g,
                        _path.sep,
                    )}**/.*.${extension}`,
                );
            });
        });
    });
});
