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
 */
export function injectBuilderInitTests(
    importModule,
    taskName,
    taskDescription
) {
    describe('ctor()', () => {
        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const CleanTaskBuilder = await importModule({
                taskBuilderMock: {
                    default: superCtor,
                },
            });

            expect(superCtor).not.to.have.been.called;

            new CleanTaskBuilder();

            expect(superCtor).to.have.been.calledOnceWithExactly(
                taskName,
                taskDescription
            );
        });
    });

    describe('_createTask()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const CleanTaskBuilder = await importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new CleanTaskBuilder();
                const wrapper = () => builder._createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async () => {
            const CleanTaskBuilder = await importModule();
            const builder = new CleanTaskBuilder();

            const project = new Project(buildProjectDefinition());
            const task = builder._createTask(project);

            expect(typeof task).to.equal('function');
        });
    });
}
