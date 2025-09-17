import { Component, OnInit, ViewChild } from '@angular/core';
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
}