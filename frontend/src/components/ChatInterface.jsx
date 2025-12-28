/**
 * Chat interface component.
 * Displays messages and handles user input.
 */
import { useEffect, useRef } from 'react';
import EmptyState from './chat/EmptyState';
import UserMessage from './chat/UserMessage';
import AssistantMessage from './chat/AssistantMessage';
import MessageInput from './chat/MessageInput';

export default function ChatInterface({ conversation, onSendMessage, isLoading }) {
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
