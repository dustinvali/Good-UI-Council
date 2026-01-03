/**
 * Custom hook for managing application settings with localStorage persistence.
 */
import { useState, useCallback } from 'react';

const DEFAULT_SETTINGS = {
    councilModels: [
        'openai/gpt-4o',
        'anthropic/claude-sonnet-4',
        'google/gemini-2.5-flash',
    ],
    chairmanModel: 'google/gemini-2.5-flash',
};

const STORAGE_KEY = 'council-settings';

export function useSettings() {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                // Merge saved settings with defaults to ensure all properties exist
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
            return DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const saveSettings = useCallback((newSettings) => {
        // Merge with defaults to ensure all required properties exist
        const merged = { ...DEFAULT_SETTINGS, ...newSettings };
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }, []);

    return { settings, saveSettings, DEFAULT_SETTINGS };
}
