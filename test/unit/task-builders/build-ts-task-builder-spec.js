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
    createGulpMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[BuildTsTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/build-ts-task-builder.js',
        {
            gulpMock: 'gulp',
            gulpTypescriptMock: 'gulp-typescript',
            taskBuilderMock: 'src/task-builder.js',
        },
        'BuildTsTaskBuilder',
    );

    injectBuilderInitTests(
        _importModule,
        'build-ts',
        'Build typescript files and writes them to the build directory',
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const gulpMock = createGulpMock();
            const gulpTypescriptMock = {
                createProject: stub().callsFake(
                    () => gulpTypescriptMock.project,
                ),
                project: stub().callsFake(() => ({
                    _source: '_tsproject_ret_',
                })),
            };
            const BuildTsTaskBuilder = await _importModule({
                gulpMock,
                gulpTypescriptMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new BuildTsTaskBuilder();

            return {
                gulpMock,
                gulpTypescriptMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project) {
            const dirs = ['src', 'test'];
            const extensions = ['ts'];
            const rootDir = project.rootDir.absolutePath;

            if (project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, async function () {
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

                it('should create a new instance of the gulp typescript object', async function () {
                    const { gulpTypescriptMock, task } =
                        await _createTask(overrides);

                    expect(gulpTypescriptMock.createProject).to.not.have.been
                        .called;

                    task();

                    expect(
                        gulpTypescriptMock.createProject,
                    ).to.have.been.calledOnceWithExactly('tsconfig.json');
                });

                it('should create initialize the new typescript object to get a compiler reference', async function () {
                    const { gulpTypescriptMock, task } =
                        await _createTask(overrides);

                    expect(gulpTypescriptMock.project).to.not.have.been.called;

                    task();

                    expect(
                        gulpTypescriptMock.project,
                    ).to.have.been.calledOnceWithExactly();
                });

                it('should pipe the source files to the typescript compiler', async function () {
                    const { gulpMock, gulpTypescriptMock, task } =
                        await _createTask(overrides);

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[1]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.deep.equal(
                        gulpTypescriptMock.project.returnValues[0],
                    );
                });

                it('should handle any errors thrown during compilation', async function () {
                    const { gulpMock, gulpTypescriptMock, task } =
                        await _createTask(overrides);

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

                it('should write the source files to the working directories', async function () {
                    const { gulpMock, task, project } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[3]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        _path.join(
                            project.rootDir.absolutePath,
                            'working',
                            _path.sep,
                        ),
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
