import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { lastValueFrom } from 'rxjs';
import { ContratService } from './contrat';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor( private contratService: ContratService) {
    
    (pdfMake as any).vfs = (pdfMake as any).vfs || (pdfFonts as any).vfs;
  }

  async generateContratPDF(data: any): Promise<Blob> {


    const situationsRisque = this.prepareSituationsRisque(data.sections || []);
    const tableauxGaranties = this.prepareTableauxGaranties(data.sections || []);
    const sectionsRC = this.prepareSectionsRC(data.rcConfigurations || [], data);
    const sectionsExclusionsParSituation = this.prepareExclusionsParSituation(data);
    const sectionsClausesCommunes = this.prepareClausesCommunes(data);
 const sectionCotisationAnnuelle = await this.prepareCotisationAnnuelle(data);
   const sectionsAttestations = this.prepareAttestations(data);
// Montrez-moi 2 sections différentes avec quelques garanties
    const docDefinition: any = {
 pageMargins: [40, 100, 40, 90],
        header: function(currentPage: number, pageCount: number) {
        return {
          text: '',
          margin: [0, 20, 0, 0] // Espace réservé pour le header
        };
      },
      footer: function(currentPage: number, pageCount: number) {
        return {
       text: `Page ${currentPage.toString()} sur ${pageCount.toString()}`,
       alignment: 'center',
          fontSize: 9,
          color: '#666666',
          margin: [0, 0, 0, 25] // Espace réservé pour le footer
        };
      },
      content: [
        // Première page (contenu existant)
        {
          stack: [
            // Espace pour le logo
            { text: '', margin: [0, 0, 0, 40] },
            
            // Titre dans un cadre
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: [
                        { text: `Annexe au Contrat N° :${data.adherent.codeId || '-'}/${data.service|| '-'}/ ${data.numPolice || '-'}`, style: 'headerCenter' },
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

            // Informations de l'assuré
            { text: '\nINFORMATIONS DE L\'ASSURÉ', style: 'sectionTitle' },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: [
                        { text: `Nom / Raison sociale : ${data.adherent.nomRaison || '-'}`, style: 'infoText' },
                        { text: `Adresse : ${data.adherent.adresse || '-'}`, style: 'infoText' },
                        { text: `Profession : ${data.adherent.activite || '-'}`, style: 'infoText' },
                        { text: `Activité professionnelle  de l'Assuré : ${data.nom_assure || '-'}`, style: 'infoText' },
                        { 
                          text: 'Aucune autre activité professionnelle n\'est couverte à moins d\'être expressément déclarée et acceptée par l\'Assureur', 
                          style: 'noteText',
                          margin: [0, 10, 0, 0]
                        },
                      ],
                      border: [false, false, false, false]
                    }
                  ]
                ]
              },
              margin: [0, 0, 0, 20]
            },

            // Période d'assurance
            { text: 'PÉRIODE D\'ASSURANCE', style: 'sectionTitle' },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: [
                        { text: `• Date d'effet : ${this.formatDate(data.dateDebut)}`, style: 'infoText' },
                        { text: `• Fin d'effet : ${this.formatDate(data.dateFin)}`, style: 'infoText' },
                        { text: `• Nature du contrat : ${this.getNatureContrat(data.codeRenouvellement)}`, style: 'infoText' },
                        { text: `• Fractionnement : ${this.getFractionnement(data.fractionnement)}`, style: 'infoText' },
                      ],
                      border: [false, false, false, false]
                    }
                  ]
                ]
              },
              margin: [0, 0, 0, 40]
            },

            // Signature
      
          ]
        },

        // Nouvelle page pour les situations de risque
        {
          stack: [
            { text: 'SITUATIONS DE RISQUE', style: 'sectionTitle', pageBreak: 'before' },
            {
              table: {
                headerRows: 1,
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
                defaultBorder: true,
                paddingLeft: function() { return 4; },
                paddingRight: function() { return 4; },
                paddingTop: function() { return 2; },
                paddingBottom: function() { return 2; },
                 fillColor: function(rowIndex: number) {
          return (rowIndex % 2 === 0) ? '#f5f5f5' : null;
        },
        vLineWidth: function() { return 1; },
        hLineWidth: function() { return 1; },
        // Configuration pour le centrage vertical
        cellPadding: { top: 8, bottom: 8, left: 4, right: 4 } // Augmenter le padding pour mieux voir le centrage
      
              }
            }
          ]
        },

        // Nouvelle page pour les tableaux de garanties
        ...tableauxGaranties,

        // Exclusions par situation de risque
        ...sectionsExclusionsParSituation,

        // Nouvelle page pour les responsabilités civiles
        ...sectionsRC,

        // Section Cotisation Annuelle
        sectionCotisationAnnuelle,

        // Clauses Communes
        ...sectionsClausesCommunes,
    ...(data.sections?.some(
  (section: any) => {

    const hasGarantie = section.garanties?.some((gar: any) => {
      const sousNomGar = gar.sousGarantieNom?.toLowerCase() || '';


      // ✅ on accepte "dommages électrique" ou "dommages électriques"
      const match =
        sousNomGar.includes('dommages électrique') ||
        sousNomGar.includes('dommages électriques');

      if (match) {
      }

      return match;
    });

    if (hasGarantie) {
    }

    return hasGarantie;
  }
)
  ? [
      {
        stack: [
          {
            text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
            style: 'headerCenter',
            pageBreak: 'before'
          },
          { text: 'GARANTIE DES ACCIDENTS AUX APPAREILS ÉLECTRIQUES', style: 'sectionTitle' },

          { text: 'ÉTENDUE DE LA GARANTIE', style: 'subSectionTitle' },
          {
            text: `L'assureur garantit les appareils, machines, moteurs, électriques et électroniques et leurs accessoires participant aux tâches de production ou d'exploitation, ainsi que les canalisations électriques (autres que les canalisations enterrées c'est à dire celles dont l'accès nécessite des travaux de terrassement) contre :`,
            style: 'paragraph'
          },
          {
            text: `Les accidents d'ordre électrique affectant ces objets, y compris les dommages dus à la chute de la foudre ou l'influence de l'électricité atmosphérique.`,
            style: 'paragraph'
          },

          { text: 'EXCLUSIONS', style: 'subSectionTitle' },
          {
            ul: [
              "AUX FUSIBLES, AUX RÉSISTANCES CHAUFFANTES, AUX LAMPES DE TOUTES NATURES, AUX TUBES ÉLECTRONIQUES.",
              "AUX COMPOSANTS ÉLECTRONIQUES LORSQUE LE SINISTRE RESTE LIMITÉ À UN SEUL ENSEMBLE INTERCHANGEABLE.",
              "AUX MATÉRIELS INFORMATIQUES (Y COMPRIS LES MICROS ET MINI ORDINATEURS) PARTICIPANT AUX TÂCHES DE GESTION (DITS ORDINATEURS DE GESTION) LORSQUE LA VALEUR DE REMPLACEMENT À NEUF EXCÈDE 20.000 D.",
              "AUX MATÉRIELS INFORMATIQUES PARTICIPANT AUX TÂCHES DE PRODUCTION (DITS ORDINATEURS DE PROCESS, COMMANDES NUMÉRIQUES, ROBOTS INDUSTRIELS) LORSQU'ILS NE FONT PAS CORPS AVEC LE MATÉRIEL DE PRODUCTION, AUX MATÉRIELS ÉLECTRONIQUES DES SALLES DE CONTRÔLE, DES CENTRAUX DE COMMANDES (1).",
              "AUX MATÉRIELS ÉLECTRONIQUES DES CENTRAUX TÉLÉPHONIQUES LORSQUE LEUR VALEUR DE REMPLACEMENT À NEUF EXCÈDE VINGT MILLE DINARS (20.000D).",
              "CAUSÉS PAR L'USURE, UN BRIS DE MACHINE OU UN DYSFONCTIONNEMENT MÉCANIQUE QUELCONQUE.",
              "POUVANT RÉSULTER DE TROUBLES APPORTÉS DANS L'ACTIVITÉ DE L'ENTREPRISE AMENÉE PAR UN DOMMAGE DIRECT COUVERT PAR LA PRÉSENTE ASSURANCE.",
              "CAUSÉS AUX GÉNÉRATEURS ET TRANSFORMATEURS DE PLUS DE 1000 KVA ET AUX MOTEURS DE PLUS DE 1000 KW (2)."
            ].map(text => ({
              text,
              style: 'paragraph',
              bold: true,
              alignment: 'justify',
            }))
          },
          {
            text: '\n(1) Ces matériels relèvent de contrats spécifiques.\n(2) Ces matériels relèvent de l’assurance « bris de machine »',
            style: 'noteText',
            alignment: 'justify',
            margin: [0, 10, 0, 10]
          },
            {
            text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
            style: 'headerCenter',
            pageBreak: 'before'
          },

          // 🟦 NOUVELLE SECTION : ESTIMATION DES DOMMAGES
          { text: 'ESTIMATION DES DOMMAGES', style: 'subSectionTitle' },
          {
            text: `En cas de destruction totale d'un appareil ou d'une installation électrique, le montant des dommages est égal à la valeur de remplacement à neuf par un matériel équivalent, diminuée de la dépréciation, calculée forfaitairement par année depuis la date de sortie d'usine de l'appareil détruit ou de la mise en place des canalisations et dérivations, puis de la valeur de sauvetage. Le coefficient de dépréciation est fixé conformément au tableau ci-après.

Toutefois, la dépréciation forfaitaire ainsi calculée est limitée dans tous les cas à une fraction de la valeur de remplacement, comme indiqué au tableau ci-après.

Le rembobinage complet d'un appareil entre la date de sortie de l'usine et le jour du sinistre diminue de moitié la dépréciation acquise par l'appareil à la date du rembobinage.

Le montant des dommages ainsi évalué est majoré des frais de transport et d'installation. Sauf convention contraire, les frais de transport et d'installation ne sont pris en charge qu'à concurrence d'une somme au plus égale à 15% du montant des dommages, frais de transport et d'installation non compris.

Le montant d'un dommage partiel est estimé au prix de la réparation diminué de la dépréciation, calculée forfaitairement comme indiqué ci-dessus, et de la valeur du sauvetage, l'indemnité ainsi calculée ne pouvant excéder celle qui résulterait de la destruction complète de l'appareil.`,
            style: 'paragraph',
            alignment: 'justify',
            margin: [0, 10, 0, 10]
          },

          { text: 'CAPITAL GARANTI : ASSIETTE DE LA PRIME', style: 'subSectionTitle' },
          {
          
 table: {
  headerRows: 1,
  widths: ['*', '*'],
  body: [
    [
      { text: 'CAPITAL GLOBAL ASSURÉ CONTRE L’INCENDIE', style: 'tableHeader'},
      { text: 'CAPITAL MINIMUM ASSURÉ SUR DOMMAGES ÉLECTRIQUES',style: 'tableHeader'}
    ],
  [{ text: 'Inférieure à 500 000 DT', style: 'domelecTableCell' }, { text: '15% du capital global', style: 'domelecTableCell' }],
    [{ text: 'De 500 000 DT à 1 000 000 DT', style: 'domelecTableCell' }, { text: '12%', style: 'domelecTableCell' }],
    [{ text: 'Supérieure à 1 000 000 DT', style: 'domelecTableCell' }, { text: '120 000 DT', style: 'domelecTableCell' }]
  ]
},
 layout: {
                defaultBorder: true,
                paddingLeft: function() { return 4; },
                paddingRight: function() { return 4; },
                paddingTop: function() { return 2; },
                paddingBottom: function() { return 2; }},
margin: [0, 5, 0, 5]

},

          { text: 'FRANCHISE', style: 'subSectionTitle' },
          {
            text: `Le capital minimum assuré au titre de la présente garantie est fixé comme suit :`,
            style: 'paragraph',
            bold: false,
            alignment: 'justify',
           margin: [0, 0, 0, 0] 
          },
            { text: `
                L’assuré conservera à sa charge par sinistre, et par appareil, une franchise absolue de 100 Dinars.
                Cette franchise sera déduite du montant de l’indemnité qui aurait été versée à l’assuré en l’absence de cette franchise.`,
            style: 'paragraph',
            bold: true,
            alignment: 'justify',
            margin: [0, 0, 0, 20]
          },

          {
            columns: [
              { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0],fontSize:10 },
              { text: 'P / MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0],fontSize:10 }
            ]
          }
        ]
      }
    ]
  : []),

