export type TechnicalSettings = {
  enableSandboxProtection: boolean;
};

const defaultSettings: TechnicalSettings = {
  enableSandboxProtection: false, // Default to false
};

export class TechnicalSettingsService {
  private static readonly STORAGE_KEY = 'lunastream-technical-settings';

  static getSettings(): TechnicalSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to read technical settings, using defaults.", error);
    }
    // If nothing is stored or parsing fails, save and return default settings
    this.saveSettings(defaultSettings);
    return defaultSettings;
  }

  static saveSettings(settings: Partial<TechnicalSettings>): void {
    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save technical settings.", error);
    }
  }
}

export const defaultTechnicalSettings = defaultSettings;