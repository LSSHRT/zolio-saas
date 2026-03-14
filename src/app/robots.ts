import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/abonnement', '/manifest.json'],
      disallow: ['/admin', '/api/', '/devis/', '/factures/', '/parametres/', '/clients/', '/catalogue/', '/planning/', '/signer/', '/nouveau-devis/'],
    },
    sitemap: 'https://www.zolio.site/sitemap.xml',
  }
}