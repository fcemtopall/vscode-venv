import * as vscode from 'vscode';
import { PROJECT_TYPES, GENERAL_DEV_TOOLS } from './constants';
import { ProjectDetector } from './projectDetector';
import { VirtualEnvironment } from './virtualEnviroment';
export class ProjectPanel {
    public static currentPanel: ProjectPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _virtualEnvironment: VirtualEnvironment;


    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );
        this._panel.webview.html = this._getWebviewContent('Proje türü algılanıyor...');
        this._virtualEnvironment = new VirtualEnvironment(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
    }

    public static createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ProjectPanel.currentPanel) {
            ProjectPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'projectInfo',
            'Proje Bilgileri',
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
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Proje Bilgileri</title>
            <style>
                body { font-family: Arial, sans-serif; }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 10px; }
                button { margin-left: 10px; }
            </style>
        </head>
        <body>
            <h1>Proje Türü: ${projectType}</h1>
            ${extensionList}
            <script>
                const vscode = acquireVsCodeApi();
                function toggleExtension(extensionId) {
                    vscode.postMessage({
                        command: 'toggleExtension',
                        extensionId: extensionId
                    });
                }
            </script>
        </body>
        </html>`;
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            case 'toggleExtension':
                await this._toggleExtension(message.extensionId);
                break;
        }
    }

    private async _toggleExtension(extensionId: string) {
        // Assuming _virtualEnv is a property that should exist on ProjectPanel
        // If it doesn't, you might need to add it to the class or adjust this method
        if (this._virtualEnvironment && typeof this._virtualEnvironment.toggleExtension === 'function') {
            this._virtualEnvironment.toggleExtension(extensionId);
        } else {
            console.error('_virtualEnv is not properly initialized or doesn\'t have toggleExtension method');
        }
        const projectType = await this._detectProjectType();
        // Use spread operator to convert readonly array to mutable array
        this.updateContent(projectType, [...vscode.extensions.all]);
    }

    private async _detectProjectType(): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
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