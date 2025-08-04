import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import _path from 'path';

import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllProjectOverrides,
    getSelectedProjectOverrides,
    generateGlobPatterns,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[BuildJsTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/build-js-task-builder.js',
        {
            gulpMock: 'gulp',
            taskBuilderMock: 'src/task-builder.js',
        },
        'BuildJsTaskBuilder',
    );

    injectBuilderInitTests(
        _importModule,
        'build-js',
        'Copies javascript files from source to destination directories',
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const gulpMock = createGulpMock();
            const BuildJsTaskBuilder = await _importModule({
                gulpMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new BuildJsTaskBuilder();

            return {
                gulpMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const dirs = ['src', 'test'];
            const extensions = ['js'];
            const rootDir = project.rootDir.absolutePath;

            if (project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, function () {
                it('should inititalize and set the appropriate gulp source files', async function () {
                    const { gulpMock, task, project } =
                        await _createTask(overrides);
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

                it('should write the source files to the working directories', async function () {
                    const { gulpMock, task, project } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[1]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        _path.join(
                            project.rootDir.absolutePath,
                            'working',
                            _path.sep,
                        ),
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[2]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpMock.dest.returnValues[0],
                    );
                });
            });
        });
    });
});
