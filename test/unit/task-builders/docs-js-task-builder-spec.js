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

describe('[DocsJsTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/docs-js-task-builder.js',
        {
            gulpMock: 'gulp',
            gulpJsDocMock: 'gulp-jsdoc3',
            taskBuilderMock: 'src/task-builder.js',
        },
        'DocsJsTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'docs-js',
        'Generates documentation from code comments in javascript files'
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const gulpJsDocMock = stub().callsFake(() => ({
                _source: '_jsdoc_ret_',
            }));
            const gulpMock = createGulpMock();

            const DocsJsTaskBuilder = await _importModule({
                gulpMock,
                gulpJsDocMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new DocsJsTaskBuilder();

            return {
                gulpMock,
                gulpJsDocMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const dirs = ['src'];
            const extensions = ['js'];
            const rootDir = project.rootDir.absolutePath;

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, function () {
                it('should inititalize and set the appropriate gulp source files', async function () {
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

                it('should pipe the source files to the document generator to extract docs', async function () {
                    const { gulpMock, task, gulpJsDocMock, project } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpJsDocMock).to.not.have.been.called;

                    task();

                    expect(gulpJsDocMock).to.have.been.calledOnce;
                    expect(gulpJsDocMock.args[0]).to.have.length(1);
                    expect(gulpJsDocMock.args[0][0]).to.deep.equal({
                        opts: {
                            readme: _path.join(
                                project.rootDir.absolutePath,
                                'README.md'
                            ),
                            destination: _path.join(
                                project.rootDir.absolutePath,
                                'docs',
                                project.name,
                                project.version
                            ),
                            template: 'node_modules/docdash',
                        },
                    });

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[1]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpJsDocMock.returnValues[0]
                    );
                });
            });
        });
    });
});
