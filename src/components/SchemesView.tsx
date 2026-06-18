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
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [filter, setFilter] = useState<'all' | 'Financial Bursary' | 'Upskilling' | 'Activity' | 'Other'>('all');

  const filtered = (initiatives || []).filter(i => i && (filter === 'all' || i.category === filter || (filter === 'Other' && !['Financial Bursary', 'Upskilling', 'Activity'].includes(i.category))));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const newItem: CommunityInitiative = {
      id: `init-${Date.now()}`,
      title: title.trim(),
      category: category || 'Outreach Event',
      description: description.trim(),
      eligibility: (eligibility || '').trim() || 'Open to all Singapore residents.',
      organisation: (organisation || '').trim() || 'Social Services',
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      website: website.trim() || undefined
    };
    if (typeof setInitiatives === 'function') {
      setInitiatives(prev => [...(prev || []), newItem]);
    }
    setTitle('');
    setDescription('');
    setEligibility('');
    setOrganisation('');
    setContactPhone('');
    setContactEmail('');
    setWebsite('');
    setShowAdd(false);
  };

  const groupedByOrg = filtered.reduce((groups, item) => {
    if (!item) return groups;
    const org = (typeof item.organisation === 'string' ? item.organisation.trim() : '') || 'Other Services';
    if (!groups[org]) {
      groups[org] = [];
    }
    groups[org].push(item);
    return groups;
  }, {} as Record<string, CommunityInitiative[]>);

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
            <option value="Other">Other</option>
          </select>
          <input type="text" placeholder="Organisation" value={organisation} onChange={e => setOrganisation(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <textarea placeholder="Description" required rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <input type="text" placeholder="Eligibility Criteria" value={eligibility} onChange={e => setEligibility(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Phone Number" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
            <input type="email" placeholder="Email Address" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          </div>
          <input type="text" placeholder="Website URL (e.g. www.example.com)" value={website} onChange={e => setWebsite(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          
          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black uppercase text-xs rounded-xl shadow">Save Scheme</button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        {(['all', 'Financial Bursary', 'Upskilling', 'Activity', 'Other'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === f ? 'glass-button text-blue-400' : 'text-white/40'}`}>
            {f === 'all' ? 'All' : f.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByOrg).map(([orgName, items]) => (
          <div key={orgName} className="space-y-3">
            <div className="flex items-center gap-2 pl-1.5 border-l-2 border-blue-500">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{orgName}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-white/10 rounded-full text-white/60 font-bold">{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.map(i => (
                <div key={i.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs">{i.title}</h4>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">{i.category}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{i.description}</p>
                  
                  {(i.contactPhone || i.contactEmail || i.website) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] text-white/60 bg-slate-900/30 p-2.5 rounded-xl border border-white/5 font-medium">
                      {i.contactPhone && <span className="flex items-center gap-1">📞 {i.contactPhone}</span>}
                      {i.contactEmail && <span className="flex items-center gap-1">✉️ {i.contactEmail}</span>}
                      {i.website && <span className="flex items-center gap-1 truncate max-w-full">🌐 {i.website}</span>}
                    </div>
                  )}
                  
                  <div className="text-[9px] text-white/40 border-t border-white/5 pt-2 font-bold uppercase"><span className="text-blue-400">Eligibility:</span> {i.eligibility}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedByOrg).length === 0 && (
          <p className="text-xs text-white/40 text-center py-6">No support schemes found in this category.</p>
        )}
      </div>
    </div>
  );
};
