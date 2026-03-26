/**
 * Helper pour l'upload de photos vers Vercel Blob Storage
 *
 * Au lieu de stocker les photos en base64 dans la DB (très lourd),
 * on les upload sur Vercel Blob et on stocke juste l'URL.
 */

import { put, del } from "@vercel/blob";

const PHOTOS_PREFIX = "devis-photos";

/**
 * Upload une photo base64 vers Vercel Blob et retourne l'URL
 */
export async function uploadPhoto(
  base64Data: string,
  devisNumero: string,
  index: number
): Promise<string> {
  // Décoder le base64 en Buffer
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Content, "base64");

  // Détecter le type d'image
  const mimeType = base64Data.match(/data:(image\/\w+);/)?.[1] || "image/jpeg";
  const extension = mimeType.split("/")[1] || "jpg";

  // Upload vers Vercel Blob
  const filename = `${PHOTOS_PREFIX}/${devisNumero}/${index}.${extension}`;
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: mimeType,
  });

  return blob.url;
}

/**
 * Upload plusieurs photos base64 et retourne les URLs
 */
export async function uploadPhotos(
  base64Photos: string[],
  devisNumero: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < base64Photos.length; i++) {
    const photo = base64Photos[i];

    // Si c'est déjà une URL, on la garde
    if (photo.startsWith("http")) {
      urls.push(photo);
      continue;
    }

    // Sinon, upload vers Blob
    try {
      const url = await uploadPhoto(photo, devisNumero, i);
      urls.push(url);
    } catch (error) {
      console.error(`Erreur upload photo ${i}:`, error);
      // En cas d'erreur, on garde le base64 comme fallback
      urls.push(photo);
    }
  }

  return urls;
}

/**
 * Supprime les photos d'un devis de Vercel Blob
 */
export async function deletePhotos(urls: string[]): Promise<void> {
  for (const url of urls) {
    if (url.startsWith("https://")) {
      try {
        await del(url);
      } catch (error) {
        console.error(`Erreur suppression photo:`, error);
      }
    }
  }
}

/**
 * Vérifie si une valeur est une URL (pas un base64)
 */
export function isPhotoUrl(value: string): boolean {
  return value.startsWith("https://") || value.startsWith("http://");
}

/**
 * Convertit une URL de photo en base64 (pour le PDF)
 */
export async function fetchPhotoAsBase64(url: string): Promise<string> {
  if (!isPhotoUrl(url)) {
    return url; // Déjà en base64
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return "";

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Erreur fetch photo:", error);
    return "";
  }
}
