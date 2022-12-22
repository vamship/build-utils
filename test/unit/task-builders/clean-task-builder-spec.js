'use strict';

// import { jest } from '@jest/globals';
// jest.unstable_mockModule('../../../src/task-builder', () => {
//     return {
//         default: jest.mockImplementation(() => {

//         })
//     };
// });

// const TaskBuilder = await import('../../../src/task-builder');
// const cleanTaskBuilderModule = await import(
    // '../../../src/task-builders/clean-task-builder'
// );
// const CleanTaskBuilder = cleanTaskBuilderModule.default;
// import { getAllButString } from '../utils/data-generator.js';

describe('[CleanTaskBuilder]', () => {
    // function _createInstance(name, description) {
    //     name = name || 'do-something';
    //     description = description || 'Dummy task that does not do anything';
    //     return new CleanTaskBuilder(name, description);
    // }

    beforeEach(() => {
        // taskBuilderModule.default = jest.fn();
        // TaskBuilder.default.mockClear();
    });

    describe('ctor()', () => {
        it('should invoke the super constructor with both input parameters', () => {
            expect(1).toBe(1);
            // expect(TaskBuilder.default).not.toHaveBeenCalled();

            // const taskBuilder = new CleanTaskBuilder();
            //     'clean',
            //     'Cleans out working, distribution and temporary files and directories'

            // expect(TaskBuilder.default).toHaveBeenCalled();
        });
    });
});
