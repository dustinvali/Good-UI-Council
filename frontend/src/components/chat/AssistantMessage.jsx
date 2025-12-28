/**
 * Assistant message component with loading states and markdown rendering.
 */
import ReactMarkdown from 'react-markdown';
import ProcessView from './ProcessView';
import CodeBlock from '../common/CodeBlock';

export default function AssistantMessage({ message }) {
    const { loading, stage1, stage2, stage3 } = message;

    return (
        <div className="assistant-message">
            {loading?.stage1 && (
                <div className="stage-loading">
                    <div className="spinner"></div>
                    <span>Collecting expert opinions...</span>
                </div>
            )}
            {loading?.stage2 && (
                <div className="stage-loading">
                    <div className="spinner"></div>
                    <span>Cross-examining responses...</span>
                </div>
            )}
            {loading?.stage3 && (
                <div className="stage-loading">
                    <div className="spinner"></div>
                    <span>Synthesizing final consensus...</span>
                </div>
            )}
            {stage3?.response && (
                <>
                    <ProcessView stage1={stage1} stage2={stage2} />
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
                            {stage3.response}
                        </ReactMarkdown>
                    </div>
                </>
            )}
        </div>
    );
}
