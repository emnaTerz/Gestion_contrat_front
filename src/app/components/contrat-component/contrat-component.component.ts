
import { Component, OnInit,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { Branche, CodeRenouvellement, ContratDTO, ContratService, Fractionnement, SousGarantie, TypeContrat } from '@/layout/service/contrat';
import { FileUploadModule } from 'primeng/fileupload';
import { PdfGeneratorService } from '@/layout/service/PdfGeneratorService';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Exclusion {
  id: number;
  nom: string;
}
interface RcConfiguration {
  id: number;
  limiteAnnuelleDomCorporels: number;
  limiteAnnuelleDomMateriels: number;
  limiteParSinistre: number;
  franchise: number;
  primeNET: number;
  situations: SituationRisque[];
  exclusionsIds: number[];
}


export interface RcConfigurationDTO {
  id?: number;
  limiteAnnuelleDomCorporels: number;
  limiteAnnuelleDomMateriels: number;
  limiteParSinistre: number;
  franchise: number;
  primeNET: number;
  objetDeLaGarantie: string;
  exclusionsRcIds: number[];
  sectionIds: number[]; // IDs des sections (index dans le tableau sections)
}


interface Garantie {
  id: number;
  libelle: string; // ou "nom" si tu préfères
}
interface GarantieSection {
  sectionId: number;
  sousGarantieId: number;

  franchise?: number;
  maximum?: number;
  minimum?: number;
  capitale?: number;
  primeNET?: number;
  hasFranchise?: boolean;

  // 🔹 Champs liés aux exclusions
  exclusionsIds?: number[];
  exclusionsOptions?: Exclusion[];
  filteredExclusionsOptions?: Exclusion[];
  nouvelleExclusion?: string;

  // 🔹 Pour filtrage clavier
  keyboardFilterExclusions?: string;
  lastKeyTimeExclusions?: number;
  filterTimeoutExclusions?: any;

  // 🔹 Pour filtrage des sous-garanties
  filteredSousGarantiesOptions?: { label: string; value: number }[];
  keyboardFilterGaranties?: string;
  lastKeyTimeGaranties?: number;
  filterTimeoutGaranties?: any;
}
interface RcExploitation {
  id: number;
  limiteAnnuelleDomCorporels: number;
  limiteAnnuelleDomMateriels: number;
  limiteParSinistre: number;
  franchise: number;
  primeNET: number;
  situations: SituationRisque[]; // Situations sélectionnées pour cette RC
  exclusionsIds: number[];
}
interface SituationRisque {
  numPolice: string;
  identification: string;
  adresse: string;
  natureConstruction: string;
  contiguite: string;
  avoisinage: string;
  garanties: GarantieSection[];
  rcExploitationActive: boolean;
}

@Component({
  selector: 'app-contrat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    StepsModule,
    SelectButtonModule,
    MultiSelectModule,
    ToastModule,
    CheckboxModule,
    FileUploadModule,
  ],
  templateUrl: './contrat-component.component.html',
  styleUrls: ['./contrat-component.component.scss']
})
export class ContratComponent implements OnInit {
  currentStep: number = 0;
  showModele = false;
  numPolice: string = '';
  nom_assure: string = '';
  codeAgence: string = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '', nouveau: true };
  fractionnement: string = '';
  codeRenouvellement: string = '';
  branche: string = '';
  typeContrat: string = '';
  dateDebut: string = '';
  dateFin: string = '';
  startTime: string = '';
  service: number = 0;
preambule: string = '';
rcExploitations: RcExploitation[] = [];
currentRcExploitation: RcExploitation = this.createNewRcExploitation();
preambuleMaxLength: number = 2000;
selectedPdfFile: File | null = null;
pdfLines: string[] = [];  // lignes extraites du PDF
  contratData: any = null;
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
    { label: 'Préambule' },
    { label: 'Situations de Risques' },
    { label: 'Garanties' },
    { label: 'Exclusions' },
    { label: 'RC Exploitation' }
  ];

  situationRisques: SituationRisque[] = [];
  currentSituationRisque: SituationRisque = {
    numPolice: '',
    identification: '',
    adresse: '',
    natureConstruction: '',
    contiguite: '',
    avoisinage: '',
    garanties: [],
     rcExploitationActive: false, 
    
};
  sousGarantiesOptions: { label: string; value: number }[] = [];
  sousGarantiesMap: { [id: number]: SousGarantie } = {};
  editIndex: number | null = null;
  exclusionsRC: { id: number; nom: string }[] = [];
    nouvelleExclusionRC: string = '';

selectedExclusionsRC: number[] = []; 
keyboardFilterExclusions: string = '';
lastKeyTimeExclusions: number = 0;
filterTimeoutExclusions: any;
filteredExclusionsRC: any[] = [];

  rcExploitation = {
    limiteAnnuelleDomCorporels: 0,
    limiteAnnuelleDomMateriels: 0,
    limiteParSinistre: 0,
    franchise: 0,
    primeNET:0,
    objetDeLaGarantie : ''
  };
  
  selectedSituations: SituationRisque[] = [];
