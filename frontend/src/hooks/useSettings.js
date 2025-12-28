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
            return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const saveSettings = useCallback((newSettings) => {
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }, []);

    return { settings, saveSettings, DEFAULT_SETTINGS };
}
