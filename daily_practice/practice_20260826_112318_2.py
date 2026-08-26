import time
import random
from functools import wraps

# TODO: Replace print statement logging with standard logging module once integrated into main project.
# FIXME: Should probably let user specify which exception classes to catch instead of catching all Exception subclasses.

def retry_with_backoff(max_attempts=3, initial_delay=1.0, backoff_factor=2.0, jitter=True):
    """
    Decorator to retry a function call with exponential backoff.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            delay = initial_delay
            
            while attempts < max_attempts:
                try:
                    # Commented out verbose debug log to clean up terminal during tests
                    # print(f"[DEBUG] Attempt {attempts + 1} of {max_attempts} for {func.__name__}")
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts >= max_attempts:
                        # Re-raise the final exception if we run out of attempts
                        raise e
                    
                    # Calculate sleep time with optional jitter
                    sleep_time = delay
                    if jitter:
                        # Add a random variance of up to 20% to prevent thundering herd problem
                        sleep_time += random.uniform(0, 0.2 * delay)
                    
                    # print(f"[WARN] {func.__name__} failed with: {e}. Retrying in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    
                    # Increase delay for next round
                    delay *= backoff_factor
                    
        return wrapper
    return decorator


# --- Quick local manual testing playground ---
# @retry_with_backoff(max_attempts=4, initial_delay=0.5)
# def fetch_unstable_data():
#     if random.random() < 0.7:
#         raise ConnectionError("Simulated network blip!")
#     return {"status": "ok", "data": [1, 2, 3]}
#
# if __name__ == "__main__":
#     try:
#         print("Testing unstable function...")
#         result = fetch_unstable_data()
#         print(f"Result: {result}")
#     except Exception as err:
#         print(f"Failed permanently: {err}")