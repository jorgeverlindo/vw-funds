import React from 'react';
import { motion } from 'motion/react';
import svgPaths from '@/imports/svg-kh2cdc4deu';
import imgBrandLogo from 'figma:asset/92831320399bbc5ee6848b8f47ee2c2fdc72780d.png';
import { useTranslation } from '../contexts/LanguageContext';
import { useClient } from '../contexts/ClientContext';
import audiLogoOEM from '../../assets/logos/Audi.png';
import audiLogoPacific from '../../assets/logos/Audi-Pacific.png';
import vwLogoDealer from '../../assets/logos/Dealer-Jack-Daniels-Volkswagen.png';
import vwLogoOEM from '../../assets/logos/VW-OEM.png';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const VOLKS_LOGO_PATH = "M20 32.3229C13.2414 32.3229 7.70429 26.7586 7.70429 20C7.70429 18.48 7.97571 17.0414 8.49143 15.6843L15.6843 30.1514C15.7657 30.3414 15.9014 30.5043 16.1186 30.5043C16.3357 30.5043 16.4714 30.3414 16.5529 30.1514L19.8643 22.7414C19.8914 22.66 19.9457 22.5786 20.0271 22.5786C20.1086 22.5786 20.1357 22.66 20.19 22.7414L23.5014 30.1514C23.5829 30.3414 23.7186 30.5043 23.9357 30.5043C24.1529 30.5043 24.2886 30.3414 24.37 30.1514L31.5629 15.6843C32.0786 17.0414 32.35 18.48 32.35 20C32.2957 26.7586 26.7586 32.3229 20 32.3229ZM20 17.2043C19.9186 17.2043 19.8914 17.1229 19.8371 17.0414L15.9829 8.35571C17.2314 7.89428 18.5886 7.65 20 7.65C21.4114 7.65 22.7686 7.89428 24.0171 8.35571L20.1629 17.0414C20.1086 17.15 20.0814 17.2043 20 17.2043ZM16.0643 26.1343C15.9829 26.1343 15.9557 26.0529 15.9014 25.9714L9.65857 13.3771C10.7714 11.6671 12.2643 10.2286 14.0829 9.22429L18.5886 19.24C18.6429 19.4029 18.7786 19.4571 18.9143 19.4571H21.0857C21.2486 19.4571 21.3571 19.43 21.4386 19.24L25.9443 9.22429C27.7357 10.2286 29.2557 11.6671 30.3686 13.3771L24.0714 25.9714C24.0443 26.0529 23.99 26.1343 23.9086 26.1343C23.8271 26.1343 23.8 26.0529 23.7457 25.9714L21.3843 20.5971C21.3029 20.4071 21.1943 20.38 21.0314 20.38H18.86C18.6971 20.38 18.5886 20.4071 18.5071 20.5971L16.2271 25.9714C16.2 26.0529 16.1457 26.1343 16.0643 26.1343ZM20 33.5714C27.5186 33.5714 33.5714 27.5186 33.5714 20C33.5714 12.4814 27.5186 6.42857 20 6.42857C12.4814 6.42857 6.42857 12.4814 6.42857 20C6.42857 27.5186 12.4814 33.5714 20 33.5714Z";

/** Returns the correct sidebar logo for the active client + user role */
function ClientLogoImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={40}
      height={40}
      style={{ borderRadius: 4, objectFit: 'cover', display: 'block' }}
    />
  );
}

