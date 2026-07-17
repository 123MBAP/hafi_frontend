import React, { useState } from "react";
import { useDarkMode } from "@/context/DarkMode";

export default function Contact() {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const containerBg = darkMode ? "bg-gray-950 text-gray-400" : "bg-gray-50 text-gray-600";
  const borderCol = darkMode ? "border-gray-800" : "border-gray-200";
  const cardBg = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const textTitle = darkMode ? "text-white" : "text-gray-900";
  const labelColor = darkMode ? "text-emerald-400" : "text-emerald-600";
  const inputBase = darkMode
    ? "bg-gray-950 border-gray-800 text-white focus:border-emerald-500"
    : "bg-white border-gray-300 text-gray-900 focus:border-emerald-600";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className={`py-12 ${containerBg} transition-colors duration-300 min-h-screen`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Section */}
        <div className={`pb-8 border-b ${borderCol}`}>
          <p className={`text-xs uppercase tracking-[0.28em] ${labelColor}`}>
            Get In Touch
          </p>
          <h1 className={`mt-2 text-3xl sm:text-4xl font-bold tracking-tight ${textTitle}`}>
            Contact HafiConnect Support
          </h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-6">
            Have any questions or facing an inconvenience? Reach out to our dedicated support team. We are here to ensure your experience on HafiConnect is seamless and secure.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email Card */}
          <div
            className={`p-6 border shadow-sm ${cardBg}`}
            style={{ borderRadius: "2px" }}
          >
            <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-2 ${labelColor}`}>
              Email Support
            </div>
            <h4 className={`text-base font-semibold mb-2 ${textTitle}`}>
              Send us an Email
            </h4>
            <p className="text-xs sm:text-sm leading-6 mb-4">
              Write to us for business inquiries, general help, or support tickets.
            </p>
            <a
              href="mailto:info@haficonnect.com"
              className={`text-sm font-bold transition-colors ${darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"}`}
            >
              info@haficonnect.com
            </a>
          </div>

          {/* Phone Card */}
          <div
            className={`p-6 border shadow-sm ${cardBg}`}
            style={{ borderRadius: "2px" }}
          >
            <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-2 ${labelColor}`}>
              Phone Support
            </div>
            <h4 className={`text-base font-semibold mb-2 ${textTitle}`}>
              Call Our Team
            </h4>
            <p className="text-xs sm:text-sm leading-6 mb-4">
              Call us directly for immediate assistance or urgent support issues.
            </p>
            <a
              href="tel:+250791689396"
              className={`text-sm font-bold transition-colors ${darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"}`}
            >
              +250 791 689 396
            </a>
          </div>

          {/* WhatsApp Card */}
          <div
            className={`p-6 border shadow-sm ${cardBg}`}
            style={{ borderRadius: "2px" }}
          >
            <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-2 ${labelColor}`}>
              WhatsApp Chat
            </div>
            <h4 className={`text-base font-semibold mb-2 ${textTitle}`}>
              Chat Instantly
            </h4>
            <p className="text-xs sm:text-sm leading-6 mb-4">
              Connect with a support representative on WhatsApp for fast text support.
            </p>
            <a
              href="https://wa.me/250791689396?text=Hi%20HafiConnect%20Support%2C%20I%20need%20assistance..."
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-bold transition-colors ${darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"}`}
            >
              WhatsApp : +250 791 689 396 &rarr;
            </a>
          </div>
        </div>

        {/* Message Form */}
        <div className={`p-8 border shadow-sm ${cardBg}`} style={{ borderRadius: "2px" }}>
          <h3 className={`text-xl font-bold tracking-tight mb-2 ${textTitle}`}>Send a Message</h3>
          <p className="text-xs sm:text-sm leading-6 mb-6">
            Fill out the form below, and we will get back to you within 24 hours.
          </p>

          {submitted && (
            <div
              className={`p-4 border mb-6 text-sm font-semibold uppercase tracking-wider ${
                darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
              style={{ borderRadius: "2px" }}
            >
              Message submitted successfully. Our support team will contact you shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border outline-none text-sm ${inputBase}`}
                  style={{ borderRadius: "2px" }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border outline-none text-sm ${inputBase}`}
                  style={{ borderRadius: "2px" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border outline-none text-sm ${inputBase}`}
                style={{ borderRadius: "2px" }}
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              style={{ borderRadius: "2px" }}
            >
              Submit Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
