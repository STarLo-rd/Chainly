import { Workflow } from '../workflow';
import { Context } from '../context';
import { Task, Middleware } from '../types';

describe('Workflow', () => {
  it('should execute a simple task', async () => {
    const workflow = new Workflow();
    
    const taskId = workflow.addTask({
      name: 'test-task',
      execute: async (context: Context) => {
        return 'success';
      }
    });

    const result = await workflow.execute(taskId);
    expect(result).toBe('success');
  });

  it('should handle task dependencies', async () => {
    const workflow = new Workflow();
    
    const dep1Id = workflow.addTask({
      name: 'dep-1',
      execute: async (context: Context) => {
        context.set('dep1Result', 'dep1');
        return 'dep1';
      }
    });

    const taskId = workflow.addTask({
      name: 'main-task',
      dependencies: [dep1Id],
      execute: async (context: Context) => {
        const dep1Result = context.get('dep1Result');
        return `main-${dep1Result}`;
      }
    });

    const result = await workflow.execute(taskId);
    expect(result).toBe('main-dep1');
  });

  it('should apply middleware', async () => {
    const middleware: Middleware = {
      pre: async (context: Context) => {
        context.set('middlewareRan', true);
      }
    };

    const workflow = new Workflow({ middlewares: [middleware] });
    
    const taskId = workflow.addTask({
      name: 'test-task',
      execute: async (context: Context) => {
        return context.get('middlewareRan');
      }
    });

    const result = await workflow.execute(taskId);
    expect(result).toBe(true);
  });
});