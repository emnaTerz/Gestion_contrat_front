
import { ChangeDetectorRef, Component, NgZone, OnInit ,HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, ContratDTO, Fractionnement, CodeRenouvellement, Branche, TypeContrat, SectionDTO, ContratResponseDTO, GarantieResponseDTO, SectionResponseDTO } from '@/layout/service/contrat';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';

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

interface RCExploitation {
  limiteAnnuelleDomCorporels?: number;
  limiteAnnuelleDomMateriels?: number;
  limiteParSinistre?: number;
  franchise?: number;
  situationsIds?: number[];
  exclusionsIds?: number[];
  objetDeLaGarantie?: string;
  primeNET?: number;
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

sousGarantiesWithDetails: SousGarantieWithDetails[] = [];

 isLoadingExclusions = false;
  currentStep = 0;
  numPolice = '';
  nom_assure = '';
  codeAgence: string = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '', nouveau: true };
  fractionnement = '';
  codeRenouvellement = '';
  branche = '';
  typeContrat = '';
  dateDebut = '';
  dateFin = '';
  startTime = '';
  rcExploitation: RCExploitation = {
    situationsIds: [],
    exclusionsIds: [],
    limiteAnnuelleDomCorporels: 0,
    limiteAnnuelleDomMateriels: 0,
    limiteParSinistre: 0,
    franchise: 0,
    primeNET: 0,
    objetDeLaGarantie : ''
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
    { label: 'Situations de Risques' },
    { label: 'Garanties' },
    { label: 'Exclusions' },
    { label: 'Rc Exploitation' },

  ];
  private lockCheckInterval: any;
  private lockCheckPeriod = 30000; // Vérifier toutes les 30 secondes
  private isLockedByCurrentUser = true;
  constructor(
    private contratService: ContratService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone,
  ) {}

   ngOnInit(): void {
 
    this.loadSousGaranties().then(() => {
      this.route.params.subscribe(params => {
        this.numPolice = params['numPolice'];
        if (this.numPolice) {
          this.contratService.lockContrat(this.numPolice).subscribe({
            next: contrat => {
              this.contrat = contrat;
               const now = new Date(); // date locale
this.startTime = now.getFullYear() + '-' +
  String(now.getMonth()+1).padStart(2,'0') + '-' +
  String(now.getDate()).padStart(2,'0') + 'T' +
  String(now.getHours()).padStart(2,'0') + ':' +
  String(now.getMinutes()).padStart(2,'0') + ':' +
  String(now.getSeconds()).padStart(2,'0');
console.log('Heure locale format ISO sans décalage:', this.startTime);
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
    }, 3000);
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
    console.log('Nouveau adhérent:', adherent.nouveau);
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

ajouterExclusionPersonnalisee(garantie: GarantieComposant ) {
  if (!garantie.nouvelleExclusion || !garantie.nouvelleExclusion.trim()) {
    this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez saisir le nom de l\'exclusion' });
    return;
  }

  if (!garantie.sousGarantieId) {
    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Garantie non sélectionnée' });
    return;
  }

  const nouvelleExclusion = {
    nom: garantie.nouvelleExclusion.trim(),
    garantie: {
      id: garantie.sousGarantieId
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

      // Ajouter l'exclusion créée
      garantie.exclusionsOptions.push(exclusionCreee);
      garantie.exclusionsIds.push(exclusionCreee.id);
      
      // Réinitialiser le champ
      garantie.nouvelleExclusion = '';
      
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Exclusion ajoutée avec succès' });
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
    return this.sousGarantiesWithDetails.find(sg => sg.id === sousGarantieId);
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
      this.nom_assure = contrat.adherent.nomRaison;
      this.codeAgence = contrat.codeAgence;
      this.adherent = contrat.adherent;
      this.fractionnement = contrat.fractionnement;
      this.codeRenouvellement = contrat.codeRenouvellement;
      this.branche = contrat.branche;
      this.typeContrat = contrat.typeContrat;
      this.dateDebut = contrat.dateDebut;
      this.dateFin = contrat.dateFin;
      this.preambule = contrat.preambule || '';

      // Mapping simplifié
      this.situationRisques = (contrat.sections || []).map((section: SectionResponseDTO, index: number) => ({
        numPolice: this.numPolice,
        identification: section.identification,
        adresse: section.adresse,
        natureConstruction: section.natureConstruction,
        contiguite: section.contiguite,
        avoisinage: section.avoisinage,
        garanties: (section.garanties || []).map((g: GarantieResponseDTO) => ({
          sectionId: g.sectionId,
          sousGarantieId: g.sousGarantieId,
          franchise: g.franchise,
          maximum: g.maximum,
          minimum: g.minimum,
          capitale: g.capitale,
          primeNET: g.primeNet,
          exclusionsIds: g.exclusions?.map(e => e.exclusionId) || [],
          exclusionsOptions: [],
          garantieParentId: g.garantieParent?.id,
          garantieParentLibelle: g.garantieParent?.libelle || 'Sans parent'
        }))
      }));

      console.log('=== GROUPEMENT PAR GARANTIE PARENT ===');
      this.situationRisques.forEach((situation, index) => {
        console.log(`Situation ${index}: ${situation.identification}`);
        situation.garanties.forEach(garantie => {
          console.log(`  - ${garantie.sousGarantieId}: ${garantie.garantieParentLibelle} (ID: ${garantie.garantieParentId})`);
        });
      });

      // Utiliser la nouvelle méthode optimisée
      this.loadExclusionsForAllGarantiesOptimized();
      this.initializeRCExploitation(contrat);
      this.cd.detectChanges();
    },
    error: err => console.error('Erreur chargement contrat', err)
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

// Nouvelle méthode pour charger les exclusions par garantie parent
loadExclusionsForGarantieParent(garantie: GarantieComposant): Promise<void> {
  return new Promise((resolve) => {
    if (garantie.garantieParentId && garantie.garantieParentId > 0) {
      this.contratService.getExclusionsByGarantie(garantie.garantieParentId).subscribe({
        next: (data) => {
          // ✅ Partager les mêmes exclusions pour toutes les garanties du même parent
          garantie.exclusionsOptions = data;
          garantie.filteredExclusionsOptions = [...data];
          console.log(`Exclusions chargées pour parent ${garantie.garantieParentId}:`, data.length);
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
      this.contratService.getSousGaranties().subscribe({
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
  // Réinitialiser RC Exploitation
  this.rcExploitation = { 
    situationsIds: [], 
    exclusionsIds: [], 
    limiteAnnuelleDomCorporels: 0, 
    limiteAnnuelleDomMateriels: 0, 
    limiteParSinistre: 0, 
    franchise: 0 ,
    primeNET : 0,
  };
  this.selectedSituationsNames = '';
  this.exclusionsRC = [];

  contrat.sections?.forEach((section, index) => {
    if (section.rcExploitationActive && section.rcExploitation) {
      const rc = section.rcExploitation;

      // Ajouter l'index de la situation
      this.rcExploitation.situationsIds!.push(index);

      // Mettre à jour les limites et franchise avec la première section RC
      if (this.rcExploitation.limiteAnnuelleDomCorporels === 0) this.rcExploitation.limiteAnnuelleDomCorporels = rc.limiteAnnuelleDomCorporels || 0;
      if (this.rcExploitation.limiteAnnuelleDomMateriels === 0) this.rcExploitation.limiteAnnuelleDomMateriels = rc.limiteAnnuelleDomMateriels || 0;
      if (this.rcExploitation.limiteParSinistre === 0) this.rcExploitation.limiteParSinistre = rc.limiteParSinistre || 0;
      if (this.rcExploitation.franchise === 0) this.rcExploitation.franchise = rc.franchise || 0;
      if (this.rcExploitation.primeNET === 0) this.rcExploitation.primeNET = rc.primeNET || 0;
      // Ajouter les IDs des exclusions déjà sélectionnées
      if (rc.exclusionsRc && rc.exclusionsRc.length > 0) {
        rc.exclusionsRc.forEach(e => {
          if (!this.rcExploitation.exclusionsIds!.includes(e.id)) {
            this.rcExploitation.exclusionsIds!.push(e.id);
          }
        });
      }
    }
  });

  this.updateObjetDeLaGarantie();
  
  // Charger toutes les exclusions RC pour affichage complet
  this.contratService.getExclusionsRC().subscribe({
    next: (exclusions: Exclusion[]) => {
      this.exclusionsRC = exclusions;
      // 🔹 INITIALISER filteredExclusionsRC ICI, après le chargement asynchrone
      this.filteredExclusionsRC = [...this.exclusionsRC];
      this.cd.detectChanges(); // forcer affichage
    },
    error: () => {
      this.exclusionsRC = [];
      this.filteredExclusionsRC = [];
    }
  });
}
updateObjetDeLaGarantie() {
  // Recalculer les noms des situations sélectionnées
  this.selectedSituationsNames = this.rcExploitation.situationsIds
    ?.map(i => this.situationRisques[i]?.identification)
    .filter((name): name is string => !!name)
    .join(', ') || '';

  // Mettre à jour l'objet de la garantie
  this.rcExploitation.objetDeLaGarantie = 
    `Cette assurance a pour objet de garantir les conséquences pécuniaires de la responsabilité civile pouvant incomber à l'adhérent ${this.adherent.nomRaison}  et ce en raison des dommages corporels et matériels causés aux tiers. A savoir : ${this.selectedSituationsNames || 'Aucune'}`;
}

onSituationToggle(index: number, event: any) {
  if (event.target.checked) {
    // Ajouter l'index si coché
    if (!this.rcExploitation.situationsIds?.includes(index)) {
      this.rcExploitation.situationsIds?.push(index);
    }
  } else {
    // Supprimer l'index si décoché
    const position = this.rcExploitation.situationsIds?.indexOf(index);
    if (position !== undefined && position > -1) {
      this.rcExploitation.situationsIds?.splice(position, 1);
    }
  }
  
  // Mettre à jour l'objet de la garantie
  this.updateObjetDeLaGarantie();
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
  addGarantie(situation: SituationRisque) { situation.garanties.push({ sectionId: 0, sousGarantieId: 0, exclusionsIds: [], exclusionsOptions: [] }); }
  removeGarantie(situation: SituationRisque, index: number) { situation.garanties.splice(index, 1); }

 

  getGarantieName(sousGarantieId: number): string {
    const sg = this.sousGarantiesOptions.find(s => s.value === sousGarantieId);
    return sg ? sg.label : '';
  }

 submit() {
  // Déverrouiller le contrat avant soumission
  this.contratService.unlockContrat(this.numPolice, false, this.startTime).subscribe({
    next: () => {

      // Construction du DTO complet pour l'API
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
        preambule: this.preambule,
        sections: this.situationRisques.map((s, index) => ({
          identification: s.identification,
          adresse: s.adresse,
          natureConstruction: s.natureConstruction,
          contiguite: s.contiguite,
          avoisinage: s.avoisinage,
          numPolice: this.numPolice,
          garanties: s.garanties.map(g => ({
            sectionId: g.sectionId || 0,
            sousGarantieId: Number(g.sousGarantieId) || 0,
            franchise: g.franchise ?? 0,
            maximum: g.maximum ?? 0,
            minimum: g.minimum ?? 0,
            capitale: g.capitale ?? 0,
            primeNET: g.primeNET ?? 0,
            exclusions: (g.exclusionsIds || []).map(id => ({ exclusionId: Number(id) }))
          })),
          rcExploitationActive: this.rcExploitation.situationsIds?.includes(index) || false,
          rcExploitation: this.rcExploitation.situationsIds?.includes(index) ? {
            limiteAnnuelleDomCorporels: this.rcExploitation.limiteAnnuelleDomCorporels ?? 0,
            limiteAnnuelleDomMateriels: this.rcExploitation.limiteAnnuelleDomMateriels ?? 0,
            limiteParSinistre: this.rcExploitation.limiteParSinistre ?? 0,
            franchise: this.rcExploitation.franchise ?? 0,
            primeNET:this.rcExploitation.primeNET ?? 0,
            exclusionsRcIds: this.rcExploitation.exclusionsIds || [],
            objetDeLaGarantie: this.rcExploitation.objetDeLaGarantie || ''

            
          } : undefined
        })) as SectionDTO[]
      };

      // Appel du service pour modifier le contrat
      this.contratService.modifierContrat(contratData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Contrat mis à jour',
            detail: 'Les modifications ont été enregistrées avec succès.'
          });
          this.router.navigate(['/Landing']);
        },
        error: err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err.error?.message || 'Impossible de mettre à jour le contrat.'
          });
        }
      });
    },
    error: err => {
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
      next: () => this.router.navigate(['/Landing']),
      error: () => this.router.navigate(['/Landing'])
    });
  }

 toggleRcSituation(situation: SituationRisque, event: any) {
  const index = this.situationRisques.indexOf(situation);
  if (!this.rcExploitation.situationsIds) this.rcExploitation.situationsIds = [];

  if (event.target.checked) {
    if (!this.rcExploitation.situationsIds.includes(index)) {
      this.rcExploitation.situationsIds.push(index);
    }
  } else {
    this.rcExploitation.situationsIds = this.rcExploitation.situationsIds.filter(id => id !== index);
  }

  // Construire la chaîne des noms des situations sélectionnées sans doublons
  this.selectedSituationsNames = Array.from(
    new Set(
      this.rcExploitation.situationsIds
        .map(i => this.situationRisques[i]?.identification)
        .filter(name => !!name)
    )
  ).join(', ');
}

  isRcSituationSelected(situation: SituationRisque): boolean {
    const index = this.situationRisques.indexOf(situation);
    return !!this.rcExploitation.situationsIds?.includes(index);
  }

  toggleExclusionRC(exclusionId: number, event: any) {
    if (!this.rcExploitation.exclusionsIds) this.rcExploitation.exclusionsIds = [];
    if (event.target.checked) this.rcExploitation.exclusionsIds.push(exclusionId);
    else this.rcExploitation.exclusionsIds = this.rcExploitation.exclusionsIds.filter(id => id !== exclusionId);
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
  console.log('applyExclusionsFilter appelé', {
    keyboardFilter: this.keyboardFilterExclusions,
    exclusionsRCLength: this.exclusionsRC.length,
    filteredLength: this.filteredExclusionsRC.length
  });
  
  if (!this.keyboardFilterExclusions) {
    this.filteredExclusionsRC = [...this.exclusionsRC];
    return;
  }

  this.filteredExclusionsRC = this.exclusionsRC.filter(exclusion =>
    exclusion.nom.toLowerCase().includes(this.keyboardFilterExclusions) ||
    (exclusion.id && exclusion.id.toString().includes(this.keyboardFilterExclusions))
  );
  
  console.log('Après filtrage:', this.filteredExclusionsRC);
}

  resetExclusionsFilter() {
    this.keyboardFilterExclusions = '';
    this.filteredExclusionsRC = [...this.exclusionsRC];
  }
   loadSousGarantiesWithDetails(): Promise<void> {
    return new Promise((resolve) => {
      this.contratService.getSousGaranties().subscribe({
        next: (sousGaranties: any[]) => {
          // Stocker les sous-garanties avec leurs détails complets
          this.sousGarantiesWithDetails = sousGaranties;
          
          // Garder l'ancienne structure pour la compatibilité
          this.sousGarantiesOptions = sousGaranties.map(sg => ({
            label: sg.nom,
            value: sg.id
          }));
          
          console.log('Sous-garanties chargées avec détails:', this.sousGarantiesWithDetails);
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

// Remplacer la méthode getGarantiesGroupedByParent
getGarantiesGroupedByParent(situation: SituationRisque): any[] {
  // Utiliser le cache pour éviter les recalculs
  if (this.garantiesGroupedCache.has(situation)) {
    return this.garantiesGroupedCache.get(situation)!;
  }

  const groups: { [key: string]: any } = {};
  
  situation.garanties.forEach(garantie => {
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

// Optimiser getSousGarantieName avec cache
getSousGarantieName(sousGarantieId: number): string {
  if (this.sousGarantieNameCache.has(sousGarantieId)) {
    return this.sousGarantieNameCache.get(sousGarantieId)!;
  }

  const sg = this.sousGarantiesOptions.find(s => s.value === sousGarantieId);
  const name = sg ? sg.label : `Sous-garantie ${sousGarantieId}`;
  
  this.sousGarantieNameCache.set(sousGarantieId, name);
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
}

