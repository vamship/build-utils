'use strict';

import _gulp from 'gulp';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { NotSupportedTaskBuilder } from './not-supported-task-builder.js';
import { BuildJsTaskBuilder } from './build-js-task-builder.js';
import { BuildTsTaskBuilder } from './build-ts-task-builder.js';
import { BuildUiTaskBuilder } from './build-ui-task-builder.js';
import { CopyFilesTaskBuilder } from './copy-files-task-builder.js';

/**
 * General purpose build task that configures sub tasks for build based on the
 * project.
 */
export class BuildTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'build',
            `Builds the project making it ready for execution/packaging`,
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
        if (type === 'ui') {
            return [new BuildUiTaskBuilder(), new CopyFilesTaskBuilder()];
        } else if (type === 'container') {
            return [new NotSupportedTaskBuilder()];
        } else if (language === 'ts') {
            return [new BuildTsTaskBuilder(), new CopyFilesTaskBuilder()];
        } else {
            return [new BuildJsTaskBuilder(), new CopyFilesTaskBuilder()];
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
        return [ ...new Set(paths) ];
    }
}
