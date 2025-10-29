import { useCallback, useEffect, useRef, useState } from "react";

type SetValue<T> = (value: T | ((val: T) => T)) => void;

// Generic localStorage hook with SSR safety and great APIs!
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, () => void] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // Store current value in a ref to avoid unnecessary renders
  const valueRef = useRef<T>(readValue());
  const updateValueRef = useRef<() => void>(() => {});

  // Setup a forceUpdate function to re-render hook consumers
  const [, setState] = useState(0);
  const forceUpdate = useCallback(() => setState((v) => v + 1), []);

  // Wrap setter function
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        const newValue =
          value instanceof Function ? value(valueRef.current) : value;

        window.localStorage.setItem(key, JSON.stringify(newValue));
        valueRef.current = newValue;
        forceUpdate();
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, forceUpdate]
  );

  // Remove the value entirely
  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      valueRef.current = initialValue;
      forceUpdate();
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, forceUpdate]);

  // Listen to storage events (cross-tab)
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) {
        valueRef.current = readValue();
        forceUpdate();
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, readValue]);

  // Expose APIs: value, setValue, remove
  return [valueRef.current, setValue, remove];
}
