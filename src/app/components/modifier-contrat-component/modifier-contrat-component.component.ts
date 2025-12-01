
import { ChangeDetectorRef, Component, NgZone, OnInit ,HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, ContratDTO, Fractionnement, CodeRenouvellement, Branche, TypeContrat, SectionDTO, ContratResponseDTO, GarantieResponseDTO, SectionResponseDTO,RcConfigurationDTO } from '@/layout/service/contrat';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfGeneratorService } from '@/layout/service/PdfGeneratorService';
import { AuthService } from '@/layout/service/auth';

interface Exclusion {
  id: number;
  nom: string;
}

interface GarantieParent {
  id: number;
  nom: string;
  sousGaranties: { label: string; value: number }[];
  exclusions: Exclusion[];
}
// Ajouter cette interface si elle n'existe pas
interface SousGarantieWithDetails {
  id: number;
  nom: string;
  garantie: {
    id: number;
    libelle: string;
  };
}

interface GarantieComposant  {
  sectionId: number;
  sousGarantieId: number;
  franchise?: number;
  maximum?: number;
  minimum?: number;
  capitale?: number;
  primeNET?: number;
  exclusionsIds?: number[];
  exclusionsOptions?: Exclusion[];
   nouvelleExclusion?: string;
   filteredExclusionsOptions?: Exclusion[];
  keyboardFilterExclusions?: string;
  lastKeyTimeExclusions?: number;
  filterTimeoutExclusions?: any;
 garantieParentId?: number;
  garantieParentLibelle?: string;
  filteredSousGarantiesOptions?: { label: string; value: number }[];
  keyboardFilterGaranties?: string;
  lastKeyTimeGaranties?: number;
  filterTimeoutGaranties?: any;
   hasFranchise?: boolean;
}

interface SituationRisque {
  numPolice: string;
  identification: string;
  adresse: string;
  natureConstruction: string;
  contiguite: string;
  avoisinage: string;
  garanties: GarantieComposant[]; // ← Changer ici
}

// CORRIGER l'interface RCExploitation
interface RCExploitation {
  id?: number;
  limiteAnnuelleDomCorporels: number;
  limiteAnnuelleDomMateriels: number;
  limiteParSinistre: number;
  franchise: number;
  primeNET: number;
  situations: SituationRisque[];
  exclusionsIds: number[]; // ← CORRIGER: exclusionsIds (pas exclusionsRcIds)
  objetDeLaGarantie: string; // ← CORRIGER: rendre obligatoire
  sectionIds?: number[]; // ← AJOUTER si nécessaire pour le mapping
  
}
interface ExtensionDTO {
  titre: string;
  texte: string;
}
export interface clausiersDTO {
  nom: string;
  id: number;
}
@Component({
  selector: 'app-modifier-contrat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    StepsModule,
    ToastModule,
    CheckboxModule,
    InputNumberModule
  ],
  templateUrl: './modifier-contrat-component.component.html',
  styleUrls: ['./modifier-contrat-component.component.scss']
})
export class ModifierContratComponent implements OnInit {
extensions: ExtensionDTO[] = [];
selectedClausiersIds: number[] = [];
clausiers: any[] = [];
sousGarantiesWithDetails: SousGarantieWithDetails[] = [];
rcExploitations: RCExploitation[] = [];
currentRcExploitation: RCExploitation = this.createNewRcExploitation();
 isLoadingExclusions = false;
  currentStep = 0;
  numPolice = '';
  nom_assure = '';
  codeAgence: string = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '', nouveau: true };
  fractionnement = '';
  codeRenouvellement = '';
  branche = '';
  service: number = 0;
  primeTTC: number = 0;

  typeContrat = '';
  dateDebut = '';
  dateFin = '';
  startTime = '';
  nature: string = '';
  dateOffre: string = '';


// CORRIGER cette initialisation :
rcExploitation: RCExploitation = {
  limiteAnnuelleDomCorporels: 0,
  limiteAnnuelleDomMateriels: 0,
  limiteParSinistre: 0,
  franchise: 0,
  primeNET: 0,
  objetDeLaGarantie: '',
  exclusionsIds: [], // ← CORRIGER: exclusionsIds au lieu de exclusionsRcIds
  situations: [] // ← AJOUTER: situations est obligatoire dans l'interface
};


  selectedExclusionsRC: number[] = []; 
 nouvelleExclusionRC: string = '';
  exclusionsRC: Exclusion[] = [];
  selectedSituationsNames: string = '';
  situationRisques: SituationRisque[] = [];
  currentSituationRisque: SituationRisque = {
    numPolice: '',
    identification: '',
    adresse: '',
    natureConstruction: '',
    contiguite: '',
    avoisinage: '',
    garanties: []
  };
  sousGarantiesOptions: { label: string; value: number }[] = [];
  contrat!: ContratDTO;
preambule: string = '';
preambuleMaxLength: number = 2000;
keyboardFilterExclusions: string = '';
lastKeyTimeExclusions: number = 0;
filterTimeoutExclusions: any;
filteredExclusionsRC: any[] = [];
  // Options
  codeAgenceOptions = [
    { label: 'ARIANA', value: '151' },
    { label: 'TUNIS', value: '152' },
    { label: 'SOUSSE', value: '153' }
  ];
   fractionnementOptions = [
    { label: 'Annuel', value: 'ZERO' },
    { label: 'Semestriel', value: 'UN' },
    { label: 'Trimestriel', value: 'DEUX' }
  ];
  codeRenouvellementOptions = [
    { label: 'T', value: 'T' },
    { label: 'R', value: 'R' }
  ];
  brancheOptions = [
    { label: 'M', value: 'M' },
    { label: 'R', value: 'R' },
    { label: 'I', value: 'I' }
  ];
  typeContratOptions = [
    { label: "Appel d'offre", value: "APPEL_D_OFFRE" },
    { label: "Autre", value: "AUTRE" }
  ];
  steps = [
    { label: 'Informations générales' },
    { label: 'Préanbule' },
    { label: 'Extensions' },
    { label: 'Situations de Risques' },
    { label: 'Garanties' },
    { label: 'Exclusions' },
    { label: 'Rc Exploitation' },
    { label: 'Clausiers' }
  ];
    contratData: any = null;
   pdfUrl: SafeResourceUrl | null = null;
   showModele = false;
  private lockCheckInterval: any;
  private lockCheckPeriod = 30000; // Vérifier toutes les 30 secondes
  private isLockedByCurrentUser = true;
  constructor(
    private contratService: ContratService,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone,
    private pdfService: PdfGeneratorService,
     private sanitizer: DomSanitizer
  ) {}

