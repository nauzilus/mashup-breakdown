import {useCallback, useEffect, useState} from "react";

export type UseLocalStorage = [string, (value: string) => void];

export function useLocalStorage(key: string, defaultValue: string): UseLocalStorage {
    const [value, setValue] = useState(() => localStorage.getItem(key) || defaultValue);

    useEffect(() => {
        setValue(localStorage.getItem(key) || defaultValue);
    }, [key, defaultValue]);

    const store = useCallback((value: string) => {
        setValue(value);
        localStorage.setItem(key, value);
    }, [key]);

    return [value, store];
}