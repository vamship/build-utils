import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import { stub } from 'sinon';
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
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[BuildUiTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/build-ui-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'BuildUiTaskBuilder'
    );

    injectBuilderInitTests(_importModule, 'build-ui', 'Build web ui project');

    describe('[task]', function () {
        async function _createTask(definitionOverrides) {
            const execaModuleMock = createExecaMock();
            const BuildUiTaskBuilder = await _importModule({
                execaModuleMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new BuildUiTaskBuilder();

            return {
                execaModuleMock,
                project,
                task: builder.buildTask(project),
            };
        }

        function createSourceList(project, overrides) {
            const dirs = ['src', 'test', 'infra'];
            const extensions = ['ts'];
            const rootDir = project.rootDir.absolutePath;

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllProjectOverrides(1).forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, function () {
                it('should invoke vite to build the web project', async function () {
                    const {
                        execaModuleMock,
                        project,
                        task,
                    } = await _createTask(overrides);

                    const execaMock = execaModuleMock.execa;
                    const thenMock = execaModuleMock.then;

                    expect(execaMock).to.not.have.been.called;
                    expect(thenMock).to.not.have.been.called;

                    task();

                    expect(execaMock).to.have.been.calledOnceWithExactly(
                        _path.join(
                            project.rootDir.absolutePath,
                            'node_modules',
                            '.bin',
                            'vite'
                        ),
                        ['build'],
                        { stdio: 'inherit' }
                    );
                    expect(thenMock).to.have.been.calledOnce;
                    expect(thenMock).to.have.been.calledAfter(execaMock);
                    expect(thenMock.args[0]).to.have.length(2);

                    const [ successHandler, errorHandler ] = thenMock.args[0];
                    expect(successHandler).to.be.undefined;
                    expect(errorHandler).to.be.a('function');
                    // Invoke the error handler - it should do nothing, but
                    // there's no way to test doing nothing, so this will have
                    // to do for now.
                    expect(errorHandler()).to.be.undefined;
                });
            });
        });
    });
});
