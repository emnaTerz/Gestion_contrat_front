/* import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Observable } from 'rxjs';
import { UserActionHistory, UserService } from '@/layout/service/UserService';


@Component({
  selector: 'app-action-history',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    
  ],
  templateUrl: './action-history.component.html',
  styleUrls: ['./action-history.component.scss']
})
export class ActionHistoryComponent implements OnInit {

  @ViewChild('historyTable') historyTable!: Table;

  history$!: Observable<UserActionHistory[]>;
dateFilter: Date | null = null;
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.history$ = this.userService.getActionHistory();
  }

  calculateActionTotal(username: string, history: UserActionHistory[]): number {
    return history.filter(h => h.username === username).length;
  }


formatDate(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${('0' + (d.getMonth()+1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
}

  // Clear le filtre
  clearHistoryFilter() {
    if (this.historyTable) {
      this.historyTable.clear();
    }
  }
} */

  import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Observable } from 'rxjs';
import {  UserService } from '@/layout/service/UserService';
import { ContratService } from '@/layout/service/contrat';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FilterService } from 'primeng/api';

export interface HistoriqueContrat {
  action: string;
  username: string;
  date: string;
  tempsRealisation: string;
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

  // Mode actuel : user ou contrat
  mode: 'user' | 'contrat' = 'user';

  // Historique affiché (utilisateur ou contrat)
  history$!: Observable<any[]>; // UserActionHistory[] ou HistoriqueContrat[]

  selectedDate: Date | null = null;
  constructor(
    private userService: UserService,
    private contratService: ContratService,
      private filterService: FilterService

  ) {}

ngOnInit(): void {
  this.loadHistory();

  this.filterService.register('dateEquals', (value: any, filter: any): boolean => {
    if (!value || !filter) return true;

    const rowDate = new Date(value);
    const filterDate = new Date(filter);

    if (isNaN(rowDate.getTime()) || isNaN(filterDate.getTime())) {
      return false;
    }

    return (
      rowDate.getFullYear() === filterDate.getFullYear() &&
      rowDate.getMonth() === filterDate.getMonth() &&
      rowDate.getDate() === filterDate.getDate()
    );
  });
}

parseDate(value: string | Date): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}


filterByDate() {
  if (this.selectedDate) {
    this.historyTable.filter(
      this.selectedDate,
      this.mode === 'user' ? 'timestamp' : 'date',
      'dateEquals' // nom du filtre custom
    );
  } else {
    this.historyTable.clear();
  }
}


clearHistoryFilter() {
  this.selectedDate = null;
  this.historyTable.clear(); // supprime tous les filtres
}


  // Charger l'historique selon le mode
  loadHistory() {
    if (this.mode === 'user') {
      this.history$ = this.userService.getActionHistory();
    } else {
      this.history$ = this.contratService.getHistoriqueContrat();
    }
  }

  // Basculer entre les modes et recharger l'historique
  switchMode(mode: 'user' | 'contrat') {
    this.mode = mode;
    this.loadHistory();
    if (this.historyTable) this.historyTable.clear(); // reset filtres
  }

  // Calculer le total d'actions pour un utilisateur (pour le group header)
  calculateActionTotal(username: string, history: any[]): number {
    return history.filter(h => h.username === username).length;
  }

  // Formatter la date
  formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth()+1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  }


  
  formatTempsRealisation(ms: number): string {
  if (ms == null) return '';

  const minutes = Math.floor(ms / 60000);
  const secondes = Math.floor((ms % 60000) / 1000);
  const millisecondes = ms % 1000;

  return `${minutes} min ${secondes} s ${millisecondes} ms`;
}
}
