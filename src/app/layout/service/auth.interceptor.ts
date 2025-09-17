import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    console.log('Auth Interceptor - Token:', token);
    console.log('Auth Interceptor - Original request:', req.url);

    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    console.log('Auth Interceptor - Modified request:', authReq);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Auth Interceptor - Error:', error);
        
        if (error.status === 401 || error.status === 403) {
          console.log('Auth Interceptor - Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
}