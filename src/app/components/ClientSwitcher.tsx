import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import audiLogoOEM from '../../assets/logos/Audi.png';

// ─── Logos ─────────────────────────────────────────────────────────────────

const VW_LOGO_PATH =
  "M20 32.3229C13.2414 32.3229 7.70429 26.7586 7.70429 20C7.70429 18.48 7.97571 17.0414 8.49143 15.6843L15.6843 30.1514C15.7657 30.3414 15.9014 30.5043 16.1186 30.5043C16.3357 30.5043 16.4714 30.3414 16.5529 30.1514L19.8643 22.7414C19.8914 22.66 19.9457 22.5786 20.0271 22.5786C20.1086 22.5786 20.1357 22.66 20.19 22.7414L23.5014 30.1514C23.5829 30.3414 23.7186 30.5043 23.9357 30.5043C24.1529 30.5043 24.2886 30.3414 24.37 30.1514L31.5629 15.6843C32.0786 17.0414 32.35 18.48 32.35 20C32.2957 26.7586 26.7586 32.3229 20 32.3229ZM20 17.2043C19.9186 17.2043 19.8914 17.1229 19.8371 17.0414L15.9829 8.35571C17.2314 7.89428 18.5886 7.65 20 7.65C21.4114 7.65 22.7686 7.89428 24.0171 8.35571L20.1629 17.0414C20.1086 17.15 20.0814 17.2043 20 17.2043ZM16.0643 26.1343C15.9829 26.1343 15.9557 26.0529 15.9014 25.9714L9.65857 13.3771C10.7714 11.6671 12.2643 10.2286 14.0829 9.22429L18.5886 19.24C18.6429 19.4029 18.7786 19.4571 18.9143 19.4571H21.0857C21.2486 19.4571 21.3571 19.43 21.4386 19.24L25.9443 9.22429C27.7357 10.2286 29.2557 11.6671 30.3686 13.3771L24.0714 25.9714C24.0443 26.0529 23.99 26.1343 23.9086 26.1343C23.8271 26.1343 23.8 26.0529 23.7457 25.9714L21.3843 20.5971C21.3029 20.4071 21.1943 20.38 21.0314 20.38H18.86C18.6971 20.38 18.5886 20.4071 18.5071 20.5971L16.2271 25.9714C16.2 26.0529 16.1457 26.1343 16.0643 26.1343ZM20 33.5714C27.5186 33.5714 33.5714 27.5186 33.5714 20C33.5714 12.4814 27.5186 6.42857 20 6.42857C12.4814 6.42857 6.42857 12.4814 6.42857 20C6.42857 27.5186 12.4814 33.5714 20 33.5714Z";

function VWLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="4" fill="white" />
      <path d={VW_LOGO_PATH} fill="#1F1D25" />
    </svg>
  );
}

/** Audi logo for the switcher list — always shows OEM (4 black rings on white) */
function AudiLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={audiLogoOEM}
      alt="Audi"
      width={size}
      height={size}
      style={{ borderRadius: 4, objectFit: 'cover', display: 'block' }}
    />
  );
}

function InitialsAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-[4px] bg-[#3a3a3a] flex items-center justify-center text-white font-medium font-['Roboto'] select-none shrink-0"
    >
      {initials}
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────

interface ClientEntry {
  id: string;
  name: string;
  active: boolean;
}

const RECENT_CLIENTS: ClientEntry[] = [
  { id: 'audi', name: 'Audi', active: true },
  { id: 'vw',   name: 'Volkswagen', active: true },
];

const ALL_CLIENTS: ClientEntry[] = [
  { id: 'jlr-demo',    name: 'JLR DEMO', active: false },
  { id: 'abc-test',    name: 'ABC Test', active: false },
  { id: 'abc-agency',  name: 'ABC test agency', active: false },
  { id: 'adrianAuto1', name: 'Adrian automotive test 1', active: false },
  { id: 'adrianEmer',  name: 'Adrian emerging test 1', active: false },
  { id: 'adrianPhr',   name: 'Adrian phrma test 1', active: false },
  { id: 'adriantest5', name: 'adriantest5', active: false },
  { id: 'adriantst4',  name: 'adriantesting 4', active: false },
  { id: 'adrianNew',   name: 'Adrian test new client update name', active: false },
  { id: 'adrianPrev',  name: 'Adrian test preview', active: false },
];

// ─── ClientRow ──────────────────────────────────────────────────────────────

function ClientRow({
  entry,
  currentClientId,
  onSelect,
}: {
  entry: ClientEntry;
  currentClientId: string;
  onSelect: (id: string) => void;
}) {
  const isSelected = entry.id === currentClientId;

  const logo =
    entry.id === 'vw' ? (
      <VWLogo size={32} />
    ) : entry.id === 'audi' ? (
      <AudiLogo size={32} />
    ) : (
      <InitialsAvatar name={entry.name} size={32} />
    );

  return (
    <div
      onClick={() => entry.active && onSelect(entry.id)}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        entry.active
          ? "cursor-pointer hover:bg-white/10"
          : "cursor-not-allowed opacity-40",
        isSelected && entry.active && "bg-white/10",
      )}
    >
      <div className="shrink-0">{logo}</div>
      <span
        className="text-white text-[13px] font-normal font-['Roboto'] tracking-[0.15px] leading-tight truncate"
      >
        {entry.name}
      </span>
      {isSelected && entry.active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ACABFF] shrink-0" />
      )}
    </div>
  );
}

// ─── ClientSwitcher ─────────────────────────────────────────────────────────

interface ClientSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentClientId: string;
  onSelect: (clientId: string) => void;
}

export function ClientSwitcher({ isOpen, onClose, currentClientId, onSelect }: ClientSwitcherProps) {
  const [query, setQuery] = useState('');

  const filtered = (entries: ClientEntry[]) =>
    query.trim() === ''
      ? entries
      : entries.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (click outside to close) */}
          <div
            className="fixed inset-0 z-[105]"
            onClick={onClose}
          />

          {/* Panel — z-[110] sits above TopNavBar z-[100] */}
          <motion.div
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed left-[72px] top-0 bottom-0 w-[240px] bg-[#1e1a42] z-[110] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 h-[60px] shrink-0 border-b border-white/10">
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-0.5"
                aria-label="Close"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-white font-semibold text-[14px] font-['Roboto'] tracking-[0.1px]">
                Switch Client
              </span>
            </div>

            {/* Search */}
            <div className="px-3 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <Search size={14} className="text-white/50 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="search"
                  className="bg-transparent text-white text-[13px] font-['Roboto'] placeholder-white/40 outline-none flex-1 min-w-0"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {/* Recent Clients */}
              {filtered(RECENT_CLIENTS).length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-medium font-['Roboto'] text-white/40 uppercase tracking-[0.8px]">
                    Recent Clients
                  </p>
                  {filtered(RECENT_CLIENTS).map(entry => (
                    <ClientRow
                      key={entry.id}
                      entry={entry}
                      currentClientId={currentClientId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}

              {/* Divider — hidden while All Clients section is hidden */}
              {/* {filtered(RECENT_CLIENTS).length > 0 && filtered(ALL_CLIENTS).length > 0 && (
                <div className="mx-3 my-2 border-t border-white/12" />
              )} */}

              {/* All Clients — temporarily hidden; data kept in ALL_CLIENTS for future use */}
              {/* {filtered(ALL_CLIENTS).length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[11px] font-medium font-['Roboto'] text-white/40 uppercase tracking-[0.8px]">
                    All Clients
                  </p>
                  {filtered(ALL_CLIENTS).map(entry => (
                    <ClientRow
                      key={entry.id}
                      entry={entry}
                      currentClientId={currentClientId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )} */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
