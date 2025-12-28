import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../../lib/utils';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  // Replace each "Response X" with the actual model name
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-medium rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-ivory-dark mb-4">Stage 2: Peer Rankings</h3>

      <h4 className="text-sm font-medium text-ivory-dark mb-2">Raw Evaluations</h4>
      <p className="text-sm text-cloud-medium mb-4">
        Each model evaluated all responses (anonymized as Response A, B, C, etc.) and provided rankings.
        Below, model names are shown in <strong className="text-ivory-dark">bold</strong> for readability, but the original evaluation used anonymous labels.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {rankings.map((rank, index) => (
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
            {rank.model.split('/')[1] || rank.model}
          </button>
        ))}
      </div>

      <div className="bg-slate-dark/50 rounded-lg p-4 mb-4">
        <div className="text-xs text-cloud-medium mb-3">
          {rankings[activeTab].model}
        </div>
        <div className="prose-council text-ivory-medium mb-4">
          <ReactMarkdown>
            {deAnonymizeText(rankings[activeTab].ranking, labelToModel)}
          </ReactMarkdown>
        </div>

        {rankings[activeTab].parsed_ranking &&
          rankings[activeTab].parsed_ranking.length > 0 && (
            <div className="border-t border-slate-light pt-4">
              <strong className="text-ivory-dark text-sm">Extracted Ranking:</strong>
              <ol className="list-decimal list-inside mt-2 text-sm text-cloud-light">
                {rankings[activeTab].parsed_ranking.map((label, i) => (
                  <li key={i} className="py-0.5">
                    {labelToModel && labelToModel[label]
                      ? labelToModel[label].split('/')[1] || labelToModel[label]
                      : label}
                  </li>
                ))}
              </ol>
            </div>
          )}
      </div>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="border-t border-slate-light pt-4">
          <h4 className="text-sm font-medium text-ivory-dark mb-2">Aggregate Rankings (Street Cred)</h4>
          <p className="text-sm text-cloud-medium mb-3">
            Combined results across all peer evaluations (lower score is better):
          </p>
          <div className="space-y-2">
            {aggregateRankings.map((agg, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-ivory-dark font-medium">#{index + 1}</span>
                <span className="flex-1 text-ivory-medium">
                  {agg.model.split('/')[1] || agg.model}
                </span>
                <span className="text-cloud-light">
                  Avg: {agg.average_rank.toFixed(2)}
                </span>
                <span className="text-cloud-medium text-xs">
                  ({agg.rankings_count} votes)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
