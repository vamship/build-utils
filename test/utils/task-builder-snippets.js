import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import {
    buildProjectDefinition,
    createCtorNotCalledChecker,
    buildFailMessage,
} from './object-builder.js';
import { getAllButObject, getAllProjectOverrides } from './data-generator.js';
import { Project } from '../../src/project.js';
/**
 * Injects default tests that apply to all task builders. This is a utility
 * function that makes it easier to write tests for the builders.
 *
 * @param {Function} importModule A function that can be used to import the task
 * builder module under test. This allows the calling module to inject mocks
 * into imported module.
 * @param {String} taskName The expected name of the task.
 * @param {String} taskDescription The expected description of the task.
 * @param {Array} [ctorArgs=[]] Optional args to be passed to the task builder
 * constructor
 */
export function injectBuilderInitTests(
    importModule,
    taskName,
    taskDescription,
    ctorArgs
) {
    if (!(ctorArgs instanceof Array)) {
        ctorArgs = [];
    }

    describe(`ctor() ${JSON.stringify(ctorArgs)}`, () => {
        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const TaskBuilder = await importModule({
                taskBuilderMock: {
                    default: superCtor,
                },
            });

            expect(superCtor).not.to.have.been.called;

            new TaskBuilder(...ctorArgs);

            expect(superCtor).to.have.been.calledOnceWithExactly(
                taskName,
                taskDescription
            );
        });
    });

    describe(`_createTask() ${JSON.stringify(ctorArgs)}`, () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const TaskBuilder = await importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder(...ctorArgs);
                const wrapper = () => builder._createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async () => {
            const TaskBuilder = await importModule();
            const builder = new TaskBuilder(...ctorArgs);

            const project = new Project(buildProjectDefinition());
            const task = builder._createTask(project);

            expect(typeof task).to.equal('function');
        });
    });
}

/**
 * Injects tests that check the composition of the subtasks included by a
 * composite task.
 *
 * @param {Function} createFactory A function that can be used to initialize a
 * factory with.
 * @param {Function} getExpectedTaskBuilders A function that returns the list
 * of expected task builders for the factory.
 */
export function injectSubBuilderCompositionTests(
    initializeTask,
    getExpectedSubBuilders
) {
    getAllProjectOverrides().forEach(({ title, overrides }) => {
        const language = overrides['buildMetadata.language'];
        const type = overrides['buildMetadata.type'];
        const expectedSubBuilders = getExpectedSubBuilders(type, language);
        const checkCtorNotCalled = createCtorNotCalledChecker(overrides);

        describe(`[task composition] (${title})`, () => {
            it(`should initialize appropriate sub builders`, async () => {
                const { builder, subBuilderMocks } = await initializeTask(
                    overrides
                );
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                Object.values(subBuilderMocks).forEach(checkCtorNotCalled);

                const task = builder._createTask(project);

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
                        expect(ctor, failMessage).to.have.been.calledOnce;
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
                const { gulpMock, builder } = await initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                expect(gulpMock.series).to.not.have.been.called;

                const task = builder._createTask(project);

                expect(gulpMock.series).to.have.been.calledOnce;
                expect(gulpMock.series.args[0]).to.have.length(1);
                expect(gulpMock.series.args[0][0]).to.be.an('array');
                gulpMock.series.args[0][0].forEach((arg) => {
                    expect(arg).to.be.a('function');
                });
            });

            it(`should use the correct sub tasks for the composite task`, async () => {
                const { gulpMock, builder, subBuilderMocks } =
                    await initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                const task = builder._createTask(project);

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
}
