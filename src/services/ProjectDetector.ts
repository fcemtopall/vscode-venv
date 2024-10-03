import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_TYPES } from '../utils/constants';

// ProjectDetector sınıfı, bir projenin türünü tespit etmek için kullanılır.
export class ProjectDetector {
    private workspaceRoot: string;

    // Constructor, workspace root'u alır.
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    // Projeyi tespit eder ve türünü döndürür.
    async detectProjectType(): Promise<string> {
        const detectionMethods = [
            { method: this.isNodeProject, type: PROJECT_TYPES.NODE },
            { method: this.isPythonProject, type: PROJECT_TYPES.PYTHON },
            { method: this.isJavaProject, type: PROJECT_TYPES.JAVA },
            { method: this.isDotNetProject, type: PROJECT_TYPES.DOTNET },
            { method: this.isRubyProject, type: PROJECT_TYPES.RUBY },
            { method: this.isGoProject, type: PROJECT_TYPES.GO },
            { method: this.isRustProject, type: PROJECT_TYPES.RUST },
            { method: this.isReactProject, type: PROJECT_TYPES.REACT },
            { method: this.isAngularProject, type: PROJECT_TYPES.ANGULAR },
            { method: this.isVueProject, type: PROJECT_TYPES.VUE },
            { method: this.isSvelteProject, type: PROJECT_TYPES.SVELTE },
            { method: this.isNextProject, type: PROJECT_TYPES.NEXTJS },
            { method: this.isNuxtProject, type: PROJECT_TYPES.NUXTJS },
            { method: this.isLaravelProject, type: PROJECT_TYPES.LARAVEL },
            { method: this.isSymfonyProject, type: PROJECT_TYPES.SYMFONY },
            { method: this.isDjangoProject, type: PROJECT_TYPES.DJANGO },
            { method: this.isFlaskProject, type: PROJECT_TYPES.FLASK },
            { method: this.isExpressProject, type: PROJECT_TYPES.EXPRESS },
            { method: this.isSpringProject, type: PROJECT_TYPES.SPRING },
            { method: this.isHibernateProject, type: PROJECT_TYPES.HIBERNATE },
            { method: this.isFlutterProject, type: PROJECT_TYPES.FLUTTER },
        ];

        for (const { method, type } of detectionMethods) {
            if (await method.call(this)) {
                return type;
            }
        }

        return PROJECT_TYPES.UNKNOWN;
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
        return await this.fileExists('angular.json') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
    }

    // Vue projesi olup olmadığını kontrol eder.
    private async isVueProject(): Promise<boolean> {
        return await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock'));
    }

    // Svelte projesi olup olmadığını kontrol eder.
    private async isSvelteProject(): Promise<boolean> {
        return await this.fileExists('svelte.config.js') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
    }

    // Next.js projesi olup olmadığını kontrol eder.
    private async isNextProject(): Promise<boolean> {
        return await this.fileExists('next.config.js') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
    }

    // Nuxt.js projesi olup olmadığını kontrol eder.
    private async isNuxtProject(): Promise<boolean> {
        return await this.fileExists('nuxt.config.js') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
    }

    // Laravel projesi olup olmadığını kontrol eder.
    private async isLaravelProject(): Promise<boolean> {    
        return await this.fileExists('composer.json') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
    }

    // Symfony projesi olup olmadığını kontrol eder.
    private async isSymfonyProject(): Promise<boolean> {
        return await this.fileExists('composer.json') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
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
        return await this.fileExists('pubspec.yaml') || (await this.fileExists('package.json') && (await this.fileExists('node_modules') || await this.fileExists('yarn.lock')));
    }   
        
}