import React from 'react';
import { useDarkMode } from '@/context/DarkMode';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Lock, CheckCircle2, Scale, HelpCircle } from 'lucide-react';

export default function TermsPage() {
  const { darkMode } = useDarkMode();

  const lastUpdated = "November 11, 2026";

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: `Welcome to HafiConnect ("Platform", "we", "us", or "our"), operated by Voltale Ltd, a registered company in Rwanda. By creating an account, browsing our marketplace, booking a service, listing products, or interacting with our platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, you must discontinue using HafiConnect immediately.`
    },
    {
      id: "eligibility",
      title: "2. Account Registration & User Roles",
      content: `To use certain features of HafiConnect, you must register for an account:
• You must provide accurate, current, and complete information during registration.
• You are responsible for safeguarding your login credentials and are liable for all activities under your account.
• HafiConnect supports multiple user roles:
  - Customer: Browse, purchase products, book services, and hire professionals.
  - Seller: List and sell retail goods, wholesale items, and Made in Rwanda products.
  - Service Provider: Offer localized services (e.g. repairs, beauty, technical, home care).
  - Real Estate Commissioner / Broker / Owner: List properties for sale or rent.
  - Agent: Facilitate onboarding, field verification, and regional operations under HafiConnect guidelines.`
    },
    {
      id: "marketplace-rules",
      title: "3. Marketplace Rules & Fair Trading",
      content: `Users agree to uphold integrity and transparency on the platform:
• Accurate Listings: All products, services, and properties must include accurate descriptions, genuine photos, and truthful prices in Rwandan Francs (RWF).
• Made in Rwanda Verification: Products labeled "Made in Rwanda" must comply with genuine local production standards. Misrepresentation will result in immediate delisting and account suspension.
• Prohibited Items: You may not sell illegal substances, hazardous materials, counterfeit items, stolen goods, weapons, or items infringing intellectual property rights.
• Professionalism: Service providers and sellers must deliver work and goods in accordance with agreed specifications, timelines, and safety standards.`
    },
    {
      id: "payments-escrow",
      title: "4. Payments, Escrow & Financial Protection",
      content: `HafiConnect protects buyers and sellers through secure payment integration:
• Payment Methods: We accept MTN Mobile Money, Airtel Money, card payments, and internal HafiConnect Wallet transfers.
• Escrow Protection: For protected orders, customer payments are held securely in escrow until the customer confirms satisfactory delivery or the designated escrow inspection window elapses.
• Auto-Release Mechanism: If a buyer does not confirm or dispute an order within the stipulated inspection timeframe following verified delivery, funds are automatically released to the provider/seller.
• Service Fees: Subscriptions, featured listing fees, and platform transaction commissions are clearly displayed prior to transaction authorization.`
    },
    {
      id: "real-estate",
      title: "5. Real Estate & Property Listings",
      content: `HafiConnect acts as an advertising and discovery platform for real estate properties in Rwanda:
• Listing Accuracy: Commissioners and owners must provide accurate property categories, land sizes, locations (Province, District, Sector, Cell, Village), and pricing.
• Verification Disclaimer: While HafiConnect implements verification protocols, buyers and tenants are advised to perform standard legal due diligence, title deed inspection, and physical site visits before entering binding real estate contracts.
• Commission: Any brokerage or commission fees must comply with Rwandan real estate trade laws.`
    },
    {
      id: "cancellation-refunds",
      title: "6. Cancellations, Returns & Dispute Resolution",
      content: `• Product Returns: Eligible physical items may be returned within the platform's return window if damaged, defective, or significantly not as described.
• Service Cancellations: Service bookings cancelled prior to provider dispatch or mobilization may be eligible for a full or partial refund.
• Dispute Handling: In case of disagreements between parties, HafiConnect support mediates objectively using delivery proof, chat history, and inspection evidence.`
    },
    {
      id: "ip-content",
      title: "7. Intellectual Property & Content Rights",
      content: `• Platform Rights: The HafiConnect name, brand mark, UI designs, code, and databases are the exclusive property of Voltale Ltd.
• User Content: By uploading images, descriptions, or videos to HafiConnect, you grant us a worldwide, non-exclusive license to display, optimize, and market your listings across our platforms.`
    },
    {
      id: "liability",
      title: "8. Limitation of Liability",
      content: `To the maximum extent permitted by the laws of Rwanda, HafiConnect and Voltale Ltd shall not be liable for indirect, incidental, punitive, or consequential damages resulting from user interactions, unauthorized access, service interruptions, or third-party merchant actions. The platform is provided on an "as is" and "as available" basis.`
    },
    {
      id: "governing-law",
      title: "9. Governing Law & Jurisdiction",
      content: `These Terms and Conditions are governed by and construed in accordance with the laws of the Republic of Rwanda. Any disputes arising from or relating to these terms shall be subject to the exclusive jurisdiction of the competent courts in Kigali, Rwanda.`
    },
    {
      id: "contact",
      title: "10. Contact Us",
      content: `For any questions, legal inquiries, or notices regarding these Terms:
• Company: Voltale Ltd (HafiConnect)
• Location: Kigali, Rwanda
• Email: legal@haficonnect.voltaleltd.com / support@haficonnect.voltaleltd.com
• Phone: +250 788 000 000`
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
              <Scale className="w-6 h-6" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              Legal Agreement
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-3">
            Terms &amp; Conditions<span className="text-red-600">.</span>
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed max-w-2xl`}>
            Please read these terms carefully before creating an account or using HafiConnect. These terms govern your rights, obligations, and the standards for trading, booking, and transacting across Rwanda.
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
            to="/privacy"
            className="text-xs font-bold uppercase tracking-wider text-red-600 hover:underline"
          >
            Read Privacy Policy →
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

