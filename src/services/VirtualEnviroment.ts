import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class VirtualEnvironment {
    private projectPath: string;
    private configPath: string;
    private activeExtensions: Set<string>;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.configPath = path.join(this.projectPath, '.vscode', 'virtual-env-config.json');
        this.activeExtensions = new Set();
        this.loadConfig();
    }

    private loadConfig() {
        if (fs.existsSync(this.configPath)) {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            this.activeExtensions = new Set(config.activeExtensions || []);
        }
    }

    private saveConfig() {
        const config = { activeExtensions: Array.from(this.activeExtensions) };
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    public async applyProfile(extensions: { id: string, isEnabled: boolean }[]) {
        for (const ext of extensions) {
            if (ext.isEnabled) {
                this.activeExtensions.add(ext.id);
            } else {
                this.activeExtensions.delete(ext.id);
            }
        }
        this.saveConfig();
        await this.updateExtensionStates();
    }

    private async updateExtensionStates() {
        for (const extension of vscode.extensions.all) {
            if (this.activeExtensions.has(extension.id)) {
                await vscode.commands.executeCommand('workbench.extensions.enableExtension', extension.id);
            } else {
                await vscode.commands.executeCommand('workbench.extensions.disableExtension', extension.id);
            }
        }
    }

    public isExtensionEnabled(extensionId: string): boolean {
        return this.activeExtensions.has(extensionId);
    }
}