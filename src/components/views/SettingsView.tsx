import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save, AlertTriangle } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';
import type { Setting } from '../../types';

export const SettingsView: React.FC = () => {
  const { isLoaded } = useDataSync();
  const [settingsList, setSettingsList] = useState<Setting[]>(dataService.getSettings());
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const liveSettings = dataService.getSettings();
    if (liveSettings.length > 0) {
      setSettingsList(liveSettings);
    }
  }, [isLoaded, dataService.getSettings()]);

  const handleToggle = (settingId: string) => {
    setSettingsList((prev) =>
      prev.map((s) => {
        if (s.setting_id === settingId) {
          const newVal = s.setting_value === 'TRUE' ? 'FALSE' : 'TRUE';
          return { ...s, setting_value: newVal };
        }
        return s;
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    let allOk = true;
    try {
      for (const s of settingsList) {
        const ok = await dataService.updateSetting(s.setting_key, s.setting_value, 'CA Partner');
        if (!ok) allOk = false;
      }
      if (allOk) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setErrorMessage('One or more settings could not be saved to backend.');
      }
    } catch {
      setErrorMessage('Failed to connect to backend service.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B231F] font-display">
            Practice & AI Determinism Settings
          </h1>
          <p className="text-xs text-[#7A7169] mt-0.5">
            Configure firm compliance thresholds, AI review boundaries, and partner approval requirements
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !isLoaded}
          className="px-4 py-2 rounded-xl bg-[#3D2D22] disabled:bg-[#8C827A] hover:bg-[#261B14] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
              <span>Saved Successfully</span>
            </>
          ) : isSaving ? (
            <>
              <Save className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#991B1B] flex items-center gap-2 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      {!isLoaded ? (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 shadow-card space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 pb-4 border-b border-[#F5F2EC]">
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-[#EAE6DD] rounded w-1/4" />
                <div className="h-2.5 bg-[#F5F2EC] rounded w-1/2" />
              </div>
              <div className="w-12 h-6 bg-[#EAE6DD] rounded-full" />
            </div>
          ))}
        </div>
      ) : settingsList.length > 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-card divide-y divide-[#F5F2EC]">
          {settingsList.map((setting) => (
            <div
              key={setting.setting_id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors"
            >
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#2B231F]">
                    {setting.setting_key}
                  </span>
                  <span className="text-[10px] font-semibold uppercase bg-[#FAF8F5] text-[#8C8077] px-2 py-0.5 rounded border border-[#EAE6DF]">
                    {setting.category}
                  </span>
                </div>
                <p className="text-xs text-[#5C5148] mt-1 leading-relaxed">
                  {setting.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                {setting.setting_value === 'TRUE' || setting.setting_value === 'FALSE' ? (
                  <button
                    onClick={() => handleToggle(setting.setting_id)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
                      setting.setting_value === 'TRUE' ? 'bg-[#3D2D22] justify-end' : 'bg-[#DDD7CB] justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                ) : (
                  <input
                    type="text"
                    value={setting.setting_value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettingsList((prev) =>
                        prev.map((s) => (s.setting_id === setting.setting_id ? { ...s, setting_value: val } : s))
                      );
                    }}
                    className="w-36 text-xs font-mono font-semibold px-2.5 py-1.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-[#2B231F] outline-none focus:border-[#8E6F58]"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-10 text-center text-xs text-[#8C827A] shadow-card">
          No configurable practice settings found.
        </div>
      )}
    </div>
  );
};
