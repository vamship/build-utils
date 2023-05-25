import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _camelcase from 'camelcase';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PublishNpmTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/publish-npm-task-builder.js',
        {
            execaModuleMock: 'execa',
            gulpMock: 'gulp',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PublishNpmTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'publish-npm',
        `Publish a project to an NPM registry`
    );

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const gulpMock = createGulpMock();
            const PublishNpmTaskBuilder = await _importModule({
                execaModuleMock,
                gulpMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PublishNpmTaskBuilder();
            return {
                project,
                execaModuleMock,
                gulpMock,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            const language = overrides['buildMetadata.language'];

            describe(`Verify task - (${title})`, () => {
                it('should invoke npm to publish the project', async () => {
                    const {
                        execaModuleMock: { execa: execaMock },
                        project,
                        task,
                        gulpMock,
                    } = await _createTask(overrides);
                    const packageName = `${project.kebabCasedName}-${project.version}.tgz`;

                    const npmBin = 'npm';

                    expect(execaMock).to.not.have.been.called;

                    task();

                    expect(execaMock).to.have.been.calledOnceWithExactly(
                        npmBin,
                        ['publish', packageName],
                        {
                            stdio: 'inherit',
                            cwd:
                                _path.join(
                                    project.rootDir.absolutePath,
                                    'dist'
                                ) + _path.sep,
                        }
                    );
                });
            });
        });
    });
});
