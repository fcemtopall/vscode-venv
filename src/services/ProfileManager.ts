import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_TYPES } from '../utils/constants';
import { ExtensionInfo } from '../interfaces/IExtensionInfo';
import { Profile } from '../interfaces/IProfile';
import { VirtualEnvironment } from './VirtualEnviroment';


export class ProfileManager {
    private projectPath: string;
    private configPath: string;
    private customProfile: Profile;
    private recommendedProfile: Profile;

    private virtualEnvironment: VirtualEnvironment;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.configPath = path.join(this.projectPath, '.vscode', 'extension-profiles.json');
        this.customProfile = { name: 'Custom', extensions: [] };
        this.recommendedProfile = { name: 'Recommended', extensions: [] };
        this.loadProfiles();
        this.virtualEnvironment = new VirtualEnvironment(this.projectPath);
    }

    private loadProfiles() {
        if (fs.existsSync(this.configPath)) {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            this.customProfile = config.customProfile || { name: 'Custom', extensions: [] };
            this.recommendedProfile = config.recommendedProfile || { name: 'Recommended', extensions: [] };
        }
    }

    private saveProfiles() {
        const config = {
            customProfile: this.customProfile,
            recommendedProfile: this.recommendedProfile
        };
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    public getCustomProfile(): Profile {
        return this.customProfile;
    }

    public createProfile(profileType: 'custom' | 'recommended') {
        const profile = profileType === 'custom' ? this.customProfile : this.recommendedProfile;
        profile.extensions = [];
        this.saveProfiles();
    }

    public getRecommendedProfile(projectType: string, allExtensions?: vscode.Extension<any>[]): Profile {
        // Eğer önerilen profil boşsa, proje türüne göre oluştur
        if (this.recommendedProfile.extensions.length === 0 && allExtensions) {
            this.recommendedProfile.extensions = this.generateRecommendedExtensions(projectType, allExtensions);
            this.saveProfiles();
        }
        return this.recommendedProfile;
    }

    private generateRecommendedExtensions(projectType: string, allExtensions: vscode.Extension<any>[]): ExtensionInfo[] {
        // Proje türüne göre önerilen eklentileri belirle
        const recommendedExtensionIds = this.getRecommendedExtensionIds(projectType);
        return allExtensions
            .filter(ext => recommendedExtensionIds.includes(ext.id))
            .map(ext => ({
                id: ext.id,
                name: ext.packageJSON.displayName || ext.id,
                isEnabled: true,
                isCompatible: true
            }));
    }

    private getRecommendedExtensionIds(projectType: string): string[] {
        // Proje türüne göre önerilen eklenti ID'lerini döndür
        // Todo ekleme yapılacak 
        switch (projectType) {
            case PROJECT_TYPES.NODE:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.PYTHON:
                return ['ms-python.python', 'ms-python.vscode-pylance'];
            case PROJECT_TYPES.JAVA:
                return ['vscjava.vscode-java-pack'];
            case PROJECT_TYPES.DOTNET:
                return ['ms-dotnettools.csharp'];
            case PROJECT_TYPES.RUBY:
                return ['rebornix.ruby', 'wingrunr21.vscode-ruby'];
            case PROJECT_TYPES.GO:
                return ['golang.go', 'ms-vscode.Go'];
            case PROJECT_TYPES.RUST:
                return ['rust-lang.rust-analyzer', 'serayuzgur.crates'];
            case PROJECT_TYPES.REACT:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.ANGULAR:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.VUE:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.SVELTE:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.NEXTJS:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.NUXTJS:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.LARAVEL:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.SYMFONY:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.DJANGO:  
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.FLASK:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.EXPRESS:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.SPRING:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.HIBERNATE:   
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.FLUTTER:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];
            case PROJECT_TYPES.UNKNOWN:
                return ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'];    
            default:
                return [];
        }
    }

    public toggleCustomExtension(extensionId: string) {
        const index = this.customProfile.extensions.findIndex(ext => ext.id === extensionId);
        if (index !== -1) {
            this.customProfile.extensions.splice(index, 1);
        } else {
            const extension = vscode.extensions.getExtension(extensionId);
            if (extension) {
                this.customProfile.extensions.push({
                    id: extensionId,
                    name: extension.packageJSON.displayName || extensionId,
                    isEnabled: true,
                    isCompatible: true
                });
            }
        }
        this.saveProfiles();
    }

    public toggleRecommendedExtension(extensionId: string) {
        const extension = this.recommendedProfile.extensions.find(ext => ext.id === extensionId);
        if (extension) {
            extension.isEnabled = !extension.isEnabled;
            this.saveProfiles();
        }
    }

    public addCustomExtension(extensionId: string) {
        if (!this.customProfile.extensions.some(ext => ext.id === extensionId)) {
            const extension = vscode.extensions.getExtension(extensionId);
            if (extension) {
                this.customProfile.extensions.push({
                    id: extensionId,
                    name: extension.packageJSON.displayName || extensionId,
                    isEnabled: true,
                    isCompatible: true
                });
                this.saveProfiles();
            }
        }
    }

    public async applyProfile(profileType: 'custom' | 'recommended') {
        const profile = profileType === 'custom' ? this.customProfile : this.recommendedProfile;
        await this.virtualEnvironment.applyProfile(profile.extensions);
    }
}