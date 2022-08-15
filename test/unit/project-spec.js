'use strict';

import { Project } from '../../src/project.js';

describe('[Project]', () => {
    describe('ctor()', () => {
        it('should throw an error if invoked without a valid package config', () => {
            const error = 'Invalid packageConfig (arg #1)';
            const inputs = [null, undefined, 123, true, 'test', [], () => {}];

            inputs.forEach((tree) => {
                const wrapper = () => new Project();
                expect(wrapper).toThrow(error);
            });
        });
    });
});
