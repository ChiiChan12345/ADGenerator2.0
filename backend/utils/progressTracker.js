const EventEmitter = require('events');
const logger = require('./logger');

class ProgressTracker extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.connections = new Map();
  }

  /**
   * Create a new progress tracking task
   * @param {string} taskId - Unique task identifier
   * @param {object} metadata - Task metadata
   * @returns {object} Task object
   */
  createTask(taskId, metadata = {}) {
    const task = {
      id: taskId,
      status: 'started',
      progress: 0,
      totalSteps: metadata.totalSteps || 100,
      currentStep: 0,
      message: 'Task started',
      startTime: Date.now(),
      metadata: metadata,
      steps: []
    };

    this.tasks.set(taskId, task);
    this.emitProgress(taskId);
    
    logger.info('Progress task created', { taskId, metadata });
    return task;
  }

  /**
   * Update progress for a task
   * @param {string} taskId - Task identifier
   * @param {object} update - Progress update
   */
  updateProgress(taskId, update) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.warn('Attempted to update non-existent task', { taskId });
      return;
    }

    // Update task properties
    Object.assign(task, {
      ...update,
      lastUpdated: Date.now()
    });

    // Calculate progress percentage
    if (update.currentStep !== undefined && task.totalSteps) {
      task.progress = Math.min(100, Math.round((update.currentStep / task.totalSteps) * 100));
    }

    // Add step to history
    if (update.message) {
      task.steps.push({
        timestamp: Date.now(),
        message: update.message,
        step: task.currentStep,
        data: update.data
      });
    }

    this.tasks.set(taskId, task);
    this.emitProgress(taskId);
    
    logger.debug('Progress updated', { taskId, progress: task.progress, message: update.message });
  }

  /**
   * Mark task as completed
   * @param {string} taskId - Task identifier
   * @param {object} result - Final result
   */
  completeTask(taskId, result = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    task.status = 'completed';
    task.progress = 100;
    task.currentStep = task.totalSteps;
    task.endTime = Date.now();
    task.duration = task.endTime - task.startTime;
    task.result = result;
    task.message = 'Task completed successfully';

    this.tasks.set(taskId, task);
    this.emitProgress(taskId);
    
    logger.info('Progress task completed', { 
      taskId, 
      duration: task.duration,
      totalSteps: task.steps.length 
    });

    // Clean up task after delay
    setTimeout(() => {
      this.tasks.delete(taskId);
    }, 300000); // 5 minutes
  }

  /**
   * Mark task as failed
   * @param {string} taskId - Task identifier
   * @param {Error} error - Error object
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    task.status = 'failed';
    task.endTime = Date.now();
    task.duration = task.endTime - task.startTime;
    task.error = {
      message: error.message,
      stack: error.stack
    };
    task.message = `Task failed: ${error.message}`;

    this.tasks.set(taskId, task);
    this.emitProgress(taskId);
    
    logger.error('Progress task failed', { taskId, error: error.message });

    // Clean up task after delay
    setTimeout(() => {
      this.tasks.delete(taskId);
    }, 300000); // 5 minutes
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task identifier
   * @returns {object|null} Task object or null
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all active tasks
   * @returns {Array} Array of task objects
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Emit progress event
   * @param {string} taskId - Task identifier
   */
  emitProgress(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    // Emit to all connections for this task
    const connections = this.connections.get(taskId) || [];
    connections.forEach(res => {
      try {
        const data = `data: ${JSON.stringify(task)}\n\n`;
        res.write(data);
      } catch (error) {
        logger.error('Failed to send progress update', { taskId, error: error.message });
      }
    });

    // Emit event for other listeners
    this.emit('progress', { taskId, task });
  }

  /**
   * Add SSE connection for a task
   * @param {string} taskId - Task identifier
   * @param {Response} res - Express response object
   */
  addConnection(taskId, res) {
    if (!this.connections.has(taskId)) {
      this.connections.set(taskId, []);
    }
    
    this.connections.get(taskId).push(res);
    
    // Send current task state immediately
    const task = this.getTask(taskId);
    if (task) {
      try {
        const data = `data: ${JSON.stringify(task)}\n\n`;
        res.write(data);
      } catch (error) {
        logger.error('Failed to send initial progress state', { taskId, error: error.message });
      }
    }

    logger.debug('SSE connection added', { taskId });
  }

  /**
   * Remove SSE connection
   * @param {string} taskId - Task identifier
   * @param {Response} res - Express response object
   */
  removeConnection(taskId, res) {
    const connections = this.connections.get(taskId) || [];
    const index = connections.indexOf(res);
    
    if (index > -1) {
      connections.splice(index, 1);
      
      if (connections.length === 0) {
        this.connections.delete(taskId);
      } else {
        this.connections.set(taskId, connections);
      }
      
      logger.debug('SSE connection removed', { taskId });
    }
  }

  /**
   * Generate unique task ID
   * @returns {string} Unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old completed/failed tasks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [taskId, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        task.endTime &&
        (now - task.endTime) > maxAge
      ) {
        this.tasks.delete(taskId);
        this.connections.delete(taskId);
        logger.debug('Cleaned up old task', { taskId });
      }
    }
  }
}

// Create singleton instance
const progressTracker = new ProgressTracker();

// Clean up old tasks every 5 minutes
setInterval(() => {
  progressTracker.cleanup();
}, 300000);

module.exports = progressTracker; 