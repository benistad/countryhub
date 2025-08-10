import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogImage?: string;
  noindex?: boolean;
  breadcrumbs?: Array<{name: string; url: string}>;
  articleData?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

export function SEOHead({ 
  title, 
  description, 
  canonical, 
  keywords,
  ogImage = '/og-image.jpg',
  noindex = false,
  breadcrumbs,
  articleData
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
    
    // Ajouter les données structurées pour les breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      const existingBreadcrumbScript = document.querySelector('#breadcrumb-schema');
      if (existingBreadcrumbScript) {
        existingBreadcrumbScript.remove();
      }
      
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": `https://countrymusic-hub.com${crumb.url}`
        }))
      };
      
      const script = document.createElement('script');
      script.id = 'breadcrumb-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
    }
    
    // Ajouter les données structurées pour les articles
    if (articleData) {
      const existingArticleScript = document.querySelector('#article-schema');
      if (existingArticleScript) {
        existingArticleScript.remove();
      }
      
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "url": `https://countrymusic-hub.com${canonical}`,
        "image": `https://countrymusic-hub.com${ogImage}`,
        "author": {
          "@type": "Organization",
          "name": articleData.author || "CountryMusic-Hub.com"
        },
        "publisher": {
          "@type": "Organization",
          "name": "CountryMusic-Hub.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://countrymusic-hub.com/logo.png"
          }
        },
        "datePublished": articleData.publishedTime,
        "dateModified": articleData.modifiedTime || articleData.publishedTime,
        "articleSection": articleData.section || "Country Music"
      };
      
      const script = document.createElement('script');
      script.id = 'article-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(articleSchema);
      document.head.appendChild(script);
    }
    
  }, [title, description, canonical, keywords, ogImage, noindex, breadcrumbs, articleData]);

  return null; // Ce composant ne rend rien visuellement
}