selectedSituationsName: string = '';
  rcConfigurations: RcConfiguration[] = [];
  currentRcConfig: RcConfiguration = this.createNewRcConfig();
  constructor(private contratService: ContratService, private messageService: MessageService , private pdfService: PdfGeneratorService, private sanitizer: DomSanitizer) {}
// In your component class
 pdfUrl: SafeResourceUrl | null = null;
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
toggleModele() {
  if (!this.showModele) {
    // Si contratData existe (après soumission), l'utiliser pour le PDF
    if (this.contratData) {
      this.generatePdf(this.contratData);
    } else {
      // Sinon, créer un objet temporaire avec les données actuelles
      const currentData = this.prepareCurrentDataForPdf();
      this.generatePdf(currentData);
    }
  }
  this.showModele = !this.showModele;
}

// ✅ Méthode pour préparer les données actuelles pour le PDF (avant soumission)
private prepareCurrentDataForPdf(): any {
  // 🔹 Construction des sections de risque AVEC gestion des garanties parents
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

  // 🔹 Préparation des garanties groupées par parent (pour éviter les duplications)
  const garantiesParParent = this.prepareGarantiesParParent();

  // ✅ Retour global des données prêtes pour le PDF
  return {
    numPolice: this.numPolice,
    nom_assure: this.nom_assure,
    codeAgence: this.codeAgence,
    adherent: this.adherent,
    fractionnement: this.fractionnement,
    codeRenouvellement: this.codeRenouvellement,
    branche: this.branche,
    typeContrat: this.typeContrat,
    dateDebut: this.dateDebut,
    dateFin: this.dateFin,
    preambule: this.preambule,
    service: this.service,

    // ✅ L'objet de la garantie est global
    objetDeLaGarantie: this.objetGarantieRc,

    // 🔹 Toutes les exclusions disponibles (globales)
    exclusionsRC: this.exclusionsRC || [],

    // 🔹 Détails des sections et RCs
    sections,
    rcConfigurations,

    // 🔹 NOUVEAU: Garanties groupées par parent (pour affichage unique des exclusions)
    garantiesParParent
  };
}

// ✅ Préparer les garanties groupées par parent pour éviter les duplications
private prepareGarantiesParParent(): any[] {
  const garantiesParParentMap = new Map<number, {
    parent: Garantie;
    sousGaranties: {
      sousGarantieId: number;
      sousGarantieNom: string;
      exclusions: any[];
      situations: string[]; // Liste des situations où cette sous-garantie apparaît
    }[];
    exclusionsUniques: Map<number, Exclusion>; // Pour éviter les doublons d'exclusions
  }>();

  // Parcourir toutes les situations et leurs garanties
  this.situationRisques.forEach(situation => {
    situation.garanties.forEach(garantie => {
      if (!garantie.sousGarantieId) return;

      const sousGarantie = this.sousGarantiesMap[garantie.sousGarantieId];
      if (!sousGarantie || !sousGarantie.garantie) return;

      const parentId = sousGarantie.garantie.id;
      
      // Initialiser l'entrée pour ce parent si elle n'existe pas
      if (!garantiesParParentMap.has(parentId)) {
        garantiesParParentMap.set(parentId, {
          parent: sousGarantie.garantie,
          sousGaranties: [],
          exclusionsUniques: new Map<number, Exclusion>()
        });
      }

      const parentData = garantiesParParentMap.get(parentId)!;

      // Vérifier si cette sous-garantie existe déjà
      const existingSousGarantie = parentData.sousGaranties.find(
        sg => sg.sousGarantieId === garantie.sousGarantieId
      );

      if (existingSousGarantie) {
        // Ajouter la situation à la liste des situations existantes
        if (!existingSousGarantie.situations.includes(situation.identification)) {
          existingSousGarantie.situations.push(situation.identification);
        }
      } else {
        // Créer une nouvelle entrée pour cette sous-garantie
        const sousGarantieData = {
          sousGarantieId: garantie.sousGarantieId,
          sousGarantieNom: sousGarantie.nom || "Sous-garantie non trouvée",
          exclusions: this.prepareExclusionsForGarantie(garantie),
          situations: [situation.identification]
        };

        parentData.sousGaranties.push(sousGarantieData);
      }

      // Ajouter les exclusions au pool d'exclusions uniques du parent
      this.addExclusionsToParent(garantie, parentData);
    });
  });

  // Convertir la Map en tableau et formater les exclusions
  return Array.from(garantiesParParentMap.values()).map(parentData => ({
    parent: {
      id: parentData.parent.id,
      libelle: parentData.parent.libelle || "Garantie parent"
    },
    sousGaranties: parentData.sousGaranties,
    exclusions: Array.from(parentData.exclusionsUniques.values())
  }));
}

