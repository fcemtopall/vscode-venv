import * as fs from 'fs';
import * as path from 'path';

export class LocalizationManager {
    private static instance: LocalizationManager;
    private strings: { [key: string]: string } = {};

    private constructor() {
        this.loadLanguage('en'); // Default to English
    }

    public static getInstance(): LocalizationManager {
        if (!LocalizationManager.instance) {
            LocalizationManager.instance = new LocalizationManager();
        }
        return LocalizationManager.instance;
    }

    private loadLanguage(lang: string) {
        const filePath = path.join(__dirname, '..', 'localization', `${lang}.json`);
        if (fs.existsSync(filePath)) {
            this.strings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            console.error(`Language file not found: ${filePath}`);
        }
    }

    public getString(key: string, ...params: string[]): string {
        let value = this.strings[key] || key;
        params.forEach((param, index) => {
            value = value.replace(`{${index}}`, param);
        });
        return value;
    }
}