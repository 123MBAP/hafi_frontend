import { useState } from "react";
import { useDarkMode } from "@/context/DarkMode";

type FaqItem = {
  question: string;
  answer: string;
};

export default function FAQ() {
  const { darkMode } = useDarkMode();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const containerBg = darkMode ? "bg-gray-950 text-gray-400" : "bg-gray-50 text-gray-600";
  const borderCol = darkMode ? "border-gray-800" : "border-gray-200";
  const cardBg = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const textTitle = darkMode ? "text-white" : "text-gray-900";
  const labelColor = darkMode ? "text-emerald-400" : "text-emerald-600";

  const faqs: FaqItem[] = [
    {
      question: "What is HafiConnect?",
      answer: "HafiConnect is a unified local marketplace connecting you to services (tailors, photographers, mechanics), Made in Rwanda products, global market goods, and real estate listings in one place."
    },
    {
      question: "How do I contact a service provider or seller?",
      answer: "You can connect directly by clicking on the service or product detail page, where you will find options to call, write an email, or start an instant chat on WhatsApp."
    },
    {
      question: "What payment methods are supported?",
      answer: "We support MTN Mobile Money (MoMo) and Airtel Money for online payments and plan subscriptions. You can also pay using your HafiConnect wallet balance."
    },
    {
      question: "Is it free to create an account?",
      answer: "Yes, creating a basic customer account is completely free. Providers and sellers can also sign up for free and choose to upgrade to premium plans for extra product listings and storage."
    },
    {
      question: "How can I list my services or shop products?",
      answer: "Navigate to the register page and choose the 'Seller' or 'Service Provider' role. Once registered, you will have access to your dashboard to upload services, products, or properties."
    },
    {
      question: "What is the 'Made in Rwanda' section?",
      answer: "It is a dedicated section built to showcase local artisans, craftsmen, fashion labels, and goods, supporting the growth of domestic manufacturers and trade."
    },
    {
      question: "How does the Real Estate listing work?",
      answer: "Property owners, buyers, and local commissioners can list and find properties (homes, land, commercial buildings) easily. Interested buyers can connect directly with agents."
    },
    {
      question: "What are the storage plans and storage add-ons?",
      answer: "Merchants who upload large amounts of media assets (images and videos) can upgrade their dashboard base storage plans or buy extra GB add-ons on the subscription page."
    },
    {
      question: "Can I track my pending transactions or subscriptions?",
      answer: "Yes, you can view the status of all your mobile money payments, orders, and plan renewals directly from the 'My Orders' page and your merchant dashboard."
    },
    {
      question: "How do I resolve a payment issue or dispute?",
      answer: "You can contact our support team immediately at info@haficonnect.com, call us at +250 791 689 396, or start a WhatsApp support chat. We are here to help resolve any inconvenience."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`py-12 ${containerBg} transition-colors duration-300 min-h-screen`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Section */}
        <div className={`pb-8 border-b ${borderCol}`}>
          <p className={`text-xs uppercase tracking-[0.28em] ${labelColor}`}>
            Help & FAQs
          </p>
          <h1 className={`mt-2 text-3xl sm:text-4xl font-bold tracking-tight ${textTitle}`}>
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-6">
            Find quick answers to common questions about using HafiConnect, listing your services, purchasing products, or managing your subscriptions.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border shadow-xs overflow-hidden ${cardBg}`}
                style={{ borderRadius: "2px" }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex justify-between items-center outline-none transition-colors"
                >
                  <span className={`text-sm sm:text-base font-semibold ${textTitle}`}>
                    {faq.question}
                  </span>
                  <span className={`text-xs font-bold uppercase ${labelColor}`}>
                    {isOpen ? "[ Hide ]" : "[ Show ]"}
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 border-t" : "max-h-0"
                  } ${borderCol}`}
                >
                  <div className="p-5 text-xs sm:text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
