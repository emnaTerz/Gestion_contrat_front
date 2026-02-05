import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

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
private apiUrl = 'https://172.0.23.12:8082/api';
 private jwtHelper = new JwtHelperService();
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
    const token = this.getToken();
    if (!token) return false;

    // ✅ Utilisation correcte sans require()
    return !this.jwtHelper.isTokenExpired(token);
  }

  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    console.log("exxxx",this.jwtHelper.getTokenExpirationDate(token));
    return this.jwtHelper.getTokenExpirationDate(token);
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  }
  
}
