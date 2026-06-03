import {
    Commissioner,
    CommissionerFilters,
    Property,
    PropertyCategory,
    PropertyFilters,
    PropertyStatus,
    RwandaLocation,
    TransactionType,
    UploadedBy
} from './realEstateTypes';

// Rwanda Location Hierarchy Data
export const rwandaLocations: RwandaLocation[] = [
    {
        district: 'Gasabo',
        sectors: [
            {
                name: 'Kacyiru',
                cells: ['Kamatamu', 'Kamutwa', 'Kibaza', 'Mpenge']
            },
            {
                name: 'Kimironko',
                cells: ['Bibare', 'Kibagabaga', 'Kimironko', 'Nyagatovu']
            },
            {
                name: 'Remera',
                cells: ['Gishushu', 'Kabeza', 'Rukiri I', 'Rukiri II']
            },
            {
                name: 'Kinyinya',
                cells: ['Gacuriro', 'Kajevuba', 'Nyabisindu', 'Nyagahinga']
            }
        ]
    },
    {
        district: 'Kicukiro',
        sectors: [
            {
                name: 'Gikondo',
                cells: ['Gikondo', 'Nyenyeri', 'Rebero', 'Shyorongi']
            },
            {
                name: 'Niboye',
                cells: ['Gahanga', 'Karama', 'Niboye', 'Nyanza']
            },
            {
                name: 'Kanombe',
                cells: ['Busanza', 'Kabuga', 'Nyarurama', 'Rukoma']
            }
        ]
    },
    {
        district: 'Nyarugenge',
        sectors: [
            {
                name: 'Nyarugenge',
                cells: ['Amahoro', 'Gitega', 'Kanyinya', 'Nyarugenge']
            },
            {
                name: 'Muhima',
                cells: ['Amahoro', 'Gitega', 'Muhima', 'Rugenge']
            },
            {
                name: 'Kimisagara',
                cells: ['Biryogo', 'Cyivugiza', 'Kimisagara', 'Nyabugogo']
            }
        ]
    },
    {
        district: 'Musanze',
        sectors: [
            {
                name: 'Muhoza',
                cells: ['Cyuve', 'Kabeza', 'Muhoza', 'Ruhengeri']
            },
            {
                name: 'Busogo',
                cells: ['Busogo', 'Cyabararika', 'Gashaki', 'Kidashya']
            }
        ]
    },
    {
        district: 'Huye',
        sectors: [
            {
                name: 'Ngoma',
                cells: ['Matyazo', 'Ngoma', 'Rango', 'Tumba']
            },
            {
                name: 'Tumba',
                cells: ['Karama', 'Matyazo', 'Rango', 'Tumba']
            }
        ]
    }
];

