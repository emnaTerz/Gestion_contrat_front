import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';


export interface ExtensionDTO {
  titre: string;
  texte: string;
}
export interface clausiersDTO {
  nom: string;
  id: number;
}
export interface SousGarantie {
  id: number;
  nom: string;
  garantie: Garantie; 
  branche: Branche;
  garantieParent: Garantie;

  // Pour stocker les exclusions
  exclusionsOptions?: Exclusion[];
  filteredExclusionsOptions?: Exclusion[];
  exclusionsIds?: number[];
  nouvelleExclusion?: string;

  keyboardFilterExclusions?: string;
  lastKeyTimeExclusions?: number;
  filterTimeoutExclusions?: any;
}

export interface Garantie {
  id: number;
  libelle: string; // ou "nom" si tu préfères
}
export interface Exclusion {
  id: number;
  nom: string;
  branche: Branche;
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
  primeNET?: number;
  exclusions: ExclusionGarantieDTO[];
   garantieParentId?: number;
  garantieParentLibelle?: string;
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

export interface Contrat {
  numPolice: string;
  adherent?: { codeId: string };
  fractionnement: string;
  codeRenouvellement: string;
  branche: string;
  typeContrat: string;
  service: number;
  codeAgence: string;
  primeTTC: number;
  dateDebut: string;
  dateFin: string;
  status: string;
  clauseIds?: number[];
}

// Dans votre service/contrat.ts
export interface RcConfigurationDTO {
  id?: number;
  objetDeLaGarantie: string;
  limiteAnnuelleDomCorporels: number;
  limiteAnnuelleDomMateriels: number;
  limiteParSinistre: number;
  franchise: number;
  primeNET: number;
  exclusionsRcIds: number[];
  sectionIds?: number[]; // Rendre optionnel
  sectionIdentifications?: string[]; // Ajouter cette propriété
}
export interface ContratDTO {
  numPolice: string;
  adherent: AdherentDTO;
  fractionnement: Fractionnement;
  codeRenouvellement: CodeRenouvellement;
  branche: Branche;
  nom_assure: string ;
  codeAgence: string;
  typeContrat: TypeContrat;
  service: number;
  primeTTC?: number;
  dateDebut: string;
  dateFin: string;
  sections: SectionDTO[];
  startTime: string;
  preambule:string;
  rcConfigurations: RcConfigurationDTO[];
   extensions?: ExtensionDTO[]; 
   clauseIds?: number[];
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

export interface AdherentResponseDTO {
  codeId: string;
  nomRaison: string;
  adresse: string;
  activite: string;
  nouveau: boolean;
}

export interface ExclusionRCResponseDTO {
  id: number;
  nom: string;
}

export interface RCExploitationResponseDTO {
  limiteAnnuelleDomCorporels: number;
  limiteAnnuelleDomMateriels: number;
  limiteParSinistre: number;
  franchise: number;
  primeNET: number;

