import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface LocationOption {
    id?: number;
    name: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
}

const RwandaLocationSelector: React.FC = () => {
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
    };

    // Handle village selection
    const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedVillage(e.target.value);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Rwanda Location Selector
                        </h1>
                        <p className="text-gray-600">
                            Select your location from Province down to Village
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Selected Path Display */}
                    {getSelectedLocationPath() && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Selected Location:</p>
                            <p className="text-lg font-semibold text-blue-800">
                                {getSelectedLocationPath()}
                            </p>
                        </div>
                    )}

                    {/* Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Province */}
                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Province
                            </label>
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                disabled={loading.provinces}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                District
                            </label>
                            <select
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={!selectedProvince || loading.districts}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Sector
                            </label>
                            <select
                                value={selectedSector}
                                onChange={handleSectorChange}
                                disabled={!selectedDistrict || loading.sectors}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Cell
                            </label>
                            <select
                                value={selectedCell}
                                onChange={handleCellChange}
                                disabled={!selectedSector || loading.cells}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Village
                            </label>
                            <select
                                value={selectedVillage}
                                onChange={handleVillageChange}
                                disabled={!selectedCell || loading.villages}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            Reset Selection
                        </button>
                        <button
                            disabled={!selectedVillage}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                            Confirm Location
                        </button>
                    </div>

                    {/* Location Summary */}
                    {selectedVillage && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">
                                Complete Location Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-gray-700">Province:</span>{' '}
                                    <span className="text-gray-900">{selectedProvince}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">District:</span>{' '}
                                    <span className="text-gray-900">{selectedDistrict}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Sector:</span>{' '}
                                    <span className="text-gray-900">{selectedSector}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Cell:</span>{' '}
                                    <span className="text-gray-900">{selectedCell}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="font-semibold text-gray-700">Village:</span>{' '}
                                    <span className="text-gray-900">{selectedVillage}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading Indicator */}
                {Object.values(loading).some(Boolean) && (
                    <div className="mt-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RwandaLocationSelector;
