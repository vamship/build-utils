import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllButBoolean,
    getAllButObject,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PublishAwsTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/publish-aws-task-builder.js',
        {
            execaModuleMock: 'execa',
            dotenvModuleMock: 'dotenv',
            dotenvExpandMock: 'dotenv-expand',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PublishAwsTaskBuilder',
    );

    describe('ctor() <target, env>', function () {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${target})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid target (arg #1)';
                const requireApproval = false;
                const environment = 'infra';
                const wrapper = () =>
                    new TaskBuilder(target, environment, requireApproval);

                expect(wrapper).to.throw(error);
            });
        });

        getAllButString('').forEach((environment) => {
            it(`should throw an error if invoked without a valid environment (value=${environment})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid environment (arg #2)';
                const target = 'myStack'; // myStack is the name of the target populated by default (see object-builder.js)
                const requireApproval = false;
                const wrapper = () =>
                    new TaskBuilder(target, environment, requireApproval);

                expect(wrapper).to.throw(error);
            });
        });

        getAllButBoolean('').forEach((requireApproval) => {
            it(`should throw an error if invoked without a valid requireApproval (value=${requireApproval})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid requireApproval (arg #3)';
                const target = 'myStack'; // myStack is the name of the target populated by default (see object-builder.js)
                const environment = 'infra';
                const wrapper = () =>
                    new TaskBuilder(target, environment, requireApproval);

                expect(wrapper).to.throw(error);
            });
        });
    });

    injectBuilderInitTests(
        _importModule,
        'publish-aws',
        `Publish a CDK project to AWS`,
        ['myStack', 'infra', false], // myStack is the name of the target populated by default (see object-builder.js)
    );

    getAllProjectOverrides().forEach(({ title, overrides }) => {
        describe(`[Task Build] - (${title})`, function () {
            it('should throw an error if the specified stack has not been defined', async function () {
                const PackageContainerTaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const stackName = 'badStack';

                const builder = new PackageContainerTaskBuilder(
                    stackName,
                    'infra',
                    false,
                );

                const wrapper = () => builder.buildTask(project);

                // Note - this  error is thrown by the project object, not the task builder
                expect(wrapper).to.throw(new RegExp(`.*${stackName}.*`));
            });
        });
    });

    describe('[task]', function () {
        async function _createTask(definitionOverrides, options) {
            options = options || {};
            let { target, environment, requireApproval } = options;

            if (typeof target !== 'string' || target.length === 0) {
                target = 'myStack'; // myStack is the name of the target populated by default (see object-builder.js)
            }
            if (typeof environment !== 'string') {
                environment = 'infra';
            }
            if (typeof requireApproval !== 'boolean') {
                requireApproval = false;
            }

            const execaModuleMock = createExecaMock();
            const dotenvModuleMock = {
                config: stub().callsFake(() => ({
                    source: '_dotenv_config_ret_',
                })),
            };
            const dotenvExpandMock = stub();
            const PublishAwsTaskBuilder = await _importModule({
                execaModuleMock,
                dotenvModuleMock,
                dotenvExpandMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PublishAwsTaskBuilder(
                target,
                environment,
                requireApproval,
            );

            const checkStub = stub(
                project,
                'getUndefinedEnvironmentVariables',
            ).returns([]);

            return {
                project,
                environment,
                requireApproval,
                execaModuleMock,
                dotenvModuleMock,
                dotenvExpandMock,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            const language = overrides['buildMetadata.language'];
            const jsRootDir = language == 'js' ? '' : `working${_path.sep}`;

            describe(`Verify task - publish to AWS - (${title})`, function () {
                it('should initialize environment variables required for infrastructure deployment', async function () {
                    const infraEnv = 'infra-env';
                    const {
                        project,
                        task,
                        dotenvModuleMock: { config },
                        dotenvExpandMock,
                    } = await _createTask(overrides, { environment: infraEnv });

                    expect(config).to.not.have.been.called;
                    expect(dotenvExpandMock).to.not.have.been.called;

                    task();

                    expect(config).to.have.been.calledTwice;
                    [`.env.${infraEnv}`, '.env'].forEach((envFile, index) => {
                        expect(config.args[index][0]).to.equal(
                            _path.join(
                                project.rootDir.getChild('infra').absolutePath,
                                envFile,
                            ),
                        );
                    });

                    expect(dotenvExpandMock).to.have.been.calledTwice;
                    [config.returnValues[0], config.returnValues[1]].forEach(
                        (retValue, index) => {
                            expect(dotenvExpandMock.args[index][0]).to.equal(
                                retValue,
                            );
                        },
                    );
                });

                it('should verify that all required build arguments exist in the environment', async function () {
                    const {
                        project,
                        task,
                        dotenvModuleMock: { config },
                        dotenvExpandMock,
                    } = await _createTask(overrides, {});

                    project.getUndefinedEnvironmentVariables.returns([]);

                    expect(project.getUndefinedEnvironmentVariables).to.not.have
                        .been.called;

                    task();

                    expect(
                        project.getUndefinedEnvironmentVariables,
                    ).to.have.been.calledOnceWith();
                });

                it('should throw an error if any required build arguments are missing', async function () {
                    const {
                        project,
                        task,
                        dotenvModuleMock: { config },
                        dotenvExpandMock,
                    } = await _createTask(overrides, {});
                    const missingVars = ['foo', 'bar'];

                    project.getUndefinedEnvironmentVariables.returns(
                        missingVars,
                    );

                    const wrapper = () => task();

                    expect(wrapper).to.throw(
                        `Missing required environment variables: [${missingVars.join(
                            ',',
                        )}]`,
                    );
                });

                [true, false].forEach((requireApproval) => {
                    it(`should use the AWS CDK cli to publish the project to the cloud (requireApproval=${requireApproval})`, async function () {
                        const targetStack = 'stack1';
                        const stackName = 'stack-number-1';
                        const { execaModuleMock, project, task, gulpMock } =
                            await _createTask(
                                {
                                    ...overrides,
                                    'buildMetadata.aws.stacks': {
                                        [targetStack]: stackName,
                                    },
                                },
                                { target: targetStack, requireApproval },
                            );
                        const execaMock = execaModuleMock.execa;
                        const thenMock = execaModuleMock.then;

                        // This will be undefined if the env var is not set, and
                        // will be filtered out from the arg list
                        const infraArg = requireApproval
                            ? '--require-approval=never'
                            : undefined;

                        const cdkBin = 'cdk';
                        const expectedArgs = [
                            'deploy',
                            infraArg,
                            stackName,
                            '--app',
                            _path.join(
                                project.rootDir.absolutePath,
                                jsRootDir,
                                'infra',
                                'index',
                            ),
                        ].filter((arg) => typeof arg !== 'undefined'); // Filter out any undefined args

                        expect(execaMock).to.not.have.been.called;
                        expect(thenMock).to.not.have.been.called;

                        task();

                        expect(execaMock).to.have.been.calledOnce;

                        expect(execaMock.args[0]).to.have.lengthOf(3);

                        // First arg
                        expect(execaMock.args[0][0]).to.equal(cdkBin);

                        // Second arg
                        expect(execaMock.args[0][1])
                            .to.be.an('array')
                            .and.to.have.length(expectedArgs.length);
                        expectedArgs.forEach((arg, index) => {
                            expect(execaMock.args[0][1][index]).to.equal(arg);
                        });

                        // Third arg
                        expect(execaMock.args[0][2]).to.deep.equal({
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
                });
            });
        });
    });

    describe('getWatchPaths()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder('default', 'infra', false);
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function () {
                const TaskBuilder = await _importModule();
                const builder = new TaskBuilder('default', 'infra', false);
                const project = new Project(buildProjectDefinition(overrides));

                const ret = builder.getWatchPaths(project);

                expect(ret).to.deep.equal([]);
            });
        });
    });
});
