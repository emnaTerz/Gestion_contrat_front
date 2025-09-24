import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface SousGarantie {
  id: number;
  nom: string;
}
export interface Exclusion {
  id: number;
  nom: string;
}
export interface AdherentDTO {
  codeId: string;
  nomRaison: string;
  adresse: string;
  activite: string;
  nouveau: boolean;
}

export interface ExclusionGarantieDTO {
  exclusionId: number;
  
}

export interface GarantieSectionDTO {
  sectionId?: number;
  franchise: number;
  sousGarantieId: number;
  maximum?: number;
  minimum?: number;
  capitale?: number;
  primeNet?: number;
  exclusions: ExclusionGarantieDTO[];
}

export interface SectionDTO {
  identification: string;
  adresse: string;
  natureConstruction: string;
  contiguite: string;
  avoisinage: string;
  numPolice: string;
  garanties: GarantieSectionDTO[];
}

export interface ContratDTO {
  numPolice: string;
  adherent: AdherentDTO;
  fractionnement: Fractionnement;
  codeRenouvellement: CodeRenouvellement;
  branche: Branche;
  nom_assure: string ;
  codeAgence: string
  typeContrat: TypeContrat;
  primeTTC?: number;
  dateDebut: string;
  dateFin: string;
  sections: SectionDTO[];
  startTime: string;
}
export enum Fractionnement {
  ZERO = 'ZERO',
  UN = 'UN',
  DEUX = 'DEUX'
}

export enum CodeRenouvellement {
  T = 'T',
  R = 'R'
}

export enum Branche {
  M = 'M',
  R = 'R',
  I = 'I'
}

export interface ContratVerrouille {
  numPolice: string;
  editingUser: string;
  editingStart: string;
}


export enum TypeContrat {
  APPEL_D_OFFRE = 'APPEL_D_OFFRE',
  AUTRE = 'AUTRE'
}
@Injectable({
  providedIn: 'root'
})
export class ContratService {

  private extractApiUrl = 'http://localhost:5000/extract'; // ton API Flask
  private sousGarantieApiUrl = 'http://localhost:8081/contrat/catalogue/sous-garantie'; // ton API sous-garanties
  private exclusionApiUrl = 'http://localhost:8081/contrat/catalogue/exclusion/garantie'; // API exclusions
private baseUrl = 'http://localhost:8081/contrat';
  constructor(private http: HttpClient) { }

  // Méthode existante pour uploader PDF
  uploadPdf(file: File): Observable<{ lines: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ lines: string[] }>(this.extractApiUrl, formData);
  }

  // Méthode pour récupérer toutes les sous-garanties
  getSousGaranties(): Observable<SousGarantie[]> {
    return this.http.get<SousGarantie[]>(this.sousGarantieApiUrl);
  }

  // Nouvelle méthode pour récupérer les exclusions d'une garantie spécifique
  getExclusionsByGarantie(garantieId: number): Observable<Exclusion[]> {
    return this.http.get<Exclusion[]>(`${this.exclusionApiUrl}/${garantieId}`);
  }
createContrat(contrat: ContratDTO) {
const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.post('http://localhost:8081/contrat/creer', contrat, { headers });
}
checkContratExists(numPolice: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists/${numPolice}`);
  }
  getHistoriqueContrat(): Observable<any[]> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.get<any[]>(`${this.baseUrl}/historique`, { headers })
    .pipe(
      catchError(err => {
        console.error('Erreur récupération historique contrat', err);
        return throwError(() => err);
      })
    );
}
getContrat(numPolice: string): Observable<ContratDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.get<ContratDTO>(`${this.baseUrl}/${numPolice}`, { headers })
    .pipe(
      catchError(err => {
        console.error('Erreur récupération contrat', err);
        return throwError(() => err);
      })
    );
}
lockContrat(numPolice: string): Observable<ContratDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.post<ContratDTO>(`${this.baseUrl}/lock/${numPolice}`, {}, { headers });
}


unlockContrat(numPolice: string, cancelled: boolean, startTime: string): Observable<string> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

  const params = { cancelled: cancelled.toString(), startTime };

  return this.http.post(`${this.baseUrl}/unlock/${numPolice}`, null, { 
    headers, 
    params,
    responseType: 'text' // 👈 important pour que Angular accepte le texte
  });
}



modifierContrat(contrat: ContratDTO): Observable<ContratDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.put<ContratDTO>(`${this.baseUrl}/modifier`, contrat, { headers })
    .pipe(
      catchError(err => {
        console.error('Erreur modification contrat', err);
        return throwError(() => err);
      })
    );
}
getLockedContrats(): Observable<ContratVerrouille[]> {
  const token = localStorage.getItem('token'); // récupérer le JWT du localStorage
  const headers = { Authorization: `Bearer ${token}` };

  return this.http.get<ContratVerrouille[]>(`${this.baseUrl}/locked`, { headers });
}

}
