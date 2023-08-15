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
} from '../../utils/task-builder-snippets.js';

describe('[PackageTaskBuilder]', () => {
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
        'PackageTaskBuilder'
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
        // Type lib
        if (type === 'lib') {
            return [{ name: 'package-npm', ctorArgs: [] }];
        }
        // Type aws-microservice
        else if (type === 'aws-microservice') {
            return [{ name: 'package-aws', ctorArgs: [] }];
        }
        // Type ui
        else if (type === 'ui') {
            return [{ name: 'not-supported', ctorArgs: [] }];
        }
        // Type undefined or not supported
        return [{ name: 'not-supported', ctorArgs: [] }];

        // if (type === 'ui') {
        //     return [{ name: 'not-supported', ctorArgs: [] }];
        // } else if (type === 'aws-microservice') {
        //     return [
        //         { name: 'package-aws', ctorArgs: [] },
        //     ];
        // } else if (project.getContainerTargets().length > 0) {
        //     return [
        //         { name: 'package-container', ctorArgs: [] },
        //     ];
        // }
    }

    injectBuilderInitTests(
        _importModule,
        'package',
        `Packages project build files for publishing to a repository`
    );

    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);
});
