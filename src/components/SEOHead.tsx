import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function SEOHead({ 
  title, 
  description, 
  canonical, 
  keywords,
  ogImage = '/og-image.jpg',
  noindex = false 
}: SEOHeadProps) {
  useEffect(() => {
    // Mise à jour du titre
    document.title = title;
    
    // Mise à jour de la meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Mise à jour des keywords si fournis
    if (keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      }
    }
    
    // Mise à jour de l'URL canonique
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', `https://countrymusic-hub.com${canonical}`);
    }
    
    // Mise à jour Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDescription) ogDescription.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', `https://countrymusic-hub.com${canonical}`);
    if (ogImageMeta) ogImageMeta.setAttribute('content', `https://countrymusic-hub.com${ogImage}`);
    
    // Mise à jour Twitter Card
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDescription) twitterDescription.setAttribute('content', description);
    if (twitterImage) twitterImage.setAttribute('content', `https://countrymusic-hub.com${ogImage}`);
    
    // Gestion robots meta
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      const robotsContent = noindex 
        ? 'noindex, nofollow' 
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
      robotsMeta.setAttribute('content', robotsContent);
    }
    
  }, [title, description, canonical, keywords, ogImage, noindex]);

  return null; // Ce composant ne rend rien visuellement
}