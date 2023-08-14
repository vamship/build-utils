import semver from 'semver';
import _camelcase from 'camelcase';
import _gulp from 'gulp';
import Ajv from 'ajv';

import _projectDataSchema from './schema/project-definition.js';
import { Directory } from './directory.js';

const _validateProjectData = new Ajv().compile(_projectDataSchema);

/**
 * Represents a build project that encapsulates one or more relavent build
 * tasks.
 */
export class Project {
    /**
     * Creates a new project based on the specified build metadata.
     *
     * @param {Object} projectDefinition An object that contains the project
     * definition.
     */
    constructor(projectDefinition) {
        if (
            !projectDefinition ||
            projectDefinition instanceof Array ||
            typeof projectDefinition !== 'object'
        ) {
            throw new Error('Invalid project definition (arg #1)');
        }

        if (!_validateProjectData(projectDefinition)) {
            const { instancePath, message } = _validateProjectData.errors[0];
            throw new Error(
                `Schema validation failed [${instancePath
                    .replace(/\//g, '.')
                    .trim()} ${message}]`
            );
        }

        const {
            name,
            version,
            description,
            buildMetadata: {
                type,
                language,
                requiredEnv,
                staticFilePatterns,
                aws,
                container,
            },
        } = projectDefinition;

        if (!semver.valid(version)) {
            throw new Error(
                `Schema validation failed [.version is not a valid semantic version]`
            );
        }

        if (aws && aws.stacks && Object.keys(aws.stacks).length <= 0) {
            throw new Error(`No AWS stacks defined`);
        }

        if (container && Object.keys(container).length <= 0) {
            throw new Error(`No container builds defined`);
        }

        this._name = name;
        this._description = description;
        this._unscopedName = name.replace(/^@[^/]*\//, '');
        this._kebabCasedName = name.replace(/^@/, '').replace(/\//g, '-');
        this._version = version;
        this._type = type;
        this._language = language;
        this._staticFilePatterns = staticFilePatterns || [];
        this._requiredEnv = requiredEnv || [];
        this._aws = aws || { stacks: {} };
        this._cdkTargets = Object.keys(this._aws.stacks).reduce(
            (result, key) => {
                result[key] = { name: this._aws.stacks[key] };
                return result;
            },
            {}
        );
        this._container = container || {};

        this._containerTargets = Object.keys(this._container).reduce(
            (result, key) => {
                const { repo, buildFile, buildArgs } = this._container[key];
                result[key] = {
                    name: key,
                    repo,
                    buildFile,
                    buildArgs,
                };
                return result;
            },
            {}
        );

        this._rootDir = Directory.createTree('./', {
            src: null,
            test: {
                unit: null,
                api: null,
            },
            infra: null,
            working: {
                src: null,
                test: {
                    unit: null,
                    api: null,
                },
                infra: null,
                node_modules: null,
            },
            dist: null,
            docs: null,
            node_modules: null,
            coverage: null,
            '.gulp': null,
            '.tscache': null,
            logs: null,
            'cdk.out': null,
        });
    }

    /**
     * Gets the name of the project.
     *
     * @returns {String} The project name.
     */
    get name() {
        return this._name;
    }

    /**
     * Gets the description of the project.
     *
     * @returns {String} The project description.
     */
    get description() {
        return this._description;
    }

    /**
     * Gets the name of the project without any scoping prefixes.
     *
     * @returns {String} The project name (without scope).
     */
    get unscopedName() {
        return this._unscopedName;
    }

    /**
     * Gets the name of the project in kebab case.
     *
     * @returns {String} The project name in kebab case.
     */
    get kebabCasedName() {
        return this._kebabCasedName;
    }

    /**
     * Gets the name of the expected configuration file name based on the name
     * of the project.
     *
     * @returns {String} The expected config file name.
     */
    get configFileName() {
        return `.${_camelcase(this._unscopedName)}rc`;
    }

    /**
     * Gets the version of the project.
     *
     * @returns {String} The project version.
     */
    get version() {
        return this._version;
    }

    /**
     * Gets the type of the project.
     *
     * @returns {String} The project type.
     */
    get type() {
        return this._type;
    }

    /**
     * Gets the language of the project.
     *
     * @returns {String} The project language.
     */
    get language() {
        return this._language;
    }

    /**
     * Gets the root directory of the project.
     *
     * @returns {Directory} The project root directory
     */
    get rootDir() {
        return this._rootDir;
    }

    /**
     * Returns a list of static file patterns configured for the project.
     *
     * @returns {Array} An array of glob strings used to identify static files
     * copied over during a build.
     */
    getStaticFilePatterns() {
        return this._staticFilePatterns.concat([]);
    }

    /**
     * Returns a list of environment variables that must be defined for the
     * build.
     *
     * @returns {Array} An array of environment variable names.
     */
    getRequiredEnv() {
        return this._requiredEnv.concat([]);
    }

    /**
     * Returns a list of CDK stack keys defined for the project. These stack
     * keys will be used to generate deploy tasks for each. Each key maps to a
     * specific CDK stack that can be deployed.
     *
     * @return {Array} A list of stack keys
     */
    getCdkTargets() {
        return Object.keys(this._cdkTargets);
    }

    /**
     * Gets CDK stack information based on the cdk stack key.
     *
     * @param {String} target The CDK target name
     * @returns {Object} The CDK definition corresponding to the target.
     */
    getCdkStackDefinition(target) {
        if (typeof target !== 'string' || target.length <= 0) {
            throw new Error('Invalid CDK target (arg #1)');
        }
        const stack = this._cdkTargets[target];
        if (!stack) {
            throw new Error(`CDK target has not been defined (${target})`);
        }
        return Object.assign({}, stack);
    }

    /**
     * Returns a list of docker targets defined for the project. Every target
     * will define the following properties:
     * - repo: The docker repo
     * - buildFile: The name of the build file to use
     * - buildArgs: Arguments to be passed to the docker build
     *
     * @return {Array}
     */
    getContainerTargets() {
        return Object.keys(this._containerTargets);
    }

    /**
     * Gets CDK stack information based on the cdk stack key.
     *
     * @param {String} target The CDK target name
     * @returns {Object} The container definition corresponding to the target.
     */
    getContainerDefinition(target) {
        if (typeof target !== 'string' || target.length <= 0) {
            throw new Error('Invalid container target (arg #1)');
        }
        const container = this._containerTargets[target];
        if (!container) {
            throw new Error(
                `Container target has not been defined (${target})`
            );
        }
        return Object.assign({}, container);
    }

    /**
     * Returns a list of project enviornment variables that are not defined in
     * the current execution environment.
     *
     * @return {Array} An array of missing environment variables.
     */
    getUndefinedEnvironmentVariables() {
        return this._requiredEnv.filter((env) => !process.env[env]);
    }
}
