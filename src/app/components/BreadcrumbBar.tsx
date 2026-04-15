import { useTranslation } from '../contexts/LanguageContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbBarProps {
  /** Ancestor segments — rendered as muted text (clickable if href provided) */
  items: BreadcrumbItem[];
  /** Active tab label — appended as the last non-linked segment */
  activeLabel: string;
}

const ChevronIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-[#686576] shrink-0"
    fill="currentColor"
    viewBox="0 0 14 14"
    aria-hidden="true"
  >
    <path d="M5.5 3.5L9 7l-3.5 3.5" />
  </svg>
);

/**
 * BreadcrumbBar — renders a full breadcrumb trail driven by props.
 * The last segment is always the active tab (non-linked, visually distinct).
 * Accessibility: nav[aria-label="Breadcrumb"], last item has aria-current="page".
 */
export function BreadcrumbBar({ items, activeLabel }: BreadcrumbBarProps) {
  const { t, language } = useTranslation();
  const translate = (s: string) => (language === 'fr' ? t(s) : s);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronIcon />}
            {item.href ? (
              <a
                href={item.href}
                className="text-[11px] text-[#686576] font-normal tracking-[0.4px] hover:text-[#1f1d25] transition-colors"
              >
                {translate(item.label)}
              </a>
            ) : (
              <span className="text-[11px] text-[#686576] font-normal tracking-[0.4px]">
                {translate(item.label)}
              </span>
            )}
          </li>
        ))}

        {/* Active segment — always present */}
        <li className="flex items-center gap-1" aria-current="page">
          <ChevronIcon />
          <span className="text-[11px] text-[#1f1d25] font-normal tracking-[0.4px]">
            {translate(activeLabel)}
          </span>
        </li>
      </ol>
    </nav>
  );
}
