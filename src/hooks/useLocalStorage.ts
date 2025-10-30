"use client";

import { useState, useEffect, useCallback } from "react";

type SetValue<T> = (value: T | ((val: T) => T)) => void;

// Custom event to broadcast storage changes within the same tab
const IN_APP_STORAGE_EVENT = "onLocalStorageChange";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, () => void] {
  // A function to read the value from localStorage
  const readValue = useCallback((): T => {
    // Prevent SSR errors
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

  // Use useState, initializing with the value from localStorage
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // This is the setter function that components will use
  const setValue: SetValue<T> = useCallback(
    (value) => {
      // Prevent SSR errors
      if (typeof window === "undefined") {
        console.warn("Tried to set localStorage on the server");
        return;
      }

      try {
        // Allow value to be a function, just like a useState setter
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(newValue));
        // Save to state
        setStoredValue(newValue);

        // Dispatch a custom event to notify other hooks *in the same tab*
        window.dispatchEvent(
          new CustomEvent(IN_APP_STORAGE_EVENT, { detail: { key, newValue } })
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // This is the remove function
  const remove = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      window.dispatchEvent(
        new CustomEvent(IN_APP_STORAGE_EVENT, {
          detail: { key, newValue: initialValue },
        })
      );
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Effect to listen for changes
  useEffect(() => {
    // Handler for the 'storage' event (other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };

    // Handler for the custom event (same tab)
    const handleInAppChange = (event: Event) => {
      const { key: changedKey } = (event as CustomEvent).detail;
      if (changedKey === key) {
        setStoredValue(readValue());
      }
    };

    // Add listeners
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(IN_APP_STORAGE_EVENT, handleInAppChange);

    // Remove listeners on cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(IN_APP_STORAGE_EVENT, handleInAppChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue, remove];
}
