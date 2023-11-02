'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';
import _gulp from 'gulp';
import _zip from 'gulp-zip';

/**
 * Builder function that can be used to generate a gulp task to package a
 * project for deployment to AWS.
 */
export class PackageAwsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('package-aws', `Package a project for publishing to AWS`);
    }

    /**
     * Generates a gulp task to package a project for deployment to AWS.
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

        const jsDir =
            project.language === 'js'
                ? project.rootDir
                : project.rootDir.getChild('working');

        const installTask = () => {
            const npmBin = 'npm';
            const args = ['install', '--production'];

            return _execa(npmBin, args, {
                stdio: 'inherit',
                cwd: jsDir.absolutePath,
            }).then(undefined, (err) => {
                /*
                 * Do nothing. This handler prevents the gulp task from
                 * crashing with an unhandled error.
                 */
            });
        };

        const dirs = ['src', 'node_modules'];
        const extras = ['package.json', project.configFileName];

        const paths = dirs
            .map((dir) => jsDir.getChild(dir))
            .map((dir) => dir.getAllFilesGlob())
            .concat(extras.map((file) => jsDir.getFileGlob(file)));
        const packageName = `${project.kebabCasedName}-${project.version}.zip`;

        const zipTask = () =>
            _gulp
                .src(paths, {
                    allowEmpty: true,
                    base: project.rootDir.globPath,
                })
                .pipe(_zip(packageName))
                .on('error', (err) => {
                    /*
                     * Do nothing. This handler prevents the gulp task from
                     * crashing with an unhandled error.
                     */
                })
                .pipe(
                    _gulp.dest(project.rootDir.getChild('dist').absolutePath)
                );

        const task = _gulp.series([installTask, zipTask]);
        return task;
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const dirs = ['src', 'test', 'infra'];
        const exts = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
        const rootDir =
            project.language === 'ts'
                ? project.rootDir.getChild('working')
                : project.rootDir;

        return dirs
            .map((dir) =>
                exts.map((ext) => rootDir.getChild(dir).getAllFilesGlob(ext))
            )
            .flat();
    }
}
