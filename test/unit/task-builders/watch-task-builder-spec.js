import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import _path from 'path';
import _esmock from 'esmock';
import { stub } from 'sinon';
import { Project } from '../../../src/project.js';
import {
    getAllButFunction,
    getAllButObject,
    getAllButArray,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createFancyLogMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[WatchTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/watch-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            fancyLogMock: 'fancy-log',
            gulpMock: 'gulp',
        },
        'WatchTaskBuilder',
    );

    function _createInnerTask(name, description, taskRet) {
        name = name || 'some-task';
        description = description || 'some task description';

        const task = stub().callsFake(() => taskRet);
        task.displayName = name;
        task.description = description;

        return task;
    }

    injectBuilderInitTests(
        _importModule,
        'watch-some-task',
        '[Monitor and execute] some task description',
        [
            _createInnerTask('some-task', 'some task description'),
            ['/absolute/path/1', 'relative/path/2'],
        ],
    );

    describe('ctor()', function () {
        getAllButFunction({}).forEach((task) => {
            it(`should throw an error if invoked without valid task (value=${typeof task})`, async function () {
                const WatchTaskBuilder = await _importModule();
                const error = 'Invalid task (arg #1)';
                const paths = ['/test/path/1', 'test/path/2'];
                const wrapper = () => new WatchTaskBuilder(task, paths);
                expect(wrapper).to.throw(error);
            });
        });

        getAllButArray({}).forEach((paths) => {
            it(`should throw an error if invoked without valid paths (value=${typeof paths})`, async function () {
                const WatchTaskBuilder = await _importModule();
                const error = 'Invalid paths (arg #2)';
                const task = _createInnerTask();
                const wrapper = () => new WatchTaskBuilder(task, paths);
                expect(wrapper).to.throw(error);
            });
        });
    });

    describe('_createTask()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const WatchTaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new WatchTaskBuilder(_createInnerTask(), [
                    '/absolute/path/1',
                    'relative/path/2',
                ]);
                const wrapper = () => builder._createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async function () {
            const WatchTaskBuilder = await _importModule();
            const builder = new WatchTaskBuilder(_createInnerTask(), [
                '/absolute/path/1',
                'relative/path/2',
            ]);

            const project = new Project(buildProjectDefinition());
            const task = builder._createTask(project);

            expect(typeof task).to.equal('function');
        });

        it('should compose a series task that includes start and end methods', async function () {
            const paths = ['/absolute/path/1', 'relative/path/2'];
            const innerTask = _createInnerTask();
            const gulpMock = createGulpMock();
            const WatchTaskBuilder = await _importModule({
                gulpMock,
            });

            const definition = buildProjectDefinition();
            const project = new Project(definition);
            const builder = new WatchTaskBuilder(innerTask, paths);

            expect(gulpMock.series).to.not.have.been.called;

            // Just construct the task, do
            const task = builder.buildTask(project);

            expect(gulpMock.series).to.have.been.calledOnce;
            expect(gulpMock.callSequence[0]).to.equal('series');
            expect(gulpMock.series.args[0]).to.have.lengthOf(3);

            // Log message before task execution
            expect(gulpMock.series.args[0][0]).to.be.a('function');

            // Task to execute
            expect(gulpMock.series.args[0][1]).to.be.a('function');

            // Log message after task execution
            expect(gulpMock.series.args[0][2]).to.be.a('function');
        });
    });

    describe('[task]', function () {
        async function _createTask(innerTask, paths, definitionOverrides) {
            if (typeof innerTask !== 'function') {
                innerTask = _createInnerTask();
            }
            if (!(paths instanceof Array)) {
                paths = ['/absolute/path/1', 'relative/path/2'];
            }
            const gulpMock = createGulpMock();
            const fancyLogMock = createFancyLogMock();
            const WatchTaskBuilder = await _importModule({
                gulpMock,
                fancyLogMock: { default: fancyLogMock },
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new WatchTaskBuilder(innerTask, paths);

            return {
                gulpMock,
                project,
                task: builder.buildTask(project),
            };
        }

        it('should use gulp watch to add a watcher to an existing task', async function () {
            const innerTask = _createInnerTask();
            const paths = ['/foo/bar', 'relative/path/2'];
            const { gulpMock, task } = await _createTask(innerTask, paths);

            expect(gulpMock.watch).to.not.have.been.called;

            task();

            expect(gulpMock.watch).to.have.been.calledOnce;
            expect(gulpMock.callSequence[1]).to.equal('watch');
            expect(gulpMock.watch).to.have.been.calledOnceWithExactly(
                paths,
                gulpMock.series.returnValues[0],
            );
        });

        describe('[task wrapper]', function () {
            async function _getTaskWrapper(innerTask) {
                const { gulpMock, task } = await _createTask(innerTask);

                task();

                return gulpMock.series.args[0][1];
            }

            it('should invoke the inner task', async function () {
                const innerTask = _createInnerTask();
                const taskWrapper = await _getTaskWrapper(innerTask);
                const done = stub();

                expect(innerTask).to.not.have.been.called;

                taskWrapper(done);

                expect(innerTask).to.have.been.calledOnceWithExactly();
            });

            [null, undefined, 0, false, ''].forEach((value) => {
                it(`should complete the task if the inner task returns a falsy value (value=${value})`, async function () {
                    const innerTask = _createInnerTask(
                        'inner-task',
                        'inner task description',
                        value,
                    );

                    const taskWrapper = await _getTaskWrapper(innerTask);
                    const done = stub();

                    expect(done).to.not.have.been.called;

                    taskWrapper(done);

                    expect(done).to.have.been.calledOnceWithExactly();
                });
            });

            [
                { resultType: 'rejected', taskRet: Promise.reject() },
                { resultType: 'resolved', taskRet: Promise.resolve() },
            ].forEach(({ resultType, taskRet }) => {
                it(`should complete the task if the inner task returns a thenable that is ${resultType}`, async function () {
                    const innerTask = _createInnerTask(
                        'inner-task',
                        'inner task description',
                        taskRet,
                    );

                    const taskWrapper = await _getTaskWrapper(innerTask);
                    const done = stub();

                    expect(done).to.not.have.been.called;

                    const ret = taskWrapper(done);

                    expect(ret).to.be.an.instanceof(Promise);

                    await ret;

                    expect(done).to.have.been.calledOnceWithExactly();
                });
            });

            ['error', 'end'].forEach((event) => {
                it(`should complete the task if the inner task returns a stream raises [${event}]`, async function () {
                    const taskRet = stub();
                    const callbacks = {};

                    taskRet.on = stub().callsFake((event, cb) => {
                        callbacks[event] = cb;
                        return taskRet;
                    });

                    const innerTask = _createInnerTask(
                        'inner-task',
                        'inner task description',
                        taskRet,
                    );

                    const taskWrapper = await _getTaskWrapper(innerTask);
                    const done = stub();

                    expect(done).to.not.have.been.called;

                    const ret = taskWrapper(done);

                    callbacks[event]();

                    expect(ret).to.equal(taskRet);
                    expect(done).to.have.been.calledOnceWithExactly();
                });
            });

            ['foo', {}, [], 123].forEach((value) => {
                it(`should complete the task if the inner task returns a non stream/promise/falsy value (value=${value})`, async function () {
                    const innerTask = _createInnerTask(
                        'inner-task',
                        'inner task description',
                        value,
                    );

                    const taskWrapper = await _getTaskWrapper(innerTask);
                    const done = stub();

                    expect(done).to.not.have.been.called;

                    taskWrapper(done);

                    expect(done).to.have.been.calledOnceWithExactly();
                });
            });
        });
    });

    describe('getWatchPaths()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const TaskBuilder = await _importModule();
                const task = _createInnerTask();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder(task, [
                    '/absolute/path/1',
                    'relative/path/2',
                ]);
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function () {
                const TaskBuilder = await _importModule();
                const task = _createInnerTask();
                const builder = new TaskBuilder(task, [
                    '/absolute/path/1',
                    'relative/path/2',
                ]);
                const project = new Project(buildProjectDefinition(overrides));

                const ret = builder.getWatchPaths(project);

                expect(ret).to.deep.equal([]);
            });
        });
    });
});
