import React, { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { useHafibot } from "./context/HafibotContext";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ChatWrapper, {
  getProviderIdFromToken,
} from "./components/DashboardParts/ChatBotWrapper";
import MapComponent from "./components/MapComponent";
import ProtectedRoute from "./components/ProtectedRoute";
import Services from "./components/Services/Services";
import Layout from "./components/ui/Layout";
import { useDarkMode } from "./context/DarkMode";
import HomePage from "./pages/Home";
import Login from "./pages/Login";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import Hafibot from "./components/Hafibot";
import Seo from "./components/Seo";
import voltaleLogo from "./assets/images/voltale.png";

// Every page other than the home and login pages is downloaded only when it is first opened.
const UpgradePlansPage = lazy(() => import("./components/DashboardParts/AdminParts/AdminPlans"));
const MessagesCard = lazy(() => import("./components/DashboardParts/MessagesCard"));
const PaymentCredentialsPage = lazy(() => import("./components/DashboardParts/PaymentCredentials"));
const ProviderBookingsPage = lazy(() => import("./components/DashboardParts/ProviderBookingsPage"));
const ProviderCustomizationRequests = lazy(() => import("./components/DashboardParts/ProviderCustomizationRequests"));
const ProviderPayment = lazy(() => import("./components/DashboardParts/ProviderPayment"));
const UpgradePlans = lazy(() => import("./components/DashboardParts/UpgradePlans"));
const AccountDashboard = lazy(() => import("./pages/AccountDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Unauthorized = lazy(() => import("./pages/anauthorised"));
const CartPage = lazy(() => import("./pages/CartPage"));
const ChatBot = lazy(() => import("./pages/ChatBox"));
const CommentBox = lazy(() => import("./pages/CommentsPage"));
const CommissionerDetailPage = lazy(() => import("./pages/CommissionerDetailPage"));
const CommissionersPage = lazy(() => import("./pages/CommissionersPage"));
const CustomerStatements = lazy(() => import("./pages/CustomerStatements"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardOverviewPage = lazy(() => import("./pages/DashboardOverviewPage"));
const MadeInRwanda = lazy(() => import("./pages/MadeInRwanda"));
const MadeInRwandaProductDetail = lazy(() => import("./pages/MadeInRwandaProductDetail"));
const MarketPage = lazy(() => import("./pages/MarketPage"));
const ShopsPage = lazy(() => import("./pages/Shops"));
const MarketProductDetil = lazy(() => import("./pages/MarketProductDetail"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const NotFound = lazy(() => import("./pages/PageNotFound"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const PendingTransactionsPage = lazy(() => import("./pages/PendingTransactions"));
const PracticePage = lazy(() => import("./pages/Practice"));
const ProductOrServicesDetailPage = lazy(() => import("./pages/ProductOrServiceDetailPage"));
const Profile = lazy(() => import("./pages/ProfilePage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const ProviderDetail = lazy(() => import("./pages/ProviderDetail"));
const ProviderOrdersPage = lazy(() => import("./pages/ProviderOrdersPage"));
const RealEstatePage = lazy(() => import("./pages/RealEstatePage"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AgentLogin = lazy(() => import("./pages/AgentLogin"));
const AgentRegister = lazy(() => import("./pages/AgentRegister"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const RwandaLocationSelector = lazy(() => import("./pages/RwandaLocationSelector"));
const Search = lazy(() => import("./pages/Search"));
const SellerDashboardPage = lazy(() => import("./pages/SellerDashboardPage"));
const ServiceBookingPage = lazy(() => import("./pages/ServiceBooking"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const StorageCheckout = lazy(() => import("./pages/StorageCheckout"));
const Updates = lazy(() => import("./pages/UpdatesPage"));
const VerifyEmailAuto = lazy(() => import("./pages/VerifyEmailAuto"));
const VerifyEmailForm = lazy(() => import("./pages/VerifyEmailForm"));
const Wallet = lazy(() => import("./pages/Wallet"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingSpinner size="lg" message="Loading..." variant="dots" />
  </div>
);

function VerifyPageWrapper() {
  const search = new URLSearchParams(useLocation().search);
  const email = search.get("email") || "";
  return <VerifyEmailForm email={email} />;
}

const App: React.FC = () => {
  const location = useLocation();
  const state = location.state as
    | { backgroundLocation?: Location; from?: string }
    | undefined;
  const backgroundLocation = state?.backgroundLocation;
  const isAuthPage = location.pathname === "/login" && !backgroundLocation;
  const [chatCustomerId, setChatCustomerId] = useState<string | null>(null);
  const [chatWidth, setChatWidth] = useState(50);
  const { darkMode } = useDarkMode();
  const { isOpen: isBotOpen } = useHafibot();
  const leftPageRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);

  const providerId = getProviderIdFromToken();

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";

    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      if (leftPageRef.current) {
        leftPageRef.current.scrollTop = 0;
      }
    }

    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, [location.pathname, location.search, location.hash]);

  const closeChat = () => {
    setChatCustomerId(null);
  };

  const handleBeforeOpen = () => {
    scrollPosRef.current =
      window.scrollY || document.documentElement.scrollTop || 0;
  };

  // Start the split view at the page content and restore the original page position on close.
  useEffect(() => {
    if (isBotOpen) {
      requestAnimationFrame(() => {
        if (leftPageRef.current) {
          leftPageRef.current.scrollTop = 0;
        }
      });
    } else {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosRef.current);
      });
    }
  }, [isBotOpen]);

  return (
    <div
      className={
        darkMode
          ? "dark bg-gray-950 text-white overflow-x-hidden"
          : "bg-white text-black overflow-x-hidden"
      }
    >
      <Seo />
      <div
        className={`flex w-full ${isBotOpen ? "h-screen overflow-hidden" : "min-h-screen"}`}
      >
        {/* Page area remains available beside Hafibot on desktop. */}
        <div
          ref={leftPageRef}
          onScroll={(e) => {
            if (isBotOpen) {
              scrollPosRef.current = e.currentTarget.scrollTop;
            }
          }}
          className={`flex flex-col transition-all duration-300 ease-in-out min-w-0 ${
            isBotOpen
              ? "w-full md:flex-1 h-screen overflow-y-auto"
              : "w-full min-h-screen"
          }`}
        >
          <div className="flex flex-col min-h-screen bg-gray-50/50 text-black font-sans dark:bg-gray-950 dark:text-gray-100 overflow-x-hidden">
            <main
              className={`flex-grow overflow-x-hidden ${isAuthPage ? "p-0" : "px-4 py-6"}`}
            >
              <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageFallback />}>
              <Routes location={backgroundLocation || location}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/agent/login" element={<AgentLogin />} />
                  <Route path="/agent/register" element={<AgentRegister />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/about-haficonnect" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/book/payment" element={<PaymentPage />} />
                  <Route path="/market" element={<MarketPage />} />
                  <Route path="/shops" element={<ShopsPage />} />
                  <Route path="/made-in-rwanda" element={<MadeInRwanda />} />
                  <Route path="/customer-feedbacks" element={<CommentBox />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/booking/service"
                    element={<ServiceBookingPage />}
                  />
                  <Route path="/layout" element={<Layout />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/map" element={<MapComponent />} />
                  <Route path="/updates" element={<Updates />} />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/location-selector"
                    element={<RwandaLocationSelector />}
                  />
                  <Route
                    path="/account-dashboard"
                    element={
                      <ProtectedRoute>
                        <Navigate to="/dashboard/account" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/checkout" element={<ProviderPayment />} />
                  <Route
                    path="/storage-checkout"
                    element={<StorageCheckout />}
                  />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin"]}
                        fallbackPath="/admin/login"
                      >
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/upgrade/subscriptions"
                    element={
                      <ProtectedRoute
                        allowedRoles={["admin"]}
                        fallbackPath="/admin/login"
                      >
                        <UpgradePlansPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/services/:id" element={<ServiceDetailPage />} />
                  <Route path="/verify" element={<VerifyPageWrapper />} />
                  <Route
                    path="/provider/:providerId/uploads"
                    element={<ProviderDetail />}
                  />
                  <Route path="/verify-email" element={<VerifyEmailAuto />} />
                  <Route
                    path="/product/:productId"
                    element={<MarketProductDetil />}
                  />
                  <Route
                    path="/made-in-rwanda/product/:productId"
                    element={<MadeInRwandaProductDetail />}
                  />

                  <Route path="/practice" element={<PracticePage />} />
                  <Route path="/statements" element={<CustomerStatements />} />

                  {/* Real Estate Routes */}
                  <Route path="/real-estate" element={<RealEstatePage />} />
                  <Route
                    path="/real-estate/commissioners"
                    element={<CommissionersPage />}
                  />
                  <Route
                    path="/commissioners"
                    element={<CommissionersPage />}
                  />
                  <Route
                    path="/real-estate/property/:propertyId"
                    element={<PropertyDetailPage />}
                  />
                  <Route
                    path="/real-estate/commissioner/:commissionerId"
                    element={<CommissionerDetailPage />}
                  />

                  <Route path="*" element={<NotFound />} />

                  <Route
                    path="/profile/credentials"
                    element={<PaymentCredentialsPage onSave={() => {}} />}
                  />
                  <Route
                    path="/chat/:customerId"
                    element={
                      providerId ? (
                        <ChatWrapper providerId={providerId} />
                      ) : (
                        <Navigate to="/login" />
                      )
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <AuthenticatedLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardOverviewPage />} />
                    <Route
                      path="seller"
                      element={
                        <ProtectedRoute allowedRoles={["seller"]}>
                          <SellerDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="account"
                      element={
                        <ProtectedRoute>
                          <AccountDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="provider"
                      element={
                        <ProtectedRoute allowedRoles={["service_provider"]}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="agent"
                      element={
                        <ProtectedRoute allowedRoles={["agent"]}>
                          <AgentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="orders"
                      element={
                        <ProtectedRoute
                          allowedRoles={["service_provider", "seller"]}
                        >
                          <ProviderOrdersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="messages"
                      element={
                        <MessagesCard
                          providerId={providerId!}
                          onSelectCustomer={setChatCustomerId}
                        />
                      }
                    />
                    <Route path="upgrade" element={<UpgradePlans />} />
                    <Route
                      path="upgrade/pending"
                      element={<PendingTransactionsPage />}
                    />
                    <Route path="payments" element={<ProviderBookingsPage />} />
                    <Route
                      path="requests"
                      element={<ProviderCustomizationRequests />}
                    />
                  </Route>
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/Wallet"
                    element={
                      <ProtectedRoute>
                        <Wallet />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/product-or-service-detail/:providerId/:imageIndex"
                    element={<ProductOrServicesDetailPage />}
                  />
                </Route>
              </Routes>
              </Suspense>
              </ErrorBoundary>

              {backgroundLocation && (
                <Routes>
                  <Route path="/login" element={<Login />} />
                </Routes>
              )}

              {chatCustomerId && (
                <ChatBot
                  providerId={providerId!}
                  customerId={chatCustomerId}
                  currentUserRole="provider"
                  onClose={closeChat}
                />
              )}
            </main>

            {!isBotOpen && !isAuthPage && (
              <footer className="py-12 mt-auto border-t-2 border-red-600 bg-black text-white transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="mb-10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] font-extrabold text-red-600">
                          Explore the platform
                        </p>
                        <h3 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
                          One place for the{" "}
                          <span className="text-red-600">four core ways</span>{" "}
                          people use HafiConnect.
                        </h3>
                      </div>
                      <p className="max-w-2xl text-sm leading-6 text-white/85 font-normal">
                        Built to help people find help nearby, discover local
                        goods, browse wider market listings, and connect with
                        real estate opportunities without leaving the app.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <a
                        href="/services"
                        className="group p-5 border border-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-zinc-950 hover:border-red-600 rounded-xl"
                      >
                        <div className="text-xs font-black uppercase tracking-[0.22em] mb-3 text-red-600">
                          Services
                        </div>
                        <h4 className="text-lg font-bold mb-2 text-white group-hover:text-red-500 transition-colors">
                          Find local service providers nearby
                        </h4>
                        <p className="text-sm leading-6 text-white/75">
                          Search trusted professionals around you for repairs,
                          care, delivery, beauty, and everyday help.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold transition-colors text-red-600 group-hover:text-red-400">
                          Open Services →
                        </span>
                      </a>

                      <a
                        href="/made-in-rwanda"
                        className="group p-5 border border-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-zinc-950 hover:border-red-600 rounded-xl"
                      >
                        <div className="text-xs font-black uppercase tracking-[0.22em] mb-3 text-red-600">
                          Made in Rwanda
                        </div>
                        <h4 className="text-lg font-bold mb-2 text-white group-hover:text-red-500 transition-colors">
                          Discover local products in one place
                        </h4>
                        <p className="text-sm leading-6 text-white/75">
                          Shop Rwanda-made goods and support creators, makers,
                          and sellers from across the country.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold transition-colors text-red-600 group-hover:text-red-400">
                          Explore Local Products →
                        </span>
                      </a>

                      <a
                        href="/market"
                        className="group p-5 border border-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-zinc-950 hover:border-red-600 rounded-xl"
                      >
                        <div className="text-xs font-black uppercase tracking-[0.22em] mb-3 text-red-600">
                          Global Market
                        </div>
                        <h4 className="text-lg font-bold mb-2 text-white group-hover:text-red-500 transition-colors">
                          Browse products and goods across Rwanda and beyond
                        </h4>
                        <p className="text-sm leading-6 text-white/75">
                          Find marketplace listings that connect buyers with
                          goods, sellers, and opportunities beyond one location.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold transition-colors text-red-600 group-hover:text-red-400">
                          Open Market →
                        </span>
                      </a>

                      <a
                        href="/real-estate"
                        className="group p-5 border border-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-zinc-950 hover:border-red-600 rounded-xl"
                      >
                        <div className="text-xs font-black uppercase tracking-[0.22em] mb-3 text-red-600">
                          Real Estate
                        </div>
                        <h4 className="text-lg font-bold mb-2 text-white group-hover:text-red-500 transition-colors">
                          Find houses, land, buildings, and agents easily
                        </h4>
                        <p className="text-sm leading-6 text-white/75">
                          Search properties and connect with commissioners and
                          real estate professionals in a straightforward flow.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold transition-colors text-red-600 group-hover:text-red-400">
                          Browse Real Estate →
                        </span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-zinc-800">
                    <div>
                      <a
                        href="/"
                        className="text-2xl font-black text-white mb-3 block hover:text-red-500 transition-colors tracking-tight"
                      >
                        HafiConnect<span className="text-red-600">.</span>
                      </a>
                      <p className="max-w-md text-sm leading-6 text-white/85 font-normal">
                        HafiConnect brings services, local products, global
                        market listings, and real estate opportunities into one
                        practical place.
                      </p>
                      <div className="flex space-x-4 mt-5">
                        <a
                          href="#"
                          aria-label="Facebook"
                          className="text-white/80 hover:text-red-600 transition-colors"
                        >
                          <i className="fab fa-facebook-f"></i>
                        </a>
                        <a
                          href="#"
                          aria-label="Twitter"
                          className="text-white/80 hover:text-red-600 transition-colors"
                        >
                          <i className="fab fa-twitter"></i>
                        </a>
                        <a
                          href="#"
                          aria-label="Instagram"
                          className="text-white/80 hover:text-red-600 transition-colors"
                        >
                          <i className="fab fa-instagram"></i>
                        </a>
                        <a
                          href="#"
                          aria-label="LinkedIn"
                          className="text-white/80 hover:text-red-600 transition-colors"
                        >
                          <i className="fab fa-linkedin-in"></i>
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black mb-3 text-sm uppercase tracking-wider text-white border-b-2 border-red-600 inline-block pb-1">
                        Quick Links
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <a
                            href="/about-haficonnect"
                            className="text-white/85 hover:text-red-600 font-medium transition-colors"
                          >
                            About Us
                          </a>
                        </li>
                        <li>
                          <a
                            href="/contact"
                            className="text-white/85 hover:text-red-600 font-medium transition-colors"
                          >
                            Contact
                          </a>
                        </li>
                        <li>
                          <a
                            href="/faq"
                            className="text-white/85 hover:text-red-600 font-medium transition-colors"
                          >
                            FAQs
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-black mb-3 text-sm uppercase tracking-wider text-white border-b-2 border-red-600 inline-block pb-1">
                        Contact
                      </h4>
                      <p className="text-sm mb-2 text-white/85 font-normal">
                        Email:{" "}
                        <a
                          href="mailto:info@haficonnect.com"
                          className="text-white hover:text-red-600 font-semibold transition-colors"
                        >
                          info@haficonnect.com
                        </a>
                      </p>
                      <p className="text-sm mb-4 text-white/85 font-normal">
                        Phone:{" "}
                        <a
                          href="tel:+250791689396"
                          className="text-white hover:text-red-600 font-semibold transition-colors"
                        >
                          +250 791 689 396
                        </a>
                      </p>
                    </div>

                    <div className="flex justify-start md:justify-end items-start">
                      <a
                        href="https://voltaleltd.com/solutions"
                        target="_blank"
                        rel="noopener"
                        title="Powered by Voltale Ltd — Digital Platforms & Engineering"
                        className="group inline-flex items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-white shadow-lg border-2 border-red-500 hover:bg-red-700 hover:border-red-400 hover:shadow-red-950/20 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <img
                          src={voltaleLogo}
                          alt="VOLTALE LTD logo"
                          className="h-10 w-10 object-contain flex-shrink-0"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black uppercase tracking-wider text-white/80 leading-tight">
                            Powered by
                          </span>
                          <span className="text-sm font-black tracking-tight text-white leading-snug">
                            VOLTALE LTD
                          </span>
                          <span className="text-[11px] font-bold text-white inline-flex items-center gap-1 group-hover:underline mt-0.5">
                            Explore Solutions
                            <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                              ↗
                            </span>
                          </span>
                        </div>
                        <div className="ml-1.5 flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white group-hover:bg-white/30 transition-colors duration-300">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-zinc-900 mt-10 pt-5 text-center text-xs text-white/70 font-medium">
                  &copy; {new Date().getFullYear()} HafiConnect. All rights
                  reserved. &nbsp;|&nbsp;
                  <Link
                    to="/terms"
                    className="text-white/80 hover:text-red-600 font-bold transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  &nbsp;|&nbsp;
                  <Link
                    to="/privacy"
                    className="text-white/80 hover:text-red-600 font-bold transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </footer>
            )}
          </div>
        </div>

        {/* Hafibot AI Assistant Side Panel */}
        <Hafibot
          chatWidth={chatWidth}
          onChatWidthChange={setChatWidth}
          onBeforeOpen={handleBeforeOpen}
        />
      </div>
    </div>
  );
};

export default App;
