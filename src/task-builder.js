/**
 * Represents a builder class that can construct a Gulp task. This abstract base
 * class must be extended by child classes that provide the required
 * implementation.
 */
export default class TaskBuilder {
    /**
     * Creates a task builder with the given name and description.
     *
     * @param {string} name The name of the task - this will be the name
     * recognized by gulp, and must be unique.
     * @param {string} description The description of the task - this will be
     * the description shown by gulp.
     */
    constructor(name, description) {
        if (typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid name (arg #1)');
        }
        if (typeof description !== 'string' || description.length <= 0) {
            throw new Error('Invalid description (arg #2)');
        }

        this._name = name;
        this._description = description;
    }

    /**
     * Gets the name of the task.
     *
     * @returns {String} The task name.
     */
    get name() {
        return this._name;
    }

    /**
     * Gets the description of the task.
     *
     * @returns {String} The task description.
     */
    get description() {
        return this._description;
    }

    /**
     * Creates a new task - needs to be implemented by a child class.
     */
    createTask() {
        throw new Error('Not implemented - TaskBuilder.createTask()');
    }
}
