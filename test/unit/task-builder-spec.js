import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import TaskBuilder from '../../src/task-builder.js';
import { Project } from '../../src/project.js';
import {
    getAllButObject,
    getAllButString,
    generateGlobPatterns,
} from '../utils/data-generator.js';
import { buildProjectDefinition } from '../utils/object-builder.js';

describe('[TaskBuilder]', function () {
    class MockTaskBuilder extends TaskBuilder {
        constructor(name, description) {
            name = name || 'mock-task';
            description = description || 'mock-description';
            super(name, description);
            this._task = () => undefined;
            this._createTaskSpy = stub();
            this._createTaskSpy.returns(this._task);
        }

        get task() {
            return this._task;
        }

        get createTaskSpy() {
            return this._createTaskSpy;
        }

        _createTask(project) {
            return this._createTaskSpy(project);
        }
    }

    function _createInstance(name, description) {
        name = name || 'do-something';
        description = description || 'Dummy task that does not do anything';
        return new TaskBuilder(name, description);
    }

    describe('ctor()', function () {
        getAllButString('').forEach((name) => {
            it(`should throw an error if invoked without a valid name (value=${typeof name})`, function () {
                const description = 'some task';
                const wrapper = () => new TaskBuilder(name, description);
                const error = 'Invalid name (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        getAllButString('').forEach((description) => {
            it(`should throw an error if invoked without a valid description (value=${typeof description})`, function () {
                const name = 'sample-task';
                const wrapper = () => new TaskBuilder(name, description);
                const error = 'Invalid description (arg #2)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should expose relevant task properties as read only fields', function () {
            const name = 'sample-task';
            const description = 'some task';
            const builder = new TaskBuilder(name, description);

            expect(builder.name).to.equal(name);
            expect(builder.description).to.equal(description);
        });
    });

    describe('[properties]', function () {
        describe('name', function () {
            it('should return the name of the task', function () {
                const name = 'sample-task';
                const description = 'some task';
                const builder = new TaskBuilder(name, description);

                expect(builder.name).to.equal(name);
            });
        });
        describe('description', function () {
            it('should return the name of the task', function () {
                const name = 'sample-task';
                const description = 'some task';
                const builder = new TaskBuilder(name, description);

                expect(builder.description).to.equal(description);
            });
        });
    });

    describe('_createTask()', function () {
        it('should throw an error if invoked', function () {
            const builder = _createInstance();
            const wrapper = () => builder._createTask();
            const error = 'Not implemented - TaskBuilder._createTask()';

            expect(wrapper).to.throw(error);
        });
    });

    describe('buildTask()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const error = 'Invalid project (arg #1)';
                const builder = _createInstance();
                const wrapper = () => builder.buildTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should invoke the _createTask() method when called', function () {
            const instance = new MockTaskBuilder();
            const project = new Project(buildProjectDefinition());

            expect(instance.createTaskSpy).to.not.have.been.called;

            instance.buildTask(project);

            expect(instance.createTaskSpy).to.have.been.calledOnce;
            expect(instance.createTaskSpy).to.have.been.calledWithExactly(
                project,
            );
        });

        it('should return the task returned by the _createTask() function', function () {
            const instance = new MockTaskBuilder();
            const project = new Project(buildProjectDefinition());

            const ret = instance.buildTask(project);

            expect(ret).to.equal(instance.task);
        });

        it('should set the display name and desciption of the task', function () {
            const displayName = 'foo-task';
            const description = 'foo-description';
            const instance = new MockTaskBuilder(displayName, description);
            const project = new Project(buildProjectDefinition());

            const ret = instance.buildTask(project);

            expect(ret.displayName).to.equal(displayName);
            expect(ret.description).to.equal(description);
        });
    });

    describe('getWatchPaths()', function () {
        function createPathList(project) {
            const dirs = ['src', 'test', 'infra'];
            const extensions = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
            const rootDir = project.rootDir.absolutePath;

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const error = 'Invalid project (arg #1)';
                const builder = _createInstance();
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return an array of source paths', function () {
            const builder = _createInstance();
            const project = new Project(buildProjectDefinition());

            const ret = builder.getWatchPaths(project);

            const paths = createPathList(project);

            expect(ret).to.have.lengthOf(paths.length);
            expect(ret).to.have.members(paths);
        });
    });
});
