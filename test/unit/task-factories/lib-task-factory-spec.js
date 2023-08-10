import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import { LibTaskFactory } from '../../../src/task-factories/lib-task-factory.js';
import { Project } from '../../../src/project.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createTaskBuilderMock,
    createTaskBuilderImportDefinitions,
    createTaskBuilderImportMocks,
    buildFailMessage,
} from '../../utils/object-builder.js';

import {
    getAllProjectOverrides,
    getSelectedProjectOverrides,
} from '../../utils/data-generator.js';
import { injectFactoryInitTests } from '../../utils/task-factory-snippets.js';

describe('[LibTaskFactory]', () => {
    const _builderNames = [
        'clean',
        'format',
        'lint',
        'lint-fix',
        'package-npm',
        'publish-npm',

        'build',

        'docs-js',
        'docs-ts',
    ];
    const importDefinitions = createTaskBuilderImportDefinitions(_builderNames);

    const _importModule = createModuleImporter(
        'src/task-factories/lib-task-factory.js',
        {
            taskFactoryMock: 'src/task-factory.js',
            ...importDefinitions,
        },
        'LibTaskFactory'
    );

    injectFactoryInitTests(
        _importModule,
        new Project(buildProjectDefinition())
    );

    function _getExpectedTaskBuilders(project) {
        const builders = {
            common: [
                { name: 'clean', ctorArgs: [] },
                { name: 'format', ctorArgs: [] },
                { name: 'lint', ctorArgs: [] },
                { name: 'lint-fix', ctorArgs: [] },
                { name: 'build', ctorArgs: [project] },
                { name: 'package-npm', ctorArgs: [] },
                { name: 'publish-npm', ctorArgs: [] },
            ],
            js: [{ name: 'docs-js', ctorArgs: [] }],
            ts: [{ name: 'docs-ts', ctorArgs: [] }],
        };

        return builders.common.concat(builders[project.language]);
    }

    describe('_createTaskBuilders()', () => {
        async function _createFactory(overrides) {
            const { mocks, mockReferences } =
                createTaskBuilderImportMocks(_builderNames);
            const TaskFactory = await _importModule(mockReferences);
            const definition = buildProjectDefinition(overrides);
            const project = new Project(definition);
            const factory = new TaskFactory(project);

            return { project, factory, mocks };
        }

        function _createCtorNotCalledChecker(overrides) {
            return (mock) => {
                const failMessage = buildFailMessage(overrides, {
                    task: mock._name,
                });
                expect(mock.ctor, failMessage).not.to.have.been.called;
            };
        }

        describe(`[Unsupported Project Types]`, () => {
            getAllProjectOverrides()
                .filter(({ overrides }) => {
                    return overrides['buildMetadata.type'] !== 'lib';
                })
                .forEach(({ title, overrides }) => {
                    const checkCtorNotCalled =
                        _createCtorNotCalledChecker(overrides);

                    it(`should not initialize any task builders for unsupported project types (${title})`, async () => {
                        const { factory, mocks } = await _createFactory(
                            overrides
                        );

                        Object.values(mocks).forEach(checkCtorNotCalled);

                        factory._createTaskBuilders();

                        Object.values(mocks).forEach(checkCtorNotCalled);
                    });

                    it(`should return an empty task list for unsupported project types (${title})`, async () => {
                        const { factory } = await _createFactory(overrides);
                        const ret = factory._createTaskBuilders();
                        const failMessage = buildFailMessage(overrides);

                        expect(ret, failMessage).to.be.an('Array').and.to.be
                            .empty;
                    });
                });
        });

        getSelectedProjectOverrides(['lib']).forEach(({ title, overrides }) => {
            const checkCtorNotCalled = _createCtorNotCalledChecker(overrides);

            describe(`[${title}]`, () => {
                it(`should initialize the expected task builders`, async () => {
                    const { project, factory, mocks } = await _createFactory(
                        overrides
                    );

                    const expectedBuilders = _getExpectedTaskBuilders(project);

                    Object.values(mocks).forEach(checkCtorNotCalled);

                    factory._createTaskBuilders();

                    Object.keys(mocks).forEach((subBuilderMock) => {
                        const mock = mocks[subBuilderMock];
                        const builder = expectedBuilders.find(
                            (builder) => builder.name === mock._name
                        );
                        const ctor = mock.ctor;
                        const failMessage = buildFailMessage(overrides, {
                            task: mock._name,
                        });

                        if (builder) {
                            expect(ctor, failMessage).to.have.been.calledOnce;
                            expect(
                                ctor,
                                failMessage
                            ).to.have.been.calledWithExactly(
                                ...builder.ctorArgs
                            );
                            expect(ctor, failMessage).to.have.been
                                .calledWithNew;
                        } else {
                            expect(ctor, failMessage).to.not.have.been.called;
                        }
                    });
                });

                it(`should return the expected task builders`, async () => {
                    const { project, factory, mocks } = await _createFactory(
                        overrides
                    );
                    const failMessage = buildFailMessage(overrides);

                    const expectedBuilders = _getExpectedTaskBuilders(project);

                    const ret = factory._createTaskBuilders();

                    expect(ret, failMessage)
                        .to.be.an('Array')
                        .and.to.have.length(expectedBuilders.length);

                    expectedBuilders.forEach((builder, index) => {
                        const mock = mocks[builder.name];
                        const failMessage = buildFailMessage(overrides, {
                            builder: builder.name,
                        });

                        expect(ret, failMessage).to.include(mock);
                    });
                });
            });
        });
    });
});
