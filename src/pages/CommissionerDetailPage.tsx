import { useDarkMode } from "@/context/DarkMode";
import { API_BASE } from "@/api/apiClient";
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

    const profileFallbackUrl = `${API_BASE}/services/profile-image/${commissionerId ?? ''}`;

    const cardBg = darkMode ? "bg-zinc-900 text-white" : "bg-zinc-100 text-black";
    const dividerCol = darkMode ? "border-white/10" : "border-black/10";
    const textTitle = darkMode ? "text-white" : "text-black";
    const textMuted = darkMode ? "text-white/60" : "text-black/60";
    const tagBg = darkMode ? "bg-black text-white" : "bg-white text-black";

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
                        districts: Array.isArray(p.operating_areas) && p.operating_areas.length > 0
                            ? p.operating_areas
                            : (p.address?.district ? [p.address.district] : []),
                        sectors: p.address?.sector ? [p.address.sector] : []
                    },
                    priceRange: {
                        min: providerProps.length ? Math.min(...providerProps.map(pr => pr.price)) : 0,
                        max: providerProps.length ? Math.max(...providerProps.map(pr => pr.price)) : 0
                    },
                    verified: true,
                    propertiesManaged: providerProps.length,
                    yearsOfExperience: 3,
                    bio: p.bio || `Professional real estate agent focused on ${p.address?.district || 'Rwanda'}.`,
                    specialization: Array.isArray(p.specializations) ? p.specializations : []
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
                return <LandPlot className="w-4 h-4 text-red-600" />;
            case PropertyCategory.Residential:
                return <Home className="w-4 h-4 text-red-600" />;
            case PropertyCategory.Commercial:
                return <Building2 className="w-4 h-4 text-red-600" />;
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate('/real-estate/commissioners')}
                        className={`flex items-center gap-2 mb-6 px-3 py-1.5 transition-all text-xs font-bold uppercase tracking-wider ${
                            darkMode ? 'text-white/80 hover:text-red-500 bg-zinc-900 hover:bg-zinc-800' : 'text-black/80 hover:text-red-600 bg-zinc-100 hover:bg-zinc-200'
                        }`}
                        style={{ borderRadius: '2px' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <div className="py-16">
                        <LoadingSpinner size="lg" message="Loading agent details..." variant="dots" />
                    </div>
                </div>
            </div>
        );
    }

    if (!commissioner) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <div className="text-center">
                    <h2 className="text-2xl font-extrabold mb-4">Agent Not Found</h2>
                    <button
                        onClick={() => navigate('/real-estate/commissioners')}
                        className="px-6 py-2.5 bg-red-600 hover:bg-black dark:hover:bg-white dark:hover:text-black text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm"
                        style={{ borderRadius: '2px' }}
                    >
                        Back to Agents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/real-estate/commissioners')}
                    className={`flex items-center gap-2 mb-6 px-3 py-1.5 transition-all text-xs font-bold uppercase tracking-wider ${
                        darkMode ? 'text-white/80 hover:text-red-500 bg-zinc-900 hover:bg-zinc-800' : 'text-black/80 hover:text-red-600 bg-zinc-100 hover:bg-zinc-200'
                    }`}
                    style={{ borderRadius: '2px' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Agents</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Agent Profile Card - Borderless */}
                        <div className={`p-6 ${cardBg} shadow-sm`} style={{ borderRadius: '2px' }}>
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
                                </div>
                                <div className="flex-1">
                                    <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 ${textTitle}`}>
                                        {commissioner.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        {commissioner.verified && (
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                                    darkMode ? 'bg-black text-red-500' : 'bg-white text-red-600 shadow-xs'
                                                }`}
                                                style={{ borderRadius: '2px' }}
                                            >
                                                <BadgeCheck className="w-3.5 h-3.5 text-red-600" />
                                                Verified Agent
                                            </span>
                                        )}
                                    </div>
                                    {commissioner.email && (
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-red-600" />
                                            <span className={`text-xs ${textMuted}`}>{commissioner.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid - Borderless */}
                            <div className={`grid grid-cols-3 gap-3 mb-5 pt-4 border-t ${dividerCol}`}>
                                <div className="text-center">
                                    <div className={`text-xl sm:text-2xl font-extrabold ${textTitle}`}>
                                        {commissioner.propertiesManaged || 0}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${textMuted}`}>
                                        Properties
                                    </div>
                                </div>
                                <div className="text-center col-span-2">
                                    <div className="text-xl sm:text-2xl font-extrabold text-red-600">
                                        {formatPrice(commissioner.priceRange.min)} - {formatPrice(commissioner.priceRange.max)}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${textMuted}`}>
                                        Price range
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            {commissioner.bio && (
                                <div className="mb-5">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-2">
                                        About
                                    </h3>
                                    <p className="text-sm leading-relaxed font-medium">
                                        {commissioner.bio}
                                    </p>
                                </div>
                            )}

                            {/* Operating Locations */}
                            <div className="mb-5">
                                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-2">
                                    Operating Areas
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {commissioner.operatingLocations.districts.map((district, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`text-xs font-bold px-2.5 py-1 ${tagBg} shadow-xs`}
                                                    style={{ borderRadius: '2px' }}
                                                >
                                                    {district}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {commissioner.operatingLocations.sectors.slice(0, 6).map((sector, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`text-xs font-medium px-2 py-0.5 ${tagBg} shadow-xs`}
                                                    style={{ borderRadius: '2px' }}
                                                >
                                                    {sector}
                                                </span>
                                            ))}
                                            {commissioner.operatingLocations.sectors.length > 6 && (
                                                <span
                                                    className={`text-xs font-bold px-2 py-0.5 ${tagBg} shadow-xs`}
                                                    style={{ borderRadius: '2px' }}
                                                >
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
                                    <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-2">
                                        Specialization
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {commissioner.specialization.map((spec, idx) => (
                                            <span
                                                key={idx}
                                                className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 ${tagBg} shadow-xs`}
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

                        {/* Managed Properties - Borderless */}
                        {managedProperties.length > 0 && (
                            <div className={`p-6 ${cardBg} shadow-sm`} style={{ borderRadius: '2px' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-base font-extrabold tracking-tight ${textTitle}`}>
                                        Properties Managed
                                    </h3>
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 ${tagBg} shadow-xs`}
                                        style={{ borderRadius: '2px' }}
                                    >
                                        {managedProperties.length} properties
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {managedProperties.map(property => (
                                        <div
                                            key={property.id}
                                            onClick={() => navigate(`/real-estate/property/${property.id}`)}
                                            className="group cursor-pointer"
                                        >
                                            <div
                                                className={`overflow-hidden ${darkMode ? 'bg-black' : 'bg-white'}`}
                                                style={{ borderRadius: '2px' }}
                                            >
                                                <img
                                                    src={property.images[0]}
                                                    alt={property.title}
                                                    className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="mt-2.5">
                                                <h4 className={`text-sm font-bold line-clamp-1 transition-colors ${
                                                    darkMode ? 'text-white group-hover:text-red-500' : 'text-black group-hover:text-red-600'
                                                }`}>
                                                    {property.title}
                                                </h4>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-red-600" />
                                                    <span className={`text-xs font-medium ${textMuted}`}>
                                                        {property.location.district}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-extrabold text-red-600 mt-1">
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
                        {/* Contact Card - Borderless */}
                        <div className={`p-6 ${cardBg} shadow-sm sticky top-6`} style={{ borderRadius: '2px' }}>
                            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-4">
                                Contact Agent
                            </h3>

                            <button
                                onClick={() => window.location.href = `tel:${commissioner.phone}`}
                                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-black dark:hover:bg-white dark:hover:text-black text-white transition-all duration-300 shadow-sm mb-4"
                                style={{ borderRadius: '2px' }}
                            >
                                <Phone className="w-4 h-4" />
                                <span>Call {commissioner.phone}</span>
                            </button>

                            <div className={`pt-4 border-t ${dividerCol}`}>
                                <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-3">
                                    Why Choose This Agent?
                                </h4>
                                <ul className="space-y-2.5">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                        <span className="text-xs font-medium">Verified professional</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                        <span className="text-xs font-medium">{commissioner.yearsOfExperience}+ years experience</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                        <span className="text-xs font-medium">Manages {commissioner.propertiesManaged} properties</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                        <span className="text-xs font-medium">Customer feedback available</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Quick Info Card - Borderless */}
                        <div className={`p-6 ${cardBg} shadow-sm`} style={{ borderRadius: '2px' }}>
                            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-4">
                                Quick Info
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-medium ${textMuted}`}>Response Time</span>
                                    <span className={`text-xs font-bold ${textTitle}`}>Within 24h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-medium ${textMuted}`}>Languages</span>
                                    <span className={`text-xs font-bold ${textTitle}`}>English, Kinyarwanda</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-medium ${textMuted}`}>License</span>
                                    <span className={`text-xs font-bold ${textTitle}`}>RWA-{commissioner.id.slice(0, 6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
