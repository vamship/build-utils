import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
    getAllButObject,
    makeOptional,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createGulpMock,
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

const specificContainerTarget = 'myBuildArm'; // This is a second build defined in object-builder.js

describe('[PublishContainerTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/publish-container-task-builder.js',
        {
            execaModuleMock: 'execa',
            gulpMock: 'gulp',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PublishContainerTaskBuilder',
    );

    describe('ctor() <target, tag>', function () {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${target})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid target (arg #1)';
                const tag = undefined;
                const wrapper = () => new TaskBuilder(target, tag);

                expect(wrapper).to.throw(error);
            });
        });

        makeOptional(getAllButString('')).forEach((tag) => {
            it(`should throw an error if invoked without a tag (value=${tag})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid tag (arg #2)';
                const wrapper = () =>
                    new TaskBuilder(specificContainerTarget, tag);

                expect(wrapper).to.throw(error);
            });
        });
    });

    [undefined, '1.0.0'].forEach((tag) => {
        ['default', specificContainerTarget].forEach((target) => {
            injectBuilderInitTests(
                _importModule,
                `publish-container${
                    target === 'default' ? '' : '-' + target // Specifying a non default container creates a named task
                }-${tag || 'latest'}`,
                `Publish container image for ${target}:${tag || 'latest'}`,
                [target, tag],
            );
        });
    });

    getAllProjectOverrides().forEach(({ title, overrides }) => {
        describe(`[Task Build] - (${title})`, function () {
            it('should throw an error if the specified target has not been defined', async function () {
                const TaskBuilder = await _importModule();
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const target = 'badStack';

                const builder = new TaskBuilder(target);

                const wrapper = () => builder.buildTask(project);

                // Note - this  error is thrown by the project object, not the task builder
                expect(wrapper).to.throw(new RegExp(`.*${target}.*`));
            });

            it('should invoke gulp to chain the tag and publish tasks', async function () {
                const gulpMock = createGulpMock();
                const TaskBuilder = await _importModule({
                    gulpMock,
                });
                const definition = buildProjectDefinition();
                const project = new Project(definition);

                const builder = new TaskBuilder(specificContainerTarget);

                expect(gulpMock.series).to.not.have.been.called;

                builder.buildTask(project);

                expect(gulpMock.series).to.have.been.calledOnce;
                expect(gulpMock.series.args[0]).to.have.length(1);
                expect(gulpMock.series.args[0][0])
                    .to.be.an('array')
                    .and.to.have.lengthOf(2);
                gulpMock.series.args[0][0].forEach((task) => {
                    expect(task).to.be.a('function');
                });
            });
        });
    });

    describe('[task]', function () {
        async function _createTask(definitionOverrides, target, tag) {
            if (typeof target !== 'string' || target.length === 0) {
                target = 'default';
            }
            const execaModuleMock = createExecaMock();
            const gulpMock = createGulpMock();
            const PublishContainerTaskBuilder = await _importModule({
                execaModuleMock,
                gulpMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PublishContainerTaskBuilder(target, tag);

            return {
                project,
                execaModuleMock,
                task: builder.buildTask(project),
                gulpMock,
            };
        }

        const semverComponentsObj = {
            latest: ['latest'],
            1: ['1.0.0', '1.0', '1', 'latest'],
            '1.0': ['1.0.0', '1.0', '1', 'latest'],
            '1.0.0': ['1.0.0', '1.0', '1', 'latest'],
        };

        const projectList = getAllProjectOverrides().filter(
            ({ containerSpecified }) => containerSpecified,
        );

        projectList.forEach(({ title, overrides }) => {
            ['latest', '1', '1.0', '1.0.0'].forEach((tag) => {
                describe(`Verify task - publish to container registry - (${title})`, function () {
                    it(`should use the docker cli to tag the container image (tag=${tag})`, async function () {
                        const target = 'default';
                        const { execaModuleMock, gulpMock } = await _createTask(
                            {
                                ...overrides,
                            },
                            target,
                            tag,
                        );
                        const execaMock = execaModuleMock.execa;
                        const thenMock = execaModuleMock.then;

                        expect(execaMock).to.not.have.been.called;

                        const semverComponents = semverComponentsObj[tag];

                        // The number of tasks should be double the semver components
                        expect(gulpMock.series.args[0][0]).to.have.lengthOf(
                            semverComponents.length * 2,
                            'Number of tasks in gulp series is incorrect',
                        );

                        semverComponents.forEach((semTag, index) => {
                            const task = gulpMock.series.args[0][0][index];

                            const dockerBin = 'docker';
                            const expectedArgs = [
                                'tag',
                                target,
                                `${target}:${semTag}`,
                            ];

                            execaMock.resetHistory();
                            thenMock.resetHistory();

                            expect(task.displayName).to.equal(`tag-default-${semTag}`);

                            task();

                            expect(execaMock).to.have.been.calledOnce;

                            expect(execaMock.args[0]).to.have.lengthOf(3);

                            // First arg
                            expect(execaMock.args[0][0]).to.equal(dockerBin);

                            // Second arg
                            expect(execaMock.args[0][1])
                                .to.be.an('array')
                                .and.to.have.length(expectedArgs.length);
                            expectedArgs.forEach((arg, index) => {
                                expect(execaMock.args[0][1][index]).to.equal(
                                    arg,
                                );
                            });

                            // Third arg
                            expect(execaMock.args[0][2]).to.deep.equal({
                                stdio: 'inherit',
                            });

                            expect(thenMock).to.have.been.calledOnce;
                            expect(thenMock).to.have.been.calledAfter(
                                execaMock,
                            );
                            expect(thenMock.args[0]).to.have.length(2);

                            const [successHandler, errorHandler] =
                                thenMock.args[0];
                            expect(successHandler).to.be.undefined;
                            expect(errorHandler).to.be.a('function');
                            // Invoke the error handler - it should do nothing, but
                            // there's no way to test doing nothing, so this will have
                            // to do for now.
                            expect(errorHandler()).to.be.undefined;
                        });
                    });

                    it(`should use the docker cli to publish the image to the cloud (tag=${tag})`, async function () {
                        const target = 'default';
                        const { execaModuleMock, gulpMock } = await _createTask(
                            {
                                ...overrides,
                            },
                            target,
                            tag,
                        );
                        const execaMock = execaModuleMock.execa;
                        const thenMock = execaModuleMock.then;

                        expect(execaMock).to.not.have.been.called;
                        expect(thenMock).to.not.have.been.called;

                        const semverComponents = semverComponentsObj[tag];

                        // The number of tasks should be double the semver components
                        expect(gulpMock.series.args[0][0]).to.have.lengthOf(
                            semverComponents.length * 2,
                            'Number of tasks in gulp series is incorrect',
                        );

                        semverComponents.forEach((semTag, index) => {
                            const task =
                                gulpMock.series.args[0][0][
                                    index + semverComponents.length
                                ];

                            const dockerBin = 'docker';
                            const expectedArgs = [
                                'push',
                                `${target}:${semTag}`,
                            ];

                            execaMock.resetHistory();
                            thenMock.resetHistory();

                            expect(task.displayName).to.equal(`push-default-${semTag}`);

                            task();

                            expect(execaMock).to.have.been.calledOnce;

                            expect(execaMock.args[0]).to.have.lengthOf(3);

                            // First arg
                            expect(execaMock.args[0][0]).to.equal(dockerBin);

                            // Second arg
                            expect(execaMock.args[0][1])
                                .to.be.an('array')
                                .and.to.have.length(expectedArgs.length);
                            expectedArgs.forEach((arg, index) => {
                                expect(execaMock.args[0][1][index]).to.equal(
                                    arg,
                                );
                            });

                            // Third arg
                            expect(execaMock.args[0][2]).to.deep.equal({
                                stdio: 'inherit',
                            });

                            expect(thenMock).to.have.been.calledOnce;
                            expect(thenMock).to.have.been.calledAfter(
                                execaMock,
                            );
                            expect(thenMock.args[0]).to.have.length(2);

                            const [successHandler, errorHandler] =
                                thenMock.args[0];
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
    });

    describe('getWatchPaths()', function () {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder('latest');
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function () {
                const TaskBuilder = await _importModule();
                const builder = new TaskBuilder('latest');
                const project = new Project(buildProjectDefinition(overrides));

                const ret = builder.getWatchPaths(project);

                expect(ret).to.deep.equal([]);
            });
        });
    });
});
