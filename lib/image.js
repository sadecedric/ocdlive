'use client';

/* ============================================================
   OCD LIVE — Préparation des photos de produits
   ------------------------------------------------------------
   Les photos prises au téléphone pèsent 3 à 8 Mo. On les
   redimensionne et on les recompresse dans le navigateur AVANT
   de les enregistrer : une photo de produit tombe ainsi autour
   de 60 à 120 Ko, ce qui reste lisible à l'écran pendant le live
   et tient dans le stockage du navigateur.

   En production (avec un vrai backend), c'est la même fonction
   qui alimentera l'envoi vers le serveur de fichiers : moins de
   données envoyées, utile avec une connexion mobile au Togo.
   ============================================================ */

export const MAX_PHOTOS_PER_PRODUCT = 3;
export const MAX_PHOTOS_PER_BOOKING = 8;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15 Mo en entrée
const TARGET_SIZE = 900;                   // plus grand côté, en pixels
const QUALITY = 0.7;

export class ImageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ImageError';
    this.code = code;
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new ImageError('READ', 'Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new ImageError('DECODE', 'Ce format d’image n’est pas reconnu par le navigateur.'));
    img.src = src;
  });
}

/**
 * Redimensionne et recompresse une image en JPEG.
 * @returns {Promise<string>} une URL de données (data:image/jpeg;base64,…)
 */
export async function compressImage(file) {
  if (!file.type || !file.type.startsWith('image/')) {
    throw new ImageError('TYPE', 'Ce fichier n’est pas une image.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError('TOO_BIG', 'Cette image dépasse 15 Mo.');
  }

  const source = await readAsDataURL(file);
  const img = await loadImage(source);

  const largest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = largest > TARGET_SIZE ? TARGET_SIZE / largest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('CANVAS', 'Traitement de l’image impossible.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', QUALITY);
}

/** Taille approximative, en Ko, d'une URL de données. */
export function dataUrlWeight(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.round((base64.length * 3) / 4 / 1024);
}

/** Nombre total de photos de tous les produits. */
export function countPhotos(products) {
  return (products || []).reduce((total, p) => total + (p.images?.length || 0), 0);
}
