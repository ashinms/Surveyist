import React, { useState, useRef, useMemo } from 'react';
import { FileText, Trash2, Plus, X, Upload, Type, ArrowRight } from 'lucide-react';
import { Survey } from '../types/survey';
import { fileParser, createAIService } from '../services/services';

export const HomeView: React.FC<{
  onSurveyUpload: (s: Survey, fileBuffer?: ArrayBuffer, fileName?: string) => void;
  surveys: Survey[];
  currentSurvey: Survey | null;
  onSelectSurvey: (survey: Survey) => void;
}> = ({ onSurveyUpload, surveys, currentSurvey, onSelectSurvey }) => {
  const [surveyText, setSurveyText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [uploadedBuffer, setUploadedBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiService = useMemo(() => createAIService(), []);

  const handleFile = async (file: File) => {
    const validation = fileParser.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setIsProcessing(true);
    try {
      const parsed = await fileParser.parseFile(file);
      if (parsed.success && parsed.text) {
        setSurveyText(parsed.text);
        const buffer = await file.arrayBuffer();
        setUploadedBuffer(buffer);
        setUploadedFileName(file.name);
        setInputMode('text');
      } else {
        alert(parsed.error || 'Failed to parse file');
      }
    } catch {
      alert('Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!surveyText.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = await aiService.parseSurvey(surveyText);
      setEditingSurvey(parsed);
    } catch (err: any) {
      alert('AI processing failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSurveyEdit = () => {
    if (!editingSurvey) return;
    onSurveyUpload(editingSurvey, uploadedBuffer || undefined, uploadedFileName || undefined);
    setSurveyText('');
    setUploadedBuffer(null);
    setUploadedFileName(null);
    setEditingSurvey(null);
  };

  if (editingSurvey) {
    return (
      <div className="p-6 space-y-6 pb-32 animate-in fade-in duration-300 text-left font-sans">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Review & Edit Survey</h2>
          <p className="text-xs text-white/60 uppercase font-black tracking-widest">Fine-tune questions before importing</p>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Survey Title</label>
            <input
              type="text"
              value={editingSurvey.name}
              onChange={e => setEditingSurvey({ ...editingSurvey, name: e.target.value })}
              className="w-full p-4 glass-inset rounded-2xl focus:outline-none text-sm font-bold text-white placeholder-white/30"
              placeholder="e.g. Needs Assessment Survey"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Questions ({editingSurvey.questions.length})</label>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {editingSurvey.questions.map((q, qIdx) => (
                <div key={qIdx} className="glass-inset p-4 rounded-2xl space-y-3 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider mt-2 flex-shrink-0">Q{qIdx + 1}</span>
                    <textarea
                      rows={2}
                      value={q.fieldName}
                      onChange={e => {
                        const updated = [...editingSurvey.questions];
                        updated[qIdx] = { ...updated[qIdx], fieldName: e.target.value };
                        setEditingSurvey({ ...editingSurvey, questions: updated });
                      }}
                      className="flex-1 bg-transparent text-sm text-white font-bold placeholder-white/30 focus:outline-none resize-none border-b border-white/5 focus:border-blue-500/50 py-1"
                      placeholder="Question text..."
                    />
                    <button
                      onClick={() => setEditingSurvey({ ...editingSurvey, questions: editingSurvey.questions.filter((_, idx) => idx !== qIdx) })}
                      className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">Type:</span>
                    <div className="flex gap-2">
                      {(['string', 'enum'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const updated = [...editingSurvey.questions];
                            updated[qIdx] = type === 'enum' 
                              ? { ...updated[qIdx], type: 'enum', options: updated[qIdx].options || ['Yes', 'No'] }
                              : { ...updated[qIdx], type: 'string', options: undefined };
                            setEditingSurvey({ ...editingSurvey, questions: updated });
                          }}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${q.type === type ? 'glass-button text-blue-400' : 'text-white/40 bg-white/5'}`}
                        >
                          {type === 'string' ? 'Text Answer' : 'Multiple Choice'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {q.type === 'enum' && q.options && (
                    <div className="space-y-2 pl-4 border-l-2 border-white/10 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">Options:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editingSurvey.questions];
                            updated[qIdx] = { ...updated[qIdx], options: [...(q.options || []), `Option ${(q.options || []).length + 1}`] };
                            setEditingSurvey({ ...editingSurvey, questions: updated });
                          }}
                          className="flex items-center gap-1 text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase"
                        >
                          <Plus size={10} /> Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const updatedOpts = [...(q.options || [])];
                                updatedOpts[optIdx] = e.target.value;
                                const updated = [...editingSurvey.questions];
                                updated[qIdx] = { ...updated[qIdx], options: updatedOpts };
                                setEditingSurvey({ ...editingSurvey, questions: updated });
                              }}
                              className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-white/5 text-xs text-white placeholder-white/20 focus:outline-none"
                            />
                            {q.options!.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editingSurvey.questions];
                                  updated[qIdx] = { ...updated[qIdx], options: q.options!.filter((_, idx) => idx !== optIdx) };
                                  setEditingSurvey({ ...editingSurvey, questions: updated });
                                }}
                                className="p-1.5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-md transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditingSurvey({
                ...editingSurvey,
                questions: [...editingSurvey.questions, { id: `q${editingSurvey.questions.length + 1}`, fieldName: `New Question`, type: 'string' }]
              })}
              className="w-full p-4 border border-dashed border-white/15 hover:border-blue-500/40 text-white/60 hover:text-blue-400 font-black uppercase tracking-wider text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Add Custom Question</span>
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button onClick={() => setEditingSurvey(null)} className="flex-1 p-4 glass-inset text-white/60 hover:text-white font-black uppercase text-xs rounded-2xl">Cancel</button>
            <button onClick={handleSaveSurveyEdit} className="flex-1 p-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-2xl shadow-lg hover:scale-[1.01] transition-transform">Finish & Import</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full font-sans space-y-6">
      <div className="text-center mb-6 pt-6">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-lg">Surveyist</h1>
        <p className="text-white/80 text-base font-medium max-w-xs mx-auto leading-tight">AI-Driven Precision for Professional Interview Excellence</p>
      </div>

      {currentSurvey && (
        <div className="max-w-2xl mx-auto p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-left">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <span className="block text-[8px] font-black text-green-400 uppercase tracking-widest">Active Survey Configured</span>
            <span className="text-xs font-bold text-white truncate block">{currentSurvey.name}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto glass-card p-6">
        <div className="flex gap-4 mb-5 text-left">
          <div className="p-3 glass-inset rounded-2xl"><FileText className="text-blue-400" size={24} /></div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Import New Survey</h2>
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Strict AI Extraction Enabled</p>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setInputMode('text')} className={`flex-1 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 ${inputMode === 'text' ? 'glass-button text-white' : 'glass-inset text-white/60'}`}><Type size={14} />Text</button>
          <button onClick={() => setInputMode('file')} className={`flex-1 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 ${inputMode === 'file' ? 'glass-button text-white' : 'glass-inset text-white/60'}`}><Upload size={14} />File</button>
        </div>

        {inputMode === 'text' ? (
          <>
            <textarea
              value={surveyText}
              onChange={e => setSurveyText(e.target.value)}
              placeholder="Paste survey questions here..."
              className="w-full h-44 p-4 glass-inset rounded-2xl focus:outline-none resize-none mb-5 text-xs text-white placeholder-white/40 leading-relaxed"
            />
            <button
              onClick={handleProcess}
              disabled={!surveyText.trim() || isProcessing}
              className="w-full py-4 glass-button text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {isProcessing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Process with AI</span><ArrowRight size={16} /></>}
            </button>
          </>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`p-6 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
          >
            <input ref={fileInputRef} type="file" accept=".docx,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
            <Upload className="text-blue-400 mx-auto mb-3" size={24} />
            <h3 className="text-white font-bold text-sm mb-1 uppercase">Upload Document</h3>
            <p className="text-white/60 text-[10px]">DOCX, PDF, TXT (Max 10MB)</p>
          </div>
        )}
      </div>

      {surveys.length > 0 && (
        <div className="max-w-2xl mx-auto glass-card p-6 text-left space-y-4">
          <div>
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest">Select Active Survey</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Switch survey structure instantly</p>
          </div>
          <div className="space-y-2">
            {surveys.map(s => {
              const isActive = currentSurvey?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSurvey(s)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left ${isActive ? 'bg-blue-500/15 border-blue-500/30 shadow' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="font-bold text-white text-xs truncate">{s.name}</h4>
                    <span className="text-[9px] text-white/40 uppercase font-black tracking-wider block mt-0.5">{s.questions.length} Questions</span>
                  </div>
                  {isActive && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-green-400/20 text-green-400 uppercase tracking-widest flex-shrink-0">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