private prepareCurrentDataForPdf(): any {
  // 🔹 Construction des sections de risque
  const sections = this.situationRisques.map((situation, index) => ({
    identification: situation.identification.trim(),
    adresse: situation.adresse?.trim() || "Non spécifié",
    natureConstruction: situation.natureConstruction?.trim() || "Non spécifié",
    contiguite: situation.contiguite?.trim() || "Non spécifié",
    avoisinage: situation.avoisinage?.trim() || "Non spécifié",
    numPolice: this.numPolice,
    garanties: this.prepareGarantiesForPdf(situation.garanties)
  }));


  // 🔹 Construction des configurations RC
  const rcConfigurations = this.rcExploitations.map(rcExploitation => {
    const sectionIds = rcExploitation.situations
      .map(situation => {
        const index = this.situationRisques.findIndex(
          s => s.identification === situation.identification
        );
        return index !== -1 ? index : null;
      })
      .filter(id => id !== null) as number[];

    return {
      id: rcExploitation.id,
      limiteAnnuelleDomCorporels: rcExploitation.limiteAnnuelleDomCorporels ?? 0,
      limiteAnnuelleDomMateriels: rcExploitation.limiteAnnuelleDomMateriels ?? 0,
      limiteParSinistre: rcExploitation.limiteParSinistre ?? 0,
      franchise: rcExploitation.franchise ?? 0,
      primeNET: rcExploitation.primeNET ?? 0,
      exclusionsRcIds: rcExploitation.exclusionsIds || [],
      sectionIds
    };
  });

  // 🔹 Préparation des garanties groupées par parent
  const garantiesParParent = this.prepareGarantiesParParent();
const extensions = (this.extensions || [])
    .filter(e => e.titre?.trim() || e.texte?.trim())
    .map(e => ({
      titre: e.titre?.trim() || '',
      texte: e.texte?.trim() || ''
    }));
 const clauseIds = this.selectedClausiersIds || [];
console.log(clauseIds);
  // ✅ Retour global des données prêtes pour le PDF
  return {
    numPolice: this.numPolice,
    nom_assure: this.nom_assure,
    codeAgence: this.codeAgence,
    adherent: this.adherent,
    fractionnement: this.fractionnement,
    codeRenouvellement: this.codeRenouvellement,
    branche: this.branche,
    primeTTC:this.primeTTC,
    typeContrat: this.typeContrat,
    dateDebut: this.dateDebut,
    dateFin: this.dateFin,
    preambule: this.preambule,
    service: this.service,
    nature: this.nature,
    // ✅ L'objet de la garantie est global
    objetDeLaGarantie: this.objetGarantieRc,

    // 🔹 Toutes les exclusions disponibles (globales)
    exclusionsRC: this.exclusionsRC || [],

    // 🔹 Détails des sections et RCs
    sections,
    rcConfigurations,

    // 🔹 Garanties groupées par parent
    garantiesParParent,
    extensions,
    clauseIds,
    clausiers: this.clausiers,
     
  };
  
}

addExtension() {
  if (!this.extensions) this.extensions = [];
  this.extensions.push({ titre: '', texte: '' });
}

removeExtension(index: number) {
  this.extensions.splice(index, 1);
}
// navigation des steps
prevStep() {
  if (this.currentStep > 0) {
    // Cas : step 2 Extensions, typeContrat n'est pas APPEL_D_OFFRE → revenir à 1
    if (this.currentStep === 2 && this.typeContrat !== 'APPEL_D_OFFRE') {
      this.currentStep = 1;
    }
    // Cas : step 3 Situations, typeContrat n'est pas APPEL_D_OFFRE → revenir à 1 (sauter 2)
    else if (this.currentStep === 3 && this.typeContrat !== 'APPEL_D_OFFRE') {
      this.currentStep = 1;
    }
    else {
      this.currentStep--;
    }
  }
}

nextStep() {
  // incrémente le step seulement si < max
  const maxStep = this.getMaxStep();
  if (this.currentStep < maxStep) {
    // Si on est sur le step 1 (Préambule) et que le type de contrat n'est pas APPEL_D_OFFRE, on saute le step 2
    if (this.currentStep === 1 && this.typeContrat !== 'APPEL_D_OFFRE') {
      this.currentStep = 3; // passer directement aux situations
    } else {
      this.currentStep++;
    }
  }
}

// fonction pour déterminer le step max selon type de contrat
getMaxStep(): number {
  // Ici 6 est le dernier step RC Exploitation
  return 7;
}

// ✅ Préparer les exclusions pour une garantie spécifique (existant + nouvelle)
private prepareExclusionsForGarantie(garantie: GarantieComposant): any[] {
  const exclusions: any[] = [];

  // 🔹 Exclusions existantes via IDs
  if (garantie.exclusionsIds && garantie.exclusionsOptions) {
    exclusions.push(
      ...garantie.exclusionsIds
        .map(id => garantie.exclusionsOptions?.find(e => e.id === id))
        .filter(e => e != null)
        .map(e => ({ id: e!.id, nom: e!.nom || 'Exclusion sans libellé' }))
    );
  }

  // 🔹 Exclusion nouvellement ajoutée par l'utilisateur
  if (garantie.nouvelleExclusion) {
    exclusions.push({ id: 0, nom: garantie.nouvelleExclusion });
  }

  return exclusions;
}

// ✅ Ajouter les exclusions au parent en évitant les doublons
private addExclusionsToParent(garantie: GarantieComposant, parentData: any): void {
  this.prepareExclusionsForGarantie(garantie).forEach(exclusion => {
    if (!parentData.exclusionsUniques.has(exclusion.id)) {
      parentData.exclusionsUniques.set(exclusion.id, exclusion);
    }
  });
}
private prepareGarantiesParParent(): any[] {
  const garantiesParParentMap = new Map<number, {
    parent: { id: number; libelle: string };
    sousGaranties: {
      sousGarantieId: number;
      sousGarantieNom: string;
      exclusions: any[];
      situations: string[];
    }[];
    exclusionsUniques: Map<number, any>;
  }>();

  this.situationRisques.forEach(situation => {
    situation.garanties.forEach(garantie => {
      if (!garantie.sousGarantieId) return;

      // Récupération des détails de la sous-garantie
      const sousGarantieDetails = this.getSousGarantieDetails(garantie.sousGarantieId);

      // Détermination de l'ID et du libellé du parent
      const parentId = sousGarantieDetails?.garantie?.id ?? garantie.garantieParentId;
      const parentLibelle = sousGarantieDetails?.garantie?.libelle ?? garantie.garantieParentLibelle ?? "Garantie parent";

      if (!parentId) {
        console.warn(`⚠️ Impossible de trouver le parent pour la sous-garantie ID ${garantie.sousGarantieId}`);
        return;
      }

      // Initialiser le parent si nécessaire
      if (!garantiesParParentMap.has(parentId)) {
        garantiesParParentMap.set(parentId, {
          parent: { id: parentId, libelle: parentLibelle },
          sousGaranties: [],
          exclusionsUniques: new Map<number, any>()
        });
      }

      const parentData = garantiesParParentMap.get(parentId)!;

      // Préparer les exclusions pour cette sous-garantie
      const exclusionsGarantie = this.prepareExclusionsForGarantie(garantie);

      // Vérifier si la sous-garantie existe déjà
      const existingSousGarantie = parentData.sousGaranties.find(
        sg => sg.sousGarantieId === garantie.sousGarantieId
      );

      if (existingSousGarantie) {
        if (!existingSousGarantie.situations.includes(situation.identification)) {
          existingSousGarantie.situations.push(situation.identification);
        }
      } else {
        parentData.sousGaranties.push({
          sousGarantieId: garantie.sousGarantieId,
          sousGarantieNom: sousGarantieDetails?.nom ?? "Sous-garantie non trouvée",
          exclusions: exclusionsGarantie,
          situations: [situation.identification]
        });
      }

      // Ajouter les exclusions au parent
      this.addExclusionsToParent(garantie, parentData);
    });
  });

  // Convertir la Map en tableau
  return Array.from(garantiesParParentMap.values()).map(parentData => ({
    parent: parentData.parent,
    sousGaranties: parentData.sousGaranties,
    exclusions: Array.from(parentData.exclusionsUniques.values())
  }));
}

// ✅ Préparer les garanties pour les sections
private prepareGarantiesForPdf(garanties: GarantieComposant[]): any[] {
  return garanties.map(garantie => {
    const sousGarantieNom = this.getSousGarantieName(garantie.sousGarantieId);
    const exclusions = this.prepareExclusionsForGarantie(garantie);
    return {
      sousGarantieNom,
      sousGarantieId: garantie.sousGarantieId,
      franchise: garantie.franchise ?? 0,
      maximum: garantie.maximum ?? 0,
      minimum: garantie.minimum ?? 0,
      capitale: garantie.capitale ?? 0,
      primeNET: garantie.primeNET ?? 0,
      hasFranchise: garantie.hasFranchise ?? false,
      exclusions 
    };
  });
}
toggleModele() {
  if (!this.showModele) {
    // Préparer les données actuelles pour le PDF
    const currentData = this.prepareCurrentDataForPdf();
    this.generatePdf(currentData);
  }
  this.showModele = !this.showModele;
}
  generatePdf(data: any) {
    this.pdfService.generateContratPDF(data).then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      this.showModele = true;
    }).catch(error => {
      console.error('Error generating PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de la génération du PDF'
      });
    });
  }

   ngOnInit(): void {
  this.loadClausiers();
    this.loadSousGaranties().then(() => {
      this.route.params.subscribe(params => {
        this.numPolice = params['numPolice'];
        if (this.numPolice) {
          this.contratService.lockContrat(this.numPolice).subscribe({
            next: contrat => {
              this.contrat = contrat;
const now = new Date();
const formatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Africa/Tunis',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

// Formater proprement en ISO (YYYY-MM-DDTHH:mm:ss)
const parts = formatter.formatToParts(now).reduce((acc, part) => {
  acc[part.type] = part.value;
  return acc;
}, {} as any);

this.startTime = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;

console.log("Heure Tunisie ISO:", this.startTime);

 this.startLockCheckTimer();
              this.loadContrat(this.numPolice);
            },
            error: err => this.handleLockError(err)
          });
        }
      });
    });

  }

 private startLockCheckTimer(): void {
    this.lockCheckInterval = setInterval(() => {
      this.checkLockStatus();
    }, this.lockCheckPeriod);
  }
 // Modifier la méthode checkLockStatus comme ceci :
