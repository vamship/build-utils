import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllProjectOverrides,
    getSelectedProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[BuildJsTaskBuilder]', () => {
    async function _importModule(mockDefs) {
        const moduleMap = {
            gulpMock: 'gulp',
            projectMock: '../../../src/project.js',
            taskBuilderMock: '../../../src/task-builder.js',
        };

        const mocks = Object.keys({ ...mockDefs }).reduce((result, key) => {
            result[moduleMap[key]] = mockDefs[key];
            return result;
        }, {});

        const { BuildJsTaskBuilder } = await _esmock(
            '../../../src/task-builders/build-js-task-builder.js',
            mocks
        );
        return BuildJsTaskBuilder;
    }

    injectBuilderInitTests(
        _importModule,
        'build-js',
        'Copies javascript files from source to destination directories'
    );

    describe('[task]', () => {
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
            const {
                name,
                'buildMetadata.staticFilePatterns': staticFilePatterns,
                'buildMetadata.container': container = {},
            } = overrides;

            const extras = [
                `.${name.replace(/(^@[a-zA-Z]*\/|-)/g, '')}rc`,
                'package.json',
                '.npmignore',
                '.npmrc',
            ].concat(
                Object.keys(container).map(
                    (key) => container[key].buildFile || 'Dockerfile'
                )
            );

            const extensions = ['js', 'json'].concat(staticFilePatterns);
            const rootDir = project.rootDir.absolutePath;

            return ['src', 'test', 'infra']
                .map((dir) =>
                    extensions.map((ext) =>
                        _path.join(rootDir, dir, '**', `*.${ext}`)
                    )
                )
                .reduce((result, item) => result.concat(item), [])
                .concat(extras.map((file) => _path.join(rootDir, file)));
        }

        // List of all projects - they can all run without containers
        const projectsWithoutContainer = getAllProjectOverrides().map(
            ({ title, overrides }) => ({
                title,
                overrides: {
                    ...overrides,
                    'buildMetadata.container': undefined,
                },
            })
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
        const projectOverrides = projectsWithoutContainer.concat(
            projectsWithContainer
        ).map(({title, overrides})=>({
            title,
            overrides: {
                ...overrides,
                'buildMetadata.staticFilePatterns': [],
                name: '@test/my-package',
            }
        }));

        projectOverrides.forEach(({ title, overrides }) => {
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

                it('should include static file patters from project configuration', async () => {
                    const staticFilePatterns = ['pat1', 'pat2'];
                    overrides = {
                        ...overrides,
                        'buildMetadata.staticFilePatterns': staticFilePatterns,
                    };
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

                it('should write the source files to the working directories', async () => {
                    const { gulpMock, task, project } = await _createTask(
                        overrides
                    );

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[1]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        _path.join(project.rootDir.absolutePath, 'working', '/')
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[2]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpMock.dest.returnValues[0]
                    );
                });
            });
        });
    });
});
