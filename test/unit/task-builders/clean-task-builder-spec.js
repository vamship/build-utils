import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import { buildProjectDefinition } from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[CleanTaskBuilder]', () => {
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

    injectBuilderInitTests(
        _importModule,
        'clean',
        'Cleans out working, distribution and temporary files and directories'
    );

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
                task: builder.buildTask(project),
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
