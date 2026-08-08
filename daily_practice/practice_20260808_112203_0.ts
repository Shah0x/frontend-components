import { useState, useEffect, useCallback } from 'react';

// TODO: Handle SSR. Right now this breaks if window is undefined on server render.
// Need to add a check like: typeof window !== 'undefined'
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // We need to dispatch a custom event so other instances of this hook on the SAME page also update
      // (The standard 'storage' event only fires in other tabs/windows!)
      // FIXME: Might be cleaner to use a custom event class with detail payload to avoid re-reading from disk
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      // If it's a standard storage event from another tab, check if key matches
      if (e instanceof StorageEvent && e.key !== key) {
        return;
      }
      
      try {
        const item = window.localStorage.getItem(key);
        // console.log(`[useLocalStorage] sync triggered for ${key}:`, item); // temporary debug log
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch (err) {
        console.error("Failed to sync storage event", err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}