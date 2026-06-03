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
    <div className="p-4 rounded-xl shadow-md bg-white">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {hasPassword ? "Change Payment Password" : "Create Payment Password"}
        </button>
      ) : (
        <div className="space-y-4">
          {hasPassword && (
            <div>
              <label className="block text-sm font-medium">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full p-2 border rounded-lg"
            />
          </div>

          {/* Password strength meter */}
          {password && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 h-2 rounded-lg overflow-hidden">
                <div className={`h-2 ${strengthColor}`} style={{ width: `${(strengthScore / 5) * 100}%` }}></div>
              </div>
              <p className="text-sm font-medium">Strength: {strength}</p>
            </div>
          )}

          {/* Validation feedback */}
          <div className="text-sm space-y-1">
            <p className={rules.length ? "text-green-600" : "text-red-600"}>• At least 8 characters</p>
            <p className={rules.uppercase ? "text-green-600" : "text-red-600"}>• At least 1 uppercase letter</p>
            <p className={rules.lowercase ? "text-green-600" : "text-red-600"}>• At least 1 lowercase letter</p>
            <p className={rules.number ? "text-green-600" : "text-red-600"}>• At least 1 number</p>
            <p className={rules.symbol ? "text-green-600" : "text-red-600"}>• At least 1 special symbol</p>
          </div>

          {/* Confirm password feedback */}
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-600 text-sm">Passwords do not match</p>
          )}

          <button
            disabled={!isValid || (hasPassword && !currentPassword)}
            onClick={handleSubmit}
            className={`w-full py-2 rounded-lg text-white ${
              isValid && (!hasPassword || currentPassword)
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400"
            }`}
          >
            {hasPassword ? "Update Password" : "Save Password"}
          </button>
        </div>
      )}
    </div>
  );
}
