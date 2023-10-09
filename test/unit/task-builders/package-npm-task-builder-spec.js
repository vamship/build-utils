import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
    getAllButObject,
    generateGlobPatterns,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PackageNpmTaskBuilder]', function() {
    const _importModule = createModuleImporter(
        'src/task-builders/package-npm-task-builder.js',
        {
            execaModuleMock: 'execa',
            gulpMock: 'gulp',
            deleteMock: 'delete',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PackageNpmTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'package-npm',
        `Package a project for publishing to NPM`
    );

    describe('[task composition]', function() {
        it('should create a task composed of three subtasks', async function() {
            const gulpMock = createGulpMock();
            const TaskBuilder = await _importModule({
                gulpMock,
            });
            const builder = new TaskBuilder();
            const project = new Project(buildProjectDefinition());

            expect(gulpMock.series).to.not.have.been.called;

            const task = builder._createTask(project);

            expect(gulpMock.series).to.have.been.calledOnce;
            expect(gulpMock.series.args[0][0]).to.be.an('array');
            expect(gulpMock.series.args[0][0]).to.have.length(3);
            gulpMock.series.args[0][0].forEach((arg) => {
                expect(arg).to.be.a('function');
            });
        });
    });

    describe('[task]', function() {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const gulpMock = createGulpMock();
            const deleteMock = spy();
            const PackageNpmTaskBuilder = await _importModule({
                execaModuleMock,
                gulpMock,
                deleteMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PackageNpmTaskBuilder();
            return {
                project,
                execaModuleMock,
                gulpMock,
                deleteMock,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            const language = overrides['buildMetadata.language'];
            const jsRootDir = language == 'js' ? '' : `working${_path.sep}`;

            describe(`Verify task - package, copy, delete old - (${title})`, function() {
                it('should invoke npm to package the project', async function() {
                    const {
                        execaModuleMock: { execa: execaMock },
                        project,
                        gulpMock,
                    } = await _createTask(overrides);
                    const [task] = gulpMock.series.args[0][0];

                    const npmBin = 'npm';

                    expect(execaMock).to.not.have.been.called;

                    task();

                    expect(execaMock).to.have.been.calledOnceWithExactly(
                        npmBin,
                        ['pack'],
                        {
                            stdio: 'inherit',
                            cwd: _path.join(
                                project.rootDir.absolutePath,
                                jsRootDir
                            ),
                        }
                    );
                });

                it('should use gulp to copy the package to the distribution directory', async function() {
                    const { project, gulpMock } = await _createTask(overrides);
                    const [_first, task] = gulpMock.series.args[0][0];
                    const packageName = `${project.kebabCasedName}-${project.version}.tgz`;

                    expect(gulpMock.src).to.not.have.been.called;

                    task();

                    expect(gulpMock.src).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[1]).to.equal('src');
                    expect(gulpMock.src.args[0][0]).to.equal(
                        _path.join(
                            project.rootDir.absolutePath,
                            jsRootDir,
                            packageName
                        )
                    );
                });

                it('should write package archive to the distribution directory', async function() {
                    const { gulpMock, project } = await _createTask(overrides);
                    const [_first, task] = gulpMock.series.args[0][0];

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[2]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        _path.join(
                            project.rootDir.absolutePath,
                            'dist',
                            _path.sep
                        )
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[3]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpMock.dest.returnValues[0]
                    );
                });

                it('should delete the original package file from the source', async function() {
                    const { gulpMock, deleteMock, project } = await _createTask(
                        overrides
                    );
                    const [_first, _second, task] = gulpMock.series.args[0][0];
                    const packageName = `${project.kebabCasedName}-${project.version}.tgz`;

                    expect(deleteMock).to.not.have.been.called;

                    task();

                    expect(deleteMock).to.have.been.calledOnce;
                    expect(deleteMock.args[0][0]).to.have.members([
                        _path.join(
                            project.rootDir.absolutePath,
                            jsRootDir,
                            packageName
                        ),
                    ]);
                });
            });
        });
    });

    describe('getWatchPaths()', function() {
        function createPathList(project) {
            const dirs = ['src', 'test', 'infra'];
            const extensions = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
            const rootDir =
                project.language === 'ts'
                    ? _path.join(project.rootDir.absolutePath, 'working')
                    : project.rootDir.absolutePath;

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function() {
                const TaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder();
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function() {
                const TaskBuilder = await _importModule();
                const builder = new TaskBuilder();
                const project = new Project(buildProjectDefinition(overrides));

                const ret = builder.getWatchPaths(project);

                const rootDir = project.rootDir.absolutePath;
                const paths = createPathList(project);

                expect(ret).to.have.lengthOf(paths.length);
                expect(ret).to.have.members(paths);
            });
        });
    });
});
