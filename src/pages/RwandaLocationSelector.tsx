import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/api/apiClient';
import { MapPin, RotateCcw, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

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

    // Fetch provinces on mount
    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchProvinces = async () => {
        setLoading((prev) => ({ ...prev, provinces: true }));
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
            setLoading((prev) => ({ ...prev, provinces: false }));
        }
    };

    const fetchDistricts = async (province: string) => {
        setLoading((prev) => ({ ...prev, districts: true }));
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
            setLoading((prev) => ({ ...prev, districts: false }));
        }
    };

    const fetchSectors = async (district: string) => {
        setLoading((prev) => ({ ...prev, sectors: true }));
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
            setLoading((prev) => ({ ...prev, sectors: false }));
        }
    };

    const fetchCells = async (sector: string) => {
        setLoading((prev) => ({ ...prev, cells: true }));
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
            setLoading((prev) => ({ ...prev, cells: false }));
        }
    };

    const fetchVillages = async (cell: string) => {
        setLoading((prev) => ({ ...prev, villages: true }));
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
            setLoading((prev) => ({ ...prev, villages: false }));
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

    const getSelectedLocationParts = () => {
        const parts = [];
        if (selectedProvince) parts.push({ label: 'Province', val: selectedProvince });
        if (selectedDistrict) parts.push({ label: 'District', val: selectedDistrict });
        if (selectedSector) parts.push({ label: 'Sector', val: selectedSector });
        if (selectedCell) parts.push({ label: 'Cell', val: selectedCell });
        if (selectedVillage) parts.push({ label: 'Village', val: selectedVillage });
        return parts;
    };

    const locationParts = getSelectedLocationParts();
    const isAnyLoading = Object.values(loading).some(Boolean);

    return (
        <div className="min-h-screen bg-[#F5F5F5] dark:bg-gray-950 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#E5E5E5] dark:border-gray-800 shadow-sm p-6 sm:p-10">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-[#E5252A] mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            Administrative Hierarchy
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#151515] dark:text-white tracking-tight">
                            Rwanda Location Selector
                        </h1>
                        <p className="mt-2 text-sm text-[#666666] dark:text-gray-400">
                            Drill down from Province through District, Sector, Cell, and Village
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-[#E5252A] text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Selected Path Breadcrumbs */}
                    {locationParts.length > 0 && (
                        <div className="mb-8 p-4 bg-[#F5F5F5] dark:bg-gray-800/40 border border-[#E5E5E5] dark:border-gray-800 rounded-xl">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#666666] dark:text-gray-400 mb-2">
                                Current Selection Path
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                {locationParts.map((part, idx) => (
                                    <React.Fragment key={part.label}>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-gray-900 border border-[#E5E5E5] dark:border-gray-700 text-xs font-semibold text-[#151515] dark:text-white shadow-2xs">
                                            <span className="text-[10px] uppercase font-bold text-[#E5252A]">{part.label}:</span>
                                            {part.val}
                                        </span>
                                        {idx < locationParts.length - 1 && (
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Province */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-gray-200 mb-2">
                                Province {loading.provinces && <Loader2 className="inline w-3 h-3 animate-spin text-[#E5252A] ml-1" />}
                            </label>
                            <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                disabled={loading.provinces}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:opacity-50 transition-all cursor-pointer"
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
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-gray-200 mb-2">
                                District {loading.districts && <Loader2 className="inline w-3 h-3 animate-spin text-[#E5252A] ml-1" />}
                            </label>
                            <select
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={!selectedProvince || loading.districts}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:opacity-50 transition-all cursor-pointer"
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
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-gray-200 mb-2">
                                Sector {loading.sectors && <Loader2 className="inline w-3 h-3 animate-spin text-[#E5252A] ml-1" />}
                            </label>
                            <select
                                value={selectedSector}
                                onChange={handleSectorChange}
                                disabled={!selectedDistrict || loading.sectors}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:opacity-50 transition-all cursor-pointer"
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
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-gray-200 mb-2">
                                Cell {loading.cells && <Loader2 className="inline w-3 h-3 animate-spin text-[#E5252A] ml-1" />}
                            </label>
                            <select
                                value={selectedCell}
                                onChange={handleCellChange}
                                disabled={!selectedSector || loading.cells}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:opacity-50 transition-all cursor-pointer"
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
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-gray-200 mb-2">
                                Village {loading.villages && <Loader2 className="inline w-3 h-3 animate-spin text-[#E5252A] ml-1" />}
                            </label>
                            <select
                                value={selectedVillage}
                                onChange={handleVillageChange}
                                disabled={!selectedCell || loading.villages}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-[#F5F5F5] dark:bg-gray-800 text-[#151515] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A] disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:opacity-50 transition-all cursor-pointer"
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
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E5E5E5] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-[#F5F5F5] dark:hover:bg-gray-700 font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset Selection
                        </button>
                        <button
                            type="button"
                            disabled={!selectedVillage}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#E5252A] hover:bg-[#c91d22] text-white disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirm Location
                        </button>
                    </div>

                    {/* Location Summary */}
                    {selectedVillage && (
                        <div className="mt-8 p-6 bg-[#F5F5F5] dark:bg-gray-800/40 rounded-2xl border border-[#E5E5E5] dark:border-gray-800">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#151515] dark:text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#E5252A]" />
                                Complete Location Details
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-[#E5E5E5] dark:border-gray-800">
                                    <span className="block text-[10px] font-bold uppercase text-[#666666] dark:text-gray-400">Province</span>
                                    <span className="font-semibold text-[#151515] dark:text-white truncate block">{selectedProvince}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-[#E5E5E5] dark:border-gray-800">
                                    <span className="block text-[10px] font-bold uppercase text-[#666666] dark:text-gray-400">District</span>
                                    <span className="font-semibold text-[#151515] dark:text-white truncate block">{selectedDistrict}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-[#E5E5E5] dark:border-gray-800">
                                    <span className="block text-[10px] font-bold uppercase text-[#666666] dark:text-gray-400">Sector</span>
                                    <span className="font-semibold text-[#151515] dark:text-white truncate block">{selectedSector}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-[#E5E5E5] dark:border-gray-800">
                                    <span className="block text-[10px] font-bold uppercase text-[#666666] dark:text-gray-400">Cell</span>
                                    <span className="font-semibold text-[#151515] dark:text-white truncate block">{selectedCell}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-[#E5E5E5] dark:border-gray-800">
                                    <span className="block text-[10px] font-bold uppercase text-[#666666] dark:text-gray-400">Village</span>
                                    <span className="font-semibold text-[#151515] dark:text-white truncate block">{selectedVillage}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Overall Loading Spinner */}
                {isAnyLoading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#666666] dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin text-[#E5252A]" />
                        <span>Updating locations...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RwandaLocationSelector;
