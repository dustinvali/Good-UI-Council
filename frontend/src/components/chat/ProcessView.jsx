/**
 * Expandable view showing Stage 1 responses and Stage 2 voting.
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ProcessView({ stage1, stage2 }) {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('responses');

    if (!stage1 && !stage2) return null;

    return (
        <div className="process-view">
            <button className="process-toggle" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>View process</span>
            </button>

            {expanded && (
                <div className="process-content">
                    <div className="process-tabs">
                        <button
                            className={`process-tab ${activeTab === 'responses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('responses')}
                        >
                            Initial Responses ({stage1?.length || 0})
                        </button>
                        <button
                            className={`process-tab ${activeTab === 'voting' ? 'active' : ''}`}
                            onClick={() => setActiveTab('voting')}
                        >
                            Voting ({stage2?.length || 0})
                        </button>
                    </div>

                    <div className="process-panel">
                        {activeTab === 'responses' && stage1 && (
                            <div className="stage-responses">
                                {stage1.map((resp, i) => (
                                    <div key={i} className="stage-response">
                                        <div className="stage-model">{resp.model.split('/')[1] || resp.model}</div>
                                        <div className="stage-text">
                                            <ReactMarkdown>{resp.response}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'voting' && stage2 && (
                            <div className="stage-responses">
                                {stage2.map((rank, i) => (
                                    <div key={i} className="stage-response">
                                        <div className="stage-model">{rank.model.split('/')[1] || rank.model}</div>
                                        <div className="stage-text">
                                            <ReactMarkdown>{rank.ranking}</ReactMarkdown>
                                        </div>
                                        {rank.parsed_ranking && (
                                            <div className="parsed-ranking">
                                                <strong>Ranking:</strong> {rank.parsed_ranking.join(' → ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
