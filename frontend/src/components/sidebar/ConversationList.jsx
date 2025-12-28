/**
 * Grouped conversation list with date labels.
 */
import ConversationItem from './ConversationItem';

/**
 * Helper to categorize conversations by date.
 */
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

function GroupSection({ conversations, label, currentId, onSelect, onDelete }) {
    if (conversations.length === 0) return null;

    return (
        <>
            <div className="conversation-group-label">{label}</div>
            {conversations.map((conv) => (
                <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
}

export default function ConversationList({
    conversations,
    currentConversationId,
    onSelectConversation,
    onDeleteConversation,
}) {
    // Filter out empty conversations
    const filteredConversations = conversations.filter(c => c.message_count > 0);
    const groups = groupConversationsByDate(filteredConversations);

    return (
        <div className="conversation-list">
            <GroupSection
                conversations={groups.today}
                label="Today"
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
            />
            <GroupSection
                conversations={groups.yesterday}
                label="Yesterday"
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
            />
            <GroupSection
                conversations={groups.lastWeek}
                label="Last 7 days"
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
            />
            <GroupSection
                conversations={groups.older}
                label="Older"
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
            />
        </div>
    );
}
