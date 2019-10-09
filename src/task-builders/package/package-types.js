'use strict';

const _gulp = require('gulp');
const _execa = require('execa');
const _path = require('path');
const _fs = require('fs');

const { createNpmPackageTask } = require('./utils');

/**
 * Sub builder that packages the types exported by a project using npm pack. A
 * custom package.json file is generated for the types.
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
    const { name, version, license, keywords, rootDir } = project;

    const packageName = `${name.replace(/\//g, '-')}-types-${version}.tgz`;
    const packageDir = rootDir
        .getChild('working')
        .getChild(project.exportedTypes);
    const distDir = rootDir.getChild('dist');

    const createPackageJsonTask = (cb) =>
        _fs.writeFile(
            packageDir.getFilePath('package.json'),
            JSON.stringify({
                name: `${name}-types`,
                version,
                description: `Types for project ${name}`,
                license,
                keywords
            }),
            cb
        );
    createPackageJsonTask.displayName = 'package-types-packagejson';
    createPackageJsonTask.description =
        'Creates a package.json file for the types';

    const packTask = createNpmPackageTask(packageDir, packageName, distDir);
    packTask.displayName = 'package-types-npm';
    packTask.description =
        'Creates an NPM package for the types exported by the project';

    return _gulp.series([createPackageJsonTask, packTask]);
};
