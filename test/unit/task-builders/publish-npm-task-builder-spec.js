import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
    getAllButObject,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createModuleImporter,
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PublishNpmTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/publish-npm-task-builder.js',
        {
            execaModuleMock: 'execa',
            gulpMock: 'gulp',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PublishNpmTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'publish-npm',
        `Publish a project to an NPM registry`
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = createExecaMock();
            const gulpMock = createGulpMock();
            const PublishNpmTaskBuilder = await _importModule({
                execaModuleMock,
                gulpMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PublishNpmTaskBuilder();
            return {
                project,
                execaModuleMock,
                gulpMock,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            const language = overrides['buildMetadata.language'];

            describe(`Verify task - (${title})`, function () {
                it('should invoke npm to publish the project', async function () {
                    const { execaModuleMock, project, task, gulpMock } =
                        await _createTask(overrides);
                    const execaMock = execaModuleMock.execa;
                    const thenMock = execaModuleMock.then;

                    const packageName = `${project.kebabCasedName}-${project.version}.tgz`;

                    const npmBin = 'npm';

                    expect(execaMock).to.not.have.been.called;
                    expect(thenMock).to.not.have.been.called;

                    task();

                    expect(execaMock).to.have.been.calledOnceWithExactly(
                        npmBin,
                        ['publish', packageName],
                        {
                            stdio: 'inherit',
                            cwd:
                                _path.join(
                                    project.rootDir.absolutePath,
                                    'dist'
                                ) + _path.sep,
                        }
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
