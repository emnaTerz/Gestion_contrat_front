import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ContratService } from '@/layout/service/contrat';
    (pdfMake as any).vfs = (pdfMake as any).vfs || (pdfFonts as any).vfs;
@Component({
  selector: 'app-attestation-q',
  standalone: true,
  imports: [FormsModule, CommonModule,ButtonModule ],
  templateUrl: './attestation-q.component.html',
  styleUrl: './attestation-q.component.scss'
})

export class AttestationQComponent {
attestation = {
  nomAssure: '',
  dateDebut: '',
  dateFin: '',
  nomAssureSimple: '',
  typeAssurance: '',
  numPolice: '',
  typeContrat: '',
  numadher: "",
  adresseAssure:"",
  nattrav:""
};
  startTime: string = '';
 ngOnInit(): void {
   const now = new Date(); // date locale
this.startTime = now.getFullYear() + '-' +
  String(now.getMonth()+1).padStart(2,'0') + '-' +
  String(now.getDate()).padStart(2,'0') + 'T' +
  String(now.getHours()).padStart(2,'0') + ':' +
  String(now.getMinutes()).padStart(2,'0') + ':' +
  String(now.getSeconds()).padStart(2,'0');}

constructor(private contratService: ContratService){}

onSubmit() {

  this.generatePDFs();


  const action = `Ajout_Attestation_${this.attestation.typeAssurance}`;


  this.contratService.enregistrerHistorique({
    action,
    startDate :this.startTime
  }).subscribe({
    next: () => console.log('✅ Historique enregistré'),
    error: err => console.error('❌ Erreur historique', err)
  });
}

generatePDFs() {
  const vertMAE = '#028844';

  const body: any[] = [];

  // --- Titre principal ---
  body.push({
    text: 'ATTESTATION',
    fontSize: 36,
    bold: true,
    color: vertMAE,
    alignment: 'center',
    margin: [0, 0, 0, 10],
  });

  // --- Sous-titre ASSURANCE XXX ---
  body.push({
    text: `ASSURANCE ${this.attestation.typeAssurance.toUpperCase()}`,
    fontSize: 18,
    bold: true,
    color: vertMAE,
    alignment: 'center',
    margin: [0, 0, 0, 15],
  });

  // --- Dates ---
  body.push({
    text: [
      { text: 'Valable du ', color: vertMAE },
      { text: this.formatDate(this.attestation.dateDebut), bold: true, color: vertMAE },
      { text: ' au ', color: vertMAE },
      { text: this.formatDate(this.attestation.dateFin), bold: true, color: vertMAE },
    ],
    fontSize: 12,
    alignment: 'center',
    margin: [0, 0, 0, 20],
  });

 
const textePrincipal: any[] = [
  "Nous soussignés ",
  { text: "Mutuelle Assurance de l’Enseignement M.A.E", bold: true },
  ", dont le siège social est à ",
  { text: "Complexe EL MECHTEL AVENUE OULED HAFFOUZ, TUNIS 1075", bold: true },
  ", attestons par la présente que ",
  { text: this.attestation.nomAssure, bold: true },
];

// Ajouter l'adresse si typeAssurance = "Tous Risques Informatiques"
if (this.attestation.typeAssurance === 'Tous Risques Informatiques' || this.attestation.typeAssurance === 'Tous Risques Electroniques' && this.attestation.adresseAssure ) {
  textePrincipal.push("sis à ");
  textePrincipal.push({ text: this.attestation.adresseAssure, bold: true });
}

// Continuer le texte normal
textePrincipal.push(" a souscrit auprès de notre Mutuelle un contrat D’ASSURANCE ");
textePrincipal.push({ text: this.attestation.typeAssurance.toUpperCase(), bold: true });

// Cas RC Décennale
if (
  this.attestation.typeAssurance === 'RC Decennale' ||
  this.attestation.typeAssurance === 'Tous Risques chantier'
)
{  textePrincipal.push(
    " en couverture des travaux "
  );
  textePrincipal.push(
    { text: this.attestation.nattrav, bold: true }
  );
  textePrincipal.push(
    " sis à "
  );
  textePrincipal.push(
    { text: this.attestation.adresseAssure, bold: true }
  );
}
// Cas Tous Risques Informatiques → rien à ajouter
else if (this.attestation.typeAssurance === 'Tous Risques Informatiques' ||
  this.attestation.typeAssurance === 'Tous Risques Electroniques') {
  // volontairement vide
}
// Autres assurances
else {
  textePrincipal.push(
    " en couverture du matériel mentionné dans les Conditions Particulières."
  );
}


// Pousser dans le body
body.push({
  text: textePrincipal,
  fontSize: 12,
  margin: [20, 10, 20, 10],
  alignment: 'justify',
  lineHeight: 1.6,
});
 const typeContratText =
  this.attestation.typeContrat === "d'une année renouvelable par tacite reconduction"
    ? "d'une année renouvelable par tacite reconduction"
    : `ferme et expire de plein droit et sans préavis le ${this.formatDate(this.attestation.dateFin)}`;
let X: number;

if (this.attestation.typeAssurance === 'Engin de chantier') {
  X = 268;
} else if (this.attestation.typeAssurance === 'Tous Risques Informatiques') {
  X = 263; 
  } else if (this.attestation.typeAssurance === 'Bris de machines') {
  X = 260; 
   } else if (this.attestation.typeAssurance === 'RC Decennale') {
  X = 231; 
  } else if (this.attestation.typeAssurance === 'Tous Risques chantier') {
  X = 261; 
} else  (this.attestation.typeAssurance === 'Tous Risques Electroniques') ;{
  X = 267; 
}

body.push({
  text: [
    "Ledit contrat portant le N° : ",
    { text: `${this.attestation.numadher}/${X}/${this.attestation.numPolice}`, bold: true },
    " prend effet à partir du ",
    { text: this.formatDate(this.attestation.dateDebut), bold: true },
    " pour une période ",
    { text: typeContratText, bold: true },
    ".",
  ],
  fontSize: 12,
  margin: [20, 10, 20, 10],
  alignment: 'justify',
  lineHeight: 1.6,
});
  // --- Paragraphe final ---
  body.push({
    text: "Cette attestation est délivrée pour servir et valoir qui est de droit.",
    fontSize: 12,
    bold: true,
    margin: [20, 10, 20, 20],
    alignment: 'justify',
  });


body.push({
  columns: [
    {
      width: '*',
      text: 'P/ LA MUTUELLE',
      bold: true,
      alignment: 'left' // à gauche
    },
    {
      width: '*',
      text: 'Fait le ' + this.formatDate(new Date().toString()),
      bold: true,
      alignment: 'right' // à droite
    }
  ],
  margin: [0, 20, 0, 0]
});


  // ===============================
  // 🔵 Génération PDF
  // ===============================

  const docDefinition = {
    content: body,
    defaultStyle: { font: 'Roboto' },
    pageMargins: [40, 113, 40, 40],
  };

  const fileName = `attestation_${this.attestation.numPolice}.pdf`;

  (pdfMake as any).createPdf(docDefinition).download(fileName);
}
formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fr-FR');
}
}
