
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { Branche, CodeRenouvellement, ContratDTO, ContratService, Fractionnement, TypeContrat } from '@/layout/service/contrat';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';

interface Exclusion {
  id: number;
  nom: string;
}

interface Garantie {
  sectionId: number;
  sousGarantieId: number;
  franchise?: number; // Long
  maximum?: number;
  minimum?: number;
  capitale?: number;
  primeNET?: number;
  exclusionsIds?: number[];
  exclusionsOptions?: Exclusion[]; // Options d'exclusions pour cette garantie
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
    CheckboxModule
  ],
  templateUrl: './contrat-component.component.html',
  styleUrls: ['./contrat-component.component.scss']
})
export class ContratComponent implements OnInit {
  currentStep: number = 0;

  // Étape 1 : Informations générales
  numPolice: string = '';
  adherent = { codeId: '', nomRaison: '', adresse: '', activite: '' , nouveau: true };
  fractionnement: string = '';
  codeRenouvellement: string = '';
  branche: string = '';
  nom_assure: string = '';
  typeContrat: string = '';
  dateDebut: string = '';
  dateFin: string = '';
 startTime: string = '';
 codeAgence: string = '';

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
  franchiseOptions = [
    { label: 'Oui', value: 'OUI' },
    { label: 'Non', value: 'NON' }
  ];

