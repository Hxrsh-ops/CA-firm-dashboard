import React from 'react';
import {
  Home,
  MailCheck,
  Users,
  FileText,
  Bell,
  Clock,
  BarChart2,
  Sparkles,
  Settings,
  ChevronRight,
} from 'lucide-react';

export type NavigationTab = 
  | 'dashboard' 
  | 'inbox' 
  | 'clients' 
  | 'documents' 
  | 'alerts' 
  | 'reminders' 
  | 'reports' 
  | 'copilot' 
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  unreadInboxCount?: number;
  openAlertsCount?: number;
  pendingRemindersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadInboxCount = 8,
  openAlertsCount = 5,
  pendingRemindersCount = 3,
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: Home },
    { id: 'inbox' as NavigationTab, label: 'AI Inbox', icon: MailCheck, badge: unreadInboxCount },
    { id: 'clients' as NavigationTab, label: 'Clients', icon: Users },
    { id: 'documents' as NavigationTab, label: 'Documents', icon: FileText },
    { id: 'alerts' as NavigationTab, label: 'Alerts', icon: Bell, badge: openAlertsCount },
    { id: 'reminders' as NavigationTab, label: 'Reminders', icon: Clock, badge: pendingRemindersCount },
    { id: 'reports' as NavigationTab, label: 'Reports', icon: BarChart2 },
    { id: 'copilot' as NavigationTab, label: 'AI Copilot', icon: Sparkles },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#FAF8F5] border-r border-[#EAE6DF] min-h-screen flex flex-col justify-between select-none shrink-0">
      {/* Brand Header */}
      <div>
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8E6F58] flex items-center justify-center shadow-xs">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[15px] tracking-tight text-[#2B231F] leading-snug">
              CA Copilot
            </div>
            <div className="text-[11px] text-[#8C827A] font-normal leading-none mt-0.5">
              Smarter Compliance
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-0.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#EDE8E1] text-[#2B231F] shadow-xs'
                    : 'text-[#60554E] hover:bg-[#F3EFE9] hover:text-[#2B231F]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#3D2D22]' : 'text-[#7D726A]'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.9}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-full min-w-[20px] text-center leading-none ${
                      isActive
                        ? 'bg-[#382B22] text-[#FAF8F5]'
                        : 'bg-[#82756C] text-[#FAF8F5]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#EAE6DF]/70">
        {/* Firm Profile Card */}
        <div className="bg-[#FFFFFF] border border-[#EAE6DF] rounded-xl p-2.5 flex items-center justify-between shadow-xs hover:border-[#D5C2B4] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#EAE6DD] text-[#40382D] font-bold text-xs flex items-center justify-center shrink-0">
              VA
            </div>
            <div className="truncate text-left">
              <div className="text-[12px] font-semibold text-[#2B231F] truncate group-hover:text-brand-700">
                Vertex & Associates
              </div>
              <div className="text-[10px] text-[#8C827A] truncate">
                Chartered Accountants
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9C907C] shrink-0 group-hover:text-[#2B231F] group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Motivational Subtle Quote */}
        <div className="mt-4 text-center px-1">
          <p className="font-serif italic text-[12px] text-[#93877F] leading-relaxed select-none">
            &ldquo;Compliance today.<br />A stronger tomorrow.&rdquo;
          </p>
        </div>
      </div>
    </aside>
  );
};
