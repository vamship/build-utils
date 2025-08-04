import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import _path from 'path';

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllButObject,
    generateGlobPatterns,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[TestUiTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/test-ui-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'TestUiTaskBuilder',
    );

    injectBuilderInitTests(_importModule, 'test-ui', `Execute web UI tests`);

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = createExecaMock();
            const TestUiTaskBuilder = await _importModule({
                execaModuleMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new TestUiTaskBuilder();
            return {
                execaModuleMock,
                project,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify UI test task (${title})`, function () {
                it('should invoke jest to run tests on the project', async function () {
                    const { execaModuleMock, project, task } =
                        await _createTask(overrides);

                    const execaMock = execaModuleMock.execa;
                    const thenMock = execaModuleMock.then;

                    const [jestBin] = ['jest'].map((bin) =>
                        _path.join(
                            project.rootDir.absolutePath,
                            'node_modules',
                            '.bin',
                            bin,
                        ),
                    );

                    expect(execaMock).to.not.have.been.called;
                    expect(thenMock).to.not.have.been.called;

                    task();

                    expect(execaMock).to.have.been.calledOnceWithExactly(
                        jestBin,
                        ['--config', 'jest.config.js', '--coverage'],
                        { stdio: 'inherit' },
                    );

                    expect(thenMock).to.have.been.calledOnce;
                    expect(thenMock).to.have.been.calledAfter(execaMock);
                    expect(thenMock.args[0]).to.have.length(2);

                    const [successHandler, errorHandler] = thenMock.args[0];
                    expect(successHandler).to.be.undefined;
                    expect(errorHandler).to.be.a('function');
                    // Invoke the error handler - it should do nothing, but
                    // there's no way to test doing nothing, so this will have
                    // to do for now.
                    expect(errorHandler()).to.be.undefined;
                });
            });
        });
    });

    describe('getWatchPaths()', function () {
        function createPathList(project) {
            const dirs = ['src', 'test'];
            const extensions = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
            const rootDir =
                project.language === 'ts'
                    ? _path.join(project.rootDir.absolutePath, 'working')
                    : project.rootDir.absolutePath;

            if (project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

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

                const rootDir = project.rootDir.absolutePath;
                const paths = createPathList(project);

                expect(ret).to.have.lengthOf(paths.length);
                expect(ret).to.have.members(paths);
            });
        });
    });
});
