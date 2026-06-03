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
    <div className={darkMode ? 'dark bg-gray-900 text-white overflow-x-hidden' : 'bg-white text-black overflow-x-hidden'}>
      <div className="flex flex-col min-h-screen bg-white text-hafi-teal dark:bg-gray-900 dark:text-white overflow-x-hidden">

        <main className="flex-grow px-4 py-6 overflow-x-hidden">

          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/services" element={<Services />} />
              <Route path="/search" element={<Search />} />
              <Route path="/book/payment" element={<PaymentPage />} />
              <Route path="/market" element={<MarketPage />} />
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
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/upgarede/subscriptions" element={<UpgradePlansPage />} />
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


        <footer className="bg-navy-dark text-white py-10 mt-auto dark:bg-gray-800 dark:text-white">

          <div className="container mx-auto px-4 md:px-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company Branding and Description */}
            <div>
              <a href="/" className="text-2xl font-bold text-hafi-green mb-2 block hover:text-green-300 transition-colors">
                HafiConnect
              </a>
              <p className="text-white/80 font-sans leading-snug">
                HafiConnect connects you with trusted service providers in your area for everything from home repairs to personal wellness. Fast, reliable, and secure.
              </p>
              {/* Social Media */}
              <div className="flex space-x-4 mt-4 font-sans leading-snug">
                <a href="#" aria-label="Facebook" className="hover:text-hafi-green transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" aria-label="Twitter" className="hover:text-hafi-green transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" aria-label="Instagram" className="hover:text-hafi-green transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" aria-label="LinkedIn" className="hover:text-hafi-green transition-colors">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-sans leading-snug mb-3 text-white">Quick Links</h4>
              <ul className="space-y-2 font-sans leading-snug text-white/80">
                <li><a href="/about" className="hover:text-hafi-green transition-colors font-sans leading-snug">About Us</a></li>
                <li><a href="/contact" className="hover:text-hafi-green transition-colors font-sans leading-snug">Contact</a></li>
                <li><a href="/faq" className="hover:text-hafi-green transition-colors font-sans leading-snug">FAQs</a></li>
                <li><a href="/blog" className="hover:text-hafi-green transition-colors font-sans leading-snug">Blog</a></li>
                <li><a href="/providers" className="hover:text-hafi-green transition-colors font-sans leading-snug">Find Providers</a></li>
                <li><a href="/signup" className="hover:text-hafi-green transition-colors font-sans leading-snug">Join as Provider</a></li>
              </ul>
            </div>

            {/* Popular Services */}
            <div>
              <h4 className="font-semibold mb-3 text-white font-sans leading-snug">Popular Services</h4>
              <ul className="space-y-2 text-white/80 font-sans leading-snug">
                <li><a href="/services/cleaning" className="hover:text-hafi-green transition-colors font-sans leading-snug">Home Cleaning</a></li>
                <li><a href="/services/plumbing" className="hover:text-hafi-green transition-colors font-sans leading-snug">Plumbing</a></li>
                <li><a href="/services/electrical" className="hover:text-hafi-green transition-colors font-sans leading-snug">Electrical</a></li>
                <li><a href="/services/beauty" className="hover:text-hafi-green transition-colors font-sans leading-snug">Beauty & Wellness</a></li>
                <li><a href="/services/moving" className="hover:text-hafi-green transition-colors font-sans leading-snug">Moving Help</a></li>
                <li><a href="/services/repair" className="hover:text-hafi-green transition-colors font-sans leading-snug">Appliance Repair</a></li>
              </ul>
            </div>

            {/* Contact & Apps */}
            <div>
              <h4 className="font-semibold font-sans leading-snug mb-3 text-white">Contact & Download</h4>
              <p className="text-white/80 text-sm mb-2">
                Email: <a href="mailto:support@haficonnect.com" className="hover:text-hafi-green transition-colors">support@haficonnect.com</a>
              </p>
              <p className="text-white/80 text-sm mb-4">
                Phone: <a href="tel:+1234567890" className="hover:text-hafi-green transition-colors">+1 (234) 567-890</a>
              </p>
              <div className="flex space-x-2">
                <a href="#" aria-label="App Store" className="hover:opacity-80 transition-opacity">
                  <img src="/apple-store-badge.svg" alt="Download on the App Store" className="h-10" />
                </a>
                <a href="#" aria-label="Google Play" className="hover:opacity-80 transition-opacity">
                  <img src="/google-play-badge.png" alt="Get it on Google Play" className="h-10" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/20 mt-8 pt-4 text-center text-white/60 text-xs">
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
