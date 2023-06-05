'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';
import { config as _dotenvConfig } from 'dotenv';
import _dotenvExpand from 'dotenv-expand';
import _path from 'path';

/**
 * Builder function that can be used to generate a gulp task to publish a CDK
 * project to AWS.
 */
export class PublishAwsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {String} target The name of the CDK stack target
     */
    constructor(target) {
        if (typeof target !== 'string' || target.length === 0) {
            throw new Error('Invalid target (arg #1)');
        }
        super('publish-aws', `Publish a CDK project to AWS`);

        this._target = target;
    }

    /**
     * Generates a gulp task to execute automated tests
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

        const definition = project.getCdkStackDefinition(this._target);
        const infraDir = project.rootDir.getChild('infra');
        const jsDir =
            project.language === 'js'
                ? project.rootDir
                : project.rootDir.getChild('working');

        const task = () => {
            [`.env.${process.env.INFRA_ENV}`, '.env']
                .map((envFile) => infraDir.getFileGlob(envFile))
                .forEach((envFile) => {
                    _dotenvExpand(_dotenvConfig(envFile));
                });

            const undefinedVars = project.getUndefinedEnvironmentVariables();
            if (undefinedVars.length > 0) {
                throw new Error(
                    `Missing required environment variables: [${undefinedVars.join(
                        ','
                    )}]`
                );
            }

            const cdkBin = 'cdk';
            const args = [
                'deploy',
                definition.name,
                '--app',
                jsDir.getChild('infra').getFilePath('index'),
            ];

            if (process.env.INFRA_NO_PROMPT === 'true') {
                args.splice(1, 0, '--require-approval=never');
            }

            _execa(cdkBin, args, {
                stdio: 'inherit',
                cwd: jsDir.absolutePath,
            });
        };
        return task;
    }
}