...(data.sections?.some((section: any) =>
    section.garanties?.some((gar: any) => {
      const sousNomGar = gar.sousGarantieNom?.trim() || '';


      const match = sousNomGar.includes('RISQUES SPECIAUX');
      return match;
    })
  )
  ? [
      {
        stack: [
          {
            text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
            style: 'headerCenter',
            pageBreak: 'before'
          },
          { text: 'EXTENSION DE GARANTIE À DES RISQUES SPÉCIAUX', style: 'sectionTitle' },

          {
            text: `La MAE garantit les dommages matériels causés directement aux biens assurés par :`,
            style: 'paragraph',
            margin: [0, 7, 0, 7]
          },
          { text: 'I. TEMPÊTES', style: 'subSectionTitle' },
          {
            text: `La MAE garantit les dommages matériels causés aux biens assurés par :
- Par les tempêtes : action directe du vent ou choc d’un corps projeté, détruisant ou endommageant bâtiments de bonne construction, arbres, et autres objets dans un rayon de 5 km autour du risque assuré. Attestation météorologique obligatoire si contestation.
- Par l'action directe de la grêle sur les toitures. Dommages de mouille inclus si pénétration dans le bâtiment dans les 48 heures suivant le sinistre.`,
            style: 'paragraph',
            alignment: 'justify',
            margin: [0, 3, 0, 5]
          },
          { text: 'EXCLUSIONS', style: 'paragraphCenterBoldUnderline', alignment: 'left', },
          {
            ul: [
              'TOUS LES DOMMAGES AUTRES QUE CEUX DÉFINIS CI-DESSUS, AINSI QUE CEUX OCCASIONNÉS DIRECTEMENT OU INDIRECTEMENT, MEME EN CAS D’ORAGE, PAR TES EAUX DE RUISSELLEMENT DANS LES COURS ET JARDINS, VOIES PUBLIQUES OU PRIVÉES, INONDATIONS, RAZ-DE-MARÉE, MAREES, ENGORGEMENT ET REFOULEMENT DES ÉGOUTS, DÉBORDEMENT DES SOURCES, COURS D’EAU ET PLUS GÉNÉRALEMENT PAR LA MER ET AUTRES PLANS D’EAU NATURELS OU ARTIFICIELS.',
              'LES BÂTIMENTS EN COURS DE CONSTRUCTION OU DE RÉFECTION (À MOINS QU’ILS NE SOIENT ENTIÈREMENT CLOS ET COUVERTS AVEC PORTES ET FENÊTRES PLACÉES À DEMEURE) ET LES BÂTIMENTS OUVERTS SUR UN OU PLUSIEURS CÔTÉS ET PLUS GÉNÉRALEMENT TOUT BÂTIMENT NON ENTIÈREMENT CLOS.',
              'LES BÂTIMENTS DONT LES MURS SONT CONSTRUITS EN TOUT OU PARTIE EN BOIS, CARREAUX DE PLÂTRE, TÔLE ONDULÉE, AMIANTE-CIMENT, MATIÈRES PLASTIQUES, AINSI QUE CEUX DANS LESQUELS LES MATÉRIAUX DURS (PIERRE, BRIQUES, MOELLONS, FER, BÉTON DE CIMENT, PARPAINGS DE CIMENT, MÂCHEFER SANS ADDITION DE BOIS, PAILLE OU AUTRES SUBSTANCES ÉTRANGÈRES) ENTRANT POUR MOINS DE 50 %.',
              'LES BÂTIMENTS DONT LA COUVERTURE COMPORTE, EN QUELQUE PROPORTION QUE CE SOIT, DES PLAQUES OU TÔLES NON ACCROCHÉES, NON BOULONNÉES OU NON TIREFONNÉES.',
              'LES BÂTIMENTS DONT LA COUVERTURE COMPREND PLUS DE 10 % DE MATÉRIAUX TELS QUE CHAUME, BOIS, CARTON ET/OU FEUTRE BITUMÉ NON FIXÉS SUR PANNEAUX OU VOLIGEAGE, TOILE OU PAPIER GOUDRONNÉ, PAILLE, ROSEAUX OU AUTRES VÉGÉTAUX.',
              'LES CLÔTURES DE TOUTE NATURE ET LES MURS D’ENCEINTE, MARQUISES, VÉRANDAS, CONTREVENTS, PERSIENNES, VITRES ET VITRAGES, SERRES ET CHASSIS, VITRAUX ET GLACES, STORES, ENSEIGNES, PANNEAUX-RÉCLAME, BÂCHES EXTÉRIEURES, TENTES, ANTENNES T.S.F., TELEVISION, FILS AÉRIENS ET LEURS SUPPORTS.'
            ].map(text => ({ text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.5,
                style: 'paragraph',}))
          },
        {
            text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
            style: 'headerCenter',
            pageBreak: 'before'
          },

          { text: 'II. FUMÉES', style: 'subSectionTitle' },
          {
            text: `L'assureur garantit les dommages matériels causés aux biens assurés par des fumées dues à une défectuosité soudaine et imprévisible d'un appareil de chauffage ou de cuisine, relié à une cheminée et situé dans l’enceinte des risques spécifiés dans la police.`,
            style: 'paragraph',
            alignment: 'justify'
          },
          { text: 'EXCLUSIONS', style: 'paragraphCenterBoldUnderline', alignment: 'left', },
          {
             ul: [
             `SONT EXCLUS LES DOMMAGES PROVENANT DE FOYERS EXTÉRIEURS ET APPAREILS INDUSTRIELS AUTRES QUE LES APPAREILS DE CHAUFFAGE.`,
              ].map(text => ({ text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.5,
                style: 'paragraph',}))
          },
          { text: 'III. CHUTE D’APPAREILS DE NAVIGATION AÉRIENNE', style: 'subSectionTitle' },
          {
            text: `L'assureur garantit les dommages matériels, y compris incendie et explosion, causés aux objets assurés par le choc ou la chute d'appareils de navigation aérienne.`,
            style: 'paragraph',
            alignment: 'justify'
          },

          { text: 'IV. CHOC D’UN VÉHICULE TERRESTRE', style: 'subSectionTitle' },
          {
            text: `L'assureur garantit les dommages matériels, y compris incendie et explosion, causés aux biens assurés par le choc d'un véhicule terrestre.`,
            style: 'paragraph',
            alignment: 'justify'
          },
          { text: 'EXCLUSIONS', style: 'paragraphCenterBoldUnderline', alignment: 'left', },
          {
            ul: [
              `OCCASIONNÉS PAR TOUT VÉHICULE DONT L'ASSURÉ OU LOCATAIRE EST PROPRIÉTAIRE OU USAGER.`,
              `CAUSÉS AUX ROUTES, PISTES OU PELOUSES.`,
              `SUBIS PAR TOUT VÉHICULE ET SON CONTENU.`
            ].map(text => ({  text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.5,
                style: 'paragraph', }))
          },

          { text: 'LIMITE DE LA GARANTIE', style: 'paragraphCenterBoldUnderline', alignment: 'left', },
          {
            text: `La présente extension est accordée pour une limite de 25% des existences assurées par sinistre et par année d’assurance.`,
            style: 'paragraph',
            alignment: 'justify'
          },

          { text: 'FRANCHISES', style: 'paragraphCenterBoldUnderline', alignment: 'left', },
          {
            text: `L'assuré conservera à sa charge, par sinistre, une franchise égale à 10% des dommages avec un minimum de 1 000 DT et un maximum de 5 000 DT. Cette franchise sera déduite du montant de l'indemnité.`,
            style: 'paragraph',
            alignment: 'justify'
          },

          {
            columns: [
              { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
              { text: 'P / MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
            ]
          }
        ]
      }
    ]
  : []
  ),
  // Vérification si la garantie inondation existe
...(data.sections?.some((section: any) =>
        section.garanties?.some((gar: any) =>
          (gar.sousGarantieNom?.toUpperCase().trim() || '').includes('INNONDATIONS')
        )
      )
        ? [
            {
              text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
              style: 'headerCenter',
              pageBreak: 'before'
            },
            { text: 'GARANTIE INONDATION', style: 'sectionTitle' },
            { text: 'I. OBJET DE LA GARANTIE', style: 'subSectionTitle' },
            {
              text: `Par dérogation à toute autre clause contraire aux Conditions Générales, l'assureur garantit les dommages matériels causés aux biens assurés par les inondations.
Il faut entendre par inondation toute situation temporaire et générale pendant laquelle la zone territoriale dans laquelle sont situés les bâtiments assurés et ses voisins immédiats se trouvant normalement à sec est complètement ou partiellement sous eau ou sous la boue suite à une accumulation d'eaux provenant de :

- Débordement des lacs, rivières et canaux
- La marée
- Vagues ou à de l'eau de mer
- Débordement de corps contenant de l'eau et entourés par des barrages ou des digues
- Mouvement de boue, de rivière ou de fleuve de boue liquide provoqué par l'un des événements cités plus haut
- L'eau pluviale.`,
              style: 'paragraph',
              alignment: 'justify',
              lineHeight: 1.1,
              margin: [0, 2, 0, 5]
            },
            { text: 'II. EXCLUSIONS', style: 'subSectionTitle' },
            {
              ul: [
                'LES DOMMAGES SUBIS PAR LES BIENS SE TROUVANT EN PLEIN AIR ;',
                'LES DOMMAGES MATERIELS RESULTANT DE REFOULEMENT DES EAUX DES CANALISATIONS, D\'EVACUATION ET DES APPAREILS A EFFET D\'EAU DE LA SOCIETE ASSUREE EN DEHORS D\'INONDATION TELLE QUE DEFINIE CI-DESSUS ;',
                'LES DOMMAGES RESULTANT DE L\'EAU DONT L\'ORIGINE SE SITUE A L\'INTERIEUR DU BATIMENT FAISANT L\'OBJET DE LA PRESENTE EXTENSION NOTAMMENT CEUX RESULTANT DES FUITES PROVENANT DES CONDUITES D\'ADDUCTION ET DE DISTRIBUTION D\'EAU, DES CHENAUX ET GOUTTIERES ;',
                'LES DOMMAGES AUX BATIMENTS EN COURS DE CONSTRUCTION OU DE REFECTION (A MOINS QU\'ILS NE SOIENT ENTIEREMENT CLOS ET COUVERT AVEC PORTES ET FENETRES PLACEES A DEMEURE) AINSI QUE CEUX AUX BATIMENTS OUVERTS SUR UN OU PLUSIEURS COTES ET PLUS GENERALEMENT TOUT BATIMENT NON ENTIEREMENT CLOS ;',
                'L\'INFILTRATION D\'EAU AU TRAVERS LES TOITURES.'
              ].map(text => ({  text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.2,
                margin: [0, 0, 0, 10],
                style: 'paragraph', }))
            },
            { text: 'III. LIMITE DE LA GARANTIE', style: 'subSectionTitle' },
            {
              text: `La présente extension est accordée pour une limite de 25% des existences assurées par sinistre et par année d’assurance.`,
              style: 'paragraph',
              alignment: 'justify'
            },
          
            { text: 'IV. FRANCHISE', style: 'subSectionTitle' },
            {
              text: `L'assuré conservera à sa charge, par sinistre une franchise égale à 10% des dommages avec un minimum de Mille Dinars (1 000DT) par sinistre et un maximum de Cinq Mille Dinars (5 000DT) par sinistre.
Cette franchise sera déduite du montant de l'indemnité qui aurait été versée à l'assuré sans l'existence de la dite franchise.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            {
              columns: [
                { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
                { text: 'P / MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
              ]
            }
          ]
        : []),

...(data.sections?.some((section: any) =>
        section.garanties?.some((gar: any) =>
          (gar.sousGarantieNom?.toUpperCase().trim() || '').includes('TREMBLEMENT DE TERRE')
        )
      )
        ? [
            {
              text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
              style: 'headerCenter',
              pageBreak: 'before'
            },
            { text: ' EXTENSION DE GARANTIE AUX TREMBLEMENTS DE TERRE', style: 'sectionTitle', alignment: 'center' },
            {
              text: `La présente extension de garantie, ou toute modification des garanties en cours, ne sera considérée comme acquise, que si le lieu de situation des biens garantis n'est pas l'objet, au moment de la demande par l'assuré, d'un avis d'alerte émanant des services compétents, ou de tout organisme en tenant lieu.

Les Conditions Générales et Particulières qui régissent la garantie « Incendie » sont également applicables à la garantie « Tremblement de terre » pour autant qu'elles ne sont pas contraires aux dispositions du présent intercalaire.`,
              style: 'paragraph',
              alignment: 'justify',
              margin: [0, 2, 0, 5]
            },
            { text: 'I. OBJET ET ETENDUE DE LA GARANTIE', style: 'subSectionTitle' },
            {
              ul: [
                `Par dérogation aux Conditions Générales et moyennant une prime distincte, l'assureur garantit les dommages matériels, y compris ceux d'incendie et/ ou d'explosion, causés directement aux biens assurés au titre du contrat auquel est annexée la présente convention.`,
                `Par un tremblement de terre, c'est à dire l'ensemble des phénomènes liés à la déformation de l'écorce terrestre en un lieu, dans la mesure où ils sont perçus par la population et/ ou par les sismographes.`,
                `Par une éruption volcanique.`,
                `Ou par un raz-de-marée, s'il est consécutif à un tremblement de terre ou à une éruption volcanique, sous réserve qu'un certain nombre de bâtiments soient détruits ou endommagés à l'occasion du même événement.`,
                `Le choc sismique initial et les répliques survenant dans un délai de 72 heures sont considérés comme constituant un seul et même tremblement de terre.`
              ].map(text => ({  text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.2,
                style: 'paragraph', }))
            },
            { text: 'II. LIMITE DE LA GARANTIE', style: 'subSectionTitle' },
            {
              text: `La présente extension est accordée pour une limite de 25% des existences assurées par sinistre et par année d’assurance.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            { text: 'II. FRANCHISE', style: 'subSectionTitle' },
            {
              text: `L'assuré conservera à sa charge, par sinistre et par établissement, une franchise égale à 10% des dommages avec un minimum de Mille Dinars (1 000DT) par sinistre et un maximum de Cinq Mille Dinars (5 000DT) par sinistre.
Cette franchise sera déduite du montant de l'indemnité qui aurait été versée à l'assuré sans l'existence de ladite franchise.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            {
              columns: [
                { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
                { text: 'P/MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
              ]
            }
          ]
        : []),
...(data.sections?.some((section: any) =>
        section.garanties?.some((gar: any) =>
          (gar.sousGarantieNom?.trim() || '').includes('Greves Emeutes Mouvements Poulaires')
        )
      )
        ? [
            {
              text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
              style: 'headerCenter',
              pageBreak: 'before'
            },
            { text: 'GREVES, EMEUTES, MOUVEMENTS POPULAIRES (DOMMAGES MATERIELS Y COMPRIS CEUX D\'INCENDIE OU D\'EXPLOSION)', style: 'sectionTitle',  alignment: 'center' },
            
            {
  text: `L'assureur garantit les dommages matériels directs (y compris ceux d'incendie et/ou d'explosion) causés aux biens assurés et directement occasionnés ou découlant d’actes commis par des personnes ou des groupes de personnes prenant à des actes de Terrorisme et/ou de Sabotage (ATS), des Grèves et/ou des émeutes et/ou des mouvements populaires (GEMP), aux conditions de prime, franchise et limite telles qu’elles sont fixées aux Conditions Particulières :

Pour l'application de cette annexe, il faut entendre par dommage matériel résultant d’actes de terrorisme et de sabotage, de grèves, émeutes ou mouvements populaires les dommages ou pertes subis au niveau d’un bâtiment ou d’autres biens assurés, et directement occasionnés par :`,
  style: 'paragraph',
  alignment: 'justify',
  margin: [0, 2, 0, 5]
},
{
  ul: [
    'Tout acte commis dans le cadre d’actes de terrorisme et de sabotage, de grèves, émeutes et mouvements populaires entraînant un trouble de l’ordre public par quiconque y prend part ;',
    'Tout acte délibéré d’un gréviste ou d’un employé dans le cadre d’une grève, que cet acte ait été ou non commis au cours d’un trouble de l’ordre public ;',
    'Tout acte d’une autorité légalement constituée dans le but d’endiguer, de prévenir, de faire cesser ou de minimiser les conséquences de ces actes, ou visant à empêcher la réalisation d’un acte listé aux deux alinéas précédents ou à en minimiser les conséquences.'
  ].map(text => ({ text, style: 'paragraph', alignment: 'justify' ,margin: [0, 0, 0, 0.5]}))
},
{
  text: `Il est toutefois convenu que la définition des trois derniers ne vaut aucunement renonciation ou dérogation relative aux exclusions en matière des risques liés aux actes de Guerre, de Terrorisme, e Sabotage, de grèves, Emeutes et mouvements populaires contenu dans la présente convention, lorsque les évènements GEMP prennent les dimensions d’un soulèvement populaire tel que prévu dans le 3ème point des exclusions, ou lorsqu’ils entraînent la réalisation de l’un des évènements prévus au point 4 de l’annexe.  

Si l’Assureur allègue qu’en raison du présent avenant, une perte, un dommage, des frais ou dépenses ne sont pas couverts par la présente convention, la charge de la preuve contraire incombera à l’assuré.`,
  style: 'paragraph',
  alignment: 'justify',
  margin: [0, 2, 0, 5]
},
            { text: 'I. EXCLUSIONS', style: 'subSectionTitle' },
            {
              ul: [
                'GUERRE, GUERRE CIVILE OU ETAT DE GUERRE, QUE LA GUERRE AIT ETE DECLAREE OU NON, INVASION, ACTES QUELCONQUES D’ENNEMIS ETRANGERS, HOSTILITES OU ACTES EQUIVALENTS A DES OPERATIONS DE GUERRE ;',
                'MUTINERIE, SOULEVEMENT POPULAIRE, PUTSCH MILITAIRE, INSURRECTION, REBELLION, REVOLUTION, MUTINERIE, PRISE DE POUVOIR PAR DES MILITAIRES OU DES USURPATEURS ;',
                'MOUVEMENTS POPULAIRES PRENANT LES PROPORTIONS D’UN SOULEVEMENT POPULAIRE ;',
                'PROCLAMATION DE LA LOI MARTIALE, ETAT DE SIEGE OU ETAT D’URGENCE AINSI QUE TOUT EVENEMENT OU CAUSE CONDUISANT A LA PROCLAMATION OU AU MAINTIEN DE LA LOI MARTIALE OU D’UN ETAT DE SIEGE, OU ENTRAINANT UN CHANGEMENT DE GOUVERNEMENT OU DE CHEF D’ETAT ;',
                 'EXPROPRIATION DEFINITIVE OU PROVISOIRE PAR SUITE DE CONFISCATION, REQUISITION ORDONNEE PAR TOUTE AUTORITE PUBLIQUE ;',
                
                 ].map(text => ({
    text,
    bold: true,
    alignment: 'justify',
    lineHeight: 1.2,
    style: 'paragraph',
  }))
},
{
  stack: [
    {
      text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
      style: 'headerCenter',
      pageBreak: 'before'
    },
    { text: 'I. EXCLUSIONS', style: 'subSectionTitle' }
  ]
},
// Suite des exclusions
{
  ul: [
                'ACTE DE QUELQUES NATURES QUE CE SOIT VISANT A RENVERSER OU INFLUENCER TOUT OU PARTIE DU GOUVERNEMENT OU DES AUTORITES LOCALES, PAR UN RECOURS A LA FORCE, A LA PEUR OU A LA VIOLENCE ET PRENANT LA DIMENSION D’UNE REVOLUTION ;',
                'PERTES, DOMMAGES, FRAIS ET DEPENSES OCCASIONNEES DIRECTEMENT OU INDIRECTEMENT, PAR CONTAMINATION CHIMIQUE OU BIOLOGIQUE OU MISSILES, BOMBES, GRENADES, EXPLOSIFS OU N’IMPORTE QUELLE MUNITION ;',
                 'LES DOMMAGES IMMATERIELS NOTAMMENT LES PERTES FINANCIERES, LES PERTES D’EXPLOITATION, LES PERTES INDIRECTES, LES PERTES D’USAGE, LA PRIVATION DE JOUISSANCE, LES PERTES DE LOYERS, LES PERTES DE MARCHE ;',
                'LES DOMMAGES CAUSES AUX VERRES, VITRES OU GLACES FAISANT PARTIE DU BATIMENT A MOINS QU\'ILS NE SOIENT DUS A UN INCENDIE OU A UNE EXPLOSION ;',
                'TOUT VOL AVEC OU SANS EFFRACTION, PILLAGE, MISE A SAC ET CAMBRIOLAGES ;',
                'LES PERTES DE LIQUIDES ;',
                'EXPROPRIATION DEFINITIVE OU PROVISOIRE PAR SUITE DE CONFISCATION, REQUISITION ORDONNEE PAR TOUTE AUTORITE PUBLIQUE ;',
                'PERTES, DOMMAGES, FRAIS ET DEPENSES OCCASIONNEES DIRECTEMENT OU INDIRECTEMENT, PAR CONTAMINATION CHIMIQUE OU BIOLOGIQUE OU MISSILES, BOMBES, GRENADES, EXPLOSIFS OU N’IMPORTE QUELLE MUNITION ;',
                'LES DOMMAGES CAUSES AUX VERRES, VITRES OU GLACES FAISANT PARTIE DU BATIMENT A MOINS QU\'ILS NE SOIENT DUS A UN INCENDIE OU A UNE EXPLOSION ;',
                'LES DOMMAGES AUTRES QUE CEUX D’INCENDIE OU D’EXPLOSIONS CAUSES AUX MARCHANDISES REFRIGEREES PAR L’INTERRUPTION DE FONCTIONNEMENT DE L’INSTALLATION FRIGORIFIQUE.'
              ].map(text => ({  text,
                bold: true,
                alignment: 'justify',
                lineHeight: 1.2,
                margin: [0, 0, 0, 10],
                style: 'paragraph', }))
            },
            { text: 'II. DISPOSITIONS SPECIALES EN CAS DE SINISTRE', style: 'subSectionTitle' },
            {
              text: `L'assuré s'engage, en cas de sinistre, à accomplir dans les délais réglementaires auprès des Autorités, les démarches relatives à l'indemnisation prévue par la législation en vigueur.
L'indemnité à la charge de l'Assureur ne sera versée à l'Assuré que sur le vu du récépissé délivré par l'autorité compétente.
Dans le cas où, l'Assuré serait appelé à recevoir une indemnité de la part des autorités pour les dommages causés aux biens qui font l'objet de la présente garantie, il s'engage à signer une délégation au profit de l'Assureur jusqu'à concurrence des sommes qui lui auront été versées par l'assureur au titre de la présente extension.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            { text: 'III. RESILIATION', style: 'subSectionTitle' },
            {
              text: `Indépendamment des autres cas de résiliation prévus au contrat, l’Assureur et l’Assuré se réservent la faculté de résilier la présente extension de garantie à tout moment.
La résiliation prendra effet sept jours après réception par l’assuré ou l’Assureur d’une notification faite par lettre recommandée ou par acte extrajudiciaire.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            { stack: [
    {
      text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
      style: 'headerCenter',
      pageBreak: 'before'
    },
    { text: 'IV. LIMITE DE GARANTIE', style: 'subSectionTitle' },
  ]
},
           
            {
              text: `Il est expressément convenu entre les parties que l’extension de garantie, telle que définie au chapitre « Garantie » faisant l’objet de la présente annexe, est accordée suivant les conditions générales et particulières qui régissent le contrat de base ci-dessus référencé. Les garanties du présent avenant sont obligatoirement limitées à 25% des existences assurées.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            { text: 'v. FRANCHISE', style: 'subSectionTitle' },
            {
              text: `L'assuré conservera à sa charge, par sinistre et par établissement, une franchise égale à 10% du montant des dommages matériels directs subis avec un minimum de 5 000 dinars et un maximum de 75 000 dinars.
Cette franchise sera déduite du montant de l'indemnité qui aurait été versée à l'assuré en l'absence de cette franchise.`,
              style: 'paragraph',
              alignment: 'justify'
            },
            {
              columns: [
                { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
                { text: 'P/MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
              ]
            }
          ]
        : []),
...(data.sections?.some((section: any) =>
        section.garanties?.some((gar: any) =>
          (gar.sousGarantieNom?.trim() || '').includes('Pertes Indirectes')
        )
      )
        ? [
            {
              text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
              style: 'headerCenter',
              pageBreak: 'before'
            },
            { 
              text: 'PERTES INDIRECTES', 
              style: 'sectionTitle', 
              alignment: 'center' 
            },
            {
              ol: [
                {
                  text: "L'assureur garantit l'assuré contre les pertes indirectes qu'il peut être amené à supporter à la suite d'un sinistre incendie ou explosions ayant causé aux biens assurés des dommages couverts par la présente extension. Cette garantie ne s'applique en aucun cas aux risques suivants :",
                  style: 'paragraph',
                  alignment: 'justify'
                },
                {
                  ul: [
                    'Risque de responsabilité',
                    'Aux garanties des accidents d\'origine électrique aux appareils électriques',
                    'Tempêtes, ouragans, cyclones, grêle et neige sur les toitures',
                    'Des attentats et des risques de grèves, émeutes, mouvements populaires, actes de terrorisme et de sabotage, tremblement de terre, choc d\'un véhicule terrestre, chute d\'appareils de navigation aérienne, inondation et dégâts des eaux'
                  ].map(text => ({ text, style: 'paragraph', alignment: 'justify' }))
                },
                "En cas de sinistre, l'assureur paiera à l'assuré une somme égale au pourcentage convenu aux conditions particulières de l'indemnité qui lui sera versée au titre du contrat auquel est annexée la présente extension pour les dommages causés aux bâtiments, matériels et marchandises.",
                "La garantie des pertes indirectes sera de plein droit suspendue pendant le chômage ou la Cessation d'affaires de l'établissement assuré et l'assuré aura alors droit au remboursement de la portion de prime afférente à la période de suspension. Toutefois, l'indemnité sera due si le sinistre survient pendant une période de chômage où l'assuré continue à payer son personnel et si cette période n'excède pas une durée de 30 jours sans interruption."
              ].map(item => typeof item === 'string' ? { text: item, style: 'paragraph', alignment: 'justify' } : item)
            },
            {
              columns: [
                { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
                { text: 'P/MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
              ]
            }
          ]
        : []),
...(data.sections?.some((section: any) =>
        section.garanties?.some((gar: any) =>
          (gar.sousGarantieNom?.trim() || '').includes('Honoraires d\'Expert')
        )
      )
        ? [
            {
              text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
              style: 'headerCenter',
              pageBreak: 'before'
            },
            { 
              text: 'CLAUSE REMBOURSEMENT DES HONORAIRES', 
              style: 'sectionTitle', 
              alignment: 'center' 
            },
            {
  text: `Moyennant le payement d'une prime additionnelle et mention expresse aux conditions particulières, l'assureur garantit à l'assuré, en cas de sinistre, le remboursement des frais et honoraires de l'expert qu'il aura lui-même choisi. 
Cette garantie est accordée à concurrence d'une limitation contractuelle d'indemnité par année d'assurance telle qu'elle est fixée aux conditions particulières. 
Le montant de ce remboursement sera limité à 50% du montant des honoraires résultant de l'application du barème de la Fédération Tunisienne des Sociétés d'Assurances (FTUSA) pour les experts en Incendie et Risques Divers. 
Il est bien entendu que le remboursement ne dépassera pas 50% du montant des honoraires réellement payés si ces derniers sont inférieurs à ceux résultant du barème FTUSA. 
La présente extension s’applique exclusivement aux sinistres dépassant 10.000 dinars.`,
  style: 'paragraph',
  alignment: 'justify',
  margin: [0, 2, 0, 5]
},
            {
              columns: [
                { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
                { text: 'P/MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
              ]
            }
          ]
        : []),
...(data.sections?.some((section: any) =>
        section.garanties?.some((gar: any) =>
          (gar.sousGarantieNom?.trim() || '').includes('Frais de Deblais et Demolition')
        )
      )
        ? [
            {
              text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
              style: 'headerCenter',
              pageBreak: 'before'
            },
            { 
              text: 'FRAIS DE DEBLAIS ET DE DEMOLITION', 
              style: 'sectionTitle', 
              alignment: 'center' 
            },
            {
              ul: [
                "L'assureur garantit à l'assuré le remboursement des frais de déblais et de démolition auxquels il serait exposé à l’occasion des mesures préparatoires rendues nécessaires par la mise en état des biens sinistrés dont le montant n'excéderait pas 5% de l'indemnité payée pour dommages d'incendie et d'explosions subis par les biens assurés, sans que l'indemnité totale (frais de déblais et de démolition inclus) puisse excéder le montant du capital assuré sur les dits biens.",
                "Par dérogation aux Conditions Générales et nonobstant toutes conditions particulières contraires, il est convenu entre les parties, que les capitaux garantis sur frais de démolition et de déblais dans les conditions définies ci-dessus ne pourront en aucun cas être reportés, en cas de sinistre, sur les autres articles du contrat."
              ].map(text => ({ text, style: 'paragraph', alignment: 'justify' }))
            },
            {
              columns: [
                { text: 'Le Souscripteur', alignment: 'left', margin: [0, 20, 0, 0], fontSize: 10 },
                { text: 'P/MAE Assurances', alignment: 'right', margin: [0, 20, 0, 0], fontSize: 10 }
              ]
            }
          ]
        : []),

        {
          stack: [
             { 
            text: `Annexe au Contrat N° : ${data.adherent.codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
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
          margin: [0, 10, 0, 10],
          decoration: 'underline',
          lineHeight: 1.2
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
        subSectionTitleCenter: { fontSize: 11, bold: true, alignment: 'center', margin: [0, 5, 0, 5] },
        subSectionTitle: { 
          fontSize: 10, 
          bold: true, 
          color: '#000000',
          margin: [0, 15, 0, 10],
          lineHeight: 1.2
        },
        paragraph: {
          fontSize: 9,
          color: '#000000',
          margin: [0, 5, 0, 10],
          lineHeight: 1.3,
          alignment: 'justify'
        },
        infoText: {
          fontSize: 9,
          color: '#000000',
          margin: [0, 3, 0, 3],
          lineHeight: 1.2
        },
        noteText: {
          fontSize: 8,
          color: '#666666',
          margin: [0, 3, 0, 3],
          lineHeight: 1.2,
          fontStyle: 'italic'
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
          fontSize: 8,
          bold: true,
          color: '#000000',
          alignment: 'center',
          fillColor: '#f5f5f5'
        },
        tableCell: {
          fontSize: 7,
          color: '#000000',
          alignment: 'left'
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

    return new Promise((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition as TDocumentDefinitions);
        pdfDocGenerator.getBlob((blob: Blob) => resolve(blob));
      } catch (error) {
        reject(error);
      }
    });
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
    const primeTTC = data.primeTTC;
const primeAvecTaxes = (primeNetteTotale + frais) * (taxes); 
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
        // EN-TÊTE DANS UN CADRE - COMME LA PREMIÈRE PAGE
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { 
                      text: `Annexe au Contrat N° :${data.adherent.codeId || '-'}/${data.service|| '-'}/ ${data.numPolice || '-'}`, 
                      style: 'headerCenter',
                      alignment: 'center'
                    },
                  ],
                  border: [true, true, true, true], // Bordures sur les 4 côtés
                  margin: [10, 10, 10, 10],
                  fillColor: '#f8f8f8' // Fond gris clair optionnel
                }
              ]
            ]
          },
          layout: {
            defaultBorder: true, // Activer les bordures
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0
          },
          pageBreak: 'before', // Saut de page avant cette section
          margin: [0, 0, 0, 30] // Marge en bas
        },
        { 
          text: 'COTISATION ANNUELLE', 
          style: 'sectionTitle',
          margin: [0, 10, 0, 10]
        },
        {
           table: {
              headerRows: 1,
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

      ]
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

    if (data.sections) {
      data.sections.forEach((section: any) => {
        if (section.garanties) {
          section.garanties.forEach((garantie: any) => {
            primeTotale += garantie.primeNET || 0;
          });
        }
      });
    }

  if (data.rcConfigurations) {
  data.rcConfigurations.forEach((rc: any, index: number) => {
    const nbSituations = rc.sectionIds?.length || 0;
    const primeRC = Number(rc.primeNET || 0) * nbSituations;
    primeTotale += primeRC;
  });
}

return primeTotale;}


private prepareClausesCommunes(data: any): any[] {
  const codeId = data?.adherent?.codeId || '-';
const service = data?.service || '-';
const numPolice = data?.numPolice || '-';
    const headerClause = {
        text: `Annexe au Contrat N° : ${codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`,
        style: 'headerCenter',
       pageBreak: 'before' 
    };

    return [
        // CLAUSE 1 : La règle proportionnelle
        {
            stack: [
                headerClause,
                { text: 'CLAUSES COMMUNES', style: 'clauseTitle' },
                { text: 'La règle proportionnelle', style: 'clauseTitle' },
                { 
                    text: 'Indemnité réduite = dommage X valeur déclarée / valeur assurable',
                    style: 'clauseText',
                    bold: true
                },
                { 
                    text: '1. Cas du sinistre total :',
                    style: 'clauseText',
                    bold: true,
                    margin: [0, 10, 0, 5]
                },
                { 
                    text: 'Un bien a une valeur déclarée de 30 000 dinars au jour du sinistre. Il n\'a été déclaré que pour une valeur de 20 000 dinars. La garantie de l\'assureur est limitée à la somme assurée. D\'où l\'indemnité = 30 000 x 20 000 / 30 000 = 20 000 dinars',
                    style: 'clauseText'
                },
                { 
                    text: '2. Cas du sinistre partiel :',
                    style: 'clauseText',
                    bold: true,
                    margin: [0, 10, 0, 5]
                },
                { 
                    text: 'S\'il y a sinistre partiel par exemple le bien n\'a été détruit que pour une partie, le dommage n\'est donc que de 15 000 dinars. Indemnité = 15 000 x 20 000 / 30 000 = 10 000 dinars',
                    style: 'clauseText'
                },
                { text: 'Le Souscripteur', style: 'souscripteur' }
            ]
        },

        // CLAUSE 2 : INSTALLATION ELECTRIQUES ORDINAIRES CONTROLEES
        {
            stack: [
                { text: `Annexe au Contrat N° : ${codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`, style: 'headerCenter', pageBreak: 'before' },
                { text: 'INSTALLATION ELECTRIQUES ORDINAIRES CONTROLEES', style: 'clauseTitle'},
                { 
                    text: 'L\'adhérent déclare que :',
                    style: 'clauseText',
                    bold: true
                },
                { 
                    text: 'a. Les installations électriques de forces et lumière sont conformes aux normes en vigueur ou à défaut aux règles de l\'Art ;',
                    style: 'clauseText'
                },
                { 
                    text: 'b. Les installations sont vérifiées une fois au moins par an par un organisme agréé ;',
                    style: 'clauseText'
                },
                { 
                    text: 'Bien entendu, chaque vérification doit porter sur la totalité des installations électriques soumise à cette vérification (circuits et matériels) et ne doit pas être limitée à des sondages.',
                    style: 'clauseText',
                    margin: [0, 5, 0, 10]
                },
                { 
                    text: 'L\'adhérent s\'engage :',
                    style: 'clauseText',
                    bold: true
                },
                { 
                    text: '1. À fournir, à l\'assureur un exemplaire des rapports annuels complets de vérification de ses installations électriques, établis par l\'organisme vérificateur',
                    style: 'clauseText'
                },
                { 
                    text: '2. À exécuter dans un délai maximal de trois mois les travaux d\'entretien ou les modifications qui auront été portés sur le rapport établi après la vérification',
                    style: 'clauseText'
                },
                { 
                    text: '3. À mettre les organes de protection générale (coupe-circuit ou disjoncteurs) hors d\'atteinte des personnes non qualifiées en les plaçant dans un local, une armoire, un coffret ou tout autre enceinte fermée à clé, et à ne confier la clé qu\'au personnel qualifié et responsable chargé du remplacement des fusibles ou du réarmement des relais des disjoncteurs',
                    style: 'clauseText'
                },
                { 
                    text: '4. À faire couper le courant force à la fermeture des ateliers. Pourra toutefois rester sous tension un circuit spécial alimentant uniquement les appareils à fonctionnement continu, mais seulement pendant le temps où il est nécessaire que ces appareils soient en fonctionnement.',
                    style: 'clauseText'
                },
                { text: 'Le Souscripteur', style: 'souscripteur' }
            ]
        },

        // CLAUSE 3 : EXTINCTEURS MOBILES
        {
            stack: [
                { text: `Annexe au Contrat N° : ${codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`, style: 'headerCenter', pageBreak: 'before' },
                { text: 'EXTINCTEURS MOBILES', style: 'clauseTitle'},
                { 
                    text: 'L\'adhérent déclare que :',
                    style: 'clauseText',
                    bold: true
                },
                { 
                    text: '1. Son établissement est pourvu d\'une installation d\'extincteurs mobiles mise en place conformément aux normes en vigueur par un installateur agréé.',
                    style: 'clauseText'
                },
                { 
                    text: '2. Il a pris connaissance de ces normes et s\'engage à s\'y conformer, notamment en ce qui concerne :',
                    style: 'clauseText'
                },
                { 
                    text: '• La qualité minimale de produits extincteurs',
                    style: 'clauseText',
                    margin: [10, 0, 0, 0]
                },
                { 
                    text: '• Le nombre minimum d\'appareils et leur emplacement',
                    style: 'clauseText',
                    margin: [10, 0, 0, 0]
                },
                { 
                    text: '• L\'entretien du matériel',
                    style: 'clauseText',
                    margin: [10, 0, 0, 0]
                },
                { 
                    text: '• L\'entrainement du personnel',
                    style: 'clauseText',
                    margin: [10, 0, 0, 5]
                },
                { 
                    text: '3. L\'installation est vérifiée au moins une fois par an par un organisme agréé ou par le fournisseur.',
                    style: 'clauseText'
                },
                { 
                    text: 'Faute par l\'adhérent de se conformer à ces déclarations, il sera fait application d\'une majoration du taux de la prime incendie de 10%.',
                    style: 'clauseText',
                    margin: [0, 10, 0, 0]
                },
                { text: 'Le Souscripteur', style: 'souscripteur' }
            ]
        },

        // CLAUSE 4 : INTERDICTION DE FUMER
        {
            stack: [
                { text: `Annexe au Contrat N° : ${codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`, style: 'headerCenter', pageBreak: 'before' },
                { text: 'INTERDICTION DE FUMER', style: 'clauseTitle'},
                { 
                    text: 'L\'adhérent déclare que :',
                    style: 'clauseText',
                    bold: true
                },
                { 
                    text: 'II est formellement interdit de fumer dans toutes les parties de l\'établissement assuré (ou contenant des objets assurés) à la seule exception des locaux à usage d\'habitation, bureaux, réfectoires, cantines, salles des chaudières, ateliers séparés à usage d\'entretien mécanique ou des locaux exclusivement à usage de fumoirs.',
                    style: 'clauseText'
                },
                { 
                    text: 'Cette interdiction est signalée par des écriteaux judicieusement répartis à l\'intérieur et à l\'extérieur des locaux et l\'adhérent s\'engage à prendre toutes mesures en son pouvoir pour la faire respecter.',
                    style: 'clauseText'
                },
                { text: 'Le Souscripteur', style: 'souscripteur' }
            ]
        },

        // CLAUSE 5 : BALAYAGE QUOTIDIEN
        {
          stack: [
    { text: `Annexe au Contrat N° : ${codeId || '-'}/${data.service || '-'}/${data.numPolice || '-'}`, style: 'headerCenter', pageBreak: 'before' },
    { text: 'BALAYAGE QUOTIDIEN', style: 'clauseTitle' },
    { 
        text: 'L\'adhérent déclare que :',
        style: 'clauseText',
        bold: true
    },
    {
        stack: [
            {
                text: 'Une fois au moins par journée de travail, les ateliers et magasins sont balayés et tous déchets et balayures sont transportés :',
                style: 'clauseText'
            },
            {
                ul: [
                    'Soit au dehors à plus de 10m de ces ateliers ou magasins.',
                    'Soit dans un local spécial contigu sans aucune communication avec les ateliers et magasins.'
                ],
                style: 'clauseText'
            }
        ]
    },
    { text: 'Le Souscripteur', style: 'souscripteur' }
]

        }
    ];
}

private prepareTableauxGaranties(sections: any[]): any[] {
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

  const allSectionsContent: any[] = [];

  sections.forEach((section, index) => {
    const situationLabel = `Situation ${String.fromCharCode(65 + index)}`;
    const garanties = section.garanties || [];

    if (garanties.length === 0) {
      allSectionsContent.push({
        stack: [
          { 
            text: `GARANTIES - ${situationLabel}`, 
            style: 'garantieSectionTitle'
          },
          { 
            text: `Situation : ${section.identification || '-'}`, 
            style: 'garantieSubSectionTitle'
          },
          { text: 'Aucune garantie', style: 'paragraph', alignment: 'center' }
        ]
      });
      return;
    }

    const lignesGaranties = garanties.map((garantie: any) => [
      { 
        text: garantie.sousGarantieNom || garantie.sousGarantieId || '-', 
        style: 'garantieTableCell' 
      },
      { 
        text: this.formatMontant(garantie.capitale), 
        style: 'garantieTableCellRight' 
      },
        { 
        text: this.formatFranchise(garantie.franchise, garantie.hasFranchise), 
        style: 'garantieTableCellCenter' 
      },
      { 
        text: this.formatMontant(garantie.minimum), 
        style: 'garantieTableCellRight' 
      },
      { 
        text: this.formatMontant(garantie.maximum), 
        style: 'garantieTableCellRight' 
      },
  
      { 
        text: this.formatMontant(garantie.primeNET), 
        style: 'garantieTableCellRight' 
      }
    ]);

    allSectionsContent.push({
      stack: [
        { 
          text: `GARANTIES - ${situationLabel}`, 
          style: 'garantieSectionTitle'
        },
        { 
          text: `Situation : ${section.identification || '-'}`, 
          style: 'garantieSubSectionTitle'
        },
        {
          table: {
            headerRows: 2, // Deux lignes d'en-tête
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              // Première ligne d'en-tête (principale)
              [
                { text: 'Garantie', style: 'garantieTableHeader', rowSpan: 2, alignment: 'center', verticalAlignment: 'middle' },
                { text: 'Capital assuré (DT)', style: 'garantieTableHeader', rowSpan: 2, alignment: 'center', verticalAlignment: 'middle' },
                { text: 'Franchise', style: 'garantieTableHeader', colSpan: 3, alignment: 'center', verticalAlignment: 'middle' },
                {}, // Colonne vide pour le colspan
                {}, // Colonne vide pour le colspan
                { text: 'Prime nette (DT)', style: 'garantieTableHeader', rowSpan: 2, alignment: 'center', verticalAlignment: 'middle' }
              ],
              // Deuxième ligne d'en-tête (sous-colonnes pour Franchise)
              [
                {}, // Vide (déjà couvert par Garantie)
                {}, // Vide (déjà couvert par Capital assuré)
                { text: 'Taux (%)', style: 'garantieTableHeader', alignment: 'center' },
                { text: 'Minimum (DT)', style: 'garantieTableHeader', alignment: 'center' },
                { text: 'Maximum (DT)', style: 'garantieTableHeader', alignment: 'center' },
                {} // Vide (déjà couvert par Prime nette)
              ],
              // Données
              ...lignesGaranties
            ]
          },
          layout: {
            defaultBorder: true,
            paddingLeft: function() { return 5; },
            paddingRight: function() { return 5; },
            paddingTop: function() { return 3; },
            paddingBottom: function() { return 3; }
          },
          margin: [0, 0, 0, 25]
        }
      ]
    });
  });

  return allSectionsContent;
}

private formatMontant(montant: any): string {
 if (montant === null || montant === undefined || montant === '' || isNaN(montant) || montant === 0) {
    return '-';
  }

  // 🔥 On travaille uniquement en STRING pour éviter les erreurs de flottants
  const montantStr = montant.toString();

  // 🔥 Séparer les 3 derniers chiffres (millimes)
  const millimesStr = montantStr.slice(-3);
  const entierStr = montantStr.slice(0, -3) || '0';

  // 🔥 Formater les milliers avec "."
  const entierFormate = entierStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // 🔥 Format final
  const montantFormate = `${entierFormate},${millimesStr}`;

  // Convertir en nombres réels pour la conversion en lettres
  const entierNumber = parseInt(entierStr, 10);
  const millimesNumber = parseInt(millimesStr, 10);

  // 🔥 Montant en lettres : dinars
  let dinarsEnLettres = this.nombreEnToutesLettres(entierNumber);

  // 🔥 Montant en lettres : millimes
  let millimesEnLettres = '';
  if (millimesNumber > 0) {
    millimesEnLettres = ' et ' + this.nombreEnToutesLettres(millimesNumber) + ' millimes';
  }

  // 🔥 Phrase complète
  let montantEnLettres =
    dinarsEnLettres + ' dinars' + millimesEnLettres;

  // 🔥 Majuscule au début
  montantEnLettres =
    montantEnLettres.charAt(0).toUpperCase() + montantEnLettres.slice(1);

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
    return [
      {
        stack: [
          { text: 'RESPONSABILITÉ CIVILE EXPLOITATION', style: 'sectionTitle', pageBreak: 'before' },
          { text: 'Aucune configuration de responsabilité civile disponible', style: 'paragraph', alignment: 'center' }
        ]
      }
    ];
  }

  // Section avec l'objet de garantie (affiché une seule fois)
  const sectionObjetGarantie = {
    stack: [
      { text: 'RESPONSABILITÉ CIVILE EXPLOITATION', style: 'sectionTitle', pageBreak: 'before' },
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

    return {
      stack: [

        // Situations couvertes
        { text: 'Situations de risque couvertes :', style: 'subSectionTitle' },
        { text: situationsCouvertes, style: 'paragraph', margin: [0, 0, 0, 15] },

        // Tableau RC
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Couvertures', style: 'rcTableHeader' },
                { text: 'Limite annuelle (DT)', style: 'rcTableHeader' },
                { text: 'Limite par sinistre (DT)', style: 'rcTableHeader' },
                { text: 'Franchise (%)', style: 'rcTableHeader' }
              ],
              [
                { text: 'Dommages corporels', style: 'rcTableCell', border: [true, true, true, false] },
                { text: this.formatMontant(rcConfig.limiteAnnuelleDomCorporels), style: 'rcTableCellRight', border: [true, true, true, false] },
                { text: '\n' + this.formatMontant(rcConfig.limiteParSinistre) + '\n', style: 'rcTableCellRight', rowSpan: 2, border: [true, true, true, true] },
                { text: '\n' + this.formatFranchise(rcConfig.franchise,true) + '\n', style: 'rcTableCellRight', rowSpan: 2, border: [true, true, true, true] }
              ],
              [
                { text: 'Dommages matériels', style: 'rcTableCell', border: [true, false, true, true] },
                { text: this.formatMontant(rcConfig.limiteAnnuelleDomMateriels), style: 'rcTableCellRight', border: [true, false, true, true] },
                { text: '', border: [false, false, false, false] },
                { text: '', border: [false, false, false, false] }
              ]
            ]
          },
          layout: {
            hLineWidth: (i: number) => (i === 1 ? 0.5 : 1),
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 3,
            paddingBottom: () => 3
          },
          margin: [0, 0, 0, 20]
        },

        // Section Exclusions avec gestion de pagination
        ...(exclusionsTextes.length > 0
          ? [
              { text: 'Exclusions :', style: 'subSectionTitle' },
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

// NOUVELLE MÉTHODE pour gérer les exclusions RC
private prepareRCExclusionsContent(exclusionsTextes: string[]): any[] {
  if (!exclusionsTextes || exclusionsTextes.length === 0) {
    return [];
  }

  // Si la liste est courte, on retourne simplement la liste
  if (exclusionsTextes.length <= 8) { // Ajustez ce nombre selon vos besoins
    return [{
      ul: exclusionsTextes.map((text: string) => ({
        text: text,
        alignment: 'justify',
        lineHeight: 1.5,
        bold: true,
        style: 'paragraph',
        margin: [0, 0, 0, 5]
      })),
      margin: [10, 0, 0, 15],
      bulletRadius: 2,
      unbreakable: true // ⬅️ Garder le groupe ensemble
    }];
  }

  // Pour les longues listes, on divise en chunks
  const content: any[] = [];
  const maxExclusionsPerPage = 8; // Ajustez selon vos besoins
  const exclusionChunks = [];

  for (let i = 0; i < exclusionsTextes.length; i += maxExclusionsPerPage) {
    exclusionChunks.push(exclusionsTextes.slice(i, i + maxExclusionsPerPage));
  }

  exclusionChunks.forEach((chunk, chunkIndex) => {
    const isFirstChunk = chunkIndex === 0;
    
    const chunkContent = {
      stack: [
        ...(chunkIndex > 0 ? [{ 
          text: 'Exclusions  :', 
          style: 'subSectionTitle',
          pageBreak: 'before'
        }] : []),
        {
          ul: chunk.map((text: string) => ({
            text: text,
            alignment: 'justify',
            lineHeight: 1.5,
            bold: true,
            style: 'paragraph',
            margin: [0, 0, 0, 5]
          })),
          margin: [10, 0, 0, 15],
          bulletRadius: 2
        }
      ]
    };

    content.push(chunkContent);
  });

  return content;
}

private prepareExclusionsParSituation(data: any): any[] {
  if (!data.sections || data.sections.length === 0) return [];


  // 1️⃣ Identifier les exclusions globales groupées par garantie parent
  const exclusionsGlobalesParGarantie = this.getExclusionsGlobalesParGarantieParent(data.sections, data);


  // 2️⃣ Préparer les sections spécifiques
  const sectionsAvecExclusions = data.sections.map((section: any, index: number) => {
    const situationLabel = `Situation ${String.fromCharCode(65 + index)}`;
    
    // Grouper les garanties par parent (méthode existante)
    const garantiesParParent = this.groupGarantiesParParent(section.garanties, data);
    

    // Filtrer pour garder seulement les exclusions spécifiques
    const garantiesAvecExclusionsSpecifiques = this.filtrerExclusionsSpecifiquesParGarantieParent(
      garantiesParParent, 
      exclusionsGlobalesParGarantie
    );

    if (garantiesAvecExclusionsSpecifiques.length === 0) {
      return null; // Section vide
    }

    return {
      stack: [
        { 
          text: `EXCLUSIONS SPÉCIFIQUES - ${situationLabel}`, 
          style: 'sectionTitle',
        },
        { 
          text: `Situation : ${section.identification || '-'}`, 
          style: 'subSectionTitle'
        },
        ...this.prepareExclusionsContent(garantiesAvecExclusionsSpecifiques)
      ]
    };
  }).filter((section: any) => section !== null);

  // 3️⃣ Préparer la section "EXCLUSIONS GLOBALES"
  let sectionExclusionsGlobales: any[] = [];
  if (exclusionsGlobalesParGarantie.length > 0) {
    sectionExclusionsGlobales = [{
      stack: [
        { text: 'EXCLUSIONS GLOBALES', style: 'sectionTitle', pageBreak: 'before' },
        ...this.prepareExclusionsGlobalesContent(exclusionsGlobalesParGarantie)
      ]
    }];

  }

  // 4️⃣ Combinaison finale
  const result = [...sectionExclusionsGlobales, ...sectionsAvecExclusions];

  return result;
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

// MÉTHODE POUR PRÉPARER LE CONTENU DES EXCLUSIONS GLOBALES (inchangée)
private prepareExclusionsGlobalesContent(exclusionsGlobalesParGarantie: any[]): any[] {
  if (!exclusionsGlobalesParGarantie || exclusionsGlobalesParGarantie.length === 0) return [];

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
            { text: `${data.nom_assure || 'Descriptif'}`, style: 'paragraphBold' },
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
}