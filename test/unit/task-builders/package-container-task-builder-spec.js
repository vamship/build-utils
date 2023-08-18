import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _camelcase from 'camelcase';

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    makeOptional,
    getAllButString,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

const specificContainerTarget = 'myBuildArm'; // This is a second build defined in object-builder.js

describe('[PackageContainerTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/package-container-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PackageContainerTaskBuilder'
    );

    beforeEach(() => {
        // Set environment variables so that validation against the default
        // build definition does not fail.
        process.env.ENV_1 = 'foo';
        process.env.ENV_2 = 'foo';
    });

    describe('ctor() <target, repo uri>', () => {
        makeOptional(getAllButString('')).forEach((target) => {
            it(`should throw an error if invoked without a valid build target (value=${target})`, async () => {
                const TaskBuilder = await _importModule();
                const error = 'Invalid target (arg #1)';
                const repo = undefined;
                const wrapper = () => new TaskBuilder(target, repo);

                expect(wrapper).to.throw(error);
            });
        });

        it('should not throw an error if the target is undefined', async () => {
            const TaskBuilder = await _importModule();
            const wrapper = () => new TaskBuilder(undefined, undefined);

            expect(wrapper).to.not.throw();
        });

        it('shoud not throw an error if the target is undefined with a valid repo', async () => {
            const TaskBuilder = await _importModule();
            const error = 'Must define a target for given repo';
            const repo = 'my-repo';
            const wrapper = () => new TaskBuilder(undefined, repo);

            expect(wrapper).to.not.throw(error);
        });

        makeOptional(getAllButString('')).forEach((repo) => {
            it(`should throw an error if invoked without a valid repo url (value=${repo})`, async () => {
                const TaskBuilder = await _importModule();
                const error = 'Invalid repo (arg #2)';
                const wrapper = () =>
                    new TaskBuilder(specificContainerTarget, repo);

                expect(wrapper).to.throw(error);
            });
        });

        it('should not throw an error if the repo is undefined', async () => {
            const TaskBuilder = await _importModule();
            const wrapper = () =>
                new TaskBuilder(specificContainerTarget, undefined);

            expect(wrapper).to.not.throw();
        });
    });

    [undefined, 'custom-repo'].forEach((repo) => {
        // Can explicitly state 'default' when overriding target repo or leave undefined
        ['default', undefined, specificContainerTarget].forEach((target) => {
            injectBuilderInitTests(
                _importModule,
                `package-container${
                    !target || target === 'default' ? '' : '-' + target // Specifying a non default container creates a named task
                }`,
                `Package a project for publishing to a container registry`,
                [target, repo]
            );
        });
    });

    getAllProjectOverrides().forEach(({ title }) => {
        describe(`[Task Build] - (${title})`, () => {
            it('should verify that all required build arguments exist in the environment', async () => {
                const PackageContainerTaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const checkStub = stub(
                    project,
                    'getUndefinedEnvironmentVariables'
                ).returns([]);

                const builder = new PackageContainerTaskBuilder();

                expect(checkStub).to.not.have.been.called;

                builder.buildTask(project);

                expect(checkStub).to.have.been.calledOnceWith();
            });

            it('should throw an error if any required build arguments are missing', async () => {
                const PackageContainerTaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const checkStub = stub(
                    project,
                    'getUndefinedEnvironmentVariables'
                ).returns(['foo', 'bar']);

                const builder = new PackageContainerTaskBuilder();

                const wrapper = () => builder.buildTask(project);

                expect(wrapper).to.throw(
                    `Missing required environment variables: [foo, bar]`
                );
            });
        });
    });

    describe('[task]', () => {
        const target = 'customTarget';
        const repo = 'custom-repo';
        const description = 'Custom project description';
        const buildFile = 'custom-build-file';
        const STD_ARG_COUNT = 17;

        async function _createTask(target, repo, definitionOverrides) {
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const PackageContainerTaskBuilder = await _importModule({
                execaModuleMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PackageContainerTaskBuilder(target, repo);

            return {
                project,
                execaModuleMock,
                task: builder.buildTask(project),
            };
        }

        ['overridden-repo', undefined].forEach((repoOverride) => {
            const expectedRepo =
                typeof repoOverride === 'undefined' ? repo : repoOverride;

            getAllProjectOverrides().forEach(({ title, overrides }) => {
                const language = overrides['buildMetadata.language'];
                const jsRootDir = language == 'js' ? '' : `working${_path.sep}`;
                overrides = {
                    ...overrides,
                    description,
                    'buildMetadata.container': {
                        default: {
                            repo: 'my-repo',
                            buildFile: 'BuildFile-1',
                            buildArgs: {
                                arg1: 'value1',
                            },
                        },
                        [target]: {
                            repo,
                            buildFile,
                            buildArgs: {},
                        },
                    },
                };

                function _verifyCommonBuildArgs(project, args) {
                    const startTime = Date.now();

                    let argCount = 0;
                    [
                        'build',
                        '--rm',
                        '--file',
                        buildFile,
                        '--tag',
                        `${expectedRepo}:latest`,
                        '--build-arg',
                        `APP_NAME=${project.unscopedName}`,
                        '--build-arg',
                        `APP_VERSION=${project.version}`,
                        '--build-arg',
                        `APP_DESCRIPTION='${description}'`,
                        '--build-arg',
                        `CONFIG_FILE_NAME=${project.configFileName}`,
                        '--build-arg',
                    ].forEach((expectedArg, index) => {
                        expect(args[index]).to.equal(expectedArg);
                        argCount++;
                    });

                    // Check for build timestamp arg within a range (because
                    // of timing differences between the test case and
                    // actual execution)
                    const [argName, argValue] = args[argCount].split('=');

                    expect(argName).to.equal('BUILD_TIMESTAMP');

                    expect(parseInt(argValue)).to.be.within(
                        startTime - 100,
                        startTime + 100
                    );

                    expect(args[args.length - 1]).to.equal('.');
                }

                describe(`Verify container image build - (${title})`, () => {
                    it(`should invoke docker to package the project (no build args)`, async () => {
                        const {
                            execaModuleMock: { execa: execaMock },
                            task,
                            project,
                        } = await _createTask(target, repoOverride, overrides);
                        const dockerBin = 'docker';

                        expect(execaMock).to.not.have.been.called;

                        task();

                        expect(execaMock).to.have.been.calledOnce;

                        const args = execaMock.getCall(0).args;

                        expect(args[0]).to.equal(dockerBin);

                        expect(args[1])
                            .to.be.an('array')
                            .that.has.lengthOf(STD_ARG_COUNT);

                        _verifyCommonBuildArgs(project, args[1]);

                        expect(args[2]).to.deep.equal({
                            stdio: 'inherit',
                            cwd: _path.join(
                                project.rootDir.absolutePath,
                                jsRootDir
                            ),
                        });
                    });

                    [
                        { arg1: 'value1' },
                        { arg1: 'value1', arg2: 'value2' },
                    ].forEach((buildArgs) => {
                        const customArgCount =
                            Object.keys(buildArgs).length * 2;
                        const buildArgList = Object.entries(buildArgs);

                        it(`should invoke docker to package the project (build arg count = ${
                            customArgCount / 2
                        })`, async () => {
                            const {
                                execaModuleMock: { execa: execaMock },
                                task,
                                project,
                            } = await _createTask(target, repoOverride, {
                                ...overrides,
                                [`buildMetadata.container.${target}.buildArgs`]:
                                    buildArgs,
                            });
                            const buildArgCount =
                                STD_ARG_COUNT + customArgCount;
                            const dockerBin = 'docker';

                            expect(execaMock).to.not.have.been.called;

                            task();

                            expect(execaMock).to.have.been.calledOnce;
                            const args = execaMock.getCall(0).args;

                            expect(args[0]).to.equal(dockerBin);

                            expect(args[1])
                                .to.be.an('array')
                                .that.has.lengthOf(buildArgCount);

                            _verifyCommonBuildArgs(project, args[1]);

                            buildArgList.forEach((arg, index) => {
                                const [expectedArg, expectedValue] = arg;
                                const offsetIndex =
                                    index * 2 + STD_ARG_COUNT - 1;

                                expect(args[1][offsetIndex]).to.equal(
                                    '--build-arg'
                                );

                                expect(args[1][offsetIndex + 1]).to.equal(
                                    `${expectedArg}=${expectedValue}`
                                );
                            });

                            expect(args[2]).to.deep.equal({
                                stdio: 'inherit',
                                cwd: _path.join(
                                    project.rootDir.absolutePath,
                                    jsRootDir
                                ),
                            });
                        });
                    });
                });
            });
        });
    });
});