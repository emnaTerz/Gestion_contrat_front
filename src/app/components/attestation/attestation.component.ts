import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
    (pdfMake as any).vfs = (pdfMake as any).vfs || (pdfFonts as any).vfs;

// Initialisation des polices virtuelles
interface SituationRisque {
  descriptif: string;
  lieu: string;
}

interface Attestation {
  numAdherent:string,
  numPolice:string,
  nomAdherent: string;
  debutEffet: string;
  finEffet: string;
  typeContrat: string;
   branche: string;
  situations: SituationRisque[];
}
@Component({
  selector: 'app-attestation',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, DialogModule],  // <-- ajouter FormsModule
  templateUrl: './attestation.component.html',
  styleUrl: './attestation.component.scss'
})
export class AttestationComponent {
 attestation: Attestation = {
  numAdherent:'',
    numPolice: '',
    nomAdherent: '',
    debutEffet: '',
    finEffet: '',
     branche: '', 
    typeContrat: 'renouvelable',
    situations: []
  };
branchOptions = [
  { label: 'MRP', value: 'M' },
  { label: 'Incendie', value: 'I' }
];
  addSituation() {
    this.attestation.situations.push({ descriptif: '', lieu: '' });
  }

  removeSituation(index: number) {
    this.attestation.situations.splice(index, 1);
  }

  onSubmit() {
    this.generatePDFs();
  }
generatePDFs() {
  const vertMAE = '#028844';
  const body: any[] = [];

  const branche = this.attestation.branche;

  // Texte selon branche
  const texteCouverture =
    branche === 'I'
      ? "un contrat d'assurance Incendie en couverture "
      : "un contrat d'assurance Multirisque professionnelle en couverture ";

  // Numéro de contrat selon branche
  const numeroContrat =
    branche === 'I'
      ? `${this.attestation.numAdherent}/300/${this.attestation.numPolice}`
      : `${this.attestation.numAdherent}/280/${this.attestation.numPolice}`;

  this.attestation.situations.forEach((situation, index) => {
    if (index > 0) {
      body.push({ text: '', pageBreak: 'before' });
    }

    // --- 1. Titre ---
    body.push({
      text: 'ATTESTATION',
      fontSize: 36,
      bold: true,
      color: vertMAE,
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });

    // --- 2. Sous-titre : dates ---
    body.push({
      text: [
        { text: 'Valable Du ', color: vertMAE },
        { text: this.formatDate(this.attestation.debutEffet), bold: true, color: vertMAE },
        { text: ' au ', color: vertMAE },
        { text: this.formatDate(this.attestation.finEffet), bold: true, color: vertMAE },
      ],
      fontSize: 11,
      alignment: 'center',
      margin: [0, 0, 0, 20],
    });

    // --- 3. Corps du texte ---
    const typeContratText =
      this.attestation.typeContrat === 'renouvelable'
        ? "d'une Année Renouvelable avec Tacite Reconduction"
        : "Ferme";

    // Paragraphe 1
    body.push({
      text: [
        { text: "Nous soussignés " },
        { text: "Mutuelle Assurance de l'Enseignement M.A.E", bold: true },
        { text: " et dont le siège social est à " },
        { text: "Complexe EL MECHTEL AVENUE OULED HAFFOUZ, TUNIS 1075", bold: true },
        { text: ", attestons par la présente que " },
        { text: this.attestation.nomAdherent, bold: true },
        { text: ` a souscrit auprès de notre Mutuelle ${texteCouverture}` },
        { text: situation.descriptif, bold: true },
        { text: ' sis à ' },
        { text: situation.lieu, bold: true },
        { text: '.' },
      ],
      fontSize: 12,
      margin: [20, 10, 0, 10],
      lineHeight: 1.6,
      alignment: 'justify',
    });

    // Paragraphe 2
    body.push({
      text: [
        { text: '     Le dit contrat portant le N° : ' },
        { text: numeroContrat, bold: true },
        { text: ' prend effet à partir du ' },
        { text: this.formatDate(this.attestation.debutEffet), bold: true },
        { text: ` pour une période ${typeContratText}`, bold: true },
        { text: '.' },
      ],
      fontSize: 12,
      margin: [20, 10, 0, 10],
      lineHeight: 1.6,
      alignment: 'justify',
    });

    // Paragraphe 3
    body.push({
      text: '    Cette attestation est délivrée pour servir et valoir ce que de droit.',
      fontSize: 12,
      bold: true,
      margin: [20, 10, 0, 15],
      lineHeight: 1.6,
      alignment: 'justify',
    });

    // --- 4. Signature ---
    body.push({
      text: 'POUR LA MAE ASSURANCES',
      fontSize: 12,
      bold: true,
      alignment: 'right',
      margin: [0, 30, 0, 0],
    });
  });

  const docDefinition: any = {
    content: body,
    defaultStyle: { font: 'Roboto' },
    pageMargins: [40, 113, 40, 40],
  };

  const fileName = `attestations_${this.attestation.numPolice}.pdf`;
  (pdfMake as any).createPdf(docDefinition).download(fileName);
}

// Méthode pour formater une date
formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('fr-FR');
}
}