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

    const packageName = `${name.replace(/\//g, '-')}-${version}.zip`;

    const cdkBin = 'cdk';

    const tasks = project.getCdkStacks().map((stack) => {
        const args = [
            'deploy',
            stack,
            '--app',
            `"node ${workingDir.absolutePath}/infra/index"`
        ];
        const task = () =>
            _execa(cdkBin, args, {
                stdio: 'inherit',
                env: {
                    AWS_PROFILE: project.awsProfile,
                    AWS_REGION: project.awsRegion
                }
            });
        task.displayName = `publish-${stack}`;
        task.description = `Publishes the ${stack} stack to AWS using CDK`;

        return task;
    });

    return tasks;
};
