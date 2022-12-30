'use strict';

import { expand } from 'dotenv-expand';
import _esmock from 'esmock';
import { getAllButObject } from '../../utils/data-generator.js';

describe('[CleanTaskBuilder]', () => {
    let CleanTaskBuilder;
    let TaskBuilderMock;
    let ProjectMock;

    beforeEach(async () => {
        TaskBuilderMock = {
            default: jest.fn(),
        };
        ProjectMock = {
            default: jest.fn(),
        };

        CleanTaskBuilder = await _esmock(
            '../../../src/task-builders/clean-task-builder',
            {
                '../../../src/task-builder.js': TaskBuilderMock,
                '../../../src/project2.js': ProjectMock
            }
        );
    });

    describe('ctor()', () => {
        it('should invoke the super constructor with correct arguments', () => {
            const superCtor = TaskBuilderMock.default;

            expect(superCtor).not.toHaveBeenCalled();

            new CleanTaskBuilder();

            expect(superCtor).toHaveBeenCalled();
            expect(superCtor.mock.calls).toHaveLength(1);
            expect(superCtor.mock.calls[0]).toHaveLength(2);
            expect(superCtor.mock.calls[0][0]).toEqual('clean');
            expect(superCtor.mock.calls[0][1]).toEqual(
                'Cleans out working, distribution and temporary files and directories'
            );
        });
    });

    describe('createTask()', () => {
        getAllButObject({}).forEach((project) => {
            it(`should throw an error if invoked without valid project (value=${typeof project})`, () => {
                const error = 'Invalid project (arg #1)';
                const builder = new CleanTaskBuilder();
                const wrapper = () => builder.createTask(project);

                expect(wrapper).toThrow(error);
            });
        });

        it('should return a function when invoked', () => {
            const builder = new CleanTaskBuilder();
            const task = builder.createTask(new ProjectMock.default());

            expect(typeof task).toEqual('function');
        });
    });
});
