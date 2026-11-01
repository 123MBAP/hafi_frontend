import { useDarkMode } from "@/context/DarkMode";
import { API_BASE } from "@/api/apiClient";
import {
    BadgeCheck,
    Building2,
    Filter,
    Home,
    LandPlot,
    MapPin,
    Phone,
    Search,
    Star,
    ChevronDown,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from "@/components/LoadingSpinner";
import RwandaLocationSelector from "@/components/RwandaLocationSelector";
import {
    filterCommissioners
} from "../api/mockRealEstateData";
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
    }, [API_BASE]);

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
                const serviceRes = await fetch(`${API_BASE}/api/real-estate/service`, { signal: controller.signal });
                if (!serviceRes.ok) throw new Error(`Service API HTTP ${serviceRes.status}`);
                const serviceData = await serviceRes.json();
                const serviceId = serviceData?.service?.id;

                if (!serviceId) {
                    throw new Error('Real estate service ID not found');
                }

                const providersRes = await fetch(`${API_BASE}/api/providers/${serviceId}/providers`, { signal: controller.signal });
                if (!providersRes.ok) throw new Error(`Providers API HTTP ${providersRes.status}`);
                const providersData: any[] = await providersRes.json();

                const propsRes = await fetch(`${API_BASE}/api/real-estate/properties`, { signal: controller.signal });
                if (!propsRes.ok) throw new Error(`Properties API HTTP ${propsRes.status}`);
                const propsData = await propsRes.json();
                const fetchedProperties: Property[] = Array.isArray(propsData?.properties) ? propsData.properties : [];

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
    }, [API_BASE, reloadToken]);

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
        }
    };

    // Compact Filters Panel - Single row on desktop
    const FiltersPanel = () => (
        <div className={`rounded-xl border shadow-sm mb-6 overflow-x-auto ${darkMode ? 'bg-black border-white' : 'bg-white border-black'}`}>
            <div className="p-4 min-w-max flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-black dark:text-white flex-shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Filter by</span>
                </div>

                {/* Search - inline */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black dark:text-white" />
                    <input
                        type="text"
                        placeholder="Search agents, locations, or specialties"
                        value={filters.searchQuery}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className={`pl-10 pr-3 py-2.5 text-sm border rounded-lg w-full ${darkMode ? 'bg-black text-white border-white placeholder-white' : 'bg-white text-black border-black placeholder-black'} focus:ring-2 focus:ring-red-600`}
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
                        className={darkMode ? "border border-white bg-black text-white rounded-lg" : "border border-black bg-white text-black rounded-lg"}
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
                        className={darkMode ? "border border-white bg-black text-white rounded-lg" : "border border-black bg-white text-black rounded-lg"}
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
                        className={darkMode ? "border border-white bg-black text-white rounded-lg" : "border border-black bg-white text-black rounded-lg"}
                    />
                </div>

                {/* Specialization */}
                <select
                    value={selectedSpecialization || ''}
                    onChange={(e) => setSelectedSpecialization(e.target.value || undefined)}
                    className={`px-3 py-2.5 text-sm border rounded-lg ${darkMode ? 'bg-black border-white text-white' : 'bg-white border-black text-black'} focus:ring-2 focus:ring-red-600 cursor-pointer flex-shrink-0`}
                >
                    <option value="">All Types</option>
                    {specializationOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

    

                {/* Min Price */}
                <input
                    type="number"
                    value={minBudget || ''}
                    onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min price"
                    className={`w-28 px-3 py-2.5 text-sm border rounded-lg ${darkMode ? 'bg-black text-white border-white placeholder-white' : 'bg-white text-black border-black placeholder-black'} focus:ring-2 focus:ring-red-600 flex-shrink-0`}
                />

                {/* Max Price */}
                <input
                    type="number"
                    value={maxBudget || ''}
                    onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max price"
                    className={`w-28 px-3 py-2.5 text-sm border rounded-lg ${darkMode ? 'bg-black text-white border-white placeholder-white' : 'bg-white text-black border-black placeholder-black'} focus:ring-2 focus:ring-red-600 flex-shrink-0`}
                />

                <label className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border rounded-lg cursor-pointer flex-shrink-0 ${darkMode ? 'border-white text-white' : 'border-black text-black'}`}>
                    <input
                        type="checkbox"
                        checked={filters.verifiedOnly}
                        onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                        className="h-4 w-4 accent-red-600"
                    />
                    <BadgeCheck className="w-4 h-4 text-red-600" />
                    Verified only
                </label>

                {/* Clear button */}
                {(selectedProvince || selectedDistrict || selectedSector || selectedSpecialization || filters.verifiedOnly || minBudget || maxBudget || filters.searchQuery) && (
                    <button
                        onClick={clearFilters}
                        className="text-sm font-semibold text-red-600 hover:text-black whitespace-nowrap flex-shrink-0"
                    >
                        Clear all
                    </button>
                )}
            </div>
        </div>
    );

    // Equal sized commissioner card
    const CommissionerCard = ({ commissioner }: { commissioner: Commissioner }) => (
        <div
            onClick={() => navigate(`/real-estate/commissioner/${commissioner.id}`)}
            className={`group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full ${darkMode ? 'bg-black border-white' : 'bg-white border-black'} border shadow-sm`}
        >
            {/* Edge-to-edge full width profile image container */}
            <div className={`relative aspect-square w-full overflow-hidden rounded-t-xl ${darkMode ? 'bg-black' : 'bg-white'}`}>
                <img
                    src={commissioner.photo || 'https://i.pravatar.cc/400?img=1'}
                    alt={commissioner.name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        e.currentTarget.src = 'https://i.pravatar.cc/400?img=1';
                    }}
                />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-600 shadow-sm">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                </div>
            </div>

            {/* Header text */}
            <div className="px-4 pt-4 pb-1">
                <h3 className={`font-bold text-base ${darkMode ? 'text-white group-hover:text-red-400' : 'text-black group-hover:text-red-600'} transition-colors truncate`}>
                    {commissioner.name}
                </h3>
            </div>

            {/* Properties count badge */}
            <div className="px-4 pb-2">
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? 'bg-black border border-white text-white' : 'bg-white border border-black text-black'}`}>
                    {commissioner.propertiesManaged} properties managed
                </span>
            </div>

            {/* Bio */}
            {commissioner.bio && (
                <div className="px-4 py-1 text-xs leading-relaxed">
                    <p className={`${
                        expandedBios[commissioner.id] ? '' : 'line-clamp-4'
                    } ${darkMode ? 'text-white' : 'text-black'}`}>
                        {commissioner.bio}
                    </p>
                    <button
                        onClick={(e) => toggleBioExpanded(commissioner.id, e)}
                        className="text-red-600 hover:text-black font-bold mt-1 text-[10px] uppercase tracking-wider block"
                    >
                        {expandedBios[commissioner.id] ? 'View Less' : 'View More'}
                    </button>
                </div>
            )}

            {/* Operating Locations */}
            <div className="px-4 py-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                        Operating in
                    </span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {commissioner.operatingLocations.districts.slice(0, 3).map((district, idx) => (
                        <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-black border border-white text-white' : 'bg-white border border-black text-black'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            {district}
                        </span>
                    ))}
                    {commissioner.operatingLocations.districts.length > 3 && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-black border border-white text-white' : 'bg-white border border-black text-black'}`}>
                            +{commissioner.operatingLocations.districts.length - 3}
                        </span>
                    )}
                </div>
            </div>

            {/* Price Range */}
            <div className="px-4 py-3">
                <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                    Price range
                </div>
                <div className="text-base font-black text-red-600">
                    {formatPrice(commissioner.priceRange.min)} - {formatPrice(commissioner.priceRange.max)}
                </div>
            </div>

            {/* Specialization */}
            {commissioner.specialization && commissioner.specialization.length > 0 && (
                <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">

                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                        Specialization
                    </span>
                </div>  
                    <div className="flex flex-wrap gap-1.5">
                        {commissioner.specialization.map((spec, idx) => (
                            <span
                                key={idx}
                                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${darkMode ? 'bg-black border border-red-600 text-red-400' : 'bg-white border border-red-600 text-red-600'}`}
                                style={{ borderRadius: '999px' }}
                            >
                                {getCategoryIcon(spec)}
                                {spec}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-auto border-t px-4 py-3" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/real-estate/commissioner/${commissioner.id}`);
                    }}
                    className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                    View agent profile
                </button>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-black'} uppercase`}>
                        Find the Right Property with a Real Estate Professional
                    </h1>
                    <p className={`text-sm sm:text-base ${darkMode ? 'text-white' : 'text-black'} mt-2.5 leading-relaxed max-w-4xl`}>
                        Looking for a property but not sure where to start? HafiConnect connects you with real estate agents and property commissioners who can help you explore available properties based on your needs. Browse professional profiles, discover the areas they serve, and contact them directly for assistance finding houses, apartments, land, rental spaces, or commercial properties. Share your preferred location, budget, and property requirements to make your search easier.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md ${darkMode ? 'bg-black text-white border border-red-600' : 'bg-white text-black border border-red-600'}`}>
                            {filteredCommissioners.length} verified property professionals available
                        </span>
                    </div>
                </div>

                {/* Search and View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="hidden sm:block" /> {/* Spacer */}
                    <div className="flex items-center gap-2">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border ${darkMode ? 'bg-black text-white border-white' : 'bg-white text-black border-black'} shadow-sm hover:bg-red-600 hover:text-white`}
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? 'Hide' : 'Filters'}
                        </button>

                        {/* Browse Properties Button */}
                        <button
                            onClick={() => navigate('/real-estate')}
                            className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-xl bg-red-600 text-white transition-colors hover:bg-black shadow-sm"
                        >
                            Browse Properties
                        </button>
                    </div>
                </div>

                {/* Filters Panel - Desktop always visible, Mobile toggle */}
                <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-4`}>
                    <FiltersPanel />
                </div>

                {/* Agents Grid */}
                {loading ? (
                    <div className="py-16">
                        <LoadingSpinner size="lg" message="Loading agents..." variant="dots" />
                    </div>
                ) : loadError ? (
                    <div className={`text-center py-16 ${darkMode ? 'text-white' : 'text-black'}`}>
                        <h3 className="text-lg font-semibold mb-2">Unable to load agents</h3>
                        <p className={`text-sm ${darkMode ? 'text-white' : 'text-black'} mb-6`}>{loadError}</p>
                        <button
                            onClick={() => setReloadToken(t => t + 1)}
                            className="px-4 py-2 rounded-xl bg-red-600 text-white transition-colors text-sm hover:bg-black"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredCommissioners.length === 0 ? (
                    <div className="text-center py-16">
                        <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-xl ${darkMode ? 'bg-black border border-white' : 'bg-white border border-black'}`}>
                            <Search className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className={`text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                            No agents found
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-white' : 'text-black'}`}>
                            Try adjusting your filters
                        </p>
                        <button
                            onClick={clearFilters}
                            className={`mt-4 px-4 py-2 rounded-xl text-sm ${darkMode ? 'bg-black text-white border border-white hover:bg-red-600' : 'bg-white text-black border border-black hover:bg-red-600 hover:text-white'} shadow-sm`}
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                        {filteredCommissioners.map((commissioner) => (
                            <CommissionerCard key={commissioner.id} commissioner={commissioner} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}