import { useTranslation } from '../contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleButtonProps {
  active?: boolean;
}

export function LanguageToggleButton({ active = true }: LanguageToggleButtonProps) {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    if (!active) return;
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  // The button text on the EN screen = "FR"
  // The button text on the FR screen = "EN"
  const label = language === 'en' ? 'FR' : 'EN';

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "content-stretch flex flex-col items-center justify-center px-[3px] py-[2px] relative rounded-[4px] shrink-0 h-[22px] w-[28px] transition-all group cursor-pointer",
        active ? "hover:bg-black/5 opacity-100" : "opacity-50"
      )}
      data-name="Translation <Icon>"
    >
      <div 
        aria-hidden="true" 
        className={cn(
          "absolute border border-[rgba(17,16,20,0.56)] border-solid inset-0 pointer-events-none rounded-[4px]",
          active && "group-hover:border-[rgba(17,16,20,0.8)]"
        )}
      />
      <div 
        className={cn(
          "flex flex-col font-['Roboto',sans-serif] font-normal justify-center items-center leading-none relative shrink-0 text-[12px] text-[rgba(17,16,20,0.56)] text-center tracking-[0.17px] whitespace-nowrap",
          active && "group-hover:text-[rgba(17,16,20,0.8)]"
        )}
      >
        <p className="leading-none">{label}</p>
      </div>
    </button>
  );
}
