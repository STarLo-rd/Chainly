import { Context } from '../context';

describe('Context', () => {
  let context: Context;

  beforeEach(() => {
    context = new Context({ initial: 'value' });
  });

  test('should set and get values', () => {
    context.set('key', 'value');
    expect(context.get('key')).toBe('value');
  });

  test('should handle initial data', () => {
    expect(context.get('initial')).toBe('value');
  });

  test('should check if key exists', () => {
    expect(context.has('initial')).toBe(true);
    expect(context.has('nonexistent')).toBe(false);
  });

  test('should throw error for required missing key', () => {
    expect(() => context.getRequired('missing')).toThrow();
  });

  test('should merge contexts', () => {
    const other = new Context({ other: 'value' });
    context.merge(other);
    expect(context.get('other')).toBe('value');
  });
});