import { v4 as uuidv4 } from 'uuid';
import { Context } from './context';
import { Task, Middleware, WorkflowOptions, TaskResult } from './types';

export class Workflow {
  private tasks: Map<string, Task> = new Map();
  private middlewares: Middleware[] = [];
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: WorkflowOptions = {}) {
    this.middlewares = options.middlewares || [];
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  addTask(task: Omit<Task, 'id'>): string {
    const id = uuidv4();
    this.tasks.set(id, { ...task, id });
    return id;
  }

  private async executeTask(
    task: Task,
    context: Context,
    attempt: number = 1
  ): Promise<TaskResult> {
    try {
      // Execute pre-middleware
      for (const middleware of this.middlewares) {
        if (middleware.pre) {
          await middleware.pre(context);
        }
      }

      // Execute task
      const result = await task.execute(context);

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
    if (!task.dependencies?.length) return;

    const dependencyPromises = task.dependencies.map(async (depId) => {
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