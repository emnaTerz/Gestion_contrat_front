


import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratService, ContratDTO, Fractionnement, CodeRenouvellement, Branche, TypeContrat, SectionDTO } from '@/layout/service/contrat';

interface Exclusion {
  id: number;
  nom: string;
}

interface Garantie {
  sectionId: number;
  sousGarantieId: number;
  franchise?: number;
  limite?: number;
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
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, StepsModule, ToastModule],
  templateUrl: './modifier-contrat-component.component.html',
  styleUrls: ['./modifier-contrat-component.component.scss']
})
export class ModifierContratComponent implements OnInit {

  currentStep = 0;
  numPolice = '';
  nom_assure = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '' };
  fractionnement = '';
  codeRenouvellement = '';
  branche = '';
  typeContrat = '';
  dateDebut = '';
  dateFin = '';
  startTime = '';

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
      private router: Router
  ) {}

ngOnInit(): void {
  const now = new Date();
  this.loadSousGaranties().then(() => {
    this.route.params.subscribe(params => {
      this.numPolice = params['numPolice'];
      if (this.numPolice) {
        // 🔹 D’abord tenter de verrouiller le contrat
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

            // Ensuite charger les détails du contrat
            this.loadContrat(this.numPolice);
          },
          error: err => {
            alert(err.error.message || "Impossible de verrouiller le contrat");
       
          }
        });
      }
    });
  });
}


loadContrat(numPolice: string) {
  this.contratService.getContrat(numPolice).subscribe({
    next: (contrat: ContratDTO) => {
      // Remplir tous les champs principaux
      this.numPolice = contrat.numPolice;
      this.nom_assure = contrat.nom_assure;
      this.adherent = contrat.adherent;
      this.fractionnement = contrat.fractionnement;
      this.codeRenouvellement = contrat.codeRenouvellement;
      this.branche = contrat.branche;
      this.typeContrat = contrat.typeContrat;
      this.dateDebut = contrat.dateDebut;
      this.dateFin = contrat.dateFin;
 

      // Remplir les situations de risques et garanties
      this.situationRisques = contrat.sections.map(section => {
        const garantiesMapped = section.garanties.map(g => {
          console.log(`Situation: ${section.identification}, Sous-Garantie: ${g.sousGarantieId}, primeNET:`, g.primeNET);
          return {
            sectionId: g.sectionId || 0,
            sousGarantieId: g.sousGarantieId,
            franchise: g.franchise,
            limite: g.limite,
            maximum: g.maximum,
            minimum: g.minimum,
            capitale: g.capitale,
            primeNET: g.primeNet,
            exclusionsIds: g.exclusions.map(e => e.exclusionId),
            exclusionsOptions: []
          };
        });

        return {
          numPolice: section.numPolice,
          identification: section.identification,
          adresse: section.adresse,
          natureConstruction: section.natureConstruction,
          contiguite: section.contiguite,
          avoisinage: section.avoisinage,
          garanties: garantiesMapped
        };
      });

      // Charger les exclusions pour chaque garantie
      this.situationRisques.forEach(s =>
        s.garanties.forEach(g => this.loadExclusionsForGarantie(g))
      );

      // Lock automatique le contrat
      this.lockContrat();

      // Forcer Angular à mettre à jour l'affichage
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


  // Lock / Unlock
  lockContrat() {
    this.contratService.lockContrat(this.numPolice).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Contrat verrouillé' });
    });
  }




  // Ajouter / supprimer situations
  addSituation() {
    this.situationRisques.push({ ...this.currentSituationRisque, numPolice: this.numPolice });
  }
  removeSituation(index: number) {
    this.situationRisques.splice(index, 1);
  }

  // Ajouter / supprimer garanties
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
  // 🔹 Déverrouiller le contrat avant l’envoi
  console.log(this.startTime);
  this.contratService.unlockContrat(this.numPolice, false, this.startTime).subscribe({
    next: () => {
      const contratData: ContratDTO = {
        numPolice: this.numPolice,
        nom_assure: this.nom_assure,
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
            limite: g.limite != null ? Number(g.limite) : 0,
            maximum: g.maximum != null ? Number(g.maximum) : 0,
            minimum: g.minimum != null ? Number(g.minimum) : 0,
            capitale: g.capitale != null ? Number(g.capitale) : 0,
            primeNET: g.primeNET != null ? Number(g.primeNET) : 0,
            exclusions: (g.exclusionsIds || []).map(id => ({ exclusionId: Number(id) }))
          }))
        })) as SectionDTO[]
      };

      // 🔹 Appel à l’API PUT /modifier
      this.contratService.modifierContrat(contratData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Contrat mis à jour',
            detail: 'Les modifications ont été enregistrées avec succès.'
          });
          // 🔹 Navigation vers la page Contrat
          this.router.navigate(['/contrat']); // <-- mettre le path correct
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
    next: () => {
      this.router.navigate(['/contrat']); // redirection après succès
    },
    error: (err) => {
      console.error('Erreur lors du déverrouillage :', err);
      this.router.navigate(['/contrat']); // on peut forcer la redirection quand même
    }
  });
}
}