// Mock Commissioners Data
export const mockCommissioners: Commissioner[] = [
    {
        id: 'comm-001',
        name: 'Jean Claude Mugabo',
        phone: '+250788123456',
        photo: 'https://i.pravatar.cc/150?img=12',
        operatingLocations: {
            districts: ['Gasabo', 'Kicukiro'],
            sectors: ['Kacyiru', 'Kimironko', 'Remera', 'Gikondo']
        },
        priceRange: {
            min: 100000,
            max: 500000
        },
        verified: true,
        commissionRate: 10,
        specialization: [PropertyCategory.Residential, PropertyCategory.Commercial],
        bio: 'Experienced real estate agent with 8+ years in Kigali property market. Specializing in residential and commercial properties.',
        yearsOfExperience: 8,
        propertiesManaged: 45
    },
    {
        id: 'comm-002',
        name: 'Marie Claire Uwase',
        phone: '+250788234567',
        photo: 'https://i.pravatar.cc/150?img=5',
        operatingLocations: {
            districts: ['Nyarugenge', 'Gasabo'],
            sectors: ['Nyarugenge', 'Muhima', 'Kinyinya']
        },
        priceRange: {
            min: 50000,
            max: 300000
        },
        verified: true,
        commissionRate: 8,
        specialization: [PropertyCategory.Residential],
        bio: 'Dedicated to helping families find their perfect home in Kigali. Fluent in English, French, and Kinyarwanda.',
        yearsOfExperience: 5,
        propertiesManaged: 32
    },
    {
        id: 'comm-003',
        name: 'Patrick Nkurunziza',
        phone: '+250788345678',
        photo: 'https://i.pravatar.cc/150?img=33',
        operatingLocations: {
            districts: ['Musanze'],
            sectors: ['Muhoza', 'Busogo']
        },
        priceRange: {
            min: 30000,
            max: 200000
        },
        verified: true,
        commissionRate: 7,
        specialization: [PropertyCategory.Residential, PropertyCategory.Land],
        bio: 'Local expert in Musanze region. Specializing in residential properties and land sales near Volcanoes National Park.',
        yearsOfExperience: 6,
        propertiesManaged: 28
    },
    {
        id: 'comm-004',
        name: 'Divine Umutoni',
        phone: '+250788456789',
        photo: 'https://i.pravatar.cc/150?img=9',
        operatingLocations: {
            districts: ['Kicukiro', 'Gasabo'],
            sectors: ['Kanombe', 'Niboye', 'Remera']
        },
        priceRange: {
            min: 80000,
            max: 400000
        },
        verified: true,
        commissionRate: 9,
        specialization: [PropertyCategory.Commercial, PropertyCategory.Residential],
        bio: 'Commercial property specialist with strong network in business districts. Helping businesses find ideal locations.',
        yearsOfExperience: 7,
        propertiesManaged: 38
    },
    {
        id: 'comm-005',
        name: 'Eric Habimana',
        phone: '+250788567890',
        photo: 'https://i.pravatar.cc/150?img=15',
        operatingLocations: {
            districts: ['Huye'],
            sectors: ['Ngoma', 'Tumba']
        },
        priceRange: {
            min: 40000,
            max: 250000
        },
        verified: false,
        commissionRate: 6,
        specialization: [PropertyCategory.Residential],
        bio: 'Serving the Huye community with affordable housing solutions. Student-friendly accommodations near university.',
        yearsOfExperience: 3,
        propertiesManaged: 15
    },
    {
        id: 'comm-006',
        name: 'Grace Mukamana',
        phone: '+250788678901',
        photo: 'https://i.pravatar.cc/150?img=10',
        operatingLocations: {
            districts: ['Gasabo', 'Nyarugenge'],
            sectors: ['Kacyiru', 'Kimisagara', 'Muhima']
        },
        priceRange: {
            min: 60000,
            max: 350000
        },
        verified: true,
        commissionRate: 8,
        specialization: [PropertyCategory.Residential],
        bio: 'Passionate about connecting people with homes they love. Excellent negotiation skills and market knowledge.',
        yearsOfExperience: 4,
        propertiesManaged: 22
    },
    {
        id: 'comm-007',
        name: 'Samuel Bizimana',
        phone: '+250788789012',
        photo: 'https://i.pravatar.cc/150?img=51',
        operatingLocations: {
            districts: ['Gasabo'],
            sectors: ['Kinyinya', 'Kimironko']
        },
        priceRange: {
            min: 150000,
            max: 800000
        },
        verified: true,
        commissionRate: 12,
        specialization: [PropertyCategory.Residential, PropertyCategory.Commercial],
        bio: 'Luxury property specialist in premium Kigali neighborhoods. High-end residential and commercial properties.',
        yearsOfExperience: 10,
        propertiesManaged: 52
    },
    {
        id: 'comm-008',
        name: 'Ange Uwimana',
        phone: '+250788890123',
        photo: 'https://i.pravatar.cc/150?img=16',
        operatingLocations: {
            districts: ['Kicukiro'],
            sectors: ['Gikondo', 'Niboye']
        },
        priceRange: {
            min: 70000,
            max: 300000
        },
        verified: true,
        commissionRate: 7,
        specialization: [PropertyCategory.Residential],
        bio: 'First-time homebuyer specialist. Patient and thorough in helping clients understand the rental process.',
        yearsOfExperience: 4,
        propertiesManaged: 19
    }
];

