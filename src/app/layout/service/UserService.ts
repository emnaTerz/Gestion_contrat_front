
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password?: string;
}
export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
}
export interface UserActionHistory {
  id?: number;
  username: string;
  action: string;
  endpoint: string;
  method: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api'; // Assure-toi que le path correspond

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
}
