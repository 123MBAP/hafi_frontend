import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://haficonnect.vercel.app').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/image.png`;

type SeoDetails = {
  title: string;
  description: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string;
};

const publicSeo: Record<string, SeoDetails> = {
  '/': {
    title: 'HafiConnect | Discover Services, Products, Shops and Property in Rwanda',
    description: 'Discover services, buy and sell new and used products, explore premium shops, find real estate, and shop Made in Rwanda products on HafiConnect. Connect directly with providers and sellers across Rwanda.',
    keywords: 'services Rwanda, marketplace Rwanda, real estate Rwanda, Made in Rwanda, shops Rwanda, buy and sell Kigali'
  },
  '/services': {
    title: 'HafiConnect Services | Find and Book Services in Rwanda',
    description: 'Discover services in Rwanda on HafiConnect. Find trusted service providers, explore their offerings, contact them directly, book services, and purchase products with ease.',
    keywords: 'services in Rwanda, local service providers, book services online, Kigali services, Rwandan professionals'
  },
  '/market': {
    title: 'Online Marketplace Rwanda | Buy and Sell on HafiConnect',
    description: 'Buy and sell new and used products in Rwanda on HafiConnect. Explore listings from businesses and individuals, compare products, and contact sellers directly.',
    keywords: 'online marketplace Rwanda, buy and sell products, second-hand products, electronics Rwanda, home essentials Kigali'
  },
  '/real-estate': {
    title: 'Real Estate Rwanda | Houses, Land and Property on HafiConnect',
    description: 'Find houses, apartments, land, commercial buildings, and other properties for rent or sale in Rwanda. Explore property listings and contact owners or agents on HafiConnect.',
    keywords: 'property for sale Rwanda, houses for rent, land for sale, commercial property Kigali, real estate Rwanda'
  },
  '/commissioners': {
    title: 'Real Estate Agents in Rwanda | HafiConnect Property Experts',
    description: 'Find real estate agents and property commissioners in Rwanda on HafiConnect. Connect with professionals who can help you find houses, land, rentals, and commercial properties.',
    keywords: 'real estate agents Rwanda, property agents, find a property agent, Kigali commissioners, real estate experts'
  },
  '/real-estate/commissioners': {
    title: 'Real Estate Agents in Rwanda | HafiConnect Property Experts',
    description: 'Find real estate agents and property commissioners in Rwanda on HafiConnect. Connect with professionals who can help you find houses, land, rentals, and commercial properties.',
    keywords: 'real estate agents Rwanda, property agents, find a property agent, Kigali commissioners, real estate experts'
  },
  '/shops': {
    title: 'Premium Shops in Rwanda | Fashion and Lifestyle on HafiConnect',
    description: 'Explore premium shops on HafiConnect. Discover quality clothing, shoes, jewelry, accessories, fashion, and lifestyle products from selected shops and retailers in Rwanda.',
    keywords: 'fashion shops Rwanda, premium clothing, shoes, jewelry, luxury shopping Kigali, boutiques Rwanda'
  },
  '/made-in-rwanda': {
    title: 'Made in Rwanda Products | Local Crafts and Goods on HafiConnect',
    description: 'Discover Made in Rwanda products on HafiConnect, including locally made clothing, handmade crafts, woven baskets, pottery, art, accessories, and products from Rwandan creators and businesses.',
    keywords: 'Made in Rwanda products, Rwandan crafts, locally made products, handmade crafts Rwanda, Agaseke baskets, Rwandan fashion'
  },
  '/about-haficonnect': {
    title: 'About HafiConnect | Connecting Rwanda with Local Opportunities',
    description: 'Learn how HafiConnect helps people discover trusted Rwandan services, local products, marketplace offers and real estate opportunities.'
  },
  '/contact': {
    title: 'Contact HafiConnect | Get Help in Rwanda',
    description: 'Contact the HafiConnect team for support, partnership enquiries, service listings and marketplace assistance in Rwanda.'
  },
  '/search': {
    title: 'Search Services, Products and Properties in Rwanda | HafiConnect',
    description: 'Search HafiConnect for local services, products, shops, marketplace listings and real estate opportunities in Rwanda.'
  },
  '/customer-feedbacks': {
    title: 'Customer Feedback and Reviews | HafiConnect',
    description: 'Read customer feedback and share your experience with services, products and providers on HafiConnect.'
  },
  '/updates': {
    title: 'HafiConnect Updates and News',
    description: 'Read the latest HafiConnect announcements, platform updates, opportunities and community news.'
  },
  '/faq': {
    title: 'Frequently Asked Questions | HafiConnect',
    description: 'Find answers about HafiConnect services, marketplace products, real estate listings, accounts and platform support.'
  },
  '/map': {
    title: 'Explore Services and Opportunities on the Map | HafiConnect',
    description: 'Use the HafiConnect map to explore services, providers and opportunities across Rwanda.'
  },
  '/location-selector': {
    title: 'Choose Your Location in Rwanda | HafiConnect',
    description: 'Choose a location in Rwanda to find nearby HafiConnect services, products and opportunities.'
  },
  '/login': {
    title: 'Log In to HafiConnect',
    description: 'Log in to your HafiConnect account to manage your services, products, bookings and marketplace activity.'
  },
  '/register': {
    title: 'Create a HafiConnect Account',
    description: 'Create your HafiConnect account to discover services, shop local products or grow your business in Rwanda.'
  }
};

