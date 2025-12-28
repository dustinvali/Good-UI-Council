/**
 * User message bubble component.
 */
import ReactMarkdown from 'react-markdown';

export default function UserMessage({ content }) {
    return (
        <div className="user-message">
            <div className="user-bubble">
                <ReactMarkdown>{content || ''}</ReactMarkdown>
            </div>
        </div>
    );
}
