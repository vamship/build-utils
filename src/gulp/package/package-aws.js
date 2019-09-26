'use strict';

const _gulp = require('gulp');
const _zip = require('gulp-zip');
const _execa = require('execa');

/**
 * Sub builder that packages an aws-microservice project for deployment. This
 * follows the build steps described for
 * [lambda deployments](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html#nodejs-package-dependencies)
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
    const { name, version, hasPrivateNpm, rootDir } = project;
    const workingDir = rootDir.getChild('working');

    const packageName = `${name.replace(/\//g, '-')}-${version}.tgz`;

    const installTask = () => {
        const npmBin = 'npm';
        const args = ['install', '--production'];

        if (hasPrivateNpm) {
            project.validatePrivateNpmParams();
        }

        return _execa(npmBin, args, {
            stdio: 'inherit',
            cwd: workingDir.absolutePath
        });
    };

    installTask.displayName = 'package-aws-install';
    installTask.description = 'Install package dependency in working directory';

    const dirs = ['src', 'node_modules'];
    const extras = ['package.json', project.configFileName];

    const paths = dirs
        .map((dir) => workingDir.getChild(dir))
        .map((dir) => dir.getAllFilesPattern())
        .concat(extras.map((file) => workingDir.getFilePath(file)));

    const zipTask = () =>
        _gulp
            .src(paths, { allowEmpty: true, base: workingDir.absolutePath })
            .pipe(_zip(packageName))
            .pipe(_gulp.dest(rootDir.getChild('dist').absolutePath));

    zipTask.displayName = 'package-aws-zip';
    zipTask.description =
        'Create a project distribution for AWS lambda deployments';

    return _gulp.series([installTask, zipTask]);
};
