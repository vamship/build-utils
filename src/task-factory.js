import { Project } from './project.js';
import { WatchTaskBuilder } from './task-builders/watch-task-builder.js';

/**
 * Represents a factory that generates a set of build tasks for a given project
 * type. This is an abstract class that must be extended to provide a list of
 * task builders for a given project type.
 */
export default class TaskFactory {
    /**
     * Creates a new instance of TaskFactory, initialized for a given project.
     * @param {Project} project The project to generate build tasks for.
     */
    constructor(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        this._project = project;
    }

    /**
     * Protected abstract method that can be overridden to provide the
     * necessary tasks for a given project type.
     *
     * @returns {Array} An array of task builders.
     */
    _createTaskBuilders() {
        return [];
    }

    /**
     * Creates a set of build tasks for the project.
     *
     * @returns {Array} An array of gulp tasks.
     */
    createTasks() {
        const project = this._project;
        const builders = this._createTaskBuilders();
        const watchBuilders = builders
            .filter((builder) => builder.getWatchPaths(project).length > 0)
            .map(
                (builder) =>
                    new WatchTaskBuilder(
                        builder.buildTask(project),
                        builder.getWatchPaths(project)
                    )
            );
        return builders
            .concat(watchBuilders)
            .map((builder) => builder.buildTask(project));
    }
}
