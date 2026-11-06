import React, { useState } from "react";
import { useDarkMode } from "@/context/DarkMode";
import { Mail, Phone, MessageSquare, CheckCircle } from "lucide-react";

export default function Contact() {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const containerBg = darkMode ? "bg-gray-950 text-gray-400" : "bg-[#F5F5F5] text-gray-600";
  const borderCol = darkMode ? "border-gray-800" : "border-[#E5E5E5]";
  const cardBg = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#E5E5E5]";
  const textTitle = darkMode ? "text-white" : "text-[#151515]";
  const inputBase = darkMode
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]"
    : "bg-[#F5F5F5] border-[#E5E5E5] text-[#151515] placeholder-gray-400 focus:ring-2 focus:ring-[#E5252A]/20 focus:border-[#E5252A]";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Section */}
        <div className={`pb-8 border-b ${borderCol}`}>
          <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#E5252A] text-white rounded-full mb-3 shadow-xs">
            Get In Touch
          </div>
          <h1 className={`text-3xl sm:text-4xl font-extrabold uppercase tracking-tight ${textTitle}`}>
            Contact HafiConnect Support<span className="text-[#E5252A]">.</span>
          </h1>
          <p className="mt-3 max-w-3xl text-xs sm:text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400">
            Have any questions or facing an inconvenience? Reach out to our dedicated support team. We are here to ensure your experience on HafiConnect is seamless and secure.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email Card */}
          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-[#E5252A] mb-4">
                <Mail className="w-5 h-5 text-[#E5252A]" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#E5252A] mb-1">
                Email Support
              </div>
              <h4 className={`text-base font-bold mb-2 ${textTitle}`}>
                Send us an Email
              </h4>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
                Write to us for business inquiries, general help, or support tickets.
              </p>
            </div>
            <a
              href="mailto:info@haficonnect.com"
              className="text-xs font-bold text-[#E5252A] hover:text-[#c91d22] transition-colors"
            >
              info@haficonnect.com &rarr;
            </a>
          </div>

          {/* Phone Card */}
          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-[#E5252A] mb-4">
                <Phone className="w-5 h-5 text-[#E5252A]" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#E5252A] mb-1">
                Phone Support
              </div>
              <h4 className={`text-base font-bold mb-2 ${textTitle}`}>
                Call Our Team
              </h4>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
                Call us directly for immediate assistance or urgent support issues.
              </p>
            </div>
            <a
              href="tel:+250791689396"
              className="text-xs font-bold text-[#E5252A] hover:text-[#c91d22] transition-colors"
            >
              +250 791 689 396 &rarr;
            </a>
          </div>

          {/* WhatsApp Card */}
          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-4">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">
                WhatsApp Chat
              </div>
              <h4 className={`text-base font-bold mb-2 ${textTitle}`}>
                Chat Instantly
              </h4>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
                Connect with a support representative on WhatsApp for fast text support.
              </p>
            </div>
            <a
              href="https://wa.me/250791689396?text=Hi%20HafiConnect%20Support%2C%20I%20need%20assistance..."
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
            >
              WhatsApp : +250 791 689 396 &rarr;
            </a>
          </div>
        </div>

        {/* Message Form */}
        <div className={`p-6 sm:p-8 rounded-2xl border shadow-xs ${cardBg}`}>
          <h3 className={`text-xl font-extrabold uppercase tracking-tight mb-2 ${textTitle}`}>Send a Message</h3>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 mb-6">
            Fill out the form below, and we will get back to you within 24 hours.
          </p>

          {submitted && (
            <div className="p-4 rounded-xl border mb-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Message submitted successfully. Our support team will contact you shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-700 dark:text-gray-300">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm transition-all ${inputBase}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm transition-all ${inputBase}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-700 dark:text-gray-300">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm transition-all resize-none ${inputBase}`}
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5252A] hover:bg-[#c91d22] text-white transition-all shadow-xs active:scale-[0.99]"
            >
              Submit Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
