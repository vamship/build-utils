import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import { spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import { getAllProjectOverrides } from '../../utils/data-generator.js';
import { buildProjectDefinition, createModuleImporter } from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[CleanTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/clean-task-builder.js',
        {
            deleteMock: 'delete',
            taskBuilderMock: 'src/task-builder.js',
        },
        'CleanTaskBuilder'
    );

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

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            function createSourceList(project, overrides) {
                return [
                    'coverage',
                    'dist',
                    '.tscache',
                    'working',
                    'cdk.out',
                ].map((name) =>
                    _path.join(project.rootDir.absolutePath, name, _path.sep)
                );
            }

            describe(`Verify task (${title})`, () => {
                it('should delete the expected files', async () => {
                    const { deleteMock, project, task } = await _createTask(
                        overrides
                    );

                    expect(deleteMock).to.not.have.been.called;

                    task();

                    expect(deleteMock).to.have.been.calledOnce;
                    expect(deleteMock.args[0][0]).to.have.members(
                        createSourceList(project, overrides)
                    );
                });
            });
        });
    });
});