function isPrivateRoute(pathname: string) {
  return [
    '/dashboard',
    '/admin',
    '/cart',
    '/checkout',
    '/storage-checkout',
    '/profile',
    '/chat',
    '/verify',
    '/reset-password',
    '/book/payment',
    '/booking/service',
    '/orders',
    '/statements',
    '/account-dashboard'
  ].some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function getSeoDetails(pathname: string): SeoDetails {
  const exactMatch = publicSeo[pathname];
  if (exactMatch) return exactMatch;

  if (pathname.startsWith('/services/')) {
    return {
      title: 'Service Details and Provider Information | HafiConnect',
      description: 'View service details, provider information, availability and contact options for trusted services in Rwanda.',
      type: 'article'
    };
  }

  if (pathname.startsWith('/provider/')) {
    return {
      title: 'Service Provider Profile and Listings | HafiConnect',
      description: 'Explore this provider profile, services, listings and business information on HafiConnect.',
      type: 'article'
    };
  }

  if (pathname.startsWith('/product/')) {
    return {
      title: 'Product Details and Seller Information | HafiConnect Market',
      description: 'View product details, pricing, seller information and purchase options for this HafiConnect marketplace listing.',
      type: 'product'
    };
  }

  if (pathname.startsWith('/made-in-rwanda/product/')) {
    return {
      title: 'Made in Rwanda Product Details | HafiConnect',
      description: 'View details, pricing and seller information for this locally made Rwandan product on HafiConnect.',
      type: 'product'
    };
  }

  if (pathname.startsWith('/real-estate/property/')) {
    return {
      title: 'Property Details and Real Estate Listing | HafiConnect',
      description: 'View property details, location, images and contact information for this real estate listing in Rwanda.',
      type: 'article'
    };
  }

  if (pathname.startsWith('/real-estate/commissioner/')) {
    return {
      title: 'Real Estate Agent Profile | HafiConnect',
      description: 'View this real estate professional’s profile, property listings and contact information on HafiConnect.',
      type: 'article'
    };
  }

  return {
    title: 'HafiConnect | Services, Products and Real Estate in Rwanda',
    description: 'Discover trusted services, products, shops and real estate opportunities across Rwanda with HafiConnect.'
  };
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const details = getSeoDetails(pathname);
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    document.title = details.title;
    setMeta('name', 'robots', isPrivateRoute(pathname) ? 'noindex, nofollow' : 'index, follow');
    setMeta('name', 'description', details.description);
    if (details.keywords) {
      setMeta('name', 'keywords', details.keywords);
    }
    setMeta('property', 'og:title', details.title);
    setMeta('property', 'og:description', details.description);
    setMeta('property', 'og:type', details.type || 'website');
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', DEFAULT_IMAGE);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', details.title);
    setMeta('name', 'twitter:description', details.description);
    setMeta('name', 'twitter:image', DEFAULT_IMAGE);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Structured Data (JSON-LD)
    let jsonLdScript = document.head.querySelector<HTMLScriptElement>('script[data-seo="json-ld"]');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.setAttribute('data-seo', 'json-ld');
      document.head.appendChild(jsonLdScript);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          'name': 'HafiConnect',
          'url': SITE_URL,
          'logo': DEFAULT_IMAGE,
          'description': 'Connecting Rwanda with local services, marketplace products, premium shops, and real estate opportunities.'
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          'url': SITE_URL,
          'name': 'HafiConnect',
          'publisher': { '@id': `${SITE_URL}/#organization` },
          'potentialAction': {
            '@type': 'SearchAction',
            'target': `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          'url': canonicalUrl,
          'name': details.title,
          'description': details.description,
          'isPartOf': { '@id': `${SITE_URL}/#website` }
        }
      ]
    };

    jsonLdScript.textContent = JSON.stringify(structuredData);
  }, [pathname]);

  return null;
}
