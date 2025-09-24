

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FilterService } from 'primeng/api';
import { Observable } from 'rxjs';
import { UserService } from '@/layout/service/UserService';
import { ContratService } from '@/layout/service/contrat';

export interface HistoriqueContrat {
  action: string;
  username: string;
  date: string;
  tempsRealisation: number;
}

export interface ContratVerrouille {
  numPolice: string;
  editingUser: string;
  editingStart: string;
}

@Component({
  selector: 'app-action-history',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    DatePickerModule,
    FormsModule
  ],
  templateUrl: './action-history.component.html',
  styleUrls: ['./action-history.component.scss']
})
export class ActionHistoryComponent implements OnInit {

  @ViewChild('historyTable') historyTable!: Table;

  mode: 'user' | 'contrat' | 'locked' = 'user';
  history$!: Observable<any[]>;
  selectedDate: Date | null = null;

  constructor(
    private userService: UserService,
    private contratService: ContratService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.loadHistory();

    // Filtre custom par date
    this.filterService.register('dateEquals', (value: any, filter: any): boolean => {
      if (!value || !filter) return true;
      const rowDate = new Date(value);
      const filterDate = new Date(filter);
      return rowDate.getFullYear() === filterDate.getFullYear() &&
             rowDate.getMonth() === filterDate.getMonth() &&
             rowDate.getDate() === filterDate.getDate();
    });
  }

  // Charger l'historique selon le mode
  loadHistory() {
    if (this.mode === 'user') {
      this.history$ = this.userService.getActionHistory();
    } else if (this.mode === 'contrat') {
      this.history$ = this.contratService.getHistoriqueContrat();
    } else if (this.mode === 'locked') {
      this.history$ = this.contratService.getLockedContrats(); // JWT inclus dans le service
    }
  }

  // Basculer entre les modes
  switchMode(mode: 'user' | 'contrat' | 'locked') {
    this.mode = mode;
    this.loadHistory();
    if (this.historyTable) this.historyTable.clear();
  }

  // Filtrer par date
  filterByDate() {
    if (this.selectedDate) {
      this.historyTable.filter(
        this.selectedDate,
        this.mode === 'user' ? 'timestamp' : 'date',
        'dateEquals'
      );
    } else {
      this.historyTable.clear();
    }
  }

  // Supprimer les filtres
  clearHistoryFilter() {
    this.selectedDate = null;
    if (this.historyTable) this.historyTable.clear();
  }

  // Calculer total actions utilisateur
  calculateActionTotal(username: string, history: any[]): number {
    return history.filter(h => h.username === username).length;
  }

  // Parser la date
  parseDate(value: string | Date): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // Formater temps réalisation
  formatTempsRealisation(ms: number): string {
    if (ms == null) return '';
    const minutes = Math.floor(ms / 60000);
    const secondes = Math.floor((ms % 60000) / 1000);
    const millisecondes = ms % 1000;
    return `${minutes} min ${secondes} s ${millisecondes} ms`;
  }
}
