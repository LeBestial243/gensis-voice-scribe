
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  selectedTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, selectedTab, onChange, className }: AnimatedTabsProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl p-1 bg-white/80 backdrop-blur-sm shadow-inner border border-white/20", className)}>
      <div className="flex relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 relative z-10 py-3 px-4 rounded-xl text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2",
              selectedTab === tab.id 
                ? "text-white" 
                : "text-gensys-primary-to hover:text-gensys-primary-to/80"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        
        {/* Animated indicator */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to rounded-xl shadow-md transition-all duration-300 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${tabs.findIndex(t => t.id === selectedTab) * 100}%)`
          }}
        />
      </div>
    </div>
  );
}
