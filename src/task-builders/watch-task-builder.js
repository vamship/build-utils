import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import _gulp from 'gulp';
import _fancyLog from 'fancy-log';
import _colors from 'ansi-colors';

/**
 * Builder that adds a watcher to an existing task.
 */
export class WatchTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {Function} task Reference to the task that needs to be watched.
     * @param {Array} paths An array of paths to monitor for changes and trigger
     * the task on change.
     */
    constructor(task, paths) {
        if (typeof task !== 'function') {
            throw new Error('Invalid task (arg #1)');
        }
        if (!(paths instanceof Array)) {
            throw new Error('Invalid paths (arg #2)');
        }
        super(
            `watch-${task.displayName}`,
            `[Monitor and execute] ${task.description}`,
        );

        this._task = task;
        this._paths = paths.concat([]);
    }

    /**
     * Generates a gulp task to clean up temporary project files.
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
        const taskName = _colors.cyan(this._task.displayName);
        const task = _gulp.series(
            async () => _fancyLog(`Running task ${taskName}`),
            this._task,
            async () => _fancyLog('Task completed'),
        );
        return () => _gulp.watch(this._paths, task);
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        return [];
    }
}
