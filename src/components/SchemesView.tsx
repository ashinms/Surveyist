import React, { useState } from 'react';
import { CommunityInitiative } from '../types/survey';

export const SchemesView: React.FC<{
  initiatives: CommunityInitiative[];
  setInitiatives: React.Dispatch<React.SetStateAction<CommunityInitiative[]>>;
}> = ({ initiatives, setInitiatives }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommunityInitiative['category']>('Outreach Event');
  const [organisation, setOrganisation] = useState('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [filter, setFilter] = useState<'all' | 'Financial Bursary' | 'Upskilling' | 'Activity'>('all');

  const filtered = initiatives.filter(i => filter === 'all' || i.category === filter);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const newItem: CommunityInitiative = {
      id: `init-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      eligibility: eligibility.trim() || 'Open to all Singapore residents.',
      organisation: organisation.trim() || 'Social Services'
    };
    setInitiatives(prev => [...prev, newItem]);
    setTitle('');
    setDescription('');
    setEligibility('');
    setOrganisation('');
    setShowAdd(false);
  };

  return (
    <div className="p-6 space-y-6 pb-32 text-left font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Support Schemes</h2>
          <p className="text-xs text-white/50">Schemes database used by matching engine</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 glass-button text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider">{showAdd ? 'Close' : 'Add New'}</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="glass-inset p-5 rounded-2xl space-y-3">
          <input type="text" placeholder="Title" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white focus:outline-none">
            <option value="Financial Bursary">Financial Bursary</option>
            <option value="Upskilling">Upskilling</option>
            <option value="Outreach Event">Outreach Event</option>
            <option value="Activity">Activity</option>
          </select>
          <input type="text" placeholder="Organisation" value={organisation} onChange={e => setOrganisation(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20" />
          <textarea placeholder="Description" required rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20" />
          <input type="text" placeholder="Eligibility Criteria" value={eligibility} onChange={e => setEligibility(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20" />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black uppercase text-xs rounded-xl shadow">Save Scheme</button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        {(['all', 'Financial Bursary', 'Upskilling', 'Activity'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === f ? 'glass-button text-blue-400' : 'text-white/40'}`}>
            {f === 'all' ? 'All' : f.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(i => (
          <div key={i.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-xs">{i.title}</h4>
                <span className="text-[9px] text-white/40 uppercase font-bold">{i.organisation || "General Office"}</span>
              </div>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">{i.category}</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">{i.description}</p>
            <div className="text-[9px] text-white/40 border-t border-white/5 pt-2 font-bold uppercase"><span className="text-blue-400">Eligibility:</span> {i.eligibility}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
