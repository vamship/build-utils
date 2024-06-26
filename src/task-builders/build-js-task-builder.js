'use strict';

import _gulp from 'gulp';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to copy javascript files
 * from source to build directories.
 */
export class BuildJsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'build-js',
            'Copies javascript files from source to destination directories',
        );
    }

    /**
     * Generates a gulp task to copy javascript files from source to build
     * directories.
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

        const { rootDir } = project;
        const dirs = ['src', 'test'];
        const extensions = ['js'];

        if (project.type === 'aws-microservice') {
            dirs.push('infra');
        }

        const paths = dirs
            .map((dir) => rootDir.getChild(dir))
            .map((dir) => extensions.map((ext) => dir.getAllFilesGlob(ext)))
            .reduce((result, arr) => result.concat(arr), []);

        const task = () =>
            _gulp
                .src(paths, {
                    allowEmpty: true,
                    base: rootDir.globPath,
                })
                .pipe(_gulp.dest(rootDir.getChild('working').absolutePath));

        return task;
    }
}
