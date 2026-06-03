import { useDarkMode } from "@/context/DarkMode";
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Home,
    LandPlot,
    MapPin,
    Phone,
    Mail,
    Clock,
    CheckCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { mockCommissioners, mockProperties } from "../api/mockRealEstateData";
import {
    Commissioner,
    Property,
    PropertyCategory
} from "../api/realEstateTypes";
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CommissionerDetailPage() {
    const { commissionerId } = useParams<{ commissionerId: string }>();
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    const [commissioner, setCommissioner] = useState<Commissioner | null>(null);
    const [managedProperties, setManagedProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
    const profileFallbackUrl = `${API_BASE}/services/profile-image/${commissionerId ?? ''}`;

    useEffect(() => {
        const controller = new AbortController();
        let didCancel = false;

        async function loadData() {
            setLoading(true);
            try {
                const providerRes = await fetch(`${API_BASE}/api/providers/${commissionerId}`, { signal: controller.signal });
                if (!providerRes.ok) throw new Error(`Provider API HTTP ${providerRes.status}`);
                const p = await providerRes.json();

                const propsRes = await fetch(`${API_BASE}/api/real-estate/properties`, { signal: controller.signal });
                if (!propsRes.ok) throw new Error(`Properties API HTTP ${propsRes.status}`);
                const propsData = await propsRes.json();
                const allProperties: Property[] = Array.isArray(propsData?.properties) ? propsData.properties : [];

                const providerProps = allProperties.filter(prop => prop.commissionerId === commissionerId);

                const rawProfileImage =
                    p.profile_image_url ||
                    p.profile_image ||
                    p.profileImage ||
                    p.avatar ||
                    p.image_url ||
                    p.image;

                const resolvedProfileImage: string | undefined = rawProfileImage
                    ? (String(rawProfileImage).startsWith('http')
                        ? String(rawProfileImage)
                        : `${API_BASE}${String(rawProfileImage)}`)
                    : undefined;

                const mappedCommissioner: Commissioner = {
                    id: String(p.id),
                    name: p.name || p.email.split('@')[0],
                    phone: p.phone_number || p.email,
                    email: p.email,
                    photo: resolvedProfileImage,
                    operatingLocations: {
                        districts: p.address?.district ? [p.address.district] : [],
                        sectors: p.address?.sector ? [p.address.sector] : []
                    },
                    priceRange: {
                        min: providerProps.length ? Math.min(...providerProps.map(pr => pr.price)) : 0,
                        max: providerProps.length ? Math.max(...providerProps.map(pr => pr.price)) : 0
                    },
                    verified: true,
                    propertiesManaged: providerProps.length,
                    yearsOfExperience: 3,
                    bio: `Professional real estate agent focused on ${p.address?.district || 'Rwanda'}.`
                };

                setCommissioner(mappedCommissioner);
                setManagedProperties(providerProps);
            } catch (e: any) {
                if (didCancel || e?.name === 'AbortError') return;
                console.error('[CommissionerDetailPage] Failed to load data:', e);

                const mockComm = mockCommissioners.find(c => c.id === commissionerId);
                if (mockComm) {
                    setCommissioner(mockComm);
                    setManagedProperties(mockProperties.filter(p => p.commissionerId === commissionerId));
                }
            } finally {
                if (!didCancel) setLoading(false);
            }
        }

        loadData();
        return () => {
            didCancel = true;
            controller.abort();
        };
    }, [commissionerId, API_BASE]);

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            currencyDisplay: 'code',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getCategoryIcon = (category: PropertyCategory) => {
        switch (category) {
            case PropertyCategory.Land:
                return <LandPlot className="w-4 h-4" />;
            case PropertyCategory.Residential:
                return <Home className="w-4 h-4" />;
            case PropertyCategory.Commercial:
                return <Building2 className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate('/real-estate/commissioners')}
                        className={`flex items-center gap-2 mb-6 px-3 py-1.5 transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                        style={{ borderRadius: '2px' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back</span>
                    </button>
                    <div className="py-16">
                        <LoadingSpinner size="lg" message="Loading agent details..." />
                    </div>
                </div>
            </div>
        );
    }

    if (!commissioner) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
                    <button
                        onClick={() => navigate('/real-estate/commissioners')}
                        className="px-6 py-2 bg-emerald-600 text-white transition-colors"
                        style={{ borderRadius: '2px' }}
                    >
                        Back to Agents
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
                    onClick={() => navigate('/real-estate/commissioners')}
                    className={`flex items-center gap-2 mb-6 px-3 py-1.5 transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    style={{ borderRadius: '2px' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Agents</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Agent Profile Card */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={commissioner.photo || profileFallbackUrl}
                                        alt={commissioner.name}
                                        className="w-20 h-20 object-cover"
                                        style={{ borderRadius: '2px' }}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'https://i.pravatar.cc/100?img=1';
                                        }}
                                    />
                                    {commissioner.verified && (
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-0.5" style={{ borderRadius: '2px' }}>
                                            <BadgeCheck className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {commissioner.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        {commissioner.verified && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`} style={{ borderRadius: '2px' }}>
                                                <BadgeCheck className="w-3 h-3" />
                                                Verified Agent
                                            </span>
                                        )}
                                    </div>
                                    {commissioner.email && (
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{commissioner.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid - 3 equal columns */}
                            <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-center">
                                    <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {commissioner.propertiesManaged || 0}
                                    </div>
                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Properties
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {commissioner.yearsOfExperience || 0}+
                                    </div>
                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Years exp.
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {formatPrice(commissioner.priceRange.min)} - {formatPrice(commissioner.priceRange.max)}
                                    </div>
                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Price range
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            {commissioner.bio && (
                                <div className="mb-5">
                                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        About
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {commissioner.bio}
                                    </p>
                                </div>
                            )}

                            {/* Operating Locations */}
                            <div className="mb-5">
                                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Operating Areas
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Districts</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {commissioner.operatingLocations.districts.map((district, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                                                    style={{ borderRadius: '2px' }}
                                                >
                                                    {district}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Sectors</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {commissioner.operatingLocations.sectors.slice(0, 6).map((sector, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                                                    style={{ borderRadius: '2px' }}
                                                >
                                                    {sector}
                                                </span>
                                            ))}
                                            {commissioner.operatingLocations.sectors.length > 6 && (
                                                <span className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} style={{ borderRadius: '2px' }}>
                                                    +{commissioner.operatingLocations.sectors.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Specialization */}
                            {commissioner.specialization && commissioner.specialization.length > 0 && (
                                <div>
                                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Specialization
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {commissioner.specialization.map((spec, idx) => (
                                            <span
                                                key={idx}
                                                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}
                                                style={{ borderRadius: '2px' }}
                                            >
                                                {getCategoryIcon(spec)}
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Managed Properties */}
                        {managedProperties.length > 0 && (
                            <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Properties Managed
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`} style={{ borderRadius: '2px' }}>
                                        {managedProperties.length} properties
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {managedProperties.map(property => (
                                        <div
                                            key={property.id}
                                            onClick={() => navigate(`/real-estate/property/${property.id}`)}
                                            className="group cursor-pointer"
                                        >
                                            <div className={`overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                                                <img
                                                    src={property.images[0]}
                                                    alt={property.title}
                                                    className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <h4 className={`text-sm font-medium line-clamp-1 ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'}`}>
                                                    {property.title}
                                                </h4>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {property.location.district}
                                                    </span>
                                                </div>
                                                <div className={`text-sm font-bold mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    {formatPrice(property.price)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contact Card */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-6`} style={{ borderRadius: '2px' }}>
                            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Contact Agent
                            </h3>

                            <button
                                onClick={() => window.location.href = `tel:${commissioner.phone}`}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors mb-3 ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <Phone className="w-4 h-4" />
                                Call {commissioner.phone}
                            </button>

                            <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Why Choose This Agent?
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Verified professional</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{commissioner.yearsOfExperience}+ years experience</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manages {commissioner.propertiesManaged} properties</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer feedback available</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Quick Info Card */}
                        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Quick Info
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Response Time</span>
                                    <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Within 24h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Languages</span>
                                    <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>English, Kinyarwanda</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>License</span>
                                    <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>RWA-{commissioner.id.slice(0, 6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}