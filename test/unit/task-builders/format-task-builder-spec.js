import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy, stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import { getAllProjectOverrides } from '../../utils/data-generator.js';
import { buildProjectDefinition } from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[FormatTaskBuilder]', () => {
    async function _importModule(mockDefs) {
        const moduleMap = {
            gulpMock: 'gulp',
            gulpPrettierMock: 'gulp-prettier',
            projectMock: '../../../src/project.js',
            taskBuilderMock: '../../../src/task-builder.js',
        };

        const mocks = Object.keys({ ...mockDefs }).reduce((result, key) => {
            result[moduleMap[key]] = mockDefs[key];
            return result;
        }, {});

        return await _esmock(
            '../../../src/task-builders/format-task-builder.js',
            mocks
        );
    }

    injectBuilderInitTests(
        _importModule,
        'format',
        'Formats all source files, README.md and build scripts'
    );

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const gulpPrettierMock = spy();
            const gulpMock = [
                { method: 'src' },
                { method: 'pipe' },
                { method: 'dest', retValue: '_dest_path_' },
            ].reduce(
                (result, item) => {
                    const { method, retValue } = item;
                    const mock = stub().callsFake(() => {
                        result.callSequence.push(method);
                        return typeof retValue !== 'undefined'
                            ? retValue
                            : result;
                    });
                    result[method] = mock;
                    return result;
                },
                { callSequence: [] }
            );

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

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, () => {
                it('should inititalize and set the appropriate gulp source files', async () => {
                    const { gulpMock, task, project } = await _createTask(
                        overrides
                    );

                    const extensions = ['ts', 'js', 'json', 'py', 'tsx', 'jsx'];
                    const files = ['src', 'test', 'infra', '.gulp']
                        .map((dir) =>
                            extensions.map((ext) =>
                                project.rootDir
                                    .getChild(dir)
                                    .getAllFilesGlob(ext)
                            )
                        )
                        .reduce((result, item) => result.concat(item), [])
                        .concat([
                            project.rootDir.getFileGlob('README.md'),
                            project.rootDir.getFileGlob('Gulpfile.js'),
                        ]);

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

                it('should pipe the source files to the prettier task for formatting', async () => {
                    const { gulpMock, task, gulpPrettierMock } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[1]).to.equal('pipe');

                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(gulpPrettierMock);
                });

                it('should overwrite the source file with formatted contents', async () => {
                    const { gulpMock, task, project } = await _createTask(
                        overrides
                    );

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpMock.dest).to.not.have.been.called;

                    task();

                    expect(gulpMock.dest).to.have.been.calledOnce;
                    expect(gulpMock.callSequence[2]).to.equal('dest');

                    expect(gulpMock.dest.args[0]).to.have.length(1);
                    expect(gulpMock.dest.args[0][0]).to.equal(
                        project.rootDir.absolutePath
                    );

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpMock.callSequence[3]).to.equal('pipe');

                    expect(gulpMock.pipe.args[1]).to.have.length(1);
                    expect(gulpMock.pipe.args[1][0]).to.equal(
                        gulpMock.dest.returnValues[0]
                    );
                });
            });
        });
    });
});
