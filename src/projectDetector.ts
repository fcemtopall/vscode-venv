import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_TYPES } from './constants';

// ProjectDetector sınıfı, bir projenin türünü tespit etmek için kullanılır.
export class ProjectDetector {
    private workspaceRoot: string;

    // Constructor, workspace root'u alır.
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    // Projeyi tespit eder ve türünü döndürür.
    async detectProjectType(): Promise<string> {
        if (await this.isNodeProject()) {
            return PROJECT_TYPES.NODE;
        } else if (await this.isPythonProject()) {
            return PROJECT_TYPES.PYTHON;
        } else if (await this.isJavaProject()) {
            return PROJECT_TYPES.JAVA;
        } else if (await this.isDotNetProject()) {
            return PROJECT_TYPES.DOTNET;
        } else if (await this.isRubyProject()) {
            return PROJECT_TYPES.RUBY;
        } else if (await this.isGoProject()) {
            return PROJECT_TYPES.GO;
        } else if (await this.isRustProject()) {
            return PROJECT_TYPES.RUST;
        } else if (await this.isReactProject()) {
            return PROJECT_TYPES.REACT;
        } else if (await this.isAngularProject()) {
            return PROJECT_TYPES.ANGULAR;
        } else if (await this.isVueProject()) {
            return PROJECT_TYPES.VUE;
        } else if (await this.isSvelteProject()) {
            return PROJECT_TYPES.SVELTE;
        } else if (await this.isNextProject()) {
            return PROJECT_TYPES.NEXTJS;
        } else if (await this.isNuxtProject()) {
            return PROJECT_TYPES.NUXTJS;
        } else if (await this.isLaravelProject()) {
            return PROJECT_TYPES.LARAVEL;
        } else if (await this.isSymfonyProject()) {
            return PROJECT_TYPES.SYMFONY;
        } else if (await this.isDjangoProject()) {
            return PROJECT_TYPES.DJANGO;
        } else if (await this.isFlaskProject()) {
            return PROJECT_TYPES.FLASK;
        } else if (await this.isExpressProject()) {
            return PROJECT_TYPES.EXPRESS;
        } else if (await this.isSpringProject()) {
            return PROJECT_TYPES.SPRING;
        } else if (await this.isHibernateProject()) {
            return PROJECT_TYPES.HIBERNATE;
        } else if (await this.isFlutterProject()) {
            return PROJECT_TYPES.FLUTTER;
        } else {
            return PROJECT_TYPES.UNKNOWN;
        }
    }

    // Dosyanın var olup olmadığını kontrol eder.
    private async fileExists(filename: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            fs.access(path.join(this.workspaceRoot, filename), fs.constants.F_OK, (err) => {
                resolve(!err);
            });
        });
    }

    // Node.js projesi olup olmadığını kontrol eder.
    private async isNodeProject(): Promise<boolean> {
        return await this.fileExists('package.json');
    }

    // Python projesi olup olmadığını kontrol eder.
    private async isPythonProject(): Promise<boolean> {
        return await this.fileExists('requirements.txt') || await this.fileExists('setup.py');
    }

    // Java projesi olup olmadığını kontrol eder.
    private async isJavaProject(): Promise<boolean> {
        return await this.fileExists('pom.xml') || await this.fileExists('build.gradle');
    }

    // .NET projesi olup olmadığını kontrol eder.
    private async isDotNetProject(): Promise<boolean> {
        const files = await vscode.workspace.findFiles('**/*.{csproj,fsproj,vbproj}', null, 1);
        return files.length > 0;
    }

    // Ruby projesi olup olmadığını kontrol eder.
    private async isRubyProject(): Promise<boolean> {
        return await this.fileExists('Gemfile');
    }

    // Go projesi olup olmadığını kontrol eder.
    private async isGoProject(): Promise<boolean> {
        return await this.fileExists('go.mod');
    }

    // Rust projesi olup olmadığını kontrol eder.
    private async isRustProject(): Promise<boolean> {
        return await this.fileExists('Cargo.toml');
    }

    // React projesi olup olmadığını kontrol eder.
    private async isReactProject(): Promise<boolean> {
        return await this.fileExists('package.json') && (await this.fileExists('package-lock.json') || await this.fileExists('yarn.lock'));
    }

    // Angular projesi olup olmadığını kontrol eder.
    private async isAngularProject(): Promise<boolean> {    
        return await this.fileExists('angular.json') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Vue projesi olup olmadığını kontrol eder.
    private async isVueProject(): Promise<boolean> {
        return await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Svelte projesi olup olmadığını kontrol eder.
    private async isSvelteProject(): Promise<boolean> {
        return await this.fileExists('svelte.config.js') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Next.js projesi olup olmadığını kontrol eder.
    private async isNextProject(): Promise<boolean> {
        return await this.fileExists('next.config.js') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Nuxt.js projesi olup olmadığını kontrol eder.
    private async isNuxtProject(): Promise<boolean> {
        return await this.fileExists('nuxt.config.js') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Laravel projesi olup olmadığını kontrol eder.
    private async isLaravelProject(): Promise<boolean> {    
        return await this.fileExists('composer.json') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Symfony projesi olup olmadığını kontrol eder.
    private async isSymfonyProject(): Promise<boolean> {
        return await this.fileExists('composer.json') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Django projesi olup olmadığını kontrol eder.
    private async isDjangoProject(): Promise<boolean> {
        return await this.fileExists('requirements.txt') || await this.fileExists('manage.py');
    }

    // Flask projesi olup olmadığını kontrol eder.
    private async isFlaskProject(): Promise<boolean> {
        return await this.fileExists('requirements.txt') || await this.fileExists('manage.py');
    }

    // Express projesi olup olmadığını kontrol eder.
    private async isExpressProject(): Promise<boolean> {
        return await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }       

    // Spring projesi olup olmadığını kontrol eder.
    private async isSpringProject(): Promise<boolean> {
        return await this.fileExists('pom.xml') || await this.fileExists('build.gradle');
    }

    // Hibernate projesi olup olmadığını kontrol eder.
    private async isHibernateProject(): Promise<boolean> {
        return await this.fileExists('pom.xml') || await this.fileExists('build.gradle');
    }

    // Flutter projesi olup olmadığını kontrol eder.
    private async isFlutterProject(): Promise<boolean> {
        return await this.fileExists('pubspec.yaml') || await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }   
        
}