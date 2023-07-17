import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllProjectOverrides,
    generateGlobPatterns,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createGulpMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[DocsTsTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/docs-ts-task-builder.js',
        {
            gulpMock: 'gulp',
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'DocsTsTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'docs-ts',
        'Generates documentation from code comments in typescript files'
    );

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const DocsTsTaskBuilder = await _importModule({
                execaModuleMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new DocsTsTaskBuilder();

            return {
                execaModuleMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const dirs = ['src'];
            const extensions = ['ts'];
            const rootDir = project.rootDir.absolutePath;

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, () => {
                it('should pipe the source files to the document generator to extract docs', async () => {
                    const {
                        task,
                        execaModuleMock: { execa: execaMock },
                        project,
                    } = await _createTask(overrides);
                    const typedocBin = 'typedoc';
                    const expectedArgs = [
                        '--out',
                        _path.join(
                            project.rootDir.absolutePath,
                            'docs',
                            project.version
                        ),
                        _path.join(project.rootDir.absolutePath, 'src') +
                            _path.sep,
                    ];

                    expect(execaMock).to.not.have.been.called;

                    task();

                    expect(execaMock).to.have.been.calledOnce;
                    expect(execaMock.args[0]).to.have.lengthOf(3);

                    // First arg
                    expect(execaMock.args[0][0]).to.equal(typedocBin);

                    // Second arg
                    expect(execaMock.args[0][1])
                        .to.be.an('array')
                        .and.to.have.length(expectedArgs.length);
                    expectedArgs.forEach((arg, index) => {
                        expect(execaMock.args[0][1][index]).to.equal(arg);
                    });

                    // Third arg
                    expect(execaMock.args[0][2]).to.deep.equal({
                        stdio: 'inherit',
                    });
                });
            });
        });
    });
});
