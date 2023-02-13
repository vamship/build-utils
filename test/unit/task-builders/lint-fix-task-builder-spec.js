import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import { getAllProjectOverrides } from '../../utils/data-generator.js';
import { buildProjectDefinition } from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[LintFixTaskBuilder]', () => {
    async function _importModule(mockDefs) {
        const moduleMap = {
            gulpMock: 'gulp',
            gulpEslintMock: 'gulp-eslint-new',
            projectMock: '../../../src/project.js',
            taskBuilderMock: '../../../src/task-builder.js',
        };

        const mocks = Object.keys({ ...mockDefs }).reduce((result, key) => {
            result[moduleMap[key]] = mockDefs[key];
            return result;
        }, {});

        const { LintFixTaskBuilder } = await _esmock(
            '../../../src/task-builders/lint-fix-task-builder.js',
            mocks
        );
        return LintFixTaskBuilder;
    }

    injectBuilderInitTests(
        _importModule,
        'lint-fix',
        'Lints all source files and applies automatic fixes where possible'
    );

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const gulpEslintMock = stub().callsFake(() => ({
                _source: '_eslint_ret_',
            }));
            gulpEslintMock.fix = stub().callsFake(() => ({
                _source: '_eslint.fix',
            }));
            gulpEslintMock.format = stub().callsFake(() => ({
                _source: '_eslint.format_ret_',
            }));
            gulpEslintMock.failAfterError = stub().callsFake(() => ({
                _source: '_eslint.failAfterError_ret_',
            }));

            const gulpMock = [{ method: 'src' }, { method: 'pipe' }].reduce(
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

            const LintFixTaskBuilder = await _importModule({
                gulpMock,
                gulpEslintMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new LintFixTaskBuilder();

            return {
                gulpMock,
                gulpEslintMock,
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
                    const extensions = ['ts', 'js', 'tsx', 'jsx'];
                    const files = ['src', 'test', 'infra', '.gulp']
                        .map((dir) =>
                            extensions.map((ext) =>
                                project.rootDir
                                    .getChild(dir)
                                    .getAllFilesGlob(ext)
                            )
                        )
                        .reduce((result, item) => result.concat(item), [])
                        .concat([project.rootDir.getFileGlob('Gulpfile.js')]);

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

                it('should pipe the source files to the eslint task for linting', async () => {
                    const { gulpMock, task, gulpEslintMock } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpEslintMock).to.not.have.been.called;

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpEslintMock).to.have.been.calledOnce;

                    expect(gulpEslintMock.args[0]).to.have.length(1);
                    expect(gulpEslintMock.args[0][0]).to.deep.equal({
                        configType: 'flat',
                        fix: true
                    });

                    expect(gulpMock.callSequence[1]).to.equal('pipe');
                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpEslintMock.returnValues[0]
                    );
                });

                it('should pipe the source files to the eslint fix task for auto fixes', async () => {
                    const { gulpMock, task, gulpEslintMock } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpEslintMock.fix).to.not.have.been.called;

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpEslintMock.fix).to.have.been.called;

                    expect(gulpMock.callSequence[2]).to.equal('pipe');
                    expect(gulpMock.pipe.args[1]).to.have.length(1);
                    expect(gulpMock.pipe.args[1][0]).to.equal(
                        gulpEslintMock.fix.returnValues[0]
                    );
                });

                it('should pipe the source files to the eslint format task for linting', async () => {
                    const { gulpMock, task, gulpEslintMock } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpEslintMock.format).to.not.have.been.called;

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpEslintMock.format).to.have.been.called;

                    expect(gulpMock.callSequence[3]).to.equal('pipe');
                    expect(gulpMock.pipe.args[2]).to.have.length(1);
                    expect(gulpMock.pipe.args[2][0]).to.equal(
                        gulpEslintMock.format.returnValues[0]
                    );
                });

                it('should force eslint to report an error if linting fails', async () => {
                    const { gulpMock, task, gulpEslintMock } =
                        await _createTask(overrides);

                    expect(gulpMock.pipe).to.not.have.been.called;
                    expect(gulpEslintMock.failAfterError).to.not.have.been
                        .called;

                    task();

                    expect(gulpMock.pipe).to.have.been.called;
                    expect(gulpEslintMock.failAfterError).to.have.been.called;

                    expect(gulpMock.callSequence[4]).to.equal('pipe');
                    expect(gulpMock.pipe.args[3]).to.have.length(1);
                    expect(gulpMock.pipe.args[3][0]).to.equal(
                        gulpEslintMock.failAfterError.returnValues[0]
                    );
                });
            });
        });
    });
});
