'use strict';

// import _delete from 'delete';
import TaskBuilder from '../task-builder.js';
import Project from '../project2.js';

/**
 * Builder that can be used to generate a gulp task to clean temporary project
 * files.
 */
export default class CleanTaskBuilder extends TaskBuilder {
    /**
     * Creates a new clean task.
     */
    constructor() {
        super(
            'clean',
            'Cleans out working, distribution and temporary files and directories'
        );
    }

    /**
     * Generates a gulp task to clean up temporary project files.
     *
     * @param {Object} project Reference to the project for which the task needs
     * to be defined.
     *
     * @returns {Function} A gulp task.
     */
    createTask(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        return () => undefined;
    }
}

// export default (project, options) => {
//     const rootDir = project.rootDir;

//     const dirs = ['coverage', 'dist'];
//     const extras = [];

//     if (project.hasTypescript || project.projectType === 'aws-microservice') {
//         dirs.push('working');
//     }

//     if (project.hasTypescript) {
//         dirs.push('.tscache');
//         extras.push({
//             name: 'typescript-temp',
//             path: rootDir.getFileGlob('tscommand-*.tmp.txt'),
//         });
//     }

//     if (project.projectType === 'aws-microservice') {
//         dirs.push('cdk.out');
//     }

//     if (project.hasServer) {
//         extras.push({
//             name: 'logs',
//             path: rootDir.getChild('logs').getAllFilesGlob('log'),
//         });
//     }

//     const paths = dirs.map((dir) => rootDir.getChild(dir).globPath);
//     const task = () => _delete(paths);

//     task.displayName = 'clean';
//     task.description =
//         'Cleans out working, distribution and temporary files and directories';

//     return task;
// };
