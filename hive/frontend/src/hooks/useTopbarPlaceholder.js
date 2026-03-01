class TopbarPlaceholder {
  listeners = new Set();
  content = null;

  // Subscribe for changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update content and notify subscribers
  setContent(content) {
    this.content = content;
    this.listeners.forEach((listener) => listener(content));
  }

  getContent() {
    return this.content;
  }
}

export const useTopbarPlaceholder = new TopbarPlaceholder();
