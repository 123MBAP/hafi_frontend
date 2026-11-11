import { useDarkMode } from "@/context/DarkMode";
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    Home,
    LandPlot,
    MapPin,
    Phone,
    Share2,
    User,
    CheckCircle,
    Clock,
    ShieldCheck,
    MessageCircle,
    Copy,
    Check,
    Play,
    Video
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import {
    Commissioner,
    Property,
    PropertyStatus,
    TransactionType
} from "../api/realEstateTypes";
import { mockCommissioners } from "../api/mockRealEstateData";
import LoadingSpinner from '@/components/LoadingSpinner';
import { ServiceFeature } from "@/types/features";
import { API_BASE } from '../api/apiClient';
import { fetchEdgeProperties } from '../api/workerClient';

export default function PropertyDetailPage() {
    const { propertyId } = useParams<{ propertyId: string }>();
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [commissioner, setCommissioner] = useState<Commissioner | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
    const [serviceFeatures, setServiceFeatures] = useState<ServiceFeature[]>([]);
    const [copied, setCopied] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    const videoUrl = property?.videoUrl || property?.video_url || null;

    const toWhatsAppLink = (value: string): string | null => {
        const raw = (value || '').trim();
        if (!raw) return null;
        const digits = raw.replace(/\D/g, '');
        if (!digits) return null;
        const normalized = digits.length === 10 && digits.startsWith('0')
            ? `250${digits.slice(1)}`
            : digits;
        return `https://wa.me/${normalized}`;
    };

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            if (!propertyId) {
                setProperty(null);
                setCommissioner(null);
                setSimilarProperties([]);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/real-estate/properties/${encodeURIComponent(propertyId)}`, { signal: controller.signal });
                if (!res.ok) {
                    setProperty(null);
                    setCommissioner(null);
                    setSimilarProperties([]);
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                const prop: Property = data.property;
                if (prop) {
                    setCurrentImageIndex(0);
                    try {
                        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
                        const updated = [prop, ...recentlyViewed.filter((p: Property) => p.id !== prop.id)].slice(0, 10);
                        localStorage.setItem('recentlyViewedProperties', JSON.stringify(updated));
                    } catch {
                        // ignore storage errors
                    }
                }
                setProperty(prop);

                if (prop?.commissionerId) {
                    try {
                        const commRes = await fetch(`${API_BASE}/api/providers/${prop.commissionerId}`, { signal: controller.signal });
                        if (commRes.ok) {
                            const p = await commRes.json();
                            const mappedCommissioner: Commissioner = {
                                id: String(p.id),
                                name: p.name || p.email.split('@')[0],
                                phone: p.phone_number || p.email,
                                photo: p.profile_image ? (p.profile_image.startsWith('http') ? p.profile_image : `${API_BASE}${p.profile_image}`) : undefined,
                                operatingLocations: {
                                    districts: p.address?.district ? [p.address.district] : [],
                                    sectors: p.address?.sector ? [p.address.sector] : []
                                },
                                priceRange: { min: 0, max: 0 },
                                verified: true,
                                propertiesManaged: 1,
                            };
                            setCommissioner(mappedCommissioner);
                        } else {
                            const mockComm = mockCommissioners.find(c => c.id === prop.commissionerId);
                            if (mockComm) setCommissioner(mockComm);
                        }
                    } catch (e) {
                        console.error('[PropertyDetailPage] Failed to fetch commissioner:', e);
                    }
                }

                try {
                    const serviceRes = await fetch(`${API_BASE}/api/real-estate/service`, { signal: controller.signal });
                    if (serviceRes.ok) {
                        const serviceData = await serviceRes.json();
                        const features = serviceData?.service?.features;
                        setServiceFeatures(Array.isArray(features) ? features : []);
                    } else {
                        setServiceFeatures([]);
                    }
                } catch (e: any) {
                    if (e?.name === 'AbortError') return;
                    setServiceFeatures([]);
                }

                if (prop) {
                    try {
                        let list: Property[] = [];
                        try {
                            const edgeData = await fetchEdgeProperties(100);
                            list = (edgeData?.properties as any) || [];
                        } catch {
                            const listRes = await fetch(`${API_BASE}/api/real-estate/properties?limit=100`, { signal: controller.signal });
                            if (listRes.ok) {
                                const listData = await listRes.json();
                                list = Array.isArray(listData?.properties) ? listData.properties : [];
                            }
                        }
                        const similar = list
                            .filter(p =>
                                p.id !== prop.id &&
                                (p.category === prop.category || p.property_type === (prop as any).property_type)
                            )
                            .slice(0, 4);
                        setSimilarProperties(similar);
                    } catch (e: any) {
                        if (e?.name === 'AbortError') return;
                        setSimilarProperties([]);
                    }
                }

                setLoading(false);
            } catch (e: any) {
                if (e?.name === 'AbortError') return;
                console.error('[PropertyDetailPage] Error:', e);
                setLoading(false);
            }
        }

        load();
        return () => controller.abort();
    }, [propertyId]);

    const nextImage = () => {
        if (property && property.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
        }
    };

    const prevImage = () => {
        if (property && property.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
        }
    };

    const formatPrimitive = (value: any): string => {
        if (value == null) return '';
        return String(value).trim();
    };

    const hasLocationFields = (feature: ServiceFeature): boolean => {
        if (!feature || feature.type !== 'object') return false;
        const keys = Object.keys(feature.schema || {}).map((k) => k.toLowerCase());
        return keys.some((k) => ['province', 'district', 'sector', 'cell', 'village'].includes(k));
    };

    const buildLocationItems = (): Array<{ label: string; value: string }> => {
        const values = property?.featureValues;
        const items: Array<{ label: string; value: string }> = [];
        const locationFeature = serviceFeatures.find(hasLocationFields);

        const push = (label: string, raw: any) => {
            const v = formatPrimitive(raw);
            if (!v) return;
            items.push({ label, value: v });
        };

        if (locationFeature && locationFeature.type === 'object' && values && typeof values === 'object') {
            const obj = (values as any)[locationFeature.name];
            if (obj && typeof obj === 'object') {
                for (const [fieldKey, fieldConfig] of Object.entries(locationFeature.schema || {})) {
                    const label = (fieldConfig as any)?.label || fieldKey;
                    const raw = (obj as any)[fieldKey];
                    push(label, raw);
                }
            }
        }

        if (items.length === 0) {
            const v = (values && typeof values === 'object') ? (values as any) : {};
            if (v.province) push('Province', v.province);
            if (v.district || property?.location?.district) push('District', v.district || property?.location?.district);
            if (v.sector || property?.location?.sector) push('Sector', v.sector || property?.location?.sector);
            if (v.cell || property?.location?.cell) push('Cell', v.cell || property?.location?.cell);
            if (v.village) push('Village', v.village);
        }

        return items;
    };

    type DisplayField = { label: string; value?: string };
    type DisplayGroup = { title: string; fields: DisplayField[] };

    const buildFeatureGroups = (): DisplayGroup[] => {
        const values = property?.featureValues;
        if (!values || typeof values !== 'object') {
            if (Array.isArray(property?.features) && property!.features!.length) {
                return [{ title: 'Features', fields: property!.features!.map((s) => ({ label: s })) }];
            }
            return [];
        }

        const groups: DisplayGroup[] = [];

        const formatValue = (raw: any): string => {
            if (raw == null) return '';
            if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
            if (Array.isArray(raw)) {
                return raw.map((v) => String(v ?? '').trim()).filter(Boolean).join(', ');
            }
            if (typeof raw === 'object') {
                const entries = Object.entries(raw)
                    .filter(([, v]) => v != null && String(v).trim() !== '')
                    .map(([k, v]) => `${k}: ${String(v).trim()}`);
                return entries.join(', ');
            }
            return String(raw).trim();
        };

        const v = values as any;
        const detailsFields: DisplayField[] = [];
        if (v.property_category) detailsFields.push({ label: 'Property Category', value: String(v.property_category) });
        if (v.listing_type) detailsFields.push({ label: 'Listing Type', value: String(v.listing_type) });
        if (v.land_size_sqm != null) detailsFields.push({ label: 'Land Size', value: `${v.land_size_sqm} m²` });
        if (v.land_use) detailsFields.push({ label: 'Land Use', value: String(v.land_use) });
        if (v.road_access != null) detailsFields.push({ label: 'Road Access', value: v.road_access ? 'Yes' : 'No' });
        if (Array.isArray(v.utilities_available) && v.utilities_available.length > 0) {
            detailsFields.push({ label: 'Utilities Available', value: v.utilities_available.join(', ') });
        }
        if (v.building_area_sqm != null) detailsFields.push({ label: 'Building Area', value: `${v.building_area_sqm} m²` });
        if (v.number_of_floors != null) detailsFields.push({ label: 'Number of Floors', value: String(v.number_of_floors) });
        if (v.rooms_or_offices != null) detailsFields.push({ label: 'Rooms or Offices', value: String(v.rooms_or_offices) });
        if (v.bedrooms != null) detailsFields.push({ label: 'Bedrooms', value: String(v.bedrooms) });
        if (v.bathrooms != null) detailsFields.push({ label: 'Bathrooms', value: String(v.bathrooms) });
        if (v.kitchen != null) detailsFields.push({ label: 'Kitchen', value: v.kitchen ? 'Yes' : 'No' });
        if (v.parking != null) detailsFields.push({ label: 'Parking', value: v.parking ? 'Yes' : 'No' });
        if (v.garden_swimming_pool != null) detailsFields.push({ label: 'Garden / Swimming Pool', value: v.garden_swimming_pool ? 'Yes' : 'No' });
        if (v.floor_area_sqm != null) detailsFields.push({ label: 'Floor Area', value: `${v.floor_area_sqm} m²` });
        if (v.floor_number != null) detailsFields.push({ label: 'Floor Number', value: String(v.floor_number) });
        if (v.furnished != null) detailsFields.push({ label: 'Furnished', value: v.furnished ? 'Yes' : 'No' });

        if (detailsFields.length > 0) {
            groups.push({ title: 'Property Details', fields: detailsFields });
        }

        if (Array.isArray(v.amenities) && v.amenities.length > 0) {
            groups.push({
                title: 'Amenities',
                fields: v.amenities.map((item) => ({ label: item })),
            });
        }

        for (const feature of serviceFeatures) {
            if (!feature) continue;
            if (hasLocationFields(feature)) continue;

            if (feature.type === 'simple') {
                const raw = (values as any)[feature.name];
                const val = formatValue(raw);
                if (!val) continue;
                groups.push({
                    title: feature.name,
                    fields: [{ label: feature.name, value: val }],
                });
                continue;
            }

            if (feature.type === 'object') {
                const obj = (values as any)[feature.name];
                if (!obj || typeof obj !== 'object') continue;

                const fields: DisplayField[] = [];
                for (const [fieldKey, fieldConfig] of Object.entries(feature.schema || {})) {
                    const label = (fieldConfig as any)?.label || fieldKey;
                    const raw = (obj as any)[fieldKey];
                    if (raw == null) continue;

                    if (typeof raw === 'boolean') {
                        if (raw) fields.push({ label });
                        continue;
                    }

                    const val = formatValue(raw);
                    if (!val) continue;
                    fields.push({ label, value: val });
                }

                if (fields.length) groups.push({ title: feature.name, fields });
            }
        }

        if (!groups.length && Array.isArray(property?.features) && property!.features!.length) {
            return [{ title: 'Features', fields: property!.features!.map((s) => ({ label: s })) }];
        }

        return groups;
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            currencyDisplay: 'code',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getStatusBadge = (status: PropertyStatus) => {
        switch (status) {
            case PropertyStatus.Available:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Available
                    </span>
                );
            case PropertyStatus.Rented:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800">
                        Rented
                    </span>
                );
            case PropertyStatus.Sold:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800">
                        Sold
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                        {status}
                    </span>
                );
        }
    };

    const getCategoryIcon = (category: string) => {
        const c = String(category || '').toLowerCase();
        if (c.includes('land') || c.includes('plot')) return <LandPlot className="w-4 h-4 text-[#E5252A]" />;
        if (c.includes('commercial') || c.includes('business')) return <Building2 className="w-4 h-4 text-[#E5252A]" />;
        return <Home className="w-4 h-4 text-[#E5252A]" />;
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: property?.title,
                text: property?.description,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${darkMode ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#151515]'}`}>
                <LoadingSpinner size="lg" message="Loading property details..." variant="dots" />
            </div>
        );
    }

    if (!property) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#151515]'}`}>
                <div className={`w-full max-w-md text-center p-8 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 text-[#E5252A] flex items-center justify-center">
                        <Home className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Property Not Found</h2>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        The property listing you are looking for may have been removed or is no longer available.
                    </p>
                    <button
                        onClick={() => navigate('/real-estate')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5252A] hover:bg-[#c91d22] text-white shadow-xs transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Browse Properties</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 transition-colors ${darkMode ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#151515]'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Navigation & Breadcrumbs */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                            darkMode
                                ? 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800'
                                : 'bg-white border-[#E5E5E5] text-[#151515] hover:bg-gray-50'
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleShare}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'bg-white border-[#E5E5E5] text-[#151515] hover:bg-gray-50'
                            }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                            <span>{copied ? 'Link Copied' : 'Share'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Column (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery Section */}
                        <div className={`overflow-hidden rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                            <div className="relative aspect-16/10 bg-black/5 dark:bg-black/40 overflow-hidden">
                                {showVideo && videoUrl ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                        <video
                                            src={videoUrl.startsWith('http') ? videoUrl : `${API_BASE}${videoUrl}`}
                                            controls
                                            autoPlay
                                            playsInline
                                            className="w-full h-full max-h-[500px] object-contain"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={property.images[currentImageIndex] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'}
                                        alt={property.title}
                                        className="w-full h-full object-cover transition-transform duration-500"
                                    />
                                )}

                                {!showVideo && property.images.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={prevImage}
                                            aria-label="Previous image"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextImage}
                                            aria-label="Next image"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {/* Top Badges */}
                                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                                    <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white flex items-center gap-1.5 shadow-sm">
                                        {getCategoryIcon(property.category)}
                                        <span>{property.category}</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E5252A] text-white shadow-sm">
                                        {property.transactionType === TransactionType.ForLetting ? 'For Rent' : 'For Sale'}
                                    </div>
                                    {videoUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setShowVideo(!showVideo)}
                                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/80 hover:bg-[#E5252A] text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                        >
                                            {showVideo ? <Home className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                            <span>{showVideo ? 'View Photos' : 'Watch Video'}</span>
                                        </button>
                                    )}
                                </div>

                                <div className="absolute top-4 right-4">
                                    {getStatusBadge(property.status)}
                                </div>

                                {/* Counter indicator */}
                                {!showVideo && property.images.length > 1 && (
                                    <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/60 backdrop-blur-md text-white shadow-sm">
                                        {currentImageIndex + 1} / {property.images.length}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Strip (Images + Video button) */}
                            <div className="flex gap-2.5 p-4 overflow-x-auto border-t border-[#E5E5E5] dark:border-gray-800 items-center">
                                {property.images.map((image, index) => (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => {
                                            setShowVideo(false);
                                            setCurrentImageIndex(index);
                                        }}
                                        className={`relative w-20 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                            !showVideo && currentImageIndex === index
                                                ? 'border-[#E5252A] ring-2 ring-[#E5252A]/20 scale-102'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}

                                {videoUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setShowVideo(true)}
                                        className={`relative w-20 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-black/90 flex flex-col items-center justify-center text-white gap-1 ${
                                            showVideo
                                                ? 'border-[#E5252A] ring-2 ring-[#E5252A]/20 scale-102'
                                                : 'border-transparent opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <Play className="w-5 h-5 fill-current text-[#E5252A]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Title, Pricing & Essential Info */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#151515] dark:text-white">
                                        {property.title}
                                    </h1>
                                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#666666] dark:text-gray-400">
                                        <MapPin className="w-4 h-4 text-[#E5252A] shrink-0" />
                                        <span>
                                            {[property.location?.cell, property.location?.sector, property.location?.district]
                                                .filter(Boolean)
                                                .join(', ') || 'Rwanda'}
                                        </span>
                                    </div>
                                </div>

                                <div className="sm:text-right shrink-0">
                                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-0.5">
                                        {property.transactionType === TransactionType.ForLetting ? 'Monthly Rent' : 'Price'}
                                    </span>
                                    <div className="text-2xl sm:text-3xl font-black text-[#E5252A]">
                                        {formatPrice(property.price)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#E5E5E5] dark:border-gray-800 text-xs font-medium text-[#666666] dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-[#E5252A]" />
                                    <span>{property.views || 0} views</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-[#E5252A]" />
                                    <span>Listed {new Date(property.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified Listing</span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-3">
                                Description
                            </h2>
                            <p className="text-sm leading-relaxed text-[#151515] dark:text-gray-300 whitespace-pre-line">
                                {property.description || 'No detailed description provided for this listing.'}
                            </p>
                        </div>

                        {/* Location Details Breakdown */}
                        {(() => {
                            const locationItems = buildLocationItems();
                            if (locationItems.length === 0) return null;
                            return (
                                <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-4">
                                        Location Details
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {locationItems.map((item, idx) => (
                                            <div key={idx} className="p-3.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-[#E5E5E5] dark:border-gray-800/80">
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-1">
                                                    {item.label}
                                                </span>
                                                <span className="text-sm font-bold text-[#151515] dark:text-white">
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Structured Property Features */}
                        <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-4">
                                Property Details & Amenities
                            </h2>
                            {(() => {
                                const groups = buildFeatureGroups();
                                if (!groups.length) {
                                    return <p className="text-xs text-[#666666] dark:text-gray-400">No additional specifications listed.</p>;
                                }
                                return (
                                    <div className="space-y-6">
                                        {groups.map((group, gIdx) => (
                                            <div key={gIdx} className="space-y-3">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-white flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5252A]" />
                                                    {group.title}
                                                </h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {group.fields.map((field, fIdx) => (
                                                        <div
                                                            key={fIdx}
                                                            className="p-3.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-[#E5E5E5] dark:border-gray-800/80"
                                                        >
                                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-1">
                                                                {field.label}
                                                            </span>
                                                            {field.value ? (
                                                                <span className="text-xs sm:text-sm font-bold text-[#151515] dark:text-white">
                                                                    {field.value}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                                    Included
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Sidebar - Right Column (1 Col) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Direct Contact & Action Card */}
                        <div className={`p-6 sm:p-7 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm sticky top-6`}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Direct Inquiry
                            </h3>

                            <div className="space-y-3">
                                {property.contactPhone && (
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = `tel:${property.contactPhone}`}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5252A] hover:bg-[#c91d22] text-white shadow-xs transition-colors cursor-pointer"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>Call {property.contactPhone}</span>
                                    </button>
                                )}

                                {property.whatsappNumber && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const link = toWhatsAppLink(property.whatsappNumber || '');
                                            if (link) window.open(link, '_blank');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>Chat on WhatsApp</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                                        darkMode
                                            ? 'bg-black/50 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white'
                                            : 'bg-gray-50 border-[#E5E5E5] text-[#151515] hover:bg-gray-100'
                                    }`}
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>{copied ? 'Link Copied!' : 'Copy Property Link'}</span>
                                </button>
                            </div>

                            {/* Trust & Safety Highlights */}
                            <div className="pt-6 mt-6 border-t border-[#E5E5E5] dark:border-gray-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-white mb-3">
                                    Safety & Verification
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>Physical inspection & ownership vetted</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <ShieldCheck className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>HafiConnect secure commissioner network</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <Clock className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>Rapid on-site tour arrangement</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Listed by Commissioner Card */}
                        {commissioner && (
                            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'} shadow-sm`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
                                        Listed By
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                        <BadgeCheck className="w-3.5 h-3.5" />
                                        Verified Agent
                                    </span>
                                </div>

                                <div
                                    onClick={() => navigate(`/real-estate/commissioner/${commissioner.id}`)}
                                    className="flex items-center gap-3.5 cursor-pointer group"
                                >
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-[#E5E5E5] dark:border-gray-800 shrink-0">
                                        <img
                                            src={commissioner.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                                            alt={commissioner.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-[#151515] dark:text-white group-hover:text-[#E5252A] transition-colors truncate">
                                            {commissioner.name}
                                        </h4>
                                        <p className="text-xs text-[#666666] dark:text-gray-400 truncate mt-0.5">
                                            {commissioner.operatingLocations?.districts?.[0] || 'Kigali'} Real Estate Specialist
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-[#E5E5E5] dark:border-gray-800 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/real-estate/commissioner/${commissioner.id}`)}
                                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer text-center ${
                                            darkMode
                                                ? 'bg-black/40 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white'
                                                : 'bg-gray-50 border-[#E5E5E5] text-[#151515] hover:bg-gray-100'
                                        }`}
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = `tel:${commissioner.phone}`}
                                        className="py-2.5 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5252A] hover:bg-[#c91d22] text-white transition-colors cursor-pointer"
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Similar Properties Section */}
                {similarProperties.length > 0 && (
                    <div className="mt-14 pt-10 border-t border-[#E5E5E5] dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A]">
                                    Explore More
                                </h3>
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#151515] dark:text-white mt-1">
                                    Similar Properties
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/real-estate')}
                                className="text-xs font-bold uppercase tracking-wider text-[#E5252A] hover:underline cursor-pointer"
                            >
                                View All
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {similarProperties.map((prop, idx) => {
                                const locationLabel = typeof prop.location === 'string'
                                    ? prop.location
                                    : (prop.location?.district || prop.district || prop.location?.sector || 'Rwanda');
                                return (
                                    <div
                                        key={`${prop.id}-${idx}`}
                                        onClick={() => navigate(`/real-estate/property/${prop.id}`)}
                                        className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                                            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-[#E5E5E5]'
                                        }`}
                                    >
                                        <div className="relative aspect-16/10 overflow-hidden bg-black/5 dark:bg-black/40">
                                            <img
                                                src={prop.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80'}
                                                alt={prop.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white">
                                                {prop.category || (prop as any).property_type || 'Property'}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="text-sm font-bold text-[#151515] dark:text-white group-hover:text-[#E5252A] transition-colors truncate">
                                                {prop.title}
                                            </h4>
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#666666] dark:text-gray-400">
                                                <MapPin className="w-3.5 h-3.5 text-[#E5252A]" />
                                                <span className="truncate">{locationLabel}</span>
                                            </div>
                                            <div className="text-base font-black text-[#E5252A] mt-2.5">
                                                {formatPrice(prop.price)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
