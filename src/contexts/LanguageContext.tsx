import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "hi";

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { en: "Home", hi: "होम" },
  orders: { en: "Orders", hi: "ऑर्डर" },
  cart: { en: "Cart", hi: "कार्ट" },
  login: { en: "Login", hi: "लॉगिन" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल" },
  trackOrder: { en: "Track Order", hi: "ऑर्डर ट्रैक करें" },
  placeOrder: { en: "Place Order", hi: "ऑर्डर करें" },
  
  // Categories
  paper: { en: "Paper", hi: "कागज़" },
  plastic: { en: "Plastic", hi: "प्लास्टिक" },
  metal: { en: "Metal", hi: "धातु" },
  ewaste: { en: "E-Waste", hi: "ई-कचरा" },
  
  // Order Status
  pending: { en: "Pending", hi: "लंबित" },
  assigned: { en: "Assigned", hi: "सौंपा गया" },
  picked: { en: "Picked", hi: "उठाया गया" },
  weighed: { en: "Weighed", hi: "तौला गया" },
  paid: { en: "Paid", hi: "भुगतान किया" },
  completed: { en: "Completed", hi: "पूर्ण" },
  
  // Common
  search: { en: "Search scrap items...", hi: "स्क्रैप आइटम खोजें..." },
  noOrders: { en: "No orders yet", hi: "अभी तक कोई ऑर्डर नहीं" },
  orderPlaced: { en: "Order Placed", hi: "ऑर्डर प्लेस किया गया" },
  pickupAddress: { en: "Pickup Address", hi: "पिकअप पता" },
  pickupTime: { en: "Pickup Time", hi: "पिकअप समय" },
  estimatedWeight: { en: "Estimated Weight", hi: "अनुमानित वजन" },
  actualWeight: { en: "Actual Weight", hi: "वास्तविक वजन" },
  totalAmount: { en: "Total Amount", hi: "कुल राशि" },
  addToCart: { en: "Add to Cart", hi: "कार्ट में डालें" },
  checkout: { en: "Checkout", hi: "चेकआउट" },
  perKg: { en: "per kg", hi: "प्रति किलो" },
  kg: { en: "kg", hi: "किलो" },
  yourCart: { en: "Your Cart", hi: "आपका कार्ट" },
  emptyCart: { en: "Your cart is empty", hi: "आपका कार्ट खाली है" },
  orderSummary: { en: "Order Summary", hi: "ऑर्डर सारांश" },
  ecoFriendly: { en: "Eco-Friendly", hi: "पर्यावरण अनुकूल" },
  bestPrices: { en: "Best Prices", hi: "सर्वोत्तम कीमतें" },
  doorstepPickup: { en: "Doorstep Pickup", hi: "घर पर पिकअप" },
  welcome: { en: "Welcome", hi: "स्वागत है" },
  orderHistory: { en: "Order History", hi: "ऑर्डर इतिहास" },
  reorder: { en: "Reorder", hi: "दोबारा ऑर्डर करें" },
  trackYourOrders: { en: "Track Your Orders", hi: "अपने ऑर्डर ट्रैक करें" },
  orderTimeline: { en: "Order Timeline", hi: "ऑर्डर टाइमलाइन" },
  partnerAssigned: { en: "Partner Assigned", hi: "पार्टनर सौंपा गया" },
  scrapPicked: { en: "Scrap Picked", hi: "स्क्रैप उठाया गया" },
  scrapWeighed: { en: "Scrap Weighed", hi: "स्क्रैप तौला गया" },
  paymentDone: { en: "Payment Done", hi: "भुगतान हो गया" },
  orderCompleted: { en: "Order Completed", hi: "ऑर्डर पूर्ण" },
  priceDisclaimer: { en: "Price may vary during doorstep inspection", hi: "दरवाजे पर निरीक्षण के दौरान कीमत बदल सकती है" },
  selectLanguage: { en: "Language", hi: "भाषा" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("scrapy5-language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("scrapy5-language", language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
