import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cachedFetch } from "../utils/cachedFetch";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Address = {
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
  email: string;
  contact?: string;
  service_id?: string | null;
  service_title?: string;
  profile_image?: string;
  location?: { lat: number; lng: number };
  address?: Address;
  whatsapp_number?: string;
  roles?: string[];
};

const allowedRoles = ["customer", "seller", "service_provider"];

export default function ProfilePage() {
  // State management
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
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [addressFields, setAddressFields] = useState<Address>({
    district: "",
    sector: "",
    cell: "",
    village: "",
    known_place: ""
  });

  const { darkMode } = useDarkMode();
  const { updateToken } = useAuth();

  // Dark mode classes
  const bgColor = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const secondaryTextColor = darkMode ? "text-gray-300" : "text-gray-600";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBg = darkMode ? "bg-gray-700 text-white" : "bg-white";

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

        // Parse address if it's a string
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
          district: data.address?.district || "",
          sector: data.address?.sector || "",
          cell: data.address?.cell || "",
          village: data.address?.village || "",
          known_place: data.address?.known_place || ""
        });

        // If user is a service provider, fetch services
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

  // Fetch services
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const data = await cachedFetch<{ services: Service[] }>(`${API_BASE}/api/services`);
      setServices(data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      alert("Error loading services");
    } finally {
      setLoadingServices(false);
    }
  };

  // Handle service selection
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

      const updatedProfile = await res.json();
      const selectedService = services.find(s => s.id === serviceId);

      // Show success message with details (console.log removed because reload clears it)
      alert(
        `✅ Service Updated!\n\n` +
        `Old Service: ${profile.service_title || 'None'}\n` +
        `New Service: ${selectedService?.title}\n\n` +
        `The page will reload. After reload, go to Dashboard to see the new service features!`
      );

      // Reload the page to fetch fresh data
      window.location.reload();
    } catch (error) {
      console.error('❌ Service update failed:', error);
      alert(`Failed to update service: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsUpdatingService(false);
    }
  };

  // Handle image preview
  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  // Check if user can edit
  const canEdit = () => profile?.roles?.some(role => allowedRoles.includes(role));

  // Handlers
  const handleImageUpload = async () => {
    if (!selectedImage || !canEdit()) {
      alert(!canEdit()
        ? "You don't have permission to upload images"
        : "No image selected");
      return;
    }

    setIsUploadingImage(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profileImage", selectedImage);

      const res = await fetch(`${API_BASE}/api/profile/save-profile-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setProfile(prev => prev ? { ...prev, profile_image: data.imageUrl } : prev);
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

    if (profile?.address) {
      setAddressFields({
        district: profile.address.district || "",
        sector: profile.address.sector || "",
        cell: profile.address.cell || "",
        village: profile.address.village || "",
        known_place: profile.address.known_place || ""
      });
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

  const handleUpdateRole = async (role: string, action: "add" | "remove") => {
    if (!role || !canEdit()) return;

    setIsUpdatingRole(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/profile/roles`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, action }),
      });

      if (!res.ok) throw new Error("Failed to update roles");
      const data = await res.json();

      if (data.token) {
        updateToken(data.token);
      }

      alert(data.message || "Role updated");
      window.location.reload();

    } catch {
      alert("Error updating roles");
    } finally {
      setIsUpdatingRole(false);
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
    } catch (error) {
      alert(`Failed to get location: ${error instanceof Error ? error.message : ""}`);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Render helpers
  const renderEditField = (field: string, label: string, type = "text") => (
    <div className="flex items-center gap-2 mt-1">
      <input
        type={type}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        placeholder={label}
        className={`border ${borderColor} rounded px-2 py-1 w-full ${inputBg}`}
      />
      <button
        onClick={() => handleSave(field)}
        disabled={isSavingProfile}
        className="bg-hafi-green text-white px-3 py-1 rounded text-sm"
      >
        {isSavingProfile ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : (
          'Save'
        )}
      </button>
      <button
        onClick={handleCancel}
        disabled={isSavingProfile}
        className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} px-3 py-1 rounded text-sm`}
      >
        Cancel
      </button>
    </div>
  );

  const renderField = (field: string, label: string, value = "", type = "text") => (
    <div className={`flex justify-between items-center border-b ${borderColor} pb-3`}>
      <div>
        <p className={`text-sm ${secondaryTextColor}`}>{label}</p>
        {editField === field ? (
          renderEditField(field, label, type)
        ) : (
          <p className={`font-medium ${textColor}`}>{value || "-"}</p>
        )}
      </div>
      {editField !== field && field !== "email" && (
        <button
          onClick={() => handleEdit(field, value)}
          className="text-hafi-teal hover:text-hafi-green"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      )}
    </div>
  );

  const renderAddressFields = () => {
    const displayAddress = editAddressMode ? addressFields : (profile?.address || addressFields);

    if (editAddressMode) {
      return (
        <div className="space-y-4">
          {Object.entries(addressFields).map(([field, value]) => (
            <div key={field}>
              <label className={`text-sm ${secondaryTextColor} capitalize`}>
                {field.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  setAddressFields(prev => ({
                    ...prev,
                    [field]: e.target.value
                  }))
                }
                className={`border ${borderColor} rounded px-2 py-1 w-full mt-1 ${inputBg}`}
                placeholder={`Enter ${field.replace('_', ' ')}`}
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSave("address")}
              disabled={isSavingProfile}
              className="bg-hafi-green text-white px-3 py-1 rounded text-sm"
            >
              {isSavingProfile ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Address'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSavingProfile}
              className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} px-3 py-1 rounded text-sm`}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className={`border-b ${borderColor} pb-3`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${secondaryTextColor}`}>District</p>
              <p className={`font-medium ${textColor}`}>
                {displayAddress.district || "Not specified"}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextColor}`}>Sector</p>
              <p className={`font-medium ${textColor}`}>
                {displayAddress.sector || "Not specified"}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextColor}`}>Cell</p>
              <p className={`font-medium ${textColor}`}>
                {displayAddress.cell || "Not specified"}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextColor}`}>Village</p>
              <p className={`font-medium ${textColor}`}>
                {displayAddress.village || "Not specified"}
              </p>
            </div>
            <div>
              <p className={`text-sm ${secondaryTextColor}`}>Known Place</p>
              <p className={`font-medium ${textColor}`}>
                {displayAddress.known_place || "Not specified"}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => setEditAddressMode(true)}
              className="text-hafi-teal hover:text-hafi-green flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Address
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderServiceField = () => {
    if (!profile?.roles?.includes('service_provider')) return null;

    if (showServiceField) {
      return (
        <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
          <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Your Service</h2>
          {loadingServices ? (
            <div className={textColor}>Loading services...</div>
          ) : (
            <div>
              <select
                className={`border ${borderColor} rounded px-3 py-2 w-full mb-3 ${inputBg}`}
                onChange={e => handleServiceSelect(String(e.target.value))}
                disabled={isUpdatingService}
                defaultValue=""
              >
                <option value="" disabled>Select your service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </select>
              {isUpdatingService && (
                <div className={`flex items-center gap-2 text-sm ${secondaryTextColor} mb-3`}>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating service...
                </div>
              )}
              <button
                onClick={() => setShowServiceField(false)}
                disabled={isUpdatingService}
                className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} px-4 py-2 rounded`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Your Service</h2>
        <div className="flex justify-between items-center">
          <p className={`font-medium ${textColor}`}>
            {profile?.service_title || "No service selected"}
          </p>
          <button
            onClick={() => setShowServiceField(true)}
            className="text-hafi-teal hover:text-hafi-green"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Loading states
  if (loading) return <div className={`flex justify-center items-center h-[60vh] ${bgColor} ${textColor}`}>Loading...</div>;
  if (!profile) return <div className={`text-center text-red-500 ${bgColor} p-4`}>Failed to load profile.</div>;

  // Derived values
  const imagePath = previewUrl ||
    (profile.profile_image
      ? (profile.profile_image.startsWith('http://') || profile.profile_image.startsWith('https://')
        ? profile.profile_image
        : `http://localhost:5000${profile.profile_image}`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=240`);

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 min-h-screen ${bgColor}`}>
      {/* Profile Header */}
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={imagePath}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-full border-4 border-hafi-teal"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=240`;
              }}
            />
            {canEdit() && (
              <label className="absolute bottom-0 right-0 bg-hafi-green text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
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
          <div className="text-center md:text-left">
            <h1 className={`text-3xl font-bold text-hafi-teal ${textColor}`}>{profile.name}</h1>
            <p className={`${secondaryTextColor} mb-4`}>
              {profile.service_title ? `${profile.service_title} at HafiConnect` : "Service Provider at HafiConnect"}
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className={`${darkMode ? 'bg-hafi-green/20' : 'bg-hafi-green/10'} px-4 py-2 rounded-lg`}>
                <p className={`text-sm ${secondaryTextColor}`}>Opportunities applied</p>
                <p className="font-bold text-hafi-green">32</p>
              </div>
              <div className={`${darkMode ? 'bg-hafi-teal/20' : 'bg-hafi-teal/10'} px-4 py-2 rounded-lg`}>
                <p className={`text-sm ${secondaryTextColor}`}>Opportunities won</p>
                <p className="font-bold text-hafi-teal">26</p>
              </div>
              <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-100'} px-4 py-2 rounded-lg`}>
                <p className={`text-sm ${secondaryTextColor}`}>Current opportunities</p>
                <p className="font-bold text-blue-600">6</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Field */}
      {renderServiceField()}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Settings */}
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Account Settings</h2>
            <div className="space-y-4">
              {renderField("name", "Full Name", profile.name)}
              {renderField("contact", "Phone Number", profile.contact)}
            </div>
          </div>

          {/* Contact Information */}
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Contact Information</h2>
            <div className="space-y-4">
              {renderField("email", "Email Address", profile.email, "email")}
              {renderField("whatsapp_number", "WhatsApp", profile.whatsapp_number)}
            </div>
          </div>

          {/* Address Details */}
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Address Details</h2>
            {renderAddressFields()}
          </div>

          {/* Location */}
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Location</h2>
            <div className={`flex justify-between items-center border-b ${borderColor} pb-3`}>
              <div>
                <p className={`text-sm ${secondaryTextColor}`}>Coordinates</p>
                <p className={`font-medium ${textColor}`}>
                  {profile.location?.lat && profile.location?.lng
                    ? `${profile.location.lat.toFixed(6)}, ${profile.location.lng.toFixed(6)}`
                    : "Not set"}
                </p>
              </div>
              {canEdit() && (
                <button
                  onClick={captureCurrentLocation}
                  disabled={isGettingLocation}
                  className={`flex items-center gap-1 ${isGettingLocation ? 'text-gray-400' : 'text-hafi-teal hover:text-hafi-green'}`}
                >
                  {isGettingLocation ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Update Location
                    </>
                  )}
                </button>
              )}
            </div>
            {profile.location?.lat && profile.location?.lng && (
              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps?q=${profile.location.lat},${profile.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hafi-teal hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Password Update */}
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-bold text-hafi-teal mb-4 ${textColor}`}>Update Password</h2>
            {showPasswordForm ? (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className={`border ${borderColor} rounded px-3 py-2 w-full ${inputBg}`}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={`border ${borderColor} rounded px-3 py-2 w-full ${inputBg}`}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className={`border ${borderColor} rounded px-3 py-2 w-full ${inputBg}`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword}
                    className="bg-hafi-green text-white px-4 py-2 rounded flex-1 hover:bg-green-600"
                  >
                    {isUpdatingPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      'Update'
                    )}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    disabled={isUpdatingPassword}
                    className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} px-4 py-2 rounded flex-1 hover:bg-gray-300`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full bg-hafi-teal text-white py-2 rounded hover:bg-teal-600 transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

          {/* Roles Display */}
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold text-hafi-teal ${textColor}`}>My Roles</h2>
              <Link to="/account-dashboard" className="text-sm text-hafi-teal hover:underline flex items-center">
                Manage Roles <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {(profile.roles || []).map(role => (
                <div key={role} className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm font-medium capitalize flex items-center`}>
                  {role === 'seller' && (
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  {role === 'service_provider' && (
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  )}
                  {role.replace('_', ' ')}
                </div>
              ))}
            </div>

            <p className={`text-xs mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Go to the <Link to="/account-dashboard" className="text-hafi-teal hover:underline">Account Dashboard</Link> to add or remove roles, which may include additional verification or data cleanup steps.
            </p>
          </div>

        </div>
      </div>

      {/* Image Upload Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-lg p-6 max-w-md w-full`}>
            <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Confirm Profile Image</h3>
            <img
              src={previewUrl || ""}
              alt="Preview"
              className="w-full h-64 object-contain mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isUploadingImage}
                className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} px-4 py-2 rounded`}
              >
                Cancel
              </button>
              <button
                onClick={handleImageUpload}
                disabled={isUploadingImage}
                className="bg-hafi-green text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {isUploadingImage ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Save Image'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}