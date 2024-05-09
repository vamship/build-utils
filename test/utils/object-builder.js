import { setProperty } from 'dot-prop';
import { stub } from 'sinon';
import _esmock from 'esmock';
import _path from 'path';
import { fileURLToPath } from 'url';
import { camelCase, pascalCase } from 'change-case';
import { expect } from 'chai';

/**
 * @private
 */
function _prepareMockImportData(names, suffix, path, createMock) {
    return names.map((name) => {
        const ref = createMock(name);
        return {
            name,
            ref,
            className: pascalCase(`${name}-${suffix}`),
            importRef: `${camelCase(`${name}-${suffix}`)}Mock`,
            ctor: ref.ctor,
            importPath: _path.join(path, `${name}-${suffix}.js`),
        };
    });
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
    overrides = overrides || {};
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
                default: {
                    repo: 'my-repo',
                    buildFile: 'BuildFile-1',
                    buildArgs: {
                        arg1: 'value1',
                    },
                },
                myBuildArm: {
                    repo: 'my-repo-arm',
                    buildFile: 'BuildFile-1-arm',
                    buildArgs: {
                        arg1: 'value1-arm',
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
        { method: 'on' },
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
        { callSequence: [] },
    );
}

/**
 * Creates and returns a mock object for a task builder.
 *
 * @param {String} name The name of the task builder.
 * @param {Array} watchPaths The list of watch paths for the task builder. This
 * will be defaulted to a non empty array if omitted.
 * @returns {Object} A task builder mock object.
 */
export function createTaskBuilderMock(name, watchPaths) {
    if (!watchPaths) {
        watchPaths = ['/foo/path', `/bar/path/${name}`];
    }
    const taskRet = `_${name}_task_ret_`;
    const task = stub().returns(taskRet);
    task._name = name;
    const mock = {
        _name: name,
        _ret: taskRet,
        _watchPaths: watchPaths,
        _task: task,
    };
    mock.ctor = stub().returns(mock);
    mock.buildTask = stub().returns(task);
    mock.getWatchPaths = stub().returns(mock._watchPaths);

    return mock;
}

/**
 * Creates and returns a mock object for execa.
 *
 * @returns {Object} An execa mock object.
 */
export function createExecaMock() {
    const mock = {
        source: '_execa_ret_',
        execa: stub().callsFake(() => mock),
        then: stub().callsFake(() => mock),
    };

    return mock;
}

/**
 * Creates and returns a mock object for a task factory.
 *
 * @param {String} name The name of the task factory.
 * @returns {Object} A task factory mock object.
 */
export function createTaskFactoryMock(name) {
    const taskRet = `_${name}_task_ret_`;
    const task = stub().returns(taskRet);
    task._name = name;
    const mock = {
        _name: name,
        _ret: taskRet,
        _task: task,
    };
    mock.ctor = stub().returns(mock);

    return mock;
}

/**
 * Creates and returns a mock for the fancy-log library.
 *
 * @returns {Object} A fancy-log mock object.
 */
export function createFancyLogMock() {
    return ['log', 'info', 'warn', 'error', 'dir'].reduce((logger, key) => {
        logger[key] = stub();
        return logger;
    }, stub());
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
                    `[Module Importer] Import path not defined for module: ${key}`,
                );
            }
            result[transform(pathDefinitions[key])] = mockDefs[key];
            return result;
        }, {});

        const module = await _esmock(
            _path.resolve(basePath, transform(modulePath)),
            mocks,
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
    const mockData = _prepareMockImportData(
        builderNames,
        'task-builder',
        _path.join('src', 'task-builders'),
        createTaskBuilderMock,
    );
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
    const mockData = _prepareMockImportData(
        mockNames,
        'task-builder',
        _path.join('src', 'task-builders'),
        createTaskBuilderMock,
    );

    const mocks = mockData.reduce((result, { ref }) => {
        result[ref._name] = ref;
        return result;
    }, {});

    const mockReferences = mockData.reduce(
        (result, { importRef, ctor, className }) => {
            result[importRef] = { [className]: ctor };
            return result;
        },
        {},
    );

    return { mocks, mockReferences };
}

/**
 * Creates a dictionary of task definition mocks that can be used to initialize
 * a module importer.
 *
 * @param {Array} factoryNames The list of task factorys for which the
 * definition mocks need to be created.
 *
 * @returns {Object} An object containing a map of mock names to import paths.
 */
export function createTaskFactoryImportDefinitions(factoryNames) {
    const mockData = _prepareMockImportData(
        factoryNames,
        'task-factory',
        _path.join('src', 'task-factories'),
        createTaskFactoryMock,
    );
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
export function createTaskFactoryImportMocks(mockNames) {
    const mockData = _prepareMockImportData(
        mockNames,
        'task-factory',
        _path.join('src', 'task-factories'),
        createTaskFactoryMock,
    );

    const mocks = mockData.reduce((result, { ref }) => {
        result[ref._name] = ref;
        return result;
    }, {});

    const mockReferences = mockData.reduce(
        (result, { importRef, ctor, className }) => {
            result[importRef] = { [className]: ctor };
            return result;
        },
        {},
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
