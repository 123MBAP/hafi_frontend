// Real Estate Type Definitions

export enum PropertyCategory {
    Land = 'Land',
    Residential = 'Residential',
    Commercial = 'Commercial'
}

export enum TransactionType {
    ForSale = 'ForSale',
    ForLetting = 'ForLetting'
}

export enum PropertyStatus {
    Available = 'Available',
    Rented = 'Rented',
    Sold = 'Sold'
}

export enum UploadedBy {
    Owner = 'Owner',
    Agent = 'Agent'
}

export interface LocationHierarchy {
    district: string;
    sector: string;
    cell: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface Property {
    id: string;
    title: string;
    category: string;
    transactionType: TransactionType;
    rentSell?: string;
    price: number; // in RWF
    location: LocationHierarchy;
    images: string[];
    uploadedBy: UploadedBy;
    contactPhone: string;
    whatsappNumber?: string;
    status: PropertyStatus;
    commissionerId?: string;
    description: string;
    features?: string[];
    featureValues?: Record<string, any>;
    size?: string;
    createdAt: string;
    views: number;
}

export interface Commissioner {
    id: string;
    name: string;
    phone: string;
    photo?: string;
    operatingLocations: {
        districts: string[];
        sectors: string[];
    };
    priceRange: {
        min: number;
        max: number;
    };
    verified: boolean;
    commissionRate?: number; // percentage
    specialization?: PropertyCategory[];
    bio?: string;
    yearsOfExperience?: number;
    propertiesManaged?: number;
}

export interface PropertyFilters {
    category?: string;
    transactionType?: TransactionType;
    minPrice?: number;
    maxPrice?: number;
    district?: string;
    sector?: string;
    cell?: string;
    status?: PropertyStatus;
    searchQuery?: string;
}

export interface CommissionerFilters {
    districts?: string[];
    minBudget?: number;
    maxBudget?: number;
    verifiedOnly?: boolean;
    specialization?: PropertyCategory;
    searchQuery?: string;
}

export interface RwandaLocation {
    district: string;
    sectors: {
        name: string;
        cells: string[];
    }[];
}
