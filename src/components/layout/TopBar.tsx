import React, { useState } from 'react';
import { Search, Bell, ChevronDown, CheckCircle2 } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenCopilot: () => void;
  notificationCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  notificationCount = 3,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const openAlerts = dataService.getAlerts('Open');
  const liveDocs = dataService.getDocuments();

  return (
    <header className="h-16 bg-[#FAF8F5] border-b border-[#EAE6DF] px-8 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="w-full bg-[#FFFFFF] border border-[#E4DFD6] hover:border-[#C4B7AA] transition-colors rounded-xl px-3.5 py-2 flex items-center justify-between text-left text-xs text-[#857B72] shadow-xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-[#9E948B] group-hover:text-[#2B231F] transition-colors" />
            <span className="font-normal text-[12.5px] text-[#7A7169]">
              Search clients, documents, or ask CA Copilot...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 font-sans font-medium text-[10px] text-[#7A7169] bg-[#F5F2EC] px-1.5 py-0.5 rounded border border-[#E2DDD5]">
            <span className="text-xs">⌘</span> K
          </kbd>
        </button>
      </div>

      {/* Right Utility Items */}
      <div className="flex items-center gap-4 ml-6 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-[#EAE6DF] bg-white hover:bg-[#F7F4EE] flex items-center justify-center text-[#5C5148] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-[#EAE6DF] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-[#EAE6DF] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2B231F]">
                  Intake Notifications
                </span>
                <span className="text-[10px] bg-[#EFF6FF] text-[#1D4ED8] font-medium px-2 py-0.5 rounded-full">
                  {openAlerts.length} active
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#F5F2EC]">
                {openAlerts.map((alert) => (
                  <div key={alert.alert_id} className="p-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#DC2626] mt-1 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-[#2B231F]">
                          {alert.client_id}: {alert.document_type}
                        </p>
                        <p className="text-[11px] text-[#8C827A] mt-0.5 line-clamp-1">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {liveDocs.slice(0, 2).map((doc) => (
                  <div key={doc.document_id} className="p-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-[#2B231F]">
                          {doc.document_type} Validated
                        </p>
                        <p className="text-[11px] text-[#8C827A] mt-0.5">
                          {doc.filename} ({doc.period})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-[#EAE6DF] text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-brand-600 hover:text-brand-800 font-medium"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 pr-2 rounded-xl hover:bg-[#EDE8DF]/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D5C2B4] shadow-xs bg-[#EAE6DD] flex items-center justify-center text-xs font-semibold text-[#40382D]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="CA Biju"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text initials if image network is unavailable
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="sr-only">CA Biju</span>
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[12px] font-semibold text-[#2B231F] leading-tight">
                CA Biju
              </div>
              <div className="text-[10.5px] text-[#8C827A] font-normal leading-tight">
                Partner
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C827A] ml-0.5" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-modal border border-[#EAE6DF] py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-[#EAE6DF]">
                <p className="font-semibold text-[#2B231F]">CA Biju Sharma, FCA</p>
                <p className="text-[11px] text-[#8C827A]">biju@vertexca.in</p>
                <div className="mt-1 text-[10px] bg-[#FAF8F5] text-brand-700 px-1.5 py-0.5 rounded border border-[#EAE6DF] inline-block font-mono">
                  Membership #084920
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3.5 py-1.5 text-[#5C5148] hover:bg-[#FAF9F6] transition-colors"
                >
                  Firm Practice Settings
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3.5 py-1.5 text-[#5C5148] hover:bg-[#FAF9F6] transition-colors"
                >
                  Partner Delegations
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3.5 py-1.5 text-[#5C5148] hover:bg-[#FAF9F6] transition-colors"
                >
                  Audit Log Export
                </button>
              </div>
              <div className="pt-1 border-t border-[#EAE6DF]">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3.5 py-1.5 text-[#DC2626] hover:bg-[#FDF2F2] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
