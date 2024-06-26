'use strict';

import _fancyLog from 'fancy-log';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Task builder that creates a task that displays a "not supported" message on
 * the screen. Intended to indicate that the task does not apply for the
 * specific project type.
 */
export class NotSupportedTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {String} [message] An optional message to display when the task is
     * run.
     */
    constructor(message) {
        super(
            'not-supported',
            `Task that does nothing - used to indicate that a task is not supported for a project type.`,
        );

        if (typeof message !== 'string' || message.length <= 0) {
            message = 'Task not defined for project';
        }

        this._message = message;
    }

    /**
     * Generates a gulp task to package a project for building a project.
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
        return async () => _fancyLog.warn(this._message);
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        return [];
    }
}
