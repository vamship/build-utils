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

describe('[PackageNpmTaskBuilder]', () => {
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
            expect(gulpMock.series.args[0][0]).to.have.length(3);
            gulpMock.series.args[0][0].forEach((arg) => {
                expect(arg).to.be.a('function');
            });
        });
    });

    describe('[task]', () => {
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

            describe(`Verify task - package, copy, delete old - (${title})`, () => {
                it('should invoke npm to package the project', async () => {
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

                it('should use gulp to copy the package to the distribution directory', async () => {
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

                it('should write package archive to the distribution directory', async () => {
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

                it('should delete the original package file from the source', async () => {
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
});