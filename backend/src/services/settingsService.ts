import { IUnitOfWork } from '../repositories/interfaces.js';
import { Setting } from '../types/domain.js';

export interface FirmSettingsConfig {
  autoProcessConfidence: number;
  reviewConfidence: number;
  defaultTimezone: string;
  defaultPeriodFormat: string;
  enableReminders: boolean;
}

export class SettingsService {
  constructor(private uow: IUnitOfWork) {}

  async getFirmConfig(firm_id: string): Promise<FirmSettingsConfig> {
    const allSettings = await this.uow.settings.findAll(firm_id);
    const settingsMap = new Map(allSettings.map(s => [s.setting_key, s.setting_value]));

    const autoProcessConfidence = parseFloat(settingsMap.get('AUTO_PROCESS_CONFIDENCE') || '0.95');
    const reviewConfidence = parseFloat(settingsMap.get('REVIEW_CONFIDENCE') || '0.80');
    const defaultTimezone = settingsMap.get('DEFAULT_TIMEZONE') || 'Asia/Kolkata';
    const defaultPeriodFormat = settingsMap.get('DEFAULT_PERIOD_FORMAT') || 'YYYY-MM';
    const enableReminders = settingsMap.get('ENABLE_REMINDERS') !== 'false';

    return {
      autoProcessConfidence: isNaN(autoProcessConfidence) ? 0.95 : autoProcessConfidence,
      reviewConfidence: isNaN(reviewConfidence) ? 0.80 : reviewConfidence,
      defaultTimezone,
      defaultPeriodFormat,
      enableReminders
    };
  }

  async getAllSettings(firm_id: string): Promise<Setting[]> {
    return this.uow.settings.findAll(firm_id);
  }

  async updateSetting(firm_id: string, setting_key: string, setting_value: string, updated_by = 'CA Partner'): Promise<Setting | null> {
    const updated = await this.uow.settings.update(firm_id, setting_key, setting_value, updated_by);
    if (updated) {
      await this.uow.auditLogs.append({
        log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        firm_id,
        timestamp: new Date().toISOString(),
        user: updated_by,
        action: 'SETTING_UPDATED',
        entity_type: 'Setting',
        entity_id: updated.setting_id,
        new_value: JSON.stringify({ [setting_key]: setting_value }),
        reason: 'Firm configuration change'
      });
    }
    return updated;
  }
}