// ✅ Préparer les exclusions pour une garantie spécifique
private prepareExclusionsForGarantie(garantie: GarantieSection): any[] {
  if (!garantie.exclusionsIds || !garantie.exclusionsOptions) return [];

  return garantie.exclusionsIds
    .map(exclusionId => {
      const exclusion = garantie.exclusionsOptions?.find(e => e.id === exclusionId);
      return exclusion ? {
        id: exclusion.id,
        nom: exclusion.nom || "Exclusion sans libellé"
      } : null;
    })
    .filter(exclusion => exclusion !== null) as any[];
}

// ✅ Ajouter les exclusions au parent (éviter les doublons)
private addExclusionsToParent(garantie: GarantieSection, parentData: any): void {
  if (!garantie.exclusionsIds || !garantie.exclusionsOptions) return;

  garantie.exclusionsIds.forEach(exclusionId => {
    const exclusion = garantie.exclusionsOptions?.find(e => e.id === exclusionId);
    if (exclusion && !parentData.exclusionsUniques.has(exclusion.id)) {
      parentData.exclusionsUniques.set(exclusion.id, {
        id: exclusion.id,
        nom: exclusion.nom || "Exclusion sans libellé"
      });
    }
  });
}

// ✅ Préparer les garanties pour les sections (format original conservé)
private prepareGarantiesForPdf(garanties: GarantieSection[]): any[] {
  return garanties.map(garantie => {
    const sousGarantieNom = this.sousGarantiesMap[garantie.sousGarantieId]?.nom ||
      "Sous-garantie non trouvée";
    
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

  ngOnInit(): void {
    this.loadSousGaranties();
     this.updatePreambule();
   const now = new Date(); // date locale
this.startTime = now.getFullYear() + '-' +
  String(now.getMonth()+1).padStart(2,'0') + '-' +
  String(now.getDate()).padStart(2,'0') + 'T' +
  String(now.getHours()).padStart(2,'0') + ':' +
  String(now.getMinutes()).padStart(2,'0') + ':' +
  String(now.getSeconds()).padStart(2,'0');
    this.loadExclusionsRC();
    this.updateObjetDeLaGarantie();
     this.filteredExclusionsRC = [...this.exclusionsRC];
  }

onPdfSelected(event: any) {
  const file: File = event.target.files[0];
  if (file) {
    this.selectedPdfFile = file;
    this.uploadSelectedPdf();
  }
}

uploadSelectedPdf() {
  if (!this.selectedPdfFile) return;

  this.contratService.uploadPdf(this.selectedPdfFile).subscribe({
    next: (result) => {
      this.pdfLines = result.lines || [];
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'PDF traité avec succès' });

      if (this.pdfLines.length > 0) {
        const lines = this.pdfLines;

        // ----------------- REMPLISSAGE CHAMPS INFO GENERALE -----------------
        
        // Adhérent
        this.adherent.codeId = lines[0] || '';
        this.adherent.nomRaison = lines[1] || '';
        this.adherent.adresse = lines.slice(1, 6).join(', ') || ''; // concatène lignes 1 à 5
        this.adherent.activite = lines[6] || '';
        this.adherent.nouveau = false;
        // Branche
        this.branche = lines[9] || '';

        // Service / Code Produit
        this.service = Number(lines[10]) || 0;

        // Numéro de police
        this.numPolice = lines[11] || '';

        // Code Agence
        this.codeAgence = lines[12] || '';

        // Fractionnement
        const fractionnementMap: any = { '5': 'ZERO', '2': 'UN', '4': 'DEUX' };
        this.fractionnement = fractionnementMap[lines[13]] || '';

        // Code renouvellement
        const codeRenouvellementMap: any = { 'T': 'T', 'R': 'R', 'L': 'T', 'By': 'T' };
        this.codeRenouvellement = codeRenouvellementMap[lines[14]] || '';

        // Dates
        this.dateDebut = this.formatDateForInput(lines[15]);
        this.dateFin = this.formatDateForInput(lines[16]);
      }
    },
    error: (err) => {
      console.error('Erreur upload PDF:', err);
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de traiter le PDF' });
    }
  });
}
// Fonction utilitaire pour convertir dd-MM-yyyy ou ddMMyyyy -> yyyy-MM-dd
formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  let dd: string, mm: string, yyyy: string;

  if (dateStr.includes('-')) {
    // Format dd-MM-yyyy
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    [dd, mm, yyyy] = parts;
  } else if (dateStr.length === 8) {
    // Format ddMMyyyy
    dd = dateStr.substring(0, 2);
    mm = dateStr.substring(2, 4);
    yyyy = dateStr.substring(4, 8);
  } else {
    return '';
  }

  return `${yyyy}-${mm}-${dd}`;
}


