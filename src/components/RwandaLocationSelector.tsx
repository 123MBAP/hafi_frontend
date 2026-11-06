import axios from 'axios';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { API_BASE_URL } from '@/api/apiClient';
import rwandaLocationsData from '@/data/rwandaLocations.json';

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

    // Sync parent values to populate dependent dropdowns in controlled mode.
    // Each level is rendered as a separate selector, so parent changes must
    // trigger a new request even when the child already has a previous parent.
    useEffect(() => {
        if (!level) {
            return;
        }

        if (level === 'district') {
            const province = parentValues?.province || '';
            if (selectedProvince !== province) {
                setSelectedProvince(province);
                setDistricts([]);
                if (province) {
                    fetchDistricts(province);
                }
            }
        } else if (level === 'sector') {
            const district = parentValues?.district || '';
            if (selectedDistrict !== district) {
                setSelectedDistrict(district);
                setSectors([]);
                if (district) {
                    fetchSectors(district);
                }
            }
        } else if (level === 'cell') {
            const sector = parentValues?.sector || '';
            if (selectedSector !== sector) {
                setSelectedSector(sector);
                setCells([]);
                if (sector) {
                    fetchCells(sector);
                }
            }
        } else if (level === 'village') {
            const cell = parentValues?.cell || '';
            if (selectedCell !== cell) {
                setSelectedCell(cell);
                setVillages([]);
                if (cell) {
                    fetchVillages(cell);
                }
            }
        }
    }, [level, parentValues?.province, parentValues?.district, parentValues?.sector, parentValues?.cell]);

    const fetchProvinces = async () => {
        setLoading(prev => ({ ...prev, provinces: true }));
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/provinces`);
            if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setProvinces(response.data.data);
                return;
            }
        } catch (err) {
            console.error('Error fetching provinces from API, falling back to local data:', err);
        } finally {
            setLoading(prev => ({ ...prev, provinces: false }));
        }

        if (rwandaLocationsData?.provinces) {
            setProvinces(rwandaLocationsData.provinces.map((name: string) => ({ name })));
        }
    };

    const fetchDistricts = async (province: string) => {
        if (!province) {
            setDistricts([]);
            return;
        }
        setLoading(prev => ({ ...prev, districts: true }));
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/districts`, {
                params: { province }
            });
            if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setDistricts(response.data.data);
                return;
            }
        } catch (err) {
            console.error('Error fetching districts from API, falling back to local data:', err);
        } finally {
            setLoading(prev => ({ ...prev, districts: false }));
        }

        const localDists = (rwandaLocationsData.districtsByProvince as Record<string, string[]>)?.[province] || [];
        setDistricts(localDists.map((name: string) => ({ name, province })));
    };

    const fetchSectors = async (district: string) => {
        if (!district) {
            setSectors([]);
            return;
        }
        setLoading(prev => ({ ...prev, sectors: true }));
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/sectors`, {
                params: { district }
            });
            if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setSectors(response.data.data);
                return;
            }
        } catch (err) {
            console.error('Error fetching sectors from API, falling back to local data:', err);
        } finally {
            setLoading(prev => ({ ...prev, sectors: false }));
        }

        const localSectors = (rwandaLocationsData.sectorsByDistrict as Record<string, string[]>)?.[district] || [];
        setSectors(localSectors.map((name: string) => ({ name, district })));
    };

    const fetchCells = async (sector: string) => {
        if (!sector) {
            setCells([]);
            return;
        }
        setLoading(prev => ({ ...prev, cells: true }));
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/cells`, {
                params: { sector }
            });
            if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setCells(response.data.data);
                return;
            }
        } catch (err) {
            console.error('Error fetching cells from API, falling back to local data:', err);
        } finally {
            setLoading(prev => ({ ...prev, cells: false }));
        }

        const localCells = (rwandaLocationsData.cellsBySector as Record<string, string[]>)?.[sector] || [];
        setCells(localCells.map((name: string) => ({ name, sector })));
    };

    const fetchVillages = async (cell: string) => {
        if (!cell) {
            setVillages([]);
            return;
        }
        setLoading(prev => ({ ...prev, villages: true }));
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/locations/villages`, {
                params: { cell }
            });
            if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setVillages(response.data.data);
                return;
            }
        } catch (err) {
            console.error('Error fetching villages from API, falling back to local data:', err);
        } finally {
            setLoading(prev => ({ ...prev, villages: false }));
        }

        const localVillages = (rwandaLocationsData.villagesByCell as Record<string, string[]>)?.[cell] || [];
        setVillages(localVillages.map((name: string) => ({ name, cell })));
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
        const baseSelectClass = `w-full px-3 py-2 border rounded-lg text-sm ${darkMode
            ? 'bg-gray-900 border-gray-700 focus:border-[#E5252A] text-white disabled:bg-gray-800 disabled:text-gray-500'
            : 'bg-white border-[#E5E5E5] text-[#151515] focus:border-[#E5252A] disabled:bg-gray-100 disabled:text-gray-400'
            } focus:ring-2 focus:ring-[#E5252A]/20 transition disabled:cursor-not-allowed ${className}`;

        switch (level) {
            case 'province':
                return (
                    <select
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        disabled={loading.provinces}
                        className={baseSelectClass}
                       
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
                <div className={`border p-8 shadow-xl transition-colors duration-250 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-250'}`}>
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
                        <div className={`mb-6 p-4 border text-sm transition-colors ${darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {error}
                        </div>
                    )}

                    {/* Selected Path Display */}
                    {getSelectedLocationPath() && (
                        <div className={`mb-6 p-4 border transition-colors ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-800'}`}>
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
                           
                        >
                            Reset Selection
                        </button>
                        <button
                            disabled={!selectedVillage}
                            className={`px-6 py-3 border font-semibold uppercase tracking-wider transition-colors ${selectedVillage ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-350 dark:bg-gray-700 border-transparent text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                           
                        >
                            Confirm Location
                        </button>
                    </div>

                    {/* Location Summary */}
                    {selectedVillage && (
                        <div className={`mt-8 p-6 border transition-colors ${darkMode ? 'bg-gray-750 border-gray-750' : 'bg-gray-50 border-gray-250'}`}>
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
