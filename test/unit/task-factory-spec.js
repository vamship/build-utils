import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import { Project } from '../../src/project.js';
import {
    getAllButObject,
    getAllProjectOverrides,
} from '../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createTaskBuilderMock,
} from '../utils/object-builder.js';

describe('[TaskFactory]', function () {
    const _importModule = createModuleImporter('src/task-factory.js', {
        watchTaskBuilderMock: 'src/task-builders/watch-task-builder.js',
    });

    describe('ctor()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without a valid project (value=${typeof project})`, async function () {
                const TaskFactory = await _importModule();
                const wrapper = () => new TaskFactory(project);
                const error = 'Invalid project (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });
    });

    describe('_createTaskBuilders()', function () {
        it('should return an array when invoked', async function () {
            const TaskFactory = await _importModule();
            const definition = buildProjectDefinition();
            const project = new Project(definition);
            const factory = new TaskFactory(project);

            expect(factory._createTaskBuilders()).to.be.an('array').and.to.be
                .empty;
        });
    });

    describe('createTasks()', function () {
        async function _initializeFactory(taskInfo) {
            const watchTaskBuilderMock = createTaskBuilderMock('watch');
            const TaskFactory = await _importModule({
                watchTaskBuilderMock: {
                    WatchTaskBuilder: watchTaskBuilderMock.ctor,
                },
            });

            taskInfo = taskInfo || [
                { name: 'task1', watchPaths: [] },
                { name: 'task2', watchPaths: [] },
            ];
            const tasks = taskInfo.map(({ name, watchPaths }) =>
                createTaskBuilderMock(name, watchPaths),
            );

            class TestTaskFactory extends TaskFactory {
                constructor(project) {
                    super(project);
                }

                _createTaskBuilders() {
                    return tasks;
                }
            }

            const definition = buildProjectDefinition();
            const project = new Project(definition);
            const factory = new TestTaskFactory(project);

            return { tasks, project, factory, watchTaskBuilderMock };
        }

        it('should return an empty array when invoked', async function () {
            const { factory } = await _initializeFactory([]);

            expect(factory.createTasks()).to.be.an('array').that.is.empty;
        });

        it('should invoke the buildTask() method on each task builder (no watch tasks)', async function () {
            const taskInfo = [
                { name: 'task1', watchPaths: [] },
                { name: 'task2', watchPaths: [] },
            ];
            const { tasks, factory, project, watchTaskBuilderMock } =
                await _initializeFactory(taskInfo);

            expect(watchTaskBuilderMock.ctor).to.not.have.been.called;
            tasks.forEach(
                ({ buildTask }) => expect(buildTask).to.not.have.been.called,
            );

            const ret = factory.createTasks();

            expect(watchTaskBuilderMock.ctor).to.not.have.been.called;
            tasks.forEach(({ buildTask }) => {
                expect(buildTask).to.have.been.calledOnceWithExactly(project);
            });

            expect(ret).to.be.an('array').that.has.lengthOf(tasks.length);
            ret.forEach((val, index) => {
                expect(val).to.equal(tasks[index]._task);
            });
        });

        it('should invoke buildTask() to create a new task for watching tasks that have non empty watch paths', async function () {
            const taskInfo = [
                { name: 'task1', watchPaths: [] },
                { name: 'task2', watchPaths: ['path1', 'path2'] },
                { name: 'task3', watchPaths: ['path3', 'path4'] },
                { name: 'task4', watchPaths: [] },
            ];
            const { tasks, factory, project, watchTaskBuilderMock } =
                await _initializeFactory(taskInfo);
            const tasksWithPaths = tasks.filter(
                (task) => task._watchPaths.length > 0,
            );
            const tasksWithoutPaths = tasks.filter(
                (task) => task._watchPaths.length === 0,
            );

            tasksWithoutPaths.forEach((task) => {
                expect(task.buildTask).to.not.have.been.called;
            });
            tasksWithPaths.forEach((task) => {
                expect(task.buildTask).to.not.have.been.called;
            });

            const ret = factory.createTasks();

            tasksWithPaths.forEach((task) => {
                expect(task.buildTask).to.have.been.calledTwice;
                task.buildTask.args.forEach((args) => {
                    expect(args).to.have.lengthOf(1);
                    expect(args[0]).to.equal(project);
                });
            });

            tasksWithoutPaths.forEach((task) =>
                expect(task.buildTask).to.have.been.calledOnceWithExactly(
                    project,
                ),
            );
        });

        it('should create a watch task for each task that returns non empty watch paths', async function () {
            const taskInfo = [
                { name: 'task1', watchPaths: [] },
                { name: 'task2', watchPaths: ['path1', 'path2'] },
                { name: 'task3', watchPaths: ['path3', 'path4'] },
                { name: 'task4', watchPaths: [] },
            ];
            const { tasks, factory, project, watchTaskBuilderMock } =
                await _initializeFactory(taskInfo);
            const tasksWithPaths = tasks.filter(
                (task) => task._watchPaths.length > 0,
            );

            expect(watchTaskBuilderMock.ctor).to.not.have.been.called;

            const ret = factory.createTasks();

            expect(watchTaskBuilderMock.ctor).to.have.been.called;
            expect(watchTaskBuilderMock.ctor.callCount).to.equal(
                tasksWithPaths.length,
            );
            watchTaskBuilderMock.ctor.args.forEach(([task, paths], index) => {
                const taskMock = tasksWithPaths[index];
                expect(task).to.equal(taskMock._task);
                expect(paths).to.deep.equal(taskMock._watchPaths);
            });
        });

        it('should include all watch tasks in the final list of tasks returned', async function () {
            const taskInfo = [
                { name: 'task1', watchPaths: [] },
                { name: 'task2', watchPaths: ['path1', 'path2'] },
                { name: 'task3', watchPaths: ['path3', 'path4'] },
                { name: 'task4', watchPaths: [] },
            ];
            const { tasks, factory, project, watchTaskBuilderMock } =
                await _initializeFactory(taskInfo);
            const tasksWithPaths = tasks.filter(
                (task) => task._watchPaths.length > 0,
            );

            expect(watchTaskBuilderMock.buildTask).to.not.have.been.called;
            tasks.forEach(
                ({ buildTask }) => expect(buildTask).to.not.have.been.called,
            );

            const ret = factory.createTasks();

            tasks.forEach((task) => {
                const { buildTask } = task;
                if (tasksWithPaths.includes(task)) {
                    expect(buildTask).to.have.been.calledTwice;
                    buildTask.args.forEach((args) => {
                        expect(args).to.have.lengthOf(1);
                        expect(args[0]).to.equal(project);
                    });
                } else {
                    expect(buildTask).to.have.been.calledOnceWithExactly(
                        project,
                    );
                }
            });

            expect(watchTaskBuilderMock.buildTask).to.have.been.called;
            expect(watchTaskBuilderMock.buildTask.callCount).to.equal(
                tasksWithPaths.length,
            );
            watchTaskBuilderMock.buildTask.args.forEach((args) => {
                expect(args).to.have.lengthOf(1);
                expect(args[0]).to.equal(project);
            });

            expect(ret)
                .to.be.an('array')
                .that.has.lengthOf(tasks.length + tasksWithPaths.length);

            tasks.forEach((task, index) => {
                expect(ret[index]).to.equal(task._task);
            });

            tasksWithPaths.forEach((task, index) => {
                expect(ret[tasks.length + index]).to.equal(
                    watchTaskBuilderMock._task,
                );
            });
        });
    });
});
