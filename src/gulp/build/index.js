'use strict';

const _gulp = require('gulp');

/**
 * Builder function that can be used to generate a gulp task to build source
 * files. The task takes on different implementations based on project types.
 * For example, this task will compile typescript projects, copy AWS
 * microservice projects to the target directory, and has no effect on other
 * pure javascript projects.
 *
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
module.exports = (project, options) => {
    const { watch } = Object.assign({ watch: false }, options);

    if (!project.hasTypescript && project.projectType !== 'aws-microservice') {
        return;
    }

    const jsBuild = require('./build-js');
    const tasks = [jsBuild(project, options)];

    if (project.hasTypescript) {
        const tsBuild = require('./build-ts');
        tasks.push(tsBuild(project, options));
    }

    const task = _gulp.parallel(tasks);
    if (!watch) {
        task.displayName = 'build';
        task.description = 'Transpile/copy source files into working directory';
    } else {
        task.displayName = 'watch-build';
        task.description =
            'Automatically transpile/copy source files on change';
    }

    return task;
};
