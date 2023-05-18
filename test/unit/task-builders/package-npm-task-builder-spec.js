import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _camelcase from 'camelcase';

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PackageNpmTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/package-npm-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PackageNpmTaskBuilder'
    );

    injectBuilderInitTests(_importModule, 'package-npm', `Package a project for publishing to NPM`);

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const PackageNpmTaskBuilder = await _importModule({
                execaModuleMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PackageNpmTaskBuilder();
            return {
                execaModuleMock,
                project,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            xdescribe(`Verify UI test task (${title})`, () => {
                it('should invoke jest to run tests on the project', async () => {
                    const {
                        execaModuleMock: { execa: execaMock },
                        project,
                        task,
                    } = await _createTask(overrides);

                    const [jestBin] = ['jest'].map((bin) =>
                        _path.join(
                            project.rootDir.absolutePath,
                            'node_modules',
                            '.bin',
                            bin
                        )
                    );

                    expect(execaMock).to.not.have.been.called;
                    task();
                    expect(execaMock).to.have.been.calledOnceWithExactly(
                        jestBin,
                        ['--config', 'jest.config.js', '--coverage'],
                        { stdio: 'inherit' }
                    );
                });
            });
        });
    });
});
