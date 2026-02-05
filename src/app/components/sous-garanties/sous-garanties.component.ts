import { Branche, ContratService, Exclusion, SousGarantie } from '@/layout/service/contrat';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-sous-garanties',
  standalone: true,
  imports: [CommonModule,
    FormsModule, 
    ButtonModule,
    InputTextModule,
    CardModule, ConfirmDialogModule,
    ToastModule,
    ButtonModule,
  DialogModule],
  templateUrl: './sous-garanties.component.html',
  styleUrl: './sous-garanties.component.scss'
})
export class SousGarantiesComponent {
 sousGaranties: SousGarantie[] = [];
 exclusions: Exclusion[] = [];
  garantieId!: number;
  branche!: string;
  branches!:Branche;
  filteredSousGaranties: SousGarantie[] = [];
    filteredExclusions: Exclusion[] = [];
selectedItem: any = null;
  searchTerm: string = '';
    garantieLabel: string = '';
    exclusionLabel: string = '';

     sousGarantieToDelete!: SousGarantie;
  displayConfirm: boolean = false;
  nouvelleSousGarantieNom: string = '';
mode: 'Garanties' | 'Exclusions' = 'Garanties';
  nouvelItemNom: string = '';
   constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sousGarantieService: ContratService,
     private messageService: MessageService 
  
  ) { }

 ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.garantieId = +params['garantieId'];
    this.branche = params['branche'];

    // ✅ CAS BRANCHE Q → Exclusions uniquement
    if (this.branche === Branche.Q) {
      this.mode = 'Exclusions';
      this.loadExclusions();
    } else {
      // autres branches → comportement normal
      this.mode = 'Garanties';
      this.loadSousGaranties();
    }
  });
}
ouvrirClauses(item: SousGarantie) {
  if (!item) return;
  
  // maintenant on est sûr que TS accepte que garantieParent peut être absent
  this.router.navigate(['/sous-clause-garantie', item.id], {
    queryParams: { nomSousGarantie: item.nom }
  });
}


 switchMode(newMode: 'Garanties' | 'Exclusions') {
  // 🔒 Interdiction Garanties si branche Q
  if (this.branche === Branche.Q && newMode === 'Garanties') {
    return;
  }

  this.mode = newMode;
  this.searchTerm = '';
  this.nouvelItemNom = '';
  this.loadData();
}

 loadData() {
    if (this.mode === 'Garanties') {
      this.loadSousGaranties();
    } else {
      this.loadExclusions();
    }
  }
