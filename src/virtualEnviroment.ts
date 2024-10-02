import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class VirtualEnvironment {
    private projectPath: string;
    private configPath: string;
    private extensionStates: { [key: string]: boolean } = {};

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.configPath = path.join(this.projectPath, '.vscode', 'virtual-env-config.json');
        this.loadConfig();
    }

    private loadConfig() {
        if (fs.existsSync(this.configPath)) {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            this.extensionStates = config.extensionStates || {};
        }
    }

    private saveConfig() {
        const config = { extensionStates: this.extensionStates };
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    public toggleExtension(extensionId: string) {
        this.extensionStates[extensionId] = !this.extensionStates[extensionId];
        this.saveConfig();
        this.applyExtensionState(extensionId);
    }

    public isExtensionEnabled(extensionId: string): boolean {
        return this.extensionStates[extensionId] !== false; // varsayılan olarak etkin
    }

    private applyExtensionState(extensionId: string) {
        const extension = vscode.extensions.getExtension(extensionId);
        if (extension) {
            if (this.isExtensionEnabled(extensionId)) {
                // Eklentiyi etkinleştir (simüle et)
                vscode.commands.executeCommand('setContext', `${extensionId}:enabled`, true);
            } else {
                // Eklentiyi devre dışı bırak (simüle et)
                vscode.commands.executeCommand('setContext', `${extensionId}:enabled`, false);
            }
        }
    }

    public applyAllExtensionStates() {
        for (const extensionId in this.extensionStates) {
            this.applyExtensionState(extensionId);
        }
    }
}