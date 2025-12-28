/**
 * Custom hook for handling SSE message streaming.
 */
import { useCallback } from 'react';
import { api } from '../api';

export function useMessageStream() {
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
        onComplete,
        onError,
    }) => {
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
                case 'complete':
                    onComplete?.();
                    break;
                case 'error':
                    onError?.(event.message);
                    break;
            }
        }, {
            councilModels: settings.councilModels,
            chairmanModel: settings.chairmanModel,
            attachments,
        });
    }, []);

    return { sendMessage };
}
