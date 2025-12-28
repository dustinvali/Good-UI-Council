/**
 * Single conversation item in the sidebar.
 */
import { Trash2 } from 'lucide-react';

export default function ConversationItem({
    conversation,
    isActive,
    onSelect,
    onDelete,
}) {
    return (
        <div className={`conversation-item ${isActive ? 'active' : ''}`}>
            <button
                className="conversation-title"
                onClick={() => onSelect(conversation.id)}
            >
                {conversation.title || 'New Conversation'}
            </button>
            <button
                className="conversation-delete"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conversation.id);
                }}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
