import time
import random
from functools import wraps

def retry(exceptions, tries=4, delay=1, backoff=2, jitter=True):
    """
    Retry calling the decorated function using an exponential backoff.
    
    Args:
        exceptions: An exception or a tuple of exceptions to catch.
        tries: Max number of times to try.
        delay: Initial delay between retries in seconds.
        backoff: Multiplier applied to delay after each retry.
        jitter: If True, adds random variation to delay.
    """
    # TODO: We should probably use standard logging instead of prints, 
    # but leaving this here for quick debugging in dev.
    
    # Ensure exceptions is a tuple
    if not isinstance(exceptions, tuple):
        exceptions = (exceptions,)

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            _tries, _delay = tries, delay
            while _tries > 1:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    # dev_log: print(f"[DEBUG] Caught {e.__class__.__name__}: {e}. Retrying...")
                    
                    sleep_time = _delay
                    if jitter:
                        # Add some random jitter to prevent thundering herd
                        sleep_time += random.uniform(0, 0.5)
                    
                    time.sleep(sleep_time)
                    _tries -= 1
                    _delay *= backoff
                    
                    # Refactor Note: Maybe we should expose the current attempt count?
                    # For now, just keep it simple.
            
            # Last try without catching exceptions so it raises naturally if it still fails
            return func(*args, **kwargs)
        return wrapper
    return decorator


# --- Test / Usage Practice ---

class ServiceUnavailable(Exception):
    pass

attempts = 0

@retry(ServiceUnavailable, tries=3, delay=0.1)
def fetch_api_data():
    global attempts
    attempts += 1
    if attempts < 3:
        # print(f"Attempt {attempts} failed...")
        raise ServiceUnavailable("Temporary 503 error")
    return {"status": "ok", "data": [109, 201, 333]}

if __name__ == "__main__":
    print("Simulating flaky API call:")
    try:
        res = fetch_api_data()
        print(f"Success! Result: {res}")
    except ServiceUnavailable as err:
        print(f"Failed permanently: {err}")