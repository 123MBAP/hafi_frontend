import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RwandaLocationSelector from "@/components/RwandaLocationSelector";
import { cachedFetch } from "../utils/cachedFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { uploadFileToR2 } from '../services/r2UploadService';
import { 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Shield, 
  Lock, 
  Briefcase, 
  Upload, 
  Compass, 
  X, 
  Check, 
  Edit2, 
  ChevronRight, 
  Store,
  FileText,
  Building2
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { API_BASE } from '../api/apiClient';


type Address = {
  province?: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  known_place: string;
};

type Service = {
  id: string;
  title: string;
};

type Profile = {
  id?: number;
  name: string;
  business_name?: string | null;
  email: string;
  contact?: string;
  service_id?: string | null;
  service_title?: string;
  profile_image?: string;
  location?: { lat: number; lng: number };
  address?: Address;
  whatsapp_number?: string;
  roles?: string[];
  bio?: string | null;
  operating_areas?: string[];
  specializations?: string[];
};

const allowedRoles = ["customer", "seller", "service_provider"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editAddressMode, setEditAddressMode] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showServiceField, setShowServiceField] = useState(false);
  const [isUpdatingService, setIsUpdatingService] = useState(false);

  const [showAddAreaInput, setShowAddAreaInput] = useState(false);
  const [newAreaProvince, setNewAreaProvince] = useState("");
  const [newAreaDistrict, setNewAreaDistrict] = useState("");
  const [newAreaSector, setNewAreaSector] = useState("");
  const [isSavingArea, setIsSavingArea] = useState(false);

  // Load dynamic property categories from real estate service schema
  const [propertyCategories, setPropertyCategories] = useState<string[]>(['Land', 'Residential', 'Commercial']);
  const [isSavingSpecialization, setIsSavingSpecialization] = useState(false);
  const [editSpecializationMode, setEditSpecializationMode] = useState(false);
  const [tempSpecializations, setTempSpecializations] = useState<string[]>([]);

  const [addressFields, setAddressFields] = useState<Address>({
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    known_place: ""
  });

  const { darkMode } = useDarkMode();
  const { updateToken } = useAuth();

  // Unified theme tokens
  const bgColor = darkMode ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-[#151515]";
  const cardBg = darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200";
  const borderColor = darkMode ? "border-zinc-800" : "border-gray-200";
  const inputBg = darkMode ? "bg-zinc-800/50 border-zinc-700 text-white focus:border-brand-red rounded-lg" : "bg-white border-gray-200 text-[#151515] focus:border-brand-red rounded-lg";
  const labelColor = darkMode ? "text-gray-400" : "text-gray-600";
  const containerClass = `max-w-6xl mx-auto px-4 py-8 min-h-screen ${bgColor}`;
  const isRealEstate = profile?.service_title?.toLowerCase().trim() === 'real estate';

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Profile fetch failed");

        const data = await res.json();

        // Parse address if string
        if (data.address && typeof data.address === 'string') {
          try {
            data.address = JSON.parse(data.address);
          } catch (error) {
            console.error("Error parsing address:", error);
            data.address = null;
          }
        }

        setProfile(data);

        // Initialize address fields
        setAddressFields({
          province: data.address?.province || "",
          district: data.address?.district || "",
          sector: data.address?.sector || "",
          cell: data.address?.cell || "",
          village: data.address?.village || "",
          known_place: data.address?.known_place || ""
        });

        if (data.roles?.includes("service_provider")) {
          fetchServices();
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        alert("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const data = await cachedFetch<{ services: Service[] }>(`${API_BASE}/api/services`);
      setServices(data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceSelect = async (serviceId: string) => {
    if (!profile?.roles?.includes('service_provider')) {
      alert('Only service providers can set their service');
      return;
    }
    setIsUpdatingService(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service_id: serviceId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update service");
      }

      const selectedService = services.find(s => s.id === serviceId);
      alert(
        `✅ Service Updated!\n\n` +
        `Old Service: ${profile.service_title || 'None'}\n` +
        `New Service: ${selectedService?.title || 'None'}\n\n` +
        `The page will reload to configure your dashboard.`
      );
      window.location.reload();
    } catch (error) {
      alert(`Failed to update service: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsUpdatingService(false);
    }
  };

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const canEdit = () => profile?.roles?.some(role => allowedRoles.includes(role));

  const handleImageUpload = async () => {
    if (!selectedImage || !canEdit()) {
      alert(!canEdit() ? "You don't have permission to upload images" : "No image selected");
      return;
    }
    setIsUploadingImage(true);
    try {
      const token = localStorage.getItem("token");
      let uploadedUrl: string | null = null;

      // Try Direct Cloudflare R2 Upload First
      try {
        const r2File = await uploadFileToR2(selectedImage, {
          category: 'profile',
          token,
        });

        const res = await fetch(`${API_BASE}/api/profile/save-profile-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            r2Image: {
              url: r2File.url,
              objectKey: r2File.objectKey,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save profile image reference");
        uploadedUrl = data.imageUrl || r2File.url;
      } catch (r2Err: any) {
        console.warn('Direct R2 profile upload failed or not configured, using fallback:', r2Err.message);
      }

      // Fallback: Legacy multipart upload
      if (!uploadedUrl) {
        const formData = new FormData();
        formData.append("profileImage", selectedImage);

        const res = await fetch(`${API_BASE}/api/profile/save-profile-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploadedUrl = data.imageUrl;
      }

      setProfile(prev => prev ? { ...prev, profile_image: uploadedUrl! } : prev);
      setSelectedImage(null);
    } catch {
      alert("Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEdit = (field: string, value = "") => {
    setEditField(field);
    setEditValue(value);
  };

  const handleCancel = () => {
    setEditField(null);
    setSelectedImage(null);
    setEditAddressMode(false);
    setShowServiceField(false);
    setEditSpecializationMode(false);
    if (profile?.address) {
      setAddressFields({
        province: profile.address.province || "",
        district: profile.address.district || "",
        sector: profile.address.sector || "",
        cell: profile.address.cell || "",
        village: profile.address.village || "",
        known_place: profile.address.known_place || ""
      });
    }
  };

  // Load dynamic property categories from real estate service schema
  useEffect(() => {
    const fetchPropertyCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/real-estate/service`);
        if (res.ok) {
          const data = await res.json();
          const features = data?.service?.features;
          if (Array.isArray(features)) {
            for (const feature of features) {
              if (feature && feature.type === 'object' && feature.schema && typeof feature.schema === 'object') {
                const field = feature.schema.property_category;
                const options = field?.options;
                if (Array.isArray(options)) {
                  setPropertyCategories(options.map((o) => String(o).trim()).filter(Boolean));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load property categories:", error);
      }
    };

    if (profile?.roles?.includes('service_provider') && profile.service_title?.toLowerCase().trim() === 'real estate') {
      fetchPropertyCategories();
    }
  }, [profile]);

  const startEditSpecialization = () => {
    setTempSpecializations(profile?.specializations || []);
    setEditSpecializationMode(true);
  };

  const cancelEditSpecialization = () => {
    setEditSpecializationMode(false);
    setTempSpecializations([]);
  };

  const handleToggleTempSpecialization = (category: string) => {
    setTempSpecializations(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSaveSpecializations = async () => {
    if (!profile) return;
    setIsSavingSpecialization(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ specializations: tempSpecializations }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      setProfile(prev => prev ? { ...prev, specializations: tempSpecializations } : prev);
      setEditSpecializationMode(false);
    } catch (error) {
      alert(`Failed to update specializations: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsSavingSpecialization(false);
    }
  };

  const handleSave = async (field: string) => {
    if (!canEdit()) {
      alert("You don't have permission to edit");
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const payload = field === "address"
        ? { address: addressFields }
        : { [field]: editValue };

      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      setProfile(prev => prev ? { ...prev, ...payload } : prev);
      setEditField(null);
      setEditAddressMode(false);
    } catch (error) {
      alert(`Failed to update profile: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddOperatingArea = async () => {
    if (!profile || !newAreaProvince || !newAreaDistrict || !newAreaSector) return;
    const area = `${newAreaSector}, ${newAreaDistrict}, ${newAreaProvince}`;
    const currentAreas = profile.operating_areas || [];
    if (currentAreas.includes(area)) {
      alert("Area is already added");
      return;
    }
    const updatedAreas = [...currentAreas, area];
    setIsSavingArea(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operating_areas: updatedAreas }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      setProfile(prev => prev ? { ...prev, operating_areas: updatedAreas } : prev);
      setShowAddAreaInput(false);
      setNewAreaProvince("");
      setNewAreaDistrict("");
      setNewAreaSector("");
    } catch (error) {
      alert(`Failed to add operating area: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsSavingArea(false);
    }
  };

  const handleRemoveOperatingArea = async (areaToRemove: string) => {
    if (!profile) return;
    const currentAreas = profile.operating_areas || [];
    const updatedAreas = currentAreas.filter(a => a !== areaToRemove);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operating_areas: updatedAreas }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      setProfile(prev => prev ? { ...prev, operating_areas: updatedAreas } : prev);
    } catch (error) {
      alert(`Failed to remove operating area: ${error instanceof Error ? error.message : ""}`);
    }
  };

  const handlePasswordUpdate = async () => {
    setIsUpdatingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      alert("Password updated successfully");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      alert(`Failed to update password: ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const captureCurrentLocation = async () => {
    if (!canEdit()) {
      alert("You don't have permission to edit location");
      return;
    }
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: newLocation }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Location save failed");
      }

      setProfile(prev => prev ? { ...prev, location: newLocation } : prev);
      alert("📍 Location coordinates saved successfully!");
    } catch (error) {
      alert(`Failed to get location: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsGettingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-[70vh] ${bgColor}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest font-semibold text-red-600">Loading Profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`flex justify-center items-center min-h-[70vh] ${bgColor}`}>
        <div className="text-center p-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40 max-w-sm">
          <p className="text-brand-red font-semibold uppercase tracking-wider text-sm mb-2">Error Loading Profile</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Please make sure you are logged in and try again.</p>
        </div>
      </div>
    );
  }

  const absoluteImageUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE}/${path.replace(/^\/+/, '')}`;
  };

  const imagePath = previewUrl ||
    (profile.profile_image
      ? absoluteImageUrl(profile.profile_image)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=240&background=dc2626&color=fff`);

  return (
    <div className={containerClass}>
      {/* Page Header */}
      <PageHeader
        badge="My Account"
        title="Profile & Preferences"
        subtitle="Manage your personal details, business storefront, location, credentials, and account security."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' }
        ]}
      />

      {/* Profile Header Banner */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mb-6">
        <div className="h-28 bg-gradient-to-r from-neutral-900 via-zinc-900 to-red-950/80 w-full relative"></div>
        <div className="p-6 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
          {/* Avatar container */}
          <div className="relative group shrink-0">
            <img
              src={imagePath}
              alt="Profile"
              className="w-28 h-28 object-cover rounded-full bg-white dark:bg-zinc-900 border-4 border-white dark:border-zinc-900 shadow-md"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=240&background=dc2626&color=fff`;
              }}
            />
            {canEdit() && (
              <label className="absolute bottom-0 right-0 bg-brand-red hover:bg-red-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-all hover:scale-105 border-2 border-white dark:border-zinc-900">
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={e => setSelectedImage(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="text-center md:text-left flex-1 pb-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center md:justify-start gap-2 text-gray-900 dark:text-white">
                  {profile.name}
                </h1>
                <p className="text-xs uppercase tracking-wider font-semibold text-brand-red mt-1">
                  {profile.service_title ? `${profile.service_title} Provider` : "Uploader Account"}
                </p>
              </div>

              {/* Stat badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                <div className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Service Category</div>
                  <div className="text-xs font-semibold text-brand-red">{profile.service_title || 'None'}</div>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800/60">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Active Roles</div>
                  <div className="text-xs font-semibold text-brand-red">{profile.roles?.length || 0} assigned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* About Me / Bio Card */}
          <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-red" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                  About Me / Bio
                </h2>
              </div>
              {editField !== "bio" && (
                <button
                  onClick={() => handleEdit("bio", profile.bio || "")}
                  className="text-brand-red hover:text-red-700 p-1 rounded-md"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {editField === "bio" ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Add your bio to help viewers understand what you do."
                  className={`px-3 py-2 text-sm border focus:outline-none w-full h-32 resize-none rounded-lg ${inputBg}`}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className={`${
                    (editValue || "").trim().split(/\s+/).filter(Boolean).length > 100 
                      ? 'text-brand-red font-bold' 
                      : 'text-gray-500'
                  }`}>
                    {(editValue || "").trim().split(/\s+/).filter(Boolean).length} / 100 words
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("bio")}
                      disabled={isSavingProfile || (editValue || "").trim().split(/\s+/).filter(Boolean).length > 100}
                      className="bg-brand-red hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {(editValue || "").trim().split(/\s+/).filter(Boolean).length > 100 && (
                  <p className="text-[10px] text-brand-red font-semibold mt-1">Bio cannot exceed 100 words.</p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                {profile.bio || "Add your bio to help viewers understand what you do."}
              </p>
            )}
          </div>

          {/* Operating Areas Card */}
          {profile.roles?.includes('service_provider') && isRealEstate && (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-brand-red" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                    Operating Areas
                  </h2>
                </div>
              </div>

              {/* List of areas */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(profile.operating_areas || []).map((area, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-zinc-700 bg-[#F5F5F5] dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
                  >
                    {area}
                    {canEdit() && (
                      <button
                        onClick={() => handleRemoveOperatingArea(area)}
                        className="hover:text-brand-red transition-colors p-0.5"
                        title="Remove area"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {(profile.operating_areas || []).length === 0 && (
                  <p className="text-xs italic text-gray-500">
                    No custom operating areas added. (Default: {profile.address?.district || 'None'})
                  </p>
                )}
              </div>

              {/* Add Area Section */}
              {canEdit() && (
                <div className="space-y-4">
                  {showAddAreaInput ? (
                    <div className="space-y-3 max-w-md">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Province Select */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-black/60 mb-1">Province</label>
                          <RwandaLocationSelector
                            level="province"
                            value={newAreaProvince}
                            onChange={(val) => {
                              setNewAreaProvince(val);
                              setNewAreaDistrict("");
                              setNewAreaSector("");
                            }}
                            darkMode={darkMode}
                          />
                        </div>

                        {/* District Select */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-black/60 mb-1">District</label>
                          <RwandaLocationSelector
                            level="district"
                            value={newAreaDistrict}
                            parentValues={{ province: newAreaProvince }}
                            onChange={(val) => {
                              setNewAreaDistrict(val);
                              setNewAreaSector("");
                            }}
                            darkMode={darkMode}
                          />
                        </div>

                        {/* Sector Select */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-black/60 mb-1">Sector</label>
                          <RwandaLocationSelector
                            level="sector"
                            value={newAreaSector}
                            parentValues={{ district: newAreaDistrict }}
                            onChange={(val) => {
                              setNewAreaSector(val);
                            }}
                            darkMode={darkMode}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddOperatingArea}
                          disabled={isSavingArea || !newAreaProvince || !newAreaDistrict || !newAreaSector}
                          className="bg-brand-red hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg disabled:opacity-50"
                        >
                          Add Area
                        </button>
                        <button
                          onClick={() => {
                            setShowAddAreaInput(false);
                            setNewAreaProvince("");
                            setNewAreaDistrict("");
                            setNewAreaSector("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddAreaInput(true)}
                      className="text-xs font-semibold text-brand-red hover:text-red-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      + Add Operating Area
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Real Estate Property Specialization */}
          {profile.roles?.includes('service_provider') && isRealEstate && (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100 dark:border-zinc-800">
                <Building2 className="w-5 h-5 text-brand-red" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                  Property Specializations
                </h2>
              </div>

              {editSpecializationMode ? (
                <div className="space-y-4">
                  <p className="text-[11px] text-gray-500 mb-2 uppercase tracking-wider font-semibold">
                    Select the types of properties you handle:
                  </p>

                  <div className="space-y-2.5">
                    {propertyCategories.map((category) => {
                      const isChecked = tempSpecializations.includes(category);
                      return (
                        <label key={category} className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSavingSpecialization}
                            onChange={() => handleToggleTempSpecialization(category)}
                            className="w-4 h-4 text-brand-red bg-white border-gray-300 rounded focus:ring-brand-red cursor-pointer"
                          />
                          <span className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {category}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={handleSaveSpecializations}
                      disabled={isSavingSpecialization}
                      className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg"
                    >
                      Save Specializations
                    </button>
                    <button
                      onClick={cancelEditSpecialization}
                      className="px-4 py-2 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    {propertyCategories.map((category) => {
                      const isChecked = (profile.specializations || []).includes(category);
                      return (
                        <label key={category} className="flex items-center gap-3 cursor-not-allowed select-none opacity-80">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={true}
                            className="w-4 h-4 text-brand-red bg-white border-gray-300 rounded cursor-not-allowed"
                          />
                          <span className={`text-sm font-semibold uppercase tracking-wider ${isChecked ? (darkMode ? 'text-gray-200' : 'text-gray-800') : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                            {category}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={startEditSpecialization}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border border-red-200 dark:border-red-900/40 text-brand-red px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Specializations
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Service Provider Select Block */}
          {profile.roles?.includes('service_provider') && (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100 dark:border-zinc-800">
                <Briefcase className="w-5 h-5 text-brand-red" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                  Service Configuration
                </h2>
              </div>
              
              {showServiceField ? (
                <div className="space-y-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Select your Service Offering</label>
                  {loadingServices ? (
                    <div className="text-xs text-gray-500">Loading service list...</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        className={`px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-brand-red rounded-lg ${inputBg}`}
                        onChange={e => handleServiceSelect(String(e.target.value))}
                        disabled={isUpdatingService}
                        defaultValue=""
                      >
                        <option value="" disabled>Choose service...</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleCancel}
                        disabled={isUpdatingService}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center bg-[#F5F5F5] dark:bg-zinc-800/40 p-4 rounded-lg border border-gray-200/70 dark:border-zinc-800">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Assigned Service</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.service_title || "No service selected"}</div>
                  </div>
                  <button
                    onClick={() => { setShowServiceField(true); fetchServices(); }}
                    className="text-xs font-semibold uppercase tracking-wider rounded-lg border border-red-200 dark:border-red-900/40 text-brand-red px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Change Service
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Account Profile Fields */}
          <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-6 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <User className="w-5 h-5 text-brand-red" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                Account Information
              </h2>
            </div>
            
            <div className="space-y-5">
              {/* Full Name */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                  {editField === "name" ? (
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                      />
                      <button
                        onClick={() => handleSave("name")}
                        disabled={isSavingProfile}
                        className="bg-brand-red hover:bg-red-700 text-white px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-2 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.name}</div>
                  )}
                </div>
                {editField !== "name" && (
                  <button
                    onClick={() => handleEdit("name", profile.name)}
                    className="text-brand-red hover:text-red-700 p-1 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Business Name */}
              {(profile.roles?.includes('seller') || profile.roles?.includes('service_provider')) && (
                <div className="flex justify-between items-start gap-4 border-t pt-4 border-gray-100 dark:border-zinc-800">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Business Name</label>
                    {editField === "business_name" ? (
                      <div className="flex gap-2 max-w-md">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                        />
                        <button
                          onClick={() => handleSave("business_name")}
                          disabled={isSavingProfile}
                          className="bg-brand-red hover:bg-red-700 text-white px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-2 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.business_name || "None"}</div>
                    )}
                  </div>
                  {editField !== "business_name" && (
                    <button
                      onClick={() => handleEdit("business_name", profile.business_name || "")}
                      className="text-brand-red hover:text-red-700 p-1 rounded-md"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Phone Number */}
              <div className="flex justify-between items-start gap-4 border-t pt-4 border-gray-100 dark:border-zinc-800">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
                  {editField === "contact" ? (
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                      />
                      <button
                        onClick={() => handleSave("contact")}
                        disabled={isSavingProfile}
                        className="bg-brand-red hover:bg-red-700 text-white px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-2 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.contact || "None"}</div>
                  )}
                </div>
                {editField !== "contact" && (
                  <button
                    onClick={() => handleEdit("contact", profile.contact || "")}
                    className="text-brand-red hover:text-red-700 p-1 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* WhatsApp Number */}
              <div className="flex justify-between items-start gap-4 border-t pt-4 border-gray-100 dark:border-zinc-800">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">WhatsApp Number</label>
                  {editField === "whatsapp_number" ? (
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                      />
                      <button
                        onClick={() => handleSave("whatsapp_number")}
                        disabled={isSavingProfile}
                        className="bg-brand-red hover:bg-red-700 text-white px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-2 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.whatsapp_number || "None"}</div>
                  )}
                </div>
                {editField !== "whatsapp_number" && (
                  <button
                    onClick={() => handleEdit("whatsapp_number", profile.whatsapp_number || "")}
                    className="text-brand-red hover:text-red-700 p-1 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Email Address */}
              <div className="flex justify-between items-start gap-4 border-t pt-4 border-gray-100 dark:border-zinc-800">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 select-all">{profile.email}</div>
                </div>
                <div className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Locked</div>
              </div>

            </div>
          </div>

          {/* Address Details */}
          {!isRealEstate && (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-6 border-b pb-3 border-gray-100 dark:border-zinc-800">
                <MapPin className="w-5 h-5 text-brand-red" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                  Address Details
                </h2>
              </div>
            
              {editAddressMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Province */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Province
                    </label>
                    <RwandaLocationSelector
                      level="province"
                      value={addressFields.province}
                      onChange={(val) => {
                        setAddressFields(prev => ({
                          ...prev,
                          province: val,
                          district: "",
                          sector: "",
                          cell: "",
                          village: ""
                        }));
                      }}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      District
                    </label>
                    <RwandaLocationSelector
                      level="district"
                      value={addressFields.district}
                      parentValues={{ province: addressFields.province }}
                      onChange={(val) => {
                        setAddressFields(prev => ({
                          ...prev,
                          district: val,
                          sector: "",
                          cell: "",
                          village: ""
                        }));
                      }}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Sector
                    </label>
                    <RwandaLocationSelector
                      level="sector"
                      value={addressFields.sector}
                      parentValues={{ district: addressFields.district }}
                      onChange={(val) => {
                        setAddressFields(prev => ({
                          ...prev,
                          sector: val,
                          cell: "",
                          village: ""
                        }));
                      }}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Cell */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Cell
                    </label>
                    <RwandaLocationSelector
                      level="cell"
                      value={addressFields.cell}
                      parentValues={{ sector: addressFields.sector }}
                      onChange={(val) => {
                        setAddressFields(prev => ({
                          ...prev,
                          cell: val,
                          village: ""
                        }));
                      }}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Village */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Village
                    </label>
                    <RwandaLocationSelector
                      level="village"
                      value={addressFields.village}
                      parentValues={{ cell: addressFields.cell }}
                      onChange={(val) => {
                        setAddressFields(prev => ({
                          ...prev,
                          village: val
                        }));
                      }}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Known Place */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Known Place
                    </label>
                    <input
                      type="text"
                      value={addressFields.known_place}
                      onChange={(e) =>
                        setAddressFields(prev => ({
                          ...prev,
                          known_place: e.target.value
                        }))
                      }
                      className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                      placeholder="Enter known place (e.g. Near Market)"
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleSave("address")}
                      disabled={isSavingProfile}
                      className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-xs font-semibold uppercase rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Province</label>
                      <div className="font-semibold text-gray-900 dark:text-white">{profile.address?.province || "Not set"}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">District</label>
                      <div className="font-semibold text-gray-900 dark:text-white">{profile.address?.district || "Not set"}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Sector</label>
                      <div className="font-semibold text-gray-900 dark:text-white">{profile.address?.sector || "Not set"}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Cell</label>
                      <div className="font-semibold text-gray-900 dark:text-white">{profile.address?.cell || "Not set"}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Village</label>
                      <div className="font-semibold text-gray-900 dark:text-white">{profile.address?.village || "Not set"}</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Known Place</label>
                      <div className="font-semibold text-gray-900 dark:text-white">{profile.address?.known_place || "Not set"}</div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={() => setEditAddressMode(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border border-red-200 dark:border-red-900/40 text-brand-red px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Address
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location & GPS */}
          <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-6 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <Compass className="w-5 h-5 text-brand-red" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                Geolocation Settings
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F5F5F5] dark:bg-zinc-800/40 border border-gray-200/70 dark:border-zinc-800 p-4 rounded-lg">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">GPS Coordinates</label>
                <div className="text-sm font-semibold select-all font-mono text-gray-900 dark:text-white">
                  {profile.location?.lat && profile.location?.lng
                    ? `${profile.location.lat.toFixed(6)}, ${profile.location.lng.toFixed(6)}`
                    : "Coordinates not calibrated"}
                </div>
              </div>
              
              {canEdit() && (
                <button
                  onClick={captureCurrentLocation}
                  disabled={isGettingLocation}
                  className="bg-brand-red hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isGettingLocation ? (
                    <div className="w-3.5 h-3.5 border border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <Compass className="w-3.5 h-3.5" />
                  )}
                  {isGettingLocation ? "Syncing GPS..." : "Record Location"}
                </button>
              )}
            </div>

            {profile.location?.lat && profile.location?.lng && (
              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps?q=${profile.location.lat},${profile.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-wider font-semibold text-brand-red hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Sidebar (Roles, Password) */}
        <div className="space-y-6">
          
          {/* User Roles Card */}
          <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-red" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                  My Roles
                </h2>
              </div>
              <Link to="/account-dashboard" className="text-xs font-semibold uppercase text-brand-red hover:underline">
                Manage
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(profile.roles || []).map(role => (
                <div
                  key={role}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-700 bg-[#F5F5F5] dark:bg-zinc-800 text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200"
                >
                  {role === 'seller' && <Store className="w-3.5 h-3.5 text-brand-red" />}
                  {role === 'service_provider' && <Briefcase className="w-3.5 h-3.5 text-brand-red" />}
                  {role === 'customer' && <User className="w-3.5 h-3.5 text-brand-red" />}
                  <span>{role.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            <p className="text-xs leading-relaxed text-gray-500">
              To swap or enable seller/service features, manage subscriptions, or expand capabilities, click Manage to visit the <Link to="/account-dashboard" className="text-brand-red hover:underline font-semibold">Account Dashboard</Link>.
            </p>
          </div>

          {/* Update Password Card */}
          <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100 dark:border-zinc-800">
              <Lock className="w-5 h-5 text-brand-red" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">
                Security Setting
              </h2>
            </div>

            {showPasswordForm ? (
              <div className="space-y-3">
                <div>
                  <input
                    type="password"
                    placeholder="CURRENT PASSWORD"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="NEW PASSWORD"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="CONFIRM NEW PASSWORD"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className={`px-3 py-2 text-sm border focus:outline-none w-full rounded-lg ${inputBg}`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword}
                    className="bg-brand-red hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 px-3 flex-1 flex items-center justify-center rounded-lg"
                  >
                    {isUpdatingPassword ? (
                      <div className="w-3.5 h-3.5 border border-white border-t-transparent animate-spin rounded-full"></div>
                    ) : (
                      "Save Password"
                    )}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="text-xs font-semibold uppercase tracking-wider py-2.5 px-3 flex-1 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full bg-brand-red hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Image Upload Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl w-full max-w-md bg-white dark:bg-zinc-900">
            <div className="flex justify-between items-center border-b pb-3 mb-4 border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">Preview Profile Image</h3>
              <button onClick={handleCancel} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <img
              src={previewUrl || ""}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isUploadingImage}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUpload}
                disabled={isUploadingImage}
                className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg flex items-center gap-1.5"
              >
                {isUploadingImage ? (
                  <div className="w-3.5 h-3.5 border border-white border-t-transparent animate-spin rounded-full"></div>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Image
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}