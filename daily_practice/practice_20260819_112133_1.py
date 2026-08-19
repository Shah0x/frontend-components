import time
import random
from functools import wraps

def retry(exceptions, tries=4, delay=1, backoff=2, jitter=True):
    """
    Retry calling the decorated function using an exponential backoff.
    
    exceptions: An exception or a tuple of exceptions to catch.
    tries: Maximum number of times to try.
    delay: Initial delay between retries in seconds.
    backoff: Multiplier applied to delay on each retry.
    jitter: Introduces randomness to prevent thundering herd problem.
    """
    # TODO: Add a max_delay argument so it doesn't backoff infinitely if tries is high
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    # msg = f"[DEBUG] {func.__name__} failed with: {e}. Retrying in {mdelay}s..."
                    # print(msg)
                    
                    actual_delay = mdelay
                    if jitter:
                        # Quick and dirty jitter - maybe use full jitter formula later?
                        # Refactor note: random.uniform might be too volatile for production
                        actual_delay *= random.uniform(0.5, 1.5)
                    
                    time.sleep(actual_delay)
                    mtries -= 1
                    mdelay *= backoff
                    
                    # FIXME: if delay gets too high, we should cap it. 
                    # e.g., mdelay = min(mdelay, max_delay)
            
            # Last attempt outside the loop so it bubbles up the error naturally if it still fails
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Local manual test to verify behavior
if __name__ == "__main__":
    import urllib.request
    from urllib.error import URLError

    @retry(URLError, tries=3, delay=0.5, backoff=2)
    def fetch_flaky_url(url):
        # Intentional bad domain to trigger URLError
        # print(f"Fetching {url}...")
        return urllib.request.urlopen(url).read()

    try:
        # This will fail, but we should see it try 3 times before throwing
        fetch_flaky_url("http://this-does-not-exist-at-all-12345.com")
    except URLError as ex:
        print(f"Captured expected failure after retries: {ex}")