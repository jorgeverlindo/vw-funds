import { useState, useEffect, useRef } from 'react';
import svgPaths from '@/imports/svg-kh2cdc4deu';
import imgAvatar from 'figma:asset/f0494d5017440bdc302141d9ab01c7c81e4a339a.png';
import { NotificationOverlay } from './notifications/NotificationOverlay';
import { NotificationOverlayOEM } from './notifications/NotificationOverlayOEM';
import { cn } from '@/lib/utils';
import { LanguageToggleButton } from './LanguageToggleButton';
import { useTranslation } from '../contexts/LanguageContext';

interface TopNavBarProps {
  userType?: 'dealer' | 'oem';
  onOpenOEMDrawer?: () => void;
  languageToggleActive?: boolean;
  onOpenAgentPane?: () => void;
  isAgentPaneOpen?: boolean;
  onOpenWebMonitoring?: (id: string) => void;
}

export function TopNavBar({ userType = 'dealer', onOpenOEMDrawer, languageToggleActive = false, onOpenAgentPane, isAgentPaneOpen = false, onOpenWebMonitoring }: TopNavBarProps) {
  const { t } = useTranslation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isNotificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen]);

  return (
    <div className="fixed top-0 left-[72px] right-0 h-12 bg-[#F9FAFA] flex items-center z-[100] px-[24px] py-[8px] mt-[8px] mr-[0px] mb-[0px] ml-[0px]">
      {/* Left: Logo */}
      <div className="flex items-center h-8">
        <svg viewBox="0 0 176 32" className="h-full w-auto" fill="none">
          <g>
            <path d={svgPaths.p36d5e100} fill="#1F1D25" />
            <path d={svgPaths.p2eb61a80} fill="#1F1D25" />
            <path d={svgPaths.p3330b700} fill="#1F1D25" />
            <path d={svgPaths.p28d792f0} fill="#1F1D25" />
            <path d={svgPaths.p35f3ae00} fill="#1F1D25" />
            <path d={svgPaths.pb0e0800} fill="#1F1D25" />
            <path d={svgPaths.pfffac00} fill="#1F1D25" />
            <path d={svgPaths.p1ad746f0} fill="#1F1D25" />
            <path d={svgPaths.pf690380} fill="#1F1D25" />
            <path d={svgPaths.p2e033100} fill="#1F1D25" />
            <path d={svgPaths.p1139cb00} fill="#1F1D25" />
            <path d={svgPaths.p34a85580} fill="#1F1D25" />
            <path d={svgPaths.pe1644a0} fill="#1F1D25" />
            <path d={svgPaths.p33151180} fill="#1F1D25" />
            <path d={svgPaths.p83d8200} fill="#1F1D25" />
            <path d={svgPaths.p1f753600} fill="#1F1D25" />
          </g>
        </svg>
      </div>

      {/* Center: Global Search */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px]">
        <div className="bg-white h-[34px] rounded-full flex items-center gap-2 border border-[rgba(0,0,0,0.12)] pt-[0px] pr-[0px] pb-[0px] pl-[8px]">
          <svg className="size-6 text-black/56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d={svgPaths.p103c0600} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder={t('Search anything')}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#9c99a9] placeholder:text-[#9c99a9]"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.currentTarget.select();
              }
            }}
          />
        </div>
      </div>

      {/* Right: Icons + Avatar */}
      <div className="ml-auto flex items-center gap-2 relative">
        <div className="mr-1">
          <LanguageToggleButton active={languageToggleActive} />
        </div>
        {/* AI Sparkle Icon - With Badge */}
        <button
          onClick={userType === 'dealer' ? onOpenAgentPane : undefined}
          className={cn(
            "p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer relative group",
            isAgentPaneOpen && userType === 'dealer' && "bg-[#473bab]/10"
          )}
          aria-label="AI Agent"
          aria-expanded={isAgentPaneOpen}
        >
          <div className="size-5">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path clipRule="evenodd" d={svgPaths.pa564600} fill="#111014" fillOpacity="0.56" fillRule="evenodd" />
              <path d={svgPaths.p317531f0} fill="#111014" fillOpacity="0.56" />
              <path d={svgPaths.pd4a3b80} fill="#111014" fillOpacity="0.56" />
            </svg>
          </div>
          {/* Badge: Primary Color (#473bab) with number */}
          <div className="absolute top-[2px] right-[2px] size-[18px] bg-[#473bab] rounded-full border border-white flex items-center justify-center transform translate-x-[25%] -translate-y-[25%]">
            <span className="text-white text-[10px] font-medium leading-none">1</span>
          </div>
        </button>

        {/* Message/Chat Icon */}
        <button className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer relative group">
          <div className="size-5">
            <svg className="block size-full" fill="none" viewBox="0 0 20 20">
              <path d={svgPaths.p14bf2500} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
            </svg>
          </div>
        </button>

        {/* Bell/Notification Icon - With Badge */}
        <div className="relative">
          <button 
            ref={bellRef}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={cn(
              "p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer relative group",
              isNotificationOpen && "bg-black/5"
            )}
          >
            <div className="size-5">
              <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                <path d={svgPaths.p2d90c980} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
              </svg>
            </div>
            {/* Badge: Primary Color (#473bab) with number */}
            <div className="absolute top-[2px] right-[2px] size-[18px] bg-[#473bab] rounded-full border border-white flex items-center justify-center transform translate-x-[25%] -translate-y-[25%]">
              <span className="text-white text-[10px] font-medium leading-none">1</span>
            </div>
          </button>

          {/* Overlay */}
          <div ref={notificationRef} className="absolute top-full right-0 z-50 pt-2">
             {userType === 'oem' ? (
                <NotificationOverlayOEM
                  isOpen={isNotificationOpen} 
                  onClose={() => setIsNotificationOpen(false)}
                  onOpenDrawer={onOpenOEMDrawer || (() => {})}
                  onOpenWebMonitoring={onOpenWebMonitoring || (() => {})}
                />
             ) : (
                <NotificationOverlay 
                  isOpen={isNotificationOpen} 
                  onClose={() => setIsNotificationOpen(false)} 
                />
             )}
          </div>
        </div>

        {/* Settings/Gear Icon */}
        <button className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer group">
          <div className="size-5">
            <svg className="block size-full" fill="none" viewBox="0 0 20 20">
              <path d={svgPaths.p3f764900} stroke="#111014" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
              <path d={svgPaths.p32a6a700} stroke="#111014" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
            </svg>
          </div>
        </button>

        {/* Avatar */}
        <div className="size-8 rounded-full overflow-hidden ml-2 cursor-pointer">
          <img src={imgAvatar} alt="" className="size-full object-cover" />
        </div>
      </div>
    </div>
  );
}