// Mock Properties Data
export const mockProperties: Property[] = [
    // RESIDENTIAL - FOR LETTING
    {
        id: 'prop-001',
        title: 'Modern 3-Bedroom Apartment in Kacyiru',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 250000,
        location: {
            district: 'Gasabo',
            sector: 'Kacyiru',
            cell: 'Kamatamu',
            coordinates: { lat: -1.9441, lng: 30.0936 }
        },
        images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788123456',
        status: PropertyStatus.Available,
        commissionerId: 'comm-001',
        description: 'Spacious modern apartment with stunning city views. Fully furnished with contemporary amenities including high-speed internet, backup generator, and 24/7 security.',
        features: ['3 Bedrooms', '2 Bathrooms', 'Balcony', 'Parking', 'Security', 'Generator'],
        size: '150 sqm',
        createdAt: '2026-01-15T10:00:00Z',
        views: 145
    },
    {
        id: 'prop-002',
        title: 'Cozy Studio Apartment in Kimironko',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 80000,
        location: {
            district: 'Gasabo',
            sector: 'Kimironko',
            cell: 'Kibagabaga',
            coordinates: { lat: -1.9536, lng: 30.1234 }
        },
        images: [
            'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
            'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788999888',
        status: PropertyStatus.Available,
        description: 'Perfect for students or young professionals. Close to shopping centers, restaurants, and public transport.',
        features: ['1 Bedroom', '1 Bathroom', 'Kitchenette', 'WiFi Ready'],
        size: '45 sqm',
        createdAt: '2026-01-18T14:30:00Z',
        views: 89
    },
    {
        id: 'prop-003',
        title: 'Luxury 4-Bedroom Villa in Gacuriro',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 600000,
        location: {
            district: 'Gasabo',
            sector: 'Kinyinya',
            cell: 'Gacuriro',
            coordinates: { lat: -1.9167, lng: 30.1333 }
        },
        images: [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788789012',
        status: PropertyStatus.Available,
        commissionerId: 'comm-007',
        description: 'Exclusive villa in premium Gacuriro estate. Features swimming pool, landscaped garden, and panoramic views of Kigali.',
        features: ['4 Bedrooms', '3 Bathrooms', 'Swimming Pool', 'Garden', 'Garage', 'Security', 'Generator', 'Staff Quarters'],
        size: '350 sqm',
        createdAt: '2026-01-10T09:00:00Z',
        views: 234
    },
    {
        id: 'prop-004',
        title: '2-Bedroom Apartment in Remera',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 180000,
        location: {
            district: 'Gasabo',
            sector: 'Remera',
            cell: 'Gishushu',
            coordinates: { lat: -1.9536, lng: 30.0936 }
        },
        images: [
            'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
            'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788234567',
        status: PropertyStatus.Available,
        commissionerId: 'comm-002',
        description: 'Well-maintained apartment in quiet neighborhood. Close to schools, hospitals, and shopping areas.',
        features: ['2 Bedrooms', '1 Bathroom', 'Living Room', 'Kitchen', 'Parking'],
        size: '95 sqm',
        createdAt: '2026-01-17T11:20:00Z',
        views: 112
    },
    {
        id: 'prop-005',
        title: 'Affordable 1-Bedroom in Gikondo',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 60000,
        location: {
            district: 'Kicukiro',
            sector: 'Gikondo',
            cell: 'Gikondo',
            coordinates: { lat: -1.9833, lng: 30.0667 }
        },
        images: [
            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788111222',
        status: PropertyStatus.Available,
        description: 'Budget-friendly apartment ideal for singles or couples. Walking distance to industrial zone.',
        features: ['1 Bedroom', '1 Bathroom', 'Small Kitchen'],
        size: '40 sqm',
        createdAt: '2026-01-19T16:45:00Z',
        views: 67
    },
    {
        id: 'prop-006',
        title: 'Family Home in Niboye',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 320000,
        location: {
            district: 'Kicukiro',
            sector: 'Niboye',
            cell: 'Gahanga',
            coordinates: { lat: -1.9833, lng: 30.1167 }
        },
        images: [
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788456789',
        status: PropertyStatus.Available,
        commissionerId: 'comm-004',
        description: 'Spacious family home with large compound. Perfect for families with children. Safe and secure neighborhood.',
        features: ['3 Bedrooms', '2 Bathrooms', 'Large Compound', 'Parking', 'Security'],
        size: '180 sqm',
        createdAt: '2026-01-14T13:00:00Z',
        views: 156
    },
    {
        id: 'prop-007',
        title: 'Student Accommodation in Tumba',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 45000,
        location: {
            district: 'Huye',
            sector: 'Tumba',
            cell: 'Tumba',
            coordinates: { lat: -2.5833, lng: 29.7333 }
        },
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788567890',
        status: PropertyStatus.Available,
        commissionerId: 'comm-005',
        description: 'Affordable student housing near University of Rwanda. Shared facilities available.',
        features: ['1 Bedroom', 'Shared Bathroom', 'Study Desk', 'WiFi'],
        size: '25 sqm',
        createdAt: '2026-01-16T10:30:00Z',
        views: 98
    },
    {
        id: 'prop-008',
        title: 'Penthouse Apartment in Muhima',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 450000,
        location: {
            district: 'Nyarugenge',
            sector: 'Muhima',
            cell: 'Muhima',
            coordinates: { lat: -1.9500, lng: 30.0600 }
        },
        images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788234567',
        status: PropertyStatus.Available,
        commissionerId: 'comm-002',
        description: 'Stunning penthouse with rooftop terrace. Downtown location with easy access to CBD.',
        features: ['3 Bedrooms', '2 Bathrooms', 'Rooftop Terrace', 'City Views', 'Elevator', 'Parking'],
        size: '200 sqm',
        createdAt: '2026-01-12T08:15:00Z',
        views: 189
    },

    // RESIDENTIAL - FOR SALE
    {
        id: 'prop-009',
        title: 'Brand New House in Kinyinya',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForSale,
        price: 85000000,
        location: {
            district: 'Gasabo',
            sector: 'Kinyinya',
            cell: 'Nyabisindu',
            coordinates: { lat: -1.9200, lng: 30.1400 }
        },
        images: [
            'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
            'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788333444',
        status: PropertyStatus.Available,
        description: 'Newly constructed modern house with all amenities. Prime location in developing area.',
        features: ['4 Bedrooms', '3 Bathrooms', 'Modern Kitchen', 'Garden', 'Parking', 'Title Deed'],
        size: '280 sqm',
        createdAt: '2026-01-11T12:00:00Z',
        views: 267
    },
    {
        id: 'prop-010',
        title: 'Investment Property in Kanombe',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForSale,
        price: 45000000,
        location: {
            district: 'Kicukiro',
            sector: 'Kanombe',
            cell: 'Busanza',
            coordinates: { lat: -1.9667, lng: 30.1167 }
        },
        images: [
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788456789',
        status: PropertyStatus.Available,
        commissionerId: 'comm-004',
        description: 'Great investment opportunity near airport. Currently generating rental income.',
        features: ['3 Bedrooms', '2 Bathrooms', 'Rental Income', 'Near Airport'],
        size: '160 sqm',
        createdAt: '2026-01-13T15:20:00Z',
        views: 178
    },

    // COMMERCIAL - FOR LETTING
    {
        id: 'prop-011',
        title: 'Modern Office Space in Kacyiru',
        category: PropertyCategory.Commercial,
        transactionType: TransactionType.ForLetting,
        price: 800000,
        location: {
            district: 'Gasabo',
            sector: 'Kacyiru',
            cell: 'Mpenge',
            coordinates: { lat: -1.9450, lng: 30.0950 }
        },
        images: [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788123456',
        status: PropertyStatus.Available,
        commissionerId: 'comm-001',
        description: 'Premium office space in business district. Ideal for corporate headquarters or regional offices.',
        features: ['Open Plan', 'Meeting Rooms', 'Parking', 'Security', 'Generator', 'High-Speed Internet'],
        size: '450 sqm',
        createdAt: '2026-01-09T09:30:00Z',
        views: 201
    },
    {
        id: 'prop-012',
        title: 'Retail Shop in Kimironko',
        category: PropertyCategory.Commercial,
        transactionType: TransactionType.ForLetting,
        price: 350000,
        location: {
            district: 'Gasabo',
            sector: 'Kimironko',
            cell: 'Kimironko',
            coordinates: { lat: -1.9550, lng: 30.1250 }
        },
        images: [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788555666',
        status: PropertyStatus.Available,
        description: 'High-traffic retail location in busy shopping area. Perfect for boutique or electronics shop.',
        features: ['Ground Floor', 'Display Windows', 'Storage Room', 'High Foot Traffic'],
        size: '80 sqm',
        createdAt: '2026-01-15T14:00:00Z',
        views: 134
    },
    {
        id: 'prop-013',
        title: 'Restaurant Space in Remera',
        category: PropertyCategory.Commercial,
        transactionType: TransactionType.ForLetting,
        price: 500000,
        location: {
            district: 'Gasabo',
            sector: 'Remera',
            cell: 'Kabeza',
            coordinates: { lat: -1.9550, lng: 30.0950 }
        },
        images: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788456789',
        status: PropertyStatus.Available,
        commissionerId: 'comm-004',
        description: 'Fully equipped restaurant space with kitchen. Ready for immediate operation.',
        features: ['Commercial Kitchen', 'Dining Area', 'Bar Counter', 'Parking', 'Outdoor Seating'],
        size: '200 sqm',
        createdAt: '2026-01-08T11:45:00Z',
        views: 167
    },
    {
        id: 'prop-014',
        title: 'Warehouse in Gikondo Industrial Zone',
        category: PropertyCategory.Commercial,
        transactionType: TransactionType.ForLetting,
        price: 1200000,
        location: {
            district: 'Kicukiro',
            sector: 'Gikondo',
            cell: 'Shyorongi',
            coordinates: { lat: -1.9850, lng: 30.0700 }
        },
        images: [
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788777888',
        status: PropertyStatus.Available,
        description: 'Large warehouse facility with loading dock. Ideal for distribution or manufacturing.',
        features: ['Loading Dock', 'High Ceiling', 'Security', 'Truck Access', 'Office Space'],
        size: '800 sqm',
        createdAt: '2026-01-07T10:00:00Z',
        views: 145
    },
    {
        id: 'prop-015',
        title: 'Co-Working Space in Nyarugenge',
        category: PropertyCategory.Commercial,
        transactionType: TransactionType.ForLetting,
        price: 600000,
        location: {
            district: 'Nyarugenge',
            sector: 'Nyarugenge',
            cell: 'Gitega',
            coordinates: { lat: -1.9550, lng: 30.0580 }
        },
        images: [
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
            'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788678901',
        status: PropertyStatus.Available,
        commissionerId: 'comm-006',
        description: 'Modern co-working space with flexible desk arrangements. Perfect for startups and freelancers.',
        features: ['Hot Desks', 'Meeting Rooms', 'High-Speed WiFi', 'Coffee Bar', 'Printing Facilities'],
        size: '300 sqm',
        createdAt: '2026-01-14T09:00:00Z',
        views: 189
    },

    // COMMERCIAL - FOR SALE
    {
        id: 'prop-016',
        title: 'Commercial Building in Muhima',
        category: PropertyCategory.Commercial,
        transactionType: TransactionType.ForSale,
        price: 250000000,
        location: {
            district: 'Nyarugenge',
            sector: 'Muhima',
            cell: 'Rugenge',
            coordinates: { lat: -1.9520, lng: 30.0620 }
        },
        images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788999000',
        status: PropertyStatus.Available,
        description: '5-story commercial building in prime CBD location. Multiple tenants, stable income.',
        features: ['5 Floors', 'Elevator', 'Parking', 'Multiple Tenants', 'Generator', 'Title Deed'],
        size: '1200 sqm',
        createdAt: '2026-01-06T08:00:00Z',
        views: 312
    },

    // LAND - FOR SALE
    {
        id: 'prop-017',
        title: 'Prime Plot in Kinyinya',
        category: PropertyCategory.Land,
        transactionType: TransactionType.ForSale,
        price: 35000000,
        location: {
            district: 'Gasabo',
            sector: 'Kinyinya',
            cell: 'Kajevuba',
            coordinates: { lat: -1.9180, lng: 30.1380 }
        },
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788222333',
        status: PropertyStatus.Available,
        description: 'Flat plot ready for construction. All utilities available. Clear title deed.',
        features: ['Flat Terrain', 'Utilities Available', 'Clear Title', 'Residential Zone'],
        size: '600 sqm',
        createdAt: '2026-01-10T13:30:00Z',
        views: 223
    },
    {
        id: 'prop-018',
        title: 'Agricultural Land in Musanze',
        category: PropertyCategory.Land,
        transactionType: TransactionType.ForSale,
        price: 15000000,
        location: {
            district: 'Musanze',
            sector: 'Busogo',
            cell: 'Busogo',
            coordinates: { lat: -1.4833, lng: 29.6333 }
        },
        images: [
            'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788345678',
        status: PropertyStatus.Available,
        commissionerId: 'comm-003',
        description: 'Fertile agricultural land near Volcanoes National Park. Ideal for farming or eco-tourism.',
        features: ['Fertile Soil', 'Water Access', 'Scenic Views', 'Title Deed'],
        size: '2 hectares',
        createdAt: '2026-01-12T10:00:00Z',
        views: 156
    },
    {
        id: 'prop-019',
        title: 'Commercial Plot in Kimironko',
        category: PropertyCategory.Land,
        transactionType: TransactionType.ForSale,
        price: 55000000,
        location: {
            district: 'Gasabo',
            sector: 'Kimironko',
            cell: 'Nyagatovu',
            coordinates: { lat: -1.9560, lng: 30.1270 }
        },
        images: [
            'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788444555',
        status: PropertyStatus.Available,
        description: 'Strategic commercial plot on main road. High visibility and accessibility.',
        features: ['Main Road', 'Commercial Zone', 'High Traffic', 'Utilities Ready'],
        size: '800 sqm',
        createdAt: '2026-01-09T14:20:00Z',
        views: 198
    },
    {
        id: 'prop-020',
        title: 'Residential Plot in Niboye',
        category: PropertyCategory.Land,
        transactionType: TransactionType.ForSale,
        price: 28000000,
        location: {
            district: 'Kicukiro',
            sector: 'Niboye',
            cell: 'Karama',
            coordinates: { lat: -1.9850, lng: 30.1200 }
        },
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788890123',
        status: PropertyStatus.Available,
        commissionerId: 'comm-008',
        description: 'Quiet residential plot in established neighborhood. Perfect for family home.',
        features: ['Quiet Area', 'Established Neighborhood', 'Utilities Available', 'Title Deed'],
        size: '500 sqm',
        createdAt: '2026-01-11T11:00:00Z',
        views: 167
    },

    // Additional properties to reach 50+
    {
        id: 'prop-021',
        title: 'Duplex Apartment in Kacyiru',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 380000,
        location: {
            district: 'Gasabo',
            sector: 'Kacyiru',
            cell: 'Kibaza',
            coordinates: { lat: -1.9460, lng: 30.0960 }
        },
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788123456',
        status: PropertyStatus.Available,
        commissionerId: 'comm-001',
        description: 'Spacious duplex with modern finishes. Two-level living with private entrance.',
        features: ['3 Bedrooms', '2.5 Bathrooms', 'Two Levels', 'Balcony', 'Parking'],
        size: '180 sqm',
        createdAt: '2026-01-16T12:00:00Z',
        views: 142
    },
    {
        id: 'prop-022',
        title: 'Serviced Apartment in Remera',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 420000,
        location: {
            district: 'Gasabo',
            sector: 'Remera',
            cell: 'Rukiri I',
            coordinates: { lat: -1.9560, lng: 30.0960 }
        },
        images: [
            'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788666777',
        status: PropertyStatus.Available,
        description: 'Fully serviced apartment with housekeeping and laundry services included.',
        features: ['2 Bedrooms', '2 Bathrooms', 'Housekeeping', 'Laundry', 'WiFi', 'DSTV'],
        size: '120 sqm',
        createdAt: '2026-01-17T09:30:00Z',
        views: 128
    },
    {
        id: 'prop-023',
        title: 'Garden Apartment in Gikondo',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 150000,
        location: {
            district: 'Kicukiro',
            sector: 'Gikondo',
            cell: 'Nyenyeri',
            coordinates: { lat: -1.9840, lng: 30.0680 }
        },
        images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788888999',
        status: PropertyStatus.Rented,
        description: 'Ground floor apartment with private garden access. Pet-friendly.',
        features: ['2 Bedrooms', '1 Bathroom', 'Garden Access', 'Pet Friendly'],
        size: '85 sqm',
        createdAt: '2026-01-05T10:00:00Z',
        views: 201
    },
    {
        id: 'prop-024',
        title: 'Executive Suite in Kinyinya',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForLetting,
        price: 550000,
        location: {
            district: 'Gasabo',
            sector: 'Kinyinya',
            cell: 'Nyagahinga',
            coordinates: { lat: -1.9190, lng: 30.1360 }
        },
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
        ],
        uploadedBy: UploadedBy.Agent,
        contactPhone: '+250788789012',
        status: PropertyStatus.Available,
        commissionerId: 'comm-007',
        description: 'Luxury executive suite in gated community. Premium amenities and 24/7 concierge.',
        features: ['3 Bedrooms', '3 Bathrooms', 'Gym Access', 'Pool', 'Concierge', 'Security'],
        size: '220 sqm',
        createdAt: '2026-01-13T08:00:00Z',
        views: 176
    },
    {
        id: 'prop-025',
        title: 'Townhouse in Kanombe',
        category: PropertyCategory.Residential,
        transactionType: TransactionType.ForSale,
        price: 65000000,
        location: {
            district: 'Kicukiro',
            sector: 'Kanombe',
            cell: 'Kabuga',
            coordinates: { lat: -1.9680, lng: 30.1180 }
        },
        images: [
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
        ],
        uploadedBy: UploadedBy.Owner,
        contactPhone: '+250788123321',
        status: PropertyStatus.Available,
        description: 'Modern townhouse in secure estate. Perfect for growing families.',
        features: ['3 Bedrooms', '2 Bathrooms', 'Small Garden', 'Parking', 'Estate Security'],
        size: '190 sqm',
        createdAt: '2026-01-14T11:30:00Z',
        views: 187
    }
];

// Helper functions for filtering
export const getUniqueDistricts = (): string[] => {
    return Array.from(new Set(rwandaLocations.map(loc => loc.district)));
};

export const getSectorsByDistrict = (district: string): string[] => {
    const location = rwandaLocations.find(loc => loc.district === district);
    return location ? location.sectors.map(s => s.name) : [];
};

export const getCellsBySector = (district: string, sector: string): string[] => {
    const location = rwandaLocations.find(loc => loc.district === district);
    if (!location) return [];
    const sectorData = location.sectors.find(s => s.name === sector);
    return sectorData ? sectorData.cells : [];
};

export const filterProperties = (
    properties: Property[],
    filters: PropertyFilters
): Property[] => {
    const norm = (v: any) => String(v ?? '').trim().toLowerCase();
    return properties.filter(property => {
        // Category filter
        if (filters.category && norm(property.category) !== norm(filters.category)) {
            return false;
        }

        // Transaction type filter
        if (filters.transactionType && property.transactionType !== filters.transactionType) {
            return false;
        }

        // Price range filter
        if (filters.minPrice !== undefined && property.price < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice !== undefined && property.price > filters.maxPrice) {
            return false;
        }

        // Location filters
        if (filters.district && property.location.district !== filters.district) {
            return false;
        }
        if (filters.sector && property.location.sector !== filters.sector) {
            return false;
        }
        if (filters.cell && property.location.cell !== filters.cell) {
            return false;
        }

        // Status filter
        if (filters.status && property.status !== filters.status) {
            return false;
        }

        // Search query filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesTitle = property.title.toLowerCase().includes(query);
            const matchesDescription = property.description.toLowerCase().includes(query);
            const matchesLocation =
                property.location.district.toLowerCase().includes(query) ||
                property.location.sector.toLowerCase().includes(query) ||
                property.location.cell.toLowerCase().includes(query);

            if (!matchesTitle && !matchesDescription && !matchesLocation) {
                return false;
            }
        }

        return true;
    });
};

export const filterCommissioners = (
    commissioners: Commissioner[],
    filters: CommissionerFilters
): Commissioner[] => {
    return commissioners.filter(commissioner => {
        // District filter
        if (filters.districts && filters.districts.length > 0) {
            const hasMatchingDistrict = filters.districts.some((district: string) =>
                commissioner.operatingLocations.districts.includes(district)
            );
            if (!hasMatchingDistrict) {
                return false;
            }
        }

        // Budget filter
        if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
            const minBudget = filters.minBudget ?? 0;
            const maxBudget = filters.maxBudget ?? Infinity;

            // Commissioner's range should overlap with user's budget
            const hasOverlap =
                commissioner.priceRange.min <= maxBudget &&
                commissioner.priceRange.max >= minBudget;

            if (!hasOverlap) {
                return false;
            }
        }

        // Verified filter
        if (filters.verifiedOnly && !commissioner.verified) {
            return false;
        }

        // Specialization filter
        if (filters.specialization && commissioner.specialization) {
            if (!commissioner.specialization.includes(filters.specialization)) {
                return false;
            }
        }

        // Search query filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesName = commissioner.name.toLowerCase().includes(query);
            const matchesBio = commissioner.bio?.toLowerCase().includes(query) || false;
            const matchesLocation =
                commissioner.operatingLocations.districts.some(d => d.toLowerCase().includes(query)) ||
                commissioner.operatingLocations.sectors.some(s => s.toLowerCase().includes(query));

            if (!matchesName && !matchesBio && !matchesLocation) {
                return false;
            }
        }

        return true;
    });
};