function NavItem({ icon, label, isActive = false, onClick }: NavItemProps) {
  return (
    <div 
      className="relative w-full rounded-xl shrink-0 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-end size-full">
        <div className="content-stretch flex flex-col gap-2 items-center justify-end pb-[3px] pt-[7px] px-4 relative w-full">
          {/* Hover/Active background */}
          {isActive ? (
             <motion.div
              layoutId="nav-pill"
              className="absolute flex h-8 items-center justify-center left-1/2 top-[calc(50%-9px)] translate-x-[-50%] translate-y-[-50%] w-14 z-0"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="bg-[#2f2673] h-8 rounded-full w-14" />
            </motion.div>
          ) : (
            <div className="absolute flex h-8 items-center justify-center left-1/2 top-[calc(50%-9px)] translate-x-[-50%] translate-y-[-50%] w-14 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               <div className="bg-[#2f2673]/10 h-8 rounded-full w-14" />
            </div>
          )}
          
          <div className="relative z-10 size-6">
            {icon}
          </div>
          
          <div className="h-3.5 relative shrink-0 w-full z-10">
            <div className={`absolute flex flex-col font-['Roboto'] ${
              isActive ? 'font-medium' : 'font-normal'
            } justify-center leading-[0] left-1/2 text-[#f9fafa] text-[11px] text-center top-[7px] tracking-[0.4px] translate-x-[-50%] translate-y-[-50%]`}>
              <p className="leading-[1.66]">{label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AppSidebarProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  userType?: 'dealer' | 'oem';
  onToggleUserType?: () => void;
  onOpenClientSwitcher?: () => void;
  clientSwitcherOpen?: boolean;
}

export function AppSidebar({
  activeRoute = 'campaigns',
  onNavigate,
  userType = 'dealer',
  onToggleUserType: _onToggleUserType,
  onOpenClientSwitcher,
  clientSwitcherOpen = false,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const { client } = useClient();

  // Client + role → correct logo PNG
  const clientLogo = client.clientId === 'audi' ? (
    userType === 'oem'
      ? <ClientLogoImg src={audiLogoOEM}    alt="Audi" />
      : <ClientLogoImg src={audiLogoPacific} alt="Audi Pacific" />
  ) : client.clientId === 'vw' ? (
    userType === 'oem'
      ? <ClientLogoImg src={vwLogoOEM}    alt="Volkswagen" />
      : <ClientLogoImg src={vwLogoDealer} alt="Jack Daniels Volkswagen" />
  ) : (
    // Fallback — Constellation brand logo for any other client
    <div className="bg-white overflow-clip relative rounded size-10">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute bg-[#0c1b44] inset-0" />
        <img alt="" className="absolute max-w-none object-contain size-full" src={imgBrandLogo} />
      </div>
    </div>
  );

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[72px] bg-[#1e1a42] flex flex-col items-center z-50 isolate">
      {/* Logo Container — click opens Client Switcher */}
      <div className="h-[60px] relative shrink-0 w-full z-[4]">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex items-center justify-center px-[11px] py-1 relative size-full">
            <div
              className={`relative cursor-pointer transition-transform active:scale-95 size-10 ${clientSwitcherOpen ? 'ring-2 ring-[#ACABFF] ring-offset-2 ring-offset-[#1e1a42] rounded-[4px]' : ''}`}
              onClick={onOpenClientSwitcher}
              title="Switch Client"
            >
              {clientLogo}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 min-h-px min-w-px relative w-full z-[2]">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col gap-3 items-center pb-0 pt-4 px-[3px] relative size-full">
            
            {/* Projects */}
            <NavItem
              icon={
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p1f93db00} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              }
              label={t('Projects')}
              isActive={activeRoute === 'projects'}
              onClick={() => onNavigate?.('projects')}
            />

            {/* Feeds */}
            <NavItem
              icon={
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={svgPaths.p290cdd00} fill="#ACABFF" fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths.p3286e280} fill="#ACABFF" fillRule="evenodd" />
                  <path d={svgPaths.p3dd0de00} fill="#ACABFF" />
                </svg>
              }
              label={t('Feeds')}
              isActive={activeRoute === 'feeds'}
              onClick={() => onNavigate?.('feeds')}
            />

            {/* Design */}
            <NavItem
              icon={
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p8b9ee80} stroke="#ACABFF" strokeWidth="1.5" />
                  <path d={svgPaths.p2fd4e00} fill="#ACABFF" />
                  <path d={svgPaths.p23bcec00} fill="#ACABFF" />
                  <path d={svgPaths.p1ed05480} fill="#ACABFF" />
                </svg>
              }
              label={t('Design')}
              isActive={activeRoute === 'design'}
              onClick={() => onNavigate?.('design')}
            />

            {/* Portal */}
            <NavItem
              icon={
                <div className="absolute inset-[4.17%_4.86%_6.94%_6.25%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.3333 21.3333">
                    <path d={svgPaths.p33b0c580} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </div>
              }
              label="Portal"
              isActive={activeRoute === 'portal'}
              onClick={() => onNavigate?.('portal')}
            />

            {/* Campaigns - ACTIVE */}
            <NavItem
              icon={
                <div className="absolute inset-[20.83%_0_17.66%_8.33%]">
                  <div className="absolute inset-[-5.08%_-3.41%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.5 16.2634">
                      <path d={svgPaths.p6a9aff2} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.p1ff36380} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M19.911 7.62518H22.75" stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.p25f77780} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              }
              label={t('Campaigns')}
              isActive={activeRoute === 'campaigns'}
              onClick={() => onNavigate?.('campaigns')}
            />

            {/* Inventory */}
            <NavItem
              icon={
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.pdab3700} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              }
              label={t('Inventory')}
              isActive={activeRoute === 'inventory'}
              onClick={() => onNavigate?.('inventory')}
            />

            {/* Insights */}
            <NavItem
              icon={
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p3aea4280} stroke="#ACABFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                </svg>
              }
              label={t('Insights')}
              isActive={activeRoute === 'insights'}
              onClick={() => onNavigate?.('insights')}
            />

            {/* AI Tools */}
            <NavItem
              icon={
                <div className="absolute left-1/2 size-6 top-1/2 translate-x-[-50%] translate-y-[-50%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d={svgPaths.pa564600} fill="#ACABFF" fillRule="evenodd" />
                    <path d={svgPaths.p317531f0} fill="#ACABFF" />
                    <path d={svgPaths.pd4a3b80} fill="#ACABFF" />
                  </svg>
                </div>
              }
              label={t('AI Tools')}
              isActive={activeRoute === 'ai-tools'}
              onClick={() => onNavigate?.('ai-tools')}
            />
          </div>
        </div>
      </nav>

      {/* Help button */}
      <div className="content-stretch flex flex-col gap-4 items-center justify-center relative shrink-0 w-full z-[1] pb-6">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="#ACABFF" strokeWidth="1.5">
          <path d={svgPaths.p25dcf140} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}