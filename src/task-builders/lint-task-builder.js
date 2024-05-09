'use strict';

import _gulp from 'gulp';
import _eslint from 'gulp-eslint-new';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to lint source/test files.
 */
export class LintTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('lint', 'Lints all source files');
    }

    /**
     * Generates a gulp task to lint project files.
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

        const dirs = ['src', 'test', 'infra', '.gulp'];
        const extras = ['Gulpfile.js'];
        const extensions = ['ts', 'js', 'tsx', 'jsx'];

        const paths = dirs
            .map((dir) => project.rootDir.getChild(dir))
            .map((dir) => extensions.map((ext) => dir.getAllFilesGlob(ext)))
            .reduce((result, arr) => result.concat(arr), [])
            .concat(extras.map((file) => project.rootDir.getFileGlob(file)));

        const task = () =>
            _gulp
                .src(paths, {
                    allowEmpty: true,
                    base: project.rootDir.globPath,
                })
                .pipe(_eslint({ configType: 'flat' }))
                .pipe(_eslint.format())
                .pipe(_eslint.failAfterError());

        return task;
    }
}
