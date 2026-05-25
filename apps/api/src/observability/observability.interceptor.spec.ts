import { ObservabilityLoggingInterceptor } from './observability.interceptor';
import { ObservabilityStoreService } from './observability.store';

describe('ObservabilityLoggingInterceptor', () => {
  let interceptor: ObservabilityLoggingInterceptor;
  let mockStore: jest.Mocked<ObservabilityStoreService>;

  beforeEach(() => {
    mockStore = {
      addLog: jest.fn(),
    } as any;
    interceptor = new ObservabilityLoggingInterceptor(mockStore);
  });

  describe('truncate', () => {
    it('should return primitive values unchanged', () => {
      expect((interceptor as any).truncate(null)).toBeNull();
      expect((interceptor as any).truncate(undefined)).toBeUndefined();
      expect((interceptor as any).truncate(123)).toBe(123);
      expect((interceptor as any).truncate('hello')).toBe('hello');
    });

    it('should return small objects unchanged', () => {
      const smallObj = { foo: 'bar', value: 42 };
      expect((interceptor as any).truncate(smallObj)).toEqual(smallObj);
    });

    it('should truncate large arrays safely and add metadata', () => {
      // Create an array with elements that will exceed the size limit
      const element = 'a'.repeat(500);
      const largeArray = Array.from({ length: 20 }, (_, idx) => ({ id: idx, val: element }));

      const result = (interceptor as any).truncate(largeArray);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThan(largeArray.length);

      const lastElement = result[result.length - 1];
      expect(lastElement).toBeDefined();
      expect(lastElement._info).toContain('Truncated');
      expect(lastElement._originalLength).toBe(largeArray.length);

      // Verify it is JSON-serializable and under length
      const serialized = JSON.stringify(result);
      expect(serialized.length).toBeLessThan(5000);
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it('should truncate large objects safely and add metadata', () => {
      const element = 'a'.repeat(500);
      const largeObj: Record<string, any> = {};
      for (let i = 0; i < 20; i++) {
        largeObj[`key_${i}`] = element;
      }

      const result = (interceptor as any).truncate(largeObj);

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      expect(result._info).toContain('Response body truncated');
      expect(result._originalLength).toBeGreaterThan(5000);

      // Verify it is JSON-serializable and under length
      const serialized = JSON.stringify(result);
      expect(serialized.length).toBeLessThan(5000);
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it('should handle circular references safely', () => {
      const circular: any = { foo: 'bar' };
      circular.self = circular;

      const result = (interceptor as any).truncate(circular);

      expect(result).toBeDefined();
      expect(result._error).toBe('Failed to serialize or truncate response body');
      expect(result.message).toContain('circular');
    });
  });
});
