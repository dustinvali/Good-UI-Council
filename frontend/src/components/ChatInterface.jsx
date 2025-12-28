import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send } from 'lucide-react';

const CodeBlock = ({ children, className }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      PreTag="div"
      customStyle={{
        margin: '1em 0',
        borderRadius: '8px',
        fontSize: '0.875em',
      }}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

export default function ChatInterface({ conversation, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const messages = conversation?.messages || [];

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        <div className="messages-inner">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2>Start a conversation</h2>
              <p>Ask a question to consult the LLM Council</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="message-group">
                {msg.role === 'user' ? (
                  <div className="user-message">
                    <div className="user-bubble">
                      <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="assistant-message">
                    {msg.loading?.stage1 && (
                      <div className="stage-loading">
                        <div className="spinner"></div>
                        <span>Collecting expert opinions...</span>
                      </div>
                    )}
                    {msg.loading?.stage2 && (
                      <div className="stage-loading">
                        <div className="spinner"></div>
                        <span>Cross-examining responses...</span>
                      </div>
                    )}
                    {msg.loading?.stage3 && (
                      <div className="stage-loading">
                        <div className="spinner"></div>
                        <span>Synthesizing final consensus...</span>
                      </div>
                    )}
                    {msg.stage3?.response && (
                      <div className="assistant-content">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              if (inline) {
                                return <code className={className} {...props}>{children}</code>;
                              }
                              return <CodeBlock className={className}>{children}</CodeBlock>;
                            }
                          }}
                        >
                          {msg.stage3.response}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-area">
        <form className="input-container" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder="Ask your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
            {isLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