ajouterExclusionRC() {
  if (!this.nouvelleExclusionRC || !this.nouvelleExclusionRC.trim()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez saisir le nom de l\'exclusion RC'
    });
    return;
  }

  const request = { nom: this.nouvelleExclusionRC.trim() };

  this.contratService.createExclusionRC(request).subscribe({
    next: (exclusionCreee: Exclusion) => {
      // Ajouter dans la liste principale
      this.exclusionsRC.push(exclusionCreee);

      // Cocher automatiquement la nouvelle exclusion
      if (!this.selectedExclusionsRC) {
        this.selectedExclusionsRC = [];
      }
      this.selectedExclusionsRC.push(exclusionCreee.id);

      // Réinitialiser le champ
      this.nouvelleExclusionRC = '';

      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Exclusion RC ajoutée avec succès'
      });
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


@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  const activeElement = document.activeElement;

  // Vérifier si on est bien dans la zone scroll des exclusions RC
  const isExclusionsContainer = activeElement?.closest('.exclusions-scroll-container');
  
  if (isExclusionsContainer) {
    this.handleExclusionsFilter(event);
  }
}

// Filtrer les exclusions RC par clavier
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

  if (event.key.length > 1) return; // ignorer F1, flèches, etc.

  const now = Date.now();
  if (now - this.lastKeyTimeExclusions > 60000) {
    this.keyboardFilterExclusions = ''; // reset si pause > 1s
  }

  this.keyboardFilterExclusions += event.key.toLowerCase();
  this.lastKeyTimeExclusions = now;

  this.applyExclusionsFilter();

  if (this.filterTimeoutExclusions) {
    clearTimeout(this.filterTimeoutExclusions);
  }
  this.filterTimeoutExclusions = setTimeout(() => {
    this.resetExclusionsFilter();
  }, 1000);
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




  loadExclusionsRC() {
  this.contratService.getExclusionsRC().subscribe({
    next: (data) => {
      this.exclusionsRC = data || [];
      this.filteredExclusionsRC = [...this.exclusionsRC]; // init ici
    },
    error: (err) => console.error('Erreur récupération exclusions RC', err)
  });
}

// Méthode pour gérer la sélection/déselection
toggleExclusionRC(exclusionId: number, event: any) {
  if (event.target.checked) {
    if (!this.selectedExclusionsRC.includes(exclusionId)) {
      this.selectedExclusionsRC.push(exclusionId);
    }
  } else {
    this.selectedExclusionsRC = this.selectedExclusionsRC.filter(id => id !== exclusionId);
  }
}

