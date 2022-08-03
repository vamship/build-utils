'use strict';

import _delete from 'delete';

/**
 * Builder function that can be used to generate a gulp task to clean temporary
 * project files.
 *
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
export default (project, options) => {
    const rootDir = project.rootDir;

    const dirs = ['coverage', 'dist'];
    const extras = [];

    if (
        project.hasExportedTypes ||
        project.hasTypescript ||
        project.projectType === 'aws-microservice'
    ) {
        dirs.push('working');
    }

    if (project.hasTypescript) {
        dirs.push('.tscache');
        extras.push({
            name: 'typescript-temp',
            path: rootDir.getFileGlob('tscommand-*.tmp.txt'),
        });
    }

    if (project.projectType === 'aws-microservice') {
        dirs.push('cdk.out');
    }

    if (project.hasServer) {
        extras.push({
            name: 'logs',
            path: rootDir.getChild('logs').getAllFilesGlob('log'),
        });
    }

    const paths = dirs.map((dir) => rootDir.getChild(dir).globPath);
    const task = () => _delete(paths);

    task.displayName = 'clean';
    task.description =
        'Cleans out working, distribution and temporary files and directories';

    return task;
};
