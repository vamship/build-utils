import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import { camelCase as _camelCase } from 'change-case';

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

describe('[CopyFilesTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/copy-files-task-builder.js',
        {
            gulpMock: 'gulp',
            taskBuilderMock: 'src/task-builder.js',
        },
        'CopyFilesTaskBuilder',
    );

    injectBuilderInitTests(
        _importModule,
        'copy-files',
        'Copies project files from source to build directories',
    );

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const gulpMock = createGulpMock();
            const CopyFilesTaskBuilder = await _importModule({
                gulpMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new CopyFilesTaskBuilder();

            return {
                gulpMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const {
                name,
                'buildMetadata.staticFilePatterns': staticFilePatterns,
                'buildMetadata.container': container = {},
            } = overrides;
            const extras = [
                `.${_camelCase(name.replace(/(^@[a-zA-Z]*\/)/g, ''))}rc`,
                'package.json',
                'package-lock.json',
                'LICENSE',
                'README.md',
                '_scripts/*',
                'nginx.conf',
                '.env',
                '.npmignore',
                '.npmrc',
            ].concat(
                Object.keys(container).map(
                    (key) => container[key].buildFile || 'Dockerfile',
                ),
            );
            const dirs = ['src', 'test'];
            const extensions = ['json'].concat(staticFilePatterns);
            const rootDir = project.rootDir.absolutePath;

            if(project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions).concat(
                extras.map((file) => _path.join(rootDir, file)),
            );
        }

        // List of all projects - they can all run without containers
        const projectsWithoutContainer = getAllProjectOverrides().map(
            ({ title, overrides }) => ({
                title,
                overrides: {
                    ...overrides,
                    'buildMetadata.container': undefined,
                },
            }),
        );

        // Identify projects that can support containers
        const projectsWithContainer = getSelectedProjectOverrides([
            'cli',
            'api',
            'ui',
            'container',
        ]).map(({ title, overrides }) => ({
            title: `${title} (with container)`,
            overrides: {
                ...overrides,
                'buildMetadata.container': {
                    default: {
                        repo: 'repo1',
                    },
                    custom: {
                        repo: 'repo2',
                        buildFile: 'CustomBuildFile',
                    },
                },
            },
        }));

        // Combine all project types and set default properties on the
        // definition.
        const projectOverrides = projectsWithoutContainer
            .concat(projectsWithContainer)
            .map(({ title, overrides }) => ({
                title,
                overrides: {
                    ...overrides,
                    'buildMetadata.staticFilePatterns': [],
                    name: '@test/my-package',
                },
            }));

        projectOverrides.forEach(({ title, overrides }) => {
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

                it('should include static file patters from project configuration', async function () {
                    const staticFilePatterns = ['pat1', 'pat2'];
                    overrides = {
                        ...overrides,
                        'buildMetadata.staticFilePatterns': staticFilePatterns,
                    };
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
