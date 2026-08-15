// TODO: Switch to Map for in-memory cache if sessionStorage is too slow/restricted
const cache = {
  get(key) {
    try {
      const item = sessionStorage.getItem(`search_cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn('Cache read failed:', e);
      return null;
    }
  },
  set(key, data) {
    try {
      sessionStorage.setItem(`search_cache_${key}`, JSON.stringify(data));
    } catch (e) {
      // Quota exceeded is common, maybe prune old keys?
      console.warn('Cache write failed:', e);
    }
  }
};

export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// FIXME: This currently pollutes global scope if imported directly in some old test setups. 
// Need to wrap in a class or factory function later?
export async function fetchSearchResults(query, endpoint = '/api/search') {
  if (!query || query.trim() === '') {
    return [];
  }

  const cacheKey = query.trim().toLowerCase();
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    // console.log(`[Cache Hit] returning data for: ${cacheKey}`);
    return cachedData;
  }

  try {
    // URLSearchParams is cleaner than manual string interpolation, refactored this yesterday
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${endpoint}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Search fetch failed:', error);
    // TODO: Should we return last cached result or propagate error? 
    // For now, just return empty array so UI doesn't crash.
    return [];
  }
}