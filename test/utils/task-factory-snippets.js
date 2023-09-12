import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import { getAllButObject } from './data-generator.js';
import {
    buildFailMessage,
    createCtorNotCalledChecker,
} from './object-builder.js';
import {
    getAllProjectOverrides,
    getSelectedProjectOverrides,
} from './data-generator.js';

/**
 * Injects default tests that apply to all task factories. This is a utility
 * function that makes it easier to write tests for the factories.
 *
 * @param {Function} importModule A function that can be used to import the task
 * factory module under test. This allows the calling module to inject mocks
 * into imported module.
 * @param {Project} project The project to use when testing the factory.
 * @param {Array} [ctorArgs=[]] Optional args to be passed to the task builder
 * constructor
 */
export function injectFactoryInitTests(importModule, project, ctorArgs) {
    if (!(ctorArgs instanceof Array)) {
        ctorArgs = [];
    }

    describe(`ctor() ${JSON.stringify(ctorArgs)}`, () => {
        const failMessage = buildFailMessage({
            type: project.type,
            language: project.language,
        });

        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without a valid project (value=${typeof project})`, async () => {
                const TaskFactory = await importModule({});
                const wrapper = () => new TaskFactory(project);
                const error = 'Invalid project (arg #1)';

                expect(wrapper, failMessage).to.throw(error);
            });
        });

        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const TaskFactory = await importModule({
                taskFactoryMock: {
                    default: superCtor,
                },
            });

            expect(superCtor, failMessage).not.to.have.been.called;

            new TaskFactory(project, ...ctorArgs);

            expect(superCtor, failMessage).to.have.been.calledOnceWithExactly(
                project
            );
        });
    });
}

/**
 * Injects tests that check that the task factory does not return any tasks for
 * unsupported project types.
 *
 * @param {String} projectType The project type that the task factory applies
 * to. All other project types are considered unsupported.
 * @param {Function} createFactory A function that can be used to initialize a
 * factory with.
 */
export function injectUnsupportedTasksTests(projectType, createFactory) {
    const projectOverrides = getAllProjectOverrides().filter(
        ({ overrides }) => overrides['buildMetadata.type'] !== projectType
    );

    describe(`[Unsupported Project Types]`, () => {
        projectOverrides.forEach(({ title, overrides }) => {
            const checkCtorNotCalled = createCtorNotCalledChecker(overrides);

            it(`should not initialize any task builders for unsupported project types (${title})`, async () => {
                const { factory, mocks } = await createFactory(overrides);

                Object.values(mocks).forEach(checkCtorNotCalled);

                factory._createTaskBuilders();

                Object.values(mocks).forEach(checkCtorNotCalled);
            });

            it(`should return an empty task list for unsupported project types (${title})`, async () => {
                const { factory } = await createFactory(overrides);
                const ret = factory._createTaskBuilders();
                const failMessage = buildFailMessage(overrides);

                expect(ret, failMessage).to.be.an('Array').and.to.be.empty;
            });
        });
    });
}

/**
 * Injects tests that check the composition of the subtasks included by the
 * factory.
 *
 * @param {String} projectType The project type that the task factory applies
 * to.
 * @param {Function} createFactory A function that can be used to initialize a
 * factory with.
 * @param {Function} getExpectedTaskBuilders A function that returns the list
 * of expected task builders for the factory.
 */
export function injectTaskBuilderCompositionTests(
    projectType,
    createFactory,
    getExpectedTaskBuilders
) {
    getSelectedProjectOverrides([projectType]).forEach(
        ({ title, overrides }) => {
            const checkCtorNotCalled = createCtorNotCalledChecker(overrides);

            describe(`[${title}]`, () => {
                it(`should initialize the expected task builders`, async () => {
                    const { project, factory, mocks } = await createFactory(
                        overrides
                    );

                    const expectedBuilders = getExpectedTaskBuilders(project);

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
                    const { project, factory, mocks } = await createFactory(
                        overrides
                    );
                    const failMessage = buildFailMessage(overrides);

                    const expectedBuilders = getExpectedTaskBuilders(project);

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
        }
    );
}

/**
 * Generates an array of objects for testing if a project has more than just
 * a default container defined. Testing for packaging and publishing.
 *
 * @param {Project} project The input project
 * @returns {Array} Array of builder objects for testing
 */
export function getAdditionalContainerBuilders(project) {
    const builders = [];
    const containerTargets = project.getContainerTargets();

    // > 1 since default container
    if (containerTargets.length > 1) {
        containerTargets
            .filter((x) => x !== 'default')
            .forEach((target) => {
                const specificTargetBuilders = [
                    { name: 'package-container', ctorArgs: [target] },
                    { name: 'publish-container', ctorArgs: [target] },
                ];
                builders.push(...specificTargetBuilders);
            });
    }

    return builders;
}
