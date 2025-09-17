import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { LoginComponent } from '@/components/login/login.component';
import { CreateContratComponent } from '@/components/create-contrat/create-contrat.component';
import { UsersComponent } from '@/components/users/users.component';
import { ActionHistoryComponent } from '@/components/action-history/action-history.component';
import { AuthGuard } from '@/layout/service/AuthGuard';
import { EmptyLayoutComponent } from '@/components/EmptyLayoutComponent';

/* export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'login', component: LoginComponent },
    { path: 'CreateContrat', component: CreateContratComponent },
    { path: 'users', component: UsersComponent },
    { path: 'action-history', component: ActionHistoryComponent },

    { path: '**', redirectTo: '/notfound' }
]; */
export const appRoutes: Routes = [
    // Pages publiques
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'login', component: LoginComponent },

    // Pages Admin/User avec EmptyLayout (pas de menu Sakai)
    {
        path: '',
        component: EmptyLayoutComponent,
        children: [
            { path: 'action-history', component: ActionHistoryComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'users', component: UsersComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'CreateContrat', component: CreateContratComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } }
        ]
    },

    // Pages normales avec AppLayout (menu + topbar Sakai)
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [AuthGuard] },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes'), canActivate: [AuthGuard] },
            { path: 'documentation', component: Documentation, canActivate: [AuthGuard] },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes'), canActivate: [AuthGuard] },
        ]
    },

    { path: '**', redirectTo: '/notfound' }
];
