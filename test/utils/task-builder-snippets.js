import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

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
    ctorArgs,
) {
    if (!(ctorArgs instanceof Array)) {
        ctorArgs = [];
    }

    describe(`ctor() ${JSON.stringify(ctorArgs)}`, function () {
        it('should invoke the super constructor with correct arguments', async function () {
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
                taskDescription,
            );
        });
    });

    describe(`_createTask() ${JSON.stringify(ctorArgs)}`, function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const TaskBuilder = await importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder(...ctorArgs);
                const wrapper = () => builder._createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async function () {
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
    getExpectedSubBuilders,
) {
    getAllProjectOverrides().forEach(({ title, overrides }) => {
        const checkCtorNotCalled = createCtorNotCalledChecker(overrides);

        describe(`[task composition] (${title})`, function () {
            it(`should initialize appropriate sub builders`, async function () {
                const { builder, subBuilderMocks } =
                    await initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);
                const expectedSubBuilders = getExpectedSubBuilders(project);

                Object.values(subBuilderMocks).forEach(checkCtorNotCalled);

                builder._createTask(project);

                Object.keys(subBuilderMocks).forEach((mockName) => {
                    const mock = subBuilderMocks[mockName];
                    const builder = expectedSubBuilders.find(
                        (builder) => builder.name === mock._name,
                    );
                    const ctor = mock.ctor;
                    const failMessage = buildFailMessage(overrides, {
                        task: mock._name,
                    });

                    if (builder) {
                        expect(ctor, failMessage).to.have.been.calledOnce;
                        expect(
                            ctor,
                            failMessage,
                        ).to.have.been.calledWithExactly(...builder.ctorArgs);
                        expect(ctor, failMessage).to.have.been.calledWithNew;
                    } else {
                        expect(ctor, failMessage).to.not.have.been.called;
                    }
                });
            });

            it(`should create a composite task comprised of subtasks`, async function () {
                const { gulpMock, builder } = await initializeTask(overrides);
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

            it(`should use the correct sub tasks for the composite task`, async function () {
                const { gulpMock, builder, subBuilderMocks } =
                    await initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);
                const expectedSubBuilders = getExpectedSubBuilders(project);

                builder._createTask(project);

                expect(gulpMock.series.args[0][0]).to.have.length(
                    expectedSubBuilders.length,
                );

                expectedSubBuilders.forEach((builder, index) => {
                    const mock = subBuilderMocks[builder.name];
                    const failMessage = buildFailMessage(overrides, {
                        builder: builder.name,
                    });

                    expect(gulpMock.series.args[0][0], failMessage).to.include(
                        mock.buildTask(),
                    );
                });
            });
        });
    });
}

/**
 * Injects tests that check the generation of watch paths from sub builders used
 * by the builder.
 *
 * @param {Function} createFactory A function that can be used to initialize a
 * factory with.
 * @param {Function} getExpectedTaskBuilders A function that returns the list
 * of expected task builders for the factory.
 */
export function injectWatchPathsCompositionTests(
    initializeTask,
    getExpectedSubBuilders,
) {
    describe(`getWatchPaths()`, function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const { builder } = await initializeTask();
                const error = 'Invalid project (arg #1)';
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`[path generation] (${title})`, function () {
                it(`should obtain watch watch paths from sub builders`, async function () {
                    const { builder, subBuilderMocks } =
                        await initializeTask(overrides);
                    const definition = buildProjectDefinition(overrides);
                    const project = new Project(definition);
                    const expectedSubBuilders = getExpectedSubBuilders(project);

                    Object.values(subBuilderMocks).forEach((mock) => {
                        const failMessage = buildFailMessage(overrides, {
                            task: `${mock._name} (watch paths)`,
                        });
                        expect(mock.getWatchPaths, failMessage).to.not.have.been
                            .called;
                    });

                    builder.getWatchPaths(project);

                    expectedSubBuilders.forEach((builder, index) => {
                        const mock = subBuilderMocks[builder.name];
                        const failMessage = buildFailMessage(overrides, {
                            task: `${mock._name} (watch paths)`,
                        });
                        expect(
                            mock.getWatchPaths,
                            failMessage,
                        ).to.have.been.calledOnceWithExactly(project);
                    });
                });

                it(`should consoldiate all watch paths into a unique list`, async function () {
                    const { builder, subBuilderMocks } =
                        await initializeTask(overrides);
                    const definition = buildProjectDefinition(overrides);
                    const project = new Project(definition);
                    const expectedSubBuilders = getExpectedSubBuilders(project);

                    const paths = builder.getWatchPaths(project);

                    const pathList = expectedSubBuilders
                        .map((builder) => {
                            const mock = subBuilderMocks[builder.name];
                            return mock.getWatchPaths(project);
                        })
                        .flat();
                    const expectedPaths = [...new Set(pathList)];

                    expect(paths).to.have.length(expectedPaths.length);
                    expect(paths).to.have.members(expectedPaths);
                });
            });
        });
    });
}
