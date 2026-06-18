import { useState } from "react";

export default function PaymentPasswordManager({ hasPassword, onSave }: { hasPassword: boolean; onSave: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Password rules
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(rules).every(Boolean) && password === confirmPassword;

  // Password strength calculation
  const strengthScore = Object.values(rules).filter(Boolean).length;
  const strengthLevels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-600"];
  const strength = password ? strengthLevels[strengthScore - 1] || "Very Weak" : "";
  const strengthColor = password ? strengthColors[strengthScore - 1] || "bg-red-500" : "bg-gray-300";

  const handleSubmit = () => {
    if (isValid) {
      onSave(password);
      setPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setShowForm(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 bg-white shadow-sm" style={{ borderRadius: '2px' }}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 font-bold uppercase text-xs tracking-wider transition-colors duration-200"
          style={{ borderRadius: '2px' }}
        >
          {hasPassword ? "Change Payment Password" : "Create Payment Password"}
        </button>
      ) : (
        <div className="space-y-4">
          {hasPassword && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-650">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 border border-gray-250 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                style={{ borderRadius: '2px' }}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-650">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-gray-250 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none transition-all"
              style={{ borderRadius: '2px' }}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-650">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 border border-gray-250 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none transition-all"
              style={{ borderRadius: '2px' }}
            />
          </div>

          {/* Password strength meter */}
          {password && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 h-1.5 overflow-hidden" style={{ borderRadius: '2px' }}>
                <div className={`h-1.5 ${strengthColor}`} style={{ width: `${(strengthScore / 5) * 100}%`, borderRadius: '2px' }}></div>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Strength: {strength}</p>
            </div>
          )}

          {/* Validation feedback */}
          <div className="text-xs space-y-1 font-medium">
            <p className={rules.length ? "text-emerald-600" : "text-red-600"}>• At least 8 characters</p>
            <p className={rules.uppercase ? "text-emerald-600" : "text-red-600"}>• At least 1 uppercase letter</p>
            <p className={rules.lowercase ? "text-emerald-600" : "text-red-600"}>• At least 1 lowercase letter</p>
            <p className={rules.number ? "text-emerald-600" : "text-red-600"}>• At least 1 number</p>
            <p className={rules.symbol ? "text-emerald-600" : "text-red-600"}>• At least 1 special symbol</p>
          </div>

          {/* Confirm password feedback */}
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-600 text-xs font-semibold">Passwords do not match</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              disabled={!isValid || (hasPassword && !currentPassword)}
              onClick={handleSubmit}
              className={`flex-1 py-2 font-bold uppercase text-xs tracking-wider text-white transition-colors duration-200 ${
                isValid && (!hasPassword || currentPassword)
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              style={{ borderRadius: '2px' }}
            >
              {hasPassword ? "Update Password" : "Save Password"}
            </button>
            <button
              onClick={() => {
                setPassword("");
                setConfirmPassword("");
                setCurrentPassword("");
                setShowForm(false);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-750 font-bold uppercase text-xs tracking-wider hover:bg-gray-50 transition-colors"
              style={{ borderRadius: '2px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
