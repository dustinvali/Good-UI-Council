/**
 * Main App component.
 * Composes layout and coordinates state via custom hooks.
 */
import { useState, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import { useConversations } from './hooks/useConversations';
import { useSettings } from './hooks/useSettings';
import { useMessageStream } from './hooks/useMessageStream';
import { api } from './api';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState(null);
  const { settings, saveSettings } = useSettings();
  const { sendMessage, cancelRequest } = useMessageStream();

  // Track the active conversation ID for streaming callbacks
  const activeConversationRef = useRef(null);

  const {
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
  } = useConversations();

  // Wrapper for selectConversation that cancels any in-flight request
  const handleSelectConversation = useCallback((id) => {
    cancelRequest();
    setIsLoading(false);
    activeConversationRef.current = null;
    selectConversation(id);
  }, [cancelRequest, setIsLoading, selectConversation]);

  // Wrapper for newConversation that cancels any in-flight request
  const handleNewConversation = useCallback(() => {
    cancelRequest();
    setIsLoading(false);
    activeConversationRef.current = null;
    newConversation();
  }, [cancelRequest, setIsLoading, newConversation]);

  const handleSendMessage = async (content, attachments = []) => {
    // Clear any previous error
    setError(null);

    try {
      let activeConversationId = currentConversationId;

      if (!activeConversationId) {
        const newConv = await api.createConversation();
        activeConversationId = newConv.id;
        setConversations(prev => [
          { id: newConv.id, created_at: newConv.created_at, title: 'New Conversation', message_count: 0 },
          ...prev
        ]);
        // Skip the auto-load since we're about to stream updates
        skipNextLoad();
        setCurrentConversationId(newConv.id);
        setCurrentConversation({ ...newConv, messages: [] });
      }

      setIsLoading(true);

      // Track this conversation for callback guards
      activeConversationRef.current = activeConversationId;

      const userMessage = { role: 'user', content };
      setCurrentConversation(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), userMessage],
      }));

      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        loading: { stage1: false, stage2: false, stage3: false },
      };

      setCurrentConversation(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Helper to guard callbacks - only update if still on the same conversation
      const guardedUpdate = (updateFn) => {
        if (activeConversationRef.current !== activeConversationId) return;
        setCurrentConversation(updateFn);
      };

      await sendMessage({
        conversationId: activeConversationId,
        content,
        attachments,
        settings,
        onStage1Start: () => {
          guardedUpdate(prev => {
            if (!prev?.messages?.length) return prev;
            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            if (lastMsg?.role === 'assistant') {
              messages[lastIdx] = {
                ...lastMsg,
                loading: { ...(lastMsg.loading || {}), stage1: true }
              };
            }
            return { ...prev, messages };
          });
        },
        onStage1Complete: (data) => {
          guardedUpdate(prev => {
            if (!prev?.messages?.length) return prev;
            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            if (lastMsg?.role === 'assistant') {
              messages[lastIdx] = {
                ...lastMsg,
                stage1: data,
                loading: { ...(lastMsg.loading || {}), stage1: false }
              };
            }
            return { ...prev, messages };
          });
        },
        onStage2Start: () => {
          guardedUpdate(prev => {
            if (!prev?.messages?.length) return prev;
            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            if (lastMsg?.role === 'assistant') {
              messages[lastIdx] = {
                ...lastMsg,
                loading: { ...(lastMsg.loading || {}), stage2: true }
              };
            }
            return { ...prev, messages };
          });
        },
        onStage2Complete: (data) => {
          guardedUpdate(prev => {
            if (!prev?.messages?.length) return prev;
            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            if (lastMsg?.role === 'assistant') {
              messages[lastIdx] = {
                ...lastMsg,
                stage2: data,
                loading: { ...(lastMsg.loading || {}), stage2: false }
              };
            }
            return { ...prev, messages };
          });
        },
        onStage3Start: () => {
          guardedUpdate(prev => {
            if (!prev?.messages?.length) return prev;
            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            if (lastMsg?.role === 'assistant') {
              messages[lastIdx] = {
                ...lastMsg,
                loading: { ...(lastMsg.loading || {}), stage3: true }
              };
            }
            return { ...prev, messages };
          });
        },
        onStage3Complete: (data) => {
          guardedUpdate(prev => {
            if (!prev?.messages?.length) return prev;
            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            if (lastMsg?.role === 'assistant') {
              messages[lastIdx] = {
                ...lastMsg,
                stage3: data,
                loading: { ...(lastMsg.loading || {}), stage3: false }
              };
            }
            return { ...prev, messages };
          });
        },
        onTitleComplete: (title) => {
          if (activeConversationRef.current !== activeConversationId) return;
          // Update the current conversation's title
          setCurrentConversation(prev => prev ? { ...prev, title } : prev);
          // Update the conversation in the sidebar list
          setConversations(prev => prev.map(conv =>
            conv.id === activeConversationId ? { ...conv, title } : conv
          ));
        },
        onComplete: () => {
          if (activeConversationRef.current !== activeConversationId) return;
          loadConversations();
          setIsLoading(false);
        },
        onError: (message) => {
          if (activeConversationRef.current !== activeConversationId) return;
          console.error('Stream error:', message);
          setError(message || 'An error occurred while processing your request.');
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      setIsLoading(false);
    }
  };

  const dismissError = () => setError(null);

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        error={error}
        onDismissError={dismissError}
      />
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </div>
  );
}

export default App;
