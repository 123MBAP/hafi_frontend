import { useDarkMode } from "@/context/DarkMode";
import { API_BASE } from "@/api/apiClient";
import { fetchEdgeRealEstateService, fetchEdgeProvidersByService, fetchEdgeProperties } from "@/api/workerClient";
import PageHeader from "@/components/ui/PageHeader";
import {
    BadgeCheck,
    Building2,
    Filter,
    Home,
    LandPlot,
    MapPin,
    Search,
    RotateCcw,
    Building,
    SlidersHorizontal
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from "@/components/LoadingSpinner";
import RwandaLocationSelector from "@/components/RwandaLocationSelector";
import { filterCommissioners } from "../api/mockRealEstateData";
import {
    Commissioner,
    CommissionerFilters,
    Property,
    PropertyCategory
} from "../api/realEstateTypes";

const PROVINCE_DISTRICTS: Record<string, string[]> = {
    "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
    "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
    "Eastern Province": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
    "Southern Province": ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
    "Western Province": ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"]
};

export default function CommissionersPage() {
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
    const [filteredCommissioners, setFilteredCommissioners] = useState<Commissioner[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [expandedBios, setExpandedBios] = useState<Record<string, boolean>>({});

    const toggleBioExpanded = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedBios(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const [filters, setFilters] = useState<CommissionerFilters>({
        searchQuery: '',
        verifiedOnly: false
    });
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedSector, setSelectedSector] = useState<string>("");
    const [selectedSpecialization, setSelectedSpecialization] = useState<string | undefined>();
    const [minBudget, setMinBudget] = useState<number | undefined>();
    const [maxBudget, setMaxBudget] = useState<number | undefined>();
    const [showFilters, setShowFilters] = useState(true);
    const [specializationOptions, setSpecializationOptions] = useState<string[]>(['Land', 'Residential', 'Commercial']);

    useEffect(() => {
        const fetchSpecializations = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/real-estate/service`);
                if (res.ok) {
                    const data = await res.json();
                    const features = data?.service?.features;
                    if (Array.isArray(features)) {
                        for (const feature of features) {
                            if (feature && feature.type === 'object' && feature.schema && typeof feature.schema === 'object') {
                                const field = feature.schema.property_category;
                                const options = field?.options;
                                if (Array.isArray(options)) {
                                    setSpecializationOptions(options.map((o) => String(o).trim()).filter(Boolean));
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load specialization options:", error);
            }
        };
        fetchSpecializations();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let didCancel = false;

        const toIdString = (value: unknown): string => {
            if (value == null) return '';
            return String(value).trim();
        };

        const propertyOwnerId = (prop: Property): string => {
            const anyProp = prop as any;
            return (
                toIdString(anyProp?.commissionerId) ||
                toIdString(anyProp?.commissioner_id) ||
                toIdString(anyProp?.providerId) ||
                toIdString(anyProp?.provider_id) ||
                toIdString(anyProp?.uploadedById) ||
                toIdString(anyProp?.uploaded_by_id) ||
                toIdString(anyProp?.ownerId) ||
                toIdString(anyProp?.owner_id)
            );
        };

        async function loadData() {
            setLoading(true);
            setLoadError(null);
            try {
                let serviceId: any;
                let providersData: any[] = [];
                let fetchedProperties: Property[] = [];

                try {
                    const sData = await fetchEdgeRealEstateService();
                    serviceId = sData?.service?.id;
                    if (serviceId) {
                        const [pData, propsData] = await Promise.all([
                            fetchEdgeProvidersByService(serviceId),
                            fetchEdgeProperties(200)
                        ]);
                        providersData = pData || [];
                        fetchedProperties = (propsData?.properties as any) || [];
                    }
                } catch {
                    const serviceRes = await fetch(`${API_BASE}/api/real-estate/service`, { signal: controller.signal });
                    if (!serviceRes.ok) throw new Error(`Service API HTTP ${serviceRes.status}`);
                    const serviceData = await serviceRes.json();
                    serviceId = serviceData?.service?.id;

                    if (!serviceId) {
                        throw new Error('Real estate service ID not found');
                    }

                    const providersRes = await fetch(`${API_BASE}/api/providers/${serviceId}/providers`, { signal: controller.signal });
                    if (!providersRes.ok) throw new Error(`Providers API HTTP ${providersRes.status}`);
                    providersData = await providersRes.json();

                    const propsRes = await fetch(`${API_BASE}/api/real-estate/properties`, { signal: controller.signal });
                    if (!propsRes.ok) throw new Error(`Properties API HTTP ${propsRes.status}`);
                    const propsData = await propsRes.json();
                    fetchedProperties = Array.isArray(propsData?.properties) ? propsData.properties : [];
                }

                const activeProviders = providersData.map(p => {
                    const providerId = String(p.id);
                    const providerProps = fetchedProperties.filter(prop => propertyOwnerId(prop) === providerId);

                    const commissioner: Commissioner = {
                        id: String(p.id),
                        name: p.name || p.email.split('@')[0],
                        phone: p.phone_number || p.email,
                        photo: p.profile_image ? (p.profile_image.startsWith('http') ? p.profile_image : `${API_BASE}${p.profile_image}`) : undefined,
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
                        bio: p.bio,
                        specialization: Array.isArray(p.specializations) ? p.specializations : []
                    };
                    return commissioner;
                }) as Commissioner[];

                setCommissioners(activeProviders);
            } catch (e: any) {
                if (didCancel || e?.name === 'AbortError') return;
                console.error('[CommissionersPage] Failed to load data:', e);
                setLoadError(typeof e?.message === 'string' ? e.message : 'Failed to load commissioners');
                setCommissioners([]);
            } finally {
                if (!didCancel) setLoading(false);
            }
        }

        loadData();
        return () => {
            didCancel = true;
            controller.abort();
        };
    }, [reloadToken]);

    useEffect(() => {
        let filtered = commissioners;

        // Apply cascading location filters: Province -> District -> Sector
        if (selectedSector) {
            const sectorLower = selectedSector.toLowerCase();
            filtered = filtered.filter(c => 
                c.operatingLocations.sectors.some(s => s.toLowerCase() === sectorLower) ||
                c.operatingLocations.districts.some(d => d.toLowerCase().includes(sectorLower))
            );
        } else if (selectedDistrict) {
            const districtLower = selectedDistrict.toLowerCase();
            filtered = filtered.filter(c => 
                c.operatingLocations.districts.some(d => d.toLowerCase().includes(districtLower)) ||
                c.operatingLocations.sectors.some(s => s.toLowerCase().includes(districtLower))
            );
        } else if (selectedProvince) {
            const districtsInProvince = PROVINCE_DISTRICTS[selectedProvince] || [selectedProvince];
            filtered = filtered.filter(c => 
                c.operatingLocations.districts.some(d => {
                    const dLower = d.toLowerCase();
                    return districtsInProvince.some(dp => dLower.includes(dp.toLowerCase()));
                })
            );
        }

        // Apply other filters
        const currentFilters: CommissionerFilters = {
            ...filters,
            specialization: selectedSpecialization as any,
            minBudget,
            maxBudget
        };
        filtered = filterCommissioners(filtered, currentFilters);
        setFilteredCommissioners(filtered);
    }, [commissioners, filters, selectedProvince, selectedDistrict, selectedSector, selectedSpecialization, minBudget, maxBudget]);

    const clearFilters = () => {
        setFilters({ searchQuery: '', verifiedOnly: false });
        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedSector("");
        setSelectedSpecialization(undefined);
        setMinBudget(undefined);
        setMaxBudget(undefined);
    };

    const hasActiveFilters = Boolean(
        selectedProvince || selectedDistrict || selectedSector || selectedSpecialization || filters.verifiedOnly || minBudget || maxBudget || filters.searchQuery
    );

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
                return <LandPlot className="w-3.5 h-3.5" />;
            case PropertyCategory.Residential:
                return <Home className="w-3.5 h-3.5" />;
            case PropertyCategory.Commercial:
                return <Building2 className="w-3.5 h-3.5" />;
            default:
                return <Building className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-[#F5F5F5] text-[#151515]'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/' },
                        { label: 'Real Estate', href: '/real-estate' },
                        { label: 'Commissioners' },
                    ]}
                    badge="Verified Agents"
                    title="Real Estate Commissioners"
                    subtitle="Connect with certified property professionals to discover, rent, or purchase real estate across Rwanda."
                    actions={
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer shadow-xs ${
                                    showFilters
                                        ? 'bg-[#E5252A] border-[#E5252A] text-white'
                                        : darkMode
                                            ? 'bg-gray-900 border-gray-800 text-gray-300 hover:border-[#E5252A]'
                                            : 'bg-white border-[#E5E5E5] text-[#151515] hover:border-[#E5252A]'
                                }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/real-estate')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] hover:bg-[#E5252A] dark:hover:bg-[#E5252A] dark:hover:text-white transition-all shadow-xs cursor-pointer"
                            >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Browse Properties</span>
                            </button>
                        </div>
                    }
                />

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-8 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs transition-all">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search agents, locations, or specialties..."
                                    value={filters.searchQuery}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white placeholder-[#666666] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] transition-all"
                                />
                            </div>

                            {/* Province Selector */}
                            <div className="flex-shrink-0 w-36">
                                <RwandaLocationSelector
                                    level="province"
                                    value={selectedProvince}
                                    onChange={(val) => {
                                        setSelectedProvince(val);
                                        setSelectedDistrict("");
                                        setSelectedSector("");
                                    }}
                                    className="w-full text-xs"
                                />
                            </div>

                            {/* District Selector */}
                            <div className="flex-shrink-0 w-36">
                                <RwandaLocationSelector
                                    level="district"
                                    value={selectedDistrict}
                                    parentValues={{ province: selectedProvince }}
                                    onChange={(val) => {
                                        setSelectedDistrict(val);
                                        setSelectedSector("");
                                    }}
                                    className="w-full text-xs"
                                />
                            </div>

                            {/* Sector Selector */}
                            <div className="flex-shrink-0 w-36">
                                <RwandaLocationSelector
                                    level="sector"
                                    value={selectedSector}
                                    parentValues={{ district: selectedDistrict }}
                                    onChange={(val) => {
                                        setSelectedSector(val);
                                    }}
                                    className="w-full text-xs"
                                />
                            </div>

                            {/* Specialization */}
                            <select
                                value={selectedSpecialization || ''}
                                onChange={(e) => setSelectedSpecialization(e.target.value || undefined)}
                                className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] cursor-pointer flex-shrink-0"
                            >
                                <option value="">All Categories</option>
                                {specializationOptions.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* Min Budget */}
                            <input
                                type="number"
                                value={minBudget || ''}
                                onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Min Price"
                                className="w-28 px-3 py-2.5 text-xs font-medium rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white placeholder-[#666666] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] flex-shrink-0"
                            />

                            {/* Max Budget */}
                            <input
                                type="number"
                                value={maxBudget || ''}
                                onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Max Price"
                                className="w-28 px-3 py-2.5 text-xs font-medium rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white placeholder-[#666666] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] flex-shrink-0"
                            />

                            {/* Verified Filter */}
                            <label className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-gray-200 cursor-pointer flex-shrink-0 select-none">
                                <input
                                    type="checkbox"
                                    checked={filters.verifiedOnly}
                                    onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                                    className="h-4 w-4 rounded-sm accent-[#E5252A]"
                                />
                                <BadgeCheck className="w-4 h-4 text-[#E5252A]" />
                                <span>Verified Only</span>
                            </label>

                            {/* Clear button */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E5252A] hover:text-[#c91d22] py-2 px-3 rounded-xl hover:bg-red-500/10 transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Clear Filters</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Agents Section */}
                {loading ? (
                    <div className="py-20">
                        <LoadingSpinner size="lg" message="Loading real estate commissioners..." variant="dots" />
                    </div>
                ) : loadError ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 shadow-sm p-8 max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-[#E5252A] flex items-center justify-center mx-auto mb-3">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-[#151515] dark:text-white mb-1">Unable to load commissioners</h3>
                        <p className="text-xs text-[#666666] dark:text-gray-400 mb-6">{loadError}</p>
                        <button
                            type="button"
                            onClick={() => setReloadToken(t => t + 1)}
                            className="px-6 py-2.5 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredCommissioners.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 shadow-sm p-8 max-w-lg mx-auto">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 text-[#E5252A] flex items-center justify-center">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-[#151515] dark:text-white mb-1">
                            No commissioners found
                        </h3>
                        <p className="text-xs text-[#666666] dark:text-gray-400 max-w-sm mx-auto mb-6">
                            Try adjusting your filters or location to discover available real estate professionals.
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5252A] hover:bg-[#c91d22] text-white shadow-xs transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {filteredCommissioners.map((commissioner) => (
                            <div
                                key={commissioner.id}
                                onClick={() => navigate(`/real-estate/commissioner/${commissioner.id}`)}
                                className="group cursor-pointer rounded-2xl border border-[#E5E5E5] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs hover:shadow-md hover:border-[#E5252A] transition-all duration-300 flex flex-col overflow-hidden"
                            >
                                {/* Photo Container */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F5F5] dark:bg-gray-800">
                                    <img
                                        src={commissioner.photo || 'https://i.pravatar.cc/400?img=1'}
                                        alt={commissioner.name}
                                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://i.pravatar.cc/400?img=1';
                                        }}
                                    />
                                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E5252A] shadow-xs">
                                        <BadgeCheck className="h-3.5 w-3.5 text-[#E5252A]" />
                                        Verified
                                    </div>
                                    <div className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-black/75 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                                        {commissioner.propertiesManaged} Properties
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-base text-[#151515] dark:text-white group-hover:text-[#E5252A] transition-colors truncate">
                                            {commissioner.name}
                                        </h3>

                                        {/* Bio */}
                                        {commissioner.bio && (
                                            <div className="mt-2 text-xs leading-relaxed text-[#666666] dark:text-gray-400">
                                                <p className={expandedBios[commissioner.id] ? '' : 'line-clamp-2'}>
                                                    {commissioner.bio}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleBioExpanded(commissioner.id, e)}
                                                    className="text-[#E5252A] hover:underline font-bold mt-1 text-[10px] uppercase tracking-wider block"
                                                >
                                                    {expandedBios[commissioner.id] ? 'View Less' : 'View More'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Operating Locations */}
                                        <div className="mt-3">
                                            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400">
                                                <MapPin className="w-3.5 h-3.5 text-[#E5252A]" />
                                                <span>Operating In</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {commissioner.operatingLocations.districts.slice(0, 3).map((district, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-gray-300 border border-[#E5E5E5] dark:border-gray-700"
                                                    >
                                                        {district}
                                                    </span>
                                                ))}
                                                {commissioner.operatingLocations.districts.length > 3 && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-[#F5F5F5] dark:bg-gray-800 text-[#666666] dark:text-gray-400 border border-[#E5E5E5] dark:border-gray-700">
                                                        +{commissioner.operatingLocations.districts.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price Range */}
                                        <div className="mt-3 pt-3 border-t border-[#E5E5E5] dark:border-gray-800">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-0.5">
                                                Price Range
                                            </div>
                                            <div className="text-sm font-extrabold text-[#E5252A]">
                                                {formatPrice(commissioner.priceRange.min)} - {formatPrice(commissioner.priceRange.max)}
                                            </div>
                                        </div>

                                        {/* Specialization */}
                                        {commissioner.specialization && commissioner.specialization.length > 0 && (
                                            <div className="mt-2.5 flex flex-wrap gap-1">
                                                {commissioner.specialization.map((spec, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[#E5252A]"
                                                    >
                                                        {getCategoryIcon(spec)}
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4 pt-3 border-t border-[#E5E5E5] dark:border-gray-800">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/real-estate/commissioner/${commissioner.id}`);
                                            }}
                                            className="w-full rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                                        >
                                            View Agent Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
