import { useDarkMode } from "@/context/DarkMode";
import {
    Building2,
    ChevronDown,
    Filter,
    Grid3X3,
    Home,
    LandPlot,
    List,
    MapPin,
    Phone,
    Search,
    X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
    filterProperties,
    getCellsBySector,
    getSectorsByDistrict,
    getUniqueDistricts,
} from "../api/mockRealEstateData";
import {
    Property,
    PropertyFilters,
    PropertyStatus,
    TransactionType
} from "../api/realEstateTypes";
import LoadingSpinner from "@/components/LoadingSpinner";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const norm = (v: any) => String(v ?? '').trim().toLowerCase();

type RentSellKind = 'rent' | 'sale' | '';

function descriptionValuesOnlyFromUnknown(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') {
        const raw = value.trim();
        if (!raw) return '';
        if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
            try {
                const parsed = JSON.parse(raw);
                return descriptionValuesOnlyFromUnknown(parsed);
            } catch {
                // fall through
            }
        }
        const looksLikeKeyValueDump = /(property_layout|interior_details)\s*:/i.test(raw);
        if (looksLikeKeyValueDump) {
            const withoutKeys = raw
                .replace(/\b[a-zA-Z0-9_]+\s*:\s*/g, '')
                .replace(/\s*[;,]\s*/g, ' · ')
                .replace(/\s{2,}/g, ' ')
                .trim();
            return withoutKeys;
        }
        return raw;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        return value
            .map((v) => descriptionValuesOnlyFromUnknown(v))
            .map((v) => v.trim())
            .filter(Boolean)
            .join(' · ');
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        return Object.values(obj)
            .map((v) => descriptionValuesOnlyFromUnknown(v))
            .map((v) => v.trim())
            .filter(Boolean)
            .join(' · ');
    }
    return '';
}

function roomsFeatureValuesOnly(feature: unknown): string {
    const text = typeof feature === 'string' ? feature.trim() : String(feature ?? '').trim();
    if (!text) return '';
    const hasRoomSeparator = /[>›»→]/.test(text);
    const isRooms = /(rooms\s*description|property_layout|interior_details)\b/i.test(text) || hasRoomSeparator;
    if (!isRooms) return text;
    const tailAfterSeparator = (): string => {
        if (!hasRoomSeparator) return text;
        const parts = text.split(/[>›»→]/).map((p) => p.trim()).filter(Boolean);
        return parts.length ? parts[parts.length - 1] : text;
    };
    if (/\binterior_details\b/i.test(text)) return tailAfterSeparator();
    const lastColon = text.lastIndexOf(':');
    if (lastColon >= 0 && lastColon < text.length - 1) {
        return text.slice(lastColon + 1).trim();
    }
    return tailAfterSeparator();
}

