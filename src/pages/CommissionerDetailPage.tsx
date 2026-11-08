import { useDarkMode } from "@/context/DarkMode";
import { API_BASE } from "@/api/apiClient";
import { fetchEdgeProviderById, fetchEdgeProperties } from "@/api/workerClient";
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Home,
    LandPlot,
    MapPin,
    Phone,
    Mail,
    CheckCircle,
    Building,
    ShieldCheck,
    Clock,
    Award
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

    useEffect(() => {
        const controller = new AbortController();
        let didCancel = false;

        async function loadData() {
            setLoading(true);
            try {
                let p: any;
                let allProperties: Property[] = [];

                try {
                    const [edgeProvider, edgeProps] = await Promise.all([
                        fetchEdgeProviderById(commissionerId!),
                        fetchEdgeProperties(200)
                    ]);
                    p = edgeProvider;
                    allProperties = (edgeProps?.properties as any) || [];
                } catch {
                    const providerRes = await fetch(`${API_BASE}/api/providers/${commissionerId}`, { signal: controller.signal });
                    if (!providerRes.ok) throw new Error(`Provider API HTTP ${providerRes.status}`);
                    p = await providerRes.json();

                    const propsRes = await fetch(`${API_BASE}/api/real-estate/properties`, { signal: controller.signal });
                    if (!propsRes.ok) throw new Error(`Properties API HTTP ${propsRes.status}`);
                    const propsData = await propsRes.json();
                    allProperties = Array.isArray(propsData?.properties) ? propsData.properties : [];
                }

                const providerProps = allProperties.filter(prop => String(prop.commissionerId) === String(commissionerId));

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
    }, [commissionerId]);

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
                return <LandPlot className="w-4 h-4 text-[#E5252A]" />;
            case PropertyCategory.Residential:
                return <Home className="w-4 h-4 text-[#E5252A]" />;
            case PropertyCategory.Commercial:
                return <Building2 className="w-4 h-4 text-[#E5252A]" />;
            default:
                return <Building className="w-4 h-4 text-[#E5252A]" />;
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-[#F5F5F5] text-[#151515]'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        type="button"
                        onClick={() => navigate('/real-estate/commissioners')}
                        className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 text-[#151515] dark:text-white shadow-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <div className="py-24">
                        <LoadingSpinner size="lg" message="Loading agent details..." variant="dots" />
                    </div>
                </div>
            </div>
        );
    }

    if (!commissioner) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-[#F5F5F5] text-[#151515]'}`}>
                <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 shadow-sm max-w-md mx-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-[#E5252A] flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Agent Not Found</h2>
                    <p className="text-xs text-[#666666] dark:text-gray-400 mb-6">The requested commissioner profile could not be located.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/real-estate/commissioners')}
                        className="px-6 py-2.5 bg-[#E5252A] hover:bg-[#c91d22] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                        Back to Commissioners
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-[#F5F5F5] text-[#151515]'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    type="button"
                    onClick={() => navigate('/real-estate/commissioners')}
                    className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 text-[#151515] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Commissioners</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Agent Profile Card */}
                        <div className="p-6 sm:p-8 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={commissioner.photo || profileFallbackUrl}
                                        alt={commissioner.name}
                                        className="w-24 h-24 rounded-2xl object-cover border border-[#E5E5E5] dark:border-gray-700 shadow-xs"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'https://i.pravatar.cc/100?img=1';
                                        }}
                                    />
                                    {commissioner.verified && (
                                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 rounded-full p-1 shadow-xs border border-[#E5E5E5] dark:border-gray-700">
                                            <BadgeCheck className="w-5 h-5 text-[#E5252A]" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#151515] dark:text-white">
                                            {commissioner.name}
                                        </h1>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        {commissioner.verified && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-[#E5252A] border border-red-500/20">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                Certified Real Estate Agent
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-[#666666] dark:text-gray-300">
                                            <Award className="w-3.5 h-3.5 text-[#E5252A]" />
                                            {commissioner.yearsOfExperience}+ Years Experience
                                        </span>
                                    </div>
                                    {commissioner.email && (
                                        <div className="flex items-center gap-2 text-xs text-[#666666] dark:text-gray-400">
                                            <Mail className="w-3.5 h-3.5 text-[#E5252A]" />
                                            <span className="select-all">{commissioner.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-[#F5F5F5] dark:bg-gray-800/40 border border-[#E5E5E5] dark:border-gray-800">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-0.5">
                                        Managed Portfolio
                                    </div>
                                    <div className="text-2xl font-extrabold text-[#151515] dark:text-white">
                                        {commissioner.propertiesManaged || 0}{' '}
                                        <span className="text-xs font-semibold text-[#666666] dark:text-gray-400">Active Listings</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-0.5">
                                        Price Scope
                                    </div>
                                    <div className="text-xl font-extrabold text-[#E5252A]">
                                        {formatPrice(commissioner.priceRange.min)} - {formatPrice(commissioner.priceRange.max)}
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            {commissioner.bio && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-2 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#E5252A]" />
                                        About the Agent
                                    </h3>
                                    <p className="text-sm leading-relaxed text-[#151515] dark:text-gray-300 font-medium">
                                        {commissioner.bio}
                                    </p>
                                </div>
                            )}

                            {/* Operating Locations */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-2.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Operating Areas
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 block mb-1.5">
                                            Districts
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {commissioner.operatingLocations.districts.map((district, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-gray-200 border border-[#E5E5E5] dark:border-gray-700 shadow-2xs"
                                                >
                                                    {district}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {commissioner.operatingLocations.sectors.length > 0 && (
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 block mb-1.5">
                                                Sectors
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {commissioner.operatingLocations.sectors.map((sector, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-[#F5F5F5] dark:bg-gray-800 text-[#666666] dark:text-gray-300 border border-[#E5E5E5] dark:border-gray-700"
                                                    >
                                                        {sector}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Specialization */}
                            {commissioner.specialization && commissioner.specialization.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-2 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        Property Specializations
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {commissioner.specialization.map((spec, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-[#E5252A]"
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
                            <div className="p-6 sm:p-8 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold tracking-tight text-[#151515] dark:text-white">
                                            Managed Properties
                                        </h3>
                                        <p className="text-xs text-[#666666] dark:text-gray-400 mt-0.5">
                                            Exclusive real estate listings managed by {commissioner.name}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/10 text-[#E5252A] border border-red-500/20">
                                        {managedProperties.length} Available
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {managedProperties.map(property => (
                                        <div
                                            key={property.id}
                                            onClick={() => navigate(`/real-estate/property/${property.id}`)}
                                            className="group cursor-pointer rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-[#F5F5F5] dark:bg-gray-800/40 overflow-hidden hover:border-[#E5252A] transition-all duration-300"
                                        >
                                            <div className="overflow-hidden aspect-[16/10] bg-gray-100 dark:bg-gray-900">
                                                <img
                                                    src={property.images[0]}
                                                    alt={property.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h4 className="text-sm font-bold text-[#151515] dark:text-white group-hover:text-[#E5252A] transition-colors truncate">
                                                    {property.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-[#666666] dark:text-gray-400">
                                                    <MapPin className="w-3.5 h-3.5 text-[#E5252A]" />
                                                    <span>{property.location.district}</span>
                                                </div>
                                                <div className="text-base font-extrabold text-[#E5252A] mt-2">
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
                        <div className="p-6 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs sticky top-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5252A] mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Contact Commissioner
                            </h3>

                            <button
                                type="button"
                                onClick={() => window.location.href = `tel:${commissioner.phone}`}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5252A] hover:bg-[#c91d22] text-white shadow-xs transition-colors mb-5 cursor-pointer"
                            >
                                <Phone className="w-4 h-4" />
                                <span>Call {commissioner.phone}</span>
                            </button>

                            <div className="pt-5 border-t border-[#E5E5E5] dark:border-gray-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-white mb-3">
                                    Trust & Accreditation
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>Verified HafiConnect real estate commissioner</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <ShieldCheck className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>Direct property verification & site visit guidance</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <Building2 className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>Currently managing {commissioner.propertiesManaged} listings</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-[#151515] dark:text-gray-300">
                                        <Clock className="w-4 h-4 text-[#E5252A] shrink-0 mt-0.5" />
                                        <span>Typical consultation response within 24 hours</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-5 mt-5 border-t border-[#E5E5E5] dark:border-gray-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-white mb-3">
                                    Quick Overview
                                </h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#666666] dark:text-gray-400">Response Rate</span>
                                        <span className="font-bold text-[#151515] dark:text-white">&lt; 24h</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#666666] dark:text-gray-400">Languages</span>
                                        <span className="font-bold text-[#151515] dark:text-white">Kinyarwanda, English</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#666666] dark:text-gray-400">Registration ID</span>
                                        <span className="font-mono font-bold text-[#E5252A]">RWA-{commissioner.id.slice(0, 6).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
