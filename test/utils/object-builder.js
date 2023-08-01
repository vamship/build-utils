import { setProperty } from 'dot-prop';
import { stub } from 'sinon';
import _esmock from 'esmock';
import _path from 'path';
import { fileURLToPath } from 'url';

/**
 * Creates a default project definition, with the option to override specific
 * properties.
 *
 * @param {Object} overrides Optional overridden properties. This is an array of
 * properties with overridden values. Nested properties may be referenced by
 * using a dot separator between levels.
 *
 * @returns {Object} The project definition.
 */
export function buildProjectDefinition(overrides) {
    overrides = overrides || [];
    const definition = {
        name: 'sample-project',
        description: 'Sample project description',
        version: '1.0.0',
        buildMetadata: {
            type: 'lib',
            language: 'js',
            requiredEnv: ['ENV_1', 'ENV_2'],
            aws: {
                stacks: {
                    myStack: 'my-stack',
                },
            },
            staticFilePatterns: ['foo'],
            container: {
                myBuild: {
                    repo: 'my-repo',
                    buildFile: 'BuildFile-1',
                    buildArgs: {
                        arg1: 'value1',
                    },
                },
            },
        },
    };

    Object.keys(overrides).forEach((key) => {
        const value = overrides[key];
        setProperty(definition, key, value);
    });
    return definition;
}

/**
 * Creates and returns a mock object for gulp.
 *
 * @returns {Object} A mock gulp object.
 */
export function createGulpMock() {
    return [
        { method: 'series', retValue: () => undefined },
        { method: 'src' },
        { method: 'pipe' },
        { method: 'dest', retValue: '_dest_ret_' },
        { method: 'watch', retValue: () => undefined },
    ].reduce(
        (result, item) => {
            const { method, retValue } = item;
            const mock = stub().callsFake(() => {
                result.callSequence.push(method);
                return typeof retValue !== 'undefined' ? retValue : result;
            });
            result[method] = mock;
            return result;
        },
        { callSequence: [] }
    );
}

/**
 * Creates and returns a mock object for a task builder.
 *
 * @param {String} name The name of the task builder.
 * @returns {Object} A task builder mock object.
 */
export function createTaskBuilderMock(name) {
    const taskRet = `_${name}_task_ret_`;
    const task = stub().returns(taskRet);
    const mock = {
        _name: name,
        _ret: taskRet,
    };
    mock.ctor = stub().returns(mock);
    mock.buildTask = stub().returns(task);

    return mock;
}

/**
 * Creates and returns a mock for the fancy-log library.
 *
 * @returns {Object} A fancy-log mock object.
 */
export function createFancyLogMock() {
    return {
        log: stub(),
        dir: stub(),
        info: stub(),
        warn: stub(),
        error: stub(),
    };
}

/**
 * Creates an importer function that imports a module with mocks injected into
 * dependencies.
 *
 * @param {String} modulePath The path to the module that is being imported
 * @param {Object} pathDefinitions A map of keys to dependent module paths. The
 * keys used in this dictionary should be used as the keys to the mocks passed
 * when the importer is invoked.
 * @param {String} memberName The name of member within the module that needs to
 * be imported.
 *
 * @returns {Function} A function that can be used to import the module with
 * mocks injected as dependencies.
 */
export function createModuleImporter(modulePath, pathDefinitions, memberName) {
    const basePath = _path.resolve(fileURLToPath(import.meta.url), '../../../');
    const transform = (path) =>
        path.startsWith('src/') ? _path.resolve(basePath, path) : path;

    return async (mockDefs) => {
        const mocks = Object.keys({ ...mockDefs }).reduce((result, key) => {
            if (!pathDefinitions[key]) {
                throw new Error(
                    `[Module Importer] Import path not defined for module: ${key}`
                );
            }
            result[transform(pathDefinitions[key])] = mockDefs[key];
            return result;
        }, {});

        const module = await _esmock(
            _path.resolve(basePath, transform(modulePath)),
            mocks
        );

        return typeof memberName !== 'string' ? module : module[memberName];
    };
}
