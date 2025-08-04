import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import _path from 'path';

import { stub } from 'sinon';
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
    createModuleImporter,
    createExecaMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[TestTaskBuilder]', function () {
    const _importModule = createModuleImporter(
        'src/task-builders/test-task-builder.js',
        {
            execaModuleMock: 'execa',
            taskBuilderMock: 'src/task-builder.js',
        },
        'TestTaskBuilder',
    );

    describe('ctor() <test type>', function () {
        getAllButString('foo', 'bar', '').forEach((testType) => {
            it(`should throw an error if invoked without a valid test type (value=${testType})`, async function () {
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
            [testType],
        ),
    );

    describe('[task]', function () {
        async function _createTask(testType, definitionOverrides) {
            const execaModuleMock = createExecaMock();
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
                describe(`Verify ${testType} test task (${title})`, function () {
                    it('should invoke mocha and c8 to run tests on the project', async function () {
                        const { execaModuleMock, project, task } =
                            await _createTask(testType, overrides);

                        const execaMock = execaModuleMock.execa;

                        const [c8Bin, mochaBin] = ['c8', 'mocha'].map((bin) =>
                            _path.join(
                                project.rootDir.absolutePath,
                                'node_modules',
                                '.bin',
                                bin,
                            ),
                        );

                        const specPath = _path.join(
                            project.rootDir.absolutePath,
                            project.language === 'ts' ? 'working' : '',
                            'test',
                            testType,
                            '**',
                            '*.js',
                        );

                        expect(execaMock).to.not.have.been.called;

                        task();

                        expect(execaMock).to.have.been.calledOnceWithExactly(
                            c8Bin,
                            [
                                '-x {working/,}test/**',
                                mochaBin,
                                '--no-config',
                                '--loader=esmock',
                                specPath,
                            ],
                            { stdio: 'inherit' },
                        );
                    });
                });
            }),
        );
    });

    describe('getWatchPaths()', function () {
        function createPathList(project) {
            const dirs = ['src', 'test'];
            const extensions = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
            const rootDir =
                project.language === 'ts'
                    ? _path.join(project.rootDir.absolutePath, 'working')
                    : project.rootDir.absolutePath;

            if (project.type === 'aws-microservice') {
                dirs.push('infra');
            }

            return generateGlobPatterns(rootDir, dirs, extensions);
        }

        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async function () {
                const TaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder('unit');
                const wrapper = () => builder.getWatchPaths(project);

                expect(wrapper).to.throw(error);
            });
        });

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            it(`should return an array of paths to watch ${title}`, async function () {
                const TaskBuilder = await _importModule();
                const builder = new TaskBuilder('unit');
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
