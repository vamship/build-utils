import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

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

describe('[FormatTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/format-task-builder.js',
        {
            gulpMock: 'gulp',
            gulpPrettierMock: 'gulp-prettier',
            taskBuilderMock: 'src/task-builder.js',
        },
        'FormatTaskBuilder',
    );

    injectBuilderInitTests(
        _importModule,
        'format',
        'Formats all source files, README.md and build scripts',
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const gulpPrettierMock = stub().callsFake(() => ({
                _source: '_prettier_ret_',
            }));
            const gulpMock = createGulpMock();

            const FormatTaskBuilder = await _importModule({
                gulpMock,
                gulpPrettierMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new FormatTaskBuilder();

            return {
                gulpMock,
                gulpPrettierMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const dirs = ['src', 'test'];
            const extensions = ['ts', 'js', 'json', 'py', 'tsx', 'jsx'];
            const rootDir = project.rootDir.absolutePath;

            if (project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions).concat([
                _path.join(rootDir, 'README.md'),
                _path.join(rootDir, 'Gulpfile.js'),
            ]);
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

                it('should pipe the source files to the prettier task for formatting', async function () {
                    const { gulpMock, task, gulpPrettierMock } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[1]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpPrettierMock.returnValues[0],
                    );
                });

                it('should handle any errors thrown during execution', async function () {
                    const { gulpMock, task } = await _createTask(overrides);

                    task();

                    expect(gulpMock.on).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[2]).to.equal('on');

                    expect(gulpMock.on.args[0]).to.have.length(2);
                    const [event, handler] = gulpMock.on.args[0];
                    expect(event).to.equal('error');
                    expect(handler).to.be.a('function');

                    // Invoke the error handler - it should do nothing, but
                    // there's no way to test doing nothing, so this will have
                    // to do for now.
                    expect(handler()).to.be.undefined;
                });

                it('should overwrite the source file with formatted contents', async function () {
                    const { gulpMock, task, project } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[3]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        project.rootDir.absolutePath,
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[4]).to.equal('pipe');

                    expect(gulpMock.pipe.args[1]).to.have.length(1);
                    expect(gulpMock.pipe.args[1][0]).to.equal(
                        gulpMock.dest.returnValues[0],
                    );
                });
            });
        });
    });
});
