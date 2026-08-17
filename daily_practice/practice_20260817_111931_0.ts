interface WatchOptions extends IntersectionObserverInit {
  once?: boolean;
}

// TODO: Should we support an array of elements here? Or just keep it simple with one element per call?
export function watchIntersection(
  target: Element | string,
  callback: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void,
  options: WatchOptions = {}
): () => void {
  const { once = false, ...observerOptions } = options;

  let element: Element | null = null;
  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else {
    element = target;
  }

  if (!element) {
    console.warn(`[watchIntersection] Target element not found:`, target);
    // Return a no-op cleanup function so it doesn't crash the caller
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // console.log('[debug] intersection ratio:', entry.intersectionRatio); // remove before merging
      
      callback(entry.isIntersecting, entry);

      if (entry.isIntersecting && once) {
        // Safe to use non-null assertion here since element is verified above, 
        // but maybe refactor this later to avoid the '!'
        observer.unobserve(element!);
        observer.disconnect();
      }
    });
  }, observerOptions);

  observer.observe(element);

  // Return unsubscribe/cleanup function
  return () => {
    if (element) {
      observer.unobserve(element);
    }
    observer.disconnect();
  };
}

// FIXME: Writing a quick manual test below, delete this block before PR!
/*
const cleanup = watchIntersection('#hero-section', (visible) => {
  if (visible) {
    document.body.classList.add('hero-active');
  } else {
    document.body.classList.remove('hero-active');
  }
}, { threshold: 0.25 });
*/