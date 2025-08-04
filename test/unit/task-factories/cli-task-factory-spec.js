import { use as _chaiUse } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import { CliTaskFactory } from '../../../src/task-factories/cli-task-factory.js';
import { Project } from '../../../src/project.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createTaskBuilderImportDefinitions,
    createTaskBuilderImportMocks,
} from '../../utils/object-builder.js';

import {
    injectFactoryInitTests,
    injectUnsupportedTasksTests,
    injectTaskBuilderCompositionTests,
    getAdditionalContainerBuilders,
} from '../../utils/task-factory-snippets.js';

describe('[CliTaskFactory]', function () {
    const _builderNames = [
        'clean',
        'format',
        'lint',
        'lint-fix',
        'test',
        'docs',
        'build',
        'package',
        'publish',
        'package-container',
        'publish-container',
    ];
    const importDefinitions = createTaskBuilderImportDefinitions(_builderNames);

    const _importModule = createModuleImporter(
        'src/task-factories/cli-task-factory.js',
        {
            taskFactoryMock: 'src/task-factory.js',
            ...importDefinitions,
        },
        'CliTaskFactory',
    );

    injectFactoryInitTests(
        _importModule,
        new Project(buildProjectDefinition()),
    );

    function _getExpectedTaskBuilders(project) {
        const additionalBuilders = getAdditionalContainerBuilders(project);
        const hasContainer = project.getContainerTargets().length > 0;
        const builders = [
            { name: 'clean', ctorArgs: [] },
            { name: 'format', ctorArgs: [] },
            { name: 'lint', ctorArgs: [] },
            { name: 'lint-fix', ctorArgs: [] },
            { name: 'test', ctorArgs: ['unit'] },
            { name: 'test', ctorArgs: ['int'] },
            { name: 'docs', ctorArgs: [project] },
            { name: 'build', ctorArgs: [project] },
            { name: 'package', ctorArgs: [project] },
            { name: 'publish', ctorArgs: [project] },
            hasContainer
                ? { name: 'publish-container', ctorArgs: ['default'] }
                : undefined,
        ]
            .concat(additionalBuilders)
            .filter(Boolean);

        return builders;
    }

    describe('_createTaskBuilders()', function () {
        const PROJECT_TYPE = 'cli';
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
            _getExpectedTaskBuilders,
        );
    });
});
