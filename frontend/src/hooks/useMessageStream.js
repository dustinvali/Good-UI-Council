/**
 * Custom hook for handling SSE message streaming.
 */
import { useCallback, useRef } from 'react';
import { api } from '../api';

export function useMessageStream() {
    // Store the current AbortController to allow cancellation
    const abortControllerRef = useRef(null);

    const sendMessage = useCallback(async ({
        conversationId,
        content,
        attachments = [],
        settings,
        onStage1Start,
        onStage1Complete,
        onStage2Start,
        onStage2Complete,
        onStage3Start,
        onStage3Complete,
        onTitleComplete,
        onComplete,
        onError,
    }) => {
        // Cancel any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        await api.sendMessageStream(conversationId, content, (eventType, event) => {
            switch (eventType) {
                case 'stage1_start':
                    onStage1Start?.();
                    break;
                case 'stage1_complete':
                    onStage1Complete?.(event.data);
                    break;
                case 'stage2_start':
                    onStage2Start?.();
                    break;
                case 'stage2_complete':
                    onStage2Complete?.(event.data);
                    break;
                case 'stage3_start':
                    onStage3Start?.();
                    break;
                case 'stage3_complete':
                    onStage3Complete?.(event.data);
                    break;
                case 'title_complete':
                    onTitleComplete?.(event.data?.title);
                    break;
                case 'complete':
                    onComplete?.();
                    abortControllerRef.current = null;
                    break;
                case 'error':
                    onError?.(event.message);
                    abortControllerRef.current = null;
                    break;
            }
        }, {
            councilModels: settings.councilModels,
            chairmanModel: settings.chairmanModel,
            attachments,
            abortSignal: abortControllerRef.current.signal,
        });
    }, []);

    // Function to cancel the current request
    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return { sendMessage, cancelRequest };
}
