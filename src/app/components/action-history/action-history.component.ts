
import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { FilterService } from 'primeng/api';
import { map, Observable, Subject, takeUntil } from 'rxjs';
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
export class ActionHistoryComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('historyTable') historyTable!: Table;
  startTime = '';
  mode: 'user' | 'contrat' | 'locked' = 'user';
  history$!: Observable<any[]>;
  selectedDate: Date | null = null;
  historyData: any[] = [];
  
  private destroy$ = new Subject<void>();
  private tableInitialized = false;
  router: any;

  constructor(
    private userService: UserService,
    private contratService: ContratService,
    private filterService: FilterService,
    private cdRef: ChangeDetectorRef
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

  ngAfterViewInit(): void {
    this.tableInitialized = true;
    // Use setTimeout to avoid change detection issues
    setTimeout(() => {
      this.cdRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  unlock(historyItem: ContratVerrouille) {
    console.log('HistoryItem:', historyItem);
    console.log('numPolice:', historyItem.numPolice);
    
    if (!historyItem.numPolice) {
      console.error('numPolice est null ou undefined');
      return;
    }

    const now = new Date();
    const startTime = now.getFullYear() + '-' +
      String(now.getMonth()+1).padStart(2,'0') + '-' +
      String(now.getDate()).padStart(2,'0') + 'T' +
      String(now.getHours()).padStart(2,'0') + ':' +
      String(now.getMinutes()).padStart(2,'0') + ':' +
      String(now.getSeconds()).padStart(2,'0');
    
    console.log('Appel unlock avec:', {
      numPolice: historyItem.numPolice,
      cancelled: true,
      startTime: startTime
    });
    
    this.contratService.unlockContrat(historyItem.numPolice, true, startTime)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('Contrat déverrouillé:', res);
          this.loadHistory();
        },
        error: (err) => {
          console.error('Erreur lors du déverrouillage:', err);
          console.error('Status:', err.status);
          console.error('Message:', err.message);
          console.error('Error body:', err.error);
        }
      });
  }
loadHistory() {
  if (this.mode === 'user') {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.userService.getCurrentUser().subscribe({
      next: (currentUser) => {
        this.history$ = this.userService.getActionHistory().pipe(
          map((actions: any[]) => {
            const isPole = (currentUser.email || '').toLowerCase() === 'pole.si';
            if (isPole) {
              return actions; // Pole.si voit tout
            } else {
              // Exclure toutes les actions liées à Pole.si
              return actions.filter(a => {
                const username = (a.username || '').toLowerCase();
                const actionText = (a.action || '').toLowerCase();
                return !username.includes('pole.si') && !actionText.includes('pole.si');
              });
            }
          })
        );

        this.history$.pipe(takeUntil(this.destroy$)).subscribe(data => {
          this.historyData = data || [];
          setTimeout(() => this.cdRef.detectChanges());
        });
      },
      error: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  } else if (this.mode === 'contrat') {
    this.history$ = this.contratService.getHistoriqueContrat();
    this.history$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.historyData = data || [];
      setTimeout(() => this.cdRef.detectChanges());
    });
  } else if (this.mode === 'locked') {
    this.history$ = this.contratService.getLockedContrats();
    this.history$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.historyData = data || [];
      setTimeout(() => this.cdRef.detectChanges());
    });
  }
}



  // Basculer entre les modes
  switchMode(mode: 'user' | 'contrat' | 'locked') {
    this.mode = mode;
    this.loadHistory();
    this.safeTableClear();
  }

  // Filtrer par date
  filterByDate() {
    if (this.selectedDate) {
      setTimeout(() => {
        if (this.historyTable) {
          this.historyTable.filter(
            this.selectedDate,
            this.mode === 'user' ? 'timestamp' : 'date',
            'dateEquals'
          );
        }
      });
    } else {
      this.safeTableClear();
    }
  }

  // Supprimer les filtres
  clearHistoryFilter() {
    this.selectedDate = null;
    this.safeTableClear();
  }

  // Safe table clear method
  private safeTableClear() {
    if (this.tableInitialized && this.historyTable) {
      setTimeout(() => {
        if (this.historyTable) {
          this.historyTable.clear();
        }
      });
    }
  }

  // Calculer total actions utilisateur
  calculateActionTotal(username: string): number {
    return this.historyData.filter(h => h.username === username).length;
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