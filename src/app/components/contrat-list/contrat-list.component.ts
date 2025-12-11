
import { Contrat, ContratService, ExtensionDTO } from '@/layout/service/contrat';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { lastValueFrom } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { PdfGeneratorService } from '@/layout/service/PdfGeneratorService';
interface SousGarantieWithDetails {
  id: number;
  nom: string;
  garantie: {
    id: number;
    libelle: string;
  };
}
@Component({
  selector: 'app-contrat-list',
  standalone: true,
    imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ToastModule,
  DialogModule,
  ToggleButtonModule ],

  templateUrl: './contrat-list.component.html',
  styleUrls: ['./contrat-list.component.scss']
})
export class ContratListComponent implements OnInit {
    extensions: ExtensionDTO[] = [];
clausiers: any[] = [];

  contrats: Contrat[] = [];
  filteredContrats: Contrat[] = [];
  loading: boolean = false;
  isDownloading: boolean = false;
  downloadErrorMessage: string = '';
  displayDownloadDialog: boolean = false;
displayAdherentDialog: boolean = false;
selectedAdherent: any = null;
downloadNumPoliceInput: string = '';
exclusionsOptions: any[] = []; 
sousGarantiesWithDetails: SousGarantieWithDetails[] = [];
sousGarantiesOptions: { label: string; value: number }[] = [];
showAdherentDetails(adherent: any) {
  this.selectedAdherent = adherent;
  this.displayAdherentDialog = true;
}

  constructor(
    private contratService: ContratService,
    private router: Router,
    private messageService: MessageService,
    private pdfService: PdfGeneratorService
    
  ) {}
   isAdmin: boolean = false;
dateDebutFilter: string | null = null;
dateFinFilter: string | null = null;
getFractionnementLabel(value: number | string | null): string {
  switch (value) {
    case 0:
    case 'ZERO':
      return 'Annuel';
    case 1:
    case 'UN':
      return 'Semestriel';
    case 2:
    case 'DEUX':
      return 'Trimestriel';
    default:
      return 'N/A';
  }
}

filterByDate() {
  this.filteredContrats = this.contrats.filter(c => {
    const debut = c.dateDebut ? new Date(c.dateDebut) : null;
    const fin = c.dateFin ? new Date(c.dateFin) : null;

    const startFilter = this.dateDebutFilter ? new Date(this.dateDebutFilter) : null;
    const endFilter = this.dateFinFilter ? new Date(this.dateFinFilter) : null;

    if (startFilter && endFilter) {
      return debut && fin && debut >= startFilter && fin <= endFilter;
    } else if (startFilter) {
      return debut && debut >= startFilter;
    } else if (endFilter) {
      return fin && fin <= endFilter;
    }
    return true; // pas de filtre
  });
}
  ngOnInit(): void {
    this.getAllContrats();
     const role = localStorage.getItem('userRole');
    this.isAdmin = role === 'ADMIN';
  }



  toggleStatus(contrat: any) {
  this.contratService.toggleContratStatus(contrat.numPolice).subscribe({
    next: (res) => {
      contrat.status = res.status; // met à jour l'objet local
      this.messageService.add({
        severity: 'success',
        summary: 'Statut modifié',
        detail: `Le contrat ${contrat.numPolice} est maintenant ${contrat.status}`
      });
    },
    error: (err) => {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de modifier le statut'
      });
    }
  });
}



 getAllContrats() {
  this.loading = true;
  this.contratService.getAllContrat().subscribe({
    next: (data) => {
      // Convertir status en booléen pour le toggle
      this.contrats = data.map(c => ({
        ...c,
        fige: c.status === 'figé'  // ✅ true si figé, false sinon
      }));
      this.filteredContrats = [...this.contrats];
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
    }
  });
}


onGlobalFilter(event: any) {
  const value = event.target.value.toLowerCase();

  this.filteredContrats = this.contrats.filter(c => {
    const fractionnementLabel = this.getFractionnementLabel(c.fractionnement).toLowerCase();

    return (
      c.numPolice?.toLowerCase().includes(value) ||
      c.adherent?.codeId?.toLowerCase().includes(value) ||
      fractionnementLabel.includes(value) || // ✅ on filtre sur le libellé lisible
      c.codeRenouvellement?.toLowerCase().includes(value) ||
      c.branche?.toLowerCase().includes(value) ||
      c.typeContrat?.toLowerCase().includes(value) ||
      c.codeAgence?.toLowerCase().includes(value) ||
      c.primeTTC?.toString().includes(value)
    );
  });
}

  clearFilter() {
    this.filteredContrats = this.contrats;
  }

editContrat(contrat: Contrat) {
  if (contrat.branche === 'M') {
    this.router.navigate(['Modif_ContratM', contrat.numPolice]);
  }
}


  async downloadPdf(numPolice: string) {
   
  
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
        // 🔹 Ajout du console.log
  console.log("===== Préparation PDF =====");
  console.log("Extensions:", extensions);
  console.log("ClauseIds:", contratData.clauseIds || []);
  console.log("Clausiers:", this.clausiers || []);
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
      nature: contratData.nature,
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
}
