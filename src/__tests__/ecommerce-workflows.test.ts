import { Workflow } from '../workflow';
import { Context } from '../context';

interface Order {
  id: string;
  items: Array<{ id: string; quantity: number; price: number }>;
  userId: string;
  shippingAddress: string;
}

interface InventoryStatus {
  itemId: string;
  available: boolean;
}

interface PaymentResult {
  paymentId: string;
  amount: number;
  status: 'success' | 'failed';
  attempts?: number;
}

describe('E-commerce Order Processing Workflow', () => {
  let workflow: Workflow;
  const mockOrder: Order = {
    id: 'order-123',
    items: [
      { id: 'item1', quantity: 2, price: 100 },
      { id: 'item2', quantity: 1, price: 50 }
    ],
    userId: 'user-123',
    shippingAddress: '123 Main St'
  };

  beforeEach(() => {
    workflow = new Workflow({
      maxRetries: 3,
      retryDelay: 100
    });
  });

  test('complete order processing workflow', async () => {
    // Mock inventory check
    const checkInventoryId = workflow.addTask({
      name: 'check-inventory',
      condition: (ctx) => Boolean(ctx.get('order')),
      execute: async (ctx) => {
        const order = ctx.getRequired<Order>('order');
        // Simulate inventory check
        const inventoryStatus: InventoryStatus[] = order.items.map(item => ({
          itemId: item.id,
          available: true
        }));
        return inventoryStatus;
      }
    });

    // Payment processing
    const processPaymentId = workflow.addTask({
      name: 'process-payment',
      dependencies: [checkInventoryId],
      execute: async (ctx) => {
        const order = ctx.getRequired<Order>('order');
        const totalAmount = order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        
        // Simulate payment processing
        const result: PaymentResult = {
          paymentId: 'pay-123',
          amount: totalAmount,
          status: 'success'
        };
        return result;
      }
    });

    // Order fulfillment
    const fulfillOrderId = workflow.addTask({
      name: 'fulfill-order',
      dependencies: (ctx) => {
        const paymentResult = ctx.get<PaymentResult>(`${processPaymentId}_result`);
        return paymentResult?.status === 'success' ? [processPaymentId] : [];
      },
      execute: async (ctx) => {
        const order = ctx.getRequired<Order>('order');
        // Simulate order fulfillment
        return {
          fulfillmentId: 'ful-123',
          status: 'processing',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
      }
    });

    // Notification task
    const sendNotificationId = workflow.addTask({
      name: 'send-notification',
      dependencies: [fulfillOrderId],
      execute: async (ctx) => {
        const order = ctx.getRequired<Order>('order');
        const fulfillment = ctx.get(`${fulfillOrderId}_result`);
        
        // Simulate sending notification
        return {
          notificationId: 'not-123',
          type: 'ORDER_CONFIRMED',
          recipient: order.userId,
          status: 'sent'
        };
      }
    });

    // Execute the workflow
    const result = await workflow.execute(sendNotificationId, {
      order: mockOrder
    });

    // Verify the complete workflow execution
    expect(result).toEqual({
      notificationId: 'not-123',
      type: 'ORDER_CONFIRMED',
      recipient: 'user-123',
      status: 'sent'
    });
  });

  test('should handle failed inventory check', async () => {
    const checkInventoryId = workflow.addTask({
      name: 'check-inventory',
      execute: async () => {
        return [{ itemId: 'item1', available: false }] as InventoryStatus[];
      }
    });

    const processPaymentId = workflow.addTask({
      name: 'process-payment',
      dependencies: [checkInventoryId],
      condition: (ctx) => {
        const inventoryStatus = ctx.getRequired<InventoryStatus[]>(`${checkInventoryId}_result`);
        return inventoryStatus.every(item => item.available);
      },
      execute: async () => {
        // This should not execute due to condition
        return { status: 'success' } as PaymentResult;
      }
    });

    const result = await workflow.execute(processPaymentId, {
      order: mockOrder
    });

    expect(result).toBeNull(); // Payment should be skipped due to failed inventory check
  });

  test('should handle payment failure with retries', async () => {
    let attempts = 0;
    
    const processPaymentId = workflow.addTask({
      name: 'process-payment',
      execute: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Payment service unavailable');
        }
        return {
          paymentId: 'pay-123',
          amount: 100,
          status: 'success',
          attempts
        } as PaymentResult;
      }
    });

    const result = await workflow.execute(processPaymentId, {
      order: mockOrder
    });

    expect(result.attempts).toBe(3);
    expect(result.status).toBe('success');
  });
});