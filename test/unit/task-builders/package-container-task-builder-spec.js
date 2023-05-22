import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _camelcase from 'camelcase';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    makeOptional,
    getAllButString,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PackageContainerTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/package-container-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PackageContainerTaskBuilder'
    );

    describe('ctor() <repo uri>', () => {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid build target (value=${target})`, async () => {
                const TaskBuilder = await _importModule();
                const error = 'Invalid target (arg #1)';
                const repo = undefined;
                const wrapper = () => new TaskBuilder(target, repo);

                expect(wrapper).to.throw(error);
            });
        });

        makeOptional(getAllButString('')).forEach((repo) => {
            it(`should throw an error if invoked without a valid repo url (value=${repo})`, async () => {
                const TaskBuilder = await _importModule();
                const error = 'Invalid repo (arg #2)';
                const target = 'my-target';
                const wrapper = () => new TaskBuilder(target, repo);

                expect(wrapper).to.throw(error);
            });
        });

        it('should not throw an error if the repo is undefined', async () => {
            const TaskBuilder = await _importModule();
            const wrapper = () => new TaskBuilder('my-target', undefined);

            expect(wrapper).to.not.throw();
        });
    });

    [undefined, 'custom-repo'].forEach((repo) =>
        injectBuilderInitTests(
            _importModule,
            'package-container',
            `Package a project for publishing to a container registry`,
            ['myBuild', repo] // myBuild is the name of the target populated by default (see object-builder.js)
        )
    );

    describe('[task]', () => {
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
            getAllProjectOverrides().forEach(({ title, overrides }) => {
                const language = overrides['buildMetadata.language'];
                const jsRootDir = language == 'js' ? '' : `working${_path.sep}`;

                describe(`Verify container image build - (${title})`, () => {
                    it('should invoke docker to package the project', async () => {
                        const target = 'customTarget';
                        const repo = 'custom-repo';
                        const description = 'Custom project description';
                        const buildFile = 'custom-build-file';
                        const buildArgs = {
                            arg1: 'value1',
                            arg2: 'value2',
                            arg3: 'value3',
                        };
                        overrides = {
                            ...overrides,
                            description,
                            'buildMetadata.container': {
                                [target]: {
                                    repo,
                                    buildFile,
                                    buildArgs: {
                                        ...buildArgs,
                                    },
                                },
                            },
                        };

                        const expectedRepo =
                            typeof repoOverride === 'undefined'
                                ? repo
                                : repoOverride;
                        const {
                            execaModuleMock: { execa: execaMock },
                            task,
                            project,
                        } = await _createTask(target, repoOverride, overrides);
                        const dockerBin = 'docker';

                        expect(execaMock).to.not.have.been.called;

                        const startTime = Date.now();
                        task();

                        expect(execaMock).to.have.been.calledOnce;
                        const args = execaMock.getCall(0).args;

                        expect(args[0]).to.equal(dockerBin);

                        expect(args[1]).to.be.an('array').that.has.lengthOf(16);
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
                            expect(args[1][index]).to.equal(expectedArg);
                        });

                        // Check for build timestamp arg within a range (because
                        // of timing differences between the test case and
                        // actual execution)
                        const [argName, argValue] = args[1][15].split('=');
                        expect(argName).to.equal('BUILD_TIMESTAMP');
                        expect(parseInt(argValue)).to.be.within(
                            startTime - 100,
                            startTime + 100
                        );

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
