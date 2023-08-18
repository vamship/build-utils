import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _camelcase from 'camelcase';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllButBoolean,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PublishAwsTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/publish-aws-task-builder.js',
        {
            execaModuleMock: 'execa',
            dotenvModuleMock: 'dotenv',
            dotenvExpandMock: 'dotenv-expand',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PublishAwsTaskBuilder'
    );

    describe('ctor() <target, env>', () => {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${target})`, async () => {
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
            it(`should throw an error if invoked without a valid environment (value=${environment})`, async () => {
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
            it(`should throw an error if invoked without a valid requireApproval (value=${requireApproval})`, async () => {
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
        ['myStack', 'infra', false] // myStack is the name of the target populated by default (see object-builder.js)
    );

    getAllProjectOverrides().forEach(({ title, overrides }) => {
        describe(`[Task Build] - (${title})`, () => {
            it('should throw an error if the specified stack has not been defined', async () => {
                const PackageContainerTaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const stackName = 'badStack';

                const builder = new PackageContainerTaskBuilder(
                    stackName,
                    'infra',
                    false
                );

                const wrapper = () => builder.buildTask(project);

                // Note - this  error is thrown by the project object, not the task builder
                expect(wrapper).to.throw(new RegExp(`.*${stackName}.*`));
            });
        });
    });

    describe('[task]', () => {
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

            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
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
                requireApproval
            );

            const checkStub = stub(
                project,
                'getUndefinedEnvironmentVariables'
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

            describe(`Verify task - publish to AWS - (${title})`, () => {
                it('should initialize environment variables required for infrastructure deployment', async () => {
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
                                envFile
                            )
                        );
                    });

                    expect(dotenvExpandMock).to.have.been.calledTwice;
                    [config.returnValues[0], config.returnValues[1]].forEach(
                        (retValue, index) => {
                            expect(dotenvExpandMock.args[index][0]).to.equal(
                                retValue
                            );
                        }
                    );
                });

                it('should verify that all required build arguments exist in the environment', async () => {
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
                        project.getUndefinedEnvironmentVariables
                    ).to.have.been.calledOnceWith();
                });

                it('should throw an error if any required build arguments are missing', async () => {
                    const {
                        project,
                        task,
                        dotenvModuleMock: { config },
                        dotenvExpandMock,
                    } = await _createTask(overrides, {});
                    const missingVars = ['foo', 'bar'];

                    project.getUndefinedEnvironmentVariables.returns(
                        missingVars
                    );

                    const wrapper = () => task();

                    expect(wrapper).to.throw(
                        `Missing required environment variables: [${missingVars.join(
                            ','
                        )}]`
                    );
                });

                [true, false].forEach((requireApproval) => {
                    it(`should use the AWS CDK cli to publish the project to the cloud (requireApproval=${requireApproval})`, async () => {
                        const targetStack = 'stack1';
                        const stackName = 'stack-number-1';
                        const {
                            execaModuleMock: { execa: execaMock },
                            project,
                            task,
                            gulpMock,
                        } = await _createTask(
                            {
                                ...overrides,
                                'buildMetadata.aws.stacks': {
                                    [targetStack]: stackName,
                                },
                            },
                            { target: targetStack, requireApproval }
                        );

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
                                'index'
                            ),
                        ].filter((arg) => typeof arg !== 'undefined'); // Filter out any undefined args

                        expect(execaMock).to.not.have.been.called;

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
                                jsRootDir
                            ),
                        });
                    });
                });
            });
        });
    });
});