
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

interface Exclusion {
  id: number;
  nom: string;
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
    FileUploadModule
  ],
  templateUrl: './contrat-component.component.html',
  styleUrls: ['./contrat-component.component.scss']
})
export class ContratComponent implements OnInit {
  currentStep: number = 0;

  // Étape 1 : Informations générales
  numPolice: string = '';
  nom_assure: string = 'Mutuelle assurance de l\'éducation MAE';
  codeAgence: string = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '', nouveau: true };
  fractionnement: string = '';
  codeRenouvellement: string = '';
  branche: string = '';
  typeContrat: string = '';
  dateDebut: string = '';
  dateFin: string = '';
  startTime: string = '';
preambule: string = '';
preambuleMaxLength: number = 2000;
selectedPdfFile: File | null = null;
pdfLines: string[] = [];  // lignes extraites du PDF
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

  constructor(private contratService: ContratService, private messageService: MessageService) {}

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
console.log('Heure locale format ISO sans décalage:', this.startTime);
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

// Appel de la méthode de service
uploadSelectedPdf() {
  if (!this.selectedPdfFile) return;

  this.contratService.uploadPdf(this.selectedPdfFile).subscribe({
    next: (result) => {
      this.pdfLines = result.lines || [];
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'PDF traité avec succès' });

      if (this.pdfLines.length > 0) {
    


        // ----------------- REMPLISSAGE CHAMPS INFO GENERALE -----------------
        // Ignorer les colonnes inutiles
        const lines = this.pdfLines.filter((_, index) => ![7,8,10].includes(index));

        // Adhérent
        this.adherent.codeId = lines[0] || '';
        this.adherent.nomRaison = lines[1] || '';
        this.adherent.adresse = lines.slice(2, 6).join(', ') || ''; // concatène lignes 3,4,5,6
        this.adherent.activite = lines[6] || '';
        this.adherent.nouveau = false; // ou à définir selon logique PDF

        // Branche
        this.branche = lines[7] || '';

        // Numéro de police
        this.numPolice = lines[8] || '';

        // Code Agence
        this.codeAgence = lines[9] || '';

        // Fractionnement
        const fractionnementMap: any = { '5': 'ZERO', '2': 'UN', '4': 'DEUX' };
        this.fractionnement = fractionnementMap[lines[10]] || '';

        // Code renouvellement
        const codeRenouvellementMap : any = {'T': 'T', 'R': 'R', 'L':'T'};
        this.codeRenouvellement =codeRenouvellementMap[lines[11] ] || '';

        // Dates
        this.dateDebut = this.formatDateForInput(lines[12]);
        this.dateFin = this.formatDateForInput(lines[13]);
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
        console.log('SousGarantie:', sg.nom, '-> garantieParent:', sg.garantie);
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
    const nouvelleGarantie: GarantieSection = { sectionId: 0, sousGarantieId: 0, franchise: 0, exclusionsIds: [], exclusionsOptions: [] };
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

  console.log('ID de la garantie parent:', garantieParent.id);

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


  isRcSituationSelected(situation: SituationRisque): boolean {
    return this.selectedSituations.includes(situation);
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
get objetGarantieRc(): string {
  if (!this.adherent?.nomRaison) return '';
  let texte = `Cette assurance a pour objet de garantir les conséquences pécuniaires de la responsabilité civile pouvant incomber à ${this.adherent.nomRaison} du fait de l’exploitation et ce en raison des dommages corporels et matériels causés aux tiers.`;

  if (this.selectedSituations && this.selectedSituations.length > 0) {
    const situationsText = this.selectedSituations.length === 1
      ? this.selectedSituations[0].identification
      : this.selectedSituations.map(s => s.identification).join(', ');
    texte += ` A savoir : ${situationsText}`;
  }

  return texte;
}


submit() {
  this.updateObjetDeLaGarantie();
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
    startTime: this.startTime,
    preambule:this.preambule,

    sections: this.situationRisques.map(situation => ({
      identification: situation.identification,
      adresse: situation.adresse,
      natureConstruction: situation.natureConstruction,
      contiguite: situation.contiguite,
      avoisinage: situation.avoisinage,
      numPolice: this.numPolice,

      // ✅ Toujours boolean
      rcExploitationActive: situation.rcExploitationActive ?? false,

      // ✅ RC Exploitation avec valeurs numériques correctes
      rcExploitation: {
        limiteAnnuelleDomCorporels: this.rcExploitation.limiteAnnuelleDomCorporels ?? 0,
        limiteAnnuelleDomMateriels: this.rcExploitation.limiteAnnuelleDomMateriels ?? 0,
        limiteParSinistre: this.rcExploitation.limiteParSinistre ?? 0,
        franchise: this.rcExploitation.franchise ?? 0,
        primeNET:this.rcExploitation.primeNET ?? 0,
        objetDeLaGarantie: this.rcExploitation.objetDeLaGarantie,
        exclusionsRcIds: this.selectedExclusionsRC || []
      },

      garanties: situation.garanties.map(garantie => ({
        franchise: garantie.franchise ?? 0,
        sousGarantieId: Number(garantie.sousGarantieId),
        maximum: garantie.maximum !== null && garantie.maximum !== undefined ? Number(garantie.maximum) : undefined,
        minimum: garantie.minimum !== null && garantie.minimum !== undefined ? Number(garantie.minimum) : undefined,
        capitale: garantie.capitale !== null && garantie.capitale !== undefined ? Number(garantie.capitale) : undefined,
        primeNET: garantie.primeNET !== null && garantie.primeNET !== undefined ? Number(garantie.primeNET) : undefined,
        exclusions: (garantie.exclusionsIds || []).map(exclusionId => ({
          exclusionId: Number(exclusionId)
        }))
      }))
    }))
  };

  console.log('Contrat complet à créer:', contratData);

  this.contratService.createContrat(contratData).subscribe({
    next: () => alert('Contrat créé avec succès !'),
    error: (error) => alert('Erreur lors de la création du contrat : ' + error.message)
  });
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

toggleRcSituation(situation: SituationRisque, event: any) {
  if (event.target.checked) {
    this.selectedSituations.push(situation);
    situation.rcExploitationActive = true; // 🔹 active RC pour cette situation
  } else {
    this.selectedSituations = this.selectedSituations.filter(s => s !== situation);
    situation.rcExploitationActive = false; // 🔹 désactive RC si décoché
  }
  this.updateSelectedSituationsNames();
  this.updateObjetDeLaGarantie();
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
`Aux conditions Générales du Contrat d’Assurance « Multirisque Professionnelle » MF N° 403/7 du 24 Novembre 1998, dont l’assuré reconnaît avoir reçu un exemplaire, ainsi qu’aux conditions particulières qui suivent et conformément au formulaire de déclaration de risque ci annexé, la MAE Assurances garantit l’assuré contre les risques énumérées et aux conditions suivantes.
Les présentes conditions particulières prévalent sur les conditions générales susmentionnées chaque fois qu’elles-y- dérogent.`;

  const defaultAppelOffre =
`Aux conditions Générales du Contrat d’Assurance « Multirisque Professionnelle » MF N° 403/7 du 24 Novembre 1998 et aux conditions particulières qui suivent, dont l’adhèrent reconnaît avoir reçu un exemplaire, et conformément aux clauses et conditions de l’Appel d’Offres Agence de Mise en Valeur de Promotion Culturelle « A.M.V. P.C »  N°03/2024 pour l’année 2023-2024-2025, et qui prévalent sur toutes autres dispositions, la M.A.E garantit l’adhèrent dans les conditions et limites suivantes.
Les présentes conditions particulières prévalent sur les conditions générales susmentionnées chaque fois qu’elles-y- dérogent.`;


  if (!this.preambule || this.preambule.trim() === '') {
    if (this.typeContrat === 'APPEL_D_OFFRE') {
      this.preambule = defaultAppelOffre;
    } else {
      this.preambule = defaultGeneral;
    }
  }
}
// Retourne un tableau des groupes { parent: Garantie, sousGaranties: GarantieSection[] }

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
}
 
