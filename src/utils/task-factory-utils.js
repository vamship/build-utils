/**
 * For a project that has multiple containers defined, this function will return
 * the additional tasks for each container. These tasks may be called by name
 * following the naming convention package-container-${targetContainerName} and
 * publish-container-${targetContainerName} for example.
 * @param {Project} project The project for which to generate additional package
 * and publish tasks.
 * @param {Function} additionalTaskList A function that returns the set of task
 * builders to be generated for each container. Takes container target as input.
 * @returns {Array} An array of tasks, empty if no extra containers are defined
 */
export function generateAdditionalContainerTasks(project, additionalTaskList) {
    const tasks = [];
    const containerTargets = project.getContainerTargets();

    // > 1 since default container
    if (containerTargets.length > 1) {
        containerTargets
            .filter((x) => x !== 'default')
            .forEach((target) => {
                tasks.push(...additionalTaskList(target));
            });
    }

    return tasks;
}
