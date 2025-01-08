import { Context } from './context';
export type EventPayload = Record<string, any>;
export type EventHandler = (payload: EventPayload) => Promise<void>;


export type TaskResult = any;

export interface Task {
  id: string;
  name: string;
  execute: (context: Context) => Promise<TaskResult>;
  dependencies?: string[] | ((context: Context) => string[]);
  condition?: (context: Context) => boolean | Promise<boolean>;
  triggers?: string[]; // Event names that can trigger this task
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

export interface EventEmitter {
  emit(eventName: string, payload: EventPayload): void;
  on(eventName: string, handler: EventHandler): void;
  off(eventName: string, handler: EventHandler): void;
}