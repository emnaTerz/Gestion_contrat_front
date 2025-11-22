
import { ContratService, ExtensionDTO } from '@/layout/service/contrat';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PdfGeneratorService } from '@/layout/service/PdfGeneratorService';
import { lastValueFrom } from 'rxjs';
interface Exclusion {
  id: number;
  nom: string;
}
interface SousGarantieWithDetails {
  id: number;
  nom: string;
  garantie: {
    id: number;
    libelle: string;
  };
}
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CardModule, ButtonModule, DialogModule, InputTextModule, FormsModule, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
    extensions: ExtensionDTO[] = [];
  displayModifyDialog: boolean = false;
  numPoliceInput: string = '';
  errorMessage: string = '';
  displayDownloadDialog: boolean = false;
  downloadNumPoliceInput: string = '';
  downloadErrorMessage: string = '';
  isDownloading: boolean = false;
    sousGarantiesOptions: { label: string; value: number }[] = [];
sousGarantiesWithDetails: SousGarantieWithDetails[] = [];
exclusionsOptions: any[] = []; // tableau pour stocker toutes les exclusions du backend
  sections: any;
clausiers: any[] = [];

  constructor(
    private router: Router, 
    private contratService: ContratService,
    private messageService: MessageService,
    private pdfService: PdfGeneratorService
  ) {}

  showModifyDialog() {
    this.numPoliceInput = '';
    this.errorMessage = '';
    this.displayModifyDialog = true;
  }
  onSubmitNumPolice() {
  const numPolice = this.numPoliceInput.trim();

  if (!numPolice) {
    this.errorMessage = "Veuillez saisir un numéro de police";
    return;
  }

  this.contratService.getContratStatus(numPolice).subscribe(
    (status: string) => {
      console.log('Statut brut reçu:', status);
      
      // Nettoyer et normaliser le statut
      const cleanedStatus = status.trim().toLowerCase();
      console.log('Statut nettoyé:', cleanedStatus);
      
      // Gestion des différents cas de status
      if (cleanedStatus === 'contrat non trouvé' || cleanedStatus === 'non trouvé') {
        this.errorMessage = "Aucun contrat trouvé avec ce numéro";
        this.displayModifyDialog = true;
      } else if (cleanedStatus === 'figé' || cleanedStatus === 'fige') {
        this.errorMessage = "Le contrat est figé, vous ne pouvez pas le modifier";
        this.displayModifyDialog = true;
      } else {
        // Contrat existe et modifiable
        this.errorMessage = "";
        this.displayModifyDialog = false;
        this.router.navigate([`/Modif_Contrat/${numPolice}`]);
      }
    },
    err => {
      console.error('Erreur API:', err);
      
      // Gestion spécifique des erreurs HTTP
      if (err.status === 404) {
        this.errorMessage = "Aucun contrat trouvé avec ce numéro";
      } else if (err.status === 500) {
        this.errorMessage = "Erreur serveur, veuillez réessayer plus tard";
      } else {
        this.errorMessage = "Erreur lors de la récupération du statut du contrat";
      }
      
      this.displayModifyDialog = true;
    }
  );
}

  goToCreateContrat() {
    this.router.navigate(['/Contrat']);
  }

  showDownloadDialog() {
    this.displayDownloadDialog = true;
    this.downloadNumPoliceInput = '';
    this.downloadErrorMessage = '';
    this.isDownloading = false;
  }

async onDownloadContrat() {
  if (!this.downloadNumPoliceInput?.trim()) return;

  const numPolice = this.downloadNumPoliceInput.trim();
  this.isDownloading = true;

  try {
    await this.loadSousGarantiesWithDetails();
    await this.loadAllExclusions();
    await this.loadClausiers();

    const exists = await lastValueFrom(this.contratService.checkContratExists(numPolice));
    if (!exists) {
      this.isDownloading = false;
      this.downloadErrorMessage = "Aucun contrat trouvé";
      return;
    }

    const contratData = await lastValueFrom(this.contratService.getContrat(numPolice));
    const pdfData = await this.prepareDataForPdf(contratData);
    const blob = await this.pdfService.generateContratPDF(pdfData);

    this.downloadPdfBlob(blob, `contrat_${numPolice}.pdf`);
    this.displayDownloadDialog = false;
    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Contrat téléchargé' });
  } catch (err) {
    console.error(err);
    this.downloadErrorMessage = 'Erreur lors de la génération du PDF';
  } finally {
    this.isDownloading = false;
  }
}

  private downloadPdfBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }
