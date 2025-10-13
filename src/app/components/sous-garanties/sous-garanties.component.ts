import { ContratService, SousGarantie } from '@/layout/service/contrat';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  garantieId!: number;
  branche!: string;
  filteredSousGaranties: SousGarantie[] = [];
  searchTerm: string = '';
    garantieLabel: string = '';
     sousGarantieToDelete!: SousGarantie;
  displayConfirm: boolean = false;

   constructor(
    private route: ActivatedRoute,
    private sousGarantieService: ContratService
  
  ) { }

  ngOnInit(): void {
    // Récupération des query params : garantieId et branche
    this.route.queryParams.subscribe(params => {
      this.garantieId = +params['garantieId'];
      this.branche = params['branche'];

      this.loadSousGaranties();
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
confirmDelete(sg: SousGarantie) {
    this.sousGarantieToDelete = sg;
    this.displayConfirm = true;
  }

  deleteSousGarantie() {
    if (!this.sousGarantieToDelete) return;

    this.sousGarantieService.deleteSousGarantie(this.sousGarantieToDelete.id).subscribe({
      next: () => {
        this.sousGaranties = this.sousGaranties.filter(sg => sg.id !== this.sousGarantieToDelete.id);
        this.filteredSousGaranties = this.filteredSousGaranties.filter(sg => sg.id !== this.sousGarantieToDelete.id);
        this.displayConfirm = false;
      },
      error: err => console.error('Erreur lors de la suppression', err)
    });
  }
}
