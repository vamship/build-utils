import { setProperty } from 'dot-prop';
import { stub } from 'sinon';
import _esmock from 'esmock';
import _path from 'path';
import { fileURLToPath } from 'url';
import _camelcase from 'camelcase';
import { expect } from 'chai';

/**
 * @private
 */
function _prepareBuilderMockData(builderNames) {
    return builderNames
        .map(
            (name) => ({
                name,
                ref: createTaskBuilderMock(name),
                refName: _camelcase(name) + 'TaskBuilder',
            }),
            {}
        )
        .map(({ name, ref, refName }) => ({
            ref,
            importRef: `${refName}Mock`,
            ctor: ref.ctor,
            className: refName.charAt(0).toUpperCase() + refName.slice(1),
            importPath: `src/task-builders/${name}-task-builder.js`,
        }));
}

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

export function initializeFactoryTaskMocks(taskList) {
    return taskList
        .map((taskName) => ({
            snakeCaseName: taskName,
            camelCaseName: _camelcase(taskName),
        }))
        .map(({ snakeCaseName, camelCaseName }) => ({
            snakeCaseName,
            camelCaseName,
            className: `${camelCaseName.replace(
                /^./,
                camelCaseName.charAt(0).toUpperCase()
            )}TaskBuilder`,
            mockName: `${camelCaseName}TaskBuilderMock`,
            builderMock: createTaskBuilderMock(snakeCaseName),
        }))
        .reduce(
            (map, item) => {
                const { mockReferences, taskMap } = map;
                const { snakeCaseName, className, mockName, builderMock } =
                    item;

                mockReferences[mockName] = {
                    [className]: builderMock.ctor,
                };
                taskMap[snakeCaseName] = item;

                return map;
            },
            { mockReferences: {}, taskMap: {} }
        );
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

/**
 * Creates a dictionary of task definition mocks that can be used to initialize
 * a module importer.
 *
 * @param {Array} builderNames The list of task builders for which the
 * definition mocks need to be created.
 *
 * @returns {Object} An object containing a map of mock names to import paths.
 */
export function createTaskBuilderImportDefinitions(builderNames) {
    const mockData = _prepareBuilderMockData(builderNames);
    return mockData.reduce((result, { importRef, importPath }) => {
        result[importRef] = importPath;
        return result;
    }, {});
}

/**
 * Initializes a collection of objects that can be used to test task lists
 * generated from task factories.
 *
 * @param {Array} taskList The list of tasks for which the objects are to be
 * created.
 * @returns {Object} An object containing the following properties:
 *  - mockReferences: A map of mock references that maps mock objects to
 *  specific imports for the module.
 *  - taskMap: A map of objects that contain a superset of information about the
 *  task mocks.
 */
export function createTaskBuilderImportMocks(mockNames) {
    const mockData = mockNames
        .map(
            (name) => ({
                ref: createTaskBuilderMock(name),
                refName: _camelcase(name) + 'TaskBuilder',
            }),
            {}
        )
        .map(({ ref, refName }) => ({
            ref,
            importRef: `${refName}Mock`,
            ctor: ref.ctor,
            className: refName.charAt(0).toUpperCase() + refName.slice(1),
            importPath: `src/task-builders/${refName}-task-builder.js`,
        }));

    const mocks = mockData.reduce((result, { ref }) => {
        result[ref._name] = ref;
        return result;
    }, {});

    const mockReferences = mockData.reduce(
        (result, { importRef, ctor, className }) => {
            result[importRef] = { [className]: ctor };
            return result;
        },
        {}
    );

    return { mocks, mockReferences };
}

/**
 * Creates a failure message that includes metadata that can help identify a
 * failing test case.
 *
 * @param {Object} propList A list of objects that contain the metadata to use
 * when creating the failure message.
 * @returns {String} A string containing the failure message.
 */
export function buildFailMessage(...propList) {
    const attributes = propList
        .map((props) => Object.keys(props).map((key) => `${key}=${props[key]}`))
        .reduce((acc, curr) => acc.concat(curr), []);
    return `[${attributes.join(', ')}]`;
}

/**
 * Returns a checker function that checks that the mock's constructor was never
 * called.
 *
 * @param {Object} overrides An object that contains overrides for the test
 * case.
 * @returns {Function} A function that performs the check.
 */
export function createCtorNotCalledChecker(overrides) {
    return (mock) => {
        const failMessage = buildFailMessage(overrides, {
            task: mock._name,
        });
        expect(mock.ctor, failMessage).not.to.have.been.called;
    };
}
