import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import _esmock from 'esmock';
import { getAllButObject } from '../../utils/data-generator.js';

describe('[CleanTaskBuilder]', () => {
    async function importModule(projectMock, taskBuilderMock) {
        const mocks = {};
        if (typeof projectMock !== 'undefined') {
            mocks['../../../src/project2.js'] = projectMock;
        }
        if (typeof taskBuilderMock !== 'undefined') {
            mocks['../../../src/task-builder.js'] = taskBuilderMock;
        }
        return {
            CleanTaskBuilder: await _esmock(
                '../../../src/task-builders/clean-task-builder.js',
                mocks
            ),
            projectMock,
            taskBuilderMock,
        };
    }

    describe('ctor()', () => {
        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const { CleanTaskBuilder } = await importModule(undefined, {
                default: superCtor,
            });

            expect(superCtor).not.to.have.been.called;

            new CleanTaskBuilder();

            expect(superCtor).to.have.been.calledOnceWithExactly(
                'clean',
                'Cleans out working, distribution and temporary files and directories'
            );
        });
    });

    describe('createTask()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const {CleanTaskBuilder} = await importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new CleanTaskBuilder();
                const wrapper = () => builder.createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async () => {
            const MockProject = function () {};
            const {CleanTaskBuilder} = await importModule(MockProject);
            const builder = new CleanTaskBuilder();
            const task = builder.createTask(new MockProject());

            expect(typeof task).to.equal('function');
        });
    });
});