// Dans LandingComponent - remplacer la méthode prepareDataForPdf existante
private async prepareDataForPdf(contratData: any):  Promise<any>  {

  const sections = (contratData.sections || []).map((section: any) => ({
    identification: section.identification?.trim() || "Non spécifié",
    adresse: section.adresse?.trim() || "Non spécifié",
    natureConstruction: section.natureConstruction?.trim() || "Non spécifié",
    contiguite: section.contiguite?.trim() || "Non spécifié",
    avoisinage: section.avoisinage?.trim() || "Non spécifié",
    numPolice: contratData.numPolice,
    garanties: this.prepareGarantiesForPdf(section.garanties || [])
  }));

    const rcConfigurations = (contratData.rcConfigurations || []).map((rcConfig: any) => {
    // Transformer les IDs en indices
    const sectionIndices = (rcConfig.sectionIds || []).map((sectionId: string) => {
      const index = contratData.sections.findIndex((section: any) => section.id === sectionId);
      return index !== -1 ? index : null;
    }).filter((index: number | null) => index !== null) as number[];
    return {
      id: rcConfig.id,
      limiteAnnuelleDomCorporels: rcConfig.limiteAnnuelleDomCorporels || 0,
      limiteAnnuelleDomMateriels: rcConfig.limiteAnnuelleDomMateriels || 0,
      limiteParSinistre: rcConfig.limiteParSinistre || 0,
      franchise: rcConfig.franchise || 0,
      primeNET: rcConfig.primeNET || 0,
      exclusionsRcIds: rcConfig.exclusionsRcIds || [],
      sectionIds: sectionIndices,
      objetDeLaGarantie: rcConfig.objetDeLaGarantie ,
    };
  });

  // Préparation des garanties groupées par parent
  const garantiesParParent = this.prepareGarantiesParParentForPdf(contratData.sections || []);
    const exclusionsRC = await this.prepareExclusionsRCForPdf(contratData.rcConfigurations || []);
 const extensions = (contratData.extensions || [])
  .filter((e: ExtensionDTO) => e.titre?.trim() || e.texte?.trim())
  .map((e: ExtensionDTO) => ({
    titre: e.titre?.trim() || '',
    texte: e.texte?.trim() || ''
  }));

    console.log(extensions);
  return {
    // Informations de base
    numPolice: contratData.numPolice,
    nom_assure: contratData.nom_assure || contratData.adherent?.nomRaison,
    codeAgence: contratData.codeAgence,
    adherent: contratData.adherent || {
      codeId: contratData.adherent?.codeId || '',
      nomRaison: contratData.adherent?.nomRaison || '',
      adresse: contratData.adherent?.adresse || '',
      activite: contratData.adherent?.activite || '',
      nouveau: contratData.adherent?.nouveau || false
    },
    fractionnement: contratData.fractionnement,
    codeRenouvellement: contratData.codeRenouvellement,
    branche: contratData.branche,
    primeTTC: contratData.primeTTC || 0,
    primeNET: contratData.primeNET || 0,
    typeContrat: contratData.typeContrat,
    dateDebut: contratData.dateDebut,
    dateFin: contratData.dateFin,
    preambule: contratData.preambule || '',
    service: contratData.service || 0,

    // Objet de la garantie RC
    objetDeLaGarantie: this.getDefaultObjetGarantie(contratData.adherent.nomRaison) ,

    // Exclusions RC globales
    exclusionsRC,
    // Structures principales
    sections: sections,
    rcConfigurations: rcConfigurations,
    garantiesParParent: garantiesParParent,
    extensions,
    clauseIds: contratData.clauseIds || [],
    clausiers: this.clausiers || []
  };
} 
loadClausiers() {
  this.contratService.getAllClausiers().subscribe({
    next: (data) => {
      this.clausiers = data;
      console.log('📋 Clausiers chargés:', this.clausiers);
      console.log('🔄 Nombre de clausiers:', this.clausiers.length);
    },
    error: (err) => {
      console.error('❌ Erreur chargement clausiers', err);
    }
  });
}
// 🔥 CORRECTION: Préparer les garanties pour le PDF
private prepareGarantiesForPdf(garanties: any[]): any[] {
  if (!garanties || !Array.isArray(garanties)) return [];

  return garanties.map(garantie => {
    const sousGarantieNom = this.getSousGarantieNomFromData(garantie);
    
    return {
      sousGarantieNom: sousGarantieNom,
      sousGarantieId: garantie.sousGarantieId,
      franchise: garantie.franchise || 0,
      maximum: garantie.maximum || 0,
      minimum: garantie.minimum || 0,
      capitale: garantie.capitale || 0,
      primeNET: garantie.primeNet || garantie.primeNET || 0,
      hasFranchise: (garantie.franchise || 0) > 0,
      exclusions: this.prepareExclusionsForGarantiePdf(garantie)
    };
  });
}

