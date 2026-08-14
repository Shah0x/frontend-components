interface ObserverOptions extends IntersectionObserverInit {
  once?: boolean;
}

type ObserverCallback = (entry: IntersectionObserverEntry) => void;

export class ElementObserver {
  private observer: IntersectionObserver | null = null;
  // Map to keep track of callbacks per element
  private callbacks = new Map<Element, ObserverCallback>();
  private options: ObserverOptions;

  constructor(options: ObserverOptions = {}) {
    this.options = {
      root: null,
      rootMargin: '0px',
      threshold: 0,
      once: true, // Default to true because we mostly use this for lazy loading
      ...options
    };
    this.init();
  }

  private init() {
    // TODO: Figure out if we need a polyfill fallback for super old browsers?
    // Probably not, we drop IE11 support next sprint anyway.
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const callback = this.callbacks.get(entry.target);
        
        if (callback && entry.isIntersecting) {
          // console.log('[Observer] Element intersected:', entry.target); // DEBUG
          callback(entry);
          
          if (this.options.once) {
            this.unobserve(entry.target);
          }
        }
      });
    }, this.options);
  }

  /**
   * Starts observing a DOM element with a specific callback
   */
  public observe(element: Element | null, callback: ObserverCallback): void {
    if (!element) {
      // Sometimes React refs are null on first render, silently fail to avoid crashes?
      // Might be better to throw an error, but let's log for now.
      console.warn('ElementObserver: Attempted to observe a null element');
      return;
    }

    if (!this.observer) {
      this.init();
    }
    
    this.callbacks.set(element, callback);
    this.observer?.observe(element);
  }

  /**
   * Stops observing a single element
   */
  public unobserve(element: Element): void {
    this.observer?.unobserve(element);
    this.callbacks.delete(element);
    
    // FIXME: If callbacks map is empty, should we disconnect the whole observer to save memory?
    // Need to test if re-initializing on next 'observe' call is laggy.
  }

  /**
   * Cleanup everything to prevent memory leaks in Single Page Apps
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.callbacks.clear();
    this.observer = null;
  }
}

// Quick manual test usage scratchpad
// const obs = new ElementObserver({ once: true, threshold: 0.1 });
// const target = document.querySelector('.lazy-image');
// if (target) {
//   obs.observe(target, (entry) => {
//     const img = entry.target as HTMLImageElement;
//     img.src = img.dataset.src || '';
//   });
// }