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
import {
    injectBuilderInitTests,
    injectSubBuilderCompositionTests,
    injectWatchPathsCompositionTests,
} from '../../utils/task-builder-snippets.js';

describe('[DocsTaskBuilder]', function () {
    const _subBuilders = ['docs-js', 'docs-ts', 'not-supported'];
    const _importDefinitions = createTaskBuilderImportDefinitions(_subBuilders);
    const _importModule = createModuleImporter(
        'src/task-builders/docs-task-builder.js',
        {
            taskBuilderMock: 'src/task-builder.js',
            gulpMock: 'gulp',
            ..._importDefinitions,
        },
        'DocsTaskBuilder'
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
        const { type, language } = project;

        if (type === 'container') {
            return [{ name: 'not-supported', ctorArgs: [] }];
        } else if (language === 'js') {
            return [{ name: 'docs-js', ctorArgs: [] }];
        } else {
            return [{ name: 'docs-ts', ctorArgs: [] }];
        }
    }

    injectBuilderInitTests(
        _importModule,
        'docs',
        `Generates documentation from code comments in source files`
    );

    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);

    injectWatchPathsCompositionTests(_initializeTask, _getExpectedSubBuilders);
});
