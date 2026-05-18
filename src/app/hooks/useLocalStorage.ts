import { useState, useEffect } from 'react';

/**
 * useLocalStorage — persist state in localStorage with optional custom
 * serializer/deserializer (needed for Set<string> and other non-JSON-native types).
 *
 * @param key            localStorage key
 * @param initialValue   fallback value when nothing is stored yet
 * @param deserializer   custom deserializer (default: JSON.parse)
 * @param serializer     custom serializer   (default: JSON.stringify)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  deserializer?: (raw: string) => T,
  serializer?: (value: T) => string,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const deserialize = deserializer ?? ((raw: string) => JSON.parse(raw) as T);
  const serialize   = serializer   ?? ((value: T)    => JSON.stringify(value));

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return raw ? deserialize(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, serialize(storedValue));
    } catch {
      // localStorage may be unavailable (SSR, private mode, quota exceeded) — ignore
    }
  }, [key, storedValue, serialize]);

  return [storedValue, setStoredValue];
}
