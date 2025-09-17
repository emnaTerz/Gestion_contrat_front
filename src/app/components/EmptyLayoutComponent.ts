import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '@/components/topbar/topbar.component'; // ton topbar perso

@Component({
  selector: 'app-empty-layout',
  standalone: true,
  imports: [RouterModule, CommonModule, TopbarComponent],
  template: `
    <app-topbar></app-topbar>
    <router-outlet></router-outlet>
  `
})
export class EmptyLayoutComponent {}
