'use strict';

const _execa = require('execa');
const _gulp = require('gulp');

/**
 * Utility function that initializes and returns an array of tasks for npm
 * package/publish operations.
 *
 * @param {Directory} packageDir The directory in which the package will be
 *        created.
 * @param {String} packageName The name of the package that is being created.
 * @param {Directory} targetDir The directory to which the package will be
 *        deployed.
 *
 * @returns {Function} A gulp task that creates the package.
 */
module.exports.createNpmPackageTask = function(
    packageDir,
    packageName,
    targetDir
) {
    const npmBin = 'npm';
    const args = ['pack'];

    const packTask = () =>
        _execa(npmBin, args, {
            stdio: 'inherit',
            cwd: packageDir.absolutePath
        });

    packTask.displayName = 'package-npm';
    packTask.description = 'Create a project distribution using npm';

    const copyTask = () =>
        _gulp
            .src(packageDir.getFilePath(packageName))
            .pipe(_gulp.dest(targetDir.absolutePath));

    copyTask.displayName = 'package-npm-copy';
    copyTask.description =
        'Copies the project package to the distribution directory';

    return _gulp.series([packTask, copyTask]);
};
