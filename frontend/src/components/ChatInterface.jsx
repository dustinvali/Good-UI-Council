/**
 * Chat interface component.
 * Displays messages and handles user input.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import EmptyState from './chat/EmptyState';
import UserMessage from './chat/UserMessage';
import AssistantMessage from './chat/AssistantMessage';
import MessageInput from './chat/MessageInput';

export default function ChatInterface({ conversation, onSendMessage, isLoading, error, onDismissError }) {
  const messagesEndRef = useRef(null);
  const messages = conversation?.messages || [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-interface">
      {error && (
        <div className="error-banner">
          <span className="error-message">{error}</span>
          <button className="error-dismiss" onClick={onDismissError} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}
      <div className="messages-container">
        <div className="messages-inner">
          {!hasMessages ? (
            <EmptyState />
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="message-group">
                {msg.role === 'user' ? (
                  <UserMessage content={msg.content} />
                ) : (
                  <AssistantMessage message={msg} />
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        hasMessages={hasMessages}
      />
    </div>
  );
}
