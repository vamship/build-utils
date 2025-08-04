import { use as _chaiUse, expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chaiUse(_sinonChai);

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
import {
    injectBuilderInitTests,
    injectSubBuilderCompositionTests,
    injectWatchPathsCompositionTests,
} from '../../utils/task-builder-snippets.js';

describe('[BuildTaskBuilder]', function () {
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
        'BuildTaskBuilder',
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
        if (project.type === 'container') {
            return [{ name: 'not-supported', ctorArgs: [] }];
        } else if (project.type === 'ui') {
            return [
                { name: 'build-ui', ctorArgs: [] },
                { name: 'copy-files', ctorArgs: [] },
            ];
        } else if (project.language === 'js') {
            return [
                { name: 'build-js', ctorArgs: [] },
                { name: 'copy-files', ctorArgs: [] },
            ];
        } else {
            return [
                { name: 'build-ts', ctorArgs: [] },
                { name: 'copy-files', ctorArgs: [] },
            ];
        }
    }

    injectBuilderInitTests(
        _importModule,
        'build',
        `Builds the project making it ready for execution/packaging`,
    );

    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);

    injectWatchPathsCompositionTests(_initializeTask, _getExpectedSubBuilders);
});
