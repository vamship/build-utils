import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import _path from 'path';
import { spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllProjectOverrides,
    getAllButObject,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createFancyLogMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[NotSupportedTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/not-supported-task-builder.js',
        {
            fancyLogMock: 'fancy-log',
            taskBuilderMock: 'src/task-builder.js',
        },
        'NotSupportedTaskBuilder',
    );

    injectBuilderInitTests(
        _importModule,
        'not-supported',
        'Task that does nothing - used to indicate that a task is not supported for a project type.',
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides, message) {
            const fancyLogMock = createFancyLogMock();
            const NotSupportedTaskBuilder = await _importModule({
                fancyLogMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new NotSupportedTaskBuilder(message);

            return {
                fancyLogMock,
                project,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, function () {
                [undefined, 'custom message'].forEach((message) => {
                    it(`should show a log message on the screen (custom message=${message})`, async function () {
                        const { task, fancyLogMock } = await _createTask(
                            overrides,
                            message,
                        );
                        const expectedMessage =
                            message || 'Task not defined for project';

                        expect(fancyLogMock.info).to.not.have.been.called;

                        await task();

                        expect(
                            fancyLogMock.warn,
                        ).to.have.been.calledOnceWithExactly(expectedMessage);
                    });
                });
            });
        });
    });

    describe('getWatchPaths()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder();
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function () {
                const TaskBuilder = await _importModule();
                const builder = new TaskBuilder();
                const project = new Project(buildProjectDefinition(overrides));

                const ret = builder.getWatchPaths(project);

                expect(ret).to.deep.equal([]);
            });
        });
    });
});
