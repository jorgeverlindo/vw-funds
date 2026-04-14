import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex items-end h-[41px] border-b border-[rgba(0,0,0,0.12)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-2 text-[14px] font-medium tracking-[0.4px] leading-6 capitalize transition-colors cursor-pointer ${
            activeTab === tab.id
              ? 'text-[#473bab]'
              : 'text-[#686576] hover:text-[#473bab]/70'
          }`}
        >
          {tab.label}
          
          {/* Active indicator */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#473BAB]" />
          )}
        </button>
      ))}
    </div>
  );
}