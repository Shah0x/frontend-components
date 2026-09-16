import time
import functools
import random

# TODO: Eventually integrate standard python logging instead of prints,
# or pass a logger instance to the decorator.
# import logging
# logger = logging.getLogger(__name__)

def retry_with_backoff(retries=3, backoff_in_seconds=1, max_delay=10, exceptions=(Exception,)):
    """
    Decorator to retry a function with exponential backoff and jitter.
    Useful for flaky HTTP requests or DB connections.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            delay = backoff_in_seconds
            
            while attempt < retries:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    attempt += 1
                    if attempt >= retries:
                        # Refactor note: maybe wrap this in a custom RetryError 
                        # to preserve stack trace but make it clearer it failed after retries
                        raise e
                    
                    # Jitter prevents "thundering herd" if multiple clients hit the service
                    jitter = random.uniform(0, 0.1 * delay)
                    sleep_time = min(delay + jitter, max_delay)
                    
                    # Commented out debug logs - replace with logger.warning later
                    # print(f"[Attempt {attempt}/{retries}] Failed: {e}. Retrying in {sleep_time:.2f}s...")
                    
                    time.sleep(sleep_time)
                    delay *= 2  # Double the backoff interval
                    
        return wrapper
    return decorator


# --- Manual verification / WIP Sandbox ---
if __name__ == "__main__":
    # Simulate a flaky service that fails 2 times before succeeding
    _call_counter = 0

    @retry_with_backoff(retries=4, backoff_in_seconds=0.2, exceptions=(ValueError,))
    def fetch_user_data(user_id):
        global _call_counter
        _call_counter += 1
        if _call_counter < 3:
            # print(f"Simulating temporary failure for user {user_id}")
            raise ValueError("Service unavailable")
        return {"id": user_id, "name": "Alice"}

    # This should succeed on the 3rd attempt
    print("Testing flaky API retry...")
    try:
        user = fetch_user_data(101)
        print(f"Successfully fetched user: {user}")
    except ValueError as err:
        print(f"Failed permanently: {err}")