function rentSellTextFromUnknown(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (Array.isArray(value)) {
        const first = value.find((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
        return first == null ? '' : String(first).trim();
    }
    if (typeof value === 'object') {
        const obj: any = value as any;
        const direct = obj?.rent_sell ?? obj?.rentSell ?? obj?.value ?? obj?.label;
        if (direct != null && typeof direct !== 'object') return String(direct).trim();
        for (const v of Object.values(obj)) {
            if (v != null && typeof v !== 'object') return String(v).trim();
        }
    }
    return '';
}

function rentSellKindFromText(text: string): RentSellKind {
    const v = norm(text);
    if (!v) return '';
    if (v.includes('rent') || v.includes('letting') || v.includes('kodesh') || v.includes('gukodesh')) return 'rent';
    if (v.includes('sale') || v.includes('sell') || v.includes('kugur') || v.includes('kugurish')) return 'sale';
    return '';
}

export default function RealEstatePage() {
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState<PropertyFilters>({
        searchQuery: '',
        minPrice: undefined,
        maxPrice: undefined
    });
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType | undefined>();
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedCell, setSelectedCell] = useState<string>('');
    const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'newest' | 'popular'>('popular');

    const districts = getUniqueDistricts();
    const sectors = selectedDistrict ? getSectorsByDistrict(selectedDistrict) : [];
    const cells = selectedDistrict && selectedSector ? getCellsBySector(selectedDistrict, selectedSector) : [];

    const sidebarCategories = useMemo(() => {
        const byLower = new Map<string, string>();
        for (const option of categoryOptions) {
            const trimmed = String(option ?? '').trim();
            if (!trimmed) continue;
            const lower = norm(trimmed);
            if (!byLower.has(lower)) byLower.set(lower, trimmed);
        }
        for (const property of properties) {
            const trimmed = String((property as any)?.category ?? '').trim();
            if (!trimmed) continue;
            const lower = norm(trimmed);
            if (!byLower.has(lower)) byLower.set(lower, trimmed);
        }
        const merged = Array.from(byLower.values());
        return merged.length ? merged : ['Land', 'Residential', 'Commercial'];
    }, [categoryOptions, properties]);

    useEffect(() => {
        const controller = new AbortController();
        let didCancel = false;

        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/real-estate/properties`, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data?.properties) ? data.properties : [];
                setProperties(list);
            } catch (e: any) {
                if (didCancel || e?.name === 'AbortError') return;
                console.error('[RealEstatePage] Failed to load properties:', e);
                setProperties([]);
            } finally {
                if (!didCancel) setLoading(false);
            }
        }

        load();
        return () => {
            didCancel = true;
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        function extractPropertyCategoryOptions(features: any): string[] {
            if (!Array.isArray(features)) return [];
            for (const feature of features) {
                if (!feature || feature.type !== 'object' || !feature.schema || typeof feature.schema !== 'object') continue;
                const field = (feature.schema as any)?.property_category;
                const options = field?.options;
                if (Array.isArray(options)) {
                    return options.map((o) => String(o).trim()).filter(Boolean);
                }
            }
            return [];
        }

        async function loadCategories() {
            try {
                const res = await fetch(`${API_BASE}/api/real-estate/service`, { signal: controller.signal });
                if (!res.ok) return;
                const data = await res.json();
                const features = data?.service?.features;
                const options = extractPropertyCategoryOptions(features);
                if (options.length) setCategoryOptions(options);
            } catch (e: any) {
                if (e?.name === 'AbortError') return;
                console.error('[RealEstatePage] Failed to load category options:', e);
            }
        }

        loadCategories();
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const currentFilters: PropertyFilters = {
            ...filters,
            category: selectedCategory,
            transactionType: undefined,
            district: selectedDistrict || undefined,
            sector: selectedSector || undefined,
            cell: selectedCell || undefined
        };

        let filtered = filterProperties(properties, currentFilters);

        if (selectedTransactionType) {
            const desired: RentSellKind = selectedTransactionType === TransactionType.ForSale ? 'sale' : 'rent';
            filtered = filtered.filter((property) => rentSellKindFromText(rentSellTextFromUnknown((property as any)?.rentSell)) === desired);
        }

        filtered = filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default: return b.views - a.views;
            }
        });

        setFilteredProperties(filtered);
    }, [properties, filters, selectedCategory, selectedTransactionType, selectedDistrict, selectedSector, selectedCell, sortBy]);

    useEffect(() => {
        setSelectedSector('');
        setSelectedCell('');
    }, [selectedDistrict]);

    useEffect(() => {
        setSelectedCell('');
    }, [selectedSector]);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(norm(category) === norm(selectedCategory) ? undefined : category);
    };

    const handlePriceChange = (min: number | undefined, max: number | undefined) => {
        setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }));
    };

    const clearFilters = () => {
        setFilters({ searchQuery: '', minPrice: undefined, maxPrice: undefined });
        setSelectedCategory(undefined);
        setSelectedTransactionType(undefined);
        setSelectedDistrict('');
        setSelectedSector('');
        setSelectedCell('');
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
        if (c.includes('land') || c.includes('plot')) return <LandPlot className="w-4 h-4" />;
        if (c.includes('commercial') || c.includes('business')) return <Building2 className="w-4 h-4" />;
        return <Home className="w-4 h-4" />;
    };

    const getRentSellLabel = (property: Property): string => {
        const raw = rentSellTextFromUnknown((property as any)?.rentSell);
        if (raw) return raw;
        return property.transactionType === TransactionType.ForSale ? 'For Sale' : 'For Rent';
    };

    // Filters Panel - Compact single row on desktop
    const FiltersPanel = () => (
        <div className={`shadow-sm mb-6 overflow-x-auto ${darkMode ? 'bg-gray-950' : 'bg-white'}`} style={{ borderRadius: '2px' }}>
            <div className="p-4 min-w-max flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 flex-shrink-0">
                    {sidebarCategories.slice(0, 5).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`px-3 py-1.5 text-sm whitespace-nowrap transition-all ${norm(selectedCategory) === norm(cat)
                                    ? 'bg-emerald-500 text-white'
                                    : darkMode ? 'bg-gray-950 border border-gray-700 text-gray-300 hover:bg-gray-750' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            style={{ borderRadius: '2px' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Transaction Type */}
                <select
                    value={selectedTransactionType || ''}
                    onChange={(e) => setSelectedTransactionType(e.target.value as TransactionType || undefined)}
                    className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-gray-950 border border-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer`}
                    style={{ borderRadius: '2px' }}
                >
                    <option value="">All: Rent & Sale</option>
                    <option value={TransactionType.ForLetting}>For Rent</option>
                    <option value={TransactionType.ForSale}>For Sale</option>
                </select>

                {/* District */}
                <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className={`px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500 cursor-pointer`}
                    style={{ borderRadius: '2px' }}
                >
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Sector */}
                <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    disabled={!selectedDistrict}
                    className={`px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'} disabled:opacity-50 cursor-pointer`}
                    style={{ borderRadius: '2px' }}
                >
                    <option value="">All Sectors</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Min Price */}
                <input
                    type="number"
                    value={filters.minPrice || ''}
                    onChange={(e) => handlePriceChange(e.target.value ? Number(e.target.value) : undefined, filters.maxPrice)}
                    placeholder="Min Price"
                    className={`w-28 px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-950 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500`}
                    style={{ borderRadius: '2px' }}
                />

                {/* Max Price */}
                <input
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handlePriceChange(filters.minPrice, e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max Price"
                    className={`w-28 px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-950 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500`}
                    style={{ borderRadius: '2px' }}
                />

                {/* Clear button */}
                <button
                    onClick={clearFilters}
                    className="text-sm text-emerald-500 hover:text-emerald-600 whitespace-nowrap flex-shrink-0"
                >
                    Clear all
                </button>
            </div>
        </div>
    );

    // Equal sized card component
    const PropertyCard = ({ property, index }: { property: Property; index: number }) => (
        <div
            onClick={() => navigate(`/real-estate/property/${property.id}`)}
            className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} border-0 shadow-sm`}
            style={{ borderRadius: '2px' }}
        >
            {/* Image - fixed aspect ratio */}
            <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Status badge */}
                <div className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold text-white ${getStatusColor(property.status)}`} style={{ borderRadius: '2px' }}>
                    {property.status}
                </div>
                {/* Category badge */}
                <div className={`absolute bottom-3 left-3 px-2 py-0.5 text-xs font-semibold bg-black/60 backdrop-blur-sm text-white flex items-center gap-1`} style={{ borderRadius: '2px' }}>
                    {getCategoryIcon(property.category)}
                    <span>{property.category}</span>
                </div>
            </div>

            {/* Content - fixed padding, consistent spacing */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className={`font-semibold text-base line-clamp-1 mb-1 ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors`}>
                    {property.title}
                </h3>

                <div className="flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        {property.location.sector}, {property.location.district}
                    </span>
                </div>

                <p className={`text-xs line-clamp-2 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {descriptionValuesOnlyFromUnknown((property as any)?.description) || 'No description available'}
                </p>

                {/* Features chips */}
                {property.features && property.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {property.features.slice(0, 3).map((feature, idx) => (
                            <span
                                key={idx}
                                className={`text-xs px-2 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                {roomsFeatureValuesOnly(feature)}
                            </span>
                        ))}
                    </div>
                )}

                {/* Price and action - at bottom */}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {property.transactionType === TransactionType.ForLetting ? 'Monthly' : 'Price'}
                        </span>
                        <div className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatPrice(property.price)}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${property.contactPhone}`;
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-emerald-600' : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'}`}
                        style={{ borderRadius: '2px' }}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                    </button>
                </div>
            </div>
        </div>
    );

    // List view card
    const PropertyListItem = ({ property }: { property: Property }) => (
        <div
            onClick={() => navigate(`/real-estate/property/${property.id}`)}
            className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md ${darkMode ? 'bg-gray-900' : 'bg-white'} border-0 shadow-sm flex flex-col sm:flex-row`}
            style={{ borderRadius: '2px' }}
        >
            <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0 overflow-hidden">
                <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold text-white ${getStatusColor(property.status)}`} style={{ borderRadius: '2px' }}>
                    {property.status}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                    <h3 className={`font-semibold text-base mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {property.title}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {property.location.sector}, {property.location.district}
                        </span>
                    </div>
                    <p className={`text-xs line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {descriptionValuesOnlyFromUnknown((property as any)?.description) || 'No description'}
                    </p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                    <div>
                        <div className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatPrice(property.price)}
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {property.transactionType === TransactionType.ForLetting ? 'per month' : 'total'}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${property.contactPhone}`;
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-emerald-600' : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'}`}
                        style={{ borderRadius: '2px' }}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className={`text-2xl font-bold tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'} uppercase`}>
                        Real Estate
                    </h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {filteredProperties.length} properties available
                    </p>
                </div>

                {/* Search and View Controls - Compact row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, location, or description..."
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className={`w-full pl-9 pr-4 py-2 text-sm ${darkMode ? 'bg-gray-950 text-white placeholder-gray-400 border border-gray-700' : 'bg-white text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500`}
                            style={{ borderRadius: '2px' }}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className={`px-3 py-2 text-sm border ${darkMode ? 'bg-gray-950 text-white border-gray-700' : 'bg-white text-gray-900'} shadow-sm cursor-pointer`}
                            style={{ borderRadius: '2px' }}
                        >
                            <option value="popular">Most Popular</option>
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className={`flex shadow-sm overflow-hidden`} style={{ borderRadius: '2px' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-all ${viewMode === 'grid'
                                        ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                                        : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 transition-all ${viewMode === 'list'
                                        ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                                        : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`lg:hidden flex items-center gap-1 px-3 py-2 text-sm shadow-sm ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? 'Hide' : 'Filters'}
                        </button>
                    </div>
                </div>

                {/* Filters Panel - Desktop always visible, Mobile toggle */}
                <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-4`}>
                    <FiltersPanel />
                </div>


                {/* Properties Grid/List */}
                {loading ? (
                    <div className="py-16">
                        <LoadingSpinner size="lg" message="Loading properties..." variant="dots" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-16">
                        <div className={`w-20 h-20 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-100'}`} style={{ borderRadius: '2px' }}>
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            No properties found
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Try adjusting your filters
                        </p>
                        <button
                            onClick={clearFilters}
                            className={`mt-4 px-4 py-2 text-sm font-medium ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-sm`}
                            style={{ borderRadius: '2px' }}
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProperties.map((property, idx) => (
                            <PropertyCard key={property.id} property={property} index={idx} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredProperties.map((property) => (
                            <PropertyListItem key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}