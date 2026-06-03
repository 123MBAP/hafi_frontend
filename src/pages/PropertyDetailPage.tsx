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
    Clock
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
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ServiceFeature } from "@/types/features";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

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
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/real-estate/properties/${encodeURIComponent(propertyId)}`, { signal: controller.signal });
                if (!res.ok) {
                    setProperty(null);
                    setCommissioner(null);
                    setSimilarProperties([]);
                    return;
                }
                const data = await res.json();
                const prop = data.property;
                if (prop) {
                    setCurrentImageIndex(0);
                    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
                    const updated = [prop, ...recentlyViewed.filter((p: Property) => p.id !== prop.id)].slice(0, 10);
                    localStorage.setItem('recentlyViewedProperties', JSON.stringify(updated));
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

                setCurrentImageIndex(0);

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
                        const listRes = await fetch(`${API_BASE}/api/real-estate/properties?limit=200`, { signal: controller.signal });
                        if (listRes.ok) {
                            const listData = await listRes.json();
                            const list: Property[] = Array.isArray(listData?.properties) ? listData.properties : [];
                            const similar = list
                                .filter(p =>
                                    p.id !== prop.id &&
                                    p.category === prop.category &&
                                    p.transactionType === prop.transactionType
                                )
                                .slice(0, 4);
                            setSimilarProperties(similar);
                        } else {
                            setSimilarProperties([]);
                        }
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

        if (!items.length && property?.location) {
            push('District', property.location.district);
            push('Sector', property.location.sector);
            push('Cell', property.location.cell);
        }

        if (items.length === 0 && values && typeof values === 'object') {
            const v = values as any;
            push('District', v.district);
            push('Sector', v.sector);
            push('Cell', v.cell);
            push('Village', v.village);
            push('Province', v.province);
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

        for (const feature of serviceFeatures) {
            if (!feature) continue;
            if (hasLocationFields(feature)) continue;

            if (feature.type === 'simple') {
                const raw = (values as any)[feature.name];
                const v = formatValue(raw);
                if (!v) continue;
                groups.push({
                    title: feature.name,
                    fields: [{ label: feature.name, value: v }],
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

                    const v = formatValue(raw);
                    if (!v) continue;
                    fields.push({ label, value: v });
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

    const getStatusColor = (status: PropertyStatus): string => {
        switch (status) {
            case PropertyStatus.Available: return 'bg-emerald-500';
            case PropertyStatus.Rented: return 'bg-amber-500';
            case PropertyStatus.Sold: return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getCategoryIcon = (category: string) => {
        const c = String(category || '').toLowerCase();
        if (c.includes('land') || c.includes('plot')) return <LandPlot className="w-5 h-5" />;
        if (c.includes('commercial') || c.includes('business')) return <Building2 className="w-5 h-5" />;
        return <Home className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <LoadingSpinner />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading property details...</p>
            </div>
        );
    }

    if (!property) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
                    <button
                        onClick={() => navigate('/real-estate')}
                        className="px-6 py-2 bg-emerald-600 text-white transition-colors"
                        style={{ borderRadius: '2px' }}
                    >
                        Back to Properties
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/real-estate')}
                    className={`flex items-center gap-2 mb-6 px-3 py-1.5 transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    style={{ borderRadius: '2px' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className={`overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <div className="relative">
                                <img
                                    src={property.images[currentImageIndex]}
                                    alt={property.title}
                                    className="w-full h-96 object-cover"
                                />
                                {property.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 transition-colors"
                                            style={{ borderRadius: '2px' }}
                                        >
                                            <ChevronLeft className="w-5 h-5 text-white" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 transition-colors"
                                            style={{ borderRadius: '2px' }}
                                        >
                                            <ChevronRight className="w-5 h-5 text-white" />
                                        </button>
                                    </>
                                )}
                                {/* Status Badge */}
                                <div className={`absolute top-3 right-3 px-2 py-1 text-xs font-semibold text-white ${getStatusColor(property.status)}`} style={{ borderRadius: '2px' }}>
                                    {property.status}
                                </div>
                                {/* Category Badge */}
                                <div className="absolute bottom-3 left-3 px-2 py-1 text-xs font-semibold bg-black/60 backdrop-blur-sm text-white flex items-center gap-1.5" style={{ borderRadius: '2px' }}>
                                    {getCategoryIcon(property.category)}
                                    <span>{property.category}</span>
                                </div>
                            </div>

                            {/* Thumbnail Navigation */}
                            {property.images.length > 1 && (
                                <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                                    {property.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`View ${index + 1}`}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`w-16 h-16 object-cover cursor-pointer transition-all ${currentImageIndex === index
                                                    ? 'ring-1 ring-emerald-500'
                                                    : 'opacity-60 hover:opacity-100'
                                                }`}
                                            style={{ borderRadius: '2px' }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title & Basic Info */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <h1 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {property.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {property.location.cell}, {property.location.sector}, {property.location.district}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-gray-400" />
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {property.views} views
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Listed {new Date(property.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                    {property.transactionType === TransactionType.ForLetting ? 'Monthly Rent' : 'Sale Price'}
                                </div>
                                <div className={`text-3xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    {formatPrice(property.price)}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <h3 className={`font-semibold text-base mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Description
                            </h3>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {property.description}
                            </p>
                        </div>

                        {/* Location Details */}
                        {(() => {
                            const locationItems = buildLocationItems();
                            if (locationItems.length === 0) return null;
                            return (
                                <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                                    <h3 className={`font-semibold text-base mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Location Details
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {locationItems.map((item, idx) => (
                                            <div key={idx}>
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-0.5`}>{item.label}</div>
                                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Property Features */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <h3 className={`font-semibold text-base mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Property Features
                            </h3>
                            {(() => {
                                const groups = buildFeatureGroups();
                                if (!groups.length) {
                                    return <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No features listed</p>;
                                }
                                return (
                                    <div className="space-y-4">
                                        {groups.map((group, gIdx) => (
                                            <div key={gIdx}>
                                                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    {group.title}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {group.fields.map((field, fIdx) => (
                                                        <div key={fIdx}>
                                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{field.label}</div>
                                                            {field.value && (
                                                                <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{field.value}</div>
                                                            )}
                                                            {!field.value && field.label && (
                                                                <div className="text-sm text-emerald-500">
                                                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                                                    Included
                                                                </div>
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

                    {/* Sidebar - Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contact Card */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-6`} style={{ borderRadius: '2px' }}>
                            <h3 className={`font-semibold text-base mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Contact Information
                            </h3>

                            <button
                                onClick={() => window.location.href = `tel:${property.contactPhone}`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white transition-colors hover:bg-emerald-700 font-medium mb-2"
                                style={{ borderRadius: '2px' }}
                            >
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">Call {property.contactPhone}</span>
                            </button>

                            {property.whatsappNumber && (
                                <button
                                    onClick={() => {
                                        const link = toWhatsAppLink(property.whatsappNumber || '');
                                        if (link) window.open(link, '_blank');
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white transition-colors hover:bg-emerald-600 font-medium mb-2"
                                    style={{ borderRadius: '2px' }}
                                >
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">WhatsApp {property.whatsappNumber}</span>
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: property.title,
                                            text: property.description,
                                            url: window.location.href
                                        });
                                    }
                                }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 transition-colors font-medium ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm">Share Property</span>
                            </button>
                        </div>

                        {/* Commissioner Info */}
                        {commissioner && (
                            <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                                <h4 className={`font-semibold text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                    Listed by
                                </h4>
                                <div
                                    onClick={() => navigate(`/real-estate/commissioner/${commissioner.id}`)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={commissioner.photo || 'https://i.pravatar.cc/100?img=1'}
                                            alt={commissioner.name}
                                            className="w-12 h-12 object-cover"
                                            style={{ borderRadius: '2px' }}
                                        />
                                        <div className="flex-1">
                                            <div className={`font-semibold flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {commissioner.name}
                                                {commissioner.verified && (
                                                    <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {commissioner.propertiesManaged}+ properties
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:${commissioner.phone}`;
                                        }}
                                        className="w-full px-4 py-2 bg-emerald-600 text-white transition-colors hover:bg-emerald-700 text-sm font-medium"
                                        style={{ borderRadius: '2px' }}
                                    >
                                        Contact Agent
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Similar Properties - Equal sized cards */}
                {similarProperties.length > 0 && (
                    <div className={`mt-8 p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                        <h3 className={`font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Similar Properties
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {similarProperties.map(prop => (
                                <div
                                    key={prop.id}
                                    onClick={() => navigate(`/real-estate/property/${prop.id}`)}
                                    className="cursor-pointer group"
                                >
                                    <div className="overflow-hidden bg-gray-100 dark:bg-gray-700" style={{ borderRadius: '2px' }}>
                                        <img
                                            src={prop.images[0]}
                                            alt={prop.title}
                                            className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <h4 className={`text-sm font-medium line-clamp-1 ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'}`}>
                                            {prop.title}
                                        </h4>
                                        <div className={`text-sm font-bold mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            {formatPrice(prop.price)}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {prop.location.district}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}