  objetDeLaGarantie: string;
  exclusionsRc: ExclusionRCResponseDTO[];
}

export interface GarantieResponseDTO {
  id: number;
  sectionId: number;
  sousGarantieId: number;
  franchise: number;
  maximum: number;
  minimum: number;
  capitale: number;
  primeNet: number;
  exclusions: { id: number; garantieSectionId: number; exclusionId: number }[];
   garantieParent?: {  // ✅ Nouveau champ
    id: number;
    libelle: string;
  };
}
export interface SectionResponseDTO {
  id: number;
  identification: string;
  adresse: string;
  natureConstruction: string;
  contiguite: string;
  avoisinage: string;
  numPolice: string;
  garanties: GarantieResponseDTO[];
  rcExploitationActive: boolean;
  rcExploitation: RCExploitationResponseDTO;
}

export interface ContratResponseDTO {
  numPolice: string;
  adherent: AdherentResponseDTO;
  fractionnement: string;
  codeRenouvellement: string;
  branche: string;
  typeContrat: string;
  preambule: string;
  primeTTC: number;
  service: number;
  dateDebut: string;
  dateFin: string;
  editingUser: string;
  editingStart: string;
  sections: SectionResponseDTO[];
  codeAgence: string;
  nom_assure: string;
  rcConfigurations: RcConfigurationDTO[];
  extensions?: ExtensionDTO[];
  clauseIds?: number[];

}
export interface Tarif {
  id: number;
  branche: Branche;
  fq: number;
  feFg: number;
  prixAdhesion: number;
  taux: number;
}


@Injectable({
  providedIn: 'root'
})
export class ContratService {

private readonly BASE_URL = 'https://localhost:8082/contrat';
private readonly CATALOGUE_URL = `${this.BASE_URL}/catalogue`;
private readonly EXTRACT_API_URL = 'https://localhost:5000/extract';

// URLs spécifiques
private readonly garantieApiUrl = `${this.CATALOGUE_URL}/garantie`;
private readonly sousGarantieApiUrl = `${this.CATALOGUE_URL}/sous-garantie`;
private readonly exclusionApiUrl = `${this.CATALOGUE_URL}/exclusion`;
private readonly tarifApiUrl = `${this.BASE_URL}/tarifs`;
private readonly CLAUSIER_URL = `${this.CATALOGUE_URL}/clausier`;
constructor(private http: HttpClient) { }
createClausierWithPdf(file: File, nom: string): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Convertir le fichier en base64 et retourner un Observable
  return new Observable(observer => {
    this.convertFileToBase64(file).then(base64Content => {
      const clausierData = {
        nom: nom, // Utiliser le nom saisi par l'utilisateur
        file: base64Content
      };

      this.http.post(this.CLAUSIER_URL, clausierData, { headers }).subscribe({
        next: (response) => {
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    }).catch(error => {
      observer.error(error);
    });
  });
}

// Méthode pour convertir un fichier en base64
private convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

  deleteClausier(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete<void>(`${this.CLAUSIER_URL}/${id}`, { headers });
  }

  getAllClausiers(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<any[]>(this.CLAUSIER_URL, { headers });
  }
// Méthodes pour le statut du contrat
toggleContratStatus(numPolice: string): Observable<any> {
  return this.http.patch(`${this.BASE_URL}/${numPolice}/status`, {});
}

getContratStatus(numPolice: string) {
  return this.http.get(`${this.BASE_URL}/${numPolice}/status`, { responseType: 'text' });
}
private getHeaders(): HttpHeaders {
  const token = localStorage.getItem('token');
  return new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
}

// Méthodes pour les sous-garanties

getSousGarantiesbybranche(garantieId: number, branche: string): Observable<SousGarantie[]> {
  const params = new HttpParams().set('branche', branche);

  return this.http.get<SousGarantie[]>(
    `${this.sousGarantieApiUrl}-branche/${garantieId}`,
    { params, headers: this.getHeaders() }
  );
}
deleteSousGarantie(id: number): Observable<void> {
  return this.http.delete<void>(
    `${this.sousGarantieApiUrl}/${id}`,
    { headers: this.getHeaders() }
  );
}
getallSousGaranties(): Observable<SousGarantie[]> {
  return this.http.get<SousGarantie[]>(
    this.sousGarantieApiUrl,
    { headers: this.getHeaders() }
  );
}
getSousGaranties(branche: string): Observable<SousGarantie[]> {
  const url = `${this.sousGarantieApiUrl}/by-and-branche/${branche}`;

  return this.http.get<SousGarantie[]>(
    url,
    { headers: this.getHeaders() }
  );
}
createSousGarantie(sousGarantie: SousGarantie): Observable<SousGarantie> {
  return this.http.post<SousGarantie>(
    this.sousGarantieApiUrl,
    sousGarantie,
    { headers: this.getHeaders() }
  ).pipe(
    catchError(err => {
      console.error('Erreur création sous-garantie', err);
      return throwError(() => err);
    })
  );
}


// Méthodes pour les garanties

deleteGarantie(id: number): Observable<void> {
  return this.http.delete<void>(
    `${this.garantieApiUrl}/${id}`,
    { headers: this.getHeaders() }
  );
}
createGarantie(garantie: Garantie): Observable<Garantie> {
  return this.http.post<Garantie>(
    this.garantieApiUrl,
    garantie,
    { headers: this.getHeaders() }
  );
}
getAllGaranties(): Observable<Garantie[]> {
  return this.http.get<Garantie[]>(
    this.garantieApiUrl,
    { headers: this.getHeaders() }
  );
}
getGaranties(): Observable<Garantie[]> {
  return this.http.get<Garantie[]>(
    this.garantieApiUrl,
    { headers: this.getHeaders() }
  ).pipe(
    catchError(err => {
      console.error('Erreur récupération garanties', err);
      return throwError(() => err);
    })
  );
}


// Méthodes pour les exclusions
createExclusion(exclusion: any): Observable<Exclusion> {
  return this.http.post<Exclusion>(
    `${this.exclusionApiUrl}`,
    exclusion,
    { headers: this.getHeaders() }
  );
}

deleteExclusion(id: number): Observable<void> {
  return this.http.delete<void>(
    `${this.exclusionApiUrl}/${id}`,
    { headers: this.getHeaders() }
  );
}

createExclusionRC(request: any): Observable<ExclusionRCResponseDTO> {
  return this.http.post<Exclusion>(`${this.exclusionApiUrl}-rc`, request);
}

getExclusionsByGarantie(garantieId: number): Observable<Exclusion[]> {
  return this.http.get<Exclusion[]>(`${this.exclusionApiUrl}/garantie/${garantieId}`);
}

getExclusionsRC(): Observable<Exclusion[]> {
  return this.http.get<Exclusion[]>(`${this.exclusionApiUrl}-rc`);
}

getExclusionrc(id: number): Observable<string> {
  return this.http.get(`${this.exclusionApiUrl}-rc/${id}`, { responseType: 'text' });
}

getExclusionById(id: number): Observable<Exclusion> {
  return this.http.get<Exclusion>(`${this.exclusionApiUrl}/${id}`);
}

getExclusion(): Observable<Exclusion> {
  return this.http.get<Exclusion>(this.exclusionApiUrl);
}
// Dans votre ContratService

// Méthode pour récupérer les exclusions par branche et garantie
getExclusionsByBrancheAndGarantie(branche: Branche, garantieId: number): Observable<Exclusion[]> {
  return this.http.get<Exclusion[]>(
    `${this.exclusionApiUrl}/branche/${branche}/garantie/${garantieId}`
  ).pipe(
    catchError(err => {
      console.error('Erreur récupération exclusions par branche et garantie', err);
      return throwError(() => err);
    })
  );
}
// Méthodes pour les contrats
getAllContrat(): Observable<Contrat[]> {
  const token = localStorage.getItem('token');
  const headers = { 
    'Authorization': `Bearer ${token}` 
  };
  return this.http.get<Contrat[]>(`${this.BASE_URL}/all`, { headers });
}

createContrat(contrat: ContratDTO) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.post(`${this.BASE_URL}/creer`, contrat, { headers });
}

checkContratExists(numPolice: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.BASE_URL}/exists/${numPolice}`);
}

getHistoriqueContrat(): Observable<any[]> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.get<any[]>(`${this.BASE_URL}/historique`, { headers })
    .pipe(
      catchError(err => {
        console.error('Erreur récupération historique contrat', err);
        return throwError(() => err);
      })
    );
}

getContrat(numPolice: string): Observable<ContratResponseDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  
  return this.http.get<ContratResponseDTO>(`${this.BASE_URL}/${numPolice}`, { headers })
    .pipe(
      catchError(err => {
        console.error('Erreur récupération contrat', err);
        return throwError(() => err);
      })
    );
}

downloadContratPdf(numPolice: string): Observable<Blob> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  
  return this.http.get(`${this.BASE_URL}/${numPolice}/pdf`, {
    headers: headers,
    responseType: 'blob'
  }).pipe(
    catchError(err => {
      console.error('Erreur téléchargement PDF', err);
      return throwError(() => err);
    })
  );
}

lockContrat(numPolice: string): Observable<ContratDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.post<ContratDTO>(`${this.BASE_URL}/lock/${numPolice}`, {}, { headers });
}

checkLockStatus(numPolice: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.BASE_URL}/${numPolice}/lock-status`);
}

unlockContrat(numPolice: string, cancelled: boolean, startTime: string): Observable<string> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

