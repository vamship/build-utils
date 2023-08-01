import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import { stub, spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import {
    getAllButString,
    getAllProjectOverrides,
    generateGlobPatterns,
} from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createGulpMock,
    createFancyLogMock,
    createModuleImporter,
    createTaskBuilderMock,
    createTaskBuilderImportDefinitions,
    createTaskBuilderImportMocks,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[BuildTaskBuilder]', () => {
    const _subBuilders = [
        'build-js',
        'build-ts',
        'build-ui',
        'copy-files',
        'not-supported',
    ];
    const _importDefinitions = createTaskBuilderImportDefinitions(_subBuilders);
    const _importModule = createModuleImporter(
        'src/task-builders/build-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            gulpMock: 'gulp',
            ..._importDefinitions,
        },
        'BuildTaskBuilder'
    );

    async function _initializeTask() {
        const gulpMock = createGulpMock();
        const { mocks, mockReferences } =
            createTaskBuilderImportMocks(_subBuilders);

        const TaskBuilder = await _importModule({
            gulpMock,
            ...mockReferences,
        });
        const builder = new TaskBuilder();

        return {
            builder,
            gulpMock,
            subBuilderMocks: mocks,
        };
    }

    function _getExpectedSubBuilders(type, language) {
        if (type === 'container') {
            return ['not-supported'];
        } else if (type === 'ui') {
            return ['build-ui', 'copy-files'];
        } else if (language === 'js') {
            return ['build-js', 'copy-files'];
        } else {
            return ['build-ts', 'copy-files'];
        }
    }

    injectBuilderInitTests(
        _importModule,
        'build',
        `Builds the project making it ready for execution/packaging`
    );

    getAllProjectOverrides().forEach(({ title, overrides }) => {
        const language = overrides['buildMetadata.language'];
        const type = overrides['buildMetadata.type'];
        const expectedSubBuilders = _getExpectedSubBuilders(type, language);

        describe(`[task composition] (${title})`, () => {
            it(`should initialize the appropriate sub builders`, async () => {
                const { builder, subBuilderMocks } = await _initializeTask(
                    overrides
                );
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                Object.keys(subBuilderMocks).forEach((subBuilderMock) => {
                    const mock = subBuilderMocks[subBuilderMock];
                    expect(mock.ctor).to.not.have.been.called;
                });

                const task = builder._createTask(project);

                Object.keys(subBuilderMocks).forEach((subBuilderMock) => {
                    const mock = subBuilderMocks[subBuilderMock];
                    if (expectedSubBuilders.includes(mock._name)) {
                        expect(mock.ctor).to.have.been.calledOnceWithExactly();
                        expect(mock.ctor).to.have.been.calledWithNew;
                    } else {
                        expect(mock.ctor).to.not.have.been.called;
                    }
                });
            });

            it(`should create a composite task comprised of subtasks`, async () => {
                const { gulpMock, builder } = await _initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                expect(gulpMock.series).to.not.have.been.called;

                const task = builder._createTask(project);

                expect(gulpMock.series).to.have.been.calledOnce;
                expect(gulpMock.series.args[0]).to.have.length(1);
                expect(gulpMock.series.args[0][0]).to.be.an('array');
                gulpMock.series.args[0][0].forEach((arg) => {
                    expect(arg).to.be.a('function');
                });
            });

            it(`should use the correct sub tasks for the composite task`, async () => {
                const { gulpMock, builder, subBuilderMocks } =
                    await _initializeTask(overrides);
                const definition = buildProjectDefinition(overrides);
                const project = new Project(definition);

                const task = builder._createTask(project);

                expect(gulpMock.series.args[0][0]).to.have.length(
                    expectedSubBuilders.length
                );
                gulpMock.series.args[0][0].forEach((subTask, index) => {
                    const ret = subTask();
                    const mock = subBuilderMocks[expectedSubBuilders[index]];
                    expect(ret).to.equal(mock._ret);
                });
            });
        });
    });
});
