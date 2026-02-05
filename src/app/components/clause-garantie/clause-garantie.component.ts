import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClauseGarantie, ContratService } from '@/layout/service/contrat';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-clause-garantie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clause-garantie.component.html',
  styleUrls: ['./clause-garantie.component.scss']
})
export class ClauseGarantieComponent implements OnInit {

  @Input() sousGarantieId!: number;
  @Input() sousGarantieNom!: string;

  clausiers: ClauseGarantie[] = [];
  newClausierLibelle: string = '';
  selectedFile?: File;

  constructor(
    private contratService: ContratService,
    private route: ActivatedRoute
  ) {}

 ngOnInit() {
    // Récupérer l'id depuis l'URL et le nom depuis query params
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.sousGarantieId = +id;

        // Charger les clauses
        this.loadClauses();
      }
    });

    this.route.queryParamMap.subscribe(params => {
      this.sousGarantieNom = params.get('nomSousGarantie') || '';
    });

  }
loadClauses() {
  if (!this.sousGarantieId) return;

  this.contratService.getClausesBySousGarantie(this.sousGarantieId)
    .subscribe({
      next: clauses => {
        this.clausiers = clauses;
      },
      error: err => console.error('Erreur chargement clauses', err)
    });
}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  ajouterClausier() {
    if (!this.newClausierLibelle) return;

    const formData = new FormData();
    formData.append('titre', this.newClausierLibelle);
    formData.append('sousGarantieId', this.sousGarantieId!.toString());

    if (this.selectedFile) {
      formData.append('pdf', this.selectedFile);
    }

    this.contratService.createClauseFormData(formData)
      .subscribe({
        next: (clause: ClauseGarantie) => {
          this.clausiers.push({
            ...clause,
            sousGarantieId: clause.sousGarantie?.id
          });
          this.newClausierLibelle = '';
          this.selectedFile = undefined;
        },
        error: err => console.error('Erreur création clause', err)
      });
  }

  confirmDeleteClausier(id: number, titre: string) {
    if (confirm(`Supprimer le clausier "${titre}" ?`)) {
      this.contratService.deleteClause(id)
        .subscribe({
          next: () => this.clausiers = this.clausiers.filter(c => c.id !== id),
          error: err => console.error('Erreur suppression clause', err)
        });
    }
  }
downloadPdf(clause: ClauseGarantie) {
  if (!clause.id) return;

  this.contratService.downloadClausePdf(clause.id).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = clause.titre + '.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => console.error('Erreur téléchargement PDF', err)
  });
}




}