  const params = { cancelled: cancelled.toString(), startTime };

  return this.http.post(`${this.BASE_URL}/unlock/${numPolice}`, null, { 
    headers, 
    params,
    responseType: 'text'
  });
}

modifierContrat(contrat: ContratDTO): Observable<ContratDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.put<ContratDTO>(`${this.BASE_URL}/modifier`, contrat, { headers })
    .pipe(
      catchError(err => {
        console.error('Erreur modification contrat', err);
        return throwError(() => err);
      })
    );
}

getLockedContrats(): Observable<ContratVerrouille[]> {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  return this.http.get<ContratVerrouille[]>(`${this.BASE_URL}/locked`, { headers });
}

// Méthodes pour les tarifs
getTarifByBranche(branche: Branche): Observable<Tarif> {
  console.log('💡 Branche envoyée à l\'API:', branche);
  return this.http.get<Tarif>(`${this.tarifApiUrl}/${branche}`).pipe(
    catchError(err => {
      console.error('Erreur récupération tarif', err);
      return throwError(() => err);
    })
  );
}

updateTarif(id: number, tarif: Tarif): Observable<Tarif> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  return this.http.put<Tarif>(`${this.tarifApiUrl}/${id}`, tarif, { headers }).pipe(
    catchError(err => {
      console.error('Erreur mise à jour tarif', err);
      return throwError(() => err);
    })
  );
}

// Méthode pour uploader PDF (utilise l'URL d'extraction séparée)
uploadPdf(file: File): Observable<{ lines: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<{ lines: string[] }>(this.EXTRACT_API_URL, formData);
}}