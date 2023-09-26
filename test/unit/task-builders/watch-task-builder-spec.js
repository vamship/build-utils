import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _esmock from 'esmock';
import { spy } from 'sinon';
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
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[WatchTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/watch-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            gulpMock: 'gulp',
        },
        'WatchTaskBuilder',
    );

    function _createInnerTask(name, description) {
        name = name || 'some-task';
        description = description || 'some task description';

        const task = spy();
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

    describe('ctor()', () => {
        getAllButFunction({}).forEach((task) => {
            it(`should throw an error if invoked without valid task (value=${typeof task})`, async () => {
                const WatchTaskBuilder = await _importModule();
                const error = 'Invalid task (arg #1)';
                const paths = ['/test/path/1', 'test/path/2'];
                const wrapper = () => new WatchTaskBuilder(task, paths);
                expect(wrapper).to.throw(error);
            });
        });

        getAllButArray({}).forEach((paths) => {
            it(`should throw an error if invoked without valid paths (value=${typeof paths})`, async () => {
                const WatchTaskBuilder = await _importModule();
                const error = 'Invalid paths (arg #2)';
                const task = _createInnerTask();
                const wrapper = () => new WatchTaskBuilder(task, paths);
                expect(wrapper).to.throw(error);
            });
        });
    });

    describe('_createTask()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
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

        it('should return a function when invoked', async () => {
            const WatchTaskBuilder = await _importModule();
            const builder = new WatchTaskBuilder(_createInnerTask(), [
                '/absolute/path/1',
                'relative/path/2',
            ]);

            const project = new Project(buildProjectDefinition());
            const task = builder._createTask(project);

            expect(typeof task).to.equal('function');
        });

        it('should compose a series task that includes start and end methods', async () => {
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
            expect(gulpMock.series.args[0][1]).to.equal(innerTask);

            // Log message after task execution
            expect(gulpMock.series.args[0][2]).to.be.a('function');
        });
    });

    describe('[task]', () => {
        async function _createTask(innerTask, paths, definitionOverrides) {
            if (typeof innerTask !== 'function') {
                innerTask = _createInnerTask();
            }
            if (!(paths instanceof Array)) {
                paths = ['/absolute/path/1', 'relative/path/2'];
            }
            const gulpMock = createGulpMock();
            const WatchTaskBuilder = await _importModule({
                gulpMock,
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

        it('should use gulp watch to add a watcher to an existing task', async () => {
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
    });

    describe('getWatchPaths()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
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
            it(`should return an array of paths to watch ${title}`, async () => {
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