private checkLockStatus(): void {
  if (!this.numPolice) return;

  this.contratService.checkLockStatus(this.numPolice).subscribe({
    next: (isLocked: boolean) => {
      if (!isLocked) {
        this.isLockedByCurrentUser = false;
        this.handleLockLost();
      }
      // Si isLocked = true, c'est que le contrat est toujours verrouillé par l'utilisateur courant
    },
    error: (err) => {
      console.error('Erreur lors de la vérification du verrou:', err);
      // En cas d'erreur, on considère que le verrou est perdu par sécurité
      this.isLockedByCurrentUser = false;
      this.handleLockLost();
    }
  });
  
}
loadClausiers() {
  this.contratService.getAllClausiers().subscribe({
    next: (data) => {
      this.clausiers = data;
      console.log('📋 Clausiers chargés:', this.clausiers);
      console.log('🔄 Nombre de clausiers:', this.clausiers.length);
      console.log('✅ IDs sélectionnés:', this.selectedClausiersIds);
    },
    error: (err) => {
      console.error('❌ Erreur chargement clausiers', err);
    }
  });
}
  // Ajouter cette méthode pour gérer la perte du verrou
  private handleLockLost(): void {
    // Arrêter le timer
    this.stopLockCheckTimer();
    
    this.messageService.add({
      severity: 'warn',
      summary: 'Verrou perdu',
      detail: 'Ce contrat n\'est plus verrouillé par votre session. Redirection...'
    });

    // Rediriger après un délai
    setTimeout(() => {
      this.router.navigate(['/Landing']);
    }, 1500);
  }

  // Ajouter cette méthode pour arrêter le timer
  private stopLockCheckTimer(): void {
    if (this.lockCheckInterval) {
      clearInterval(this.lockCheckInterval);
      this.lockCheckInterval = null;
    }
  }
  toggleNouveau(adherent: any) {
    adherent.nouveau = !adherent.nouveau;
  }

  handleLockError(err: any) {
    if (err.status === 409) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contrat verrouillé',
        detail: 'Ce contrat est déjà verrouillé par un autre utilisateur.'
      });
      setTimeout(() => this.router.navigate(['/Landing']), 2000);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: err.error?.message || "Impossible de verrouiller le contrat."
      });
    }
  }
  
  ajouterExclusionPersonnalisee(garantie: GarantieComposant) {
  if (!garantie.nouvelleExclusion || !garantie.nouvelleExclusion.trim()) {
    this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez saisir le nom de l\'exclusion' });
    return;
  }

  if (!garantie.sousGarantieId) {
    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Garantie non sélectionnée' });
    return;
  }

  // 🔥 AJOUT: Vérifier qu'une branche est sélectionnée
  if (!this.branche) {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Veuillez sélectionner une branche avant d\'ajouter une exclusion' 
    });
    return;
  }

  // 🔥 AJOUT: Inclure la branche dans la requête
  const nouvelleExclusion = {
    nom: garantie.nouvelleExclusion.trim(),
    garantie: {
      id: garantie.sousGarantieId
    },
    branche: this.branche // 🔥 AJOUT DE LA BRANCHE
  };

  this.contratService.createExclusion(nouvelleExclusion).subscribe({
    next: (exclusionCreee: Exclusion) => {
      // Initialiser les tableaux si nécessaire
      if (!garantie.exclusionsOptions) {
        garantie.exclusionsOptions = [];
      }
      if (!garantie.exclusionsIds) {
        garantie.exclusionsIds = [];
      }

      // Ajouter l'exclusion créée
      garantie.exclusionsOptions.push(exclusionCreee);
      garantie.exclusionsIds.push(exclusionCreee.id);
      
      // Réinitialiser le champ
      garantie.nouvelleExclusion = '';
      
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Succès', 
        detail: `Exclusion ajoutée avec succès pour la branche ${this.branche}` 
      });
    },
    error: (error) => {
      console.error('Erreur lors de la création de l\'exclusion:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: 'Erreur lors de l\'ajout de l\'exclusion' 
      });
    }
  });
}

ajouterExclusionRC() {
  if (!this.nouvelleExclusionRC || !this.nouvelleExclusionRC.trim()) {
    this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez saisir le nom de l\'exclusion RC' });
    return;
  }

  const request = {
    nom: this.nouvelleExclusionRC.trim()
  };

  this.contratService.createExclusionRC(request).subscribe({
    next: (exclusionCreee: Exclusion) => {
      // Ajouter l'exclusion créée à la liste
      this.exclusionsRC.push(exclusionCreee);
      
      // Cocher automatiquement la nouvelle exclusion
      this.selectedExclusionsRC.push(exclusionCreee.id);
      
      // Réinitialiser le champ
      this.nouvelleExclusionRC = '';
      
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Exclusion RC ajoutée avec succès' });
    },
    error: (error) => {
      console.error('Erreur lors de la création de l\'exclusion RC:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: 'Erreur lors de l\'ajout de l\'exclusion RC' 
      });
    }
  });
}


 getSousGarantieDetails(sousGarantieId: number): SousGarantieWithDetails | undefined {
  // 🔥 CORRECTION: Convertir en number et gérer les types
  const id = Number(sousGarantieId);
  
  if (isNaN(id)) {
    console.error(`❌ ID de sous-garantie invalide: ${sousGarantieId}`);
    return undefined;
  }

  const result = this.sousGarantiesWithDetails.find(sg => {
    // Comparer en convertissant les deux en number
    const sgId = Number(sg.id);
    return !isNaN(sgId) && sgId === id;
  });
  
  if (!result) {
    console.warn(`🔍 Sous-garantie ${id} non trouvée. Liste disponible:`, 
      this.sousGarantiesWithDetails.map(sg => ({ 
        id: sg.id, 
        type: typeof sg.id,
        nom: sg.nom 
      })));
  } else {
  }
  
  return result;
}

  getGarantieParentId(sousGarantieId: number): number | undefined {
    const sousGarantie = this.getSousGarantieDetails(sousGarantieId);
    return sousGarantie?.garantie?.id;
  }

  getGarantieParentLibelle(sousGarantieId: number): string {
    const sousGarantie = this.getSousGarantieDetails(sousGarantieId);
    return sousGarantie?.garantie?.libelle || 'Garantie inconnue';
  }

