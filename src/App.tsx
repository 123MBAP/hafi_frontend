import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import UpgradePlansPage from './components/DashboardParts/AdminParts/AdminPlans';
import ChatWrapper, { getProviderIdFromToken } from './components/DashboardParts/ChatBotWrapper';
import MessagesCard from './components/DashboardParts/MessagesCard';
import PaymentCredentialsPage from './components/DashboardParts/PaymentCredentials';
import ProviderBookingsPage from './components/DashboardParts/ProviderBookingsPage';
import ProviderCustomizationRequests from './components/DashboardParts/ProviderCustomizationRequests';
import ProviderPayment from './components/DashboardParts/ProviderPayment';
import UpgradePlans from './components/DashboardParts/UpgradePlans';
import MapComponent from './components/MapComponent';
import ProtectedRoute from './components/ProtectedRoute';
import Services from './components/Services/Services';
import Layout from './components/ui/Layout';
import { useDarkMode } from './context/DarkMode';
import AccountDashboard from './pages/AccountDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Unauthorized from './pages/anauthorised';
import CartPage from './pages/CartPage';
import ChatBot from './pages/ChatBox';
import CommentBox from './pages/CommentsPage';
import CommissionerDetailPage from './pages/CommissionerDetailPage';
import CommissionersPage from './pages/CommissionersPage';
import CustomerStatements from './pages/CustomerStatements';
import Dashboard from './pages/Dashboard';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import HomePage from './pages/Home';
import Login from './pages/Login';
import MadeInRwanda from './pages/MadeInRwanda';
import MadeInRwandaProductDetail from './pages/MadeInRwandaProductDetail';
import MarketPage from './pages/MarketPage';
import ShopsPage from './pages/Shops';
import MarketProductDetil from './pages/MarketProductDetail';
import OrdersPage from './pages/OrdersPage';
import NotFound from './pages/PageNotFound';
import PaymentPage from './pages/PaymentPage';
import PendingTransactionsPage from './pages/PendingTransactions';
import PracticePage from './pages/Practice';
import ProductOrServicesDetailPage from './pages/ProductOrServiceDetailPage';
import Profile from './pages/ProfilePage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ProviderDetail from './pages/ProviderDetail';
import ProviderOrdersPage from './pages/ProviderOrdersPage';
import RealEstatePage from './pages/RealEstatePage';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import AgentLogin from './pages/AgentLogin';
import AgentRegister from './pages/AgentRegister';
import AgentDashboard from './pages/AgentDashboard';
import RwandaLocationSelector from './pages/RwandaLocationSelector';
import Search from './pages/Search';
import SellerDashboardPage from './pages/SellerDashboardPage';
import ServiceBookingPage from './pages/ServiceBooking';
import ServiceDetailPage from './pages/ServiceDetailPage';
import StorageCheckout from './pages/StorageCheckout';
import Updates from './pages/UpdatesPage';
import VerifyEmailAuto from './pages/VerifyEmailAuto';
import VerifyEmailForm from './pages/VerifyEmailForm';
import Wallet from './pages/Wallet';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import AuthenticatedLayout from './components/AuthenticatedLayout';




function VerifyPageWrapper() {
  const search = new URLSearchParams(useLocation().search);
  const email = search.get('email') || '';
  return <VerifyEmailForm email={email} />;
}

