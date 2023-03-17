'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';

/**
 * Builder function that can be used to generate a gulp task to execute
 * instrumented unit/api tests.
 */
export class TestTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {String} testType The type of test to execute. Must be one of
     * "unit" or "api".
     */
    constructor(testType) {
        if (['unit', 'api'].indexOf(testType) < 0) {
            throw new Error('Invalid testType (arg #1)');
        }
        super('test', `Execute ${testType} tests`);

        this._testType = testType;
    }

    /**
     * Generates a gulp task to execute automated tests
     *
     * @protected
     * @param {Object} project Reference to the project for which the task needs
     * to be defined.
     *
     * @returns {Function} A gulp task.
     */
    _createTask(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const mochaBin = project.rootDir.getFilePath('node_modules/.bin/mocha');
        const c8Bin = project.rootDir.getFilePath('node_modules/.bin/c8');

        const task = () => _execa(c8Bin, [mochaBin], { stdio: 'inherit' });
        return task;
    }
}