loadContrat(numPolice: string) {
  this.contratService.getContrat(numPolice).subscribe({
    next: (contrat: ContratResponseDTO) => {
      this.numPolice = contrat.numPolice;
      this.nom_assure = contrat.nom_assure;
      this.codeAgence = contrat.codeAgence;
      this.adherent = contrat.adherent;
      this.fractionnement = contrat.fractionnement;
      this.codeRenouvellement = contrat.codeRenouvellement;
      
      this.branche = contrat.branche;
      this.nature = contrat.nature;
      this.dateOffre = contrat.dateOffre;

      this.service = contrat.service;
      this.primeTTC = contrat.primeTTC;
      this.typeContrat = contrat.typeContrat;
      this.dateDebut = contrat.dateDebut;
      this.dateFin = contrat.dateFin;
      this.preambule = contrat.preambule || '';
      this.extensions = contrat.extensions || [];
      this.selectedClausiersIds = contrat.clauseIds || [];
      this.loadSousGarantiesWithDetails().then(() => {
        
        this.situationRisques = (contrat.sections || []).map((section: SectionResponseDTO, index: number) => ({
          numPolice: this.numPolice,
          identification: section.identification,
          adresse: section.adresse,
          natureConstruction: section.natureConstruction,
          contiguite: section.contiguite,
          avoisinage: section.avoisinage,
          garanties: (section.garanties || []).map((g: GarantieResponseDTO) => {
            const garantieComposant: GarantieComposant = {
              sectionId: g.sectionId,
              sousGarantieId: g.sousGarantieId,
              franchise: g.franchise,
              maximum: g.maximum,
              minimum: g.minimum,
              hasFranchise: (g.franchise ?? 0) > 0,
              capitale: g.capitale,
              primeNET: g.primeNet,
              exclusionsIds: g.exclusions?.map(e => e.exclusionId) || [],
              exclusionsOptions: [],
              garantieParentId: g.garantieParent?.id,
              garantieParentLibelle: g.garantieParent?.libelle || 'Sans parent',
              // Initialiser les propriétés de filtrage avec les sous-garanties chargées
              filteredSousGarantiesOptions: [...this.sousGarantiesOptions],
              keyboardFilterGaranties: '',
              lastKeyTimeGaranties: 0,
              filterTimeoutGaranties: null
            };

            // 🔥 CORRECTION: Si la garantie parent n'est pas définie, la récupérer depuis les sous-garanties chargées
            if (!garantieComposant.garantieParentId && g.sousGarantieId) {
              const sousGarantieDetails = this.getSousGarantieDetails(g.sousGarantieId);
              if (sousGarantieDetails) {
                garantieComposant.garantieParentId = sousGarantieDetails.garantie.id;
                garantieComposant.garantieParentLibelle = sousGarantieDetails.garantie.libelle;
              }
            }

            return garantieComposant;
          })
        }));

        // Utiliser la nouvelle méthode optimisée
        this.loadExclusionsForAllGarantiesOptimized();
        this.initializeRCExploitation(contrat);
        this.cd.detectChanges();
      }).catch(error => {
        console.error('❌ Erreur lors du chargement des sous-garanties:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les sous-garanties pour cette branche'
        });
      });

    },
    error: err => {
      console.error('Erreur chargement contrat', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger le contrat'
      });
    }
  });
}
// Vérifier si une exclusion est sélectionnée pour l'affichage dans le groupe
isExclusionSelectedForGroup(garanties: GarantieComposant[], exclusionId: number): boolean {
  return garanties.some(garantie => 
    garantie.exclusionsIds?.includes(exclusionId)
  );
}

// Vérifier si une exclusion est sélectionnée pour une garantie individuelle
isExclusionSelected(garantie: GarantieComposant, exclusionId: number): boolean {
  return garantie.exclusionsIds?.includes(exclusionId) || false;
}

// Méthode optimisée pour charger les exclusions
loadExclusionsForAllGarantiesOptimized() {
  this.isLoadingExclusions = true;
  
  const promises = this.situationRisques.map(situation => {
    return situation.garanties.map(garantie => {
      if (garantie.sousGarantieId > 0) {
        return new Promise<void>((resolve) => {
          this.loadExclusionsForGarantieParent(garantie).then(() => {
            this.initializeFilterProperties(garantie);
            resolve();
          });
        });
      }
      return Promise.resolve();
    });
  }).flat();

  Promise.all(promises).then(() => {
    this.situationRisques.forEach(situation => {
      const groups = this.getGarantiesGroupedByParent(situation);
      groups.forEach(group => {
        this.syncExclusionsForGroup(group.garanties);
      });
    });
    
    this.isLoadingExclusions = false;
    this.cd.detectChanges();
  });
}
// Modifier loadExclusionsForAllGaranties pour gérer le groupement
loadExclusionsForAllGaranties() {
  this.isLoadingExclusions = true;
  
  const promises = this.situationRisques.map(situation => {
    return situation.garanties.map(garantie => {
      if (garantie.sousGarantieId > 0) {
        return new Promise<void>((resolve) => {
          // Charger les exclusions par garantie parent, pas par sous-garantie
          this.loadExclusionsForGarantieParent(garantie).then(() => resolve());
        });
      }
      return Promise.resolve();
    });
  }).flat();

  Promise.all(promises).then(() => {
    this.isLoadingExclusions = false;
    this.cd.detectChanges();
  });
}

// Nouvelle méthode pour charger les exclusions par branche et garantie parent
loadExclusionsForGarantieParent(garantie: GarantieComposant): Promise<void> {
  return new Promise((resolve) => {
    // Vérifications complètes
    if (!garantie.garantieParentId || garantie.garantieParentId <= 0) {
      console.warn('❌ Garantie parent non définie pour:', garantie);
      garantie.exclusionsOptions = [];
      garantie.filteredExclusionsOptions = [];
      resolve();
      return;
    }

    if (!this.branche) {
      console.warn('❌ Branche non définie');
      // Fallback vers l'ancienne méthode sans branche
      this.loadExclusionsForGarantieParentFallback(garantie).then(() => resolve());
      return;
    }
    // 🔥 UTILISER LA NOUVELLE API AVEC BRANCHE
    this.contratService.getExclusionsByBrancheAndGarantie(
      this.branche as Branche, 
      garantie.garantieParentId
    ).subscribe({
      next: (data) => {
        garantie.exclusionsOptions = data;
        garantie.filteredExclusionsOptions = [...data];
        resolve(); // 🔥 Résoudre la promise quand les données sont chargées
      },
      error: (error) => { 
        console.error('❌ Erreur chargement exclusions par branche:', error);
        // Fallback vers l'ancienne méthode
        this.loadExclusionsForGarantieParentFallback(garantie).then(() => resolve());
      }
    });
  });
}
// Ancienne méthode conservée comme fallback
private loadExclusionsForGarantieParentFallback(garantie: GarantieComposant): Promise<void> {
  return new Promise((resolve) => {
    if (garantie.garantieParentId && garantie.garantieParentId > 0) {
      this.contratService.getExclusionsByGarantie(garantie.garantieParentId).subscribe({
        next: (data) => {
          garantie.exclusionsOptions = data;
          garantie.filteredExclusionsOptions = [...data];
          resolve();
        },
        error: (error) => { 
          console.error('❌ Erreur chargement exclusions (fallback):', error);
          garantie.exclusionsOptions = [];
          garantie.filteredExclusionsOptions = [];
          resolve(); 
        }
      });
    } else {
      garantie.exclusionsOptions = [];
      garantie.filteredExclusionsOptions = [];
      resolve();
    }
  });
}
// Synchroniser les exclusions pour tout un groupe de garanties
syncExclusionsForGroup(garanties: GarantieComposant[]) {
  if (garanties.length === 0) return;

  const firstGarantie = garanties[0];
  
  // Copier les exclusionsOptions de la première garantie vers les autres
  garanties.forEach(garantie => {
    if (garantie !== firstGarantie) {
      garantie.exclusionsOptions = [...(firstGarantie.exclusionsOptions || [])];
      garantie.filteredExclusionsOptions = [...(firstGarantie.filteredExclusionsOptions || [])];
    }
  });
}

// Ajouter ces méthodes dans votre classe ModifierContratComponent



isExclusionPartiallySelected(garanties: GarantieComposant[], exclusionId: number): boolean {
  return garanties.some(garantie => 
    garantie.exclusionsIds?.includes(exclusionId)
  );
}

isExclusionFullySelected(garanties: GarantieComposant[], exclusionId: number): boolean {
  return garanties.every(garantie => 
    garantie.exclusionsIds?.includes(exclusionId)
  );
}

