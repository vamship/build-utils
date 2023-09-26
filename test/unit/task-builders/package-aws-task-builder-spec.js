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
    getAllButObject,
    generateGlobPatterns,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[PackageAwsTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/package-aws-task-builder.js',
        {
            execaModuleMock: 'execa',
            gulpMock: 'gulp',
            zipMock: 'gulp-zip',
            taskBuilderMock: 'src/task-builder.js',
        },
        'PackageAwsTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'package-aws',
        `Package a project for publishing to AWS`
    );

    describe('[task composition]', () => {
        it('should create a task composed of three subtasks', async () => {
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
            expect(gulpMock.series.args[0][0]).to.have.length(2);
            gulpMock.series.args[0][0].forEach((arg) => {
                expect(arg).to.be.a('function');
            });
        });
    });

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const gulpMock = createGulpMock();
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const zipMock = stub().callsFake(() => ({
                _source: '_zip_ret_',
            }));
            const PackageAwsTaskBuilder = await _importModule({
                gulpMock,
                execaModuleMock,
                zipMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new PackageAwsTaskBuilder();
            return {
                project,
                gulpMock,
                execaModuleMock,
                zipMock,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const dirs = ['src', 'node_modules'];
            const extensions = [''];
            const extras = ['package.json', project.configFileName];
            const rootDir =
                project.language === 'js'
                    ? project.rootDir
                    : project.rootDir.getChild('working');

            return generateGlobPatterns(
                rootDir.absolutePath,
                dirs,
                extensions
            ).concat(
                extras.map((file) => _path.join(rootDir.absolutePath, file))
            );
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            const language = overrides['buildMetadata.language'];
            const jsRootDir = language == 'js' ? '' : `working${_path.sep}`;

            describe(`Verify task (${title})`, () => {
                it('should invoke npm to install project dependencies', async () => {
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
                        ['install', '--production'],
                        {
                            stdio: 'inherit',
                            cwd: _path.join(
                                project.rootDir.absolutePath,
                                jsRootDir
                            ),
                        }
                    );
                });

                it('should inititalize and set the appropriate gulp source files for packaging', async () => {
                    const {
                        execaModuleMock: { execa: execaMock },
                        project,
                        gulpMock,
                    } = await _createTask(overrides);
                    const [_first, task] = gulpMock.series.args[0][0];

                    expect(gulpMock.src).to.not.have.been.called;

                    task();

                    expect(gulpMock.src).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[1]).to.equal('src');
                    expect(gulpMock.src.args[0]).to.have.length(2);
                    expect(gulpMock.src.args[0][0]).to.have.members(
                        createSourceList(project)
                    );

                    expect(gulpMock.src.args[0][1]).to.deep.equal({
                        allowEmpty: true,
                        base: project.rootDir.globPath,
                    });
                });

                it('should pipe the source files to the zip task for packaging', async () => {
                    const {
                        execaModuleMock: { execa: execaMock },
                        project,
                        gulpMock,
                        zipMock,
                    } = await _createTask(overrides);
                    const [_first, task] = gulpMock.series.args[0][0];

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(zipMock).to.not.have.been.called;

                    task();

                    expect(zipMock).to.have.been.calledOnceWith(
                        `${project.kebabCasedName}-${project.version}.zip`
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[2]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        zipMock.returnValues[0]
                    );
                });

                it('should write the packaged file to the distribution directory', async () => {
                    const {
                        execaModuleMock: { execa: execaMock },
                        project,
                        gulpMock,
                    } = await _createTask(overrides);
                    const [_first, task] = gulpMock.series.args[0][0];

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[3]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        _path.join(project.rootDir.absolutePath, 'dist') +
                            _path.sep
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[4]).to.equal('pipe');

                    expect(gulpMock.pipe.args[1]).to.have.length(1);
                    expect(gulpMock.pipe.args[1][0]).to.equal(
                        gulpMock.dest.returnValues[0]
                    );
                });
            });
        });
    });

    describe('getWatchPaths()', () => {
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
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const BuildTsTaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new BuildTsTaskBuilder('unit');
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async () => {
                const BuildTsTaskBuilder = await _importModule();
                const builder = new BuildTsTaskBuilder('unit');
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
