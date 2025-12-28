import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function Settings({ isOpen, onClose, settings, onSave }) {
  const [councilModels, setCouncilModels] = useState(settings.councilModels || []);
  const [chairmanModel, setChairmanModel] = useState(settings.chairmanModel || '');
  const [newModel, setNewModel] = useState('');

  useEffect(() => {
    setCouncilModels(settings.councilModels || []);
    setChairmanModel(settings.chairmanModel || '');
  }, [settings]);

  const handleSave = () => {
    onSave({ councilModels, chairmanModel });
    onClose();
  };

  const addModel = () => {
    const trimmed = newModel.trim();
    if (trimmed && !councilModels.includes(trimmed)) {
      setCouncilModels([...councilModels, trimmed]);
      setNewModel('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addModel();
    }
  };

  const removeModel = (model) => {
    setCouncilModels(councilModels.filter(m => m !== model));
  };

  if (!isOpen) return null;

  // Combine all models (council + chairman) for the chairman dropdown
  const allModels = [...new Set([...councilModels, chairmanModel].filter(Boolean))];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Council Leader</h3>
            <p className="settings-desc">The model that synthesizes the final answer</p>
            <select
              className="settings-select"
              value={chairmanModel}
              onChange={(e) => setChairmanModel(e.target.value)}
            >
              <option value="">Select a model...</option>
              {allModels.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-section">
            <h3>Council Members</h3>
            <p className="settings-desc">Models that provide initial responses and vote</p>

            <div className="model-list">
              {councilModels.map(model => (
                <div key={model} className="model-item">
                  <span>{model}</span>
                  <button className="model-remove" onClick={() => removeModel(model)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {councilModels.length === 0 && (
                <div className="model-empty">No models added yet</div>
              )}
            </div>

            <div className="model-add">
              <input
                type="text"
                className="settings-input"
                placeholder="openai/chatgpt-4o-latest"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="model-add-btn" onClick={addModel} disabled={!newModel.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-cancel" onClick={onClose}>Cancel</button>
          <button className="settings-save" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