// 🔥 CORRECTION: Préparer les garanties groupées par parent
private prepareGarantiesParParentForPdf(sections: any[]): any[] {
  if (!sections || !Array.isArray(sections)) return [];

  const garantiesParParentMap = new Map();

  sections.forEach((section: any) => {
    if (section.garanties && Array.isArray(section.garanties)) {
      section.garanties.forEach((garantie: any) => {
        const parent = garantie.garantieParent;
        if (parent && parent.id) {
          const parentId = parent.id;
          
          if (!garantiesParParentMap.has(parentId)) {
            garantiesParParentMap.set(parentId, {
              parent: {
                id: parent.id,
                libelle: parent.libelle || `Garantie ${parent.id}`
              },
              sousGaranties: [],
              exclusionsUniques: new Map()
            });
          }

          const parentData = garantiesParParentMap.get(parentId);
          const sousGarantieNom = this.getSousGarantieNomFromData(garantie);
          
          // Vérifier si la sous-garantie existe déjà
          const existingSousGarantie = parentData.sousGaranties.find(
            (sg: any) => sg.sousGarantieId === garantie.sousGarantieId
          );

          if (existingSousGarantie) {
            // Ajouter la situation si pas déjà présente
            if (!existingSousGarantie.situations.includes(section.identification)) {
              existingSousGarantie.situations.push(section.identification);
            }
          } else {
            parentData.sousGaranties.push({
              sousGarantieId: garantie.sousGarantieId,
              sousGarantieNom: sousGarantieNom,
              exclusions: this.prepareExclusionsForGarantiePdf(garantie),
              situations: [section.identification]
            });
          }

          // Ajouter les exclusions au parent
          this.addExclusionsToParentPdf(garantie, parentData);
        }
      });
    }
  });

  // Convertir en format final
  return Array.from(garantiesParParentMap.values()).map((parentData: any) => ({
    parent: parentData.parent,
    sousGaranties: parentData.sousGaranties,
    exclusions: Array.from(parentData.exclusionsUniques.values())
  }));
}


async loadAllExclusions() {
  try {
    const data = await this.contratService.getExclusion().toPromise(); // Angular < 16
    // Pour Angular 16+, utiliser firstValueFrom
    // const data = await firstValueFrom(this.contratService.getExclusion());

    this.exclusionsOptions = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erreur lors du chargement des exclusions :', error);
    this.exclusionsOptions = [];
  }
}

