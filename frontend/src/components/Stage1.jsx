import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-medium rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-ivory-dark mb-4">Stage 1: Individual Responses</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {responses.map((resp, index) => (
          <button
            key={index}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              activeTab === index
                ? "bg-slate-light text-ivory-medium"
                : "bg-slate-dark/50 text-cloud-light hover:bg-slate-light/50"
            )}
            onClick={() => setActiveTab(index)}
          >
            {resp.model.split('/')[1] || resp.model}
          </button>
        ))}
      </div>

      <div className="bg-slate-dark/50 rounded-lg p-4">
        <div className="text-xs text-cloud-medium mb-3">{responses[activeTab].model}</div>
        <div className="prose-council text-ivory-medium">
          <ReactMarkdown>{responses[activeTab].response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
