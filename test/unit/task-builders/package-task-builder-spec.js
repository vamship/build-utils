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
    injectSubBuilderCompositionTestsContainerOptions,
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
        const { type, language, _container } = project;

        const containerTargetList = [];
        if (_container) {
            containerTargetList.push(...Object.keys(_container));
        }

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
        // Type container
        else if (type === 'container') {
            // Need to test this when multiple containers are defined
            const containerSubBuilders = [];
            containerTargetList.forEach((target) => {
                containerSubBuilders.push({
                    name: 'package-container',
                    ctorArgs: [target, _container[target].repo],
                });
            });

            return containerSubBuilders;
        }
        // Type cli
        else if (type === 'cli') {
            // Need to test this conditional functionality by using project overrides
            if (containerTargetList.length > 0) {
                const containerSubBuilders = [];
                containerTargetList.forEach((target) => {
                    containerSubBuilders.push({
                        name: 'package-container',
                        ctorArgs: [target, _container[target].repo],
                    });
                });

                return containerSubBuilders;
            } else {
                return [{ name: 'package-npm', ctorArgs: [] }];
            }
        }
        // Type api
        else if (type === 'api') {
            const containerSubBuilders = [];
            containerTargetList.forEach((target) => {
                containerSubBuilders.push({
                    name: 'package-container',
                    ctorArgs: [target, _container[target].repo],
                });
            });

            return containerSubBuilders;
        }
        // Type undefined or not supported
        return [{ name: 'not-supported', ctorArgs: [] }];
    }

    injectBuilderInitTests(
        _importModule,
        'package',
        `Packages project build files for publishing to a repository`
    );

    // Generalized composition tests
    injectSubBuilderCompositionTests(_initializeTask, _getExpectedSubBuilders);

    // Composition tests specific to package task builder
    injectSubBuilderCompositionTestsContainerOptions(
        _initializeTask,
        _getExpectedSubBuilders
    );
});