isExclusionRCSelected(exclusionId: number): boolean {
  return this.selectedExclusionsRC.includes(exclusionId);
}
ajouterExclusionPersonnalisee(garantie: GarantieSection) {
  // Vérifier que le champ n'est pas vide
  if (!garantie.nouvelleExclusion || !garantie.nouvelleExclusion.trim()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez saisir le nom de l\'exclusion'
    });
    return;
  }

  // Vérifier que la sous-garantie est sélectionnée
  if (!garantie.sousGarantieId) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Garantie non sélectionnée'
    });
    return;
  }

  // Récupérer la sous-garantie
  const sousGarantie = this.sousGarantiesMap[garantie.sousGarantieId];

  if (!sousGarantie || !sousGarantie.garantie) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Garantie parent introuvable'
    });
    return;
  }

  // Préparer l'objet exclusion à créer
  const nouvelleExclusion = {
    nom: garantie.nouvelleExclusion.trim(),
    garantie: {
      id: sousGarantie.garantie.id // 🔹 ID de la garantie parent
    }
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

      // Ajouter l'exclusion créée à la liste
      garantie.exclusionsOptions.push(exclusionCreee);

      // Ajouter automatiquement à la sélection
      garantie.exclusionsIds.push(exclusionCreee.id);

      // Mettre à jour le filtered pour affichage immédiat
      garantie.filteredExclusionsOptions = [...garantie.exclusionsOptions];

      // Réinitialiser le champ d'entrée
      garantie.nouvelleExclusion = '';

      // Message de succès
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Exclusion ajoutée avec succès'
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

 


  loadSousGaranties() {
  this.contratService.getSousGaranties().subscribe(data => {
    // 🔹 créer une map pour accéder rapidement à la sous-garantie par id
    this.sousGarantiesMap = {};
    
    this.sousGarantiesOptions = data.map(sg => {
      // Stocker la sous-garantie complète dans la map
      this.sousGarantiesMap[sg.id] = sg;
      return {
        label: sg.nom,
        value: sg.id,
        garantieParent: sg.garantie  // 🔹 ici, le "garantie parent"
        
      };
   
    });

    // 🔹 Initialiser le filtrage pour toutes les garanties existantes
    this.situationRisques.forEach(s => {
      s.garanties.forEach(g => {
        g.filteredSousGarantiesOptions = [...this.sousGarantiesOptions];
        g.keyboardFilterGaranties = '';
        g.lastKeyTimeGaranties = 0;
        g.filterTimeoutGaranties = null;
      });
    });
  });
}



  editSituation(index: number) {
    this.currentSituationRisque = { ...this.situationRisques[index] };
    this.editIndex = index;
  }

  addSituation() {
    if (this.editIndex !== null) {
      this.situationRisques[this.editIndex] = { ...this.currentSituationRisque };
      this.editIndex = null;
    } else {
      this.situationRisques.push({ ...this.currentSituationRisque });
    }
    this.currentSituationRisque = {
      numPolice: '',
      identification: '',
      adresse: '',
      natureConstruction: '',
      contiguite: '',
      avoisinage: '',
      garanties: [],
       rcExploitationActive: false, 
    };
  }

  removeSituation(index: number) {
    this.situationRisques.splice(index, 1);
  }

addGarantie(situation: SituationRisque) {
  const nouvelleGarantie: GarantieSection = { 
    sectionId: 0, 
    sousGarantieId: 0, 
    franchise: 0, 
    minimum: 0,          // valeur par défaut
    maximum: 0,          // valeur par défaut
    hasFranchise: false, // checkbox décoché par défaut
    exclusionsIds: [], 
    exclusionsOptions: [] 
  };
  situation.garanties.push(nouvelleGarantie);
}

  removeGarantie(situation: SituationRisque, index: number) {
    situation.garanties.splice(index, 1);
  }


// ⚡ Fonction pour charger les exclusions à partir de la garantie parent
loadExclusionsForGarantie(garantieParent: Garantie, g: any) {
  if (!garantieParent) {
    g.exclusionsOptions = [];
    g.filteredExclusionsOptions = [];
    return;
  }
  this.contratService.getExclusionsByGarantie(garantieParent.id).subscribe({
    next: (data) => {
      g.exclusionsOptions = data;
      g.filteredExclusionsOptions = [...data]; // initialiser le filtered
    },
    error: () => {
      g.exclusionsOptions = [];
      g.filteredExclusionsOptions = [];
    }
  });
}

// ⚡ Fonction appelée au changement de sous-garantie
onGarantieChange(g: any) {
  // Vider les exclusions existantes à chaque changement
  g.exclusionsOptions = [];
  g.filteredExclusionsOptions = [];
  g.exclusionsIds = [];

  if (g.sousGarantieId) {
    // Récupérer la sous-garantie sélectionnée
    const sousGarantie = this.sousGarantiesMap[g.sousGarantieId];

    if (sousGarantie && sousGarantie.garantie) {
      // Charger les exclusions de la garantie parent
      this.loadExclusionsForGarantie(sousGarantie.garantie, g);
    }
  }
}


 updateObjetDeLaGarantie() {
    this.rcExploitation.objetDeLaGarantie = 
      `Cette assurance a pour objet de garantir les conséquences pécuniaires de la responsabilité civile pouvant incomber à l'adhérent ${this.adherent.nomRaison} et ce en raison des dommages corporels et matériels causés aux tiers. A savoir : ${this.selectedSituationsNames}`;
  }

  isExclusionSelected(garantie: GarantieSection, exclusionId: number): boolean {
    return garantie.exclusionsIds?.includes(exclusionId) || false;
  }

  toggleExclusion(garantie: GarantieSection, exclusionId: number) {
    if (!garantie.exclusionsIds) garantie.exclusionsIds = [];
    const index = garantie.exclusionsIds.indexOf(exclusionId);
    if (index > -1) garantie.exclusionsIds.splice(index, 1);
    else garantie.exclusionsIds.push(exclusionId);
    garantie.exclusionsIds = [...garantie.exclusionsIds];
  }




 nextStep() {
  this.sousGarantiesParParentCache.clear();
    if (this.currentStep === 0) {
      this.contratService.checkContratExists(this.numPolice).subscribe({
        next: (exists) => {
          if (exists) {
            this.messageService.add({ 
              severity: 'warn', 
              summary: 'Contrat existant', 
              detail: 'Ce contrat est déjà créé.' 
            });
          } else {
            this.currentStep++; // Contrat n'existe pas → passage à l'étape 2
          }
        },
        error: (err) => {
          console.error('Erreur vérification contrat:', err);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Erreur', 
            detail: 'Impossible de vérifier le contrat.' 
          });
        }
      });
    } else if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep() {
    this.sousGarantiesParParentCache.clear();
    if (this.currentStep > 0) this.currentStep--;
  }
