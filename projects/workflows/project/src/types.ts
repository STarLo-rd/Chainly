import { Context } from './context';

export type TaskResult = any;

export interface Task {
  id: string;
  name: string;
  execute: (context: Context) => Promise<TaskResult>;
  dependencies?: string[];
}

export interface Middleware {
  pre?: (context: Context) => Promise<void>;
  post?: (context: Context, result: TaskResult) => Promise<void>;
}

export interface WorkflowOptions {
  middlewares?: Middleware[];
  maxRetries?: number;
  retryDelay?: number;
}