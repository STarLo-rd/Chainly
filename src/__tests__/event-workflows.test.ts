import { Workflow } from '../workflow';

describe('Event-Driven Workflow', () => {
  let workflow: Workflow;

  beforeEach(() => {
    workflow = new Workflow();
  });

  test('should execute task when triggered by event', async () => {
    const results: string[] = [];

    // Create a task that listens for events
    const taskId = workflow.addTask({
      name: 'event-driven-task',
      triggers: ['user.created'],
      execute: async (context) => {
        const payload = context.getRequired<Record<string, any>>('eventPayload');
        results.push(`Processed user: ${payload.userId}`);
        return { processed: true };
      }
    });

    // Emit event
    workflow.emit('user.created', { userId: '123' });

    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(results).toContain('Processed user: 123');
  });

  test('should handle multiple event handlers', async () => {
    const notifications: string[] = [];

    // Task 1: Send email notification
    workflow.addTask({
      name: 'send-email',
      triggers: ['order.created'],
      execute: async (context) => {
        const payload = context.getRequired<Record<string, any>>('eventPayload');
        notifications.push(`Email sent for order: ${payload.orderId}`);
        return { sent: true };
      }
    });

    // Task 2: Send SMS notification
    workflow.addTask({
      name: 'send-sms',
      triggers: ['order.created'],
      execute: async (context) => {
        const payload = context.getRequired<Record<string, any>>('eventPayload');
        notifications.push(`SMS sent for order: ${payload.orderId}`);
        return { sent: true };
      }
    });

    // Emit order.created event
    workflow.emit('order.created', { orderId: 'ORDER-123' });

    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(notifications).toContain('Email sent for order: ORDER-123');
    expect(notifications).toContain('SMS sent for order: ORDER-123');
  });

  test('should handle conditional event-driven execution', async () => {
    const logs: string[] = [];

    // Create a task that only processes high-priority events
    workflow.addTask({
      name: 'process-priority',
      triggers: ['notification'],
      condition: (context) => {
        const payload = context.getRequired<Record<string, any>>('eventPayload');
        return payload.priority === 'high';
      },
      execute: async (context) => {
        const payload = context.getRequired<Record<string, any>>('eventPayload');
        logs.push(`Processed ${payload.type} notification`);
        return { processed: true };
      }
    });

    // Emit low priority event (should be skipped)
    workflow.emit('notification', { type: 'info', priority: 'low' });

    // Emit high priority event (should be processed)
    workflow.emit('notification', { type: 'alert', priority: 'high' });

    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(logs).not.toContain('Processed info notification');
    expect(logs).toContain('Processed alert notification');
  });
});