const App: React.FC = () => {

  const [chatCustomerId, setChatCustomerId] = useState<string | null>(null);
  const { darkMode } = useDarkMode();


  const providerId = getProviderIdFromToken();

  const closeChat = () => {
    setChatCustomerId(null);
  };


  return (
    <div className={darkMode ? 'dark bg-gray-950 text-white overflow-x-hidden' : 'bg-white text-black overflow-x-hidden'}>
      <div className="flex flex-col min-h-screen bg-white text-hafi-teal dark:bg-gray-950 dark:text-white overflow-x-hidden">

        <main className="flex-grow px-4 py-6 overflow-x-hidden">

          <Routes>
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
              <Route path="/faq" element={<FAQ />} />
              <Route path="/search" element={<Search />} />
              <Route path="/book/payment" element={<PaymentPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route path="/made-in-rwanda" element={<MadeInRwanda />} />
              <Route path="/customer-feedbacks" element={<CommentBox />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/booking/service" element={<ServiceBookingPage />} />
              <Route path="/layout" element={<Layout />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/map" element={<MapComponent />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/location-selector" element={<RwandaLocationSelector />} />
              <Route path="/account-dashboard" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard/account" replace />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={<ProviderPayment />} />
              <Route path="/storage-checkout" element={<StorageCheckout />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']} fallbackPath="/admin/login">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/upgrade/subscriptions" element={
                <ProtectedRoute allowedRoles={['admin']} fallbackPath="/admin/login">
                  <UpgradePlansPage />
                </ProtectedRoute>
              } />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/verify" element={<VerifyPageWrapper />} />
              <Route path="/provider/:providerId/uploads" element={<ProviderDetail />} />
              <Route path="/verify-email" element={<VerifyEmailAuto />} />
              <Route path="/product/:productId" element={<MarketProductDetil />} />
              <Route path="/made-in-rwanda/product/:productId" element={<MadeInRwandaProductDetail />} />
              
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/statements" element={<CustomerStatements />} />

              {/* Real Estate Routes */}
              <Route path="/real-estate" element={<RealEstatePage />} />
              <Route path="/real-estate/commissioners" element={<CommissionersPage />} />
              <Route path="/real-estate/property/:propertyId" element={<PropertyDetailPage />} />
              <Route path="/real-estate/commissioner/:commissionerId" element={<CommissionerDetailPage />} />

              <Route path="*" element={<NotFound />} />

              <Route
                path="/profile/credentials"
                element={
                  <PaymentCredentialsPage
                    onSave={() => { }}
                  />
                }
              />
              <Route path="/chat/:customerId" element={providerId ? <ChatWrapper providerId={providerId} /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AuthenticatedLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardOverviewPage />} />
                <Route path="seller" element={
                  <ProtectedRoute allowedRoles={['seller']}>
                    <SellerDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="account" element={
                  <ProtectedRoute>
                    <AccountDashboard />
                  </ProtectedRoute>
                } />
                <Route path="provider" element={
                  <ProtectedRoute allowedRoles={['service_provider']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="agent" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="orders" element={
                  <ProtectedRoute allowedRoles={['service_provider','seller']}>
                    <ProviderOrdersPage />
                  </ProtectedRoute>
                } />
                <Route path="messages" element={
                  <MessagesCard
                    providerId={providerId!}
                    onSelectCustomer={setChatCustomerId}
                  />
                } />
                <Route path="upgrade" element={<UpgradePlans />} />
                <Route path="upgrade/pending" element={<PendingTransactionsPage />} />
                <Route path="payments" element={<ProviderBookingsPage />} />
                <Route path="requests" element={<ProviderCustomizationRequests />} />
              </Route>
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/Wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/product-or-service-detail/:providerId/:imageIndex" element={<ProductOrServicesDetailPage />} />
            </Route>

          </Routes>




          {chatCustomerId && (
            <ChatBot
              providerId={providerId!}
              customerId={chatCustomerId}
              currentUserRole='provider'
              onClose={closeChat}
            />
          )}



        </main>


        <footer className={`py-12 mt-auto border-t transition-colors duration-300
          ${darkMode 
            ? 'bg-gray-950 text-gray-400 border-gray-800' 
            : 'bg-white text-gray-600 border-gray-200'}`}>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
                <div>
                  <p className={`text-xs uppercase tracking-[0.28em] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Explore the platform
                  </p>
                  <h3 className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    One place for the four core ways people use HafiConnect.
                  </h3>
                </div>
                <p className={`max-w-2xl text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Built to help people find help nearby, discover local goods, browse wider market listings, and connect with real estate opportunities without leaving the app.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <a href="/services" className={`group p-5 border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-emerald-700' : 'bg-white border-gray-200 hover:border-emerald-300'}`} style={{ borderRadius: '2px' }}>
                  <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Services
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Find local service providers nearby
                  </h4>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Search trusted professionals around you for repairs, care, delivery, beauty, and everyday help.
                  </p>
                  <span className={`mt-4 inline-flex text-sm font-medium transition-colors ${darkMode ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'}`}>
                    Open Services →
                  </span>
                </a>

                <a href="/made-in-rwanda" className={`group p-5 border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-emerald-700' : 'bg-white border-gray-200 hover:border-emerald-300'}`} style={{ borderRadius: '2px' }}>
                  <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Made in Rwanda
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Discover local products in one place
                  </h4>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Shop Rwanda-made goods and support creators, makers, and sellers from across the country.
                  </p>
                  <span className={`mt-4 inline-flex text-sm font-medium transition-colors ${darkMode ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'}`}>
                    Explore Local Products →
                  </span>
                </a>

                <a href="/market" className={`group p-5 border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-emerald-700' : 'bg-white border-gray-200 hover:border-emerald-300'}`} style={{ borderRadius: '2px' }}>
                  <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Global Market
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Browse products and goods across Rwanda and beyond
                  </h4>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Find marketplace listings that connect buyers with goods, sellers, and opportunities beyond one location.
                  </p>
                  <span className={`mt-4 inline-flex text-sm font-medium transition-colors ${darkMode ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'}`}>
                    Open Market →
                  </span>
                </a>

                <a href="/real-estate" className={`group p-5 border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-emerald-700' : 'bg-white border-gray-200 hover:border-emerald-300'}`} style={{ borderRadius: '2px' }}>
                  <div className={`text-xs font-semibold uppercase tracking-[0.22em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Real Estate
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Find houses, land, buildings, and agents easily
                  </h4>
                  <p className={`text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Search properties and connect with commissioners and real estate professionals in a straightforward flow.
                  </p>
                  <span className={`mt-4 inline-flex text-sm font-medium transition-colors ${darkMode ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'}`}>
                    Browse Real Estate →
                  </span>
                </a>
              </div>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div>
                <a href="/" className="text-2xl font-bold text-emerald-600 mb-3 block hover:opacity-85 transition-opacity">
                  HafiConnect
                </a>
                <p className={`max-w-md text-sm leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  HafiConnect brings services, local products, global market listings, and real estate opportunities into one practical place.
                </p>
                <div className="flex space-x-4 mt-5">
                  <a href="#" aria-label="Facebook" className="hover:text-emerald-500 transition-colors">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" aria-label="Twitter" className="hover:text-emerald-500 transition-colors">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" aria-label="Instagram" className="hover:text-emerald-500 transition-colors">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" aria-label="LinkedIn" className="hover:text-emerald-500 transition-colors">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 lg:col-span-2">
                <div>
                  <h4 className={`font-bold mb-3 text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-emerald-700'}`}>Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/about-haficonnect" className="hover:text-emerald-500 transition-colors">About Us</a></li>
                    <li><a href="/contact" className="hover:text-emerald-500 transition-colors">Contact</a></li>
                    <li><a href="/faq" className="hover:text-emerald-500 transition-colors">FAQs</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className={`font-bold mb-3 text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-emerald-700'}`}>Contact</h4>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Email: <a href="mailto:info@haficonnect.com" className="hover:text-emerald-500 transition-colors">info@haficonnect.com</a>
                  </p>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Phone: <a href="tel:+250791689396" className="hover:text-emerald-500 transition-colors">+250 791 689 396</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className={`border-t mt-8 pt-4 text-center text-xs ${darkMode ? 'border-gray-800 text-gray-550' : 'border-gray-200 text-gray-400'}`}>
            &copy; {new Date().getFullYear()} HafiConnect. All rights reserved. &nbsp;|&nbsp;
            <a href="/terms" className="hover:text-hafi-green transition-colors">Terms of Service</a> &nbsp;|&nbsp;
            <a href="/privacy" className="hover:text-hafi-green transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
