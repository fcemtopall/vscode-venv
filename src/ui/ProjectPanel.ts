import * as vscode from 'vscode';
import { PROJECT_TYPES, GENERAL_DEV_TOOLS } from '../utils/constants';
import { ProjectDetector } from '../services/ProjectDetector';
import { VirtualEnvironment } from '../services/VirtualEnviroment';
import { ProfileManager } from '../services/ProfileManager';
import { LocalizationManager } from '../services/LocalizationManager';
import { ExtensionInfo } from '../interfaces/IExtensionInfo';

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
        this._panel.webview.html = this._getWebviewContent('Proje türü algılanıyor...', []);
        this._virtualEnvironment = new VirtualEnvironment(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
        this._profileManager = new ProfileManager(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
        this._localization = LocalizationManager.getInstance();
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
        this._panel.webview.html = this._getWebviewContent(projectType, extensions);
    }

    private _getWebviewContent(projectType: string, extensions?: vscode.Extension<any>[]) {
        let extensionList = '';
        const customProfileCard = this._createCustomProfileCard();
        const recommendedProfileCard = this._createRecommendedProfileCard(projectType, extensions as vscode.Extension<any>[]);

        if (extensions) {
            const projectSpecificExtensions: string[] = [];
            const generalDevTools: string[] = [];

            extensions.forEach(ext => {
                const extensionName = (ext.packageJSON.displayName || ext.id).toLowerCase();
                const isCompatible = this._isExtensionCompatible(ext, projectType);
                const isGeneralTool = GENERAL_DEV_TOOLS.some(tool => extensionName.includes(tool.toLowerCase()));
                
                const compatibilityLabel = isCompatible || isGeneralTool ? 
                    '<span style="color: green; margin-left: 10px;">Uyumlu</span>' : 
                    '<span style="color: red; margin-left: 10px;">Uyumsuz</span>';
                
                    const toggleButton = `<button onclick="toggleExtension('${ext.id}')" id="${ext.id}-toggle">
                    ${this._virtualEnvironment.isExtensionEnabled(ext.id) ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                </button>`;
                
                const listItem = `<li>${ext.packageJSON.displayName || ext.id} ${compatibilityLabel} ${toggleButton}</li>`;
                
                if (isGeneralTool) {
                    generalDevTools.push(listItem);
                } else {
                    projectSpecificExtensions.push(listItem);
                }
            });

            extensionList = `
                <h2>Proje Özel Eklentiler:</h2>
                <ul>${projectSpecificExtensions.join('')}</ul>
                <h2>Genel Geliştirme Araçları:</h2>
                <ul>${generalDevTools.join('')}</ul>
            `;
        }

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <!-- ... (önceki head içeriği) -->
        </head>
        <body>
            <h1>Proje Türü: ${projectType}</h1>
            ${customProfileCard}
            ${recommendedProfileCard}
            <script>
                const vscode = acquireVsCodeApi();
                function toggleExtension(profileType, extensionId) {
                    vscode.postMessage({
                        command: 'toggleExtension',
                        profileType: profileType,
                        extensionId: extensionId
                    });
                }
                function createProfile(profileType) {
                    vscode.postMessage({
                        command: 'createProfile',
                        profileType: profileType
                    });
                }
                function applyProfile(profileType) {
                    vscode.postMessage({
                        command: 'applyProfile',
                        profileType: profileType
                    });
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
                await this._profileManager.createProfile(message.profileType);
                break;
            case 'applyProfile':
                await this._profileManager.applyProfile(message.profileType);
                break;
        }
    }

    private async _applyProfile(profileType: 'custom' | 'recommended') {
        await this._profileManager.applyProfile(profileType);
        vscode.window.showInformationMessage(`${profileType === 'custom' ? 'Özel' : 'Önerilen'} profil uygulandı.`);
        this.updateContent(await this._detectProjectType(), [...vscode.extensions.all]);
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


    private async _toggleExtension(profileType: string, extensionId: string) {
        if (profileType === 'custom') {
            this._profileManager.toggleCustomExtension(extensionId);
        } else if (profileType === 'recommended') {
            this._profileManager.toggleRecommendedExtension(extensionId);
        }
        this.updateContent(await this._detectProjectType(), [...vscode.extensions.all]);
    }

    private async _detectProjectType(): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const l = this._localization;
        if (!workspaceFolder) {
            throw new Error(l.getString('noWorkspace'));
        }
        const detector = new ProjectDetector(workspaceFolder.uri.fsPath);
        return await detector.detectProjectType();
    }   

    private _isExtensionCompatible(extension: vscode.Extension<any>, projectType: string): boolean {
        const extensionId = extension.id.toLowerCase();
        const extensionName = (extension.packageJSON.displayName || extension.id).toLowerCase();

        // Genel geliştirme araçları her zaman uyumlu kabul edilir
        if (GENERAL_DEV_TOOLS.some(tool => extensionName.includes(tool.toLowerCase()))) {
            return true;
        }

        // Proje türüne göre uyumluluk kontrolü
        switch (projectType) {
            case PROJECT_TYPES.NODE:
            case PROJECT_TYPES.REACT:
            case PROJECT_TYPES.ANGULAR:
            case PROJECT_TYPES.VUE:
            case PROJECT_TYPES.SVELTE:
            case PROJECT_TYPES.NEXTJS:
            case PROJECT_TYPES.NUXTJS:
            case PROJECT_TYPES.EXPRESS:
                return extensionId.includes('node') || extensionId.includes('javascript') || extensionId.includes('typescript');
            case PROJECT_TYPES.PYTHON:
            case PROJECT_TYPES.DJANGO:
            case PROJECT_TYPES.FLASK:
                return extensionId.includes('python');
            case PROJECT_TYPES.JAVA:
            case PROJECT_TYPES.SPRING:
            case PROJECT_TYPES.HIBERNATE:
                return extensionId.includes('java');
            case PROJECT_TYPES.DOTNET:
                return extensionId.includes('csharp') || extensionId.includes('dotnet');
            case PROJECT_TYPES.RUBY:
                return extensionId.includes('ruby');
            case PROJECT_TYPES.GO:
                return extensionId.includes('go');
            case PROJECT_TYPES.RUST:
                return extensionId.includes('rust');
            case PROJECT_TYPES.LARAVEL:
            case PROJECT_TYPES.SYMFONY:
                return extensionId.includes('php');
            case PROJECT_TYPES.FLUTTER:
                return extensionId.includes('flutter') || extensionId.includes('dart');
            default:
                return false; // Bilinmeyen proje türleri için varsayılan olarak uyumsuz kabul ediyoruz
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