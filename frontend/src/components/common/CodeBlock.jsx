/**
 * Syntax-highlighted code block component.
 */
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeBlock({ children, className }) {
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
}
