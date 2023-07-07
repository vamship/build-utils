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
            gulpTypeDocMock: 'gulp-typedoc',
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
            const gulpTypeDocMock = stub().callsFake(() => ({
                _source: '_typeodc_ret_',
            }));
            const gulpMock = createGulpMock();

            const DocsTsTaskBuilder = await _importModule({
                gulpMock,
                gulpTypeDocMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new DocsTsTaskBuilder();

            return {
                gulpMock,
                gulpTypeDocMock,
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
                it('should inititalize and set the appropriate gulp source files', async () => {
                    const { gulpMock, task, project } = await _createTask(
                        overrides
                    );
                    const files = createSourceList(project, overrides);

                    expect(gulpMock.src).to.not.have.been.called;

                    task();

                    expect(gulpMock.src).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[0]).to.equal('src');

                    expect(gulpMock.src.args[0]).to.have.length(2);
                    expect(gulpMock.src.args[0][0]).to.have.members(files);
                    expect(gulpMock.src.args[0][1]).to.deep.equal({
                        allowEmpty: true,
                        base: project.rootDir.globPath,
                    });
                });

                it('should pipe the source files to the document generator to extract docs', async () => {
                    const { gulpMock, task, gulpTypeDocMock, project } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpTypeDocMock).to.not.have.been.called;

                    task();

                    expect(gulpTypeDocMock).to.have.been.calledOnce;
                    expect(gulpTypeDocMock.args[0]).to.have.length(1);
                    expect(gulpTypeDocMock.args[0][0]).to.deep.equal({
                        name: `${project.name} Documentation`,
                        disableOutputCheck: true,
                        readme: _path.join(
                            project.rootDir.absolutePath,
                            'README.md'
                        ),
                        out: _path.join(
                            project.rootDir.absolutePath,
                            'docs',
                            project.name,
                            project.version
                        ),
                    });

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[1]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpTypeDocMock.returnValues[0]
                    );
                });
            });
        });
    });
});
