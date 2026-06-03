import { useState } from 'react';
import { useDarkMode } from '@/context/DarkMode';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Service {
  id: string;
  title: string;
  basePrice: number;
  duration: string;
  description: string;
  options: ServiceOption[];
}

const staticService: Service = {
  id: '1',
  title: 'Home Cleaning',
  basePrice: 50,
  duration: '2 hours',
  description: 'Standard home cleaning service including living room, kitchen, and bathroom',
  options: [
    {
      id: 'opt1',
      name: 'Extra Bathroom',
      description: 'Add one additional bathroom to cleaning',
      price: 15
    },
    {
      id: 'opt2',
      name: 'Window Cleaning',
      description: 'Interior window cleaning included',
      price: 20
    },
    {
      id: 'opt3',
      name: 'Oven Cleaning',
      description: 'Deep cleaning of oven interior',
      price: 25
    }
  ]
};

export default function ServiceBookingPage() {
  const {darkMode} = useDarkMode();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId) 
        : [...prev, optionId]
    );
  };

  const calculateTotal = () => {
    const optionsTotal = staticService.options
      .filter(opt => selectedOptions.includes(opt.id))
      .reduce((sum, opt) => sum + opt.price, 0);
    
    return staticService.basePrice + optionsTotal;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
    }, 1500);
  };

  const darkModeBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const darkModeText = darkMode ? 'text-gray-100' : 'text-gray-800';
  const darkModeCardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const darkModeBorder = darkMode ? 'border-gray-700' : 'border-gray-200';
  const darkModeInputBg = darkMode ? 'bg-gray-700 text-white' : 'bg-white';

  if (bookingSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkModeBg} ${darkModeText}`}>
        <div className={`max-w-md p-8 rounded-lg shadow-lg ${darkModeCardBg} ${darkModeBorder} text-center`}>
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold">Booking Confirmed!</h2>
          <p className="mt-2">Your service has been booked successfully.</p>
          <p className="mt-2">Total: ${calculateTotal()}</p>
          <button 
            onClick={() => setBookingSuccess(false)}
            className={`mt-6 px-4 py-2 rounded-md ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-hafi-green hover:bg-green-600'} text-white`}
          >
            Book Another Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${darkModeBg} ${darkModeText}`}>
      <div className="max-w-3xl mx-auto">
        <div className={`rounded-lg shadow-md p-6 mb-8 ${darkModeCardBg} ${darkModeBorder}`}>
          <h1 className="text-3xl font-bold mb-2">{staticService.title}</h1>
          <p className="text-lg mb-4">{staticService.description}</p>
          
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-teal-900/20' : 'bg-blue-50'}`}>
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 mr-2 text-hafi-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Duration: {staticService.duration}</span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-hafi-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Base Price: ${staticService.basePrice}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Customize Your Service</h2>
              <div className="space-y-4">
                {staticService.options.map(option => (
                  <div 
                    key={option.id} 
                    onClick={() => toggleOption(option.id)}
                    className={`p-4 rounded-lg cursor-pointer border ${darkModeBorder} transition-all ${
                      selectedOptions.includes(option.id) 
                        ? `${darkMode ? 'border-teal-400 bg-teal-900/20' : 'border-hafi-teal bg-blue-50'}`
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => toggleOption(option.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{option.name}</h3>
                          <span>+${option.price}</span>
                        </div>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Schedule Your Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className={`w-full p-2 border rounded-md ${darkModeInputBg} ${darkModeBorder}`}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className={`w-full p-2 border rounded-md ${darkModeInputBg} ${darkModeBorder}`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Special Requests</h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className={`w-full p-3 border rounded-md ${darkModeInputBg} ${darkModeBorder}`}
                rows={4}
                placeholder="Any specific instructions or additional requests..."
              />
            </div>

            <div className={`p-6 rounded-lg mb-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center mb-2">
                <span>Base Price:</span>
                <span>${staticService.basePrice}</span>
              </div>
              
              {selectedOptions.length > 0 && (
                <div className="mb-2">
                  {staticService.options
                    .filter(opt => selectedOptions.includes(opt.id))
                    .map(opt => (
                      <div key={opt.id} className="flex justify-between text-sm">
                        <span>+ {opt.name}:</span>
                        <span>+${opt.price}</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center mb-6">
              <input
                id="terms-checkbox"
                type="checkbox"
                className="mr-2"
                required
              />
              <label htmlFor="terms-checkbox" className="text-sm">
                I agree to the <a href="#" className="text-hafi-teal hover:underline">Terms of Service</a> and <a href="#" className="text-hafi-teal hover:underline">Refund Policy</a>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">100% Money Back Guarantee</span>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-md font-bold ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-hafi-green hover:bg-green-600'} text-white disabled:opacity-70`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm & Book Now'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}