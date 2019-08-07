export default class WeakMapCache {
  constructor(enabled) {
    this.enabled = enabled;
    this.cache = {};
  }

  fetch(path, handler, fn) {
    if (!this.enabled) return fn();

    if (!(path in this.cache)) {
      this.cache[path] = new WeakMap;
    }

    let cached = this.cache[path].get(handler);
    if (!cached) {
      cached = fn();
      this.cache[path].set(handler, cached);
    }
    return cached;
  }
}
