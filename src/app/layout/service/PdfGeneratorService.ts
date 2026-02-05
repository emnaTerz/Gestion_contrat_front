import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { lastValueFrom } from 'rxjs';
import { ClauseGarantie, ContratService } from './contrat';
import pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  clausiers: any[] = []; // Ajoutez cette propriété

  constructor( private contratService: ContratService) {
    
    (pdfMake as any).vfs = (pdfMake as any).vfs || (pdfFonts as any).vfs;
  }
  async generateContratPDF(data: any): Promise<Blob> {

    const situationsRisque = this.prepareSituationsRisque(data.sections || []);
    const tableauxGaranties = this.prepareTableauxGaranties(data.sections || [], data);
    const sectionsRC = this.prepareSectionsRC(data.rcConfigurations || [], data);
    const sectionsExclusionsParSituation = this.prepareExclusionsParSituation(data);
    const sectionCotisationAnnuelle = await this.prepareCotisationAnnuelle(data);
   const sectionsAttestations = this.prepareAttestations(data);
// Montrez-moi 2 sections différentes avec quelques garanties
    const docDefinition: any = {
 pageMargins: [40, 100, 40, 90],
        header: function(currentPage: number, pageCount: number) {
        return {
          text: '',
          margin: [0, 16, 0, 0] // Espace réservé pour le header
        };
      },
    
      content: [
        {
          stack: [
            { text: '', margin: [0, 0, 0, 30] },
            
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: [
                        { text: `Annexe au ${data.nature} N° :${data.adherent.codeId || '-'}/${data.service|| '-'}/ ${data.numPolice || '-'}`, style: 'headerCenter' },
                        { text: 'CLAUSES ET CONDITIONS', style: 'headerCenter' }
                      ],
                      border: [true, true, true, true],
                      margin: [10, 10, 10, 10]
                    }
                  ]
                ]
              },
              layout: {
                defaultBorder: false
              },
              margin: [0, 0, 0, 30]
            },

            // Préambule
            { text: 'PRÉAMBULE', style: 'sectionTitle' },
            { text: `${data.preambule || '-'}`, style: 'paragraph' },
{
  columns: [
    // Colonne gauche : INFORMATIONS DE L'ASSURÉ
    {
      width: '48%',
      stack: [
        { text: 'INFORMATIONS DE L\'ASSURÉ', style: 'sectionTitles' },
        // Ligne de séparation fine
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 210, y2: 4, lineWidth: 0.5, lineColor: '#e0e0e0' }] },
        
        // Tableau des coordonnées
        {
          margin: [0, 10, 0, 0],
          layout: 'noBorders',
          table: {
            widths: [110, '*'], 
            body: [
              [{ text: 'Nom / Raison sociale :', style: 'label' }, { text: data.adherent.nomRaison || '-', style: 'valueBold' }],
              [{ text: 'Adresse :', style: 'label' }, { text: data.adherent.adresse || '-', style: 'valueBold' }],
              [{ text: 'Profession :', style: 'label' }, { text: data.adherent.activite || '-', style: 'valueBold' }],
            ]
          }
        },

        // AFFICHAGE CONDITIONNEL : Activité pro + Note
        ...(data.nom_assure ? [
          {
            margin: [0, 10, 0, 0],
            text: [
              { text: 'Activité professionnelle de l\'Assuré : ', style: 'label' },
              { text: data.nom_assure, style: 'valueBold' }
            ]
          },
          { 
            text: 'Aucune autre activité professionnelle n\'est couverte à moins d\'être expressément déclarée et acceptée par l\'Assureur',
            style: 'noteText',
            margin: [0, 8, 0, 0] // Marge réduite pour compacter
          }
        ] : [])
      ]
    },

    // Colonne droite : PÉRIODE D'ASSURANCE
    {
      width: '48%',
      stack: [
        { text: 'PÉRIODE D\'ASSURANCE', style: 'sectionTitles' },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 210, y2: 4, lineWidth: 0.5, lineColor: '#e0e0e0' }] },
        {
          margin: [0, 10, 0, 0],
          layout: 'noBorders',
          table: {
            widths: [10, 100, '*'], 
            body: [
              [
                { text: '•', style: 'bullet' }, 
                { text: 'Date d\'effet :', style: 'label' }, 
                { text: this.formatDate(data.dateDebut), style: 'valueBold' }
              ],
              [
                { text: '•', style: 'bullet' }, 
                { text: data.codeRenouvellement?.toUpperCase() === 'T' ? 'Prochaine échéance :' : 'Fin d\'effet :', style: 'label' }, 
               {
  text: data.codeRenouvellement?.toUpperCase() === 'T'
    ? this.addOneYear(data.dateDebut)
    : this.formatDate(data.dateFin),
  style: 'valueBold'
}],
              [
                { text: '•', style: 'bullet' }, 
                { text: 'Nature du contrat :', style: 'label' }, 
                { text: this.getNatureContrat(data.codeRenouvellement), style: 'valueBold' }
              ],
              [
                { text: '•', style: 'bullet' }, 
                { text: 'Fractionnement :', style: 'label' }, 
                { text: this.getFractionnement(data.fractionnement), style: 'valueBold' }
              ],
            ]
          }
        }
      ]
    }
  ],
  columnGap: 25,
  margin: [0, 0, 0, 5] // Marge du bas minimale pour coller à la section suivante
}
          ]
        },
