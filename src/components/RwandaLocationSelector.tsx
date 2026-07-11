import axios from 'axios';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LocationOption {
    id?: number;
    name: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
}

interface RwandaLocationSelectorProps {
    level?: 'province' | 'district' | 'sector' | 'cell' | 'village';
    value?: string;
    onChange?: (value: string) => void;
    parentValues?: any;
    darkMode?: boolean;
    className?: string;
}

const RwandaLocationSelector: React.FC<RwandaLocationSelectorProps> = ({
    level,
    value,
    onChange,
    parentValues,
    darkMode = false,
    className = "",
}) => {
    const [provinces, setProvinces] = useState<LocationOption[]>([]);
    const [districts, setDistricts] = useState<LocationOption[]>([]);
    const [sectors, setSectors] = useState<LocationOption[]>([]);
    const [cells, setCells] = useState<LocationOption[]>([]);
    const [villages, setVillages] = useState<LocationOption[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedCell, setSelectedCell] = useState<string>('');
    const [selectedVillage, setSelectedVillage] = useState<string>('');

    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string>('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Fetch provinces on mount
    useEffect(() => {
        fetchProvinces();
    }, []);

    // Sync with controlled props when in controlled mode
    useEffect(() => {
        if (level && value !== undefined) {
            // Controlled mode - sync internal state with prop value
            switch (level) {
                case 'province':
                    if (selectedProvince !== value) {
                        setSelectedProvince(value);
                        if (value) fetchDistricts(value);
                    }
                    break;
                case 'district':
                    if (selectedDistrict !== value) {
                        setSelectedDistrict(value);
                        if (value) fetchSectors(value);
                    }
                    break;
                case 'sector':
                    if (selectedSector !== value) {
                        setSelectedSector(value);
                        if (value) fetchCells(value);
                    }
                    break;
                case 'cell':
                    if (selectedCell !== value) {
                        setSelectedCell(value);
                        if (value) fetchVillages(value);
                    }
                    break;
                case 'village':
                    if (selectedVillage !== value) {
                        setSelectedVillage(value);
                    }
                    break;
            }
        }
    }, [level, value]);

    // Sync parent values to populate dependent dropdowns in controlled mode
    useEffect(() => {
        if (level && parentValues) {
            if (parentValues.province && !selectedProvince) {
                setSelectedProvince(parentValues.province);
                fetchDistricts(parentValues.province);
            }
            if (parentValues.district && !selectedDistrict) {
                setSelectedDistrict(parentValues.district);
                fetchSectors(parentValues.district);
            }
            if (parentValues.sector && !selectedSector) {
                setSelectedSector(parentValues.sector);
                fetchCells(parentValues.sector);
            }
            if (parentValues.cell && !selectedCell) {
                setSelectedCell(parentValues.cell);
                fetchVillages(parentValues.cell);
            }
        }
    }, [level, parentValues]);

    const fetchProvinces = async () => {
        setLoading({ ...loading, provinces: true });
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/provinces`);
            if (response.data.success) {
                setProvinces(response.data.data);
            }
        } catch (err) {
            setError('Failed to load provinces');
            console.error('Error fetching provinces:', err);
        } finally {
            setLoading({ ...loading, provinces: false });
        }
    };

    const fetchDistricts = async (province: string) => {
        setLoading({ ...loading, districts: true });
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/districts`, {
                params: { province }
            });
            if (response.data.success) {
                setDistricts(response.data.data);
            }
        } catch (err) {
            setError('Failed to load districts');
            console.error('Error fetching districts:', err);
        } finally {
            setLoading({ ...loading, districts: false });
        }
    };

    const fetchSectors = async (district: string) => {
        setLoading({ ...loading, sectors: true });
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/sectors`, {
                params: { district }
            });
            if (response.data.success) {
                setSectors(response.data.data);
            }
        } catch (err) {
            setError('Failed to load sectors');
            console.error('Error fetching sectors:', err);
        } finally {
            setLoading({ ...loading, sectors: false });
        }
    };

    const fetchCells = async (sector: string) => {
        setLoading({ ...loading, cells: true });
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/cells`, {
                params: { sector }
            });
            if (response.data.success) {
                setCells(response.data.data);
            }
        } catch (err) {
            setError('Failed to load cells');
            console.error('Error fetching cells:', err);
        } finally {
            setLoading({ ...loading, cells: false });
        }
    };

    const fetchVillages = async (cell: string) => {
        setLoading({ ...loading, villages: true });
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/villages`, {
                params: { cell }
            });
            if (response.data.success) {
                setVillages(response.data.data);
            }
        } catch (err) {
            setError('Failed to load villages');
            console.error('Error fetching villages:', err);
        } finally {
            setLoading({ ...loading, villages: false });
        }
    };

    // Handle province selection
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const province = e.target.value;
        setSelectedProvince(province);
        setSelectedDistrict('');
        setSelectedSector('');
        setSelectedCell('');
        setSelectedVillage('');
        setDistricts([]);
        setSectors([]);
        setCells([]);
        setVillages([]);

        if (province) {
            fetchDistricts(province);
        }

        // Notify parent in controlled mode
        if (onChange && level === 'province') {
            onChange(province);
        }
    };

    // Handle district selection
    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const district = e.target.value;
        setSelectedDistrict(district);
        setSelectedSector('');
        setSelectedCell('');
        setSelectedVillage('');
        setSectors([]);
        setCells([]);
        setVillages([]);

        if (district) {
            fetchSectors(district);
        }

        // Notify parent in controlled mode
        if (onChange && level === 'district') {
            onChange(district);
        }
    };

    // Handle sector selection
    const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sector = e.target.value;
        setSelectedSector(sector);
        setSelectedCell('');
        setSelectedVillage('');
        setCells([]);
        setVillages([]);

        if (sector) {
            fetchCells(sector);
        }

        // Notify parent in controlled mode
        if (onChange && level === 'sector') {
            onChange(sector);
        }
    };

    // Handle cell selection
    const handleCellChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cell = e.target.value;
        setSelectedCell(cell);
        setSelectedVillage('');
        setVillages([]);

        if (cell) {
            fetchVillages(cell);
        }

        // Notify parent in controlled mode
        if (onChange && level === 'cell') {
            onChange(cell);
        }
    };

    // Handle village selection
    const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const village = e.target.value;
        setSelectedVillage(village);

        // Notify parent in controlled mode
        if (onChange && level === 'village') {
            onChange(village);
        }
    };

    const handleReset = () => {
        setSelectedProvince('');
        setSelectedDistrict('');
        setSelectedSector('');
        setSelectedCell('');
        setSelectedVillage('');
        setDistricts([]);
        setSectors([]);
        setCells([]);
        setVillages([]);
    };

    const getSelectedLocationPath = () => {
        const parts = [];
        if (selectedProvince) parts.push(selectedProvince);
        if (selectedDistrict) parts.push(selectedDistrict);
        if (selectedSector) parts.push(selectedSector);
        if (selectedCell) parts.push(selectedCell);
        if (selectedVillage) parts.push(selectedVillage);
        return parts.join(' > ');
    };

    // Controlled mode - render single dropdown for specific level
    if (level) {
        const baseSelectClass = `w-full px-3 py-1.5 border text-sm ${darkMode
            ? 'bg-gray-950 border-gray-800 focus:border-emerald-500 text-white disabled:bg-gray-900/50 disabled:text-gray-600'
            : 'bg-gray-100 border-gray-300 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-400'
            } focus:ring-1 focus:ring-emerald-500 transition disabled:cursor-not-allowed ${className}`;

        switch (level) {
            case 'province':
                return (
                    <select
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        disabled={loading.provinces}
                        className={baseSelectClass}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">Select Province</option>
                        {provinces.map((province, index) => (
                            <option key={`province-${index}-${province.name}`} value={province.name}>
                                {province.name}
                            </option>
                        ))}
                    </select>
                );
            case 'district':
                return (
                    <select
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                        disabled={!parentValues?.province || loading.districts}
                        className={baseSelectClass}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">
                            {parentValues?.province ? 'Select District' : 'Select Province First'}
                        </option>
                        {districts.map((district, index) => (
                            <option key={district.id || `district-${index}-${district.name}`} value={district.name}>
                                {district.name}
                            </option>
                        ))}
                    </select>
                );
            case 'sector':
                return (
                    <select
                        value={selectedSector}
                        onChange={handleSectorChange}
                        disabled={!parentValues?.district || loading.sectors}
                        className={baseSelectClass}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">
                            {parentValues?.district ? 'Select Sector' : 'Select District First'}
                        </option>
                        {sectors.map((sector, index) => (
                            <option key={sector.id || `sector-${index}-${sector.name}`} value={sector.name}>
                                {sector.name}
                            </option>
                        ))}
                    </select>
                );
            case 'cell':
                return (
                    <select
                        value={selectedCell}
                        onChange={handleCellChange}
                        disabled={!parentValues?.sector || loading.cells}
                        className={baseSelectClass}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">
                            {parentValues?.sector ? 'Select Cell' : 'Select Sector First'}
                        </option>
                        {cells.map((cell, index) => (
                            <option key={cell.id || `cell-${index}-${cell.name}`} value={cell.name}>
                                {cell.name}
                            </option>
                        ))}
                    </select>
                );
            case 'village':
                return (
                    <select
                        value={selectedVillage}
                        onChange={handleVillageChange}
                        disabled={!parentValues?.cell || loading.villages}
                        className={baseSelectClass}
                        style={{ borderRadius: '2px' }}
                    >
                        <option value="">
                            {parentValues?.cell ? 'Select Village' : 'Select Cell First'}
                        </option>
                        {villages.map((village, index) => (
                            <option key={village.id || `village-${index}-${village.name}`} value={village.name}>
                                {village.name}
                            </option>
                        ))}
                    </select>
                );
        }
    }

    // Standalone mode - render full location selector UI
    return (
        <div className={`min-h-screen py-8 px-4 transition-colors duration-250 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            <div className="max-w-4xl mx-auto">
                <div className={`border p-8 shadow-xl transition-colors duration-250 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'}`} style={{ borderRadius: '2px' }}>
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className={`text-2xl font-bold tracking-tighter uppercase mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            Rwanda Location Selector
                        </h1>
                        <p className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Select your location from Province down to Village
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={`mb-6 p-4 border text-sm transition-colors ${darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`} style={{ borderRadius: '2px' }}>
                            {error}
                        </div>
                    )}

                    {/* Selected Path Display */}
                    {getSelectedLocationPath() && (
                        <div className={`mb-6 p-4 border transition-colors ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-800'}`} style={{ borderRadius: '2px' }}>
                            <p className={`text-xs uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Selected Location:</p>
                            <p className="text-lg font-semibold text-emerald-500">
                                {getSelectedLocationPath()}
                            </p>
                        </div>
                    )}

                    {/* Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Province */}
                        <div className="form-group">
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Province
                            </label>
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                disabled={loading.provinces}
                                className={`w-full px-4 py-3 border focus:ring-2 transition disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-400'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <option value="">Select Province</option>
                                {provinces.map((province, index) => (
                                    <option key={`province-${index}-${province.name}`} value={province.name}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* District */}
                        <div className="form-group">
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                District
                            </label>
                            <select
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={!selectedProvince || loading.districts}
                                className={`w-full px-4 py-3 border focus:ring-2 transition disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-400'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <option value="">
                                    {selectedProvince ? 'Select District' : 'Select Province First'}
                                </option>
                                {districts.map((district, index) => (
                                    <option key={district.id || `district-${index}-${district.name}`} value={district.name}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sector */}
                        <div className="form-group">
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Sector
                            </label>
                            <select
                                value={selectedSector}
                                onChange={handleSectorChange}
                                disabled={!selectedDistrict || loading.sectors}
                                className={`w-full px-4 py-3 border focus:ring-2 transition disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-400'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <option value="">
                                    {selectedDistrict ? 'Select Sector' : 'Select District First'}
                                </option>
                                {sectors.map((sector, index) => (
                                    <option key={sector.id || `sector-${index}-${sector.name}`} value={sector.name}>
                                        {sector.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cell */}
                        <div className="form-group">
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Cell
                            </label>
                            <select
                                value={selectedCell}
                                onChange={handleCellChange}
                                disabled={!selectedSector || loading.cells}
                                className={`w-full px-4 py-3 border focus:ring-2 transition disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-400'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <option value="">
                                    {selectedSector ? 'Select Cell' : 'Select Sector First'}
                                </option>
                                {cells.map((cell, index) => (
                                    <option key={cell.id || `cell-${index}-${cell.name}`} value={cell.name}>
                                        {cell.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Village */}
                        <div className="form-group md:col-span-2">
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Village
                            </label>
                            <select
                                value={selectedVillage}
                                onChange={handleVillageChange}
                                disabled={!selectedCell || loading.villages}
                                className={`w-full px-4 py-3 border focus:ring-2 transition disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:text-gray-400'}`}
                                style={{ borderRadius: '2px' }}
                            >
                                <option value="">
                                    {selectedCell ? 'Select Village' : 'Select Cell First'}
                                </option>
                                {villages.map((village, index) => (
                                    <option key={village.id || `village-${index}-${village.name}`} value={village.name}>
                                        {village.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4 justify-center">
                        <button
                            onClick={handleReset}
                            className={`px-6 py-3 border font-semibold uppercase tracking-wider transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-250' : 'bg-gray-200 border-gray-300 hover:bg-gray-300 text-gray-750'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            Reset Selection
                        </button>
                        <button
                            disabled={!selectedVillage}
                            className={`px-6 py-3 border font-semibold uppercase tracking-wider transition-colors ${selectedVillage ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-350 dark:bg-gray-700 border-transparent text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                            style={{ borderRadius: '2px' }}
                        >
                            Confirm Location
                        </button>
                    </div>

                    {/* Location Summary */}
                    {selectedVillage && (
                        <div className={`mt-8 p-6 border transition-colors ${darkMode ? 'bg-gray-750 border-gray-750' : 'bg-gray-50 border-gray-250'}`} style={{ borderRadius: '2px' }}>
                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                Complete Location Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Province:</span>{' '}
                                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedProvince}</span>
                                </div>
                                <div>
                                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>District:</span>{' '}
                                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedDistrict}</span>
                                </div>
                                <div>
                                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sector:</span>{' '}
                                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedSector}</span>
                                </div>
                                <div>
                                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cell:</span>{' '}
                                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedCell}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Village:</span>{' '}
                                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedVillage}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading Indicator */}
                {Object.values(loading).some(Boolean) && (
                    <div className="mt-6">
                        <LoadingSpinner size="md" message="Loading location data..." variant="dots" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RwandaLocationSelector;