get selectedSituationsNames(): string {
  if (!this.selectedSituations || this.selectedSituations.length === 0) return '';
  return this.selectedSituations.map(s => s.identification).join(', ');
}
submit() {
  // VÉRIFICATION CRITIQUE: Avez-vous configuré des RC ?
  if (this.rcExploitations.length === 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Configuration manquante',
      detail: 'Veuillez configurer au moins une RC Exploitation avant de soumettre le contrat.'
    });
    return;
  }

  // Construction des sections AVEC garanties
  const sections = this.situationRisques.map((situation, index) => {
    
    if (!situation.identification || situation.identification.trim() === '') {
      throw new Error(`L'identification de la section ${index} est obligatoire`);
    }

    const section = {
      identification: situation.identification.trim(),
      adresse: situation.adresse?.trim() || "Non spécifié",
      natureConstruction: situation.natureConstruction?.trim() || "Non spécifié", 
      contiguite: situation.contiguite?.trim() || "Non spécifié",
      avoisinage: situation.avoisinage?.trim() || "Non spécifié",
      numPolice: this.numPolice,
      garanties: situation.garanties.map(garantie => {
        if (!garantie.sousGarantieId || garantie.sousGarantieId === 0) {
          throw new Error(`Une garantie doit avoir une sous-garantie sélectionnée dans la section "${situation.identification}"`);
        }

        return {
          franchise: garantie.franchise ?? 0,
          sousGarantieId: Number(garantie.sousGarantieId),
          maximum: garantie.maximum !== null && garantie.maximum !== undefined ? Number(garantie.maximum) : undefined,
          minimum: garantie.minimum !== null && garantie.minimum !== undefined ? Number(garantie.minimum) : undefined,
          capitale: garantie.capitale !== null && garantie.capitale !== undefined ? Number(garantie.capitale) : undefined,
          primeNET: garantie.primeNET !== null && garantie.primeNET !== undefined ? Number(garantie.primeNET) : undefined,
          exclusions: (garantie.exclusionsIds || []).map(exclusionId => ({
            exclusionId: Number(exclusionId)
          }))
        };
      })
    };

    return section;
  });

  // Construction des rcConfigurations à partir de rcExploitations
  const rcConfigurations = this.rcExploitations.map((rcExploitation, rcIndex) => {
    
    if (!rcExploitation.situations || rcExploitation.situations.length === 0) {
      throw new Error(`La configuration RC ${rcIndex + 1} doit avoir au moins une situation associée`);
    }

    const sectionIds = rcExploitation.situations
      .map(situation => {
        const index = this.situationRisques.findIndex(s => 
          s.identification === situation.identification
        );
        
        if (index === -1) {
          throw new Error(`Situation "${situation.identification}" non trouvée`);
        }
        
        return index;
      })
      .filter(id => id !== -1);

    const config = {
      id: rcExploitation.id,
      limiteAnnuelleDomCorporels: rcExploitation.limiteAnnuelleDomCorporels ?? 0,
      limiteAnnuelleDomMateriels: rcExploitation.limiteAnnuelleDomMateriels ?? 0,
      limiteParSinistre: rcExploitation.limiteParSinistre ?? 0,
      franchise: rcExploitation.franchise ?? 0,
      primeNET: rcExploitation.primeNET ?? 0,
      objetDeLaGarantie: this.objetGarantieRc,
      exclusionsRcIds: rcExploitation.exclusionsIds || [],
      sectionIds: sectionIds
    };

    return config;
  });

  const formattedStartTime = this.formatStartTimeForBackend(this.startTime);

  // Construction du contrat final - STOCKER dans contratData
  this.contratData = {
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
    startTime: formattedStartTime,
    preambule: this.preambule,
    service:this.service,
    sections: sections,
    rcConfigurations: rcConfigurations
  };

  // Envoyer au backend
  this.contratService.createContrat(this.contratData).subscribe({
    next: (response) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Contrat créé avec succès !'
      });
    },
    error: (error) => {
      console.error('Erreur création contrat:', error);
      
      let errorMessage = 'Erreur lors de la création du contrat';
      if (error.error) {
        if (error.error.message) {
          errorMessage += ': ' + error.error.message;
        }
        if (error.error.errors) {
          errorMessage += '. Détails: ' + JSON.stringify(error.error.errors);
        }
      }
      
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: errorMessage
      });
    }
  });
}

// 🔥 AJOUT: Formater startTime pour le backend
private formatStartTimeForBackend(startTime: string): string {
  if (!startTime) {
    const now = new Date();
    return now.toISOString();
  }

  // Si c'est déjà en format ISO, retourner tel quel
  if (startTime.includes('T') && startTime.includes(':')) {
    return new Date(startTime).toISOString();
  }

  // Sinon, créer une date ISO
  return new Date().toISOString();
}

resetForm() {
  this.currentStep = 0;
  this.situationRisques = [];
  this.rcConfigurations = [];
  this.currentRcConfig = this.createNewRcConfig();
  
  // Réinitialiser les autres champs si nécessaire
  this.numPolice = '';
  this.adherent = { codeId: '', nomRaison: '', adresse: '', activite: '', nouveau: true };
  this.fractionnement = '';
  this.codeRenouvellement = '';
  this.branche = '';
  this.typeContrat = '';
  this.dateDebut = '';
  this.dateFin = '';
  this.preambule = '';
}
createNewRcConfig(): RcConfiguration {
  return {
    id: Date.now(),
    limiteAnnuelleDomCorporels: 0,
    limiteAnnuelleDomMateriels: 0,
    limiteParSinistre: 0,
    franchise: 0,
    primeNET: 0,
    situations: [],
    exclusionsIds: []
  };
}

