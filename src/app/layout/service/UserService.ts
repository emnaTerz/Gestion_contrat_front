
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  codeAgence?: string;
  password?: string;
  branches?: string[];   // 🔥 ajouté
}

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  branches?: string[];   // 🔥 ajouté
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  codeAgence: string;
  password: string;
  branches: string[];    // 🔥 ajouté (obligatoire car signup doit l’envoyer)
}

export interface Agence {
  code: string;
  name: string;
  enumName: string;
}
export interface UserActionHistory {
  id?: number;
  username: string;
  action: string;
  endpoint: string;
  method: string;
  timestamp: string;
}

export interface ResetPasswordDTO {
  userId: number;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:8082/api'; // Assure-toi que le path correspond

  constructor(private http: HttpClient) {}

  // Récupérer tous les utilisateurs
  getAllUsers(): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<User[]>(this.apiUrl, { headers });
  }

  // Supprimer un utilisateur
  deleteUser(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  // Mettre à jour un utilisateur
  updateUser(id: number, user: User): Observable<User> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, { headers });
  }
   signup(request: SignUpRequest): Observable<any> {
    const token = localStorage.getItem('token'); // token existant pour valider l'API
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/signup`, request, { headers });
  }
getActionHistory(): Observable<UserActionHistory[]> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.get<UserActionHistory[]>(`${this.apiUrl}/action-history`, { headers });
}
resetPassword(dto: ResetPasswordDTO): Observable<string> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.put(`${this.apiUrl}/reset-password`, dto, { headers, responseType: 'text' });
}
 getCurrentUser(): Observable<CurrentUser> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Utilisateur non connecté');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<CurrentUser>(`${this.apiUrl}/me`, { headers });
  }

}
