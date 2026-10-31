import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://haficonnect.voltaleltd.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/image.png`;

type SeoDetails = {
  title: string;
  description: string;
  type?: 'website' | 'article' | 'product';
};

const publicSeo: Record<string, SeoDetails> = {
  '/': {
    title: 'Local Services, Products and Real Estate in Rwanda | HafiConnect',
    description: 'Discover trusted services, Made in Rwanda products, marketplace listings and real estate opportunities across Rwanda.'
  },
  '/services': {
    title: 'Find Trusted Service Providers in Rwanda | HafiConnect',
    description: 'Find trusted photographers, designers, repair experts, caterers, event providers and other local services across Rwanda.'
  },
  '/about-haficonnect': {
    title: 'About HafiConnect | Connecting Rwanda with Local Opportunities',
    description: 'Learn how HafiConnect helps people discover trusted Rwandan services, local products, marketplace offers and real estate opportunities.'
  },
  '/contact': {
    title: 'Contact HafiConnect | Get Help in Rwanda',
    description: 'Contact the HafiConnect team for support, partnership enquiries, service listings and marketplace assistance in Rwanda.'
  },
  '/market': {
    title: 'Shop Products from Rwanda and Around the World | HafiConnect Market',
    description: 'Browse marketplace products, compare offers and discover goods available from sellers in Rwanda and beyond.'
  },
  '/shops': {
    title: 'Discover Shops and Sellers in Rwanda | HafiConnect',
    description: 'Explore verified shops and sellers offering products, services and local goods throughout Rwanda.'
  },
  '/made-in-rwanda': {
    title: 'Made in Rwanda Products | Shop Local Products on HafiConnect',
    description: 'Discover and support Made in Rwanda products, crafts, fashion, food and locally produced goods from Rwandan sellers.'
  },
  '/real-estate': {
    title: 'Find Houses, Land and Real Estate in Rwanda | HafiConnect',
    description: 'Explore houses, land, buildings and real estate opportunities for rent or sale across Rwanda.'
  },
  '/real-estate/commissioners': {
    title: 'Find Real Estate Agents in Rwanda | HafiConnect',
    description: 'Connect with real estate commissioners and property professionals who can help you find opportunities across Rwanda.'
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
  }, [pathname]);

  return null;
}
