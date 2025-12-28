/**
 * Message input form with file attachments support.
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image, FileText } from 'lucide-react';

export default function MessageInput({ onSendMessage, isLoading, hasMessages }) {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState([]);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

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
    );
}
