export class Context {
  private data: Map<string, any> = new Map();

  constructor(initialData: Record<string, any> = {}) {
    Object.entries(initialData).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.data.get(key) as T;
  }

  getRequired<T>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Required context key "${key}" not found`);
    }
    return value;
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  merge(context: Context): void {
    context.data.forEach((value, key) => {
      this.set(key, value);
    });
  }
}