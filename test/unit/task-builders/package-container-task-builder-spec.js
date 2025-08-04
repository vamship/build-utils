import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import _path from 'path';

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    makeOptional,
    getAllButString,
    getAllProjectOverrides,
    getAllButObject,
    generateGlobPatterns,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

const specificContainerTarget = 'myBuildArm'; // This is a second build defined in object-builder.js

describe('[PackageContainerTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/package-container-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PackageContainerTaskBuilder',
    );

    beforeEach(() => {
        // Set environment variables so that validation against the default
        // build definition does not fail.
        process.env.ENV_1 = 'foo';
        process.env.ENV_2 = 'foo';
    });

    describe('ctor() <target, repo uri>', function () {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid build target (value=${target})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid target (arg #1)';
                const repo = undefined;
                const wrapper = () => new TaskBuilder(target, repo);

                expect(wrapper).to.throw(error);
            });
        });

        makeOptional(getAllButString('')).forEach((repo) => {
            it(`should throw an error if invoked without a valid repo url (value=${repo})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid repo (arg #2)';
                const wrapper = () =>
                    new TaskBuilder(specificContainerTarget, repo);

                expect(wrapper).to.throw(error);
            });
        });

        it('should not throw an error if the repo is undefined', async function () {
            const TaskBuilder = await _importModule();
            const wrapper = () =>
                new TaskBuilder(specificContainerTarget, undefined);

            expect(wrapper).to.not.throw();
        });
    });

    [undefined, 'custom-repo'].forEach((repo) => {
        ['default', specificContainerTarget].forEach((target) => {
            injectBuilderInitTests(
                _importModule,
                `package-container${
                    target === 'default' ? '' : '-' + target // Specifying a non default container creates a named task
                }`,
                `Package a project for publishing to a container registry`,
                [target, repo],
            );
        });
    });

    getAllProjectOverrides().forEach(({ title }) => {
        describe(`[Task Build] - (${title})`, function () {
            it('should verify that all required build arguments exist in the environment', async function () {
                const PackageContainerTaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const checkStub = stub(
                    project,
                    'getUndefinedEnvironmentVariables',
                ).returns([]);

                const builder = new PackageContainerTaskBuilder('default'); // default is the name of mandatory target populated by default

                expect(checkStub).to.not.have.been.called;

                builder.buildTask(project);

                expect(checkStub).to.have.been.calledOnceWith();
            });

            it('should throw an error if any required build arguments are missing', async function () {
                const PackageContainerTaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const checkStub = stub(
                    project,
                    'getUndefinedEnvironmentVariables',
                ).returns(['foo', 'bar']);

                const builder = new PackageContainerTaskBuilder('default'); // default is the name of mandatory target populated by default

                const wrapper = () => builder.buildTask(project);

                expect(wrapper).to.throw(
                    `Missing required environment variables: [foo, bar]`,
                );
            });
        });
    });

    describe('[task]', function () {
        const BUILD_TARGET = 'customTarget';
        const CONTAINER_REPO = 'custom-repo';
        const PROJECT_DESCRIPTION = 'Custom project description';
        const BUILD_FILE = 'custom-build-file';
        const STD_ARG_COUNT = 17;

        async function _createTask(target, repo, definitionOverrides) {
            const execaModuleMock = createExecaMock();
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
                typeof repoOverride === 'undefined'
                    ? CONTAINER_REPO
                    : repoOverride;

            getAllProjectOverrides(1).forEach(({ title, overrides }) => {
                const language = overrides['buildMetadata.language'];
                const jsRootDir = language == 'js' ? '' : `working${_path.sep}`;
                overrides = {
                    ...overrides,
                    description: PROJECT_DESCRIPTION,
                    'buildMetadata.container': {
                        default: {
                            repo: 'my-repo',
                            buildFile: 'BuildFile-1',
                            buildArgs: {
                                arg1: 'value1',
                            },
                            buildSecrets: {
                                mySecret: {
                                    type: 'file',
                                    src: 'secret.txt',
                                },
                            },
                        },
                        [BUILD_TARGET]: {
                            repo: CONTAINER_REPO,
                            buildFile: BUILD_FILE,
                            buildArgs: {},
                            buildSecrets: {},
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
                        BUILD_FILE,
                        '--tag',
                        `${expectedRepo}:latest`,
                        '--build-arg',
                        `APP_NAME=${project.unscopedName}`,
                        '--build-arg',
                        `APP_VERSION=${project.version}`,
                        '--build-arg',
                        `APP_DESCRIPTION='${PROJECT_DESCRIPTION}'`,
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
                        startTime + 100,
                    );

                    expect(args[args.length - 1]).to.equal('.');
                }

                describe(`Verify container image build - (${title})`, function () {
                    it(`should invoke docker to package the project (no build args/build secrets)`, async function () {
                        const { execaModuleMock, project, task } =
                            await _createTask(
                                BUILD_TARGET,
                                repoOverride,
                                overrides,
                            );

                        const execaMock = execaModuleMock.execa;
                        const thenMock = execaModuleMock.then;
                        const dockerBin = 'docker';

                        expect(execaMock).to.not.have.been.called;
                        expect(thenMock).to.not.have.been.called;

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
                                jsRootDir,
                            ),
                        });

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
                            } = await _createTask(BUILD_TARGET, repoOverride, {
                                ...overrides,
                                [`buildMetadata.container.${BUILD_TARGET}.buildArgs`]:
                                    buildArgs,
                                [`buildMetadata.container.${BUILD_TARGET}.buildSecrets`]:
                                    {},
                            });
                            const totalArgCount =
                                STD_ARG_COUNT + customArgCount;
                            const dockerBin = 'docker';

                            expect(execaMock).to.not.have.been.called;

                            task();

                            expect(execaMock).to.have.been.calledOnce;
                            const args = execaMock.getCall(0).args;

                            expect(args[0]).to.equal(dockerBin);

                            expect(args[1])
                                .to.be.an('array')
                                .that.has.lengthOf(totalArgCount);

                            _verifyCommonBuildArgs(project, args[1]);

                            buildArgList.forEach((arg, index) => {
                                const [expectedArg, expectedValue] = arg;
                                const offsetIndex =
                                    index * 2 + STD_ARG_COUNT - 1;

                                expect(args[1][offsetIndex]).to.equal(
                                    '--build-arg',
                                );

                                expect(args[1][offsetIndex + 1]).to.equal(
                                    `${expectedArg}=${expectedValue}`,
                                );
                            });

                            expect(args[2]).to.deep.equal({
                                stdio: 'inherit',
                                cwd: _path.join(
                                    project.rootDir.absolutePath,
                                    jsRootDir,
                                ),
                            });
                        });
                    });

                    [
                        { secret1: { type: 'env', src: 'SECRET_1' } },
                        {
                            secret1: { type: 'file', src: './secrets.txt' },
                            secret2: { type: 'env', src: 'SECRET_2' },
                        },
                    ].forEach((buildSecrets) => {
                        const customArgCount =
                            Object.keys(buildSecrets).length * 2;
                        const buildSecretList = Object.entries(buildSecrets);

                        it(`should invoke docker to package the project (build secret count = ${
                            customArgCount / 2
                        })`, async () => {
                            const {
                                execaModuleMock: { execa: execaMock },
                                task,
                                project,
                            } = await _createTask(BUILD_TARGET, repoOverride, {
                                ...overrides,
                                [`buildMetadata.container.${BUILD_TARGET}.buildArgs`]:
                                    {},
                                [`buildMetadata.container.${BUILD_TARGET}.buildSecrets`]:
                                    buildSecrets,
                            });
                            const totalArgCount =
                                STD_ARG_COUNT + customArgCount;
                            const dockerBin = 'docker';

                            expect(execaMock).to.not.have.been.called;

                            task();

                            expect(execaMock).to.have.been.calledOnce;
                            const args = execaMock.getCall(0).args;

                            expect(args[0]).to.equal(dockerBin);

                            expect(args[1])
                                .to.be.an('array')
                                .that.has.lengthOf(totalArgCount);

                            _verifyCommonBuildArgs(project, args[1]);

                            buildSecretList.forEach((arg, index) => {
                                const [expectedArg, expectedValue] = arg;
                                const { type, src } = expectedValue;
                                const offsetIndex =
                                    index * 2 + STD_ARG_COUNT - 1;

                                expect(args[1][offsetIndex]).to.equal(
                                    '--secret',
                                );

                                expect(args[1][offsetIndex + 1]).to.equal(
                                    `id=${expectedArg},src=${src},type=${type}`,
                                );
                            });

                            expect(args[2]).to.deep.equal({
                                stdio: 'inherit',
                                cwd: _path.join(
                                    project.rootDir.absolutePath,
                                    jsRootDir,
                                ),
                            });
                        });
                    });
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
                const builder = new TaskBuilder('default');
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function () {
                const TaskBuilder = await _importModule();
                const builder = new TaskBuilder('default');
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
