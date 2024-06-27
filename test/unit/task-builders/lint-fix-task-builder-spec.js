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

describe('[LintFixTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/lint-fix-task-builder.js',
        {
            gulpMock: 'gulp',
            gulpEslintMock: 'gulp-eslint-new',
            taskBuilderMock: 'src/task-builder.js',
        },
        'LintFixTaskBuilder',
    );

    injectBuilderInitTests(
        _importModule,
        'lint-fix',
        'Lints all source files and applies automatic fixes where possible',
    );

    describe('[task]', function () {
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

            const gulpMock = createGulpMock();

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

        function createSourceList(project) {
            const dirs = ['src', 'test'];
            const extensions = ['ts', 'js', 'tsx', 'jsx'];
            const rootDir = project.rootDir.absolutePath;

            if (project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions).concat([
                _path.join(rootDir, 'Gulpfile.js'),
            ]);
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, function () {
                it('should inititalize and set the appropriate gulp source files', async function () {
                    const { gulpMock, task, project } =
                        await _createTask(overrides);
                    const files = createSourceList(project);

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

                it('should pipe the source files to the eslint task for linting', async function () {
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
                        fix: true,
                    });

                    expect(gulpMock.callSequence[1]).to.equal('pipe');
                    expect(gulpMock.pipe.args[0]).to.have.length(1);
                    expect(gulpMock.pipe.args[0][0]).to.equal(
                        gulpEslintMock.returnValues[0],
                    );
                });

                it('should pipe the source files to the eslint fix task for auto fixes', async function () {
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
                        gulpEslintMock.fix.returnValues[0],
                    );
                });

                it('should pipe the source files to the eslint format task for linting', async function () {
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
                        gulpEslintMock.format.returnValues[0],
                    );
                });

                it('should force eslint to report an error if linting fails', async function () {
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
                        gulpEslintMock.failAfterError.returnValues[0],
                    );
                });
            });
        });
    });
});
