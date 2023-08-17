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
    generateGlobPatterns,
    mapProjectList,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createFancyLogMock,
    createModuleImporter,
    createTaskBuilderMock,
    createTaskBuilderImportDefinitions,
    createTaskBuilderImportMocks,
    createCtorNotCalledChecker,
    buildFailMessage,
} from '../../utils/object-builder.js';
import {
    injectBuilderInitTests,
    injectSubBuilderCompositionTests,
} from '../../utils/task-builder-snippets.js';

describe('[PackageTaskBuilder]', () => {
    const _subBuilders = [
        'package-npm',
        'package-aws',
        'package-container',
        'not-supported',
    ];
    const _importDefinitions = createTaskBuilderImportDefinitions(_subBuilders);
    const _importModule = createModuleImporter(
        'src/task-builders/package-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            gulpMock: 'gulp',
            ..._importDefinitions,
        },
        'PackageTaskBuilder'
    );

    async function _initializeTask() {
        const gulpMock = createGulpMock();
        const { mocks, mockReferences } =
            createTaskBuilderImportMocks(_subBuilders);

        const TaskBuilder = await _importModule({
            gulpMock,
            ...mockReferences,
        });
        const builder = new TaskBuilder();

        return {
            builder,
            gulpMock,
            subBuilderMocks: mocks,
        };
    }

    function _getExpectedSubBuilders(project) {
        const { type, language, _container } = project;

        const containerTargetList = [];
        if (_container) {
            containerTargetList.push(...Object.keys(_container));
        }

        // Type lib
        if (type === 'lib') {
            return [{ name: 'package-npm', ctorArgs: [] }];
        }
        // Type aws-microservice
        else if (type === 'aws-microservice') {
            return [{ name: 'package-aws', ctorArgs: [] }];
        }
        // Type ui
        else if (type === 'ui') {
            return [{ name: 'not-supported', ctorArgs: [] }];
        }
        // Type container
        else if (type === 'container') {
            // Need to test this when multiple containers are defined
            const containerSubBuilders = [];
            containerTargetList.forEach((target) => {
                containerSubBuilders.push({
                    name: 'package-container',
                    ctorArgs: [target, _container[target].repo],
                });
            });

            return containerSubBuilders;
        }
        // Type cli
        else if (type === 'cli') {
            // Need to test this conditional functionality by using project overrides
            if (containerTargetList.length > 0) {
                const containerSubBuilders = [];
                containerTargetList.forEach((target) => {
                    containerSubBuilders.push({
                        name: 'package-container',
                        ctorArgs: [target, _container[target].repo],
                    });
                });

                return containerSubBuilders;
            } else {
                return [{ name: 'package-npm', ctorArgs: [] }];
            }
        }
        // Type api
        else if (type === 'api') {
            const containerSubBuilders = [];
            containerTargetList.forEach((target) => {
                containerSubBuilders.push({
                    name: 'package-container',
                    ctorArgs: [target, _container[target].repo],
                });
            });

            return containerSubBuilders;
        }
        // Type undefined or not supported
        return [{ name: 'not-supported', ctorArgs: [] }];
    }

    injectBuilderInitTests(
        _importModule,
        'package',
        `Packages project build files for publishing to a repository`
    );

    // Generalized composition tests
    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);

    // Composition tests specific to package task builder
    // Used for testing the usecase where multiple containers are defined
    const multipleContainerOverrides = mapProjectList(({ type, language }) => ({
        title: `${type} - ${language} - multiple-containers`,
        overrides: {
            'buildMetadata.type': type,
            'buildMetadata.language': language,
            'buildMetadata.container': {
                myBuild: {
                    repo: 'my-repo',
                    buildFile: 'BuildFile-1',
                    buildArgs: {
                        arg1: 'value1',
                    },
                },
                myBuildArm: {
                    repo: 'my-repo-arm',
                    buildFile: 'BuildFile-1-arm',
                    buildArgs: {
                        arg1: 'value1-arm',
                    },
                },
            },
        },
    }));

    // Used for testing the usecase where no containers are defined
    const noContainerOverrides = mapProjectList(({ type, language }) => ({
        title: `${type} - ${language} - no-container`,
        overrides: {
            'buildMetadata.type': type,
            'buildMetadata.language': language,
        },
        removals: ['container'],
    }));
    const allOverrides =
        multipleContainerOverrides.concat(noContainerOverrides);

    // Same general testing structure as injectSubBuilderCompositionTests with exceptions
    allOverrides.forEach(({ title, overrides, removals }) => {
        const checkCtorNotCalled = createCtorNotCalledChecker(overrides);

        describe(`[task composition] (${title})`, () => {
            it(`should initialize appropriate sub builders or error if improper definition`, async () => {
                const { builder, subBuilderMocks } = await _initializeTask(
                    overrides
                );
                const definition = buildProjectDefinition(overrides, removals);
                const project = new Project(definition);
                const expectedSubBuilders = _getExpectedSubBuilders(project);

                Object.values(subBuilderMocks).forEach(checkCtorNotCalled);

                builder._createTask(project);

                Object.keys(subBuilderMocks).forEach((mockName) => {
                    const mock = subBuilderMocks[mockName];
                    const builder = expectedSubBuilders.find(
                        (builder) => builder.name === mock._name
                    );
                    const ctor = mock.ctor;
                    const failMessage = buildFailMessage(overrides, {
                        task: mock._name,
                    });

                    if (builder) {
                        // Need to ask Vamshi about this test
                        // expect(ctor, failMessage).to.have.been.calledOnce;
                        expect(
                            ctor,
                            failMessage
                        ).to.have.been.calledWithExactly(...builder.ctorArgs);
                        expect(ctor, failMessage).to.have.been.calledWithNew;
                    } else {
                        expect(ctor, failMessage).to.not.have.been.called;
                    }
                });
            });

            it(`should create a composite task comprised of subtasks`, async () => {
                const { gulpMock, builder } = await _initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                expect(gulpMock.series).to.not.have.been.called;

                builder._createTask(project);

                expect(gulpMock.series).to.have.been.calledOnce;
                expect(gulpMock.series.args[0]).to.have.length(1);
                expect(gulpMock.series.args[0][0]).to.be.an('array');
                gulpMock.series.args[0][0].forEach((arg) => {
                    expect(arg).to.be.a('function');
                });
            });

            it(`should use the correct sub tasks for the composite task`, async () => {
                const { gulpMock, builder, subBuilderMocks } =
                    await _initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);
                const expectedSubBuilders = _getExpectedSubBuilders(project);

                builder._createTask(project);

                expect(gulpMock.series.args[0][0]).to.have.length(
                    expectedSubBuilders.length
                );

                expectedSubBuilders.forEach((builder, index) => {
                    const mock = subBuilderMocks[builder.name];
                    const failMessage = buildFailMessage(overrides, {
                        builder: builder.name,
                    });

                    expect(gulpMock.series.args[0][0], failMessage).to.include(
                        mock.buildTask()
                    );
                });
            });
        });
    });
});
