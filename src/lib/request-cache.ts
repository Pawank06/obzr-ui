// Simple request deduplication cache
class RequestCache {
  private cache = new Map<string, Promise<unknown>>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>, ttl = 1000): Promise<T> {
    // If request is already in flight, return the existing promise
    if (this.cache.has(key)) {
      return this.cache.get(key)! as Promise<T>;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.cache.delete(key);
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(key);
      }
    });

    // Cache the promise
    this.cache.set(key, promise);

    // Set TTL cleanup
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
    }, ttl);
    this.timeouts.set(key, timeout);

    return promise;
  }

  clear() {
    this.cache.clear();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

export const requestCache = new RequestCache();
