// TODO: Add fallback for browsers that don't support IntersectionObserver (IE11, etc. - though mostly dead now)
// Refactor note: Should we allow a custom callback when the element becomes visible?

export function lazyLoad(selectorOrElements, options = {}) {
  const defaultOptions = {
    root: null, // defaults to viewport
    rootMargin: '0px 0px 200px 0px', // start loading 200px before they enter viewport
    threshold: 0.01
  };

  const config = Object.assign({}, defaultOptions, options);

  // Helper to handle elements passed as string selector or Direct NodeList/Array
  let elements;
  if (typeof selectorOrElements === 'string') {
    elements = document.querySelectorAll(selectorOrElements);
  } else if (selectorOrElements instanceof NodeList) {
    elements = Array.from(selectorOrElements);
  } else if (Array.isArray(selectorOrElements)) {
    elements = selectorOrElements;
  } else if (selectorOrElements instanceof HTMLElement) {
    elements = [selectorOrElements];
  } else {
    console.warn('Invalid elements passed to lazyLoad:', selectorOrElements);
    return;
  }

  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        
        // Debugging load triggers
        // console.log('Lazy loading element:', target);

        const src = target.getAttribute('data-src');
        const srcset = target.getAttribute('data-srcset');

        if (target.tagName === 'IMG') {
          if (src) target.src = src;
          if (srcset) target.srcset = srcset;
        } else {
          // Fallback for divs with background images
          const bgImage = target.getAttribute('data-bg');
          if (bgImage) {
            target.style.backgroundImage = `url(${bgImage})`;
          }
        }

        // Once loaded, we don't need to observe this anymore
        self.unobserve(target);
        
        // Custom event so parent components can listen to 'loaded'
        target.dispatchEvent(new CustomEvent('lazy-loaded', { bubbles: true }));
      }
    });
  }, config);

  elements.forEach(el => observer.observe(el));

  // Return destroy method in case we need to clean up early (e.g. SPAs on route change)
  return function destroy() {
    // FIXME: This might throw if elements are already garbage collected?
    elements.forEach(el => observer.unobserve(el));
    observer.disconnect();
  };
}