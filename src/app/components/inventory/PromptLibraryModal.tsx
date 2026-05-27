import { useState, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROMPT_LIBRARY, PROMPT_CATEGORIES } from '../../../data/inventory/prompts';
import { PromptEntry } from '../../../data/inventory/types';
import { cn } from '../../../lib/utils';
import { Button } from '../ui/button';

const ROBOTO = "font-['Roboto']";

const GENAI_ICON = (
  <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
    <path
      d="M8.125 20.2084H11.0417M8.125 15.0001H12.7083M8.125 9.79175H21.875M19.1667 13.7501L20.4167 16.2501L22.9167 17.5001L20.4167 18.7501L19.1667 21.2501L17.9167 18.7501L15.4167 17.5001L17.9167 16.2501L19.1667 13.7501"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface PromptLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (prompt: string) => void;
}

export function PromptLibraryModal({ open, onClose, onInsert }: PromptLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = PROMPT_LIBRARY.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleInsert = useCallback(() => {
    const entry = PROMPT_LIBRARY.find(p => p.id === selectedId);
    if (entry) {
      onInsert(entry.prompt);
      onClose();
      setSelectedId(null);
    }
  }, [selectedId, onInsert, onClose]);

  const handleClose = () => {
    onClose();
    setSelectedId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-[1000px] max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
                <div className="text-[#6356e1]">{GENAI_ICON}</div>
                <h2 className={cn("text-[16px] font-medium text-[#1f1d25] tracking-[0.15px] flex-1", ROBOTO)}>
                  GenAI Prompt Library
                </h2>
                <button onClick={handleClose} className="p-1 rounded-md hover:bg-accent transition-colors text-[#686476]">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <div className="w-[200px] shrink-0 border-r border-border p-3 flex flex-col gap-1">
                  <CategoryBtn
                    active={activeCategory === 'all'}
                    onClick={() => setActiveCategory('all')}
                    icon={<div className="text-[#686476]">{GENAI_ICON}</div>}
                    label="All Prompts"
                  />
                  {PROMPT_CATEGORIES.map(cat => (
                    <CategoryBtn
                      key={cat.id}
                      active={activeCategory === cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      icon={<div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />}
                      label={cat.label}
                    />
                  ))}
                </div>

                {/* Main */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Search + hint */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                    <p className={cn("text-[12px] text-[#686476]", ROBOTO)}>
                      Select a prompt template to insert
                    </p>
                    <div className="flex items-center gap-2 bg-[#f3f3f5] rounded-lg px-3 py-1.5 w-48">
                      <Search size={13} className="text-[#9c99a9] shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        className={cn("bg-transparent text-[13px] text-[#374151] placeholder-[#9c99a9] outline-none flex-1 min-w-0", ROBOTO)}
                      />
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {filtered.length === 0 ? (
                      <p className={cn("text-[13px] text-[#686476] text-center py-8", ROBOTO)}>
                        No prompts match your search.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {filtered.map(entry => (
                          <PromptCard
                            key={entry.id}
                            entry={entry}
                            selected={selectedId === entry.id}
                            onSelect={() => setSelectedId(id => id === entry.id ? null : entry.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
                <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={handleInsert}
                  disabled={!selectedId}
                  className="bg-[#473bab] hover:bg-[#3c3192] text-white"
                >
                  Insert Prompt
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CategoryBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left w-full",
        "font-['Roboto']",
        active ? 'bg-[#473bab]/10 text-[#473bab] font-medium' : 'text-[#374151] hover:bg-accent',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PromptCard({ entry, selected, onSelect }: { entry: PromptEntry; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'text-left p-3 rounded-lg border transition-all',
        selected
          ? 'border-[#6356e1] bg-[#473bab]/[0.08] ring-2 ring-[#6356e1]/30'
          : 'border-border bg-[#f9fafa] hover:border-[#473bab]/40 hover:bg-white',
      )}
    >
      <p className={cn(
        "text-[13px] font-medium tracking-[0.1px] mb-1 font-['Roboto']",
        selected ? 'text-[#473bab]' : 'text-[#1f1d25]',
      )}>
        {entry.title}
      </p>
      <p className="text-[11px] text-[#686476] font-['Roboto'] leading-[1.5] line-clamp-2">
        {entry.description}
      </p>
    </button>
  );
}
