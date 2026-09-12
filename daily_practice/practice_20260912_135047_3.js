// LRU Cache Implementation
// JS Map keeps track of insertion order, which is super handy here.
// But is it "cheating" for an interview? Yes, probably. 

class LRUCache {
  constructor(capacity) {
    if (typeof capacity !== 'number' || capacity <= 0) {
      throw new Error('Capacity must be a positive number');
    }
    this.capacity = capacity;
    this.cache = new Map();
  }

  /** 
   * @param {number} key
   * @return {number}
   */
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }
    
    // To mark as recently used, we delete and re-insert
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    
    // console.log(`[DEBUG] Get key: ${key}, cache state:`, Array.from(this.cache.keys()));
    return val;
  }

  /** 
   * @param {number} key 
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    if (this.cache.has(key)) {
      // Delete old position so it goes to the end on set()
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Map.keys().next().value gets the first (least recently used) item
      // Note: next() is O(1) in V8, but feels a bit hacky.
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, value);
  }
}

// TODO: Implement this again tomorrow using a manual Doubly Linked List + Object map.
// Some interviewers might reject the Map.keys().next().value approach.

// --- Quick manual verification ---
const lru = new LRUCache(2);
lru.put(1, 1);
lru.put(2, 2);
if (lru.get(1) !== 1) console.error('Test failed: key 1 should be 1');

lru.put(3, 3); // evicts key 2
if (lru.get(2) !== -1) console.error('Test failed: key 2 should have been evicted');

lru.put(4, 4); // evicts key 1
if (lru.get(1) !== -1) console.error('Test failed: key 1 should have been evicted');
if (lru.get(3) !== 3) console.error('Test failed: key 3 should be 3');
if (lru.get(4) !== 4) console.error('Test failed: key 4 should be 4');

console.log('Daily LRU practice checks completed!');