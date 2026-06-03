/**
 * Feature Type Definitions
 * Supports both simple string features and complex nested object features
 */

export type FeatureFieldType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'location';

export interface FeatureField {
    type: FeatureFieldType;
    required: boolean;
    label: string;
    placeholder?: string;
    options?: string[]; // For select and multiselect types
    requiresValue?: boolean; // For multiselect: if true, user must provide values (e.g., "4 bedrooms")
    defaultValue?: string | number | boolean;
}

export interface SimpleFeature {
    type: 'simple';
    name: string;
    value: string;
}

export interface ObjectFeature {
    type: 'object';
    name: string;
    schema: Record<string, FeatureField>;
}

export type ServiceFeature = SimpleFeature | ObjectFeature;

// Predefined feature templates
export const LOCATION_FEATURE_TEMPLATE: ObjectFeature = {
    type: 'object',
    name: 'Location',
    schema: {
        province: {
            type: 'location',
            required: true,
            label: 'Province',
            placeholder: 'Select province'
        },
        district: {
            type: 'location',
            required: true,
            label: 'District',
            placeholder: 'Select district'
        },
        sector: {
            type: 'location',
            required: true,
            label: 'Sector',
            placeholder: 'Select sector'
        },
        cell: {
            type: 'location',
            required: true,
            label: 'Cell',
            placeholder: 'Select cell'
        },
        village: {
            type: 'location',
            required: true,
            label: 'Village',
            placeholder: 'Select village'
        },
        coordinates: {
            type: 'text',
            required: false,
            label: 'Coordinates (Optional)',
            placeholder: 'e.g., -1.9403, 29.8739'
        }
    }
};

export const CONTACT_FEATURE_TEMPLATE: ObjectFeature = {
    type: 'object',
    name: 'Contact Information',
    schema: {
        phone: {
            type: 'text',
            required: true,
            label: 'Phone Number',
            placeholder: '+250 XXX XXX XXX'
        },
        email: {
            type: 'text',
            required: false,
            label: 'Email',
            placeholder: 'example@email.com'
        },
        website: {
            type: 'text',
            required: false,
            label: 'Website',
            placeholder: 'https://example.com'
        }
    }
};

export const PRICING_FEATURE_TEMPLATE: ObjectFeature = {
    type: 'object',
    name: 'Pricing',
    schema: {
        amount: {
            type: 'number',
            required: true,
            label: 'Price Amount',
            placeholder: '0'
        },
        currency: {
            type: 'select',
            required: true,
            label: 'Currency',
            options: ['RWF', 'USD', 'EUR'],
            defaultValue: 'RWF'
        },
        period: {
            type: 'select',
            required: false,
            label: 'Billing Period',
            options: ['One-time', 'Daily', 'Weekly', 'Monthly', 'Yearly']
        }
    }
};

export const FEATURE_TEMPLATES = {
    location: LOCATION_FEATURE_TEMPLATE,
    contact: CONTACT_FEATURE_TEMPLATE,
    pricing: PRICING_FEATURE_TEMPLATE
};
