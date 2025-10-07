import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() {
    (pdfMake as any).vfs = (pdfFonts as any).vfs;
  }

  generateContratPDF(data: any): Promise<Blob> {
    const docDefinition: any = {   // ⚠️ Ici on met any pour bypass les erreurs TS
      content: [
        { text: 'Modèle de Contrat', style: 'header' },
        { text: '\nInformations Générales', style: 'subheader' },
        { text: `Code Adhérent : ${data.codeAdherent || '-'}` },
        { text: `Nom / Raison sociale : ${data.nomRaison || '-'}` },
        { text: `Adresse : ${data.adresse || '-'}` },
        { text: `Activité : ${data.activite || '-'}` },
        { text: `Branche : ${data.branche || '-'}` },
        { text: `Numéro de police : ${data.numPolice || '-'}` },
        { text: `Assureur : ${data.nom_assure || '-'}` },
        { text: `Code agence : ${data.codeAgence || '-'}` },
        { text: `Fractionnement : ${data.fractionnement || '-'}` },
        { text: `Code renouvellement : ${data.codeRenouvellement || '-'}` },
        { text: `Type de contrat : ${data.typeContrat || '-'}` },
        { text: `Date de début : ${data.dateDebut || '-'}` },
        { text: `Date de fin : ${data.dateFin || '-'}` },
        { text: '\n\nSignature de l\'assuré : ____________________', margin: [0, 40, 0, 0] }
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: 'center', color: '#0277bd', margin: [0,0,0,10] },
        subheader: { fontSize: 16, bold: true, color: '#0288d1', margin: [0,10,0,10] }
      }
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition as TDocumentDefinitions);
        pdfDocGenerator.getBlob((blob: Blob) => resolve(blob));
      } catch (error) {
        reject(error);
      }
    });
  }
}
