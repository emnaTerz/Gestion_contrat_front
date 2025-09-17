import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  token: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

 signin(request: SigninRequest): Observable<SigninResponse> {
  return this.http.post<SigninResponse>(`${this.apiUrl}/signin`, request).pipe(
    tap(response => {
      localStorage.setItem('token', response.token);
      localStorage.setItem('userRole', response.role);
    })
  );
}


  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('userRole');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  }
  
}
