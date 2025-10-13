import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';


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

interface SousGarantieWithDetails {
  id: number;
  nom: string;
  garantie: {
    id: number;
    libelle: string;
  };
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

  private extractApiUrl = 'http://localhost:5000/extract'; // ton API Flask
  private sousGarantieApiUrl = 'http://localhost:8081/contrat/catalogue/sous-garantie'; // ton API sous-garanties
  private GarantieApiUrl = 'http://localhost:8081/contrat/catalogue/garantie'; // ton API sous-garanties

  private exclusionApiUrl = 'http://localhost:8081/contrat/catalogue/exclusion/garantie'; // API exclusions
private baseUrl = 'http://localhost:8081/contrat';
  private tarifApiUrl = 'http://localhost:8081/contrat/tarifs';
  constructor(private http: HttpClient) { }

toggleContratStatus(numPolice: string): Observable<any> {
  return this.http.patch(`http://localhost:8081/contrat/${numPolice}/status`, {});
}

getContratStatus(numPolice: string) {
  // responseType: 'text' dit à HttpClient de traiter la réponse comme simple texte
  return this.http.get(`http://localhost:8081/contrat/${numPolice}/status`, { responseType: 'text' });
}

   deleteSousGarantie(id: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:8081/contrat/catalogue/sous-garantie/${id}`);
  }

getSousGarantiesbybranche(garantieId: number, branche: string): Observable<SousGarantie[]> {
  const params = new HttpParams().set('branche', branche);
  return this.http.get<SousGarantie[]>(
    `http://localhost:8081/contrat/catalogue/sous-garantie-branche/${garantieId}`, 
    { params }
  );
}

 deleteGarantie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.GarantieApiUrl}/${id}`);
  }
  createGarantie(garantie: Garantie): Observable<Garantie> {
    return this.http.post<Garantie>(`${this.GarantieApiUrl}`, garantie);
  }
getAllGaranties(): Observable<Garantie[]> {
    return this.http.get<Garantie[]>(`${this.GarantieApiUrl}`);
  }
  getAllContrat(): Observable<Contrat[]> {
  const token = localStorage.getItem('token'); // récupère le token stocké
  const headers = { 
    'Authorization': `Bearer ${token}` 
  };
  return this.http.get<Contrat[]>(`${this.baseUrl}/all`, { headers });
}

  // Méthode existante pour uploader PDF
  uploadPdf(file: File): Observable<{ lines: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ lines: string[] }>(this.extractApiUrl, formData);
  }
 getGaranties(): Observable<Garantie[]> {
    return this.http.get<Garantie[]>('http://localhost:8081/contrat/catalogue/garantie').pipe(
      catchError(err => {
        console.error('Erreur récupération garanties', err);
        return throwError(() => err);
      })
    );
  }
  // Méthode pour récupérer toutes les sous-garanties
  getallSousGaranties(): Observable<SousGarantie[]> {
    return this.http.get<SousGarantie[]>(this.sousGarantieApiUrl);
  }
  getSousGaranties(branche: string): Observable<SousGarantie[]> {
    const url = `${this.sousGarantieApiUrl}/by-and-branche/${branche}`;
    return this.http.get<SousGarantie[]>(url);
  }
createExclusion(exclusion: any): Observable<Exclusion> {
  return this.http.post<Exclusion>('http://localhost:8081/contrat/catalogue/exclusion', exclusion);
}

createExclusionRC(request: any): Observable<ExclusionRCResponseDTO> {
  return this.http.post<Exclusion>('http://localhost:8081/contrat/catalogue/exclusion-rc', request);
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
getContrat(numPolice: string): Observable<ContratResponseDTO> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  
  return this.http.get<ContratResponseDTO>(`${this.baseUrl}/${numPolice}`, { headers })
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
    
    return this.http.get(`http://localhost:8081/contrat/${numPolice}/pdf`, {
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
  return this.http.post<ContratDTO>(`${this.baseUrl}/lock/${numPolice}`, {}, { headers });
}
// Dans votre ContratService
checkLockStatus(numPolice: string): Observable<boolean> {
  return this.http.get<boolean>(`http://localhost:8081/contrat/${numPolice}/lock-status`);
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
// Ajouter cette méthode pour récupérer toutes les exclusions RC
getExclusionsRC(): Observable<Exclusion[]> {
  return this.http.get<Exclusion[]>(`http://localhost:8081/contrat/catalogue/exclusion-rc`);
}

  getTarifByBranche(branche: Branche): Observable<Tarif> {

  console.log('💡 Branche envoyée à l’API:', branche);



    return this.http.get<Tarif>(`${this.tarifApiUrl}/${branche}`).pipe(
      catchError(err => {
        console.error('Erreur récupération tarif', err);
        return throwError(() => err);
      })
    );
  }

  // 🔹 Mettre à jour un tarif par ID
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

getExclusionrc(id: number): Observable<string> {
  const url = `http://localhost:8081/contrat/catalogue/exclusion-rc`;
  return this.http.get(`${url}/${id}`, { responseType: 'text' });
}

 getExclusionById(id: number): Observable<Exclusion> {
  const url = `http://localhost:8081/contrat/catalogue/exclusion`;

  return this.http.get<Exclusion>(`${url}/${id}`);
}
 getExclusion(): Observable<Exclusion> {
  const url = `http://localhost:8081/contrat/catalogue/exclusion`;

  return this.http.get<Exclusion>(`${url}`);
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