...this.prepareExtensions(data),

        // Nouvelle page pour les situations de risque
        {
          stack: [
            { text: 'SITUATIONS DE RISQUE', style: 'sectionTitle',
             margin: [0, 0, 0, 10]
             },
            {
              table: {
                headerRows: 1,
                keepWithHeaderRows: 3,
                dontBreakRows: true,
                widths: ['*', '*', '*', '*', '*', '*'],
                body: [
                  // En-tête du tableau
                  [
                    { text: 'Situation Assuré', style: 'tableHeader' },
                    { text: 'Identification', style: 'tableHeader' },
                    { text: 'Adresse', style: 'tableHeader' },
                    { text: 'Nature construction', style: 'tableHeader' },
                    { text: 'Contiguïté', style: 'tableHeader' },
                    { text: 'Avoisinage', style: 'tableHeader' }
                  ],
                  // Données des situations
                  ...situationsRisque
                ]
              },
          layout: {
              hLineWidth: function (i: number, node: any) {
                return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
              },
              vLineWidth: function (i: number) {
                return 1;
              },
              hLineColor: function (i: number, node: any) {
                return (i === 0 || i === node.table.body.length) ? 'black' : '#e0e0e0';
              },
              vLineColor: function () {
                return 'black';
              },
              paddingLeft: function() { return 8; },
              paddingRight: function() { return 8; },
              // DIMINUTION ICI : passer de 10 à 3 ou 2
              paddingTop: function(i: number) { return i === 0 ? 4 : 2; },    // Réduit fortement la hauteur
              paddingBottom: function(i: number) { return i === 0 ? 4 : 2; },
              fillColor: function(rowIndex: number) {
                return (rowIndex === 0) ? '#f5f5f5' : null;
              }
            }
            }
          ],
         
        },

        // Nouvelle page pour les tableaux de garanties
        ...tableauxGaranties,

        // Exclusions par situation de risque
        ...sectionsExclusionsParSituation,

        // Nouvelle page pour les responsabilités civiles
        ...sectionsRC,

        // Section Cotisation Annuelle
        sectionCotisationAnnuelle,
        {
          stack: [
             { 
            text: `Annexe au ${data.nature} N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
            style: 'headerCenter',pageBreak: 'before'
          },
            { text: 'EXCLUSIONS COMMUNES', style: 'sectionTitle', margin: [0, 10, 0, 10] },
            
            // Texte introductif avant les puces
            {
              text: 'La M.A.E. n\'assure jamais les dommages :',
              bold: true,
              alignment: 'justify',
              lineHeight: 1.8,
              fontSize: 13,
              margin: [0, 0, 0, 5]
            },

            // Liste principale des exclusions en puces
            {
              ul: [
                'RÉSULTANT DE LA FAUTE INTENTIONNELLE OU DOLOSIVE DU SOCIÉTAIRE OU AVEC SA COMPLICITÉ',
                'PROVENANT DES CONSÉQUENCES DE LA GUERRE ÉTRANGÈRE, (IL APPARTIENT AU SOCIÉTAIRE DE PROUVER QUE LE SINISTRE RÉSULTE D\'UN FAIT AUTRE QUE LE FAIT DE GUERRE ÉTRANGÈRE).',
                'PROVENANT DES CONSÉQUENCES DE LA GUERRE CIVILE, ACTES DE TERRORISME OU DE SABOTAGE COMMIS DANS LE CADRE D\'ACTIONS CONCERTÉES DE TERRORISME OU DE SABOTAGE (IL APPARTIENT À L\'ASSUREUR DE PROUVER QUE LE SINISTRE RÉSULTE D\'UN DE CES FAITS).',
                'PROVENANT DES CONSÉQUENCES DES ÉMEUTES OU MOUVEMENTS POPULAIRES (IL APPARTIENT À L\'ASSUREUR DE PROUVER QUE LE SINISTRE RÉSULTE D\'UN DE CES FAITS).',
                'RÉSULTANT DE TREMBLEMENT DE TERRE, ÉRUPTION DE VOLCAN, INONDATION, RAZ-DE-MARÉE, OURAGANS, TEMPÊTES, CYCLONES OU AUTRES CATACLYSMES.',
                'DUS AUX GLISSEMENTS, AFFAISSEMENTS DE TERRAIN.',
                'DUS AUX EFFETS DIRECTS OU INDIRECTS D\'EXPLOSION, DE DÉGAGEMENT DE CHALEUR, D\'IRRADIATION PROVENANT DE TRANSMUTATION DU NOYAU D\'ATOMES OU DE LA RADIOACTIVITÉ, AINSI QUE LES DOMMAGES DUS AUX EFFETS DE RADIATION PROVOQUÉS PAR L\'ACCÉLÉRATION ARTIFICIELLE DES PARTICULES.'
              ].map(text => ({
                text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.8,
                style: 'paragraph',
                margin: [0, 0, 0, 5]
              })),
              margin: [10, 0, 0, 5],
              bulletRadius: 2
            },

            // Phrase spéciale hors puce
            {
              text: "AINSI QUE LES DOMMAGES AUTRES QUE CEUX D'INCENDIE CAUSÉS PAR :",
              bold: true,
              alignment: 'justify',
              lineHeight: 1.8,
              fontSize: 13,
              margin: [0, 5, 0, 5]
            },

            // Liste finale des deux exclusions en puces
            {
              ul: [
                "L'ÉBRANLEMENT RÉSULTANT DU FRANCHISSEMENT DU MUR DU SON PAR UN AÉRONEF.",
                "UNE EXPLOSION SE PRODUISANT DANS UNE FABRIQUE OU UN DÉPÔT D'EXPLOSIFS."
              ].map(text => ({
                text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.8,
                style: 'paragraph',
                margin: [0, 0, 0, 5]
              })),
              margin: [10, 0, 0, 15],
              bulletRadius: 2
            }
          ]
        }, ...sectionsAttestations,
      ],
      
      styles: {
    attestationTitle: {
    fontSize: 14,
    bold: true,
    alignment: 'center',
    margin: [0, 10, 0, 20],
    decoration: 'underline'
  },
  attestationText: {
    fontSize: 10,
    alignment: 'justify',
    lineHeight: 1.4,
    margin: [0, 5, 0, 5]
  },
        headerCenter: { 
          fontSize: 12, 
          bold: true, 
          alignment: 'center', 
          color: '#000000',
          lineHeight: 1.2
        },
        sectionTitle: { 
          fontSize: 11, 
          bold: true, 
          color: '#000000',
          margin: [0, 0, 0, 5],
          decoration: 'underline',
          lineHeight: 1.0
        },
          // ... vos styles existants
  
  garantieTableCellGrised: {
    fontSize: 8,
    color: '#999999', // Texte grisé
    alignment: 'right',
    fillColor: '#f8f8f8' // Fond gris clair
  },
  garantieTableCellGrisedCenter: {
    fontSize: 8,
    color: '#999999', // Texte grisé
    alignment: 'center',
    fillColor: '#f8f8f8' // Fond gris clair
  },

        paragraphBold: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
        paragraphCenterBold: {  fontSize: 8,
          color: '#000000',
          margin: [0, 5, 0, 10],
          lineHeight: 1.3,
          alignment: 'center',
          bold: true,
        },
        paragraphCenterBoldUnderline: { fontSize: 10, bold: true, alignment: 'center', decoration: 'underline', margin: [0, 5, 0, 5] },
        subSectionTitleCenter: { fontSize: 11, bold: true, alignment: 'center', margin: [0, 2, 0, 5] },
        subSectionTitle: { 
          fontSize: 10, 
          bold: true, 
          color: '#000000',
          margin: [0, 15, 0, 10],
          lineHeight: 1.0
        },
        paragraph: {
          fontSize: 9,
          color: '#000000',
          margin: [0, 5, 0, 10],
          lineHeight: 1.2,
          alignment: 'justify'
        },
        infoText: {
          fontSize: 9,
          color: '#000000',
          margin: [0, 3, 0, 3],
          lineHeight: 1.2,
          alignment: 'justify',
        },
        sectionTitles: {
          fontSize: 12,
          bold: true,
          color: '#1a1a1a',
          letterSpacing: 0.5
        },
        label: {
          fontSize: 9,
          color: '#666666', // Gris pour les étiquettes
          margin: [0, 2, 0, 2]
        },
        valueBold: {
          fontSize: 9,
          bold: true,
          color: '#000000', // Noir profond pour les données importantes
          margin: [0, 2, 0, 2]
        },
        bullet: {
          fontSize: 10,
          color: '#999999'
        },
        noteText: {
          fontSize: 7.5,
          italics: true,
          color: '#999999',
          lineHeight: 1.2
        },
        signatureLabel: {
          fontSize: 9,
          color: '#000000',
          alignment: 'center',
          margin: [0, 20, 0, 5],
          lineHeight: 1.2
        },
        signatureLine: {
          fontSize: 10,
          color: '#000000',
          alignment: 'center',
          margin: [0, 0, 0, 5],
          lineHeight: 1.2
        },
        signatureDate: {
          fontSize: 8,
          color: '#000000',
          alignment: 'center',
          margin: [0, 0, 0, 0],
          lineHeight: 1.2
        },
       tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f5f5f5',
          alignment: 'center',
          margin: [0, 5, 0, 5]
        },
        tableCell: {
          fontSize: 9,
          color: '#333333',
          // On laisse le padding du layout gérer l'espace
        },
        // STYLES AGRANDIS POUR LES TABLEAUX DE GARANTIES
        garantieTableHeader: {
          fontSize: 9,
          bold: true,
          color: '#000000',
          alignment: 'center',
          fillColor: '#e8e8e8'
        },
        garantieTableCell: {
          fontSize: 8,
          color: '#000000',
          alignment: 'left'
        },
        garantieTableCellRight: {
          fontSize: 8,
          color: '#000000',
          alignment: 'right'
        },
        garantieTableCellCenter: {
          fontSize: 8,
          color: '#000000',
          alignment: 'center'
        },
        // STYLES POUR LES SECTIONS RC
        rcTableHeader: {
          fontSize: 9,
          bold: true,
          color: '#000000',
          alignment: 'center',
          fillColor: '#e8e8e8'
        },
        rcTableCell: {
          fontSize: 8,
          color: '#000000',
          alignment: 'left'
        },
        rcTableCellRight: {
          fontSize: 8,
          color: '#000000',
          alignment: 'right'
        },
        rcTableCellCenter: {
          fontSize: 8,
          color: '#000000',
          alignment: 'center'
        },
        // STYLES POUR LES EXCLUSIONS
        exclusionParentTitle: {
          fontSize: 10,
          bold: true,
          color: '#000000',
          margin: [0, 8, 0, 5],
          decoration: 'underline'
        },
        exclusionItem: {
          fontSize: 9,
          color: '#000000',
          margin: [5, 2, 0, 2],
          lineHeight: 1.2
        },
        // STYLE POUR LES EXCLUSIONS DES GARANTIES
        garantieExclusionText: {
          fontSize: 9,
          bold: true,
          color: '#000000',
          alignment: 'justify',
          lineHeight: 1.5,
          margin: [0, 2, 0, 2]
        },
        // STYLES POUR LES CLAUSES COMMUNES
        clauseTitle: {
          fontSize: 11,
          bold: true,
          color: '#000000',
          margin: [0, 15, 0, 10],
          decoration: 'underline',
          alignment: 'center',
          lineHeight: 1.2
        },
        clauseText: {
          fontSize: 9,
          color: '#000000',
          margin: [0, 5, 0, 10],
          lineHeight: 1.5,
          alignment: 'justify'
        },
        souscripteur: {
          fontSize: 9,
          bold: true,
          color: '#000000',
          alignment: 'right',
          margin: [0, 20, 0, 5],
          lineHeight: 1.2
        },
        
        // STYLES POUR LA COTISATION
        cotisationTableHeader: {
          fontSize: 9,
          bold: true,
          color: '#000000',
          alignment: 'center',
          fillColor: '#e8e8e8'
        },
         domelecTableCell: {
          fontSize: 9,
          color: '#000000',
          alignment: 'center'
        },
        cotisationTableCell: {
          fontSize: 9,
          color: '#000000',
          alignment: 'left'
        },
        cotisationTableCellRight: {
          fontSize: 9,
          color: '#000000',
          alignment: 'right'
        },
        cotisationTableCellCenter: {
          fontSize: 9,
          color: '#000000',
          alignment: 'center'
        },
        // STYLES SPÉCIFIQUES POUR LES TABLEAUX DE GARANTIES
        garantieSectionTitle: {
          fontSize: 11,
          bold: true,
          color: '#000000',
          margin: [0, 10, 0, 10],
          decoration: 'underline',
          lineHeight: 1.2
        },
        garantieSubSectionTitle: {
          fontSize: 10,
          bold: true,
          color: '#000000',
          margin: [0, 0, 0, 10],
          lineHeight: 1.2
        }
      },
      defaultStyle: {
        color: '#000000',
        lineHeight: 1.2
      }
    };

    // 2. Générer le PDF principal
   const mainPdfBytes = await new Promise<Uint8Array>((resolve) => {
    pdfMake.createPdf(docDefinition).getBuffer(resolve);
  });

  

// 2. Fusionner les clauses liées aux sous-garanties
let mergedPdf = await this.mergeClausesSousGarantie(mainPdfBytes, data);

// 3. Fusionner les clauses globales
mergedPdf = await this.mergeContractWithClausiers(mergedPdf, data);

// 4. Ajouter la numérotation à toutes les pages
const finalPdfBytes = await this.addPageNumbers(mergedPdf);

// 5. Retourner le PDF final
return new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
  }

private async addPageNumbers(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pages.length;

    pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumber = (index + 1).toString();
        const text = `Page ${pageNumber} sur ${totalPages}`;
        const textWidth = font.widthOfTextAtSize(text, 9);
        
        // Positionner le texte plus haut pour créer l'espace visuel
        // Augmenter la valeur Y pour monter le texte
        const yPosition = 80; // Au lieu de 25, on monte à 60px du bas
        
        page.drawText(text, {
            x: (width - textWidth) / 2, // Centré horizontalement
            y: yPosition, // Position plus haute
            size: 9,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
        });
    });

    return await pdfDoc.save();
}

private async mergeClausesSousGarantie(
  mainPdfBytes: Uint8Array,
  data: any
): Promise<Uint8Array> {
  try {
    const sections = data.sections || [];
    if (sections.length === 0) return mainPdfBytes;

    const seenClauseIds = new Set<number>();
    const clausierPdfs: Uint8Array[] = [];

    // 1️⃣ Collecter toutes les clauses des sous-garanties
    for (const section of sections) {
      const garanties = section.garanties || [];
      for (const sousGar of garanties) {
        const sousGarId = sousGar.sousGarantieId;
        const sousGarNom = sousGar.sousGarantieNom || '-';
        if (!sousGarId) continue;

        const clauses: ClauseGarantie[] = (await this.contratService
          .getClausesBySousGarantie(sousGarId)
          .toPromise()) || [];

        for (const clause of clauses) {
          if (clause.pdf && !seenClauseIds.has(clause.id!)) {
            clausierPdfs.push(this.base64ToUint8Array(clause.pdf as any));
            seenClauseIds.add(clause.id!);
          }
        }
      }
    }

    if (clausierPdfs.length === 0) {
      return mainPdfBytes;
    }

    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();
    const mainPdfDoc = await PDFDocument.load(mainPdfBytes);

    // 2️⃣ Copier les pages du PDF principal
    const mainPages = mainPdfDoc.getPageIndices();

    // 2a️⃣ Obtenir l'index de la page de la sectionCotisationAnnuelle
    const sectionIndex = await this.getPageIndexOfSection(mainPdfDoc, 'sectionCotisationAnnuelle');

    for (const pageIndex of mainPages) {
      const [copiedPage] = await mergedPdf.copyPages(mainPdfDoc, [pageIndex]);
      mergedPdf.addPage(copiedPage);

      // 2b️⃣ Ajouter les clauses juste après la sectionCotisationAnnuelle
      if (pageIndex === sectionIndex) {
        for (const pdfBytes of clausierPdfs) {
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        }
      }
    }

    return await mergedPdf.save();

  } catch (error) {
    console.error("Erreur fusion des clauses des sous-garanties :", error);
    return mainPdfBytes;
  }
}

 
private async getPageIndexOfSection(pdfDoc: PDFDocument, sectionId: string): Promise<number> {
  // Exemple simple : page fixe
  if (sectionId === 'sectionCotisationAnnuelle') return 2; // index de la page
  return -1; // si non trouvé
}


addOneYear(dateInput: string | Date): string {
  if (!dateInput) return '';

  let d: Date;

  // Cas Date
  if (dateInput instanceof Date) {
    d = new Date(dateInput);
  }
  // Cas string
  else if (typeof dateInput === 'string') {

    // Format DD/MM/YYYY
    if (dateInput.includes('/')) {
      const [day, month, year] = dateInput.split('/').map(Number);
      d = new Date(year, month - 1, day);
    }
    // Format ISO ou YYYY-MM-DD
    else {
      d = new Date(dateInput);
    }
  }
  else {
    return '';
  }

  if (isNaN(d.getTime())) return '';

  // +1 an
  d.setFullYear(d.getFullYear() + 1);

  // Format DD/MM/YYYY
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}




private async mergeContractWithClausiers(mainPdfBytes: Uint8Array, data: any): Promise<Uint8Array> {
  try {
    const selectedClauseIds = data.clauseIds || [];
    if (selectedClauseIds.length === 0) return mainPdfBytes;

    const clausierPdfs: Uint8Array[] = [];

    for (const clausierId of selectedClauseIds) {
    const clausier = data.clausiers.find((c: any) => c.id == clausierId);

      if (clausier?.file) {
        const pdfBytes = this.base64ToUint8Array(clausier.file);
        clausierPdfs.push(pdfBytes);
      }
    }

    if (clausierPdfs.length === 0) return mainPdfBytes;

    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    // CONTRACT
    const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
    const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
    mainPages.forEach(p => mergedPdf.addPage(p));

    // CLAUSIERS
    for (const pdfBytes of clausierPdfs) {
      const pdfDoc = await PDFDocument.load(pdfBytes);

      if (pdfDoc.getPageCount() === 0) {
        console.warn("Clausier ignoré : PDF vide ou invalide");
        continue;
      }

      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();

  } catch (error) {
    console.error("Erreur fusion PDFs:", error);
    return mainPdfBytes;
  }
}

private base64ToUint8Array(base64: string): Uint8Array {
  // Enlever header si présent
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;

  const binaryString = atob(cleaned);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}


    private async prepareCotisationAnnuelle(data: any): Promise<any> {
    // Calculer la prime nette totale
    
    const primeNetteTotale = this.calculerPrimeNetteTotale(data);
    
    let frais = 0;
    let taxes = 0;
    let droitEntree = 0;
    let feFg = 0;

    try {
if (!data?.branche) {
  throw new Error('La branche est undefined !');
}

      const tarif = await lastValueFrom(this.contratService.getTarifByBranche(data.branche));
      
      // Utiliser les valeurs de l'API
      frais = tarif?.fq || 0;
      taxes = tarif?.taux || 0;
      droitEntree = tarif?.prixAdhesion || 0;
      feFg = tarif?.feFg || 0;
     

    } catch (error) {
      // Utiliser des valeurs par défaut en cas d'erreur
      frais = 0;
      taxes = 0;
      droitEntree = 0;
      feFg = 0;
    }
    
    // Calcul de la prime TTC
    const primeTTC = data.primeTTC/1000;
const primeAvecTaxes = ((primeNetteTotale + frais) * (taxes))/1000; 
    // Déterminer si on affiche le droit d'entrée
    const isNouvelAdherent = data.adherent?.nouveau !== false;
    
    // Configuration des colonnes selon le type d'adhérent
    const headers = [
      { text: 'Prime Nette (DT)', style: 'cotisationTableHeader' },
      { text: 'Frais (DT)', style: 'cotisationTableHeader' },
      { text: 'Taxes (DT) ', style: 'cotisationTableHeader' }
    ];
    
    const values = [
      { text: this.formatMontant(primeNetteTotale), style: 'cotisationTableCellRight' },
      { text: this.formatMontant(frais), style: 'cotisationTableCellRight' },
      { text: this.formatMontant(primeAvecTaxes), style: 'cotisationTableCellRight' }
    ];

    // Ajouter le droit d'entrée seulement pour les nouveaux adhérents
    if (isNouvelAdherent) {
      headers.splice(3, 0, { text: 'Droit d\'Entrée (DT)', style: 'cotisationTableHeader' });
      values.splice(3, 0, { text: this.formatMontant(droitEntree), style: 'cotisationTableCellRight' });
    }

    // Ajouter les colonnes communes (FE/FG et Prime TTC)
    headers.push(
      { text: 'FE/FG (DT)', style: 'cotisationTableHeader' },
      { text: 'Prime TTC (DT)', style: 'cotisationTableHeader' }
    );
    
    values.push(
      { text: this.formatMontant(feFg), style: 'cotisationTableCellRight' },
      { text: this.formatMontant(primeTTC), style: 'cotisationTableCellRight'}
    );

    return {
      stack: [
       
        { 
          text: 'COTISATION ANNUELLE', 
          style: 'sectionTitle',
          margin: [0, 10, 0, 10]
        },
        {
           table: {
              headerRows: 1,
              dontBreakRows: true,
              widths: isNouvelAdherent 
                ? ['*', 'auto', 'auto', 'auto', 'auto', 'auto'] // 6 colonnes avec droit d'entrée
                : ['*', 'auto', 'auto', 'auto', 'auto'], // 5 colonnes sans droit d'entrée
              body: [
                // EN-TÊTE HORIZONTAL - FORMAT DEMANDÉ
                headers,
                // VALEURS HORIZONTALES - FORMAT DEMANDÉ
                values
              ]
          },
          layout: {
            defaultBorder: true,
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 8,
            paddingBottom: () => 8
          },
          margin: [0, 0, 0, 30]
        },
      {
  columns: [
    {
      text: 'Fait en triple exemplaires le : ____/____/______',
      margin: [0, 0, 0, 20],
      alignment: 'right'  
    }
  ]
},
{
  columns: [
    {
      width: '*',
      stack: [
        { text: 'Le Souscripteur', style: 'souscripteur', alignment: 'left' },
        { text: '____________________', style: 'signatureLine', alignment: 'left' }
      ]
    },
    {
      width: '*',
      stack: [
        { text: 'P/ MAE Assurances', style: 'souscripteur', alignment: 'right' },
        { text: '____________________', style: 'signatureLine', alignment: 'right' }
      ]
    }
  ]
}

      ], unbreakable: true
    };
  }
  private formatTaux(taux: any): string {
  if (taux === null || taux === undefined || taux === '' || isNaN(taux)) {
    return '-';
  }
  
  const valeur = typeof taux === 'string' ? parseFloat(taux) : taux;
  
  if (isNaN(valeur)) {
    return '-';
  }
  
  // Convertir 0.12 en 12%
  const pourcentage = valeur * 100;
  return `${pourcentage.toFixed(3)}`; // ou toFixed(2) pour 12.00%
}

  // Les autres méthodes restent inchangées...

private calculerPrimeNetteTotale(data: any): number {
  let primeTotale = 0;

  const typeFractionnement = this.getFractionnement(data.fractionnement);

  const appliquerFractionnement = (prime: number): number => {
    if (typeFractionnement === 'Semestriel') {
      return prime / 2;
    }
    if (typeFractionnement === 'Trimestriel') {
      return prime / 3;
    }
    return prime; // Annuel
  };

  // 🔹 Garanties
  if (data.sections) {
    data.sections.forEach((section: any) => {
      if (section.garanties) {
        section.garanties.forEach((garantie: any) => {
          const prime = appliquerFractionnement(garantie.primeNET || 0);
          primeTotale += prime;
        });
      }
    });
  }

  // 🔹 RC
  if (data.rcConfigurations) {
    data.rcConfigurations.forEach((rc: any) => {
      const nbSituations = rc.sectionIds?.length || 0;
      const primeRC = appliquerFractionnement(Number(rc.primeNET || 0)) * nbSituations;
      primeTotale += primeRC;
    });
  }

  return primeTotale;
}


private prepareTableauxGaranties(sections: any[], data: any): any[] {
  const fractionnement = data.fractionnement;

  if (!sections || sections.length === 0) {
    return [
      {
        stack: [
          { text: 'GARANTIES', style: 'garantieSectionTitle' },
          { text: 'Aucune garantie disponible', style: 'paragraph', alignment: 'center' }
        ]
      }
    ];
  }

  const ORDRE_PRIORITE = [
    "Incendie Bâtiment",
    "Incendie Matériel professionnel",
    "Incendie Agencements et mobilier de bureau",
    "Incendie Matériel informatique",
    "Incendie Matières premières",
    "Incendie Marchandises",
    "Recours des locataires contre le propriétaire",
    "Recours du propriétaire contre les locataires",
    "Recours des Voisins et des Tiers",
    "Toutes explosions et Foudre",
    "Dommages aux appareils électriques",
    "Pertes indirectes",
    "Risques spéciaux",
    "Inondation",
    "Tremblement de terre",
    "Grèves émeutes et Mouvements Populaires, Actes de Terrorisme et de Sabotage",
    "Honoraires d'expert",
    "Frais de déblais et de démolitions",
    "Valeur à neuf",
    "privation de jouissance",
    "Perte des Loyers",
    "Reconstituion des supports non informatiques d'information",
    "Reconstituion des supports informatiques d'information",
    "Frais de déplacement et de relogement",
    "Perte Financière sur amenagements mobiliers et immobilers",
    "Perte d'usage des Locaux",
    "Honoraires de décorateurs , de bureaux d'études et de contrôle Technique et d'ingénerie : 5% de l'indemnité",
    "Frais necessités par une mis en etat des lieux en conformité avec la législation et la réglementation : 5% de l'indemnité",
    "Frais de Clôture provisoire du gardiennage",
    "vol sur contenu professionnel",
    "Vol sur Agencement et Mobilier de Bureau",
    "Vol sur materiel professionnel",
    "vol sur marchandises",
    "Vol sur materiel d'exploitation",
    "Vol espèces et valeurs(devise et dinars) en tiroirs caisse",
    "Vol espèces et valeurs(devise et dinars) en coffre-fort central",
    "Transport de Fond-Vol sur la personnen",
    "Vol sur Détournement de fonds",
    "Détérioration Immobilière suite vol",
    "Batiment",
    "Contenu Professionnel",
    "Frais de recherche de fuites",
    "Recours des voisins et des tiers",
    "Glaces verticales",
    "Enseignes Lumineuses"
  ];

  const allSectionsContent: any[] = [];

  sections.forEach((section, index) => {
    const situationLabel = `Situation ${String.fromCharCode(65 + index)}`;
    let garanties = section.garanties || [];

    if (garanties.length === 0) {
      allSectionsContent.push({
        stack: [
          { text: `GARANTIES - ${situationLabel}`, style: 'garantieSectionTitle' },
          { text: `Situation : ${section.identification || '-'}`, style: 'garantieSubSectionTitle' },
          { text: 'Aucune garantie', style: 'paragraph', alignment: 'center' }
        ],
        unbreakable: true
      });
      return;
    }

    garanties.sort((a: any, b: any) => {
      const nomA = a.sousGarantieNom || a.sousGarantieId || '';
      const nomB = b.sousGarantieNom || b.sousGarantieId || '';

      const posA = ORDRE_PRIORITE.indexOf(nomA);
      const posB = ORDRE_PRIORITE.indexOf(nomB);

      return (posA === -1 ? 999 : posA) - (posB === -1 ? 999 : posB);
    });

    const typeFractionnement = this.getFractionnement(fractionnement);

    const lignesGaranties = garanties.map((garantie: any) => {
      let primeNette = garantie.primeNET;

      if (typeFractionnement === 'Semestriel') {
        primeNette = primeNette / 2;
      } else if (typeFractionnement === 'Trimestriel') {
        primeNette = primeNette / 3;
      }

      return [
        { text: garantie.sousGarantieNom || '-', style: 'garantieTableCell' },
        { text: this.formatMontant(garantie.capitale), style: 'garantieTableCellRight' },
        { text: this.formatFranchise(garantie.franchise, garantie.hasFranchise), style: 'garantieTableCellCenter' },
        { text: this.formatMontant(garantie.minimum), style: 'garantieTableCellRight' },
        { text: this.formatMontant(garantie.maximum), style: 'garantieTableCellRight' },
        { text: this.formatMontant(primeNette), style: 'garantieTableCellRight' }
      ];
    });

    allSectionsContent.push({
      stack: [
        { text: `GARANTIES - ${situationLabel}`, style: 'garantieSectionTitle', margin: [0, 5, 0, 2] },
        { text: `Situation : ${section.identification || '-'}`, style: 'garantieSubSectionTitle', margin: [0, 0, 0, 5] },
        {
          table: {
            headerRows: 2,
            dontBreakRows: true,
            keepWithHeaderRows: 2,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Garantie', style: 'garantieTableHeader', rowSpan: 2, alignment: 'center' },
                { text: 'Capital assuré (DT)', style: 'garantieTableHeader', rowSpan: 2, alignment: 'center' },
                { text: 'Franchise', style: 'garantieTableHeader', colSpan: 3, alignment: 'center' },
                {}, {},
                { text: 'Prime nette (DT)', style: 'garantieTableHeader', rowSpan: 2, alignment: 'center' }
              ],
              [
                {}, {},
                { text: 'Taux (%)', style: 'garantieTableHeader', alignment: 'center' },
                { text: 'Minimum (DT)', style: 'garantieTableHeader', alignment: 'center' },
                { text: 'Maximum (DT)', style: 'garantieTableHeader', alignment: 'center' },
                {}
              ],
              ...lignesGaranties
            ]
          },
          margin: [0, 0, 0, 15]
        }
      ],
       unbreakable: true
    });
  });

  return allSectionsContent;
}



private formatMontant(montant: any): string {
  if (montant === null || montant === undefined || montant === '' || isNaN(montant) || montant === 0) {
    return '-';
  }

  // Convertir en string pour éviter les problèmes de flottants
  let montantStr = montant.toString().replace(',', '.');

  let dinars: number;
  let millimes: number;

  // Détecter si c'est un entier très grand ( > 1000 ) → on considère les 3 derniers chiffres comme millimes
  if (parseInt(montantStr, 10) >= 1000 && montantStr.indexOf('.') === -1) {
    const strPadded = montantStr.padStart(4, '0'); // au moins 4 chiffres
    millimes = parseInt(strPadded.slice(-3), 10);
    dinars = parseInt(strPadded.slice(0, -3), 10);
  } else {
    // Montant déjà en dinars.millimes (ex: 519.907)
    dinars = Math.floor(parseFloat(montantStr));
    millimes = Math.round((parseFloat(montantStr) - dinars) * 1000);
  }

  // Formater les milliers
  const dinarsFormate = dinars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const millimesFormate = millimes.toString().padStart(3, '0');

  const montantFormate = `${dinarsFormate},${millimesFormate}`;

  // Montant en lettres
  let montantEnLettres = this.nombreEnToutesLettres(dinars) + ' dinars';
  if (millimes > 0) {
    montantEnLettres += ' et ' + this.nombreEnToutesLettres(millimes) + ' millimes';
  }

  // Majuscule au début
  montantEnLettres = montantEnLettres.charAt(0).toUpperCase() + montantEnLettres.slice(1);

  return `${montantFormate}\n${montantEnLettres}`;
}
 
private nombreEnToutesLettres(nombre: number): string {
  const unites = [
    "", "un", "deux", "trois", "quatre", "cinq", "six",
    "sept", "huit", "neuf", "dix", "onze", "douze",
    "treize", "quatorze", "quinze", "seize"
  ];

  const dizaines = [
    "", "", "vingt", "trente", "quarante", "cinquante",
    "soixante", "soixante", "quatre-vingt", "quatre-vingt"
  ];

  if (nombre < 17) {
    return unites[nombre];
  } else if (nombre < 20) {
    return "dix-" + unites[nombre - 10];
  } else if (nombre < 70) {
    const d = Math.floor(nombre / 10);
    const u = nombre % 10;
    return dizaines[d] + (u ? "-" + unites[u] : "");
  } else if (nombre < 80) {
    return "soixante-" + this.nombreEnToutesLettres(nombre - 60);
  } else if (nombre < 100) {
    return "quatre-vingt" + (nombre > 80 ? "-" + this.nombreEnToutesLettres(nombre - 80) : "s");
  } else if (nombre < 1000) {
    const c = Math.floor(nombre / 100);
    const r = nombre % 100;
    return (c > 1 ? unites[c] + " " : "") + "cent" + (c > 1 && r === 0 ? "s" : "") +
      (r ? " " + this.nombreEnToutesLettres(r) : "");
  } else if (nombre < 1000000) {
    const m = Math.floor(nombre / 1000);
    const r = nombre % 1000;
    return (m > 1 ? this.nombreEnToutesLettres(m) + " " : "") + "mille" +
      (r ? " " + this.nombreEnToutesLettres(r) : "");
  } else if (nombre < 1000000000) {
    const M = Math.floor(nombre / 1000000);
    const r = nombre % 1000000;
    return this.nombreEnToutesLettres(M) + " million" + (M > 1 ? "s" : "") +
      (r ? " " + this.nombreEnToutesLettres(r) : "");
  }
  return nombre.toString(); // limite
}


private formatFranchise(franchise: any, hasFranchise: boolean): string {
  if (!hasFranchise) return '-';
  if (!franchise && franchise !== 0) return '-';
  
  const valeur = typeof franchise === 'string' ? parseFloat(franchise) : franchise;
  
  if (isNaN(valeur)) return '-';
  
  return valeur.toFixed(0) ;
}

private prepareSituationsRisque(sections: any[]): any[] {
    // Définir un style commun pour toutes les cellules
    const cellStyle = {
      style: 'tableCell',
      alignment: 'center' as const,
      fillColor: '#ffffff', // ou la couleur de votre fond
      margin: [0, 15, 0, 0] // Ajustez la marge supérieure pour le centrage visuel
    };

    if (!sections || sections.length === 0) {
      return [
        [
          { text: '-', ...cellStyle },
          { text: '-', ...cellStyle },
          { text: '-', ...cellStyle },
          { text: '-', ...cellStyle },
          { text: '-', ...cellStyle },
          { text: '-', ...cellStyle }
        ]
      ];
    }

    return sections.map((section, index) => [
      { 
        text: `Situation ${String.fromCharCode(65 + index)}`, 
        ...cellStyle,
        fillColor: '#f0f0f0' // Couleur différente pour la première colonne si besoin
      },
      { 
        text: section.identification || '-', 
        ...cellStyle 
      },
      { 
        text: section.adresse || '-', 
        ...cellStyle 
      },
      { 
        text: section.natureConstruction || '-', 
        ...cellStyle 
      },
      { 
        text: section.contiguite || '-', 
        ...cellStyle 
      },
      { 
        text: section.avoisinage || '-', 
        ...cellStyle 
      }
    ]);
  }

  // Méthode pour formater la date
  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return dateString;
    }
  }

  // Méthode pour déterminer la nature du contrat
  private getNatureContrat(codeRenouvellement: string): string {
    if (!codeRenouvellement) return 'Non spécifié';
    
    const code = codeRenouvellement.toString().trim().toUpperCase();
    
    switch(code) {
      case 'T':
        return 'Renouvelable par tacite reconduction';
      case 'R':
        return 'Ferme';
      default:
        return 'Non spécifié';
    }
  }

  // Méthode pour déterminer le fractionnement
  private getFractionnement(codeFractionnement: string): string {
    if (!codeFractionnement) return '-';
    
    const code = codeFractionnement.toString().trim().toUpperCase();
    
    switch(code) {
      case '0':
      case 'ZERO':
        return 'Annuel';
      case '2':
      case 'DEUX':
        return 'Trimestriel';
      case '1':
      case 'UN':
        return 'Semestriel';
      default:
        return codeFractionnement;
    }
  }

private prepareSectionsRC(rcConfigurations: any[], data: any): any[] {
  if (!rcConfigurations || rcConfigurations.length === 0) {
    return []
  }
  const typeFractionnement = this.getFractionnement(data.fractionnement);
  // Section avec l'objet de garantie (affiché une seule fois)
  const sectionObjetGarantie = {
    stack: [
      { text: 'RESPONSABILITÉ CIVILE EXPLOITATION', style: 'sectionTitle' },
      { text: 'Objet de la garantie :', style: 'subSectionTitle' },
      { text: data.objetDeLaGarantie || 'Non spécifié', style: 'paragraph', margin: [0, 0, 0, 20] }
    ]
  };

  const allExclusions = data.exclusionsRC || [];

  if (!Array.isArray(allExclusions)) {
    console.error('❌ allExclusions n\'est pas un tableau:', allExclusions);
    return [];
  }

  // Sections pour chaque configuration RC
  const sectionsConfigurations = rcConfigurations.map((rcConfig, index) => {
    const situationsCouvertes = rcConfig.sectionIds && rcConfig.sectionIds.length > 0
      ? rcConfig.sectionIds.map((id: number) => `Situation ${String.fromCharCode(65 + id)}`).join(', ')
      : 'Aucune situation spécifiée';

    // Récupérer les exclusions correspondant aux IDs
    const exclusionsTextes = rcConfig.exclusionsRcIds && rcConfig.exclusionsRcIds.length > 0
      ? allExclusions
          .filter((ex: any) => rcConfig.exclusionsRcIds.includes(ex.id))
          .map((ex: any) => ex.libelle || ex.nom || 'Exclusion sans libellé')
      : [];

    // PRÉPARER LE CONTENU DES EXCLUSIONS AVEC GESTION DE PAGINATION
    const exclusionsContent = this.prepareRCExclusionsContent(exclusionsTextes);
      let primeNetteRC = rcConfig.primeNET;

    if (typeFractionnement === 'Semestriel') {
      primeNetteRC = primeNetteRC / 2;
    } else if (typeFractionnement === 'Trimestriel') {
      primeNetteRC = primeNetteRC / 3;
    }
    return {
      stack: [
        // ✅ AJOUT D'UN SOUS-STACK UNBREAKABLE ICI
        {
      stack: [
        // Situations couvertes
        { text: 'Situations de risque couvertes :', style: 'subSectionTitle' , margin: [0, 2, 0, 5]},
        { text: situationsCouvertes, style: 'paragraph', margin: [0, 0, 0, 5] },

        // Tableau RC
   
{// forcer un saut si la page actuelle n'a pas assez de place
  table: {
    headerRows: 2, // 2 lignes pour gérer les sous-colonnes Franchise
    dontBreakRows: true,
    widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], // 7 colonnes
    body: [
      // Ligne 1 header
      [
        { text: 'Couvertures', style: 'rcTableHeader', rowSpan: 2 },
        { text: 'Limite annuelle (DT)', style: 'rcTableHeader', rowSpan: 2 },
        { text: 'Limite par sinistre (DT)', style: 'rcTableHeader', rowSpan: 2 },
        { text: 'Franchise', style: 'rcTableHeader', colSpan: 3, alignment: 'center' }, {}, {},
        { text: 'Prime NET (DT)', style: 'rcTableHeader', rowSpan: 2 } // fusion pour 2 lignes
      ],
      // Ligne 2 header (sous-colonnes Franchise)
      [
        {}, {}, {},
        { text: 'Taux (%)', style: 'rcTableHeader' },
        { text: 'Minimum (DT)', style: 'rcTableHeader' },
        { text: 'Maximum (DT)', style: 'rcTableHeader' },
        {} // Prime NET déjà fusionnée
      ],
      // Ligne Dommages corporels
      [
        { text: 'Dommages corporels', style: 'rcTableCell' },
        { text: this.formatMontant(rcConfig.limiteAnnuelleDomCorporels), style: 'rcTableCellRight' },
        { text: this.formatMontant(rcConfig.limiteParSinistreCorporels), style: 'rcTableCellRight' },
        { text: this.formatFranchise(rcConfig.franchisesCorporels, true), style: 'rcTableCellRight' },
        { text: this.formatMontant(rcConfig.minimumCorporels), style: 'rcTableCellRight' },
        { text: this.formatMontant(rcConfig.maximumCorporels), style: 'rcTableCellRight' },
        { text: this.formatMontant(primeNetteRC), style: 'rcTableCellRight', rowSpan: 2, margin: [0, 15, 0, 0] } // Fusion Prime NET
      ],
      // Ligne Dommages matériels
      [
        { text: 'Dommages matériels', style: 'rcTableCell' },
        { text: this.formatMontant(rcConfig.limiteAnnuelleDomMateriels), style: 'rcTableCellRight' },
        { text: this.formatMontant(rcConfig.limiteParSinistreMateriels), style: 'rcTableCellRight' },
        { text: this.formatFranchise(rcConfig.franchise, true), style: 'rcTableCellRight' },
        { text: this.formatMontant(rcConfig.minimum), style: 'rcTableCellRight' },
        { text: this.formatMontant(rcConfig.maximum), style: 'rcTableCellRight' },
        {} // Fusion Prime NET, vide pour la 2ᵉ ligne
      ]
    ]
  },
  layout: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#999',
    vLineColor: () => '#999',
    paddingLeft: () => 5,
    paddingRight: () => 5,
    paddingTop: () => 2,
    paddingBottom: () => 2
  },
  margin: [0, 0, 0, 20]}],
  unbreakable: true
}, 

        // Section Exclusions avec gestion de pagination
        ...(exclusionsTextes.length > 0
          ? [
             
              ...exclusionsContent
            ]
          : [
              {
                text: 'Aucune exclusion spécifique.',
                style: 'paragraph',
                italics: true,
                alignment: 'justify',
                margin: [0, 5, 0, 0]
              }
            ])
      ]
    };
  });

  return [sectionObjetGarantie, ...sectionsConfigurations];
}
private prepareRCExclusionsContent(exclusionsTextes: string[], titreSection: string = "Exclusions :"): any[] {
  if (!exclusionsTextes || exclusionsTextes.length === 0) {
    return [];
  }

  // 1. On transforme chaque texte en un bloc individuel (Item)
  const items = exclusionsTextes.map((text: string) => {
    return {
      stack: [
        {
          columns: [
            { text: '•', width: 10, style: 'bullet', alignment: 'left' }, 
            { 
              text: text, 
              alignment: 'justify', 
              lineHeight: 1.2, 
              bold: true, 
              style: 'paragraph' 
            }
          ]
        }
      ],
      margin: [10, 0, 0, 8],
      dontBreakRows: true // L'item individuel ne se coupera jamais horizontalement
    };
  });

  // 2. On retourne le bloc lié. 
  // IMPORTANT : Vérifiez que l'appelant ne rajoute pas de titre avant d'appeler cette fonction.
  return [
    {
      stack: [
        {
          // BLOC INSÉCABLE : Lie le titre fourni et seulement le 1er item
          stack: [
            { 
              text: titreSection, 
              style: 'subSectionTitle', 
              margin: [0, 10, 0, 5] 
            },
            items[0] // Premier item verrouillé au titre
          ],
          unbreakable: true // Empêche le titre d'être orphelin en bas de page
        },
        // Le reste des items s'affiche normalement après (permet le saut de page naturel)
        ...(items.length > 1 ? items.slice(1) : [])
      ]
    }
  ];
}


 private prepareExclusionsParSituation(data: any): any[] {
  if (!data.sections || data.sections.length === 0) return [];

  // 1️⃣ Identifier les exclusions globales groupées par garantie parent
  const exclusionsGlobalesParGarantie = this.getExclusionsGlobalesParGarantieParent(data.sections, data);

  // 2️⃣ Préparer les sections spécifiques
  const sectionsAvecExclusions = data.sections.map((section: any, index: number) => {
    const situationLabel = `Situation ${String.fromCharCode(65 + index)}`;
    
    // Grouper les garanties par parent
    const garantiesParParent = this.groupGarantiesParParent(section.garanties, data);

    // Filtrer pour garder seulement les exclusions spécifiques
    const garantiesAvecExclusionsSpecifiques = this.filtrerExclusionsSpecifiquesParGarantieParent(
      garantiesParParent, 
      exclusionsGlobalesParGarantie
    );

    if (garantiesAvecExclusionsSpecifiques.length === 0) {
      return null; // Section vide
    }

    // Récupération du contenu généré (tableau d'objets pdfmake)
    const content = this.prepareExclusionsContent(garantiesAvecExclusionsSpecifiques);

    return {
      stack: [
        {
          // BLOC INSÉCABLE : Lie le titre au premier élément du contenu
          stack: [
            { 
              text: `EXCLUSIONS SPÉCIFIQUES - ${situationLabel}`, 
              style: 'sectionTitle',
              margin: [0, 10, 0, 5]
            },
            { 
              text: `Situation : ${section.identification || '-'}`, 
              style: 'subSectionTitle',
              margin: [0, 0, 0, 5]
            },
            // On inclut le premier élément du contenu s'il existe
            content.length > 0 ? content[0] : {}
          ],
          unbreakable: true // Empêche le titre d'être orphelin
        },
        // On affiche le reste du contenu normalement pour permettre le saut de page
        ...(content.length > 1 ? content.slice(1) : [])
      ],
      margin: [0, 0, 0, 15]
    };
  }).filter((section: any) => section !== null);

  // 3️⃣ Préparer la section "EXCLUSIONS GLOBALES"
  let sectionExclusionsGlobales: any[] = [];
  if (exclusionsGlobalesParGarantie.length > 0) {
    const globalContent = this.prepareExclusionsGlobalesContent(exclusionsGlobalesParGarantie);

    sectionExclusionsGlobales = [{
      stack: [
        {
          // BLOC INSÉCABLE : Lie le titre GLOBAL au premier élément global
          stack: [
            { 
              text: 'EXCLUSIONS GLOBALES', 
              style: 'sectionTitle',
              margin: [0, 10, 0, 10]
            },
            globalContent.length > 0 ? globalContent[0] : {}
          ],
          unbreakable: true
        },
        // Reste des exclusions globales
        ...(globalContent.length > 1 ? globalContent.slice(1) : [])
      ],
      margin: [0, 0, 0, 20]
    }];
  }

  // 4️⃣ Combinaison finale
  return [...sectionExclusionsGlobales, ...sectionsAvecExclusions];
}
// MÉTHODE MODIFIÉE - Identifier les exclusions globales avec la nouvelle logique
private getExclusionsGlobalesParGarantieParent(sections: any[], data: any): any[] {
  if (!sections || sections.length === 0) {

    return [];
  }

  // Étape 1: Pour chaque section, grouper les garanties par parent et compter les occurrences
  const allExclusionsByParent = new Map<string, {
    parent: any,
    exclusions: Map<number, { exclusion: any, sections: Set<number> }>,
    sectionCount: number, // Nombre de sections où cette garantie parent apparaît
    firstSectionIndex: number // Première section où cette garantie apparaît
  }>();

  sections.forEach((section, sectionIndex) => {
    
    // Utiliser votre méthode existante pour grouper par parent
    const garantiesParParent = this.groupGarantiesParParent(section.garanties, data);
    
    garantiesParParent.forEach((parentGroup: any) => {
      const parentLibelle = parentGroup.parent?.libelle || 'GARANTIE_SANS_NOM';
      const parentKey = parentLibelle.trim().toLowerCase();
      

      if (!allExclusionsByParent.has(parentKey)) {
        // Première occurrence de cette garantie parent
        allExclusionsByParent.set(parentKey, {
          parent: parentGroup.parent,
          exclusions: new Map<number, { exclusion: any, sections: Set<number> }>(),
          sectionCount: 1,
          firstSectionIndex: sectionIndex
        });
      } else {
        // Incrémenter le compteur de sections
        const parentData = allExclusionsByParent.get(parentKey)!;
        parentData.sectionCount++;
      }

      const parentData = allExclusionsByParent.get(parentKey)!;

      // Récupérer les exclusions de ce parent
      const exclusionsValues = this.getExclusionsArray(parentGroup.exclusionsUniques);

      exclusionsValues.forEach((exclusion: any) => {
        const exclusionId = exclusion.id;
        
        if (!parentData.exclusions.has(exclusionId)) {
          parentData.exclusions.set(exclusionId, {
            exclusion,
            sections: new Set<number>()
          });
        }
        
        const exclusionData = parentData.exclusions.get(exclusionId)!;
        exclusionData.sections.add(sectionIndex);
        
      });
    });
  });

  // Étape 2: Appliquer la nouvelle logique
  const totalSections = sections.length;
  const globalExclusionsParGarantie: any[] = [];

  allExclusionsByParent.forEach((parentData, parentKey) => {
    const exclusionsGlobalesPourCeParent = new Map<number, any>();    
    if (parentData.sectionCount === 1) {
      // CAS 1: Garantie dans une seule situation → TOUTES les exclusions sont globales
      
      parentData.exclusions.forEach((data, exclusionId) => {
        exclusionsGlobalesPourCeParent.set(exclusionId, data.exclusion);
      });
    } else {
      // CAS 2: Garantie dans plusieurs situations → Seules les exclusions communes sont globales
      
      parentData.exclusions.forEach((data, exclusionId) => {
        if (data.sections.size === parentData.sectionCount) {
          // Exclusion présente dans TOUTES les sections où cette garantie apparaît
          exclusionsGlobalesPourCeParent.set(exclusionId, data.exclusion);
        } 
      });
    }

    if (exclusionsGlobalesPourCeParent.size > 0) {
      globalExclusionsParGarantie.push({
        parent: parentData.parent,
        exclusionsUniques: exclusionsGlobalesPourCeParent,
        sectionCount: parentData.sectionCount // Pour information
      });
    }
  });

  globalExclusionsParGarantie.forEach(garantie => {
  });
  
  return globalExclusionsParGarantie;
}

// MÉTHODE MODIFIÉE pour filtrer les exclusions spécifiques
private filtrerExclusionsSpecifiquesParGarantieParent(
  garantiesParParent: any[], 
  exclusionsGlobalesParGarantie: any[]
): any[] {
  if (!garantiesParParent || garantiesParParent.length === 0) return [];

  // Créer une Map des IDs d'exclusions globales par garantie parent
  const globalExclusionsParParentMap = new Map<string, Set<number>>();
  exclusionsGlobalesParGarantie.forEach((parentGroup: any) => {
    const parentLibelle = parentGroup.parent.libelle;
    const exclusionIds = new Set<number>();
    
    parentGroup.exclusionsUniques.forEach((exclusion: any, exclusionId: number) => {
      exclusionIds.add(exclusionId);
    });
    
    globalExclusionsParParentMap.set(parentLibelle, exclusionIds);
  });
  return garantiesParParent.map(parentGroup => {
    const parentLibelle = parentGroup.parent?.libelle;
    const globalExclusionIds = globalExclusionsParParentMap.get(parentLibelle) || new Set<number>();
    
    const exclusionsValues = this.getExclusionsArray(parentGroup.exclusionsUniques);
    const exclusionsSpecifiques = new Map<number, any>();

    exclusionsValues.forEach((exclusion: any) => {
      const exclusionId = exclusion.id;
      
      // Garder seulement si ce n'est PAS une exclusion globale pour cette garantie parent
      if (!globalExclusionIds.has(exclusionId)) {
        exclusionsSpecifiques.set(exclusionId, exclusion);
      } else {
      }
    });

    return {
      ...parentGroup,
      exclusionsUniques: exclusionsSpecifiques
    };
  }).filter(group => group.exclusionsUniques.size > 0);
}
 
private prepareExclusionsGlobalesContent(exclusionsGlobalesParGarantie: any[]): any[] {
  if (!exclusionsGlobalesParGarantie || exclusionsGlobalesParGarantie.length === 0) return [];

  const ordreGaranties = ['INCENDIE', 'VOL', 'Dégâts des Eaux', 'Bris de Glaces'];

  // 🔹 Fonction pour récupérer l'index selon un mapping plus permissif
  const getIndexOrdre = (libelle: string) => {
    const nom = libelle.toUpperCase().trim();
    for (let i = 0; i < ordreGaranties.length; i++) {
      if (nom.includes(ordreGaranties[i])) return i;
    }
    return ordreGaranties.length; // pour les garanties non définies → fin
  };

  exclusionsGlobalesParGarantie.sort((a, b) => getIndexOrdre(a.parent.libelle) - getIndexOrdre(b.parent.libelle));

  const content: any[] = [];

  exclusionsGlobalesParGarantie.forEach((garantieGroup, index) => {
    const garantieNom = garantieGroup.parent.libelle;
    const exclusionsList = Array.from(garantieGroup.exclusionsUniques.values()).map(
      (exclusion: any) => exclusion.nom || 'Exclusion sans libellé'
    );

    content.push({
      stack: [
        { 
          text: garantieNom.toUpperCase(), 
          style: 'exclusionParentTitle', 
          margin: [0, index === 0 ? 0 : 15, 0, 5] 
        },
        {
          ul: exclusionsList.map(text => ({
            text: text,
            alignment: 'justify',
            lineHeight: 1.5,
            style: 'garantieExclusionText',
            margin: [0, 0, 0, 5]
          })),
          margin: [10, 0, 0, 10],
          bulletRadius: 2
        }
      ],
      unbreakable: true
    });
  });

  return content;
}

// MÉTHODE UTILITAIRE (inchangée)
private getExclusionsArray(exclusions: any): any[] {
  if (exclusions instanceof Map) {
    return Array.from(exclusions.values());
  } else if (Array.isArray(exclusions)) {
    return exclusions;
  } else {
    return [];
  }
}


  // Grouper les garanties par parent pour une situation donnée
  private groupGarantiesParParent(garanties: any[], data: any): any[] {
    if (!garanties || garanties.length === 0) {
      return [];
    }

    const parentsMap = new Map<number, {
      parent: any;
      sousGaranties: any[];
      exclusionsUniques: Map<number, any>;
    }>();

    garanties.forEach(garantie => {
      if (!garantie.sousGarantieId) return;

      // Trouver la sous-garantie dans les données
      const sousGarantie = this.findSousGarantie(garantie.sousGarantieId, data);
      if (!sousGarantie || !sousGarantie.garantieParent) return;

      const parentId = sousGarantie.garantieParent.id;

      if (!parentsMap.has(parentId)) {
        parentsMap.set(parentId, {
          parent: sousGarantie.garantieParent,
          sousGaranties: [],
          exclusionsUniques: new Map<number, any>()
        });
      }

      const parentData = parentsMap.get(parentId)!;
      
      // Ajouter la sous-garantie
      parentData.sousGaranties.push({
        ...sousGarantie,
        exclusions: garantie.exclusions || []
      });

      // Ajouter les exclusions au pool unique du parent
      this.addExclusionsToParent(garantie.exclusions, parentData);
    });

    return Array.from(parentsMap.values());
  }

  // Trouver une sous-garantie dans les données
  private findSousGarantie(sousGarantieId: number, data: any): any {
    // Chercher dans garantiesParParent d'abord
    if (data.garantiesParParent) {
      for (const parentGroup of data.garantiesParParent) {
        const found = parentGroup.sousGaranties.find((sg: any) => 
          sg.sousGarantieId === sousGarantieId
        );
        if (found) {
          return {
            ...found,
            garantieParent: parentGroup.parent
          };
        }
      }
    }

    // Fallback: chercher dans sousGarantiesMap du composant
    return null;
  }

  // Ajouter les exclusions au parent
  private addExclusionsToParent(exclusions: any[], parentData: any): void {
    if (!exclusions || !Array.isArray(exclusions)) return;

    exclusions.forEach(exclusion => {
      if (exclusion && exclusion.id && !parentData.exclusionsUniques.has(exclusion.id)) {
        parentData.exclusionsUniques.set(exclusion.id, exclusion);
      }
    });
  }
  
private prepareExclusionsContent(garantiesParParent: any[]): any[] {
  if (!garantiesParParent || garantiesParParent.length === 0) {
    return [
      {
        text: 'Aucune exclusion spécifique pour cette situation.',
        style: 'paragraph',
        italics: true,
        margin: [0, 10, 0, 10]
      }
    ];
  }

  const content: any[] = [];

  garantiesParParent.forEach((parentGroup, index) => {
    const hasExclusions = parentGroup.exclusionsUniques && parentGroup.exclusionsUniques.size > 0;

    if (hasExclusions) {
      const exclusionsList = Array.from(parentGroup.exclusionsUniques.values()).map((exclusion: any) => 
        exclusion.nom || 'Exclusion sans libellé'
      );

      // CRÉER UN STACK COMPLET pour chaque groupe d'exclusions (titre + liste)
      const exclusionGroupStack = {
        stack: [
          { 
            text: `EXCLUSIONS - ${parentGroup.parent.libelle || 'GARANTIE'}`.toUpperCase(), 
            style: 'exclusionParentTitle',
            margin: [0, index === 0 ? 0 : 15, 0, 5]
          },
          {
            ul: exclusionsList.map((text: string) => ({
              text: text,
              alignment: 'justify',
              lineHeight: 1.5,
              bold: true,
              style: 'garantieExclusionText',
              margin: [0, 0, 0, 5]
            })),
            margin: [10, 0, 0, 15],
            bulletRadius: 2
          }
        ],
        // FORCER le groupe à rester ensemble - saut de page avant si nécessaire
        unbreakable: true // ⬅️ C'EST LA CLÉ !
      };

      content.push(exclusionGroupStack);
    }
  });

  return content;
}
    
  private prepareAttestations(data: any): any[] {
  if (!data.sections || data.sections.length === 0) {
    return [];
  }

  return data.sections.map((section: any, index: number) => {
    const situationLabel = `Situation ${String.fromCharCode(65 + index)}`;
    
    return {
      stack: [
        { 
          text: 'ATTESTATION', 
          style: 'sectionTitle',
          pageBreak: 'before',
          alignment: 'center',
          decoration: 'underline'
        },
        
        // Texte principal de l'attestation
        {
          text: [
            { text: 'Valable Du ', style: 'paragraph',alignment: 'center', },
            { text: `${this.formatDate(data.dateDebut)}`, style: 'paragraphBold' },
            { text: ' au ', style: 'paragraph' },
            { text: `${this.formatDate(data.dateFin)}`, style: 'paragraphBold' }
          ],
          alignment: 'center',
          margin: [0, 10, 0, 20]
        },

        {
          text: [
            'Nous soussignés ',
            { text: 'Mutuelle Assurance de l\'Enseignement M.A.E', style: 'paragraphBold' },
            ', dont le siège social est à ',
            { text: 'Complexe EL MECHTEL AVENUE OULED HAFFOUZ, TUNIS 1075', style: 'paragraphBold' },
            ', attestons par la présente que ',
            { text: `${data.adherent.nomRaison || 'Nom de l\'Adhérent'}`, style: 'paragraphBold' },
            ' a souscrit auprès de notre Mutuelle un contrat d\'assurance Multirisque Artisans et Professions libérales en couverture ',
            { text: `${section.identification || 'Descriptif'}`, style: 'paragraphBold' },
            ' sis à ',
            { text: `${section.adresse || 'Lieu/Site'}`, style: 'paragraphBold' },
            '.'
          ],
          style: 'paragraph',
          alignment: 'justify',
          margin: [0, 0, 0, 10]
        },

        {
          text: [
            'Le dit contrat portant le N° : ',
            { text: `${data.adherent.codeId || 'N° Adhérent'}`, style: 'paragraphBold' },
             '/', { text: `${data.service || 'Service'}`, style: 'paragraphBold' },'/',
            { text: `${data.numPolice || 'N° Police'}`, style: 'paragraphBold' },
            ' prend effet à partir du ',
            { text: `${this.formatDate(data.dateDebut)}`, style: 'paragraphBold' },
            ' pour une période ',
            { text: `${this.getNatureContrat(data.codeRenouvellement)}`, style: 'paragraphBold' },
            '.'
          ],
          style: 'paragraph',
          alignment: 'justify',
          margin: [0, 0, 0, 10]
        },

        {
          text: 'Cette attestation est délivrée pour servir et valoir ce que de droit.',
          style: 'paragraph',
          alignment: 'justify',
          margin: [0, 0, 0, 30]
        },

        {
          text: 'POUR LA MUTUELLE',
          style: 'paragraphBold',
          alignment: 'right',
          margin: [0, 40, 0, 0]
        },

  
      ]
    };
  });
}
private prepareExtensions(data: any) {
  // 🔹 N'afficher les extensions que si le type de contrat est "Appel d'offre"
  if (data.typeContrat !== 'APPEL_D_OFFRE') {
    return []; // ➜ Rien du tout
  }

  if (!data.extensions || data.extensions.length === 0) {
    return []
  }

  const content: any[] = [
    { text: 'EXTENSIONS', style: 'sectionTitle', margin: [0, 20, 0, 10] }
  ];

  data.extensions.forEach((ext: any, index: number) => {
    content.push(
      { text: `${index + 1}. ${ext.titre || '-'}`, style: 'subSectionTitle' },
      { text: ext.texte || '-', style: 'paragraph', margin: [0, 5, 0, 15] }
    );
  });

  return content;
}
}
