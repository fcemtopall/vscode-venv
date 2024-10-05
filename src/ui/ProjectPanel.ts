import * as vscode from 'vscode';
import { PROJECT_TYPES, GENERAL_DEV_TOOLS } from '../utils/constants';
import { ProjectDetector } from '../services/ProjectDetector';
import { ProfileManager } from '../services/ProfileManager';
import { LocalizationManager } from '../services/LocalizationManager';
import { VirtualEnvironment } from '../services/VirtualEnviroment';

export class ProjectPanel {
    public static currentPanel: ProjectPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _virtualEnvironment: VirtualEnvironment;
    private _profileManager: ProfileManager;    
    private _localization: LocalizationManager;

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );
        this._virtualEnvironment = new VirtualEnvironment(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
        this._profileManager = new ProfileManager(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
        this._localization = LocalizationManager.getInstance();
        this._update('Proje türü algılanıyor...', []);
    }

    public static createOrShow() {
        const l = LocalizationManager.getInstance();
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ProjectPanel.currentPanel) {
            ProjectPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'projectInfo',
            l.getString('projectInfo'),
            column || vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        ProjectPanel.currentPanel = new ProjectPanel(panel);
    }

    public updateContent(projectType: string, extensions: vscode.Extension<any>[]) {
        console.log(`Updating panel content. Project type: ${projectType}`);
        this._update(projectType, extensions);
    }

    private _update(projectType: string, extensions: vscode.Extension<any>[]) {
        const webview = this._panel.webview;
        this._panel.title = this._localization.getString('projectInfo');
        this._panel.webview.html = this._getWebviewContent(projectType, extensions);
    }

    private _getWebviewContent(projectType: string, extensions: vscode.Extension<any>[]) {
        const l = this._localization;
        const customProfileCard = this._createCustomProfileCard();
        const recommendedProfileCard = this._createRecommendedProfileCard(projectType, extensions);

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${l.getString('projectInfo')}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                h1, h2 { color: #333; }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 10px; }
                button { margin-right: 10px; padding: 5px 10px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>${l.getString('projectType')}: ${projectType}</h1>
            ${customProfileCard}
            ${recommendedProfileCard}
            <script>
                const vscode = acquireVsCodeApi();
                function toggleExtension(profileType, extensionId) {
                    vscode.postMessage({ command: 'toggleExtension', profileType, extensionId });
                }
                function createProfile(profileType) {
                    vscode.postMessage({ command: 'createProfile', profileType });
                }
                function applyProfile(profileType) {
                    vscode.postMessage({ command: 'applyProfile', profileType });
                }
            </script>
        </body>
        </html>`;
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'toggleExtension':
                await this._toggleExtension(message.profileType, message.extensionId);
                break;
            case 'createProfile':
                await this._createProfile(message.profileType);
                break;
            case 'applyProfile':
                await this._applyProfile(message.profileType);
                break;
        }
    }

    private async _toggleExtension(profileType: string, extensionId: string) {
        if (profileType === 'custom') {
            this._profileManager.toggleCustomExtension(extensionId);
        } else if (profileType === 'recommended') {
            this._profileManager.toggleRecommendedExtension(extensionId);
        }
        const projectType = await this._detectProjectType();
        this.updateContent(projectType, [...vscode.extensions.all]);
    }

    private async _createProfile(profileType: string) {
        // Implement profile creation logic
    }

    private async _applyProfile(profileType: 'custom' | 'recommended') {
        await this._profileManager.applyProfile(profileType);
        vscode.window.showInformationMessage(`${profileType === 'custom' ? 'Özel' : 'Önerilen'} profil uygulandı.`);
        const projectType = await this._detectProjectType();
        this.updateContent(projectType, [...vscode.extensions.all]);
    }

    private _createCustomProfileCard(): string {
        const l = this._localization;
        const customProfile = this._profileManager.getCustomProfile();
        const extensionList = customProfile.extensions.map(ext => 
            `<li>${ext.name} <button onclick="toggleExtension('custom', '${ext.id}')">${l.getString(ext.isEnabled ? 'disable' : 'enable')}</button></li>`
        ).join('');

        return `
        <div class="card">
            <h2>${l.getString('customProfile')}</h2>
            <ul>${extensionList}</ul>
            <button onclick="createProfile('custom')">${l.getString('addNewExtension')}</button>
            <button onclick="applyProfile('custom')">${l.getString('applyProfile')}</button>
        </div>`;
    }

    private _createRecommendedProfileCard(projectType: string, vscodeExtensions: vscode.Extension<any>[]): string {
        const l = this._localization;
        const recommendedProfile = this._profileManager.getRecommendedProfile(projectType);
        const extensionList = recommendedProfile.extensions.map(ext => 
            `<li>${ext.name} 
                <span style="color: ${ext.isCompatible ? 'green' : 'red'}">
                    ${l.getString(ext.isCompatible ? 'compatible' : 'incompatible')}
                </span>
                <button onclick="toggleExtension('recommended', '${ext.id}')">
                    ${l.getString(ext.isEnabled ? 'disable' : 'enable')}
                </button>
            </li>`
        ).join('');

        return `
        <div class="card">
            <h2>${l.getString('recommendedProfile')}</h2>
            <ul>${extensionList}</ul>
            <button onclick="createProfile('recommended')">${l.getString('customizeProfile')}</button>
            <button onclick="applyProfile('recommended')">${l.getString('applyProfile')}</button>
        </div>`;
    }

    private async _detectProjectType(): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error(this._localization.getString('noWorkspace'));
        }
        const detector = new ProjectDetector(workspaceFolder.uri.fsPath);
        return await detector.detectProjectType();
    }   

    private _isExtensionCompatible(extension: vscode.Extension<any>, projectType: string): boolean {
        const extensionId = extension.id.toLowerCase();
        const extensionName = (extension.packageJSON.displayName || extension.id).toLowerCase();

        if (GENERAL_DEV_TOOLS.some(tool => extensionName.includes(tool.toLowerCase()))) {
            return true;
        }

        switch (projectType) {
            case PROJECT_TYPES.NODE:
            case PROJECT_TYPES.REACT:
            case PROJECT_TYPES.ANGULAR:
            case PROJECT_TYPES.VUE:
                return extensionId.includes('node') || extensionId.includes('javascript') || extensionId.includes('typescript');
            case PROJECT_TYPES.PYTHON:
                return extensionId.includes('python');
            case PROJECT_TYPES.JAVA:
                return extensionId.includes('java');
            case PROJECT_TYPES.DOTNET:
                return extensionId.includes('csharp') || extensionId.includes('dotnet');
            case PROJECT_TYPES.FLUTTER:
                return extensionId.includes('flutter') || extensionId.includes('dart');
            default:
                return false;
        }
    }

    public dispose() {
        ProjectPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}