import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import _camelcase from 'camelcase';

import { stub } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[TestTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/test-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'TestTaskBuilder'
    );

    describe('ctor() <test type>', () => {
        getAllButString('foo', 'bar', '').forEach((testType) => {
            it(`should throw an error if invoked without a valid test type (value=${testType})`, async () => {
                const TaskBuilder = await _importModule();
                const error = 'Invalid testType (arg #1)';
                const wrapper = () => new TaskBuilder(testType);

                expect(wrapper).to.throw(error);
            });
        });
    });

    ['unit', 'api'].forEach((testType) =>
        injectBuilderInitTests(
            _importModule,
            `test-${testType}`,
            `Execute ${testType} tests`,
            [testType]
        )
    );

    describe('[task]', () => {
        async function _createTask(testType, definitionOverrides) {
            const execaModuleMock = {
                execa: stub().callsFake(() => ({
                    source: '_execa_ret_',
                })),
            };
            const TestTaskBuilder = await _importModule({
                execaModuleMock,
            });
            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new TestTaskBuilder(testType);
            return {
                execaModuleMock,
                project,
                task: builder.buildTask(project),
            };
        }

        ['unit', 'api'].forEach((testType) =>
            getAllProjectOverrides().forEach(({ title, overrides }) => {
                describe(`Verify ${testType} test task (${title})`, () => {
                    it('should invoke mocha and c8 to run tests on the project', async () => {
                        const {
                            execaModuleMock: { execa: execaMock },
                            project,
                            task,
                        } = await _createTask(testType, overrides);

                        const [c8Bin, mochaBin] = ['c8', 'mocha'].map((bin) =>
                            _path.join(
                                project.rootDir.absolutePath,
                                'node_modules',
                                '.bin',
                                bin
                            )
                        );

                        const specPath = _path.join(
                            project.rootDir.absolutePath,
                            project.language === 'ts' ? 'working' : '',
                            'test',
                            testType,
                            '**',
                            '*.js'
                        );
                        expect(execaMock).to.not.have.been.called;
                        task();
                        expect(execaMock).to.have.been.calledOnceWithExactly(
                            c8Bin,
                            [
                                mochaBin,
                                '--no-config',
                                '--loader=esmock',
                                specPath,
                            ],
                            { stdio: 'inherit' }
                        );
                    });
                });
            })
        );
    });
});
