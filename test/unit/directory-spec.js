'use strict';

import _sinon from 'sinon';
import _chai from 'chai';
import _sinonChai from 'sinon-chai';
import _chaiAsPromised from 'chai-as-promised';
_chai.use(_sinonChai);
_chai.use(_chaiAsPromised);

const expect = _chai.expect;
import _path from 'path';
import _process from 'process';

import { Directory } from '../../src/directory.js';

describe('[Directory]', () => {
    function _createPath(...components) {
        return components.join(_path.sep);
    }

    describe('[Static Members]', () => {
        it('should expose the expected static members', () => {
            expect(Directory.createTree).to.be.a('function');
            expect(Directory.traverseTree).to.be.a('function');
        });

        describe('createTree()', () => {
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

            it('should throw an error if invoked without a valid root path', () => {
                const error = 'Invalid rootPath specified (arg #1)';
                const inputs = [null, undefined, 123, true, {}, [], () => {}];

                inputs.forEach((path) => {
                    const wrapper = () => {
                        return Directory.createTree(path);
                    };
                    expect(wrapper).to.throw(error);
                });
            });

            it('should throw an error if invoked without a valid tree object', () => {
                const error = 'Invalid tree specified (arg #2)';
                const inputs = [
                    null,
                    undefined,
                    123,
                    true,
                    'test',
                    [],
                    () => {},
                ];

                inputs.forEach((tree) => {
                    const wrapper = () => {
                        const rootPath = './';
                        return Directory.createTree(rootPath, tree);
                    };
                    expect(wrapper).to.throw(error);
                });
            });

            it('should return a directory with no children if the tree is empty', () => {
                const rootPath = '.';
                const tree = {};
                const root = Directory.createTree(rootPath, tree);

                expect(root).to.be.an.instanceof(Directory);
                expect(root.path).to.equal(_createPath('.', ''));
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
                const tree = {
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
                const root = Directory.createTree(rootPath, tree);

                expect(root.getChildren()).to.have.length(5);
                _verifyLeaves(root, 'working', '.tmp', '.coverage');

                const src = _verifyDirectory(root, 'src');
                expect(src.getChildren()).to.have.length(3);
                _verifyLeaves(src, 'handlers', 'devices', 'data');

                const test = _verifyDirectory(root, 'test');
                expect(test.getChildren()).to.have.length(1);

                const unit = _verifyDirectory(test, 'unit');
                expect(unit.getChildren()).to.have.length(3);
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
            it('should throw an error if invoked without a Directory instance', () => {
                const error = 'Invalid root directory specified (arg #1)';
                const inputs = [
                    null,
                    undefined,
                    123,
                    true,
                    'foo',
                    {},
                    [],
                    () => {},
                ];

                inputs.forEach((root) => {
                    const wrapper = () => {
                        return Directory.traverseTree(root);
                    };
                    expect(wrapper).to.throw(error);
                });
            });

            it('should throw an error if invoked without a callback function', () => {
                const error = 'Invalid callback function specified (arg #1)';
                const inputs = [null, undefined, 123, true, 'foo', {}, []];

                inputs.forEach((callback) => {
                    const wrapper = () => {
                        const root = new Directory('.');
                        return Directory.traverseTree(root, callback);
                    };
                    expect(wrapper).to.throw(error);
                });
            });

            it('should invoke the callback function just once if the root has no children', () => {
                const root = new Directory('.');
                const callback = _sinon.spy();
                const dirName = _path.basename(process.cwd());

                expect(callback).to.not.have.been.called;

                Directory.traverseTree(root, callback);

                expect(callback).to.have.been.calledOnce;
                const dir = callback.args[0][0];
                expect(dir).to.be.an.instanceof(Directory);
                expect(dir.name).to.equal(dirName);

                const level = callback.args[0][1];
                expect(level).to.equal(0);
            });

            it('should recursively walk the tree structure in depth first fashion', () => {
                const rootPath = './';
                const dirName = _path.basename(process.cwd());
                const tree = {
                    src: {
                        handlers: null,
                        devices: null,
                        data: null,
                    },
                    test: {
                        unit: {
                            foo: null,
                            bar: null,
                            baz: null,
                        },
                    },
                    working: null,
                    '.tmp': null,
                    '.coverage': null,
                };
                const expectedSequence = [
                    {
                        name: dirName,
                        level: 0,
                    },
                    {
                        name: 'src',
                        level: 1,
                    },
                    {
                        name: 'handlers',
                        level: 2,
                    },
                    {
                        name: 'devices',
                        level: 2,
                    },
                    {
                        name: 'data',
                        level: 2,
                    },
                    {
                        name: 'test',
                        level: 1,
                    },
                    {
                        name: 'unit',
                        level: 2,
                    },
                    {
                        name: 'foo',
                        level: 3,
                    },
                    {
                        name: 'bar',
                        level: 3,
                    },
                    {
                        name: 'baz',
                        level: 3,
                    },
                    {
                        name: 'working',
                        level: 1,
                    },
                    {
                        name: '.tmp',
                        level: 1,
                    },
                    {
                        name: '.coverage',
                        level: 1,
                    },
                ];

                const root = Directory.createTree(rootPath, tree);
                const callback = _sinon.spy();

                expect(callback).to.not.have.been.called;

                Directory.traverseTree(root, callback);

                expect(callback.callCount).to.equal(expectedSequence.length);
                expectedSequence.forEach((info, index) => {
                    const dir = callback.args[index][0];
                    expect(dir).to.be.an.instanceof(Directory);
                    expect(dir.name).to.equal(info.name);

                    const level = callback.args[index][1];
                    expect(level).to.equal(info.level);
                });
            });
        });
    });

    describe('ctor()', () => {
        it('should throw an error if invoked without a valid path', () => {
            const error = 'Invalid path specified (arg #1)';
            const inputs = [null, undefined, 123, true, {}, [], () => {}];

            inputs.forEach((path) => {
                const wrapper = () => {
                    return new Directory(path);
                };
                expect(wrapper).to.throw(error);
            });
        });

        it('should expose the expected methods and properties', () => {
            const dir = new Directory(_createPath('.', 'foo', 'bar'));

            expect(dir).to.be.an('object');
            expect(dir.name).to.be.a('string');
            expect(dir.path).to.be.a('string');
            expect(dir.absolutePath).to.be.a('string');
            expect(dir.globPath).to.be.a('string');
            expect(dir.addChild).to.be.a('function');
            expect(dir.getChild).to.be.a('function');
            expect(dir.getChildren).to.be.a('function');
            expect(dir.getFilePath).to.be.a('function');
            expect(dir.getFileGlob).to.be.a('function');
            expect(dir.getAllFilesGlob).to.be.a('function');
        });
    });

    describe('name', () => {
        it('should return an empty string if the input path is the root character', () => {
            const inputs = [_path.sep];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                expect(dir.name).to.equal('');
            });
        });

        it('should return the name the current directory if the input path is empty or "."', () => {
            const inputs = ['', '.', `.${_path.sep}`, `.${_path.sep}.`];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                expect(dir.name).to.equal(_path.basename(_process.cwd()));
            });
        });

        it('should return the name of the directory if a relative path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [_createPath(...dirs), _createPath(...dirs, '')];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                expect(dir.name).to.equal('baz');
            });
        });

        it('should return the name of the directory if an absolute path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [
                _createPath('', ...dirs),
                _createPath('', ...dirs, ''),
            ];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                expect(dir.name).to.equal('baz');
            });
        });
    });

    describe('path', () => {
        it(`should return "${_path.sep} if the path is "${_path.sep}"`, () => {
            const dir = new Directory(_path.sep);
            expect(dir.path).to.equal(_path.sep);
        });

        it('should return a standardized reference to the current directory', () => {
            const inputs = ['', '.', `.${_path.sep}`];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const expectedPath = _createPath('.', '');
                expect(dir.path).to.equal(expectedPath);
            });
        });

        it('should return a standardized directory path when a relative path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [_createPath(...dirs), _createPath(...dirs, '')];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const expectedPath = _createPath(...dirs, '');
                expect(dir.path).to.equal(expectedPath);
            });
        });

        it('should return a standardized directory path when an absolute path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [
                _createPath('', ...dirs),
                _createPath('', ...dirs, ''),
            ];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const expectedPath = _createPath('', ...dirs, '');
                expect(dir.path).to.equal(expectedPath);
            });
        });
    });

    describe('absolutePath', () => {
        it(`should return "${_path.sep}" if the path is "${_path.sep}"`, () => {
            const dir = new Directory(_path.sep);
            expect(dir.absolutePath).to.equal(_path.sep);
        });

        it('should use the resolved path to determine a standardized directory path', () => {
            const inputs = ['', '.', `.${_path.sep}`];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const expectedPath = _path.join(_path.resolve(path), _path.sep);
                expect(dir.absolutePath).to.equal(expectedPath);
            });
        });

        it('should return a standardized directory path when a relative path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [_createPath(...dirs), _createPath(...dirs, '')];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                let expectedPath = _createPath(_path.resolve(), ...dirs, '');
                expect(dir.absolutePath).to.equal(expectedPath);
            });
        });

        it('should return a standardized directory path when an absolute path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [
                _createPath('', ...dirs),
                _createPath('', ...dirs, ''),
            ];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const expectedPath = _createPath('', ...dirs, '');
                expect(dir.absolutePath).to.equal(expectedPath);
            });
        });
    });

    describe('globPath', () => {
        it(`should return "/" if the path is "${_path.sep}"`, () => {
            const dir = new Directory(_path.sep);
            expect(dir.globPath).to.equal('/');
        });

        it('should use the resolved path to determine a standardized directory glob', () => {
            const inputs = ['', '.', `.${_path.sep}`];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const filePath = _path.join(_path.resolve(path), _path.sep);
                const expectedPath = filePath.replace(/\\/g, '/');

                expect(dir.globPath).to.equal(expectedPath);
            });
        });

        it('should return a standardized directory glob when a relative path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [_createPath(...dirs), _createPath(...dirs, '')];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const filePath = _createPath(_path.resolve(), ...dirs, '');
                const expectedPath = filePath.replace(/\\/g, '/');

                expect(dir.globPath).to.equal(expectedPath);
            });
        });

        it('should return a standardized directory glob when an absolute path is specified', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const inputs = [
                _createPath('', ...dirs),
                _createPath('', ...dirs, ''),
            ];

            inputs.forEach((path) => {
                const dir = new Directory(path);
                const filePath = _createPath('', ...dirs, '');
                const expectedPath = filePath.replace(/\\/g, '/');
                expect(dir.globPath).to.equal(expectedPath);
            });
        });
    });

    describe('addChild()', () => {
        it('should throw an error if invoked without a valid directory name', () => {
            const error = 'Invalid directory name specified (arg #1)';
            const inputs = [null, undefined, 123, true, {}, [], () => {}];

            inputs.forEach((path) => {
                const wrapper = () => {
                    const dir = new Directory('');
                    return dir.addChild(path);
                };
                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if the name includes path separators', () => {
            const error =
                'Directory name cannot include path separators (:, \\ or /)';
            const inputs = [
                '/',
                '\\',
                '/child',
                'child/',
                'child\\',
                '\\child',
                'c:',
            ];

            inputs.forEach((path) => {
                const wrapper = () => {
                    const dir = new Directory('');
                    return dir.addChild(path);
                };
                expect(wrapper).to.throw(error);
            });
        });

        it('should return an instance of Directory', () => {
            const dir = new Directory('');
            const child = dir.addChild('baby');
            expect(child).to.be.an.instanceof(Directory);
        });

        it('should create and add a new Directory instance to the child array', () => {
            const dir = new Directory('');

            //NOTE: Examining "private" members.
            expect(dir._children).to.deep.equal([]);
            const child = dir.addChild('baby');

            expect(dir._children).to.have.length(1);
            expect(dir._children[0]).to.equal(child);
        });

        it('should initialize the child directory with the correct path', () => {
            const parentPath = _createPath('foo', 'bar', 'baz');
            const childDirName = 'chaz';
            const dir = new Directory(parentPath);

            const child = dir.addChild(childDirName);
            const refChild = new Directory(
                _path.join(parentPath, childDirName)
            );

            expect(child.path).to.equal(refChild.path);
            expect(child.name).to.equal(refChild.name);
        });
    });

    describe('getChild()', () => {
        it('should throw an error if invoked without a valid path', () => {
            const error = 'Invalid child path specified (arg #1)';
            const inputs = [null, undefined, 123, true, '', {}, [], () => {}];

            inputs.forEach((path) => {
                const wrapper = () => {
                    const dir = new Directory('.');
                    return dir.getChild(path);
                };
                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if a child does not exist at the specified path', () => {
            const path = 'foo';
            const error = `Child not found at path: [${path}]`;

            const wrapper = () => {
                const dir = new Directory('.');
                return dir.getChild(path);
            };
            expect(wrapper).to.throw(error);
        });

        it('should return the child from its child list if the path is simple', () => {
            const path = 'foo';
            const dir = new Directory('.');
            const child = dir.addChild(path);

            const ret = dir.getChild(path);
            expect(ret).to.equal(child);
        });

        it('should recursively search through its children if the path is complex', () => {
            const childNames = ['foo', 'bar'];
            const path = _createPath(...childNames);
            const dir = new Directory('.');

            const lastChild = childNames.reduce((result, name) => {
                return result.addChild(name);
            }, dir);

            const ret = dir.getChild(path);
            expect(ret).to.equal(lastChild);
        });

        it('should abort search with an error if a child is not found in the path', () => {
            const childNames = ['foo', 'bar'];
            const path = _createPath('foo', 'bar', 'baz');
            const error = `Child not found at path: [${path}]`;
            const dir = new Directory('.');

            childNames.forEach((name) => {
                dir.addChild(name);
            });

            const wrapper = () => {
                return dir.getChild(path);
            };
            expect(wrapper).to.throw(error);
        });
    });

    describe('getChildren()', () => {
        it('should return an array containing all of the child directories', () => {
            const parent = new Directory('');
            const childDirectories = ['foo', 'bar', 'baz'].map((path) => {
                return new Directory(path);
            });

            childDirectories.forEach((dir) => parent._children.push(dir));

            const ret = parent.getChildren();
            expect(ret).to.deep.equal(childDirectories);
            expect(ret).to.not.equal(parent._children);
        });
    });

    describe('getFilePath()', () => {
        it('should return the path to the parent if invoked without a valid fileName', () => {
            const inputs = [null, undefined, 123, true, {}, [], () => {}];

            inputs.forEach((fileName) => {
                const dir = new Directory('');
                const ret = dir.getFilePath(fileName);

                expect(ret).to.equal(dir.absolutePath);
            });
        });

        it('should return the path to the filename as if it exists in the directory', () => {
            const fileName = 'test-file';
            const dir = new Directory('');
            const ret = dir.getFilePath(fileName);

            expect(ret).to.equal(_path.join(dir.absolutePath, fileName));
        });
    });

    describe('getFileGlob()', () => {
        it('should return the glob to the parent if invoked without a valid fileName', () => {
            const inputs = [null, undefined, 123, true, {}, [], () => {}];

            inputs.forEach((fileName) => {
                const dir = new Directory('');
                const ret = dir.getFileGlob(fileName);

                expect(ret).to.equal(dir.globPath);
            });
        });

        it('should return the path to the filename as if it exists in the directory', () => {
            const fileName = 'test-file';
            const dir = new Directory('');
            const ret = dir.getFileGlob(fileName);

            expect(ret).to.equal(`${dir.globPath}${fileName}`);
        });
    });

    describe('getAllFilesGlob()', () => {
        it('should return the expected globbing pattern when invoked without an extension', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const path = _createPath(...dirs);
            const absPath = _path.resolve(...dirs);
            const expectedPattern = _createPath(absPath, '**', '*').replace(
                /\\/g,
                '/'
            );

            const dir = new Directory(path);
            const ret = dir.getAllFilesGlob();
            expect(ret).to.equal(expectedPattern);
        });

        it('should return the expected globbing pattern when invoked with an extension', () => {
            const dirs = ['foo', 'bar', 'baz'];
            const ext = 'js';
            const path = _createPath(...dirs);
            const absPath = _path.resolve(...dirs);
            const expectedPattern = _createPath(
                absPath,
                '**',
                `*.${ext}`
            ).replace(/\\/g, '/');

            const dir = new Directory(path);
            const ret = dir.getAllFilesGlob(ext);
            expect(ret).to.equal(expectedPattern);
        });
    });
});
