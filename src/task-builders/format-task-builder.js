import _gulp from 'gulp';
import _prettier from 'gulp-prettier';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to format source/test files.
 */
export class FormatTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'format',
            'Formats all source files, README.md and build scripts',
        );
    }

    /**
     * Generates a gulp task to format source files.
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

        const dirs = ['src', 'test'];
        const extras = ['Gulpfile.js', 'README.md'];
        const extensions = ['ts', 'js', 'json', 'py', 'tsx', 'jsx'];

        if (project.type === 'aws-microservice') {
            dirs.push('infra');
        }

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
                .pipe(_prettier())
                .on('error', (err) => {
                    /*
                     * Do nothing. This handler prevents the gulp task from
                     * crashing with an unhandled error.
                     */
                })
                .pipe(_gulp.dest(project.rootDir.absolutePath));
        return task;
    }
}
