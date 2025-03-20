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

describe('[PackageTaskBuilder]', function () {
    const _subBuilders = [
        'package-npm',
        'package-aws',
        'package-container',
        'not-supported',
    ];
    const _importDefinitions = createTaskBuilderImportDefinitions(_subBuilders);
    const _importModule = createModuleImporter(
        'src/task-builders/package-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            gulpMock: 'gulp',
            ..._importDefinitions,
        },
        'PackageTaskBuilder',
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
            return [{ name: 'package-npm', ctorArgs: [] }];
        }
        // Type aws-microservice
        else if (type === 'aws-microservice') {
            return [{ name: 'package-aws', ctorArgs: [] }];
        }
        // Type container or api or ui
        else if (type === 'container' || type === 'api' || type === 'ui') {
            return [{ name: 'package-container', ctorArgs: ['default'] }];
        }
        // Type cli
        else if (type === 'cli') {
            if (containerTargetList.length > 0) {
                return [{ name: 'package-container', ctorArgs: ['default'] }];
            } else {
                return [{ name: 'package-npm', ctorArgs: [] }];
            }
        }
        // Type undefined or not supported
        return [{ name: 'not-supported', ctorArgs: [] }];
    }

    injectBuilderInitTests(
        _importModule,
        'package',
        `Packages project build files for publishing to a repository`,
    );

    // Generalized composition tests
    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);

    injectWatchPathsCompositionTests(_initializeTask, _getExpectedSubBuilders);
});
