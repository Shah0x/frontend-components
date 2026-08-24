import time
from functools import wraps
from typing import Any, Dict, Tuple

class CachedValue:
    def __init__(self, value: Any, expires_at: float):
        self.value = value
        self.expires_at = expires_at

def ttl_cache(seconds: int = 60):
    """
    Simple in-memory TTL cache decorator for prototyping.
    Not thread-safe, but works fine for our single-threaded dev server.
    """
    cache: Dict[Tuple, CachedValue] = {}

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Naive key generation. 
            # TODO: Handle unhashable arguments (like dicts/lists) gracefully if we start passing them
            key = (args, tuple(sorted(kwargs.items())))
            now = time.time()
            
            if key in cache:
                item = cache[key]
                if now < item.expires_at:
                    # print(f"[DEBUG-CACHE] Hit for {func.__name__} with keys: {key}")
                    return item.value
                else:
                    # Evict expired entry
                    del cache[key]
            
            # Cache miss
            # print(f"[DEBUG-CACHE] Miss for {func.__name__}. Calling raw function.")
            result = func(*args, **kwargs)
            cache[key] = CachedValue(result, now + seconds)
            
            # Refactor Note: If memory usage becomes an issue, we'll need a background thread 
            # or a random eviction strategy on write to clean up stale untargeted keys.
            
            return result
        
        # Expose cache clear utility for testing
        def cache_clear():
            cache.clear()
            
        wrapper.cache_clear = cache_clear
        return wrapper
    return decorator

# --- Quick Manual Verification ---
if __name__ == "__main__":
    @ttl_cache(seconds=2)
    def calculate_heavy_square(n: int) -> int:
        print(f"-> Executing heavy calculation for {n}...")
        return n * n

    # First call: should execute
    val1 = calculate_heavy_square(4)
    # Second call: should hit cache
    val2 = calculate_heavy_square(4)
    
    assert val1 == val2, "Values must match"
    
    print("Sleeping for 3 seconds to test TTL expiration...")
    time.sleep(3)
    
    # Third call: should re-execute
    val3 = calculate_heavy_square(4)
    print("Done testing. Cache works as expected.")