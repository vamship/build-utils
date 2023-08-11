import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import { LibTaskFactory } from '../../../src/task-factories/lib-task-factory.js';
import { Project } from '../../../src/project.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createTaskBuilderMock,
    createTaskBuilderImportDefinitions,
    createTaskBuilderImportMocks,
    buildFailMessage,
} from '../../utils/object-builder.js';

import {
    getAllProjectOverrides,
    getSelectedProjectOverrides,
} from '../../utils/data-generator.js';
import {
    injectFactoryInitTests,
    injectUnsupportedTasksTests,
    injectTaskBuilderCompositionTests,
} from '../../utils/task-factory-snippets.js';

describe('[LibTaskFactory]', () => {
    const _builderNames = [
        'clean',
        'format',
        'lint',
        'lint-fix',
        'package-npm',
        'publish-npm',

        'build',

        'docs-js',
        'docs-ts',
    ];
    const importDefinitions = createTaskBuilderImportDefinitions(_builderNames);

    const _importModule = createModuleImporter(
        'src/task-factories/lib-task-factory.js',
        {
            taskFactoryMock: 'src/task-factory.js',
            ...importDefinitions,
        },
        'LibTaskFactory'
    );

    injectFactoryInitTests(
        _importModule,
        new Project(buildProjectDefinition())
    );

    function _getExpectedTaskBuilders(project) {
        const builders = {
            common: [
                { name: 'clean', ctorArgs: [] },
                { name: 'format', ctorArgs: [] },
                { name: 'lint', ctorArgs: [] },
                { name: 'lint-fix', ctorArgs: [] },
                { name: 'build', ctorArgs: [project] },
                { name: 'package-npm', ctorArgs: [] },
                { name: 'publish-npm', ctorArgs: [] },
            ],
            js: [{ name: 'docs-js', ctorArgs: [] }],
            ts: [{ name: 'docs-ts', ctorArgs: [] }],
        };

        return builders.common.concat(builders[project.language]);
    }

    describe('_createTaskBuilders()', () => {
        const PROJECT_TYPE = 'lib';
        async function _createFactory(overrides) {
            const { mocks, mockReferences } =
                createTaskBuilderImportMocks(_builderNames);
            const TaskFactory = await _importModule(mockReferences);
            const definition = buildProjectDefinition(overrides);
            const project = new Project(definition);
            const factory = new TaskFactory(project);

            return { project, factory, mocks };
        }

        injectUnsupportedTasksTests(PROJECT_TYPE, _createFactory);

        injectTaskBuilderCompositionTests(
            PROJECT_TYPE,
            _createFactory,
            _getExpectedTaskBuilders
        );
    });
});
