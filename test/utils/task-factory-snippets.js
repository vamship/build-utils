import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import { getAllButObject } from './data-generator.js';
import { buildFailMessage } from './object-builder.js';

/**
 * Injects default tests that apply to all task factories. This is a utility
 * function that makes it easier to write tests for the factories.
 *
 * @param {Function} importModule A function that can be used to import the task
 * factory module under test. This allows the calling module to inject mocks
 * into imported module.
 * @param {Project} project The project to use when testing the factory.
 * @param {Array} [ctorArgs=[]] Optional args to be passed to the task builder
 * constructor
 */
export function injectFactoryInitTests(importModule, project, ctorArgs) {
    if (!(ctorArgs instanceof Array)) {
        ctorArgs = [];
    }

    describe(`ctor() ${JSON.stringify(ctorArgs)}`, () => {
        const failMessage = buildFailMessage({
            type: project.type,
            language: project.language,
        });

        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without a valid project (value=${typeof project})`, async () => {
                const TaskFactory = await importModule({});
                const wrapper = () => new TaskFactory(project);
                const error = 'Invalid project (arg #1)';

                expect(wrapper, failMessage).to.throw(error);
            });
        });

        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const TaskFactory = await importModule({
                taskFactoryMock: {
                    default: superCtor,
                },
            });

            expect(superCtor, failMessage).not.to.have.been.called;

            new TaskFactory(project, ...ctorArgs);

            expect(superCtor, failMessage).to.have.been.calledOnceWithExactly(
                project
            );
        });
    });
}
