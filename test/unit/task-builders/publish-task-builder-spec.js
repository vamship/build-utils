import _chai from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';

import _esmock from 'esmock';
import {
    createGulpMock,
    createModuleImporter,
    createTaskBuilderImportDefinitions,
    createTaskBuilderImportMocks,
} from '../../utils/object-builder.js';
import {
    injectBuilderInitTests,
    injectSubBuilderCompositionTests,
    injectWatchPathsCompositionTests,
} from '../../utils/task-builder-snippets.js';

describe('[PublishTaskBuilder]', () => {
    const _subBuilders = [
        'publish-npm',
        'publish-aws',
        'publish-container',
        'not-supported',
    ];
    const _importDefinitions = createTaskBuilderImportDefinitions(_subBuilders);
    const _importModule = createModuleImporter(
        'src/task-builders/publish-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            gulpMock: 'gulp',
            ..._importDefinitions,
        },
        'PublishTaskBuilder'
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

    function _getExpectedSubBuilders(project) {
        const { type } = project;

        const containerTargetList = project.getContainerTargets();

        // Type lib
        if (type === 'lib') {
            return [{ name: 'publish-npm', ctorArgs: [] }];
        }
        // Type aws-microservice
        else if (type === 'aws-microservice') {
            return [{ name: 'publish-aws', ctorArgs: [] }];
        }
        // Type ui
        else if (type === 'ui') {
            return [{ name: 'not-supported', ctorArgs: [] }];
        }
        // Type container
        else if (type === 'container') {
            return [{ name: 'publish-container', ctorArgs: ['default'] }];
        }
        // Type cli
        else if (type === 'cli') {
            if (containerTargetList.length > 0) {
                return [{ name: 'publish-container', ctorArgs: ['default'] }];
            } else {
                return [{ name: 'publish-npm', ctorArgs: [] }];
            }
        }
        // Type api
        else if (type === 'api') {
            return [{ name: 'publish-container', ctorArgs: ['default'] }];
        }
        // Type undefined or not supported
        return [{ name: 'not-supported', ctorArgs: [] }];
    }

    injectBuilderInitTests(
        _importModule,
        'publish',
        `Publishes project to a repository`
    );

    // Generalized composition tests
    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);

    injectWatchPathsCompositionTests(_initializeTask, _getExpectedSubBuilders);
});
