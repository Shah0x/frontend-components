type Listener<T = any> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  // TODO: Add max listeners warning to prevent memory leaks if we scale this
  // private maxListeners = 15;

  /**
   * Subscribe to an event. Returns an unsubscribe function for easy cleanup.
   */
  on<T = any>(event: string, callback: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    // Explicit cast needed here to satisfy compiler on generic Set mismatch
    const eventSet = this.listeners.get(event) as Set<Listener<T>>;
    eventSet.add(callback);

    // inline refactoring note: this return fn is way cleaner than calling .off() manually in useEffects
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe a listener from an event
   */
  off<T = any>(event: string, callback: Listener<T>): void {
    const eventSet = this.listeners.get(event);
    if (eventSet) {
      eventSet.delete(callback);
      if (eventSet.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event with optional payload
   */
  emit<T = any>(event: string, data?: T): void {
    const eventSet = this.listeners.get(event);

    // Commented out to reduce noise in dev console, uncomment if events are misfiring
    // console.log(`[EventBus] emit -> "${event}" with payload:`, data);

    if (eventSet) {
      // Shallow copy to prevent infinite loops if a listener triggers another subscribe/unsubscribe
      const currentListeners = Array.from(eventSet);
      
      currentListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          // Don't let one bad listener crash the whole emitter chain
          console.error(`[EventBus] Error in listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Purge everything. Useful for resetting test environments.
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Export a singleton instance for global app usage, but keep the class exported for testing
export const globalBus = new EventBus();