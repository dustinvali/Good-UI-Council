/**
 * Empty state displayed when no messages exist.
 */
import Logo from '../common/Logo';

export default function EmptyState() {
    return (
        <div className="empty-state">
            <Logo className="empty-logo" size={64} />
            <h1 className="empty-title">LLM Council</h1>
        </div>
    );
}
