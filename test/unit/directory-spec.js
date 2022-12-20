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
            it('should throw an error if invoked without a valid root path', () => {
                const error = 'Invalid rootPath (arg #1)';
                const tree = {};
                const wrapper = () => Directory.createTree(rootPath, tree);
                expect(wrapper).toThrowError(error);
            });
        });

        getAllButObject().forEach((tree) => {
            it('should throw an error if invoked without a valid tree object', () => {
                const error = 'Invalid tree (arg #2)';
                const rootPath = '.';
                const wrapper = () => Directory.createTree(rootPath, tree);
                expect(wrapper).toThrowError(error);
            });
        });

        it('should return a directory with no children if the tree is empty', () => {
            const rootPath = '.';
            const tree = {};
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
            it('should throw an error if invoked without a directory object', () => {
                const error = 'Invalid root directory (arg #1)';
                const callback = jest.fn(() => undefined);
                const wrapper = () => Directory.traverseTree(root, callback);
                expect(wrapper).toThrowError(error);
            });
        });

        getAllButFunction().forEach((callback) => {
            it('should throw an error if invoked without a callback', () => {
                const error = 'Invalid callback function (arg #2)';
                const root = Directory.createTree('.', { foo: { bar: 1 } });
                const wrapper = () => Directory.traverseTree(root, callback);
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
