import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import _path from 'path';
import { spy } from 'sinon';
import _esmock from 'esmock';
import { Project } from '../../../src/project.js';
import { getAllProjectOverrides } from '../../utils/data-generator.js';
import {
    buildProjectDefinition,
    createModuleImporter,
    createFancyLogMock,
} from '../../utils/object-builder.js';
import { injectBuilderInitTests } from '../../utils/task-builder-snippets.js';

describe('[NotSupportedTaskBuilder]', () => {
    const _importModule = createModuleImporter(
        'src/task-builders/not-supported-task-builder.js',
        {
            fancyLogMock: 'fancy-log',
            taskBuilderMock: 'src/task-builder.js',
        },
        'NotSupportedTaskBuilder'
    );

    injectBuilderInitTests(
        _importModule,
        'not-supported',
        'Task that does nothing - used to indicate that a task is not supported for a project type.'
    );

    describe('[task]', () => {
        async function _createTask(definitionOverrides) {
            const fancyLogMock = createFancyLogMock();
            const NotSupportedTaskBuilder = await _importModule({
                fancyLogMock,
            });

            const definition = buildProjectDefinition(definitionOverrides);
            const project = new Project(definition);
            const builder = new NotSupportedTaskBuilder();

            return {
                fancyLogMock,
                project,
                task: builder.buildTask(project),
            };
        }

        getAllProjectOverrides().forEach(({ title, overrides }) => {
            describe(`Verify task (${title})`, () => {
                it(`should show a log message on the screen`, async () => {
                    const { task, fancyLogMock } = await _createTask(overrides);

                    expect(fancyLogMock.info).to.not.have.been.called;

                    task();

                    expect(
                        fancyLogMock.warn
                    ).to.have.been.calledOnceWithExactly(
                        'Task not defined for project'
                    );
                });
            });
        });
    });
});