  steps = [
    { label: 'Informations générales' },
    { label: 'Situations de Risques' },
    {label: 'Garanties' },
    { label: 'Exclusions' },
    { label: 'Résumé' }
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
  editIndex: number | null = null;  
  constructor(private contratService: ContratService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadSousGaranties();
   const now = new Date(); // date locale
this.startTime = now.getFullYear() + '-' +
  String(now.getMonth()+1).padStart(2,'0') + '-' +
  String(now.getDate()).padStart(2,'0') + 'T' +
  String(now.getHours()).padStart(2,'0') + ':' +
  String(now.getMinutes()).padStart(2,'0') + ':' +
  String(now.getSeconds()).padStart(2,'0');
console.log('Heure locale format ISO sans décalage:', this.startTime);


  }

  loadSousGaranties() {
    this.contratService.getSousGaranties().subscribe(data => {
      this.sousGarantiesOptions = data.map(sg => ({
        label: sg.nom,
        value: sg.id
      }));
    });
  }


editSituation(index: number) {
  // Charger la situation sélectionnée dans currentSituationRisque
  this.currentSituationRisque = { ...this.situationRisques[index] };

  // Facultatif : stocker l'index si tu veux remplacer au lieu de réajouter
  this.editIndex = index;
}

    loadExclusionsForGarantie(garantie: Garantie): Promise<void> {
  return new Promise((resolve, reject) => {
    if (garantie.sousGarantieId && garantie.sousGarantieId > 0) {
      this.contratService.getExclusionsByGarantie(garantie.sousGarantieId).subscribe({
        next: (data) => {
          garantie.exclusionsOptions = data;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des exclusions:', error);
          garantie.exclusionsOptions = [];
          resolve();
        }
      });
    } else {
      garantie.exclusionsOptions = [];
      resolve();
    }
  });
}
getGarantieName(ids: number | number[]): string {
  if (!ids) return 'Aucune garantie';

  // Convertir en tableau si c'est un seul id
  const idArray = Array.isArray(ids) ? ids : [ids];

  return this.sousGarantiesOptions
    .filter(sg => idArray.includes(sg.value))
    .map(sg => sg.label)
    .join(', ');
}


  getExclusionName(exclusionId: number, garantie: Garantie): string {
    if (garantie.exclusionsOptions) {
      const exclusion = garantie.exclusionsOptions.find(e => e.id === exclusionId);
      return exclusion ? exclusion.nom : 'Exclusion inconnue';
    }
    return 'Exclusion inconnue';
  }

nextStep() {
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
  loadExclusionsForAllGaranties() {
    // Charger les exclusions pour toutes les garanties
    this.situationRisques.forEach(situation => {
      situation.garanties.forEach(garantie => {
        if (garantie.sousGarantieId) {
          this.loadExclusionsForGarantie(garantie);
        }
      });
    });
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  /* addSituation() {
    this.currentSituationRisque.numPolice = this.numPolice;
    this.situationRisques.push({ ...this.currentSituationRisque });

    this.currentSituationRisque = {
      numPolice: '',
      identification: '',
      adresse: '',
      natureConstruction: '',
      contiguite: '',
      avoisinage: '',
      garanties: []
    };
  } */

    addSituation() {
  if (this.editIndex !== null) {
    // On est en mode édition → mettre à jour l'élément existant
    this.situationRisques[this.editIndex] = { ...this.currentSituationRisque };
    this.editIndex = null; // sortir du mode édition
  } else {
    // Mode ajout
    this.situationRisques.push({ ...this.currentSituationRisque });
  }

  // Réinitialiser le formulaire
  this.currentSituationRisque = {
      numPolice: '',
      identification: '',
      adresse: '',
      natureConstruction: '',
      contiguite: '',
      avoisinage: '',
      garanties: []
    };
}


  removeSituation(index: number) {
    this.situationRisques.splice(index, 1);
  }

  addGarantie(situation: SituationRisque) {
    const nouvelleGarantie: Garantie = {
      sectionId: 0,
      sousGarantieId: 0,
      franchise: 0,
      exclusionsIds: [],
      exclusionsOptions: []
    };
    situation.garanties.push(nouvelleGarantie);
  }

  removeGarantie(situation: SituationRisque, index: number) {
    situation.garanties.splice(index, 1);
  }

  onGarantieChange(garantie: Garantie) {
    // Quand l'utilisateur change la garantie, charger les exclusions correspondantes
    if (garantie.sousGarantieId) {
      this.loadExclusionsForGarantie(garantie);
      // Réinitialiser les exclusions sélectionnées
      garantie.exclusionsIds = [];
    }
  }




   submit() {
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
      sections: this.situationRisques.map(situation => ({
        identification: situation.identification,
        adresse: situation.adresse,
        natureConstruction: situation.natureConstruction,
        contiguite: situation.contiguite,
        avoisinage: situation.avoisinage,
        numPolice: this.numPolice,
        garanties: situation.garanties.map(garantie => ({
          franchise: garantie.franchise ?? 0,
          sousGarantieId: Number(garantie.sousGarantieId),
          maximum: garantie.maximum ? Number(garantie.maximum) : undefined,
          minimum: garantie.minimum ? Number(garantie.minimum) : undefined,
          capitale: garantie.capitale ? Number(garantie.capitale) : undefined,
          primeNET: garantie.primeNET ? Number(garantie.primeNET) : undefined,
          exclusions: (garantie.exclusionsIds || []).map(exclusionId => ({ exclusionId: Number(exclusionId) }))
        }))
      }))
    };

    console.log('Contrat à créer:', JSON.stringify(contratData, null, 2));

    this.contratService.createContrat(contratData).subscribe({
      next: (response) => {
        alert('Contrat créé avec succès !');
        console.log('Réponse du serveur:', response);
      },
      error: (error) => this.handleError(error)
    });
  }



private handleError(error: any): void {
  if (error.status === 400) {
    // Erreur de validation côté serveur
    if (error.error && error.error.message) {
      alert(`Erreur de validation: ${error.error.message}`);
    } else if (error.error && Array.isArray(error.error)) {
      const errors = error.error.map((e: any) => e.defaultMessage || e.message).join('\n');
      alert(`Erreurs de validation:\n${errors}`);
    } else {
      alert('Données invalides. Vérifiez les champs saisis.');
    }
  } else if (error.status === 401 || error.status === 403) {
    alert('Erreur d\'authentification. Veuillez vous reconnecter.');
  } else if (error.status === 500) {
    alert('Erreur serveur. Veuillez réessayer plus tard.');
  } else {
    alert('Erreur inconnue: ' + error.message);
  }
}



  isExclusionSelected(garantie: Garantie, exclusionId: number): boolean {
  return garantie.exclusionsIds?.includes(exclusionId) || false;
}

toggleExclusion(garantie: Garantie, exclusionId: number) {
  if (!garantie.exclusionsIds) {
    garantie.exclusionsIds = [];
  }
  
  const index = garantie.exclusionsIds.indexOf(exclusionId);
  if (index > -1) {
    // Retirer l'exclusion si déjà sélectionnée
    garantie.exclusionsIds.splice(index, 1);
  } else {
    // Ajouter l'exclusion si non sélectionnée
    garantie.exclusionsIds.push(exclusionId);
  }
  
  // Forcer la détection des changements (optionnel)
  garantie.exclusionsIds = [...garantie.exclusionsIds];
}
// Ajouter cette méthode pour gérer la conversion franchise string → number
private convertFranchise(garantie: Garantie): number {
  return garantie.franchise ?? 0;
}

}