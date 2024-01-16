'use strict';

import _gulp from 'gulp';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { NotSupportedTaskBuilder } from './not-supported-task-builder.js';
import { DocsJsTaskBuilder } from './docs-js-task-builder.js';
import { DocsTsTaskBuilder } from './docs-ts-task-builder.js';

/**
 * General purpose build task that configures sub tasks for build based on the
 * project.
 */
export class DocsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'docs',
            `Generates documentation from code comments in source files`,
        );
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

        const builders = this._getSubBuilders(project).map((builder) =>
            builder.buildTask(project),
        );

        const task = _gulp.series(builders);
        return task;
    }

    /**
     * Returns a list of sub builders based on the project type and language.
     * @private
     */
    _getSubBuilders(project) {
        const { type, language } = project;
        if (type === 'container') {
            return [new NotSupportedTaskBuilder()];
        } else if (language === 'ts') {
            return [new DocsTsTaskBuilder()];
        } else {
            return [new DocsJsTaskBuilder()];
        }
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const paths = this._getSubBuilders(project)
            .map((builder) => builder.getWatchPaths(project))
            .flat();
        return [...new Set(paths)];
    }
}
