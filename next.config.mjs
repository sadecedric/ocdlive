/**
 * Par défaut, Next construit dans `.next`.
 * NEXT_BUILD_DIR permet de construire ailleurs, afin de vérifier un build
 * de production sans perturber un `npm run dev` déjà en cours sur le projet
 * (les deux se disputeraient le même dossier).
 *
 *   NEXT_BUILD_DIR=.next-verify npx next build
 *
 * Sur Vercel la variable n'est pas définie : le comportement reste standard.
 */
const nextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || '.next'
};

export default nextConfig;
