import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import _esmock from 'esmock';
import { getAllButObject } from '../../utils/data-generator.js';
import { Directory } from '../../../src/directory.js';
import { Project } from '../../../src/project.js';
import { buildProjectDefinition } from '../../utils/object-builder.js';

describe('[CleanTaskBuilder]', () => {
    const TASK_NAME = 'clean';
    const TASK_DESCRIPTION =
        'Cleans out working, distribution and temporary files and directories';

    async function _importModule(mockDefs) {
        const moduleMap = {
            deleteMock: 'delete',
            projectMock: '../../../src/project.js',
            taskBuilderMock: '../../../src/task-builder.js',
        };

        const mocks = Object.keys({ ...mockDefs }).reduce((result, key) => {
            result[moduleMap[key]] = mockDefs[key];
            return result;
        }, {});

        return await _esmock(
            '../../../src/task-builders/clean-task-builder.js',
            mocks
        );
    }

    describe('ctor()', () => {
        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const CleanTaskBuilder = await _importModule({
                taskBuilderMock: {
                    default: superCtor,
                },
            });

            expect(superCtor).not.to.have.been.called;

            new CleanTaskBuilder();

            expect(superCtor).to.have.been.calledOnceWithExactly(
                TASK_NAME,
                TASK_DESCRIPTION
            );
        });
    });

    describe('createTask()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const CleanTaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new CleanTaskBuilder();
                const wrapper = () => builder.createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async () => {
            const MockProject = function () {};
            const CleanTaskBuilder = await _importModule();
            const builder = new CleanTaskBuilder();

            const project = new Project(buildProjectDefinition());
            const task = builder.createTask(project);

            expect(typeof task).to.equal('function');
        });

        it('should have a display name and description associated with a task', async () => {
            const MockProject = function () {};
            const CleanTaskBuilder = await _importModule();
            const builder = new CleanTaskBuilder();

            const project = new Project(buildProjectDefinition());
            const task = builder.createTask(project);

            expect(task.displayName).to.equal(TASK_NAME);
            expect(task.description).to.equal(TASK_DESCRIPTION);
        });
    });

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const deleteMock = spy();
            const CleanTaskBuilder = await _importModule({
                deleteMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new CleanTaskBuilder();

            return {
                deleteMock,
                project,
                task: builder.createTask(project),
            };
        }

        [
            {
                title: `aws-microservice (js)`,
                expectedDirs: ['coverage', 'dist', 'working', 'cdk.out'],
                overrides: {
                    'buildMetadata.type': 'aws-microservice',
                    'buildMetadata.language': 'js',
                },
            },
            {
                title: `aws-microservice (ts)`,
                expectedDirs: [
                    'coverage',
                    'dist',
                    '.tscache',
                    'working',
                    'cdk.out',
                ],
                overrides: {
                    'buildMetadata.type': 'aws-microservice',
                    'buildMetadata.language': 'ts',
                },
            },
        ]
            .concat(
                ['lib', 'cli', 'api', 'ui', 'container'].map((type) => ({
                    title: `typescript project (${type})`,
                    expectedDirs: ['coverage', 'dist', 'working', '.tscache'],
                    overrides: {
                        'buildMetadata.type': type,
                        'buildMetadata.language': 'ts',
                    },
                }))
            )
            .forEach(({ title, expectedDirs, overrides }) => {
                it(`should delete the expected files for ${title}`, async () => {
                    const { deleteMock, project, task } = await _createTask(
                        overrides
                    );

                    const expectedPaths = expectedDirs.map(
                        (name) => `${project.rootDir.getFileGlob(name)}/`
                    );

                    expect(deleteMock).to.not.have.been.called;

                    task();

                    expect(deleteMock).to.have.been.calledOnce;
                    expect(deleteMock.args[0][0]).to.have.members(
                        expectedPaths
                    );
                });
            });
    });
});
