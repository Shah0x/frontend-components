interface WatchVisibilityOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

type VisibilityCallback = (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;

/**
 * Utility to track when an element enters or leaves the viewport.
 * Useful for lazy loading, infinite scroll, or triggering animations.
 */
export function watchVisibility(
  element: HTMLElement | null,
  callback: VisibilityCallback,
  options: WatchVisibilityOptions = {}
): () => void {
  // Guard for SSR environments or null refs in React/Vue
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    console.warn('IntersectionObserver is not supported in this environment.');
    return () => {};
  }

  if (!element) {
    // TODO: Should we throw an error here instead? 
    // Right now just silently failing because React refs might be null on initial render.
    console.warn('watchVisibility was called with a null element.');
    return () => {};
  }

  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;

  let hasTriggered = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // NOTE: entry.isIntersecting has some edge cases on older browsers, 
      // but modern ones are fine.
      const isIntersecting = entry.isIntersecting;

      // dev debug helper
      // console.log(`[watchVisibility] element:`, entry.target, `isIntersecting:`, isIntersecting);

      callback(isIntersecting, entry);

      if (isIntersecting && triggerOnce && !hasTriggered) {
        hasTriggered = true;
        cleanup();
      }
    });
  }, {
    threshold,
    rootMargin
  });

  observer.observe(element);

  function cleanup() {
    // FIXME: calling unobserve after disconnect is redundant but safe. 
    // Need to check if this causes issues in older Safari.
    if (element) {
      observer.unobserve(element);
    }
    observer.disconnect();
  }

  // Return the cleanup function so the caller can unbind
  return cleanup;
}

// Quick manual test/example usage:
/*
const myTarget = document.querySelector('#lazy-image') as HTMLElement;
const stopWatching = watchVisibility(myTarget, (visible) => {
  if (visible) {
    console.log('Element is visible, load the image!');
    stopWatching(); // or use triggerOnce: true
  }
}, { triggerOnce: true, rootMargin: '100px' });
*/