import _chai, { expect } from 'chai';
import _sinonChai from 'sinon-chai';
_chai.use(_sinonChai);

import { stub } from 'sinon';
import TaskFactory from '../../src/task-factory.js';
import { Project } from '../../src/project.js';
import { getAllButObject } from '../utils/data-generator.js';
import { buildProjectDefinition } from '../utils/object-builder.js';

describe('[TaskFactory]', () => {
    describe('ctor()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without a valid project (value=${typeof project})`, () => {
                const wrapper = () => new TaskFactory(project);
                const error = 'Invalid project (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });
    });

    describe('_createTaskBuilders()', () => {
        it('should return an array when invoked', async () => {
            const definition = buildProjectDefinition();
            const project = new Project(definition);
            const factory = new TaskFactory(project);

            expect(factory._createTaskBuilders()).to.be.an('array').and.to.be
                .empty;
        });
    });

    describe('createTasks()', () => {
        it('should return an empty array when invoked', async () => {
            const definition = buildProjectDefinition();
            const project = new Project(definition);
            const factory = new TaskFactory(project);

            expect(factory.createTasks()).to.be.an('array').that.is.empty;
        });

        it('should invoke the buildTask() method on each task builder', async () => {
            const stubs = ['task1', 'task2'].map((name) => {
                return {
                    buildTask: stub().returns(name),
                    ret: name,
                };
            });

            class TestTaskFactory extends TaskFactory {
                constructor(project) {
                    super(project);
                }

                _createTaskBuilders() {
                    return stubs;
                }
            }

            const definition = buildProjectDefinition();
            const project = new Project(definition);
            const factory = new TestTaskFactory(project);

            stubs.forEach(
                ({ buildTask }) => expect(buildTask).to.not.have.been.called
            );

            const ret = factory.createTasks();

            stubs.forEach(({ buildTask }) => {
                expect(buildTask).to.have.been.calledOnceWithExactly(project);
            });

            expect(ret).to.be.an('array').that.has.lengthOf(stubs.length);
            ret.forEach((val, index) => {
                expect(val).to.equal(stubs[index].ret);
            });
        });
    });
});
