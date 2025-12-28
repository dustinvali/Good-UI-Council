import { useState, useCallback } from 'react';
import { api } from '../api';

/**
 * Hook for managing the council message streaming process.
 */
export function useCouncilStream() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessageStream = useCallback(async (conversationId, content, onUpdate, onComplete) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Add user message
            onUpdate((prev) => ({
                ...prev,
                messages: [...prev.messages, { role: 'user', content }],
            }));

            // 2. Add empty assistant message with loading state
            const assistantMessage = {
                role: 'assistant',
                stage1: null,
                stage2: null,
                stage3: null,
                metadata: null,
                loading: {
                    stage1: false,
                    stage2: false,
                    stage3: false,
                },
            };

            onUpdate((prev) => ({
                ...prev,
                messages: [...prev.messages, assistantMessage],
            }));

            // 3. Start streaming
            await api.sendMessageStream(conversationId, content, (eventType, event) => {
                onUpdate((prev) => {
                    const messages = [...prev.messages];
                    const lastMsg = { ...messages[messages.length - 1] };

                    if (lastMsg.role !== 'assistant') return prev;

                    switch (eventType) {
                        case 'stage1_start':
                            lastMsg.loading = { ...lastMsg.loading, stage1: true };
                            break;
                        case 'stage1_complete':
                            lastMsg.stage1 = event.data;
                            lastMsg.loading = { ...lastMsg.loading, stage1: false };
                            break;
                        case 'stage2_start':
                            lastMsg.loading = { ...lastMsg.loading, stage2: true };
                            break;
                        case 'stage2_complete':
                            lastMsg.stage2 = event.data;
                            lastMsg.metadata = event.metadata;
                            lastMsg.loading = { ...lastMsg.loading, stage2: false };
                            break;
                        case 'stage3_start':
                            lastMsg.loading = { ...lastMsg.loading, stage3: true };
                            break;
                        case 'stage3_complete':
                            lastMsg.stage3 = event.data;
                            lastMsg.loading = { ...lastMsg.loading, stage3: false };
                            break;
                        case 'title_complete':
                            if (onComplete) onComplete('title');
                            break;
                        case 'complete':
                            setIsLoading(false);
                            if (onComplete) onComplete('full');
                            break;
                        case 'error':
                            setError(event.message);
                            setIsLoading(false);
                            break;
                    }

                    messages[messages.length - 1] = lastMsg;
                    return { ...prev, messages };
                });
            });
        } catch (err) {
            console.error('Failed to send message:', err);
            setError(err.message || 'An unexpected error occurred');
            setIsLoading(false);

            // Rollback optimistic update on error
            onUpdate((prev) => ({
                ...prev,
                messages: prev.messages.slice(0, -2),
            }));
        }
    }, []);

    return { isLoading, error, sendMessageStream, clearError: () => setError(null) };
}
