import { Settings, Trash2 } from 'lucide-react';

// Helper to categorize conversations by date
function groupConversationsByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const lastWeek = new Date(today - 7 * 86400000);

  const groups = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  conversations.forEach(conv => {
    const convDate = new Date(conv.created_at);
    const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

    if (convDay >= today) {
      groups.today.push(conv);
    } else if (convDay >= yesterday) {
      groups.yesterday.push(conv);
    } else if (convDay >= lastWeek) {
      groups.lastWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
}) {
  // Filter out empty conversations (no messages)
  const filteredConversations = conversations.filter(c => c.message_count > 0);

  // Group by date
  const groups = groupConversationsByDate(filteredConversations);

  const renderGroup = (convs, label) => {
    if (convs.length === 0) return null;
    return (
      <>
        <div className="conversation-group-label">{label}</div>
        {convs.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
          >
            <button
              className="conversation-title"
              onClick={() => onSelectConversation(conv.id)}
            >
              {conv.title || 'New Conversation'}
            </button>
            <button
              className="conversation-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </>
    );
  };

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
        {renderGroup(groups.today, 'Today')}
        {renderGroup(groups.yesterday, 'Yesterday')}
        {renderGroup(groups.lastWeek, 'Last 7 days')}
        {renderGroup(groups.older, 'Older')}
      </div>

      <div className="sidebar-footer">
        <button className="settings-btn" onClick={onOpenSettings}>
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