toggleExclusionForGroup(garanties: GarantieComposant[], exclusionId: number, event: any) {
  const isChecked = event.target.checked;
  
  garanties.forEach(garantie => {
    if (!garantie.exclusionsIds) garantie.exclusionsIds = [];
    
    if (isChecked) {
      // Cocher pour toutes les garanties du groupe
      if (!garantie.exclusionsIds.includes(exclusionId)) {
        garantie.exclusionsIds.push(exclusionId);
      }
    } else {
      // Décocher pour toutes les garanties du groupe
      garantie.exclusionsIds = garantie.exclusionsIds.filter(id => id !== exclusionId);
    }
  });
}

// Nouvelle méthode pour initialiser les propriétés de filtrage
initializeFilterProperties(garantie: GarantieComposant ) {
    if (!garantie.keyboardFilterExclusions) {
        garantie.keyboardFilterExclusions = '';
    }
    if (!garantie.filteredExclusionsOptions && garantie.exclusionsOptions) {
        garantie.filteredExclusionsOptions = [...garantie.exclusionsOptions];
    } else if (!garantie.filteredExclusionsOptions) {
        garantie.filteredExclusionsOptions = [];
    }
}


 loadExclusionsForGarantie(garantie: GarantieComposant ): Promise<void> {
  return new Promise((resolve) => {
    if (garantie.sousGarantieId && garantie.sousGarantieId > 0) {
      this.contratService.getExclusionsByGarantie(garantie.sousGarantieId).subscribe({
        next: (data) => {
          garantie.exclusionsOptions = data;
          garantie.filteredExclusionsOptions = [...data]; // 🔹 initialiser le filtered
          resolve();
        },
        error: () => { 
          garantie.exclusionsOptions = [];
          garantie.filteredExclusionsOptions = [];
          resolve(); 
        }
      });
    } else {
      garantie.exclusionsOptions = [];
      garantie.filteredExclusionsOptions = [];
      resolve();
    }
  });
}

  async loadSousGaranties(): Promise<void> {
    return new Promise((resolve) => {
      this.contratService.getSousGaranties(this.branche).subscribe({
        next: (data) => {
          this.sousGarantiesOptions = data.map(sg => ({ label: sg.nom, value: sg.id }));
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  toggleExclusion(garantie: GarantieComposant , exclusionId: number) {
    if (!garantie.exclusionsIds) garantie.exclusionsIds = [];
    const index = garantie.exclusionsIds.indexOf(exclusionId);
    if (index > -1) garantie.exclusionsIds.splice(index, 1);
    else garantie.exclusionsIds.push(exclusionId);
    garantie.exclusionsIds = [...garantie.exclusionsIds];
  }

 initializeRCExploitation(contrat: ContratResponseDTO) {

  // Réinitialiser
  this.rcExploitations = [];
  this.currentRcExploitation = this.createNewRcExploitation();
  this.exclusionsRC = [];

  // 🔥 CORRECTION: Les sectionIds sont des IDs de section, pas des indexes
  if (contrat.rcConfigurations && contrat.rcConfigurations.length > 0) {
    this.rcExploitations = contrat.rcConfigurations.map(rcConfig => {
      const situations: SituationRisque[] = [];
      
      
      if (rcConfig.sectionIds && contrat.sections) {
        rcConfig.sectionIds.forEach(sectionId => {
          
          // 🔥 CORRECTION: Rechercher par ID de section, pas par index
          const section = contrat.sections.find(s => s.id === sectionId);
          if (section) {
            
            const situation: SituationRisque = {
              numPolice: this.numPolice,
              identification: section.identification,
              adresse: section.adresse,
              natureConstruction: section.natureConstruction,
              contiguite: section.contiguite,
              avoisinage: section.avoisinage,
              garanties: [] // Les garanties ne sont pas nécessaires pour RC
            };
            situations.push(situation);
          } else {
            console.warn(`❌ Section non trouvée pour l'ID ${sectionId}`);
          }
        });
      }

      const rcExploitation: RCExploitation = {
        id: rcConfig.id,
        limiteAnnuelleDomCorporels: rcConfig.limiteAnnuelleDomCorporels || 0,
        limiteAnnuelleDomMateriels: rcConfig.limiteAnnuelleDomMateriels || 0,
        limiteParSinistre: rcConfig.limiteParSinistre || 0,
        franchise: rcConfig.franchise || 0,
        primeNET: rcConfig.primeNET || 0,
        situations: situations,
        exclusionsIds: rcConfig.exclusionsRcIds || [],
        objetDeLaGarantie: rcConfig.objetDeLaGarantie || this.objetGarantieRc
      };

      return rcExploitation;
    });

  } else {
  }

  // Charger toutes les exclusions RC
  this.contratService.getExclusionsRC().subscribe({
    next: (exclusions: Exclusion[]) => {
      this.exclusionsRC = exclusions;
      this.filteredExclusionsRC = [...this.exclusionsRC];
      this.cd.detectChanges();
    },
    error: () => {
      this.exclusionsRC = [];
      this.filteredExclusionsRC = [];
    }
  });
}
// Objet de garantie unique
get objetGarantieRc(): string {
  const nomAdherent = this.adherent?.nomRaison || 'l\'adhérent';
  return `Cette assurance a pour objet de garantir les conséquences pécuniaires de la responsabilité civile pouvant incomber à ${nomAdherent} et ce en raison des dommages corporels et matériels causés aux tiers.`;
}

   loadExclusionsRC(exclusionsIds: number[]) {
  this.contratService.getExclusionsRC().subscribe({
    next: (exclusions: Exclusion[]) => {
      const nouvellesExclusions = exclusions.filter(ex => 
        exclusionsIds.includes(ex.id) && !this.exclusionsRC.some(e => e.id === ex.id)
      );
      this.exclusionsRC = [...this.exclusionsRC, ...nouvellesExclusions];
      // 🔹 TOUJOURS METTRE À JOUR filteredExclusionsRC
      this.filteredExclusionsRC = [...this.exclusionsRC];
      this.cd.detectChanges();
    },
    error: () => {
      const fallbackExclusions = exclusionsIds.map(id => ({ id, nom: `Exclusion RC ${id}` }));
      this.exclusionsRC = [...this.exclusionsRC, ...fallbackExclusions.filter(ex => 
        !this.exclusionsRC.some(e => e.id === ex.id)
      )];
      // 🔹 METTRE À JOUR AUSSI EN CAS D'ERREUR
      this.filteredExclusionsRC = [...this.exclusionsRC];
      this.cd.detectChanges();
    }
  });
}

  lockContrat() {
    this.contratService.lockContrat(this.numPolice).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Contrat verrouillé' });
    });
  }

addSituation() {
  const newSituation: SituationRisque = {
    ...this.currentSituationRisque,
    numPolice: this.numPolice,
    garanties: [] // chaque situation a son propre tableau
  };
  this.situationRisques.push(newSituation);
}
  removeSituation(index: number) { this.situationRisques.splice(index, 1); }
  //addGarantie(situation: SituationRisque) { situation.garanties.push({ sectionId: 0, sousGarantieId: 0, exclusionsIds: [], exclusionsOptions: [],hasFranchise: false }); }
  addGarantie(situation: SituationRisque) { 
  situation.garanties.push({ 
    sectionId: 0, 
    sousGarantieId: 0, 
    franchise: 0,
    maximum: 0,
    minimum: 0,
    capitale: 0,
    primeNET: 0,
    hasFranchise: false,
    exclusionsIds: [], 
    exclusionsOptions: [],
    filteredExclusionsOptions: [],
    nouvelleExclusion: '',
    // 🔥 AJOUT: Propriétés pour le filtrage des exclusions
    keyboardFilterExclusions: '',
    lastKeyTimeExclusions: 0,
    filterTimeoutExclusions: null,
    // 🔥 AJOUT: Propriétés pour le filtrage des sous-garanties
    filteredSousGarantiesOptions: [...this.sousGarantiesOptions],
    keyboardFilterGaranties: '',
    lastKeyTimeGaranties: 0,
    filterTimeoutGaranties: null,
    // 🔥 AJOUT: Propriétés de la garantie parent (seront remplies quand une sous-garantie est sélectionnée)
    garantieParentId: undefined,
    garantieParentLibelle: undefined
  });
}
 onGarantieChange(garantie: GarantieComposant) {
  
  // Vider les exclusions existantes à chaque changement
  garantie.exclusionsOptions = [];
  garantie.filteredExclusionsOptions = [];
  garantie.exclusionsIds = [];
  garantie.garantieParentId = undefined;
  garantie.garantieParentLibelle = undefined;

  // 🔥 CORRECTION: Convertir en number
  const sousGarantieId = Number(garantie.sousGarantieId);
  
  if (sousGarantieId && sousGarantieId > 0) {
    // Récupérer la sous-garantie sélectionnée
    const sousGarantieDetails = this.getSousGarantieDetails(sousGarantieId);

    if (sousGarantieDetails && sousGarantieDetails.garantie) {
      
      // Définir la garantie parent
      garantie.garantieParentId = sousGarantieDetails.garantie.id;
      garantie.garantieParentLibelle = sousGarantieDetails.garantie.libelle;

      // 🔥 CORRECTION: Vider le cache AVANT de charger les exclusions
      this.clearGroupingCache();

      // 🔥 Charger les exclusions par branche et garantie parent
      this.loadExclusionsForGarantieParent(garantie).then(() => {
        // 🔥 CORRECTION: Forcer le rafraîchissement APRÈS le chargement
        this.clearGroupingCache();
        this.cd.detectChanges();
      });
    } else {
      console.warn(`❌ Sous-garantie non trouvée pour l'ID: ${sousGarantieId}`);
      this.tryFallbackGarantieParent(garantie);
    }
  } else {
  }
}
// 🔥 NOUVELLE MÉTHODE: Fallback pour récupérer la garantie parent
private tryFallbackGarantieParent(garantie: GarantieComposant) {
  // Essayer de trouver dans sousGarantiesOptions
  const sgOption = this.sousGarantiesOptions.find(sg => sg.value === garantie.sousGarantieId);
  
  if (sgOption) {

    this.loadExclusionsBySousGarantieFallback(garantie);
  } else {
    console.error(`❌ Sous-garantie ${garantie.sousGarantieId} non trouvée dans les options`);
  }
}

// 🔥 NOUVELLE MÉTHODE: Fallback pour charger les exclusions par sous-garantie
private loadExclusionsBySousGarantieFallback(garantie: GarantieComposant) {
  
  this.contratService.getExclusionsByGarantie(garantie.sousGarantieId).subscribe({
    next: (data) => {
      garantie.exclusionsOptions = data;
      garantie.filteredExclusionsOptions = [...data];
    },
    error: (error) => { 
      console.error('❌ Erreur chargement exclusions en fallback:', error);
      garantie.exclusionsOptions = [];
      garantie.filteredExclusionsOptions = [];
    }
  });
}
  removeGarantie(situation: SituationRisque, index: number) { situation.garanties.splice(index, 1); }

getGarantieName(sousGarantieId: number): string {
  // 🔥 CORRECTION: Convertir en number
  const id = Number(sousGarantieId);
  
  if (isNaN(id)) {
    return 'ID invalide';
  }

  const sg = this.sousGarantiesOptions.find(s => {
    const optionId = Number(s.value);
    return !isNaN(optionId) && optionId === id;
  });
  
  return sg ? sg.label : `Sous-garantie ${id}`;
}
 
 submit() {
  // Déverrouiller le contrat avant soumission
  this.contratService.unlockContrat(this.numPolice, false, this.startTime).subscribe({
    next: () => {
      // Construction des sections
      const sections = this.situationRisques.map((situation, index) => ({
        identification: situation.identification,
        adresse: situation.adresse,
        natureConstruction: situation.natureConstruction,
        contiguite: situation.contiguite,
        avoisinage: situation.avoisinage,
        numPolice: this.numPolice,
        garanties: situation.garanties.map(garantie => ({
          sectionId: garantie.sectionId || 0,
          sousGarantieId: Number(garantie.sousGarantieId) || 0,
          franchise: garantie.franchise ?? 0,
          maximum: garantie.maximum ?? 0,
          minimum: garantie.minimum ?? 0,
          capitale: garantie.capitale ?? 0,
          primeNET: garantie.primeNET ?? 0,
          exclusions: (garantie.exclusionsIds || []).map(id => ({ exclusionId: Number(id) }))
        }))
      }));

      // 🔥 CORRECTION: Construction des RC Configurations avec sectionIdentifications
      const rcConfigurations: RcConfigurationDTO[] = this.rcExploitations.map(rcExploitation => {
        // Utiliser les identifications des situations directement
        const sectionIdentifications = rcExploitation.situations
          .map(situation => situation.identification)
          .filter(identification => identification); // Filtrer les identifications vides

        return {
          id: rcExploitation.id,
          limiteAnnuelleDomCorporels: rcExploitation.limiteAnnuelleDomCorporels,
          limiteAnnuelleDomMateriels: rcExploitation.limiteAnnuelleDomMateriels,
          limiteParSinistre: rcExploitation.limiteParSinistre,
          franchise: rcExploitation.franchise,
          primeNET: rcExploitation.primeNET,
          objetDeLaGarantie: rcExploitation.objetDeLaGarantie,
          exclusionsRcIds: rcExploitation.exclusionsIds,
          // 🔥 ENVOYER sectionIdentifications AU LIEU DE sectionIds
          sectionIdentifications: sectionIdentifications
        };
      });

       const extensionsData = this.extensions?.map(ext => ({
        titre: ext.titre,
        texte: ext.texte
      })) || []
      const clauseIds = this.selectedClausiersIds; // ← Au lieu de this.selectedClausiers.map(...)
      // Construction du DTO complet
      const contratData: ContratDTO = {
        numPolice: this.numPolice,
        nom_assure: this.nom_assure,
        codeAgence: this.codeAgence,
        adherent: this.adherent,
        fractionnement: this.fractionnement as Fractionnement,
        codeRenouvellement: this.codeRenouvellement as CodeRenouvellement,
        branche: this.branche as Branche,
        typeContrat: this.typeContrat as TypeContrat,
        dateDebut: this.dateDebut,
        dateFin: this.dateFin,
         nature: this.nature,      // 🟣 AJOUT
        dateOffre: this.dateOffre,
        startTime: this.startTime,
        preambule: this.preambule,
        service: this.service,
        sections: sections,
        rcConfigurations: rcConfigurations,
        extensions: extensionsData,
        clauseIds
      };

console.log('Contrat à envoyer:', contratData);


      // Appel du service pour modifier le contrat
      this.contratService.modifierContrat(contratData).subscribe({
        
        next: (response) => {
      
          this.navigateAccordingToRole();
        },
        error: (err) => {
          let errorMessage = 'Impossible de mettre à jour le contrat';
          if (err.error?.message) {
            errorMessage += ': ' + err.error.message;
          } 
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage
          });
        }
      });
    },
    error: (err) => {
      console.error('Erreur déverrouillage:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de déverrouiller le contrat avant la modification.'
      });
    }
  });
}
 
cancel() {
  this.contratService.unlockContrat(this.numPolice, true, this.startTime).subscribe({
    next: () => this.navigateAccordingToRole(),
    error: () => this.navigateAccordingToRole()
  });
}

private navigateAccordingToRole() {
  // Exemple avec un service AuthService qui fournit le rôle
  const role = this.authService.getRole(); // 'ADMIN' ou 'USER'

  if (role === 'ADMIN') {
    this.router.navigate(['/contrat-list']);
  } else {
    this.router.navigate(['/Landing']);
  }
}



 isExclusionRCSelected(exclusionId: number): boolean {
  return !!this.rcExploitation.exclusionsIds?.includes(exclusionId);
}
loadAllExclusionsRC() {
  this.contratService.getExclusionsRC().subscribe({
    next: (exclusions: Exclusion[]) => {
      this.exclusionsRC = exclusions;
      // Les exclusions déjà sélectionnées restent cochées grâce à rcExploitation.exclusionsIds
      this.cd.detectChanges();
    },
    error: () => this.exclusionsRC = []
  });
}
// Filtrage clavier pour les exclusions d’une garantie
handleKeyboardExclusions(event: KeyboardEvent, garantie: GarantieComposant ) {
  // Ignorer touches ctrl, alt, meta, etc.
  if (event.ctrlKey || event.altKey || event.metaKey ||
      ['Control', 'Alt', 'Meta', 'Tab', 'Escape', 'Enter'].includes(event.key)) {
    return;
  }

  if (!garantie.keyboardFilterExclusions) garantie.keyboardFilterExclusions = '';

  if (event.key === 'Backspace') {
    event.preventDefault();
    garantie.keyboardFilterExclusions = garantie.keyboardFilterExclusions.slice(0, -1);
    this.applyGarantieFilter(garantie);
    return;
  }

  if (event.key.length > 1) return; // ignorer F1, flèches, etc.

  const now = Date.now();
  if (!garantie.lastKeyTimeExclusions || now - garantie.lastKeyTimeExclusions > 60000) {
    garantie.keyboardFilterExclusions = '';
  }

  garantie.keyboardFilterExclusions += event.key.toLowerCase();
  garantie.lastKeyTimeExclusions = now;

  this.applyGarantieFilter(garantie);

  if (garantie.filterTimeoutExclusions) clearTimeout(garantie.filterTimeoutExclusions);
  garantie.filterTimeoutExclusions = setTimeout(() => {
    garantie.keyboardFilterExclusions = '';
    this.applyGarantieFilter(garantie);
  }, 60000);
}
applyGarantieFilter(garantie: GarantieComposant ) {
  if (!garantie.keyboardFilterExclusions) {
    garantie.filteredExclusionsOptions = [...(garantie.exclusionsOptions || [])];
    return;
  }

  const filterText = garantie.keyboardFilterExclusions.toLowerCase();
  garantie.filteredExclusionsOptions = (garantie.exclusionsOptions || []).filter(exclusion =>
    exclusion.nom.toLowerCase().includes(filterText) ||
    exclusion.id.toString().includes(filterText)
  );
}
handleKeyboardGaranties(event: KeyboardEvent, garantie: GarantieComposant ) {
  if (event.ctrlKey || event.altKey || event.metaKey ||
      ['Control', 'Alt', 'Meta', 'Tab', 'Escape', 'Enter'].includes(event.key)) {
    return;
  }

  if (!garantie.keyboardFilterGaranties) garantie.keyboardFilterGaranties = '';

  if (event.key === 'Backspace') {
    event.preventDefault();
    garantie.keyboardFilterGaranties = garantie.keyboardFilterGaranties.slice(0, -1);
    this.applyGarantieOptionsFilter(garantie);
    return;
  }

  if (event.key.length > 1) return;

  const now = Date.now();
  if (!garantie.lastKeyTimeGaranties || now - garantie.lastKeyTimeGaranties > 60000) {
    garantie.keyboardFilterGaranties = '';
  }

  garantie.keyboardFilterGaranties += event.key.toLowerCase();
  garantie.lastKeyTimeGaranties = now;

  this.applyGarantieOptionsFilter(garantie);

  if (garantie.filterTimeoutGaranties) clearTimeout(garantie.filterTimeoutGaranties);
  garantie.filterTimeoutGaranties = setTimeout(() => {
    garantie.keyboardFilterGaranties = '';
    this.applyGarantieOptionsFilter(garantie);
  }, 60000);
}

// Filtrer les options des garanties
applyGarantieOptionsFilter(garantie: GarantieComposant ) {
  if (!garantie.keyboardFilterGaranties) {
    garantie.filteredSousGarantiesOptions = [...this.sousGarantiesOptions];
    return;
  }

  const filterText = garantie.keyboardFilterGaranties.toLowerCase();
  garantie.filteredSousGarantiesOptions = this.sousGarantiesOptions.filter(opt =>
    opt.label.toLowerCase().includes(filterText) || opt.value.toString().includes(filterText)
  );
}
 private initializeFilteredList() {
    if (this.exclusionsRC && this.exclusionsRC.length > 0) {
      this.filteredExclusionsRC = [...this.exclusionsRC];
    } else {
      this.filteredExclusionsRC = [];
    }
  }


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const activeElement = document.activeElement;
    const isExclusionsContainer = activeElement?.closest('.exclusions-scroll-container');
    
    if (isExclusionsContainer) {
      this.handleExclusionsFilter(event);
    }
  }

  private handleExclusionsFilter(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey ||
        ['Control', 'Alt', 'Meta', 'Tab', 'Escape', 'Enter'].includes(event.key)) {
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.keyboardFilterExclusions.length > 0) {
        this.keyboardFilterExclusions = this.keyboardFilterExclusions.slice(0, -1);
        this.applyExclusionsFilter();
      }
      return;
    }

    if (event.key.length > 1) return;

    const now = Date.now();
    if (now - this.lastKeyTimeExclusions > 60000) {
      this.keyboardFilterExclusions = '';
    }

    this.keyboardFilterExclusions += event.key.toLowerCase();
    this.lastKeyTimeExclusions = now;

    this.applyExclusionsFilter();

    if (this.filterTimeoutExclusions) {
      clearTimeout(this.filterTimeoutExclusions);
    }
    this.filterTimeoutExclusions = setTimeout(() => {
      this.resetExclusionsFilter();
    }, 60000);
  }

  private applyExclusionsFilter() {
  if (!this.keyboardFilterExclusions) {
    this.filteredExclusionsRC = [...this.exclusionsRC];
    return;
  }

  this.filteredExclusionsRC = this.exclusionsRC.filter(exclusion =>
    exclusion.nom.toLowerCase().includes(this.keyboardFilterExclusions) ||
    (exclusion.id && exclusion.id.toString().includes(this.keyboardFilterExclusions))
  );

}

  resetExclusionsFilter() {
    this.keyboardFilterExclusions = '';
    this.filteredExclusionsRC = [...this.exclusionsRC];
  }
  // Ajoutez cette méthode dans votre classe ModifierContratComponent
