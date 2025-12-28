import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, ChevronDown, ChevronUp, Paperclip, X, Image, FileText } from 'lucide-react';

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

const ProcessView = ({ stage1, stage2 }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('responses');

  if (!stage1 && !stage2) return null;

  return (
    <div className="process-view">
      <button className="process-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>View process</span>
      </button>

      {expanded && (
        <div className="process-content">
          <div className="process-tabs">
            <button
              className={`process-tab ${activeTab === 'responses' ? 'active' : ''}`}
              onClick={() => setActiveTab('responses')}
            >
              Initial Responses ({stage1?.length || 0})
            </button>
            <button
              className={`process-tab ${activeTab === 'voting' ? 'active' : ''}`}
              onClick={() => setActiveTab('voting')}
            >
              Voting ({stage2?.length || 0})
            </button>
          </div>

          <div className="process-panel">
            {activeTab === 'responses' && stage1 && (
              <div className="stage-responses">
                {stage1.map((resp, i) => (
                  <div key={i} className="stage-response">
                    <div className="stage-model">{resp.model.split('/')[1] || resp.model}</div>
                    <div className="stage-text">
                      <ReactMarkdown>{resp.response}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'voting' && stage2 && (
              <div className="stage-responses">
                {stage2.map((rank, i) => (
                  <div key={i} className="stage-response">
                    <div className="stage-model">{rank.model.split('/')[1] || rank.model}</div>
                    <div className="stage-text">
                      <ReactMarkdown>{rank.ranking}</ReactMarkdown>
                    </div>
                    {rank.parsed_ranking && (
                      <div className="parsed-ranking">
                        <strong>Ranking:</strong> {rank.parsed_ranking.join(' → ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChatInterface({ conversation, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const messages = conversation?.messages || [];
  const hasMessages = messages.length > 0;

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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      const content = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        if (isImage) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      newAttachments.push({
        name: file.name,
        type: file.type,
        isImage,
        content,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
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
              <svg className="empty-logo" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <g stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M32 10 L51.05 21 L51.05 43 L32 54 L12.95 43 L12.95 21 Z" />
                  <path d="M32 10 L32 54 M51.05 21 L12.95 43 M51.05 43 L12.95 21" />
                </g>
                <g fill="currentColor">
                  <circle cx="32" cy="10" r="4" />
                  <circle cx="51.05" cy="21" r="4" />
                  <circle cx="51.05" cy="43" r="4" />
                  <circle cx="32" cy="54" r="4" />
                  <circle cx="12.95" cy="43" r="4" />
                  <circle cx="12.95" cy="21" r="4" />
                </g>
                <circle cx="32" cy="32" r="6" fill="#FAFAF7" />
              </svg>
              <h1 className="empty-title">LLM Council</h1>
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
                      <>
                        <ProcessView stage1={msg.stage1} stage2={msg.stage2} />
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
                      </>
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
          {attachments.length > 0 && (
            <div className="attachments-preview">
              {attachments.map((att, i) => (
                <div key={i} className="attachment-item">
                  {att.isImage ? <Image size={14} /> : <FileText size={14} />}
                  <span className="attachment-name">{att.name}</span>
                  <button type="button" className="attachment-remove" onClick={() => removeAttachment(i)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.css,.html,.xml,.yaml,.yml,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="input-wrapper">
            <button
              type="button"
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip size={18} />
            </button>
            <textarea
              ref={textareaRef}
              className="message-input"
              placeholder={hasMessages ? "Suggest changes..." : "Ask your question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <button type="submit" className="send-btn" disabled={(!input.trim() && attachments.length === 0) || isLoading}>
              {isLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : <Send size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
