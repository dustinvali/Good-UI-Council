/**
 * Custom hook for managing conversations state and operations.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../api';

export function useConversations() {
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Track if we should skip the next auto-load (used when creating new conversations)
    const skipNextLoadRef = useRef(false);

    const loadConversations = useCallback(async () => {
        try {
            const convs = await api.listConversations();
            setConversations(convs);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }, []);

    const loadConversation = useCallback(async (id) => {
        try {
            const conv = await api.getConversation(id);
            setCurrentConversation(conv);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    }, []);

    const selectConversation = useCallback((id) => {
        setCurrentConversationId(id);
    }, []);

    const newConversation = useCallback(() => {
        setCurrentConversation(null);
        setCurrentConversationId(null);
    }, []);

    const deleteConversation = useCallback(async (id) => {
        try {
            await api.deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (currentConversationId === id) {
                setCurrentConversationId(null);
                setCurrentConversation(null);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    }, [currentConversationId]);

    // Skip the next auto-load when creating a new conversation
    const skipNextLoad = useCallback(() => {
        skipNextLoadRef.current = true;
    }, []);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Load conversation when ID changes (but skip if we just created it)
    useEffect(() => {
        if (currentConversationId) {
            if (skipNextLoadRef.current) {
                skipNextLoadRef.current = false;
                return;
            }
            loadConversation(currentConversationId);
        }
    }, [currentConversationId, loadConversation]);

    return {
        conversations,
        currentConversation,
        currentConversationId,
        isLoading,
        setIsLoading,
        setConversations,
        setCurrentConversation,
        setCurrentConversationId,
        loadConversations,
        selectConversation,
        newConversation,
        deleteConversation,
        skipNextLoad,
    };
}
