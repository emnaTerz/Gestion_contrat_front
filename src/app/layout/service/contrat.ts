import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // service disponible pour tout le projet
})
export class ContratService {

  private apiUrl = 'http://localhost:5000/extract'; // URL de ton API Flask

  constructor(private http: HttpClient) { }

  uploadPdf(file: File): Observable<{ lines: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ lines: string[] }>(this.apiUrl, formData);
  }
}
