

import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, ContratDTO, Fractionnement, CodeRenouvellement, Branche, TypeContrat, SectionDTO } from '@/layout/service/contrat';
import { CheckboxModule } from 'primeng/checkbox';

interface Exclusion {
  id: number;
  nom: string;
}

interface Garantie {
  sectionId: number;
  sousGarantieId: number;
  franchise?: number;
  maximum?: number;
  minimum?: number;
  capitale?: number;
  primeNET?: number;
  exclusionsIds?: number[];
  exclusionsOptions?: Exclusion[];
}

interface SituationRisque {
  numPolice: string;
  identification: string;
  adresse: string;
  natureConstruction: string;
  contiguite: string;
  avoisinage: string;
  garanties: Garantie[];
}

@Component({
  selector: 'app-modifier-contrat',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, StepsModule, ToastModule,CheckboxModule],
  templateUrl: './modifier-contrat-component.component.html',
  styleUrls: ['./modifier-contrat-component.component.scss']
})
export class ModifierContratComponent implements OnInit {

  currentStep = 0;
  numPolice = '';
  nom_assure = '';
  codeAgence: string = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '' , nouveau: true};
  fractionnement = '';
  codeRenouvellement = '';
  branche = '';
  typeContrat = '';
  dateDebut = '';
  dateFin = '';
  startTime = '';

  // Mapping agences pour envoyer le code exact
  codeAgenceOptions = [
    { label: 'ARIANA', value: '151' },
    { label: 'TUNIS', value: '152' },
    { label: 'SOUSSE', value: '153' }
  ];

  fractionnementOptions = [
    { label: 'Oui', value: 'ZERO' },
    { label: 'Non', value: 'UN' }
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
    { label: 'Situations de Risques' },
    { label: 'Garanties' },
    { label: 'Exclusions' }
  ];

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
              const now = new Date();
              this.startTime = now.toISOString().split('.')[0]; // format ISO sans millisecondes
              this.loadContrat(this.numPolice);
            },
            error: err => this.handleLockError(err)
          });
        }
      });
    });
  }

toggleNouveau(adherent: any) {
  adherent.nouveau = !adherent.nouveau;
  // Tu peux ajouter ici toute logique supplémentaire, ex: envoyer au backend
  console.log('Nouveau adhérent:', adherent.nouveau);
}


  handleLockError(err: any) {
    console.log('Erreur reçue du serveur :', err);
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

  loadContrat(numPolice: string) {
    this.contratService.getContrat(numPolice).subscribe({
      next: (contrat: ContratDTO) => {
        this.numPolice = contrat.numPolice;
        this.nom_assure = contrat.nom_assure;
        this.codeAgence = contrat.codeAgence;
        this.adherent = contrat.adherent;
        console.log(contrat.adherent.nouveau);
        this.fractionnement = contrat.fractionnement;
        this.codeRenouvellement = contrat.codeRenouvellement;
        this.branche = contrat.branche;
        this.typeContrat = contrat.typeContrat;
        this.dateDebut = contrat.dateDebut;
        this.dateFin = contrat.dateFin;

        this.situationRisques = contrat.sections.map(section => ({
          numPolice: section.numPolice,
          identification: section.identification,
          adresse: section.adresse,
          natureConstruction: section.natureConstruction,
          contiguite: section.contiguite,
          avoisinage: section.avoisinage,
          garanties: section.garanties.map(g => ({
            sectionId: g.sectionId || 0,
            sousGarantieId: g.sousGarantieId,
            franchise: g.franchise,
            maximum: g.maximum,
            minimum: g.minimum,
            capitale: g.capitale,
            primeNET: g.primeNet,
            exclusionsIds: g.exclusions.map(e => e.exclusionId),
            exclusionsOptions: []
          }))
        }));

        this.situationRisques.forEach(s =>
          s.garanties.forEach(g => this.loadExclusionsForGarantie(g))
        );

        this.lockContrat();
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement contrat:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le contrat.'
        });
      }
    });
  }

  lockContrat() {
    this.contratService.lockContrat(this.numPolice).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Contrat verrouillé' });
    });
  }

  addSituation() {
    this.situationRisques.push({ ...this.currentSituationRisque, numPolice: this.numPolice });
  }
  removeSituation(index: number) {
    this.situationRisques.splice(index, 1);
  }
  addGarantie(situation: SituationRisque) {
    situation.garanties.push({ sectionId: 0, sousGarantieId: 0, exclusionsIds: [], exclusionsOptions: [] });
  }
  removeGarantie(situation: SituationRisque, index: number) {
    situation.garanties.splice(index, 1);
  }

  loadExclusionsForGarantie(garantie: Garantie) {
    if (garantie.sousGarantieId > 0) {
      this.contratService.getExclusionsByGarantie(garantie.sousGarantieId).subscribe({
        next: (data) => { garantie.exclusionsOptions = data; },
        error: () => { garantie.exclusionsOptions = []; }
      });
    }
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

  toggleExclusion(garantie: Garantie, exclusionId: number) {
    if (!garantie.exclusionsIds) garantie.exclusionsIds = [];
    const index = garantie.exclusionsIds.indexOf(exclusionId);
    if (index > -1) garantie.exclusionsIds.splice(index, 1);
    else garantie.exclusionsIds.push(exclusionId);
    garantie.exclusionsIds = [...garantie.exclusionsIds];
  }

  getGarantieName(sousGarantieId: number): string {
    const sg = this.sousGarantiesOptions.find(s => s.value === sousGarantieId);
    return sg ? sg.label : '';
  }

  submit() {
    this.contratService.unlockContrat(this.numPolice, false, this.startTime).subscribe({
      next: () => {
        const contratData: ContratDTO = {
          numPolice: this.numPolice,
          nom_assure: this.nom_assure,
          codeAgence: this.codeAgence, // ✅ Envoie directement le code
          adherent: this.adherent,
          fractionnement: this.fractionnement as Fractionnement,
          codeRenouvellement: this.codeRenouvellement as CodeRenouvellement,
          branche: this.branche as Branche,
          typeContrat: this.typeContrat as TypeContrat,
          dateDebut: this.dateDebut,
          dateFin: this.dateFin,
          startTime: this.startTime,
          sections: this.situationRisques.map(s => ({
            identification: s.identification,
            adresse: s.adresse,
            natureConstruction: s.natureConstruction,
            contiguite: s.contiguite,
            avoisinage: s.avoisinage,
            numPolice: this.numPolice,
            garanties: s.garanties.map(g => ({
              sectionId: g.sectionId || 0,
              sousGarantieId: Number(g.sousGarantieId) || 0,
              franchise: g.franchise != null ? Number(g.franchise) : 0,
              maximum: g.maximum != null ? Number(g.maximum) : 0,
              minimum: g.minimum != null ? Number(g.minimum) : 0,
              capitale: g.capitale != null ? Number(g.capitale) : 0,
              primeNET: g.primeNET != null ? Number(g.primeNET) : 0,
              exclusions: (g.exclusionsIds || []).map(id => ({ exclusionId: Number(id) }))
            }))
          })) as SectionDTO[]
        };

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
            console.error('Erreur mise à jour contrat', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de mettre à jour le contrat.'
            });
          }
        });
      },
    });
  }

  cancel() {
    this.contratService.unlockContrat(this.numPolice, true, this.startTime).subscribe({
      next: () => this.router.navigate(['/Landing']),
      error: () => this.router.navigate(['/Landing'])
    });
  }

}
