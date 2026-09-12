import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, ChevronRight } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';
import { ClientAvatar } from '../common/ClientAvatar';

export const ClientsView: React.FC = () => {
  useDataSync();
  const [searchTerm, setSearchTerm] = useState('');
  const clients = dataService.getClients();

  const filteredClients = clients.filter(
    (c) =>
      c.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.assigned_ca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
            Client Directory
          </h1>
          <p className="text-xs text-[#7A7169] mt-0.5">
            {clients.length} Managed Business Entities under Vertex & Associates compliance roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-xl bg-[#3D2D22] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#261B14] transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Entity</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by legal name, entity type, or assigned CA..."
            className="w-full bg-white border border-[#E4DFD6] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2B231F] placeholder-[#9E948B] outline-none focus:border-[#8E6F58]"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.map((c) => (
          <div
            key={c.client_id}
            className="bg-white border border-[#EAE6DF] hover:border-[#C4B7AA] rounded-xl p-4 shadow-card hover:shadow-subtle transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ClientAvatar initials={c.display_name.slice(0, 2)} size="md" />
                  <div>
                    <h3 className="text-[13px] font-bold text-[#2B231F] line-clamp-1 font-display">
                      {c.legal_name}
                    </h3>
                    <span className="text-[10px] font-semibold text-[#8C8077] uppercase tracking-wider">
                      {c.entity_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-[11px] text-[#5C5148] border-t border-[#F5F2EC] pt-2.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-[#8C827A]" />
                  <span className="truncate">{c.primary_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-[#8C827A]" />
                  <span>{c.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#F5F2EC] flex items-center justify-between text-[11px]">
              <span className="text-[#8C827A]">
                Assigned: <strong className="text-[#2B231F]">{c.assigned_ca}</strong>
              </span>
              <span className="text-brand-600 font-semibold flex items-center gap-0.5">
                View Roster <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
