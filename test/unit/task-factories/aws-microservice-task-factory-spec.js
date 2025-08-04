import { use as _chaiUse } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

import { AwsMicroserviceTaskFactory } from '../../../src/task-factories/aws-microservice-task-factory.js';
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
} from '../../utils/task-factory-snippets.js';

describe('[AwsMicroserviceTaskFactory]', function () {
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
        'publish-aws',
    ];
    const importDefinitions = createTaskBuilderImportDefinitions(_builderNames);

    const _importModule = createModuleImporter(
        'src/task-factories/aws-microservice-task-factory.js',
        {
            taskFactoryMock: 'src/task-factory.js',
            ...importDefinitions,
        },
        'AwsMicroserviceTaskFactory',
    );

    injectFactoryInitTests(
        _importModule,
        new Project(buildProjectDefinition()),
    );

    function _getExpectedTaskBuilders(project) {
        const additionalBuilders = project
            .getCdkTargets()
            .filter((stack) => stack !== 'default')
            .map((stack) => {
                return {
                    name: 'publish-aws',
                    ctorArgs: [
                        stack,
                        process.env.INFRA_ENV,
                        process.env.INFRA_NO_PROMPT === 'true',
                    ],
                };
            });

        const builders = [
            { name: 'clean', ctorArgs: [] },
            { name: 'format', ctorArgs: [] },
            { name: 'lint', ctorArgs: [] },
            { name: 'lint-fix', ctorArgs: [] },
            { name: 'test', ctorArgs: ['unit'] },
            { name: 'test', ctorArgs: ['api'] },
            { name: 'docs', ctorArgs: [project] },
            { name: 'build', ctorArgs: [project] },
            { name: 'package', ctorArgs: [project] },
            { name: 'publish', ctorArgs: [] },
        ].concat(additionalBuilders);

        return builders;
    }

    describe('_createTaskBuilders()', function () {
        const PROJECT_TYPE = 'aws-microservice';
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
