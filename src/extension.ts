import * as vscode from 'vscode';
import { ProjectDetector } from './services/ProjectDetector';
import { ProjectPanel } from './ui/ProjectPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated!');

    // Workspace değişikliklerini dinle
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(onWorkspaceChange));

    // Mevcut workspace'i kontrol et
    if (vscode.workspace.workspaceFolders) {
        onWorkspaceChange();
    }
}

async function onWorkspaceChange() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('Açık bir proje bulunamadı.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const detector = new ProjectDetector(rootPath);
    const projectType = await detector.detectProjectType();

    // Panel'i oluştur veya göster
    ProjectPanel.createOrShow();

    // Yüklü eklentileri al
    const extensions = vscode.extensions.all;

    // Panel içeriğini güncelle
    if (ProjectPanel.currentPanel) {
        ProjectPanel.currentPanel.updateContent(projectType, [...extensions]);
    }
}

export function deactivate() {}