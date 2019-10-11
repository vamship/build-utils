'use strict';

const { createNpmPackageTask } = require('./utils');

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
    const { snakeCasedName, version, rootDir, jsRootDir } = project;

    const packageName = `${snakeCasedName}-${version}.tgz`;
    const packageDir = jsRootDir;
    const distDir = rootDir.getChild('dist');

    return createNpmPackageTask(packageDir, packageName, distDir);
};
