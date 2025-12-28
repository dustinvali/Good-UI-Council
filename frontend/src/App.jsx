/**
 * Main App component.
 * Composes layout and coordinates state via custom hooks.
 */
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import { useConversations } from './hooks/useConversations';
import { useSettings } from './hooks/useSettings';
import { useMessageStream } from './hooks/useMessageStream';
import { api } from './api';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, saveSettings } = useSettings();
  const { sendMessage } = useMessageStream();

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
  } = useConversations();

  const handleSendMessage = async (content, attachments = []) => {
    try {
      let activeConversationId = currentConversationId;

      if (!activeConversationId) {
        const newConv = await api.createConversation();
        activeConversationId = newConv.id;
        setConversations(prev => [
          { id: newConv.id, created_at: newConv.created_at, title: 'New Conversation', message_count: 0 },
          ...prev
        ]);
        setCurrentConversationId(newConv.id);
        setCurrentConversation({ ...newConv, messages: [] });
      }

      setIsLoading(true);

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

      await sendMessage({
        conversationId: activeConversationId,
        content,
        attachments,
        settings,
        onStage1Start: () => {
          setCurrentConversation(prev => {
            const messages = [...prev.messages];
            messages[messages.length - 1].loading.stage1 = true;
            return { ...prev, messages };
          });
        },
        onStage1Complete: (data) => {
          setCurrentConversation(prev => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage1 = data;
            messages[messages.length - 1].loading.stage1 = false;
            return { ...prev, messages };
          });
        },
        onStage2Start: () => {
          setCurrentConversation(prev => {
            const messages = [...prev.messages];
            messages[messages.length - 1].loading.stage2 = true;
            return { ...prev, messages };
          });
        },
        onStage2Complete: (data) => {
          setCurrentConversation(prev => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage2 = data;
            messages[messages.length - 1].loading.stage2 = false;
            return { ...prev, messages };
          });
        },
        onStage3Start: () => {
          setCurrentConversation(prev => {
            const messages = [...prev.messages];
            messages[messages.length - 1].loading.stage3 = true;
            return { ...prev, messages };
          });
        },
        onStage3Complete: (data) => {
          setCurrentConversation(prev => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage3 = data;
            messages[messages.length - 1].loading.stage3 = false;
            return { ...prev, messages };
          });
        },
        onComplete: () => {
          loadConversations();
          setIsLoading(false);
        },
        onError: (message) => {
          console.error('Stream error:', message);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={newConversation}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
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
