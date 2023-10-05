import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import { Project } from '../../../src/project.js';
import {
    getAllButObject,
    getAllButFunction,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createTaskBuilderMock,
} from '../../utils/object-builder.js';

describe('[Task Factory Utils]', function () {
    const _importModule = createModuleImporter(
        'src/utils/task-factory-utils.js',
        {},
    );

    it('should export expected methods', async function () {
        const { generateAdditionalContainerTasks } = await _importModule();
        expect(generateAdditionalContainerTasks).to.be.a('function');
    });

    describe('generateAdditionalContainerTasks()', function () {
        async function importFunction() {
            return (await _importModule()).generateAdditionalContainerTasks;
        }

        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without a valid project (value=${project})`, async function () {
                const func = await importFunction();
                const additionalTaskList = stub().returns([]);

                expect(() => func(project, additionalTaskList)).to.throw(
                    'Invalid project (arg #1)',
                );
            });
        });

        getAllButFunction({}).forEach((additionalTaskList) => {
            it(`should throw an error if invoked without a valid additional task list generator (value=${additionalTaskList})`, async function () {
                const func = await importFunction();
                const project = new Project(buildProjectDefinition());

                expect(() => func(project, additionalTaskList)).to.throw(
                    'Invalid additionalTaskList (arg #2)',
                );
            });
        });

        it('should return an empty array if no additional containers are defined', async function () {
            const func = await importFunction();
            const project = new Project(
                buildProjectDefinition({
                    'buildMetadata.container': {
                        default: {
                            repo: 'my-repo',
                            buildFile: 'BuildFile-1',
                            buildArgs: {
                                arg1: 'value1',
                            },
                        },
                    },
                }),
            );
            const additionalTaskList = stub().returns([]);

            const result = func(project, additionalTaskList);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should invoke the additional task list function for each non default container target', async function () {
            const func = await importFunction();
            const project = new Project(
                buildProjectDefinition({
                    'buildMetadata.container': {
                        default: {
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
                        myBuildArm2: {
                            repo: 'my-repo-arm',
                            buildFile: 'BuildFile-1-arm',
                            buildArgs: {
                                arg1: 'value1-arm',
                            },
                        },
                    },
                }),
            );
            const additionalTaskList = stub().returns([]);

            expect(additionalTaskList).to.not.have.been.called;

            const result = func(project, additionalTaskList);

            expect(additionalTaskList).to.have.been.calledTwice;
            ['myBuildArm', 'myBuildArm2'].forEach((target, index) => {
                expect(
                    additionalTaskList.getCall(index),
                ).to.have.been.calledWithExactly(target);
            });
        });

        it('should return an empty array if the additional task list returns an empty array', async function () {
            const func = await importFunction();
            const project = new Project(
                buildProjectDefinition({
                    'buildMetadata.container': {
                        default: {
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
                }),
            );
            const additionalTaskList = stub().returns([]);

            const result = func(project, additionalTaskList);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return include additional tasks for each target', async function () {
            const func = await importFunction();
            const project = new Project(
                buildProjectDefinition({
                    'buildMetadata.container': {
                        default: {
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
                        myBuildArm2: {
                            repo: 'my-repo-arm',
                            buildFile: 'BuildFile-1-arm',
                            buildArgs: {
                                arg1: 'value1-arm',
                            },
                        },
                    },
                }),
            );
            const additionalTaskList = (target) => [
                `_ret_${target}_1`,
                `_ret_${target}_2`,
            ];

            const result = func(project, additionalTaskList);

            const expectedResults = ['myBuildArm', 'myBuildArm2']
                .map((target) =>
                    [1, 2].map((index) => `_ret_${target}_${index}`),
                )
                .flat();

            expect(result).to.deep.equal(expectedResults);
        });
    });
});
