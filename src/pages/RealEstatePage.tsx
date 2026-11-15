import { useDarkMode } from "@/context/DarkMode";
import PageHeader from "@/components/ui/PageHeader";
import {
    Building2,
    Filter,
    Grid3X3,
    Home,
    LandPlot,
    List,
    MapPin,
    Phone,
    Search
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
import { API_BASE } from '../api/apiClient';
import { fetchEdgeProperties, fetchEdgeRealEstateService } from '../api/workerClient';

const norm = (v: any) => String(v ?? '').trim().toLowerCase();

type RentSellKind = 'rent' | 'sale' | '';

function deduplicateProperties(list: Property[]): Property[] {
    const seen = new Set<string>();
    return list.filter((property) => {
        const id = String(property?.id ?? '').trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

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
    const [showFilters, setShowFilters] = useState(true);

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
                let list: Property[] = [];
                try {
                    const edgeData = await fetchEdgeProperties(200);
                    list = deduplicateProperties((edgeData?.properties as Property[]) || []);
                } catch {
                    const res = await fetch(`${API_BASE}/api/real-estate/properties`, { signal: controller.signal });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    list = deduplicateProperties(Array.isArray(data?.properties) ? data.properties : []);
                }
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
            case PropertyStatus.Available: return 'bg-red-600 text-white';
            case PropertyStatus.Rented: return 'bg-black text-white';
            case PropertyStatus.Sold: return 'bg-black/80 text-white';
            default: return 'bg-black text-white';
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

    // Filters Panel - Clean single surface with refined tokens matching Home.tsx
    const FiltersPanel = () => (
        <div className="p-3.5 mb-5 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-[#F5F5F5] dark:bg-gray-900/80 shadow-sm transition-all">
            <div className="min-w-max flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-black dark:text-white flex-shrink-0 text-xs font-bold uppercase tracking-wider">
                    <Filter className="w-3.5 h-3.5 text-red-600" />
                    <span>Filters</span>
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 flex-shrink-0">
                    {sidebarCategories.slice(0, 5).map((cat) => {
                        const isSelected = norm(selectedCategory) === norm(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => handleCategorySelect(cat)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all border shadow-sm ${
                                    isSelected
                                        ? 'bg-red-600 border-red-600 text-white'
                                        : darkMode
                                            ? 'bg-gray-900 border-gray-700 text-white hover:border-red-600'
                                            : 'bg-white border-gray-200 text-black hover:border-red-600'
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Transaction Type */}
                <select
                    value={selectedTransactionType || ''}
                    onChange={(e) => setSelectedTransactionType(e.target.value as TransactionType || undefined)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all cursor-pointer ${
                        darkMode
                            ? 'bg-gray-950 border-gray-700 text-white focus:border-red-600'
                            : 'bg-white border-gray-200 text-black focus:border-red-600'
                    } focus:outline-none focus:ring-1 focus:ring-red-600`}
                >
                    <option value="">All: Rent & Sale</option>
                    <option value={TransactionType.ForLetting}>For Rent</option>
                    <option value={TransactionType.ForSale}>For Sale</option>
                </select>

                {/* District */}
                <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all cursor-pointer ${
                        darkMode
                            ? 'bg-gray-950 border-gray-700 text-white focus:border-red-600'
                            : 'bg-white border-gray-200 text-black focus:border-red-600'
                    } focus:outline-none focus:ring-1 focus:ring-red-600`}
                >
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Sector */}
                <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    disabled={!selectedDistrict}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all cursor-pointer ${
                        darkMode
                            ? 'bg-gray-950 border-gray-700 text-white focus:border-red-600'
                            : 'bg-white border-gray-200 text-black focus:border-red-600'
                    } disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-red-600`}
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
                    className={`w-24 px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all ${
                        darkMode
                            ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-400 focus:border-red-600'
                            : 'bg-white border-gray-200 text-black placeholder-gray-500 focus:border-red-600'
                    } focus:outline-none focus:ring-1 focus:ring-red-600`}
                />

                {/* Max Price */}
                <input
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handlePriceChange(filters.minPrice, e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max Price"
                    className={`w-24 px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-all ${
                        darkMode
                            ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-400 focus:border-red-600'
                            : 'bg-white border-gray-200 text-black placeholder-gray-500 focus:border-red-600'
                    } focus:outline-none focus:ring-1 focus:ring-red-600`}
                />

                {/* Clear button */}
                <button
                    onClick={clearFilters}
                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-black dark:hover:text-white whitespace-nowrap flex-shrink-0 transition-colors"
                >
                    Clear all
                </button>
            </div>
        </div>
    );

    // Equal sized property card component
    const PropertyCard = ({ property, index }: { property: Property; index: number }) => (
        <div
            onClick={() => navigate(`/real-estate/property/${property.id}`)}
            className={`group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg flex flex-col h-full ${
                darkMode
                    ? 'bg-gray-900 border border-gray-800 hover:border-red-600'
                    : 'bg-white border border-gray-200 hover:border-red-600'
            } shadow-sm`}
        >
            {/* Image - 1:1 Aspect ratio */}
            <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-gray-50 dark:bg-black">
                <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Status badge */}
                <div className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${getStatusColor(property.status)}`}>
                    {property.status}
                </div>
                {/* Category badge */}
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-semibold bg-black/80 backdrop-blur-sm text-white rounded-full flex items-center gap-1 shadow-sm">
                    {getCategoryIcon(property.category)}
                    <span>{property.category}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-1 leading-snug text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {property.title}
                    </h3>

                    <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        <span className="text-xs text-black/70 dark:text-gray-400 truncate">
                            {property.location.sector}, {property.location.district}
                        </span>
                    </div>

                    <p className="text-xs leading-relaxed line-clamp-2 text-black/80 dark:text-gray-300 mb-2.5">
                        {descriptionValuesOnlyFromUnknown((property as any)?.description) || 'No description available'}
                    </p>

                    {/* Features chips */}
                    {property.features && property.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                            {property.features.slice(0, 3).map((feature, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-black dark:text-gray-200 border border-gray-200/60 dark:border-gray-700"
                                >
                                    {roomsFeatureValuesOnly(feature)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price and action - at bottom */}
                <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-black/70 dark:text-gray-400 block">
                            {property.transactionType === TransactionType.ForLetting ? 'Monthly Rent' : 'Price'}
                        </span>
                        <div className="font-black text-sm sm:text-base text-red-600 dark:text-red-400">
                            {formatPrice(property.price)}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${property.contactPhone}`;
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 text-white hover:bg-black transition-colors shadow-sm"
                    >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                    </button>
                </div>
            </div>
        </div>
    );

    // List view card
    const PropertyListItem = ({ property }: { property: Property }) => (
        <div
            onClick={() => navigate(`/real-estate/property/${property.id}`)}
            className={`group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md ${
                darkMode
                    ? 'bg-gray-900 border border-gray-800 hover:border-red-600'
                    : 'bg-white border border-gray-200 hover:border-red-600'
            } shadow-sm flex flex-col sm:flex-row`}
        >
            <div className="relative h-44 sm:h-auto sm:w-56 flex-shrink-0 overflow-hidden bg-gray-50 dark:bg-black">
                <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(property.status)}`}>
                    {property.status}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {property.title}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-xs text-black/70 dark:text-gray-400">
                            {property.location.sector}, {property.location.district}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed line-clamp-2 text-black/80 dark:text-gray-300">
                        {descriptionValuesOnlyFromUnknown((property as any)?.description) || 'No description'}
                    </p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2.5">
                    <div>
                        <div className="font-black text-base sm:text-lg text-red-600 dark:text-red-400">
                            {formatPrice(property.price)}
                        </div>
                        <span className="text-[10px] text-black/70 dark:text-gray-400 uppercase tracking-wider">
                            {property.transactionType === TransactionType.ForLetting ? 'per month' : 'total'}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${property.contactPhone}`;
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 text-white hover:bg-black transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-black'}`}>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Editorial Header */}
                <PageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/' },
                        { label: 'Real Estate' },
                    ]}
                    title="Real Estate & Properties"
                    subtitle="Discover houses, apartments, residential plots, and commercial properties for rent and sale across Rwanda."
                    badge={
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                            {filteredProperties.length} listings
                        </span>
                    }
                    actions={
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border shadow-sm ${
                                showFilters
                                    ? 'bg-red-600 border-red-600 text-white'
                                    : darkMode
                                        ? 'bg-gray-900 border-gray-800 text-white hover:border-red-600'
                                        : 'bg-white border-gray-200 text-black hover:border-red-600'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                        </button>
                    }
                    darkMode={darkMode}
                />

                {/* Search and View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/40 dark:text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, location, or description..."
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-400 focus:border-red-600'
                                    : 'bg-white border-gray-200 text-black placeholder-gray-500 focus:border-red-600'
                            } focus:outline-none focus:ring-1 focus:ring-red-600`}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className={`px-3 py-2 text-xs sm:text-sm rounded-lg border cursor-pointer transition-all ${
                                darkMode
                                    ? 'bg-gray-900 border-gray-800 text-white focus:border-red-600'
                                    : 'bg-white border-gray-200 text-black focus:border-red-600'
                            } focus:outline-none focus:ring-1 focus:ring-red-600`}
                        >
                            <option value="popular">Most Popular</option>
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-red-600 text-white'
                                        : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-black hover:bg-gray-100'
                                }`}
                                title="Grid View"
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-red-600 text-white'
                                        : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-black hover:bg-gray-100'
                                }`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`lg:hidden flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                                darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-black'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>{showFilters ? 'Hide' : 'Filters'}</span>
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
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                            <Search className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-base font-bold mb-1 text-black dark:text-white">
                            No properties found
                        </h3>
                        <p className="text-xs sm:text-sm text-black/70 dark:text-gray-400 max-w-sm mx-auto">
                            Try adjusting your filters or price range to find matching listings.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 text-white hover:bg-black transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
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