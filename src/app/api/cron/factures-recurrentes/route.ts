import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSequentialDocumentNumber } from '@/lib/document-number';

export const dynamic = 'force-dynamic';
// Autoriser une exécution un peu plus longue si beaucoup de factures
export const maxDuration = 300; 

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Trouver toutes les factures récurrentes actives dont la prochaine date est aujourd'hui ou passée
    const recurrentes = await prisma.factureRecurrente.findMany({
      where: {
        actif: true,
        prochaineDate: {
          lte: today,
        },
      },
      include: {
        client: true,
      },
    });

    if (recurrentes.length === 0) {
      return NextResponse.json({ message: 'Aucune facture récurrente à traiter aujourd\'hui' });
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const rec of recurrentes) {
      try {
        // Vérifier si la date de fin est dépassée
        if (rec.dateFin && rec.dateFin < today) {
          await prisma.factureRecurrente.update({
            where: { id: rec.id },
            data: { actif: false },
          });
          continue;
        }

        // Générer le numéro de facture
        const numeroFacture = await generateSequentialDocumentNumber({
          prefix: 'FAC',
          userId: rec.userId,
          findLatest: (basePrefix) =>
            prisma.facture.findFirst({
              where: { userId: rec.userId, numero: { startsWith: basePrefix } },
              orderBy: { numero: 'desc' },
              select: { numero: true },
            }),
        });

        // Créer la facture
        await prisma.facture.create({
          data: {
            userId: rec.userId,
            numero: numeroFacture,
            recurrenteId: rec.id,
            nomClient: rec.client.nom,
            emailClient: rec.client.email || null,
            totalHT: rec.montantHT,
            tva: rec.tva,
            totalTTC: rec.montantTTC,
            statut: 'Émise',
            date: new Date(),
            // Par défaut on peut mettre l'échéance à +30 jours
            dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
          },
        });

        // Calculer la prochaine date
        let nextDate = new Date(rec.prochaineDate);
        if (rec.frequence === 'mensuel') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (rec.frequence === 'trimestriel') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (rec.frequence === 'annuel') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          // Frequence par défaut fallback
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Si pour une raison ou une autre on est très en retard, 
        // on s'assure que la prochaine date passe dans le futur pour éviter une boucle infinie
        while (nextDate <= today) {
          if (rec.frequence === 'mensuel') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (rec.frequence === 'trimestriel') nextDate.setMonth(nextDate.getMonth() + 3);
          else if (rec.frequence === 'annuel') nextDate.setFullYear(nextDate.getFullYear() + 1);
          else nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Mettre à jour la date de la prochaine facture
        await prisma.factureRecurrente.update({
          where: { id: rec.id },
          data: { prochaineDate: nextDate },
        });

        processedCount++;
      } catch (error: any) {
        console.error(`Erreur création facture récurrente ${rec.id}:`, error);
        errors.push(`Erreur rec ${rec.id}: ${error?.message || 'Erreur inconnue'}`);
      }
    }

    return NextResponse.json({
      message: 'Traitement des factures récurrentes terminé',
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('CRON Factures Récurrentes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
