'use strict';

import TaskBuilder from '../../src/task-builder.js';
import { getAllButString } from '../utils/data-generator.js';

describe('[TaskBuilder]', () => {
    function _createInstance(name, description) {
        name = name || 'do-something';
        description = description || 'Dummy task that does not do anything';
        return new TaskBuilder(name, description);
    }

    describe('ctor()', () => {
        getAllButString('').forEach((name) => {
            it(`should throw an error if invoked without a valid name (value=${typeof name})`, () => {
                const description = 'some task';
                const wrapper = () => new TaskBuilder(name, description);
                const error = 'Invalid name (arg #1)';

                expect(wrapper).toThrow(error);
            });
        });

        getAllButString('').forEach((description) => {
            it(`should throw an error if invoked without a valid description (value=${typeof description})`, () => {
                const name = 'sample-task';
                const wrapper = () => new TaskBuilder(name, description);
                const error = 'Invalid description (arg #2)';

                expect(wrapper).toThrow(error);
            });
        });

        it('should expose relevant task properties as read only fields', () => {
            const name = 'sample-task';
            const description = 'some task';
            const builder = new TaskBuilder(name, description);

            expect(builder.name).toEqual(name);
            expect(builder.description).toEqual(description);
        });
    });

    describe('createTasks()', () => {
        it('should throw an error if invoked', () => {
            const builder = _createInstance();
            const wrapper = () => builder.createTask();
            const error = 'Not implemented - TaskBuilder.createTask()';

            expect(wrapper).toThrow(error);
        });
    });
});
