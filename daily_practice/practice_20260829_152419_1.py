import time
from typing import List, Dict, Any, Callable

# TODO: Replace with a proper logging library later, print statements are temporary
# import logging
# logger = logging.getLogger(__name__)

class BatchProcessor:
    def __init__(self, batch_size: int = 10, max_retries: int = 3):
        self.batch_size = batch_size
        self.max_retries = max_retries

    def process_all(self, items: List[Any], worker_fn: Callable[[List[Any]], Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Processes items in batches. Retries individual batches if they fail.
        """
        results = []
        for i in range(0, len(items), self.batch_size):
            batch = items[i:i + self.batch_size]
            # print(f"[DEBUG] Processing batch {i // self.batch_size + 1}, size: {len(batch)}")
            
            success = False
            attempts = 0
            while not success and attempts < self.max_retries:
                try:
                    # Call the external API/worker
                    batch_res = worker_fn(batch)
                    results.append(batch_res)
                    success = True
                except Exception as e:
                    attempts += 1
                    print(f"Error processing batch (attempt {attempts}/{self.max_retries}): {e}")
                    # Refactor Note: Should we use exponential backoff here instead of simple sleep?
                    # TODO: implement exponential backoff formula
                    time.sleep(1 * attempts) 
            
            if not success:
                # Decide: raise exception or append failure placeholder?
                # For now, let's raise so we don't silently lose data.
                raise RuntimeError(f"Failed to process batch starting at index {i} after {self.max_retries} attempts.")
        
        return results

# --- Quick Manual Test ---
if __name__ == "__main__":
    # Mock worker that occasionally fails to simulate network issues
    import random
    random.seed(42) # determinism for local testing
    
    def mock_api_call(batch: List[int]) -> Dict[str, Any]:
        if random.random() < 0.3:
            raise ConnectionError("API Timeout!")
        return {"processed_count": len(batch), "data": [x * 2 for x in batch]}

    data = list(range(1, 35)) # 35 items -> batches of 10, 10, 10, 5
    processor = BatchProcessor(batch_size=10, max_retries=3)
    
    try:
        output = processor.process_all(data, mock_api_call)
        print("Successfully processed all batches!")
        print(output)
    except RuntimeError as err:
        print(f"Batch processing failed fatally: {err}")