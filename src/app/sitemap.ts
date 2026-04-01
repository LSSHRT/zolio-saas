import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zolio.site';

  return [
    { url: baseUrl, priority: 1, changeFrequency: 'monthly' },
    { url: `${baseUrl}/sign-up`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${baseUrl}/cgv`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/cgu`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/mentions-legales`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/politique-confidentialite`, priority: 0.5, changeFrequency: 'yearly' },
  ];
}
