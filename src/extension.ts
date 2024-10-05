import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetector } from './services/ProjectDetector';
import { ProjectPanel } from './ui/ProjectPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated!');

    let disposable = vscode.commands.registerCommand('vscode-project-detector.showProjectPanel', () => {
        ProjectPanel.createOrShow();
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(onWorkspaceChange));

    if (vscode.workspace.workspaceFolders) {
        onWorkspaceChange();
    }

    vscode.commands.executeCommand('vscode-project-detector.showProjectPanel');
}

async function onWorkspaceChange() {
    console.log('Workspace changed, checking project type...');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        console.log('No open workspace found.');
        vscode.window.showInformationMessage('Açık bir proje bulunamadı.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log(`Root path: ${rootPath}`);

    const projectDetector = new ProjectDetector(rootPath);
    const projectType = await projectDetector.detectProjectType();
    console.log(`Detected project type: ${projectType}`);

    ProjectPanel.createOrShow();

    const extensions = vscode.extensions.all;
    if (ProjectPanel.currentPanel) {
        ProjectPanel.currentPanel.updateContent(projectType, extensions.slice());
    }
}

export function deactivate() {
    if (ProjectPanel.currentPanel) {
        ProjectPanel.currentPanel.dispose();
    }
}