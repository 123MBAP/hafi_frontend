import { useDarkMode } from "@/context/DarkMode";

export default function About() {
  const { darkMode } = useDarkMode();

  const containerBg = darkMode ? "bg-gray-950 text-gray-400" : "bg-gray-50 text-gray-600";
  const borderCol = darkMode ? "border-gray-800" : "border-gray-200";
  const cardBg = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const textTitle = darkMode ? "text-white" : "text-gray-900";
  const labelColor = darkMode ? "text-emerald-400" : "text-emerald-600";

  return (
    <div className={`py-12 ${containerBg} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Section */}
        <div className={`pb-8 border-b ${borderCol}`}>
          <p className={`text-xs uppercase tracking-[0.28em] ${labelColor}`}>
            About HafiConnect
          </p>
          <h1 className={`mt-2 text-3xl sm:text-4xl font-bold tracking-tight ${textTitle}`}>
            Connecting Communities, Empowering Livelihoods.
          </h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-6">
            HafiConnect is a practical, unified digital platform built to bring local service providers, authentic Made-in-Rwanda products, global market listings, and real estate opportunities into one accessible place.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Users", value: "10K+" },
            { label: "Verified Partners", value: "500+" },
            { label: "Connected Districts", value: "15+" },
            { label: "Client Satisfaction", value: "98%" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-5 border shadow-sm text-center ${cardBg}`}
              style={{ borderRadius: '2px' }}
            >
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${textTitle}`}>{stat.value}</span>
              <div className={`text-xs font-semibold uppercase tracking-[0.22em] mt-2 ${labelColor}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* The Four Pillars */}
        <div className="space-y-6">
          <div>
            <p className={`text-xs uppercase tracking-[0.28em] ${labelColor}`}>
              Our Core Offerings
            </p>
            <h3 className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight ${textTitle}`}>
              The Four Ways People Use HafiConnect
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: "Services",
                title: "Find local service providers nearby",
                desc: "Search trusted professionals around you for repairs, photography, beauty, and everyday help.",
                action: "Explore Services",
                link: "/services"
              },
              {
                label: "Made in Rwanda",
                title: "Discover local products in one place",
                desc: "Shop Rwanda-made goods and support creators, makers, and sellers from across the country.",
                action: "Explore Local Products",
                link: "/made-in-rwanda"
              },
              {
                label: "Global Market",
                title: "Browse products and goods",
                desc: "Find marketplace listings that connect buyers with wider goods and opportunities beyond one location.",
                action: "Open Market",
                link: "/market"
              },
              {
                label: "Real Estate",
                title: "Find houses, land, and agents easily",
                desc: "Search properties and connect with commissioners and real estate professionals in a straightforward flow.",
                action: "Browse Real Estate",
                link: "/real-estate"
              }
            ].map((pillar, i) => (
              <a
                key={i}
                href={pillar.link}
                className={`group p-5 border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${cardBg}`}
                style={{ borderRadius: '2px' }}
              >
                <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-3 ${labelColor}`}>
                  {pillar.label}
                </div>
                <h4 className={`text-base font-semibold mb-2 ${textTitle}`}>
                  {pillar.title}
                </h4>
                <p className="text-xs sm:text-sm leading-6">
                  {pillar.desc}
                </p>
                <span className={`mt-4 inline-flex text-xs font-semibold uppercase tracking-wider transition-colors ${darkMode ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'}`}>
                  {pillar.action} &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t ${borderCol}`}>
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${labelColor}`}>Our Mission</div>
            <h4 className={`text-xl font-bold tracking-tight ${textTitle}`}>Fostering Local Trade Resilience</h4>
            <p className="text-sm leading-6">
              We bridge the digital gap for local merchants and service providers by offering ecommerce tools, direct connection interfaces (calls, messages, WhatsApp), and scalable storage. We build a sustainable local economy where business discovery is instantaneous.
            </p>
          </div>
          <div className="space-y-3">
            <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${labelColor}`}>Our Vision</div>
            <h4 className={`text-xl font-bold tracking-tight ${textTitle}`}>The Leading African Business Hub</h4>
            <p className="text-sm leading-6">
              To become the ultimate, most secure, and user-centric hub across East Africa and beyond. We are establishing a borderless ecosystem where high-quality services, local items, properties, and global logistics intersect seamlessly under a transparent, trustworthy framework.
            </p>
          </div>
        </div>

        {/* Core Values Section */}
        <div className="space-y-6">
          <div>
            <p className={`text-xs uppercase tracking-[0.28em] ${labelColor}`}>Why HafiConnect?</p>
            <h3 className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight ${textTitle}`}>Built on Trust and Accessibility</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Verified Trust & Safety",
                desc: "We screen and verify local providers, commissioner listings, and shops to ensure all transactions are authentic and secure."
              },
              {
                title: "Direct Connectivity",
                desc: "No middlemen bottlenecks. Connect instantly with sellers via direct calls, pre-filled WhatsApp queries, or built-in secure chats."
              },
              {
                title: "Flexible Infrastructure",
                desc: "A robust merchant dashboard offering dynamic storage plans, product uploads, order tracking, and live user feedback analysis."
              }
            ].map((value, i) => (
              <div
                key={i}
                className={`p-5 border shadow-sm ${cardBg}`}
                style={{ borderRadius: '2px' }}
              >
                <h4 className={`text-base font-semibold mb-2 ${textTitle}`}>{value.title}</h4>
                <p className="text-xs sm:text-sm leading-6">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className={`p-8 border shadow-xs text-center ${cardBg}`} style={{ borderRadius: '2px' }}>
          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${textTitle}`}>Ready to Grow Your Business?</h3>
          <p className="mt-2 text-sm leading-6 max-w-2xl mx-auto">
            Join HafiConnect today! Start listing your products or services to reach thousands of buyers, or discover and hire premium local service providers near you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <a
              href="/register"
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              style={{ borderRadius: '2px' }}
            >
              Create Account
            </a>
            <a
              href="/"
              className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-800 text-emerald-400' : 'border-gray-300 hover:bg-gray-50 text-emerald-600'}`}
              style={{ borderRadius: '2px' }}
            >
              Explore Marketplace
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
