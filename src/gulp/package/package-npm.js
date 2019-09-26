'use strict';

const _gulp = require('gulp');
const _execa = require('execa');

/**
 * Sub builder that packages a project using npm pack, from source files or
 * compiled typescript files.
 *
 * @private
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
module.exports = (project, options) => {
    const { name, version, rootDir } = project;
    const { jsRootDir } = rootDir;

    const packageName = `${name.replace(/\//g, '-')}-${version}.tgz`;

    const npmBin = 'npm';
    const args = ['pack'];

    const packTask = () =>
        _execa(npmBin, args, {
            stdio: 'inherit',
            cwd: jsRootDir.absolutePath
        });

    packTask.displayName = 'package-npm';
    packTask.description = 'Create a project distribution using npm';

    const copyTask = () =>
        _gulp
            .src(jsRootDir.getFilePath(packageName))
            .pipe(_gulp.dest(rootDir.getChild('dist').absolutePath));

    copyTask.displayName = 'package-npm-copy';
    copyTask.description =
        'Copies the project package to the distribution directory';

    return _gulp.series([packTask, copyTask]);
};
