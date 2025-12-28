import ReactMarkdown from 'react-markdown';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  return (
    <div className="bg-slate-medium rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-ivory-dark mb-4">Stage 3: Final Council Answer</h3>
      <div className="bg-emerald-900/20 rounded-lg p-4">
        <div className="text-xs text-cloud-medium mb-3">
          Chairman: {finalResponse.model.split('/')[1] || finalResponse.model}
        </div>
        <div className="prose-council text-ivory-medium">
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
