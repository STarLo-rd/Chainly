import { v4 as uuidv4 } from 'uuid';
import { Context } from './context';
import { Task, Middleware, WorkflowOptions, TaskResult, EventEmitter, EventPayload, EventHandler } from './types';

export class Workflow implements EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private middlewares: Middleware[] = [];
  private maxRetries: number;
  private retryDelay: number;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  constructor(options: WorkflowOptions = {}) {
    this.middlewares = options.middlewares || [];
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  addTask(task: Omit<Task, 'id'>): string {
    const id = uuidv4();
    this.tasks.set(id, { ...task, id });

    // Register event handlers for task triggers
    if (task.triggers) {
      task.triggers.forEach(eventName => {
        this.on(eventName, async (payload) => {
          await this.execute(id, { eventPayload: payload });
        });
      });
    }

    return id;
  }

  // Event emitter implementation
  emit(eventName: string, payload: EventPayload): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }

  on(eventName: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)!.add(handler);
  }

  off(eventName: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private async shouldExecuteTask(task: Task, context: Context): Promise<boolean> {
    if (!task.condition) return true;
    return task.condition(context);
  }

  private async getDependencies(task: Task, context: Context): Promise<string[]> {
    if (!task.dependencies) return [];
    if (typeof task.dependencies === 'function') {
      return task.dependencies(context);
    }
    return task.dependencies;
  }

  private async executeTask(
    task: Task,
    context: Context,
    attempt: number = 1
  ): Promise<TaskResult> {
    try {
      const shouldExecute = await this.shouldExecuteTask(task, context);
      if (!shouldExecute) {
        context.set(`${task.id}_skipped`, true);
        return null;
      }

      // Execute pre-middleware
      for (const middleware of this.middlewares) {
        if (middleware.pre) {
          await middleware.pre(context);
        }
      }

      // Execute task
      const result = await task.execute(context);
      context.set(`${task.id}_result`, result);

      // Execute post-middleware
      for (const middleware of this.middlewares) {
        if (middleware.post) {
          await middleware.post(context, result);
        }
      }

      return result;
    } catch (error) {
      if (attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.executeTask(task, context, attempt + 1);
      }
      throw error;
    }
  }

  private async executeDependencies(task: Task, context: Context): Promise<void> {
    const dependencies = await this.getDependencies(task, context);
    if (!dependencies.length) return;

    const dependencyPromises = dependencies.map(async (depId) => {
      const depTask = this.tasks.get(depId);
      if (!depTask) {
        throw new Error(`Dependency task ${depId} not found`);
      }
      return this.executeTask(depTask, context);
    });

    await Promise.all(dependencyPromises);
  }

  async execute(taskId: string, initialContext: Record<string, any> = {}): Promise<TaskResult> {
    const context = new Context(initialContext);
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    await this.executeDependencies(task, context);
    return this.executeTask(task, context);
  }

  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
}