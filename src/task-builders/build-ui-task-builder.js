'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';

/**
 * Builder that can be used to generate a gulp task to build a web UI project.
 */
export class BuildUiTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('build-ui', 'Build web ui project');
    }

    /**
     * Generates a gulp task to build a web UI project.
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

        const viteBin = project.rootDir.getFilePath('node_modules/.bin/vite');
        const task = () =>
            _execa(viteBin, ['build'], { stdio: 'inherit' }).then(
                undefined,
                (err) => {
                    /*
                     * Do nothing. This handler prevents the gulp task from
                     * crashing with an unhandled error.
                     */
                }
            );
        return task;
    }
}