onBrancheChange() {
  if (this.branche) {
    this.loadSousGarantiesWithDetails().then(() => {
      // Recharger les sous-garanties pour toutes les garanties existantes
      this.reinitializeSousGarantiesForAllGaranties();
    });
  } else {
    // Réinitialiser les sous-garanties si aucune branche n'est sélectionnée
    this.sousGarantiesOptions = [];
    this.sousGarantiesWithDetails = [];
    this.sousGarantieNameCache.clear();
  }
}

// Méthode pour réinitialiser les sous-garanties pour toutes les garanties existantes
private reinitializeSousGarantiesForAllGaranties() {
  this.situationRisques.forEach(situation => {
    situation.garanties.forEach(garantie => {
      garantie.filteredSousGarantiesOptions = [...this.sousGarantiesOptions];
      garantie.keyboardFilterGaranties = '';
      garantie.lastKeyTimeGaranties = 0;
      garantie.filterTimeoutGaranties = null;
    });
  });
}
   loadSousGarantiesWithDetails(): Promise<void> {
    return new Promise((resolve) => {
      this.contratService.getSousGaranties(this.branche).subscribe({
        next: (sousGaranties: any[]) => {
          // Stocker les sous-garanties avec leurs détails complets
          this.sousGarantiesWithDetails = sousGaranties;
          
          // Garder l'ancienne structure pour la compatibilité
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
// Ajouter ces propriétés à votre classe
private garantiesGroupedCache = new Map<SituationRisque, any[]>();
private sousGarantieNameCache = new Map<number, string>();
private exclusionNameCache = new Map<string, string>();


getGarantiesGroupedByParent(situation: SituationRisque): any[] {
  
  // Vérifier le cache
  if (this.garantiesGroupedCache.has(situation)) {
    return this.garantiesGroupedCache.get(situation)!;
  }

  const groups: { [key: string]: any } = {};
  
  
  situation.garanties.forEach((garantie, index) => {
    
    if (garantie.garantieParentId) {
      const key = `${garantie.garantieParentId}-${garantie.garantieParentLibelle}`;
    
      
      if (!groups[key]) {
        groups[key] = {
          parentId: garantie.garantieParentId,
          parentLibelle: garantie.garantieParentLibelle,
          garanties: []
        };
      }
      
      groups[key].garanties.push(garantie);
    } else {
    }
  });

  const result = Object.values(groups);

  // Synchroniser les exclusions UNE SEULE FOIS
  result.forEach((group: any) => {
    this.syncExclusionsForGroup(group.garanties);
  });

  // Mettre en cache
  this.garantiesGroupedCache.set(situation, result);
  
  return result;
}
getSousGarantieName(sousGarantieId: number | string): string {
  
  // Convertir l'ID en nombre pour le cache (toujours stocker en number)
  const idNumber = Number(sousGarantieId);
  
  if (this.sousGarantieNameCache.has(idNumber)) {
    const name = this.sousGarantieNameCache.get(idNumber)!;
    return name;
  }

  // 🔥 CORRECTION: Rechercher avec les deux types
  let sg = this.sousGarantiesOptions.find(s => 
    s.value === sousGarantieId || 
    Number(s.value) === idNumber ||
    s.value.toString() === sousGarantieId.toString()
  );
  

  
  const name = sg ? sg.label : `Sous-garantie ${sousGarantieId}`;
  
  // Stocker dans le cache avec l'ID converti en number
  this.sousGarantieNameCache.set(idNumber, name);
  return name;
}

// Optimiser getExclusionName avec cache
getExclusionName(garantie: GarantieComposant, exclusionId: number): string {
  const cacheKey = `${garantie.sousGarantieId}-${exclusionId}`;
  
  if (this.exclusionNameCache.has(cacheKey)) {
    return this.exclusionNameCache.get(cacheKey)!;
  }

  const exclusion = garantie.exclusionsOptions?.find(e => e.id === exclusionId);
  const name = exclusion?.nom || `Exclusion ${exclusionId}`;
  
  this.exclusionNameCache.set(cacheKey, name);
  return name;
}

// Méthode pour vider le cache quand nécessaire
clearGroupingCache() {
  this.garantiesGroupedCache.clear();
  this.sousGarantieNameCache.clear();
  this.exclusionNameCache.clear();
}

// Appeler cette méthode quand les données changent
onDataChanged() {
  this.clearGroupingCache();
  this.cd.detectChanges();
}

createNewRcExploitation(): RCExploitation {
  return {
    id: Date.now(),
    limiteAnnuelleDomCorporels: 0,
    limiteAnnuelleDomMateriels: 0,
    limiteParSinistre: 0,
    franchise: 0,
    primeNET: 0,
    situations: [],
    exclusionsIds: [], // ← CORRIGER
    objetDeLaGarantie: this.objetGarantieRc // ← CORRIGER: valeur par défaut
  };
}

addRcExploitation() {
  if (this.currentRcExploitation.situations.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner au moins une situation'
    });
    return;
  }

  this.rcExploitations.push({ ...this.currentRcExploitation });
  this.currentRcExploitation = this.createNewRcExploitation();
  this.messageService.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'RC Exploitation ajoutée avec succès'
  });
}

removeRcExploitation(index: number) {
  this.rcExploitations.splice(index, 1);
}

// Méthodes pour gérer les situations
toggleRcSituation(situation: SituationRisque, event: any) {
  const isChecked = event.target.checked;
  
  // Initialiser le tableau si nécessaire
  if (!this.currentRcExploitation.situations) {
    this.currentRcExploitation.situations = [];
  }
  
  if (isChecked) {
    // Ajouter la situation si elle n'est pas déjà présente
    if (!this.currentRcExploitation.situations.some(s => s.identification === situation.identification)) {
      this.currentRcExploitation.situations.push({...situation});
    }
  } else {
    // Retirer la situation
    this.currentRcExploitation.situations = this.currentRcExploitation.situations.filter(
      s => s.identification !== situation.identification
    );
  }
  }


// Méthodes utilitaires
getRcSituationsNames(rc: RCExploitation): string {
  if (!rc.situations || !Array.isArray(rc.situations)) {
    return 'Aucune situation';
  }
  return rc.situations.map(s => s.identification).join(', ');
}

isSituationUsedInOtherRc(situation: SituationRisque, currentRcId: number | undefined): boolean {
  const targetRcId = currentRcId === undefined ? -1 : currentRcId;
  
  return this.rcExploitations.some(rc => 
    rc.id !== targetRcId && 
    rc.situations.some(s => s.identification === situation.identification)
  );
}

isSituationCoveredByRc(situation: SituationRisque): boolean {
  return this.rcExploitations.some(rc => 
    rc.situations.some(s => s.identification === situation.identification)
  );
}
// Dans votre classe component
situationSelectionStates: { [key: string]: boolean } = {};

// Initialiser les états de sélection
initializeSituationSelectionStates() {
  this.situationSelectionStates = {};
  this.situationRisques.forEach(situation => {
    this.situationSelectionStates[situation.identification] = this.isRcSituationSelected(situation);
  });
}

onRcSituationChange(situation: SituationRisque, event: any) {
  const isChecked = event.checked;
  
  if (isChecked) {
    if (!this.currentRcExploitation.situations.some(s => s.identification === situation.identification)) {
      this.currentRcExploitation.situations.push(situation);
    }
  } else {
    this.currentRcExploitation.situations = this.currentRcExploitation.situations.filter(
      s => s.identification !== situation.identification
    );
  }
  
  // Mettre à jour l'état
  this.situationSelectionStates[situation.identification] = isChecked;
}

isRcSituationSelected(situation: SituationRisque): boolean {
  if (!this.currentRcExploitation.situations) {
    this.currentRcExploitation.situations = [];
    return false;
  }
  
  return this.currentRcExploitation.situations.some(
    s => s.identification === situation.identification
  );
}
get canAddNewRc(): boolean {
  const allSituations = this.situationRisques;
  const usedSituations = new Set();
  
  this.rcExploitations.forEach(rc => {
    rc.situations.forEach(s => usedSituations.add(s.identification));
  });
  
  return allSituations.some(s => !usedSituations.has(s.identification));
}

// Gestion des exclusions pour la RC courante
toggleCurrentRcExclusion(exclusionId: number, event: any) {
  if (event.target.checked) {
    if (!this.currentRcExploitation.exclusionsIds.includes(exclusionId)) {
      this.currentRcExploitation.exclusionsIds.push(exclusionId);
    }
  } else {
    this.currentRcExploitation.exclusionsIds = this.currentRcExploitation.exclusionsIds.filter(
      id => id !== exclusionId
    );
  }
}

editRcExploitation(index: number) {
  this.currentRcExploitation = { ...this.rcExploitations[index] };
  
  // 🔥 CORRECTION: Initialiser les états de sélection pour le RC en cours d'édition
  this.initializeSituationSelectionForCurrentRc();
  
  this.rcExploitations.splice(index, 1);
}

// Méthode pour initialiser les états de sélection
private initializeSituationSelectionForCurrentRc() {
  // Réinitialiser tous les états
  this.situationSelectionStates = {};
  
  // Marquer comme sélectionnées les situations du RC courant
  if (this.currentRcExploitation.situations) {
    this.currentRcExploitation.situations.forEach(situation => {
      this.situationSelectionStates[situation.identification] = true;
    });
  }

}
isClausierSelected(clausierId: number): boolean {
  return this.selectedClausiersIds.includes(clausierId);
}

toggleClausierSelection(clausier: any) {
  if (this.isClausierSelected(clausier.id)) {
    this.selectedClausiersIds = this.selectedClausiersIds.filter(id => id !== clausier.id);
  } else {
    this.selectedClausiersIds.push(clausier.id);
  }
}}