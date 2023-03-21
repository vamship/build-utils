import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import { buildProjectDefinition } from './object-builder.js';
import { getAllButObject } from './data-generator.js';
import { Project } from '../../src/project.js';
/**
 * Injects default tests that apply to all task builders. This is a utility
 * function that makes it easier to write tests for the builders.
 *
 * @param {Function} importModule A function that can be used to import the task
 * builder module under test. This allows the calling module to inject mocks
 * into imported module.
 * @param {String} taskName The expected name of the task.
 * @param {String} taskDescription The expected description of the task.
 * @param {Array} [ctorArgs=[]] Optional args to be passed to the task builder
 * constructor
 */
export function injectBuilderInitTests(
    importModule,
    taskName,
    taskDescription,
    ctorArgs
) {
    if (!(ctorArgs instanceof Array)) {
        ctorArgs = [];
    }

    describe(`ctor() ${JSON.stringify(ctorArgs)}`, () => {
        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const TaskBuilder = await importModule({
                taskBuilderMock: {
                    default: superCtor,
                },
            });

            expect(superCtor).not.to.have.been.called;

            new TaskBuilder(...ctorArgs);

            expect(superCtor).to.have.been.calledOnceWithExactly(
                taskName,
                taskDescription
            );
        });
    });

    describe(`_createTask() ${JSON.stringify(ctorArgs)}`, () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const TaskBuilder = await importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new TaskBuilder(...ctorArgs);
                const wrapper = () => builder._createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async () => {
            const TaskBuilder = await importModule();
            const builder = new TaskBuilder(...ctorArgs);

            const project = new Project(buildProjectDefinition());
            const task = builder._createTask(project);

            expect(typeof task).to.equal('function');
        });
    });
}
