export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <g stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M32 10 L51.05 21 L51.05 43 L32 54 L12.95 43 L12.95 21 Z" />
              <path d="M32 10 L32 54 M51.05 21 L12.95 43 M51.05 43 L12.95 21" />
            </g>
            <g fill="currentColor">
              <circle cx="32" cy="10" r="4.5" />
              <circle cx="51.05" cy="21" r="4.5" />
              <circle cx="51.05" cy="43" r="4.5" />
              <circle cx="32" cy="54" r="4.5" />
              <circle cx="12.95" cy="43" r="4.5" />
              <circle cx="12.95" cy="21" r="4.5" />
            </g>
            <circle cx="32" cy="32" r="7" fill="#FAFAF7" />
          </svg>
          <span>Council</span>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewConversation}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>New chat</span>
      </button>

      <div className="conversation-list">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv.id)}
          >
            {conv.title || 'New Conversation'}
          </button>
        ))}
      </div>
    </div>
  );
}
