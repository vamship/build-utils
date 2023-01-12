import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { spy } from 'sinon';
import _esmock from 'esmock';
import { getAllButObject } from '../../utils/data-generator.js';

describe('[CleanTaskBuilder]', () => {
    const TASK_NAME = 'clean';
    const TASK_DESCRIPTION =
        'Cleans out working, distribution and temporary files and directories';

    async function _importModule(mockDefs) {
        const moduleMap = {
            deleteMock: 'delete',
            projectMock: '../../../src/project.js',
            taskBuilderMock: '../../../src/task-builder.js',
        };

        const mocks = Object.keys({ ...mockDefs }).reduce((result, key) => {
            result[moduleMap[key]] = mockDefs[key];
            return result;
        }, {});

        return await _esmock(
            '../../../src/task-builders/clean-task-builder.js',
            mocks
        );
    }

    describe('ctor()', () => {
        it('should invoke the super constructor with correct arguments', async () => {
            const superCtor = spy();
            const CleanTaskBuilder = await _importModule({
                taskBuilderMock: {
                    default: superCtor,
                },
            });

            expect(superCtor).not.to.have.been.called;

            new CleanTaskBuilder();

            expect(superCtor).to.have.been.calledOnceWithExactly(
                TASK_NAME,
                TASK_DESCRIPTION
            );
        });
    });

    describe('createTask()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, async () => {
                const CleanTaskBuilder = await _importModule();
                const error = 'Invalid project (arg #1)';
                const builder = new CleanTaskBuilder();
                const wrapper = () => builder.createTask(project);

                expect(wrapper).to.throw(error);
            });
        });

        it('should return a function when invoked', async () => {
            const MockProject = function () {};
            const CleanTaskBuilder = await _importModule({
                projectMock: { Project: MockProject},
            });
            const builder = new CleanTaskBuilder();
            const task = builder.createTask(new MockProject());

            expect(typeof task).to.equal('function');
        });

        it('should have a display name and description associated with a task', async () => {
            const MockProject = function () {};
            const CleanTaskBuilder = await _importModule({
                projectMock: { Project: MockProject },
            });
            const builder = new CleanTaskBuilder();
            const task = builder.createTask(new MockProject());

            expect(task.displayName).to.equal(TASK_NAME);
            expect(task.description).to.equal(TASK_DESCRIPTION);
        });
    });

    describe('[task]', () => {
        async function _createTask() {
            const deleteMock = spy();
            const MockProject = function () {};
            const CleanTaskBuilder = await _importModule({
                deleteMock,
                projectMock: { Project: MockProject },
            });
            const builder = new CleanTaskBuilder(new MockProject());

            return {
                deleteMock,
                task: builder.createTask(new MockProject()),
            };
        }

        it('should invoke a file delete operation when called', async () => {
            const { deleteMock, task } = await _createTask();

            expect(deleteMock).to.not.have.been.called;
            task();
            expect(deleteMock).to.have.been.calledOnce;
        });
    });
});
