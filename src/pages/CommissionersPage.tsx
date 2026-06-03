import { useDarkMode } from "@/context/DarkMode";
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
import {
    filterCommissioners,
    getUniqueDistricts
} from "../api/mockRealEstateData";
import {
    Commissioner,
    CommissionerFilters,
    Property,
    PropertyCategory
} from "../api/realEstateTypes";

export default function CommissionersPage() {
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
    const [filteredCommissioners, setFilteredCommissioners] = useState<Commissioner[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const [filters, setFilters] = useState<CommissionerFilters>({
        searchQuery: '',
        verifiedOnly: false
    });
    const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
    const [selectedSpecialization, setSelectedSpecialization] = useState<PropertyCategory | undefined>();
    const [minBudget, setMinBudget] = useState<number | undefined>();
    const [maxBudget, setMaxBudget] = useState<number | undefined>();
    const [showFilters, setShowFilters] = useState(false);

    const districts = getUniqueDistricts();
    const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

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
                            districts: p.address?.district ? [p.address.district] : [],
                            sectors: p.address?.sector ? [p.address.sector] : []
                        },
                        priceRange: {
                            min: providerProps.length ? Math.min(...providerProps.map(pr => pr.price)) : 0,
                            max: providerProps.length ? Math.max(...providerProps.map(pr => pr.price)) : 0
                        },
                        verified: true,
                        propertiesManaged: providerProps.length,
                        yearsOfExperience: 3
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
        const currentFilters: CommissionerFilters = {
            ...filters,
            districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
            specialization: selectedSpecialization,
            minBudget,
            maxBudget
        };
        const filtered = filterCommissioners(commissioners, currentFilters);
        setFilteredCommissioners(filtered);
    }, [commissioners, filters, selectedDistricts, selectedSpecialization, minBudget, maxBudget]);

    const handleDistrictToggle = (district: string) => {
        setSelectedDistricts(prev =>
            prev.includes(district)
                ? prev.filter(d => d !== district)
                : [...prev, district]
        );
    };

    const clearFilters = () => {
        setFilters({ searchQuery: '', verifiedOnly: false });
        setSelectedDistricts([]);
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
        <div className={`border-0 shadow-sm mb-6 overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ borderRadius: '2px' }}>
            <div className="p-3 min-w-max flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
                </div>

                {/* Search - inline */}
                <div className="relative flex-shrink-0">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filters.searchQuery}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className={`pl-8 pr-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500 w-40`}
                        style={{ borderRadius: '2px' }}
                    />
                </div>

                {/* District Filter */}
                <select
                    value=""
                    onChange={(e) => {
                        if (e.target.value) {
                            handleDistrictToggle(e.target.value);
                            e.target.value = '';
                        }
                    }}
                    className={`px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer flex-shrink-0`}
                    style={{ borderRadius: '2px' }}
                >
                    <option value="">Add District</option>
                    {districts.filter(d => !selectedDistricts.includes(d)).map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                {/* Selected Districts Chips */}
                <div className="flex gap-1.5 flex-shrink-0">
                    {selectedDistricts.map(district => (
                        <span
                            key={district}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs ${darkMode ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            {district}
                            <button onClick={() => handleDistrictToggle(district)} className="hover:opacity-70">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>

                {/* Specialization */}
                <select
                    value={selectedSpecialization || ''}
                    onChange={(e) => setSelectedSpecialization(e.target.value as PropertyCategory || undefined)}
                    className={`px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer flex-shrink-0`}
                    style={{ borderRadius: '2px' }}
                >
                    <option value="">All Types</option>
                    {Object.values(PropertyCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

    

                {/* Min Price */}
                <input
                    type="number"
                    value={minBudget || ''}
                    onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min price"
                    className={`w-28 px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500 flex-shrink-0`}
                    style={{ borderRadius: '2px' }}
                />

                {/* Max Price */}
                <input
                    type="number"
                    value={maxBudget || ''}
                    onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max price"
                    className={`w-28 px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500 flex-shrink-0`}
                    style={{ borderRadius: '2px' }}
                />

                {/* Clear button */}
                {(selectedDistricts.length > 0 || selectedSpecialization || filters.verifiedOnly || minBudget || maxBudget || filters.searchQuery) && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-emerald-500 hover:text-emerald-600 whitespace-nowrap flex-shrink-0"
                    >
                        Clear all
                    </button>
                )}
            </div>
        </div>
    );

    // Equal sized commissioner card
    const CommissionerCard = ({ commissioner, index }: { commissioner: Commissioner; index: number }) => (
        <div
            onClick={() => navigate(`/real-estate/commissioner/${commissioner.id}`)}
            className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} border-0 shadow-sm`}
            style={{ borderRadius: '2px' }}
        >
            {/* Header with Photo */}
            <div className="p-4 pb-2 flex items-start gap-3">
                <div className="relative flex-shrink-0">
                    <img
                        src={commissioner.photo || 'https://i.pravatar.cc/100?img=1'}
                        alt={commissioner.name}
                        className="w-14 h-14 object-cover"
                        style={{ borderRadius: '2px' }}
                    />
                    {commissioner.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-0.5" style={{ borderRadius: '2px' }}>
                            <BadgeCheck className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-base truncate ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
                        {commissioner.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {commissioner.yearsOfExperience && (
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {commissioner.yearsOfExperience}+ yrs
                            </span>
                        )}
                        <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>4.8</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties count badge */}
            <div className="px-4 pb-2">
                <span className={`inline-block px-2 py-0.5 text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} style={{ borderRadius: '2px' }}>
                    {commissioner.propertiesManaged} properties managed
                </span>
            </div>

            {/* Operating Locations */}
            <div className="px-4 py-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Operating in
                    </span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {commissioner.operatingLocations.districts.slice(0, 3).map((district, idx) => (
                        <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            {district}
                        </span>
                    ))}
                    {commissioner.operatingLocations.districts.length > 3 && (
                        <span className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`} style={{ borderRadius: '2px' }}>
                            +{commissioner.operatingLocations.districts.length - 3}
                        </span>
                    )}
                </div>
            </div>

            {/* Price Range */}
            <div className="px-4 py-2">
                <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Price range
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {formatPrice(commissioner.priceRange.min)} - {formatPrice(commissioner.priceRange.max)}
                </div>
            </div>

            {/* Specialization */}
            {commissioner.specialization && commissioner.specialization.length > 0 && (
                <div className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                        {commissioner.specialization.map((spec, idx) => (
                            <span
                                key={idx}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                {getCategoryIcon(spec)}
                                {spec}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact Button - at bottom */}
            <div className="mt-auto p-4 pt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${commissioner.phone}`;
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-white hover:bg-emerald-600' : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'}`}
                    style={{ borderRadius: '2px' }}
                >
                    <Phone className="w-3.5 h-3.5" />
                    Contact
                </button>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className={`text-2xl font-bold tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'} uppercase`}>
                        Real Estate Agents
                    </h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {filteredCommissioners.length} verified agents available
                    </p>
                </div>

                {/* Search and View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="hidden sm:block" /> {/* Spacer */}
                    <div className="flex items-center gap-2">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} shadow-sm`}
                            style={{ borderRadius: '2px' }}
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? 'Hide' : 'Filters'}
                        </button>

                        {/* Browse Properties Button */}
                        <button
                            onClick={() => navigate('/real-estate')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'} shadow-sm`}
                            style={{ borderRadius: '2px' }}
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
                        <LoadingSpinner size="lg" message="Loading agents..." />
                    </div>
                ) : loadError ? (
                    <div className={`text-center py-16 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        <h3 className="text-lg font-semibold mb-2">Unable to load agents</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{loadError}</p>
                        <button
                            onClick={() => setReloadToken(t => t + 1)}
                            className="px-4 py-2 bg-emerald-500 text-white transition-colors text-sm"
                            style={{ borderRadius: '2px' }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredCommissioners.length === 0 ? (
                    <div className="text-center py-16">
                        <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                            <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            No agents found
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Try adjusting your filters
                        </p>
                        <button
                            onClick={clearFilters}
                            className={`mt-4 px-4 py-2 text-sm ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-sm`}
                            style={{ borderRadius: '2px' }}
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCommissioners.map((commissioner, idx) => (
                            <CommissionerCard key={commissioner.id} commissioner={commissioner} index={idx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}