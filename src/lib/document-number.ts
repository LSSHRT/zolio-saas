function extractSequence(numero: string, basePrefix: string) {
  const suffix = numero.slice(basePrefix.length);
  const parsed = Number.parseInt(suffix, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function generateSequentialDocumentNumber({
  prefix,
  userId,
  findLatest,
}: {
  prefix: string;
  userId: string;
  findLatest: (basePrefix: string) => Promise<{ numero: string } | null>;
}) {
  const year = new Date().getFullYear();
  const basePrefix = `${prefix}-${year}-`;
  const latest = await findLatest(basePrefix);
  const nextSequence = latest ? extractSequence(latest.numero, basePrefix) + 1 : 1;

  if (nextSequence > 999) {
    throw new Error(`Impossible de générer un numéro ${prefix} pour ${userId}`);
  }

  return `${basePrefix}${String(nextSequence).padStart(3, "0")}`;
}