updateSelectedSituationsNames() {
  if (!this.selectedSituations || this.selectedSituations.length === 0) {
    this.selectedSituationsName = '';
  } else if (this.selectedSituations.length === 1) {
    this.selectedSituationsName = this.selectedSituations[0].identification;
  } else {
    this.selectedSituationsName = this.selectedSituations
      .map(s => s.identification)
      .join(', ');
  }
}


handleKeyboardExclusions(event: KeyboardEvent, garantie: GarantieSection) {
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
applyGarantieFilter(garantie: GarantieSection) {
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
handleKeyboardGaranties(event: KeyboardEvent, garantie: GarantieSection) {
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
applyGarantieOptionsFilter(garantie: GarantieSection) {
  if (!garantie.keyboardFilterGaranties) {
    garantie.filteredSousGarantiesOptions = [...this.sousGarantiesOptions];
    return;
  }

  const filterText = garantie.keyboardFilterGaranties.toLowerCase();
  garantie.filteredSousGarantiesOptions = this.sousGarantiesOptions.filter(opt =>
    opt.label.toLowerCase().includes(filterText) || opt.value.toString().includes(filterText)
  );
}

onTypeContratChange(newType: string) {
  this.typeContrat = newType;
  this.updatePreambule(); 
}
updatePreambule() {
  const defaultGeneral =
`Aux conditions Générales du Contrat d'Assurance « Multirisque Professionnelle » MF N° 403/7 du 24 Novembre 1998, dont l'assuré reconnaît avoir reçu un exemplaire, ainsi qu'aux conditions particulières qui suivent et conformément au formulaire de déclaration de risque ci annexé, la MAE Assurances garantit l'assuré contre les risques énumérées et aux conditions suivantes.Les présentes conditions particulières prévalent sur les conditions générales susmentionnées chaque fois qu'elles-y- dérogent.`;

  const defaultAppelOffre =
`Aux conditions Générales du Contrat d'Assurance « Multirisque Professionnelle » MF N° 403/7 du 24 Novembre 1998 et aux conditions particulières qui suivent, dont l'adhérent reconnaît avoir reçu un exemplaire, et conformément aux clauses et conditions de l'Appel d'Offres Agence de Mise en Valeur de Promotion Culturelle « A.M.V. P.C »  N°03/2024 pour l'année 2023-2024-2025, et qui prévalent sur toutes autres dispositions, la M.A.E garantit l'adhérent dans les conditions et limites suivantes.Les présentes conditions particulières prévalent sur les conditions générales susmentionnées chaque fois qu'elles-y- dérogent.`;

  // Vérifier si le préambule est vide ou contient seulement le texte par défaut
  const isPreambuleEmpty = !this.preambule || 
                          this.preambule.trim() === '' || 
                          this.preambule === defaultGeneral || 
                          this.preambule === defaultAppelOffre;

  if (isPreambuleEmpty) {
    if (this.typeContrat === 'APPEL_D_OFFRE') {
      this.preambule = defaultAppelOffre;
    } else {
      this.preambule = defaultGeneral;
    }
  }}
// ReonTypeContratChangeourne un tableau des groupes { parent: Garantie, sousGaranties: GarantieSection[] }

private sousGarantiesParParentCache = new Map<string, any[]>();
private previousGarantiesHashes = new Map<string, string>();

getSousGarantiesParParent(s: SituationRisque): { parent: Garantie; sousGaranties: GarantieSection[] }[] {
  // Vérification de base
  if (!s || !s.garanties || !Array.isArray(s.garanties)) {
    return [];
  }

  // Créer une clé unique pour le cache
  const cacheKey = `situation_${s.identification}`;
  
  // Calculer un hash des garanties actuelles pour détecter les changements
  const currentHash = this.calculateGarantiesHash(s.garanties);
  const previousHash = this.previousGarantiesHashes.get(cacheKey);

  // Si les données n'ont pas changé, retourner le cache
  if (previousHash === currentHash && this.sousGarantiesParParentCache.has(cacheKey)) {
    return this.sousGarantiesParParentCache.get(cacheKey)!;
  }

  // Mettre à jour le hash
  this.previousGarantiesHashes.set(cacheKey, currentHash);

  const map: { [id: number]: { parent: Garantie; sousGaranties: GarantieSection[] } } = {};

  try {
    s.garanties.forEach(g => {
      if (!g || !g.sousGarantieId) return;
      
      // Convertir en number si c'est une string
      const sousGarantieId = typeof g.sousGarantieId === 'string' 
        ? parseInt(g.sousGarantieId, 10) 
        : g.sousGarantieId;
      
      if (isNaN(sousGarantieId)) return;
      
      const sg = this.sousGarantiesMap[sousGarantieId];
      if (!sg || !sg.garantie) return;

      const parentId = sg.garantie.id;
      
      if (!map[parentId]) {
        map[parentId] = { 
          parent: sg.garantie, 
          sousGaranties: [] 
        };
      }
      map[parentId].sousGaranties.push(g);
    });

    const result = Object.values(map);
    
    // Mettre en cache le résultat
    this.sousGarantiesParParentCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Erreur dans getSousGarantiesParParent:', error);
    return [];
  }
}

// Méthode pour calculer un hash simple des garanties
private calculateGarantiesHash(garanties: any[]): string {
  if (!garanties || !garanties.length) return 'empty';
  
  return garanties.map(g => 
    `${g.sousGarantieId}_${g.sectionId}`
  ).join('|');
}

// Nettoyer le cache quand nécessaire
clearCache() {
  this.sousGarantiesParParentCache.clear();
  this.previousGarantiesHashes.clear();
}
// Méthode helper pour obtenir le nom de garantie
getGarantieName(sousGarantieId: any): string {
  // Gérer à la fois les strings et les numbers
  const id = typeof sousGarantieId === 'string' 
    ? parseInt(sousGarantieId, 10) 
    : sousGarantieId;
  
  if (isNaN(id)) {
    return 'ID de sous-garantie invalide';
  }
  
  const sg = this.sousGarantiesMap[id];
  return  sg?.nom || 'Sous-garantie inconnue';
}
// Créer une nouvelle RC Exploitation
createNewRcExploitation(): RcExploitation {
  return {
    id: Date.now(), // ID temporaire
    limiteAnnuelleDomCorporels: 0,
    limiteAnnuelleDomMateriels: 0,
    limiteParSinistre: 0,
    franchise: 0,
    primeNET: 0,
    situations: [],
    exclusionsIds: []
  };
}

// Vérifier si une situation est déjà utilisée dans d'autres RC
isSituationUsedInOtherRc(situation: SituationRisque, currentRcId: number): boolean {
  return this.rcExploitations.some(rc => 
    rc.id !== currentRcId && 
    rc.situations.some(s => s.identification === situation.identification)
  );
}

// Vérifier si on peut ajouter une nouvelle RC
get canAddNewRc(): boolean {
  const allSituations = this.situationRisques;
  const usedSituations = new Set();
  
  this.rcExploitations.forEach(rc => {
    rc.situations.forEach(s => usedSituations.add(s.identification));
  });
  
  // Vérifier s'il reste des situations non utilisées
  return allSituations.some(s => !usedSituations.has(s.identification));
}

// Objet de garantie unique
get objetGarantieRc(): string {
  return `Cette assurance a pour objet de garantir les conséquences pécuniaires de la responsabilité civile pouvant incomber à l'adhérent ${this.adherent.nomRaison} et ce en raison des dommages corporels et matériels causés aux tiers.`;
}
// Ajouter une RC Exploitation
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

// Modifier une RC Exploitation
editRcExploitation(index: number) {
  this.currentRcExploitation = { ...this.rcExploitations[index] };
  this.rcExploitations.splice(index, 1);
}

// Supprimer une RC Exploitation
removeRcExploitation(index: number) {
  this.rcExploitations.splice(index, 1);
}

// Gérer la sélection des situations pour la RC courante
toggleRcSituation(situation: SituationRisque, event: any) {
  if (event.target.checked) {
    this.currentRcExploitation.situations.push(situation);
  } else {
    this.currentRcExploitation.situations = this.currentRcExploitation.situations.filter(
      s => s.identification !== situation.identification
    );
  }
}

// Vérifier si une situation est sélectionnée dans la RC courante
isRcSituationSelected(situation: SituationRisque): boolean {
  return this.currentRcExploitation.situations.some(
    s => s.identification === situation.identification
  );
}
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
// Méthode pour obtenir les noms des situations d'une RC
getRcSituationsNames(rc: RcExploitation): string {
  if (!rc.situations || !Array.isArray(rc.situations)) {
    return 'Aucune situation';
  }
  return rc.situations.map(s => s.identification).join(', ');
}

// Méthode pour obtenir les identifiants des situations
getRcSituationsIds(rc: RcExploitation): number[] {
  if (!rc.situations || !Array.isArray(rc.situations)) {
    return [];
  }
  return rc.situations.map((s, index) => index);
}
// Vérifier si une situation a déjà une RC
isSituationCoveredByRc(situation: SituationRisque): boolean {
  return this.rcExploitations.some(rc => 
    rc.situations.some(s => s.identification === situation.identification)
  );
}

// Obtenir toutes les situations non couvertes
getUncoveredSituations(): SituationRisque[] {
  return this.situationRisques.filter(situation => 
    !this.isSituationCoveredByRc(situation)
  );
}
}
 