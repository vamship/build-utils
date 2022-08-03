'use strict';

import _gulp from 'gulp';
import _path from 'path';
import _fs from 'fs';
import { execa as _execa } from 'execa';

import { createNpmPackageTask } from './utils.js';

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
export default (project, options) => {
    const { name, snakeCasedName, version, license, keywords, rootDir } =
        project;

    const packageName = `${snakeCasedName}-types-${version}.tgz`;
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
                keywords,
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
