import React from 'react';
import { useDarkMode } from '@/context/DarkMode';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2, Eye, Server, PhoneCall } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { darkMode } = useDarkMode();

  const lastUpdated = "November 11, 2026";

  const sections = [
    {
      id: "introduction",
      title: "1. Overview & Data Controller",
      content: `Voltale Ltd ("HafiConnect", "we", "our", or "us") respects your privacy and is dedicated to protecting personal data collected through our web and mobile applications.

This Privacy Policy explains how we collect, process, store, and safeguard your personal information in compliance with Rwanda Law N° 058/2021 of 13/10/2021 Relating to the Protection of Personal Data and Privacy.`
    },
    {
      id: "information-collected",
      title: "2. Personal Information We Collect",
      content: `We collect information necessary to deliver marketplace, payment, booking, and real estate services:
• Identity & Account Data: Full name, business trade name, email address, phone number (MTN / Airtel), role designation (Customer, Seller, Provider, Commissioner, Agent), and encrypted passwords.
• Location & Geographic Data: Rwanda Province, District, Sector, Cell, Village, and optional GPS coordinates to connect you with nearby services, local products, and property listings.
• Financial & Transaction Data: Mobile money numbers, wallet balances, transaction identifiers, payment status, and order records. We do NOT store full credit/debit card numbers on our servers; card transactions are processed by PCI-DSS certified payment gateways.
• Listings & Media: Product photos, service showcase pictures, real estate walkthrough videos, and written descriptions uploaded by you.
• Technical & Device Data: IP address, browser type, operating system, session tokens, and Cloudflare security analytics.`
    },
    {
      id: "purposes",
      title: "3. How We Use Your Information",
      content: `We process your information under lawful bases for:
• Account Operations: Creating and maintaining your account, role management, and session authentication.
• Order & Booking Fulfillment: Connecting buyers with sellers and service providers, facilitating delivery, and managing customer communications.
• Escrow Protection & Payments: Holding payments securely in escrow and releasing funds upon verified milestone completion or automatic release windows.
• Security & Fraud Prevention: Verifying merchant authenticity, detecting suspicious transactions, preventing unauthorized access, and maintaining system integrity.
• Customer Support: Assisting with dispute resolution, order tracking, and technical inquiries.`
    },
    {
      id: "sharing",
      title: "4. Information Sharing & Third Parties",
      content: `We do not sell, rent, or trade your personal data. We only share information with:
• Counterparties to Transactions: When you make a purchase or service booking, necessary delivery contact details (name, phone number, location) are shared with the fulfilling provider/seller.
• Payment Service Providers: MTN MoMo, Airtel Money, and licensed acquiring banks to execute financial transactions.
• Infrastructure & Security Partners: Cloudflare (content delivery network, edge caching, and R2 media storage) and secure cloud database servers.
• Regulatory & Legal Authorities: Only when required by Rwandan law, court subpoena, or authorized statutory body.`
    },
    {
      id: "retention-security",
      title: "5. Data Security & Retention",
      content: `• Encryption: All data in transit is protected using modern TLS 1.3 encryption. Passwords are cryptographically hashed using salted bcrypt.
• Access Control: Only authorized personnel have restricted, role-based access to customer and transactional records.
• Retention Period: We retain personal information for as long as your account remains active or as required by Rwandan financial, tax, and record-keeping laws.`
    },
    {
      id: "user-rights",
      title: "6. Your Rights Under Rwanda Law N° 058/2021",
      content: `Under Rwandan data protection legislation, you have the right to:
• Right to Access: Request confirmation and copies of personal data we hold about you.
• Right to Rectification: Correct inaccurate or outdated details directly in your Profile or by contacting support.
• Right to Erasure ("Right to be Forgotten"): Request deletion of your personal account, subject to mandatory statutory retention rules.
• Right to Restriction & Objection: Object to or restrict processing of your data for specific auxiliary functions.
• Right to Withdraw Consent: Withdraw consent where processing was based on consent.`
    },
    {
      id: "cookies",
      title: "7. Cookies & Local Storage",
      content: `We utilize local storage and cookies strictly to maintain user sessions, remember theme preferences (dark/light mode), optimize search caching, and monitor platform traffic via Google Analytics. You can configure your browser to reject cookies, though certain interactive features may be impaired.`
    },
    {
      id: "contact",
      title: "8. Data Protection Officer & Inquiries",
      content: `If you have questions, wish to exercise your rights, or have a data privacy concern:
• Data Controller: Voltale Ltd (HafiConnect)
• Data Protection Officer: dpo@haficonnect.voltaleltd.com
• General Support: support@haficonnect.voltaleltd.com
• Address: Kigali, Rwanda`
    }
  ];

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${
      darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Hero header */}
        <div className={`p-8 sm:p-10 rounded-2xl border shadow-sm mb-8 transition-all ${
          darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="p-2.5 rounded-xl bg-red-600/10 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              Data Protection &amp; Privacy
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-3">
            Privacy Policy<span className="text-red-600">.</span>
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed max-w-2xl`}>
            Your privacy and trust are paramount. Learn how HafiConnect collects, handles, and protects your personal information in strict accordance with Rwanda Law N° 058/2021.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-150 dark:border-zinc-800 flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-red-600" />
            <span>Last Updated: <strong>{lastUpdated}</strong></span>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className={`p-6 sm:p-8 rounded-2xl border transition-all ${
                darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-gray-200 shadow-xs'
              }`}
            >
              <h2 className="text-lg font-bold uppercase tracking-tight text-red-600 dark:text-red-500 mb-3">
                {section.title}
              </h2>
              <div className={`text-sm leading-relaxed whitespace-pre-line ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/terms"
            className="text-xs font-bold uppercase tracking-wider text-red-600 hover:underline"
          >
            ← Read Terms &amp; Conditions
          </Link>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

