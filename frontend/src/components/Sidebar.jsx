/**
 * Sidebar component with conversations list, new chat button, and settings.
 */
import { Settings } from 'lucide-react';
import Logo from './common/Logo';
import ConversationList from './sidebar/ConversationList';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Logo size={32} />
          <span>Council</span>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewConversation}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>New chat</span>
      </button>

      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={onSelectConversation}
        onDeleteConversation={onDeleteConversation}
      />

      <div className="sidebar-footer">
        <button className="settings-btn" onClick={onOpenSettings}>
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