// 🔍 DEBUG: Ajoutons des logs pour comprendre la structure
private prepareExclusionsForGarantiePdf(garantie: any): any[] {
  if (!garantie.exclusions || !Array.isArray(garantie.exclusions)) {
    return [];
  }


  return garantie.exclusions.map((exclusion: any) => {

    // ESSAI 1: Recherche par ID exact
    let exclusionInfo = this.exclusionsOptions.find(e => e.id === exclusion.exclusionId);
    
    // ESSAI 2: Si pas trouvé, recherche par ID string/number
    if (!exclusionInfo) {
      exclusionInfo = this.exclusionsOptions.find(e => e.id == exclusion.exclusionId);
    }
    
    // ESSAI 3: Recherche dans d'autres propriétés possibles
    if (!exclusionInfo) {
      exclusionInfo = this.exclusionsOptions.find(e => 
        e.id === exclusion.id || 
        e.value === exclusion.exclusionId ||
        e.code === exclusion.exclusionId
      );
    }

    // STRATÉGIE DE RÉCUPÉRATION DU NOM
    let nom = '';
    
    if (exclusionInfo) {
      nom = exclusionInfo.nom || exclusionInfo.name || exclusionInfo.libelle || exclusionInfo.label;
    }
    
    // Si toujours pas de nom, chercher dans l'objet exclusion original
    if (!nom && exclusion) {
      nom = exclusion.nom || exclusion.name || exclusion.libelle || exclusion.label;
    }
    
    // Fallback final
    if (!nom) {
      nom = `Exclusion ${exclusion.exclusionId || exclusion.id || 'Inconnue'}`;
    }

    const result = {
      id: exclusion.exclusionId || exclusion.id,
      nom: nom.trim()
    };

    return result;
  });
}


// 🔥 NOUVELLE MÉTHODE: Récupérer les exclusions formatées pour l'affichage
public getFormattedExclusions(parentData: any): string[] {
  if (!parentData.exclusionsUniques) return [];
  
  return Array.from(parentData.exclusionsUniques.values())
    .map((exclusion: any) => exclusion.nom)
    .filter((nom: string) => nom && nom.trim() !== '');
}


// 🔥 CORRECTION: Ajouter les exclusions au parent
private addExclusionsToParentPdf(garantie: any, parentData: any): void {
  const exclusions = this.prepareExclusionsForGarantiePdf(garantie);
  exclusions.forEach(exclusion => {
    if (!parentData.exclusionsUniques.has(exclusion.id)) {
      parentData.exclusionsUniques.set(exclusion.id, exclusion);
    }
  });
}

// ✅ Récupère le nom de la sous-garantie depuis les données réelles du back
private getSousGarantieNomFromData(garantie: any): string {
  // 🔹 Cas 1 : nom directement disponible (champ "nom")
  if (garantie?.nom?.trim()) {
    return garantie.nom.trim();
  }
  // 🔹 Cas 2 : tente de récupérer depuis la liste locale (par id)
  const sousGarantie = this.sousGarantiesWithDetails?.find(
    sg => Number(sg.id) === Number(garantie.sousGarantieId)
  );
  if (sousGarantie?.nom?.trim()) {
    return sousGarantie.nom.trim();
  }

  // 🔹 Cas 3 : fallback — si rien trouvé
  console.warn('⚠️ Sous-garantie introuvable pour ID:', garantie.sousGarantieId, garantie);
  return `Sous-garantie ${garantie.sousGarantieId}`;
}


loadSousGarantiesWithDetails(): Promise<void> {
  return new Promise((resolve) => {
    this.contratService.getallSousGaranties().subscribe({
      next: (sousGaranties: any[]) => {
        this.sousGarantiesWithDetails = sousGaranties;
        this.sousGarantiesOptions = sousGaranties.map(sg => ({
          label: sg.nom,
          value: sg.id
        }));
        resolve();
      },
      error: (error) => {
        console.error('Erreur chargement sous-garanties:', error);
        resolve();
      }
    });
  });
}


// 🧩 Texte standard par défaut
private getDefaultObjetGarantie(adherentNom?: string): string {
  const nom = adherentNom?.trim() || 'l’assuré';
  return `Cette assurance a pour objet de garantir les conséquences pécuniaires de la responsabilité civile pouvant incomber à ${nom}, et ce en raison des dommages corporels et matériels causés aux tiers.`;
}

private async prepareExclusionsRCForPdf(rcConfigurations: any[]): Promise<any[]> {
  const exclusionIds = new Set<number>();

  rcConfigurations.forEach(rcConfig => {
    if (rcConfig.exclusionsRcIds && Array.isArray(rcConfig.exclusionsRcIds)) {
      rcConfig.exclusionsRcIds.forEach((exclusionId: number) => {
        exclusionIds.add(exclusionId);
      });
    }
  });

  // 🔹 Utiliser exactement la même méthode que landing.component
  const allExclusions = await lastValueFrom(this.contratService.getExclusionsRC());
    return allExclusions;
}

goToListContrats() {
  this.router.navigate(['/contrat-list']);
}

}