'use strict';

import _gulp from 'gulp';

import _typescript from 'gulp-typescript';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to compile typescript files.
 */
export class BuildTsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'build-ts',
            'Build typescript files and writes them to the build directory',
        );
    }

    /**
     * Generates a gulp task to build typescript files.
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
        const extensions = ['ts'];

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
                .pipe(_typescript.createProject('tsconfig.json')())
                .on('error', (err) => {
                    /*
                     * Do nothing. This handler prevents the gulp task from
                     * crashing with an unhandled error.
                     */
                })
                .pipe(_gulp.dest(rootDir.getChild('working').absolutePath));

        return task;
    }
}