loadExclusions() {
  const brancheEnum = this.branche as Branche;

  this.sousGarantieService.getExclusionsByBrancheAndGarantie(brancheEnum, this.garantieId).subscribe({
    next: (data) => {
      console.log('Exclusions reçues :', data);

      this.exclusions = data;
      this.filteredExclusions = [...data];

      if (data.length > 0 && data[0].garantie) {
        let libelle = data[0].garantie.libelle.trim();

        // Mapping pour les garanties spécifiques de la branche Q
        const brancheQMap: { [key: string]: string } = {
          'Incendie': 'Incendie d’origine interne, explosion chimique d’origine interne et action directe de la foudre',
          'Vol': 'Vol et tentative de vol'
          // Ajouter d’autres garanties si besoin
        };

        // Si c’est la branche Q et que le libelle est dans le mapping
        if (this.branche === 'Q' && brancheQMap[libelle]) {
          this.garantieLabel = brancheQMap[libelle];
        } else {
          this.garantieLabel = libelle; // Sinon afficher le libelle normal
        }
      }
    },
    error: (error) => console.error('Erreur chargement exclusions', error)
  });
}


  // Filtrer les éléments selon le mode
  filterItems() {
    if (this.mode === 'Garanties') {
      this.filteredSousGaranties = this.sousGaranties.filter(sg =>
        sg.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredExclusions = this.exclusions.filter(ex =>
        ex.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Getter pour les éléments filtrés (utilisé dans le template)
  get filteredItems() {
    return this.mode === 'Garanties' ? this.filteredSousGaranties : this.filteredExclusions;
  }

  // Ajouter un élément selon le mode
  ajouterItem() {
    if (!this.nouvelItemNom.trim()) return;

    if (this.mode === 'Garanties') {
      this.ajouterSousGarantie();
    } else {
      this.ajouterExclusion();
    }
  }
  ajouterExclusion() {
    console.log(this.branche)
  const nouvelleExclusion = {
    nom: this.nouvelItemNom,
    branche: this.branche,
    garantie: { id: this.garantieId }  // ← Envoyer un objet garantie avec id
  };

  this.sousGarantieService.createExclusion(nouvelleExclusion).subscribe({
    next: (data) => {
      this.exclusions.push(data);
      this.filteredExclusions.push(data);
      this.nouvelItemNom = '';
      console.log('✅ Exclusion créée avec succès:', data);
    },
    error: (error) => {
      console.error('❌ Erreur création exclusion:', error);
      // Optionnel: afficher un message d'erreur à l'utilisateur
      alert('Erreur lors de la création de l\'exclusion');
    }
  });
}
   confirmDelete(item: any) {
    this.selectedItem = item;
    this.displayConfirm = true;
  }
getDeleteTitle(): string {
  return this.mode === 'Garanties' ? 'Supprimer la garantie' : 'Supprimer l\'exclusion';
}
  // Supprimer l'élément selon le mode
  deleteItem() {
    if (this.mode === 'Garanties') {
      this.deleteSousGarantie();
    } else {
      this.deleteExclusion();
    }
    this.displayConfirm = false;
  }


deleteExclusion() {
  if (!this.selectedItem) return;

  this.sousGarantieService.deleteExclusion(this.selectedItem.id).subscribe({
    next: () => {
      console.log('Exclusion supprimée avec succès');
      
      // Mettre à jour les listes locales
      this.exclusions = this.exclusions.filter(ex => ex.id !== this.selectedItem.id);
      this.filteredExclusions = this.filteredExclusions.filter(ex => ex.id !== this.selectedItem.id);
      this.selectedItem = null;
      this.displayConfirm = false;
      
      this.showSuccessMessage('Exclusion supprimée avec succès');
    },
    error: (error) => {
      console.error('Erreur détaillée suppression exclusion:', error);
      
      // Vérifier si c'est l'erreur de contrainte de clé étrangère
      if (this.isForeignKeyConstraintError(error)) {
        this.showErrorMessage('Cette exclusion est déjà utilisée dans un contrat et ne peut pas être supprimée');
      } else if (error.status === 500) {
        this.showErrorMessage('Erreur serveur lors de la suppression. Veuillez réessayer.');
      } else if (error.status === 404) {
        this.showErrorMessage('Exclusion non trouvée');
      } else if (error.status === 403) {
        this.showErrorMessage('Vous n\'avez pas les droits pour supprimer cette exclusion');
      } else {
        this.showErrorMessage('Erreur lors de la suppression de l\'exclusion');
      }
      
      this.displayConfirm = false;
    }
  });
}

// Méthode pour détecter l'erreur de contrainte de clé étrangère - OPTIMISÉE
private isForeignKeyConstraintError(error: any): boolean {
  const errorBody = error?.error;
  
  // Extraire le message du body d'erreur
  let bodyMessage = '';
  if (errorBody && typeof errorBody === 'object') {
    bodyMessage = errorBody.message?.toString().toLowerCase() || '';
  } else if (typeof errorBody === 'string') {
    bodyMessage = errorBody.toLowerCase();
  }
  
  // Rechercher les motifs spécifiques de contrainte de clé étrangère
  const searchTerms = [
    'contrainte de clé étrangère',
    'foreign key constraint',
    'exclusion_garantie',
    'viole la contrainte',
    'est toujours référencée'
  ];
  
  return searchTerms.some(term => bodyMessage.includes(term.toLowerCase()));
}

// Méthodes utilitaires pour les messages
private showSuccessMessage(message: string) {
  this.messageService.add({
    severity: 'success',
    summary: 'Succès',
    detail: message,
    life: 3000
  });
}

private showErrorMessage(message: string) {
  this.messageService.add({
    severity: 'error',
    summary: 'Erreur',
    detail: message,
    life: 5000
  });
}

  loadSousGaranties() {
    this.sousGarantieService.getSousGarantiesbybranche(this.garantieId, this.branche)
      .subscribe({
        next: (data) => {
          this.sousGaranties = data;
          this.filteredSousGaranties = data;

          // Récupérer le libellé de la garantie depuis le premier élément
          if (data.length > 0 && data[0].garantie) {
            this.garantieLabel = data[0].garantie.libelle;
          }
        },
        error: (err) => console.error('Erreur lors de la récupération des sous-garanties', err)
      });
  }

  // Filtrage des sous-garanties selon searchTerm
  filterSousGaranties() {
    const term = this.searchTerm.toLowerCase();
    this.filteredSousGaranties = this.sousGaranties.filter(sg =>
      sg.nom.toLowerCase().includes(term)
    );
  }
  clearSearch() {
  this.searchTerm = '';
  this.filteredSousGaranties = this.sousGaranties;
}


 deleteSousGarantie() {
  if (!this.selectedItem) return; // Utilisez selectedItem pour la cohérence

  this.sousGarantieService.deleteSousGarantie(this.selectedItem.id).subscribe({
    next: () => {
      console.log('Sous-garantie supprimée avec succès');
      
      // Mettre à jour les listes locales
      this.sousGaranties = this.sousGaranties.filter(sg => sg.id !== this.selectedItem.id);
      this.filteredSousGaranties = this.filteredSousGaranties.filter(sg => sg.id !== this.selectedItem.id);
      this.selectedItem = null;
      this.displayConfirm = false;
      
      this.showSuccessMessage('Sous-garantie supprimée avec succès');
    },
    error: (error) => {
      console.error('Erreur détaillée suppression sous-garantie:', error);
      console.error('Error body:', error.error);
      
      // Vérifier si c'est l'erreur de contrainte de clé étrangère
      if (this.isForeignKeyConstraintErrorSousGarantie(error)) {
        this.showErrorMessage('Cette garantie est déjà utilisée dans un contrat et ne peut pas être supprimée');
      } else if (error.status === 500) {
        this.showErrorMessage('Erreur serveur lors de la suppression. Veuillez réessayer.');
      } else if (error.status === 404) {
        this.showErrorMessage('Sous-garantie non trouvée');
      } else if (error.status === 403) {
        this.showErrorMessage('Vous n\'avez pas les droits pour supprimer cette sous-garantie');
      } else {
        this.showErrorMessage('Erreur lors de la suppression de la sous-garantie');
      }
      
      this.displayConfirm = false;
    }
  });
}

// Méthode spécifique pour détecter les erreurs de contrainte pour les sous-garanties
private isForeignKeyConstraintErrorSousGarantie(error: any): boolean {
  const errorBody = error?.error;
  
  // Extraire le message du body d'erreur
  let bodyMessage = '';
  if (errorBody && typeof errorBody === 'object') {
    bodyMessage = errorBody.message?.toString().toLowerCase() || '';
  } else if (typeof errorBody === 'string') {
    bodyMessage = errorBody.toLowerCase();
  }
  
  console.log('🔍 Recherche contrainte FK Sous-garantie:', bodyMessage);
  
  // Rechercher les motifs spécifiques de contrainte de clé étrangère pour les sous-garanties
  const searchTerms = [
    'contrainte de clé étrangère',
    'foreign key constraint',
    'sous_garantie', // nom de la table qui pourrait référencer les sous-garanties
    'garantie_contrat', // ou autre table de relation
    'viole la contrainte',
    'est toujours référencée',
    'violates foreign key'
  ];
  
  return searchTerms.some(term => bodyMessage.includes(term.toLowerCase()));
}

ajouterSousGarantie() {
  const nom = this.nouvelItemNom.trim();
  if (!nom) {
    alert('Veuillez saisir un nom pour la sous-garantie.');
    return;
  }

  const nouvelleSousGarantie = {
    nom: nom,
    branche: this.branche, // renseigne la branche sélectionnée
    garantie: { 
      id: this.garantieId, 
    }
  };

  console.log('📤 Données envoyées pour sous-garantie:', nouvelleSousGarantie);

  this.sousGarantieService.createSousGarantie(nouvelleSousGarantie as any).subscribe({
    next: (res) => {
      console.log('✅ Sous-garantie créée:', res);
      this.sousGaranties.push(res);
      this.filteredSousGaranties.push(res);
      this.nouvelItemNom = ''; // reset du champ
      this.showSuccessMessage('Sous-garantie créée avec succès');
    },
    error: (err) => {
      console.error('❌ Erreur création sous-garantie:', err);
      this.showErrorMessage('Erreur lors de la création de la sous-garantie');
    }
  });
}



}
