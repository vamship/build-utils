'use strict';

/**
 * Utility library that can be used to create development tooling.
 */
module.exports = {
    /**
     * A class that represents a directory on the file system.
     */
    Directory: require('./directory'),

    /**
     * Represents a specific project configuration.
     */
    Project: require('./project'),

    /**
     * A collection of task builder functions that can be used to generate
     * commonly used gulp files for projects.
     */
    taskBuilders: require('./task-builders'),
};
