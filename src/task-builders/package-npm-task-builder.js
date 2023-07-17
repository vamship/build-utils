'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';
import _gulp from 'gulp';
import _delete from 'delete';

/**
 * Builder function that can be used to generate a gulp task to package an
 * project for publishing to an NPM registry.
 */
export class PackageNpmTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('package-npm', `Package a project for publishing to NPM`);
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

        const packageName = `${project.kebabCasedName}-${project.version}.tgz`;
        const jsDir =
            project.language === 'js'
                ? project.rootDir
                : project.rootDir.getChild('working');
        const srcPath = jsDir.getFilePath(packageName);
        const distDir = project.rootDir.getChild('dist');

        const npmBin = 'npm';
        const packTask = () =>
            _execa(npmBin, ['pack'], {
                stdio: 'inherit',
                cwd: jsDir.absolutePath,
            });

        const copyTask = () =>
            _gulp.src(srcPath).pipe(_gulp.dest(distDir.absolutePath));
        const deleteTask = () => _delete([srcPath]);

        const task = _gulp.series([packTask, copyTask, deleteTask]);
        return task;
    }
}
