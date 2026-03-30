/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  Fuel,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Car,
  Bike,
  Truck,
  Hash,
  Palette,
  Settings,
  Info,
  Camera,
  BookOpen,
  CheckCircle2,
  Plus,
  History,
  MapPin,
  User,
  Bell,
  QrCode,
  X,
  Phone,
  LogOut,
  ChevronDown,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Screen =
  | "splash"
  | "login"
  | "step1"
  | "step2"
  | "step3"
  | "status"
  | "dashboard"
  | "transactions"
  | "profile"
  | "notifications"
  | "map";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [vehicleType, setVehicleType] = useState<"bike" | "car" | "truck">(
    "car",
  );
  const [showQR, setShowQR] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "তেল সংগ্রহ সফল",
      message: "আপনি ২.৫ লিটার অকটেন সংগ্রহ করেছেন পদ্মা অয়েল কোম্পানি থেকে।",
      time: "১০ মিনিট আগে",
      unread: true,
      type: "success",
    },
    {
      id: 2,
      title: "লিমিট আপডেট",
      message: "আপনার আজকের তেলের লিমিট ৫ লিটার থেকে বাড়িয়ে ৭ লিটার করা হয়েছে।",
      time: "২ ঘণ্টা আগে",
      unread: true,
      type: "info",
    },
    {
      id: 3,
      title: "পেমেন্ট রিসিভড",
      message: "৩৩৭.৫০ টাকা পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।",
      time: "৫ ঘণ্টা আগে",
      unread: false,
      type: "payment",
    },
    {
      id: 4,
      title: "নিরাপত্তা সতর্কতা",
      message: "আপনার প্রোফাইল তথ্য সফলভাবে যাচাই করা হয়েছে।",
      time: "১ দিন আগে",
      unread: false,
      type: "security",
    },
    {
      id: 5,
      title: "স্বাগতম!",
      message:
        "ফুয়েল পাস অ্যাপে আপনাকে স্বাগতম। আপনার ডিজিটাল ফুয়েল যাত্রা শুরু করুন।",
      time: "২ দিন আগে",
      unread: false,
      type: "info",
    },
  ]);
  const [capturedImages, setCapturedImages] = useState<{
    car?: string;
    plate?: string;
    bluebook?: string;
  }>({});
  const [selectedPump, setSelectedPump] = useState<any>(null);

  // Personal Information State
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userRoleActual, setUserRoleActual] = useState<
    "owner" | "operator" | "distributor"
  >("owner"); // Actual logged in role

  // Vehicle Registration State
  const [regDistrict, setRegDistrict] = useState("");
  const [regSeries, setRegSeries] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [regModel, setRegModel] = useState("");
  const [regColor, setRegColor] = useState("");
  const [regEngineNumber, setRegEngineNumber] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [carFile, setCarFile] = useState<File | null>(null);
  const [plateFile, setPlateFile] = useState<File | null>(null);
  const [bluebookFile, setBluebookFile] = useState<File | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const carInputRef = useRef<HTMLInputElement>(null);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const bluebookInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("fuelpass_token");
    setScreen("splash");
    setFullName("");
    setMobileNumber("");
    setEmail("");
    setPassword("");
    setRegDistrict("");
    setRegSeries("");
    setRegNumber("");
    setRegModel("");
    setRegColor("");
    setRegEngineNumber("");
    setCapturedImages({});
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("fuelpass_token");
    if (!token) return;

    try {
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const user = data.user;
        setFullName(user.fullName);
        setMobileNumber(user.mobileNumber);
        setEmail(user.email || "");
        setRegDistrict(user.district);
        setRegSeries(user.series);
        setRegNumber(user.regNumber);
        setVehicleType(user.type);
        setRegModel(user.model);
        setRegColor(user.color);
        setRegEngineNumber(user.engineNumber);
        setCapturedImages({
          car: user.carImageUrl || undefined,
          plate: user.plateImageUrl || undefined,
          bluebook: user.bluebookImageUrl || undefined,
        });
        setUserRoleActual(user.role || "owner");
        setScreen("dashboard");
        fetchDashboardData();
      } else {
        localStorage.removeItem("fuelpass_token");
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  React.useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!mobileNumber || !password) {
      alert("মোবাইল নম্বর এবং পাসওয়ার্ড দিন");
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("fuelpass_token", data.token);
        const user = data.user;
        setFullName(user.fullName);
        setMobileNumber(user.mobileNumber);
        setEmail(user.email || "");
        setRegDistrict(user.district);
        setRegSeries(user.series);
        setRegNumber(user.regNumber);
        setVehicleType(user.type);
        setRegModel(user.model);
        setRegColor(user.color);
        setRegEngineNumber(user.engineNumber);
        setCapturedImages({
          car: user.carImageUrl || undefined,
          plate: user.plateImageUrl || undefined,
          bluebook: user.bluebookImageUrl || undefined,
        });
        setUserRoleActual(user.role || "owner");
        setScreen("dashboard");
        fetchDashboardData();
      } else {
        alert(data.error || "লগইন ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("সার্ভার ত্রুটি");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleNextToStep2 = () => {
    if (!fullName || !mobileNumber || !password) {
      alert("অনুগ্রহ করে সব তথ্য পূরণ করুন");
      return;
    }
    if (password.length < 6) {
      alert("পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে");
      return;
    }
    setScreen("step2");
  };

  const handleRegisterVehicle = async () => {
    if (
      !regDistrict ||
      !regSeries ||
      !regNumber ||
      !regModel ||
      !regColor ||
      !regEngineNumber
    ) {
      alert("অনুগ্রহ করে গাড়ির সব তথ্য পূরণ করুন");
      return;
    }
    if (!password || password.length < 6) {
      alert("কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড দিন");
      return;
    }
    setIsRegistering(true);
    try {
      const response = await fetch("/api/register-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobileNumber,
          email,
          password,
          district: regDistrict,
          series: regSeries,
          number: regNumber,
          type: vehicleType,
          model: regModel,
          color: regColor,
          engineNumber: regEngineNumber,
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("fuelpass_token", data.token);
        setScreen("step3");
      } else {
        alert(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("সার্ভার ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setIsRegistering(false);
    }
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("fuelpass_token");
    if (!token) return;
    try {
      const response = await fetch("/api/dashboard-data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    }
  };

  React.useEffect(() => {
    if (screen === "dashboard") {
      fetchDashboardData();
    }
  }, [screen]);

  const handleUploadVehicleImages = async () => {
    setIsUploadingImages(true);
    try {
      const token = localStorage.getItem("fuelpass_token");
      if (!token) {
        alert("সেশন শেষ হয়ে গেছে, আবার লগইন করুন");
        setScreen("login");
        return;
      }

      const formData = new FormData();
      if (carFile) formData.append("car", carFile);
      if (plateFile) formData.append("plate", plateFile);
      if (bluebookFile) formData.append("bluebook", bluebookFile);

      const response = await fetch("/api/upload-vehicle-images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Content-Type is auto-set by fetch for FormData
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setCapturedImages({
          car: data.carUrl || undefined,
          plate: data.plateUrl || undefined,
          bluebook: data.bluebookUrl || undefined,
        });
        setScreen("status");
      } else {
        alert(data.error || "ছবি আপলোড ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("সার্ভার ত্রুটি, আবার চেষ্টা করুন");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const pumps = [
    {
      id: 1,
      name: "পদ্মা ফিলিং স্টেশন",
      location: "কারওয়ান বাজার, ঢাকা",
      distance: "০.৮ কিমি",
      status: "খোলা",
      octane: "আছে",
      diesel: "আছে",
      petrol: "নাই",
      lat: 40,
      lng: 30,
    },
    {
      id: 2,
      name: "মেঘনা পেট্রোলিয়াম",
      location: "উত্তরা সেক্টর-৪, ঢাকা",
      distance: "১.৫ কিমি",
      status: "খোলা",
      octane: "আছে",
      diesel: "আছে",
      petrol: "আছে",
      lat: 60,
      lng: 50,
    },
    {
      id: 3,
      name: "যমুনা অয়েল লিমিটেড",
      location: "বনানী, ঢাকা",
      distance: "২.২ কিমি",
      status: "ভিড় বেশি",
      octane: "নাই",
      diesel: "আছে",
      petrol: "আছে",
      lat: 25,
      lng: 70,
    },
    {
      id: 4,
      name: "ট্রাস্ট ফিলিং স্টেশন",
      location: "সাভার, ঢাকা",
      distance: "৪.৫ কিমি",
      status: "বন্ধ",
      octane: "নাই",
      diesel: "নাই",
      petrol: "নাই",
      lat: 75,
      lng: 20,
    },
  ];

  const transactions = [
    {
      company: "পদ্মা অয়েল কোম্পানি",
      date: "২০ মার্চ ২০২৬",
      time: "১১:৪৫ AM",
      amount: "২.৫ লিটার",
      price: "৩৩৭.৫০ টাকা",
      method: "নগদ",
      location: "কারওয়ান বাজার, ঢাকা",
    },
    {
      company: "মেঘনা পেট্রোলিয়াম",
      date: "১৮ মার্চ ২০২৬",
      time: "০৯:৩০ AM",
      amount: "৩.০ লিটার",
      price: "৪০৫.০০ টাকা",
      method: "কার্ড",
      location: "উত্তরা সেক্টর-৪, ঢাকা",
    },
    {
      company: "যমুনা অয়েল লিমিটেড",
      date: "১৫ মার্চ ২০২৬",
      time: "০৪:১৫ PM",
      amount: "১.৫ লিটার",
      price: "২০২.৫০ টাকা",
      method: "বিকাশ",
      location: "বনানী, ঢাকা",
    },
    {
      company: "পদ্মা অয়েল কোম্পানি",
      date: "১২ মার্চ ২০২৬",
      time: "০৮:২০ AM",
      amount: "৪.০ লিটার",
      price: "৫৪০.০০ টাকা",
      method: "নগদ",
      location: "ধানমন্ডি, ঢাকা",
    },
    {
      company: "মেঘনা পেট্রোলিয়াম",
      date: "১০ মার্চ ২০২৬",
      time: "০৭:১০ PM",
      amount: "২.০ লিটার",
      price: "২৭০.০০ টাকা",
      method: "কার্ড",
      location: "মিরপুর-১০, ঢাকা",
    },
  ];

  const renderSplashScreen = () => (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-surface">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary opacity-5 blur-3xl"></div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center z-10">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm p-4">
          <Fuel className="text-primary" size={64} />
        </div>
        <h1 className="mb-3 text-[42px] font-bold leading-tight tracking-tight text-on-surface">
          ফুয়েল পাস
        </h1>
        <p className="max-w-[280px] text-lg font-medium leading-relaxed text-secondary opacity-90">
          আপনার নিরাপদ ও ডিজিটাল ফুয়েল পার্টনার
        </p>
      </div>

      <div className="relative w-full px-6 pb-12 pt-20 z-10">
        <div
          className="absolute bottom-0 left-0 right-0 -z-10 h-full w-full opacity-10"
          style={{
            background:
              "radial-gradient(circle at bottom center, var(--color-primary) 0%, transparent 70%)",
          }}
        ></div>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setScreen("login")}
            className="fuel-gradient text-on-primary flex h-14 w-full items-center justify-center rounded-xl text-lg font-bold shadow-lg transition-all active:scale-[0.98]"
          >
            লগইন করুন
          </button>
          <button
            onClick={() => setScreen("step1")}
            className="border-2 border-primary text-primary flex h-14 w-full items-center justify-center rounded-xl bg-transparent text-lg font-bold transition-all hover:bg-primary-fixed/20 active:scale-[0.98]"
          >
            রেজিস্ট্রেশন করুন
          </button>
        </div>
        <div className="mt-8 flex justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary opacity-40">
            Ver 2.4.0 • Secured
          </span>
        </div>
      </div>

      <div className="absolute bottom-40 left-0 right-0 flex justify-center opacity-5 -z-10">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0zoSL1inOkUaNTM8XV_NItWeWjX5vcg64oyrLBkLHrFQh0k3RMCzM9LF1zEiYr_I0TfMugfKa8oRNoFcPUMa1HOQmyX3m_Kw-cIB-xzRFmXeTJ2Pw1HW7_YlM8vrzmT7dnJZNvhKN_o0MSYr8-kP0OqjkUdcuKyc6IOrIBWIFA_qUMoS2lYr-5t3OwWkHnyv8spazhFS8Kj_3oR40dVVuD4eY9TXqhjmX5pxambmKAd_fxwXV28OB_LAH7pB-xgjkP3SOLovz2f-I"
          alt="Car illustration"
          className="w-full max-w-md grayscale"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md border-b border-[#bec9c2]/15 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("splash")}
            className="active:scale-95 duration-200 text-[#00503a] hover:bg-[#eeeeee] p-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg text-[#00503a]">ফুয়েল পাস</h1>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-12 px-6 max-w-2xl mx-auto w-full">
        <div className="mb-10 text-center">
          <div className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full font-semibold text-sm mb-4">
            ধাপ ১/৩
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">
            ব্যক্তিগত তথ্য
          </h2>
          <p className="text-secondary text-sm leading-relaxed">
            আপনার সঠিক তথ্য প্রদান করে ফুয়েল পাস নিবন্ধন সম্পন্ন করুন
          </p>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(0,33,22,0.06)] border border-outline-variant/10">
          <div className="space-y-8">
            <div className="group">
              <label
                htmlFor="reg-name"
                className="block text-secondary font-medium text-sm mb-2 px-1"
              >
                পূর্ণ নাম
              </label>
              <input
                id="reg-name"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3.5 transition-all outline-none rounded-t-lg placeholder:opacity-50"
                placeholder="আপনার পুরো নাম লিখুন"
                type="text"
              />
            </div>

            <div className="group">
              <label
                htmlFor="reg-mobile"
                className="block text-secondary font-medium text-sm mb-2 px-1"
              >
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-semibold">
                  +৮৮
                </span>
                <input
                  id="reg-mobile"
                  name="mobile"
                  autoComplete="tel-national"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:ring-0 pl-14 pr-4 py-3.5 transition-all outline-none rounded-t-lg placeholder:opacity-50"
                  placeholder="০১XXXXXXXXX"
                  type="tel"
                />
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="reg-email"
                className="block text-secondary font-medium text-sm mb-2 px-1"
              >
                ই-মেইল (অপশনাল)
              </label>
              <div className="relative">
                <input
                  id="reg-email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3.5 transition-all outline-none rounded-t-lg placeholder:opacity-50"
                  placeholder="আপনার ই-মেইল ঠিকানা (যদি থাকে)"
                  type="email"
                />
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="reg-password"
                className="block text-secondary font-medium text-sm mb-2 px-1"
              >
                পাসওয়ার্ড (কমপক্ষে ৬ ডিজিট)
              </label>
              <div className="relative">
                <ShieldCheck
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                  size={20}
                />
                <input
                  id="reg-password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:ring-0 pl-12 pr-12 py-3.5 transition-all outline-none rounded-t-lg placeholder:opacity-50 font-medium"
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-surface-container p-4 rounded-lg">
              <ShieldCheck
                className="text-primary-container shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                আপনার ব্যক্তিগত তথ্য নিরাপদে সংরক্ষিত থাকবে। আমরা আপনার গোপনীয়তা
                রক্ষা করতে প্রতিশ্রুতিবদ্ধ।
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleNextToStep2}
                className="fuel-gradient w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg active:scale-[0.98] duration-150 flex items-center justify-center gap-2 group"
              >
                পরবর্তী
                <ArrowRight
                  className="group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl h-48 relative">
          <img
            className="w-full h-full object-cover brightness-90"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2ObtRfzBEph6imPCu_G1qGMxk0yNR41QbXp-yUpb_-NuNFh64yvu_SWixX32sMSJ_j5UFOCGZzVQNc2AyNF49s5mISWGNSPwjIauYjJVd7OwT06DMXE6REOQPTO6N1Ayrn_U5sTDFtxg6pSfVEwkQoendSLDkMvEj2t1jh6JP57km1okf1GY4UhbBzGZhGX6mkP_YQCMApY9Xg63JeDtTq-ehU1MBLHeOMgp31smAZSN6KeqPOx2ani0ZqyhmDkiWsr0qoeFBi40a"
            alt="Secure portal"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent flex items-center p-8">
            <div className="text-white max-w-[200px]">
              <h3 className="font-bold text-xl mb-1">সুরক্ষিত পোর্টাল</h3>
              <p className="text-xs opacity-80">
                আপনার সকল তথ্য এনক্রিপ্ট করা পদ্ধতিতে সংরক্ষিত থাকে।
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-auto py-8 text-center text-secondary text-sm">
        <p>© ২০২৪ ফুয়েল পাস বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md border-b border-[#bec9c2]/15 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("step1")}
            className="text-[#00503a] active:scale-95 duration-200 p-2 rounded-full hover:bg-[#eeeeee] transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-[#00503a] font-bold text-lg">ফুয়েল পাস</h1>
        </div>
        <div className="flex items-center">
          <span className="text-secondary font-medium text-sm">ধাপ ২/৩</span>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-32 px-6 max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-primary">
              গাড়ির বিস্তারিত তথ্য
            </h2>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold text-secondary flex items-center gap-2">
              <Hash size={14} />
              গাড়ির ধরন
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setVehicleType("bike")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-lowest border transition-all duration-200 group active:scale-95 relative ${vehicleType === "bike" ? "border-2 border-primary" : "border-outline-variant/15"}`}
              >
                <Bike
                  className={`mb-2 ${vehicleType === "bike" ? "text-primary" : "text-secondary group-hover:text-primary"}`}
                  size={32}
                />
                <span
                  className={`text-sm ${vehicleType === "bike" ? "font-bold text-primary" : "font-medium"}`}
                >
                  বাইক
                </span>
                {vehicleType === "bike" && (
                  <CheckCircle2
                    className="absolute top-2 right-2 text-primary"
                    size={12}
                  />
                )}
              </button>
              <button
                onClick={() => setVehicleType("car")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-lowest border transition-all duration-200 group active:scale-95 relative ${vehicleType === "car" ? "border-2 border-primary" : "border-outline-variant/15"}`}
              >
                <Car
                  className={`mb-2 ${vehicleType === "car" ? "text-primary" : "text-secondary group-hover:text-primary"}`}
                  size={32}
                />
                <span
                  className={`text-sm ${vehicleType === "car" ? "font-bold text-primary" : "font-medium"}`}
                >
                  কার
                </span>
                {vehicleType === "car" && (
                  <CheckCircle2
                    className="absolute top-2 right-2 text-primary"
                    size={12}
                  />
                )}
              </button>
              <button
                onClick={() => setVehicleType("truck")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-lowest border transition-all duration-200 group active:scale-95 relative ${vehicleType === "truck" ? "border-2 border-primary" : "border-outline-variant/15"}`}
              >
                <Truck
                  className={`mb-2 ${vehicleType === "truck" ? "text-primary" : "text-secondary group-hover:text-primary"}`}
                  size={32}
                />
                <span
                  className={`text-sm ${vehicleType === "truck" ? "font-bold text-primary" : "font-medium"}`}
                >
                  ট্রাক
                </span>
                {vehicleType === "truck" && (
                  <CheckCircle2
                    className="absolute top-2 right-2 text-primary"
                    size={12}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary flex items-center gap-2">
              <Hash size={14} />
              গাড়ির নম্বর প্লেট
            </label>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5 relative">
                <select
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest rounded-xl border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium appearance-none"
                >
                  <option value="">জেলা</option>
                  {[
                    "ঢাকা মেট্রো",
                    "গাজীপুর",
                    "নারায়ণগঞ্জ",
                    "নরসিংদী",
                    "মুন্সিগঞ্জ",
                    "মানিকগঞ্জ",
                    "টাঙ্গাইল",
                    "কিশোরগঞ্জ",
                    "মাদারীপুর",
                    "গোপালগঞ্জ",
                    "শরীয়তপুর",
                    "ফরিদপুর",
                    "রাজবাড়ী",
                    "চট্টগ্রাম মেট্রো",
                    "কক্সবাজার",
                    "কুমিল্লা",
                    "ব্রাহ্মণবাড়িয়া",
                    "চাঁদপুর",
                    "ফেনী",
                    "লক্ষ্মীপুর",
                    "নোয়াখালী",
                    "খাগড়াছড়ি",
                    "রাঙ্গামাটি",
                    "বান্দরবান",
                    "রাজশাহী মেট্রো",
                    "নাটোর",
                    "নওগাঁ",
                    "চাঁপাইনবাবগঞ্জ",
                    "পাবনা",
                    "সিরাজগঞ্জ",
                    "বগুড়া",
                    "জয়পুরহাট",
                    "খুলনা মেট্রো",
                    "বাগেরহাট",
                    "সাতক্ষীরা",
                    "যশোর",
                    "নড়াইল",
                    "মাগুরা",
                    "ঝিনাইদহ",
                    "কুষ্টিয়া",
                    "মেহেরপুর",
                    "চুয়াডাঙ্গা",
                    "বরিশাল",
                    "ভোলা",
                    "পটুয়াখালী",
                    "পিরোজপুর",
                    "ঝালকাঠি",
                    "বরগুনা",
                    "সিলেট",
                    "মৌলভীবাজার",
                    "হবিগঞ্জ",
                    "সুনামগঞ্জ",
                    "রংপুর",
                    "গাইবান্ধা",
                    "কুড়িগ্রাম",
                    "লালমনিরহাট",
                    "নীলফামারী",
                    "পঞ্চগড়",
                    "ঠাকুরগাঁও",
                    "দিনাজপুর",
                    "ময়মনসিংহ",
                    "জামালপুর",
                    "শেরপুর",
                    "নেত্রকোনা",
                  ].map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-5 text-outline/30 pointer-events-none"
                  size={16}
                />
              </div>
              <div className="col-span-3 relative">
                <select
                  value={regSeries}
                  onChange={(e) => setRegSeries(e.target.value)}
                  className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest rounded-xl border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium appearance-none"
                >
                  <option value="">সিরিজ</option>
                  {[
                    "ক",
                    "খ",
                    "গ",
                    "ঘ",
                    "ঙ",
                    "চ",
                    "ছ",
                    "জ",
                    "ঝ",
                    "ঞ",
                    "ট",
                    "ঠ",
                    "ড",
                    "ঢ",
                    "ণ",
                    "ত",
                    "থ",
                    "দ",
                    "ধ",
                    "ন",
                    "প",
                    "ফ",
                    "ব",
                    "ভ",
                    "ম",
                    "য",
                    "র",
                    "ল",
                    "শ",
                    "ষ",
                    "স",
                    "হ",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-5 text-outline/30 pointer-events-none"
                  size={16}
                />
              </div>
              <div className="col-span-4 relative">
                <input
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full h-14 px-4 bg-surface-container-lowest rounded-xl border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium placeholder:text-outline/50"
                  placeholder="নম্বর"
                  type="text"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-secondary flex items-center gap-2">
                <Car size={14} />
                গাড়ির মডেল
              </label>
              <input
                value={regModel}
                onChange={(e) => setRegModel(e.target.value)}
                className="w-full h-14 px-4 bg-surface-container-lowest rounded-xl border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 transition-all outline-none font-medium placeholder:text-outline/50"
                placeholder="উদা: Yamaha FZS V3"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-secondary flex items-center gap-2">
                <Palette size={14} />
                গাড়ির আসল রঙ
              </label>
              <input
                value={regColor}
                onChange={(e) => setRegColor(e.target.value)}
                className="w-full h-14 px-4 bg-surface-container-lowest rounded-xl border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 transition-all outline-none font-medium placeholder:text-outline/50"
                placeholder="উদা: নেভি ব্লু"
                type="text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary flex items-center gap-2">
              <Settings size={14} />
              ইঞ্জিন নম্বর
            </label>
            <input
              value={regEngineNumber}
              onChange={(e) => setRegEngineNumber(e.target.value)}
              className="w-full h-14 px-4 bg-surface-container-lowest rounded-xl border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 transition-all outline-none font-medium placeholder:text-outline/50"
              placeholder="আপনার গাড়ির ইঞ্জিন নম্বরটি লিখুন"
              type="text"
            />
          </div>

          <div className="mt-8 p-6 bg-surface-container-low rounded-2xl flex items-center gap-6 overflow-hidden">
            <div className="flex-1">
              <h3 className="text-primary font-bold mb-1">সঠিক তথ্য দিন</h3>
              <p className="text-sm text-secondary leading-relaxed">
                আপনার প্রদানকৃত তথ্য ডিজিটাল ফুয়েল পাসের কিউআর কোডে যুক্ত হবে।
                ভুল তথ্য দিলে পাম্পে সমস্যা হতে পারে।
              </p>
            </div>
            <div className="w-24 h-24 bg-surface rounded-xl flex-shrink-0 flex items-center justify-center">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS-Ytn1_C4-jpMzUpxiLmsHhksWhcRcu59yk4i8jA2PzaKhW2B2mdHLsvSqEgA8WqHnnXJlJf0k8qXISPGutWM_tCDaGdK5Co4iKUZ9qqMv9tTdGku8BedReQa6g3QAog2xSnjbWBcPQmqy4uSyZEJ7YAS4Qw7txr_0f7gp2Y-shGKIZRivGF67vSDSnJ39PLpPesnArK9EPeZ2EDgisn3OYmb5bG9qmYsJp7GEsKjw9bQ5vNkrn3ouYWkgRI64w_viOyZuazf9N7X"
                alt="Registration documents"
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          <button
            onClick={handleRegisterVehicle}
            disabled={isRegistering}
            className={`w-full h-16 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-lg rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_16px_32px_rgba(0,33,22,0.12)] ${isRegistering ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isRegistering ? "প্রসেসিং..." : "পরবর্তী"}
            {!isRegistering && <ArrowRight size={20} />}
          </button>
          <p className="text-center text-secondary text-sm">
            আপনি চাইলে পরবর্তীতে এই তথ্য পরিবর্তন করতে পারবেন
          </p>
        </div>
      </main>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md border-b border-[#bec9c2]/15 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("step2")}
            className="text-[#00503a] active:scale-95 duration-200 p-2 hover:bg-[#eeeeee] rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg text-[#00503a]">ফুয়েল পাস</h1>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-32 px-6 max-w-2xl mx-auto w-full">
        {/* Hidden inputs */}
        <input
          type="file"
          accept="image/*"
          ref={carInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setCarFile(file);
              setCapturedImages((prev) => ({
                ...prev,
                car: URL.createObjectURL(file),
              }));
            }
          }}
        />
        <input
          type="file"
          accept="image/*"
          ref={plateInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPlateFile(file);
              setCapturedImages((prev) => ({
                ...prev,
                plate: URL.createObjectURL(file),
              }));
            }
          }}
        />
        <input
          type="file"
          accept="image/*"
          ref={bluebookInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setBluebookFile(file);
              setCapturedImages((prev) => ({
                ...prev,
                bluebook: URL.createObjectURL(file),
              }));
            }
          }}
        />

        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-2xl font-bold text-primary leading-tight">
              ভেরিফিকেশন ও ছবি আপলোড
            </h2>
            <span className="text-secondary font-medium text-sm">ধাপ ৩/৩</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full transition-all duration-500"></div>
          </div>
        </div>

        <div className="mb-8 p-4 bg-surface-container-low rounded-xl border-l-4 border-primary">
          <p className="text-on-surface-variant text-sm leading-relaxed">
            সঠিক ভেরিফিকেশনের জন্য নিচের ছবিগুলো পরিষ্কারভাবে তুলুন। আপলোড করা
            প্রতিটি ছবি আমাদের সিস্টেম দ্বারা যাচাই করা হবে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 group relative bg-surface-container-lowest rounded-xl p-6 transition-all duration-200 active:scale-[0.98] outline outline-1 outline-outline-variant/15">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-32 rounded-lg bg-surface-container flex items-center justify-center relative overflow-hidden">
                {capturedImages.car ? (
                  <img
                    src={capturedImages.car}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNopu3kNUGd6365aPDUTQlLW7IfBla329dH-iZXeHoC3iLO-icobyTthUq8OOg-mXNT3MCrJHs9NSC8abkGyjpPJOeQ7qMAfR8EBKBJrUqCEnfd0rcT0XXDg-r9oCNj6WPo_aBDnTRIopGsNvg9FYCp_LqEJzs__OxOuBzXWU6a65arxRkZwjzOERBVQVjFtIEA7omSP-6H3zxRYxu2XcYv3HTg5CECtX1NHu-qYLc7ndLnOfiu54AWuzk2m7jTqSI8ny12CtaOQkh"
                      alt="Car placeholder"
                      referrerPolicy="no-referrer"
                    />
                    <Camera className="text-primary/40" size={40} />
                  </>
                )}
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-lg font-bold text-primary mb-1">
                  গাড়ির ছবি
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  গাড়ির মডেল এবং রঙ পরিষ্কারভাবে দেখা যায় এমন একটি ফুল বডি ছবি
                  তুলুন।
                </p>
                <button
                  onClick={() => carInputRef.current?.click()}
                  className={`mt-4 inline-flex items-center gap-2 px-6 py-2 ${capturedImages.car ? "bg-secondary text-white" : "bg-primary text-on-primary"} rounded-xl font-medium text-sm transition-opacity hover:opacity-90 active:scale-95`}
                >
                  <Camera size={18} />
                  {capturedImages.car ? "পুনরায় তুলুন" : "লাইভ ক্যামেরা"}
                </button>
              </div>
            </div>
          </div>

          <div className="group bg-surface-container-lowest rounded-xl p-6 transition-all duration-200 active:scale-[0.98] outline outline-1 outline-outline-variant/15">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-container/30 flex items-center justify-center mb-4 overflow-hidden">
                {capturedImages.plate ? (
                  <img
                    src={capturedImages.plate}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Hash className="text-secondary" size={32} />
                )}
              </div>
              <h3 className="text-md font-bold text-primary mb-2">
                নম্বর প্লেটের ছবি
              </h3>
              <p className="text-xs text-secondary mb-4">
                OCR ভেরিফিকেশনের জন্য নম্বরগুলো স্পষ্টভাবে তুলুন।
              </p>
              <button
                onClick={() => plateInputRef.current?.click()}
                className={`w-full py-3 ${capturedImages.plate ? "bg-secondary text-white" : "bg-surface-container-high text-on-secondary-container"} rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors`}
              >
                <Camera size={20} />
                {capturedImages.plate ? "পরিবর্তন করুন" : "ক্যাপচার করুন"}
              </button>
            </div>
          </div>

          <div className="group bg-surface-container-lowest rounded-xl p-6 transition-all duration-200 active:scale-[0.98] outline outline-1 outline-outline-variant/15">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-container/30 flex items-center justify-center mb-4 overflow-hidden">
                {capturedImages.bluebook ? (
                  <img
                    src={capturedImages.bluebook}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="text-secondary" size={32} />
                )}
              </div>
              <h3 className="text-md font-bold text-primary mb-2">
                ব্লু-বুক ছবি
              </h3>
              <p className="text-xs text-secondary mb-4">
                রেজিস্ট্রেশন কাগজের প্রথম পৃষ্ঠার একটি স্পষ্ট ছবি।
              </p>
              <button
                onClick={() => bluebookInputRef.current?.click()}
                className={`w-full py-3 ${capturedImages.bluebook ? "bg-secondary text-white" : "bg-surface-container-high text-on-secondary-container"} rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors`}
              >
                <Camera size={20} />
                {capturedImages.bluebook ? "পরিবর্তন করুন" : "ক্যাপচার করুন"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <ShieldCheck className="text-red-600 text-xl mt-0.5" size={20} />
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
            আপনার তথ্যগুলো পাম্পে তেল প্রদানের সময় যাচাই করা হবে। ভুল তথ্য
            প্রদান করলে সার্ভিসটি বাতিল হতে পারে।
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-surface-container-lowest p-6 border-t border-outline-variant/10 z-50">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleUploadVehicleImages}
            disabled={isUploadingImages}
            className={`w-full py-4 bg-gradient-to-br from-[#00503a] to-[#006a4e] text-on-primary rounded-xl font-bold text-lg shadow-[0_16px_16px_rgba(0,33,22,0.04)] active:scale-[0.97] transition-all duration-200 ${isUploadingImages ? "opacity-70" : ""}`}
          >
            {isUploadingImages
              ? "ছবি আপলোড হচ্ছে..."
              : "রেজিস্ট্রেশন সম্পন্ন করুন"}
          </button>
        </div>
      </footer>
    </div>
  );

  const renderStatus = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md border-b border-[#bec9c2]/15 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("splash")}
            className="text-[#00503a] active:scale-95 duration-200 hover:bg-[#eeeeee] p-2 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg text-[#00503a]">
            রেজিস্ট্রেশন স্ট্যাটাস
          </h1>
        </div>
        <div className="text-[#00503a] font-bold text-xl">ফুয়েল পাস</div>
      </header>

      <main className="flex-grow pt-24 pb-12 px-6 flex flex-col items-center max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mb-6">
            <CheckCircle2 className="text-primary" size={64} />
          </div>
          <h2 className="text-2xl font-semibold text-primary mb-4 leading-relaxed">
            আপনার তথ্য জমা হয়েছে।
          </h2>
          <p className="text-secondary text-lg max-w-xs leading-[1.6]">
            ভেরিফিকেশন সম্পন্ন হলে আপনাকে জানিয়ে দেওয়া হবে
          </p>
        </div>

        <div className="w-full grid grid-cols-1 gap-6">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow border border-outline-variant/10">
            <div className="bg-primary px-6 py-3 flex justify-between items-center">
              <span className="text-on-primary text-sm font-medium">
                আবেদন প্রিভিউ
              </span>
              <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold">
                প্রসেসিং
              </span>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2 aspect-[4/3] rounded-lg overflow-hidden relative bg-surface-container">
                <img
                  src={
                    capturedImages.car ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDEnuS-JYCzDBRJfp4-6CYFHKvDfjxVEnfEKQS_jAhzumvIZ_ZWEuEe9WUxRu_HzNLTkNKQNboQ_gBfNes_V60mna66ePq1Y-iYric6BZoXIk6nid1T_5UH7JFk6d4KgEtE6YBHr8vgjnKqwVN5cp359ijsT_kemHJQzixq6JmO4ysHg_oRPB-ipWMOLk6119wlQ_ga0cqNyYcQdQoQG-eolRNpkaPC-AN9-JG_gqa3d2IUAvwTQ2Yh3fSNk8bXZHGceAnyKVZYwjNt"
                  }
                  alt="Vehicle Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center">
                <div className="mb-6">
                  <label className="text-secondary text-xs font-bold uppercase tracking-wider mb-1 block">
                    গাড়ির ধরণ
                  </label>
                  <p className="text-on-surface text-xl font-medium">
                    {vehicleType === "bike"
                      ? "মোটরসাইকেল"
                      : vehicleType === "car"
                        ? "ব্যক্তিগত গাড়ি"
                        : "ট্রাক"}
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <label className="text-secondary text-xs font-bold uppercase tracking-wider mb-1 block">
                    লাইসেন্স প্লেট নম্বর
                  </label>
                  <p className="text-on-surface text-2xl font-bold tracking-tight">
                    {regDistrict}-{regSeries} {regNumber}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low px-6 py-4 flex items-start gap-3">
              <Info className="text-secondary shrink-0 mt-0.5" size={20} />
              <p className="text-on-secondary-container text-sm leading-relaxed">
                আমাদের প্রতিনিধি ২৪ ঘণ্টার মধ্যে আপনার প্রদত্ত তথ্যাদি যাচাই
                করবেন। সঠিক তথ্য না থাকলে আবেদনটি বাতিল হতে পারে।
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 w-full max-w-xs">
          <button
            onClick={() => setScreen("dashboard")}
            className="fuel-gradient w-full py-4 rounded-xl text-on-primary font-semibold text-lg active:scale-95 transition-all duration-200 editorial-shadow"
          >
            হোম পেজে যান
          </button>
        </div>
      </main>
      <footer className="mt-auto py-8 text-center text-secondary opacity-50">
        <p className="text-xs">
          © ২০২৪ ফুয়েল পাস । গণপ্রজাতন্ত্রী বাংলাদেশ সরকার কর্তৃক অনুমোদিত
        </p>
      </footer>
    </div>
  );

  const renderDashboard = () => (
    <div className="bg-surface text-on-surface font-body leading-relaxed antialiased min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md flex justify-between items-center px-6 py-4 w-full max-w-md mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden border-2 border-primary-fixed">
            <img
              alt="User profile"
              className="w-full h-full object-cover"
              src={
                capturedImages.car ||
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBDBMerF8ZIdHnF8uLDe0rcQhGaKZhvyUavAyflVc_b4K9dZqS3nLuHXh78O2EohWbIR5-Kw8tPzyDqwTRBeH7XC3d0rai6HlOE2jaEIThAvCFL7ipXyXdxZ3l35TYmxlElzFlPJXGAaX5I0Pml1Ii4jWlgRctx6BAH07YN4gt4m_TkBBjmlvz8JzYQ53kYbfc6BExhQfoZJPAU6Q6A017_BYL5_Wz-Y-c3T67_2F3OA6Z6E75ADa9JkmYYT7kOaEtrLr77JerAOUHw"
              }
            />
          </div>
          <h1 className="text-[#00503a] font-bold text-xl tracking-tight">
            ফুয়েল পাস
          </h1>
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eeeeee] transition-colors"
        >
          <QrCode size={24} className="text-primary" />
        </button>
        <button
          onClick={() => setScreen("notifications")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eeeeee] transition-colors"
        >
          <div className="relative">
            <Bell size={24} className="text-secondary" />
            {notifications.some((n) => n.unread) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface"></span>
            )}
          </div>
        </button>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto space-y-8">
        <section>
          <h2 className="text-secondary text-sm font-bold mb-4 px-1">
            আজকের তেলের দর
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {(dashboardData?.fuelRates || []).map((rate: any, i: number) => (
              <div
                key={i}
                className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-xl min-w-[140px]"
              >
                <p className="text-xs text-secondary mb-1">{rate.type}</p>
                <p className="text-lg font-bold text-primary">
                  {rate.price} {rate.unit}
                </p>
              </div>
            ))}
            {!dashboardData?.fuelRates &&
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/15 p-4 rounded-xl min-w-[140px] animate-pulse"
                >
                  <div className="h-3 w-12 bg-surface-container-high rounded mb-2"></div>
                  <div className="h-6 w-20 bg-surface-container-high rounded"></div>
                </div>
              ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-8 text-center shadow-[0_8px_32px_rgba(0,33,22,0.04)] border border-outline-variant/10">
          <h2 className="text-secondary font-medium mb-6">
            আজকের অবশিষ্ট লিমিট
          </h2>
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="45"
                stroke="#e8e8e8"
                strokeWidth="8"
              ></circle>
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="45"
                stroke="url(#gradient)"
                strokeLinecap="round"
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={
                  283 -
                  283 *
                    ((dashboardData?.limits?.daily?.used || 0) /
                      (dashboardData?.limits?.daily?.total || 1))
                }
              ></circle>
              <defs>
                <linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#006a4e"></stop>
                  <stop offset="100%" stopColor="#9ef4d0"></stop>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold text-primary tracking-tighter">
                {(
                  (dashboardData?.limits?.daily?.total || 0) -
                  (dashboardData?.limits?.daily?.used || 0)
                ).toFixed(1)}
              </span>
              <span className="text-secondary text-sm font-medium mt-1">
                / {(dashboardData?.limits?.daily?.total || 0).toFixed(1)} লিটার
              </span>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-outline-variant/10 text-left">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-secondary text-xs font-bold uppercase tracking-widest">
                এই মাসের মোট কোটা
              </h3>
              <span className="text-primary font-bold text-sm">
                {dashboardData?.limits?.monthly?.used || 0} /{" "}
                {dashboardData?.limits?.monthly?.total || 0} লিটার
              </span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000"
                style={{
                  width: `${((dashboardData?.limits?.monthly?.used || 0) / (dashboardData?.limits?.monthly?.total || 1)) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-[10px] text-secondary mt-2 opacity-70">
              রিনিউয়াল ডেট:{" "}
              {dashboardData?.limits?.monthly?.renewalDate || "লোডিং..."}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-secondary text-sm font-bold px-1">আমার গাড়ি</h2>
          <div className="bg-surface-container-low rounded-2xl p-6 flex items-center justify-between border-l-4 border-primary">
            <div>
              <h3 className="text-primary font-bold text-lg">
                {regModel || "গাড়ির মডেল"}
              </h3>
              <div className="mt-2 inline-block bg-white px-3 py-1 rounded border-2 border-on-surface/80">
                <span className="text-on-surface font-bold text-sm">
                  {regDistrict}-{regSeries} {regNumber}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 bg-surface-container-high rounded-xl flex items-center justify-center">
              <Car className="text-primary" size={32} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-secondary text-sm font-bold">
              সাম্প্রতিক তেল গ্রহণ
            </h2>
            <button
              onClick={() => setScreen("transactions")}
              className="text-primary text-xs font-bold"
            >
              সব দেখুন
            </button>
          </div>
          <div className="space-y-4">
            {(dashboardData?.recentTransactions || []).map(
              (item: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setSelectedTransaction(item)}
                  className="bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 cursor-pointer hover:shadow-md border border-transparent hover:border-primary/10"
                >
                  <div className="w-12 h-12 bg-primary-fixed/20 rounded-full flex items-center justify-center text-primary">
                    <Fuel size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-on-surface font-bold text-base leading-tight">
                      {item.company}
                    </p>
                    <p className="text-secondary text-xs mt-1">
                      {item.date} | {item.amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-container font-bold text-sm">
                      {item.method}
                    </p>
                    <span className="text-[10px] bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full font-bold">
                      পরিশোধিত
                    </span>
                  </div>
                </div>
              ),
            )}
            {!dashboardData?.recentTransactions &&
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 animate-pulse"
                >
                  <div className="w-12 h-12 bg-surface-container-high rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-2/3"></div>
                    <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-8 bg-surface-container-high rounded-xl"></div>
                </div>
              ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#f9f9f9] border-t border-[#bec9c2]/15 shadow-[0_-4px_16px_rgba(0,33,22,0.04)] max-w-md mx-auto left-0 right-0">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 w-full">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex flex-col items-center justify-center text-[#00503a] font-bold after:content-[''] after:w-1 after:h-1 after:bg-[#00503a] after:rounded-full after:mt-1 transition-transform duration-200 scale-110"
          >
            <CheckCircle2 size={24} />
            <span className="text-[12px] font-medium leading-tight">হোম</span>
          </button>
          <button
            onClick={() => setScreen("transactions")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <History size={24} />
            <span className="text-[12px] font-medium leading-tight">
              লেনদেন
            </span>
          </button>
          <button
            onClick={() => setScreen("map")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <MapPin size={24} />
            <span className="text-[12px] font-medium leading-tight">
              পাম্প ম্যাপ
            </span>
          </button>
          <button
            onClick={() => setScreen("profile")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <User size={24} />
            <span className="text-[12px] font-medium leading-tight">
              প্রোফাইল
            </span>
          </button>
        </div>
      </nav>

      <button
        onClick={() => setShowQR(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl flex items-center justify-center shadow-xl z-40 active:scale-90 transition-transform"
      >
        <QrCode size={32} />
      </button>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container transition-colors"
              >
                <X size={24} className="text-secondary" />
              </button>

              <div className="mb-8 mt-4">
                <h2 className="text-2xl font-bold text-primary mb-2">
                  আপনার ফুয়েল পাস QR
                </h2>
                <p className="text-secondary text-sm">
                  তেল নিতে পাম্প অপারেটরকে এই কোডটি দেখান
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-inner mb-8 inline-block border-4 border-primary-fixed">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=FUELPASS-BD-123456"
                  alt="Fuel Pass QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                  <p className="text-xs text-secondary uppercase tracking-widest font-bold mb-1">
                    গাড়ির নম্বর
                  </p>
                  <p className="text-xl font-bold text-on-surface">
                    {regDistrict}-{regSeries} {regNumber}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-primary font-bold">
                  <ShieldCheck size={20} />
                  <span>নিরাপদ ও ভেরিফাইড</span>
                </div>
              </div>

              <button
                onClick={() => setShowQR(false)}
                className="mt-8 w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg active:scale-95 transition-all"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderTransactions = () => (
    <div className="bg-surface text-on-surface font-body leading-relaxed antialiased min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md flex items-center px-6 py-4 w-full max-w-md mx-auto left-0 right-0 border-b border-[#bec9c2]/15">
        <button
          onClick={() => setScreen("dashboard")}
          className="p-2 rounded-full hover:bg-[#eeeeee] text-[#00503a] mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[#00503a] font-bold text-xl tracking-tight">
          লেনদেনের ইতিহাস
        </h1>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto space-y-6">
        <div className="bg-primary-fixed/20 p-6 rounded-2xl flex items-center justify-between border border-primary/10">
          <div>
            <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-1">
              মোট খরচ (এই মাস)
            </p>
            <p className="text-2xl font-bold text-primary">৫,৬৭০.০০ টাকা</p>
          </div>
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="space-y-4">
          {(dashboardData?.recentTransactions || []).map(
            (item: any, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedTransaction(item)}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm transition-all active:scale-98 cursor-pointer hover:border-primary/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-fixed/20 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Fuel size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-on-surface font-bold text-lg leading-tight">
                      {item.company}
                    </p>
                    <p className="text-secondary text-xs mt-1">
                      {item.date} • {item.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-bold text-lg">
                      {item.price}
                    </p>
                    <span className="text-[10px] bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full font-bold">
                      সফল
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                  <div>
                    <p className="text-secondary text-[10px] uppercase font-bold tracking-widest mb-1">
                      পরিমাণ
                    </p>
                    <p className="text-sm font-semibold">{item.amount}</p>
                  </div>
                  <div>
                    <p className="text-secondary text-[10px] uppercase font-bold tracking-widest mb-1">
                      পেমেন্ট পদ্ধতি
                    </p>
                    <p className="text-sm font-semibold">{item.method}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-secondary text-[10px] uppercase font-bold tracking-widest mb-1">
                      অবস্থান
                    </p>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <MapPin size={14} className="text-primary" />
                      {item.location}
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#f9f9f9] border-t border-[#bec9c2]/15 shadow-[0_-4px_16px_rgba(0,33,22,0.04)] max-w-md mx-auto left-0 right-0">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 w-full">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <CheckCircle2 size={24} />
            <span className="text-[12px] font-medium leading-tight">হোম</span>
          </button>
          <button
            onClick={() => setScreen("transactions")}
            className="flex flex-col items-center justify-center text-[#00503a] font-bold after:content-[''] after:w-1 after:h-1 after:bg-[#00503a] after:rounded-full after:mt-1 transition-transform duration-200 scale-110"
          >
            <History size={24} />
            <span className="text-[12px] font-medium leading-tight">
              লেনদেন
            </span>
          </button>
          <button
            onClick={() => setScreen("map")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <MapPin size={24} />
            <span className="text-[12px] font-medium leading-tight">
              পাম্প ম্যাপ
            </span>
          </button>
          <button
            onClick={() => setScreen("profile")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <User size={24} />
            <span className="text-[12px] font-medium leading-tight">
              প্রোফাইল
            </span>
          </button>
        </div>
      </nav>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-surface text-on-surface font-body leading-relaxed antialiased min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md flex items-center px-6 py-4 w-full max-w-md mx-auto left-0 right-0 border-b border-[#bec9c2]/15">
        <button
          onClick={() => setScreen("dashboard")}
          className="p-2 rounded-full hover:bg-[#eeeeee] text-[#00503a] mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[#00503a] font-bold text-xl tracking-tight">
          প্রোফাইল
        </h1>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto space-y-6">
        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] text-center shadow-sm border border-outline-variant/10">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-primary-fixed/30 rounded-full flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-md">
              {fullName?.charAt(0) || "U"}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white">
              <ShieldCheck size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-on-surface">{fullName}</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mt-2 border border-primary/20">
            <ShieldCheck size={14} />
            ভেরিফাইড ইউজার
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 px-1">
              ব্যক্তিগত তথ্য
            </h3>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
              <div className="p-4 flex items-center gap-4 border-b border-outline-variant/5">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-secondary">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">
                    নাম
                  </p>
                  <p className="text-sm font-semibold">{fullName}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 border-b border-outline-variant/5">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-secondary">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">
                    মোবাইল নম্বর
                  </p>
                  <p className="text-sm font-semibold">{mobileNumber}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-secondary">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">
                    ইমেইল
                  </p>
                  <p className="text-sm font-semibold">
                    {email || "দেওয়া হয়নি"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 px-1">
              গাড়ির তথ্য
            </h3>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
              <div className="p-4 flex items-center gap-4 border-b border-outline-variant/5">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-secondary">
                  <Car size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">
                    গাড়ির ধরন ও মডেল
                  </p>
                  <p className="text-sm font-semibold">
                    {vehicleType === "bike"
                      ? "মোটরসাইকেল"
                      : vehicleType === "car"
                        ? "কার (ব্যক্তিগত)"
                        : "ট্রাক"}{" "}
                    - {regModel}
                  </p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-secondary">
                  <Hash size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">
                    নম্বর প্লেট
                  </p>
                  <p className="text-sm font-semibold">
                    {regDistrict}-{regSeries} {regNumber}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 px-1">
              সংযুক্ত নথিপত্র
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden relative group">
                {capturedImages.car ? (
                  <img
                    src={capturedImages.car}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-secondary/40">
                    <Car size={24} />
                    <span className="text-[8px] mt-1 font-bold">গাড়ির ছবি</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    দেখুন
                  </span>
                </div>
              </div>
              <div className="aspect-square bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden relative group">
                {capturedImages.plate ? (
                  <img
                    src={capturedImages.plate}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-secondary/40">
                    <Hash size={24} />
                    <span className="text-[8px] mt-1 font-bold">
                      নম্বর প্লেট
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    দেখুন
                  </span>
                </div>
              </div>
              <div className="aspect-square bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden relative group">
                {capturedImages.bluebook ? (
                  <img
                    src={capturedImages.bluebook}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-secondary/40">
                    <BookOpen size={24} />
                    <span className="text-[8px] mt-1 font-bold">ব্লু-বুক</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    দেখুন
                  </span>
                </div>
              </div>
            </div>
          </section>

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-surface-container-high text-destructive font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LogOut size={20} />
            লগ আউট করুন
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#f9f9f9] border-t border-[#bec9c2]/15 shadow-[0_-4px_16px_rgba(0,33,22,0.04)] max-w-md mx-auto left-0 right-0">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 w-full">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <CheckCircle2 size={24} />
            <span className="text-[12px] font-medium leading-tight">হোম</span>
          </button>
          <button
            onClick={() => setScreen("transactions")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <History size={24} />
            <span className="text-[12px] font-medium leading-tight">
              লেনদেন
            </span>
          </button>
          <button
            onClick={() => setScreen("map")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <MapPin size={24} />
            <span className="text-[12px] font-medium leading-tight">
              পাম্প ম্যাপ
            </span>
          </button>
          <button
            onClick={() => setScreen("profile")}
            className="flex flex-col items-center justify-center text-[#00503a] font-bold after:content-[''] after:w-1 after:h-1 after:bg-[#00503a] after:rounded-full after:mt-1 transition-transform duration-200 scale-110"
          >
            <User size={24} />
            <span className="text-[12px] font-medium leading-tight">
              প্রোফাইল
            </span>
          </button>
        </div>
      </nav>
    </div>
  );

  const renderOperatorDashboard = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pb-32">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 h-16 bg-white/90 backdrop-blur-md z-50 border-b border-outline-variant/15">
        <div className="flex items-center gap-4">
          <button className="p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors">
            <Plus className="text-primary rotate-45" size={24} />
          </button>
          <h1 className="text-lg font-bold text-primary tracking-tight">
            অপারেটর ড্যাশবোর্ড
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen("profile")}
            className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden border-2 border-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <img
              alt="Operator Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzkU12np7ikmCIa0pawT7zWUi_7ZTIMgY477OGF1TOjcdzoKF-DjThZetMzWk5n0kmUWYndq_SBiN9GPYycv1wYDguk860mJxnx6jHw0Iu2al-LsTWdd0QIJS4NHAKbrHGi4xFxGquWkLTsALc40V-ZcgpF5WANrCV-yj1vu0KqViNkdW0zrhHqaqE2NT1c-x0VIdguqTN9jxpxVtSDf8ENZchGgJJtqP82EmSBwUYS5eV0KCVP8r87mzLESpwzX-n_mw7MS-sLv3o"
            />
          </button>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-5xl mx-auto space-y-6 flex-grow">
        {/* QR Scanner Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 aspect-square max-w-sm mx-auto md:aspect-video md:max-w-none shadow-2xl border-4 border-surface-container-lowest group cursor-pointer">
          {/* Simulated Camera Feed Background */}
          <div className="absolute inset-0 bg-[#0a0a0a]">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #9ef4d0 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode size={120} className="text-primary/5" />
            </div>
          </div>

          {/* Scanning Overlay UI */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-primary-fixed/30 rounded-3xl relative">
              <div className="absolute -top-1.5 -left-1.5 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
              <div className="absolute -top-1.5 -right-1.5 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
              <div className="absolute -bottom-1.5 -left-1.5 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>

              {/* Scan Line Animation */}
              <motion.div
                animate={{ top: ["5%", "95%", "5%"] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-4 right-4 h-1 bg-primary/80 shadow-[0_0_20px_#9ef4d0] z-20 rounded-full"
              ></motion.div>

              {/* QR Corner Markers */}
              <div className="absolute top-6 left-6 w-14 h-14 border-[6px] border-primary/20 rounded-xl"></div>
              <div className="absolute top-6 right-6 w-14 h-14 border-[6px] border-primary/20 rounded-xl"></div>
              <div className="absolute bottom-6 left-6 w-14 h-14 border-[6px] border-primary/20 rounded-xl"></div>
            </div>
          </div>

          {/* Status Overlay */}
          <div className="absolute bottom-0 left-0 w-full bg-primary/90 backdrop-blur-xl py-5 px-8 flex items-center justify-center gap-4">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 bg-primary-fixed rounded-full animate-pulse"></span>
              <span className="w-3 h-3 bg-primary-fixed/40 rounded-full animate-pulse [animation-delay:200ms]"></span>
              <span className="w-3 h-3 bg-primary-fixed/10 rounded-full animate-pulse [animation-delay:400ms]"></span>
            </div>
            <p className="text-white text-lg font-black tracking-wider uppercase">
              গ্রাহকের কিউআর কোড স্ক্যান করুন
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Inventory & Summary */}
          <section className="md:col-span-2 space-y-6">
            {/* Inventory Section */}
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold text-primary mb-8 flex items-center gap-3">
                <Fuel className="text-primary" size={24} />
                পাম্প ইনভেন্টরি
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                {/* Octane Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        className="text-surface-container-high"
                        cx="72"
                        cy="72"
                        fill="transparent"
                        r="64"
                        stroke="currentColor"
                        strokeWidth="12"
                      ></circle>
                      <circle
                        className="text-primary"
                        cx="72"
                        cy="72"
                        fill="transparent"
                        r="64"
                        stroke="currentColor"
                        strokeDasharray="402"
                        strokeDashoffset="100.5"
                        strokeWidth="12"
                        strokeLinecap="round"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-on-surface">
                        ৭৫%
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-5 font-bold text-secondary tracking-wide uppercase text-xs">
                    অকটেন স্টক
                  </h3>
                  <p className="text-sm font-bold text-on-surface mt-1">
                    ১৫,০০০ / ২০,০০০ লিটার
                  </p>
                </div>
                {/* Diesel Gauge (Alert) */}
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        className="text-surface-container-high"
                        cx="72"
                        cy="72"
                        fill="transparent"
                        r="64"
                        stroke="currentColor"
                        strokeWidth="12"
                      ></circle>
                      <circle
                        className="text-error"
                        cx="72"
                        cy="72"
                        fill="transparent"
                        r="64"
                        stroke="currentColor"
                        strokeDasharray="402"
                        strokeDashoffset="361.8"
                        strokeWidth="12"
                        strokeLinecap="round"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-error">
                        ১০%
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-5 font-bold text-error tracking-wide uppercase text-xs">
                    ডিজেল স্টক
                  </h3>
                  <p className="text-sm font-bold text-error mt-1">
                    ২,০০০ / ২০,০০০ লিটার
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Summary Section */}
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold text-primary mb-8">
                শিফট সামারি
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-surface-container-low rounded-2xl flex items-center gap-5 border border-outline-variant/5">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                    <Car size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                      মোট ট্রানজ্যাকশন
                    </p>
                    <p className="text-xl font-black text-on-surface">
                      ১২৪ টি গাড়ি
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-surface-container-low rounded-2xl flex items-center gap-5 border border-outline-variant/5">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                    <Fuel size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                      মোট তেল বিক্রয়
                    </p>
                    <p className="text-xl font-black text-on-surface">
                      ৮৫০.৫ লিটার
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-surface-container-low rounded-2xl flex items-center gap-5 border border-outline-variant/5">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                      মোট ক্যাশ কালেকশন
                    </p>
                    <p className="text-xl font-black text-on-surface">
                      ১,১৫,৫০০ টাকা
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-error/5 rounded-2xl flex items-center gap-5 border border-error/10">
                  <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center text-error">
                    <Info size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-error font-bold uppercase tracking-widest">
                      জালিয়াতি এলার্ট
                    </p>
                    <p className="text-xl font-black text-error text-balance">
                      ০২ টি Mismatch
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Verification Overlay */}
          <aside className="space-y-6">
            <div className="bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border-t-8 border-primary relative group">
              <div className="p-6 bg-primary text-on-primary flex justify-between items-center">
                <h3 className="font-bold text-lg">ভেরিফিকেশন চেক</h3>
                <BadgeCheck size={24} className="text-primary-fixed-dim" />
              </div>
              <div className="p-8 space-y-6">
                <div className="aspect-square bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                  <img
                    alt="Scanned Vehicle"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3rWzUtcyiJnNvsbf8BxqiS5Ds9DcNrpJElIW8Svp4p6Go961CT_FtiasbmObnaM1q3GgS6IbXJtr4Ro5Q08IIxK0k0F1XpSqByQgaNN5m_rkXl1tazAQeI7akqMnh4hQB6U9YdjDd8sHTKwC6OKFESuYx2ZTVhhv-RHljdBZb713YUB6GuGftyxhFJr-THG5NG85dbkc_POcoJj6AtKtWgKHTENq0mAlo9DviKoheYpoBMzplZF3ll22h6Kanoxnw4FGQ9jADvdB3"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1 border-b border-outline-variant/10">
                    <span className="text-secondary text-xs font-bold uppercase tracking-tighter">
                      গাড়ির প্রোফাইল
                    </span>
                    <span className="text-primary font-black text-sm">
                      আসল রেকর্ড
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm font-medium">
                      মডেল
                    </span>
                    <span className="text-on-surface font-black">
                      Toyota Premio
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm font-medium">
                      রঙ
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                      <span className="text-on-surface font-black">সিলভার</span>
                    </div>
                  </div>
                </div>
                <button className="w-full fuel-gradient text-on-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all">
                  <CheckCircle2 size={24} />
                  নিশ্চিত করুন
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
              <h4 className="text-primary font-bold text-sm mb-4">
                কুইক অ্যাকশন
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm active:scale-95 transition-all">
                  <Camera className="text-primary" size={24} />
                  <span className="text-[10px] font-bold text-secondary uppercase">
                    ম্যানুয়াল স্ক্যান
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm active:scale-95 transition-all">
                  <Settings className="text-primary" size={24} />
                  <span className="text-[10px] font-bold text-secondary uppercase">
                    পাম্প সেটিংস
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-28 right-6 bg-primary text-on-primary py-4 px-8 rounded-full shadow-[0_20px_40px_rgba(0,80,58,0.3)] flex items-center gap-4 active:scale-95 transition-all z-40 border border-white/20 group">
        <div className="bg-white/20 p-2 rounded-full group-hover:rotate-12 transition-transform">
          <Fuel size={24} />
        </div>
        <span className="font-black text-lg tracking-tight">
          তেল প্রদান ইনপুট
        </span>
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-10 bg-white/95 backdrop-blur-md h-24 border-t border-outline-variant/10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] font-body">
        <button
          onClick={() => setScreen("dashboard")}
          className="flex flex-col items-center justify-center text-primary pt-2 pb-1 relative group"
        >
          <CheckCircle2 size={28} />
          <span className="text-[10px] font-black mt-1">ড্যাবোর্ড</span>
          <div className="absolute -top-1 w-8 h-1 bg-primary rounded-full"></div>
        </button>
        <button
          onClick={() => setScreen("transactions")}
          className="flex flex-col items-center justify-center text-secondary pt-2 pb-1 hover:text-primary transition-all"
        >
          <History size={28} />
          <span className="text-[10px] font-bold mt-1">লেনদেন</span>
        </button>
        <button className="flex flex-col items-center justify-center text-secondary pt-2 pb-1 hover:text-primary transition-all">
          <MapPin size={28} />
          <span className="text-[10px] font-bold mt-1">পাম্প</span>
        </button>
        <button
          onClick={() => setScreen("profile")}
          className="flex flex-col items-center justify-center text-secondary pt-2 pb-1 hover:text-primary transition-all"
        >
          <Settings size={28} />
          <span className="text-[10px] font-bold mt-1">সেটিংস</span>
        </button>
      </nav>
    </div>
  );

  const renderNotifications = () => (
    <div className="bg-surface text-on-surface font-body leading-relaxed antialiased min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md flex items-center px-6 py-4 w-full max-w-md mx-auto left-0 right-0 border-b border-[#bec9c2]/15">
        <button
          onClick={() => setScreen("dashboard")}
          className="p-2 rounded-full hover:bg-[#eeeeee] text-[#00503a] mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[#00503a] font-bold text-xl tracking-tight">
          নোটিফিকেশন
        </h1>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-md mx-auto space-y-4">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  setNotifications((prev) =>
                    prev.map((n) =>
                      n.id === notif.id ? { ...n, unread: false } : n,
                    ),
                  );
                }}
                className={`p-5 rounded-2xl border transition-all active:scale-[0.98] ${notif.unread ? "bg-primary-fixed/10 border-primary/20" : "bg-surface-container-lowest border-outline-variant/10"}`}
              >
                <div className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === "success"
                        ? "bg-green-100 text-green-600"
                        : notif.type === "payment"
                          ? "bg-blue-100 text-blue-600"
                          : notif.type === "security"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-primary-fixed/30 text-primary"
                    }`}
                  >
                    {notif.type === "success" ? (
                      <Fuel size={24} />
                    ) : notif.type === "payment" ? (
                      <CreditCard size={24} />
                    ) : notif.type === "security" ? (
                      <ShieldCheck size={24} />
                    ) : (
                      <Bell size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={`font-bold text-base ${notif.unread ? "text-primary" : "text-on-surface"}`}
                      >
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-secondary font-medium whitespace-nowrap ml-2">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-sm text-secondary leading-snug">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-secondary/30 mb-4">
              <Bell size={40} />
            </div>
            <h3 className="text-lg font-bold text-secondary">
              কোন নোটিফিকেশন নেই
            </h3>
            <p className="text-sm text-secondary/60">
              আপনার সব নোটিফিকেশন এখানে দেখা যাবে
            </p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#f9f9f9] border-t border-[#bec9c2]/15 shadow-[0_-4px_16px_rgba(0,33,22,0.04)] max-w-md mx-auto left-0 right-0">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 w-full">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <CheckCircle2 size={24} />
            <span className="text-[12px] font-medium leading-tight">হোম</span>
          </button>
          <button
            onClick={() => setScreen("transactions")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <History size={24} />
            <span className="text-[12px] font-medium leading-tight">
              লেনদেন
            </span>
          </button>
          <button
            onClick={() => setScreen("map")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <MapPin size={24} />
            <span className="text-[12px] font-medium leading-tight">
              পাম্প ম্যাপ
            </span>
          </button>
          <button
            onClick={() => setScreen("profile")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <User size={24} />
            <span className="text-[12px] font-medium leading-tight">
              প্রোফাইল
            </span>
          </button>
        </div>
      </nav>
    </div>
  );

  const renderMap = () => (
    <div className="bg-surface text-on-surface font-body leading-relaxed antialiased min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9]/80 backdrop-blur-md flex items-center px-6 py-4 w-full max-w-md mx-auto left-0 right-0 border-b border-[#bec9c2]/15">
        <button
          onClick={() => setScreen("dashboard")}
          className="p-2 rounded-full hover:bg-[#eeeeee] text-[#00503a] mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[#00503a] font-bold text-xl tracking-tight">
          নিকটস্থ পাম্প
        </h1>
      </header>

      <main className="flex-1 relative pt-16 pb-24 overflow-hidden">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-[#e5e7eb] overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(#00503a 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>

          {/* Simulated Roads */}
          <div className="absolute top-1/4 left-0 w-full h-8 bg-white/50 -rotate-12"></div>
          <div className="absolute top-0 left-1/3 w-8 h-full bg-white/50 rotate-6"></div>
          <div className="absolute bottom-1/4 left-0 w-full h-12 bg-white/50 rotate-3"></div>

          {/* Pump Markers */}
          {pumps.map((pump) => (
            <button
              key={pump.id}
              onClick={() => setSelectedPump(pump)}
              className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 active:scale-90 ${selectedPump?.id === pump.id ? "z-30 scale-125" : "z-20"}`}
              style={{ top: `${pump.lat}%`, left: `${pump.lng}%` }}
            >
              <div className={`relative flex flex-col items-center`}>
                <div
                  className={`p-2 rounded-full shadow-lg border-2 border-white ${pump.status === "বন্ধ" ? "bg-red-500" : pump.status === "ভিড় বেশি" ? "bg-orange-500" : "bg-primary"}`}
                >
                  <Fuel size={20} className="text-white" />
                </div>
                <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-outline-variant/20">
                  <span className="text-[10px] font-bold whitespace-nowrap">
                    {pump.distance}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {/* Current Location Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-xl animate-pulse"></div>
          </div>
        </div>

        {/* Pump Details Card */}
        <AnimatePresence>
          {selectedPump && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-5 right-5 z-40"
            >
              <div className="bg-surface-container-lowest p-5 rounded-[2rem] shadow-2xl border border-outline-variant/15">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary">
                      {selectedPump.name}
                    </h3>
                    <p className="text-xs text-secondary flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedPump.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPump(null)}
                    className="p-1.5 bg-surface-container rounded-full text-secondary"
                  >
                    <ArrowLeft size={16} className="rotate-90" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div
                    className={`p-2 rounded-xl border flex flex-col items-center ${selectedPump.octane === "আছে" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
                  >
                    <span className="text-[10px] font-bold text-secondary uppercase">
                      অকটেন
                    </span>
                    <span
                      className={`text-xs font-bold ${selectedPump.octane === "আছে" ? "text-green-700" : "text-red-700"}`}
                    >
                      {selectedPump.octane}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-xl border flex flex-col items-center ${selectedPump.diesel === "আছে" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
                  >
                    <span className="text-[10px] font-bold text-secondary uppercase">
                      ডিজেল
                    </span>
                    <span
                      className={`text-xs font-bold ${selectedPump.diesel === "আছে" ? "text-green-700" : "text-red-700"}`}
                    >
                      {selectedPump.diesel}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-xl border flex flex-col items-center ${selectedPump.petrol === "আছে" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
                  >
                    <span className="text-[10px] font-bold text-secondary uppercase">
                      পেট্রোল
                    </span>
                    <span
                      className={`text-xs font-bold ${selectedPump.petrol === "আছে" ? "text-green-700" : "text-red-700"}`}
                    >
                      {selectedPump.petrol}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <MapPin size={18} />
                    ডিরেকশন
                  </button>
                  <button className="px-4 py-3 bg-surface-container-high text-primary rounded-xl font-bold text-sm active:scale-95 transition-all">
                    কল করুন
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#f9f9f9] border-t border-[#bec9c2]/15 shadow-[0_-4px_16px_rgba(0,33,22,0.04)] max-w-md mx-auto left-0 right-0">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 w-full">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <CheckCircle2 size={24} />
            <span className="text-[12px] font-medium leading-tight">হোম</span>
          </button>
          <button
            onClick={() => setScreen("transactions")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <History size={24} />
            <span className="text-[12px] font-medium leading-tight">
              লেনদেন
            </span>
          </button>
          <button
            onClick={() => setScreen("map")}
            className="flex flex-col items-center justify-center text-[#00503a] font-bold after:content-[''] after:w-1 after:h-1 after:bg-[#00503a] after:rounded-full after:mt-1 transition-transform duration-200 scale-110"
          >
            <MapPin size={24} />
            <span className="text-[12px] font-medium leading-tight">
              পাম্প ম্যাপ
            </span>
          </button>
          <button
            onClick={() => setScreen("profile")}
            className="flex flex-col items-center justify-center text-[#50606f] hover:text-[#006a4e] transition-colors"
          >
            <User size={24} />
            <span className="text-[12px] font-medium leading-tight">
              প্রোফাইল
            </span>
          </button>
        </div>
      </nav>
    </div>
  );

  const renderLogin = () => (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9] backdrop-blur-md border-b border-[#bec9c2]/15 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("splash")}
            className="text-[#00503a] active:scale-95 duration-200 p-2 hover:bg-[#eeeeee] rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg text-[#00503a]">লগইন</h1>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-12 px-6 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="text-primary" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-on-surface">
              ফিরে আসায় স্বাগতম
            </h2>
            <p className="text-secondary mt-2">আপনার তথ্য দিয়ে লগইন করুন</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="login-mobile"
                className="text-xs font-bold text-secondary uppercase tracking-widest ml-1"
              >
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <Smartphone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                  size={20}
                />
                <input
                  id="login-mobile"
                  name="mobileNumber"
                  type="tel"
                  autoComplete="tel-national"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="০১৭XXXXXXXX"
                  className="w-full h-14 bg-surface-container-lowest border border-outline-variant/10 rounded-xl pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="text-xs font-bold text-secondary uppercase tracking-widest ml-1"
              >
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <ShieldCheck
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                  size={20}
                />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  className="w-full h-14 bg-surface-container-lowest border border-outline-variant/10 rounded-xl pl-12 pr-12 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="fuel-gradient text-on-primary flex h-14 w-full items-center justify-center rounded-xl text-lg font-bold shadow-lg transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
            >
              {isLoggingIn ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen font-body">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {screen === "splash" && renderSplashScreen()}
          {screen === "login" && renderLogin()}
          {screen === "step1" && renderStep1()}
          {screen === "step2" && renderStep2()}
          {screen === "step3" && renderStep3()}
          {screen === "status" && renderStatus()}
          {screen === "dashboard" &&
            (userRoleActual === "distributor" ? (
              <div className="flex h-screen items-center justify-center p-8 text-center">
                <div>
                  <h1 className="text-2xl font-bold text-primary mb-4">
                    ডিস্ট্রিবিউটর ড্যাশবোর্ড
                  </h1>
                  <p className="text-secondary mb-8">
                    আপনার ড্যাশবোর্ডটি বর্তমানে নির্মাণাধীন রয়েছে। অনুগ্রহ করে
                    পরে চেষ্টা করুন।
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold"
                  >
                    লগ আউট
                  </button>
                </div>
              </div>
            ) : userRoleActual === "operator" ? (
              renderOperatorDashboard()
            ) : (
              renderDashboard()
            ))}
          {screen === "transactions" && renderTransactions()}
          {screen === "profile" && renderProfile()}
          {screen === "notifications" && renderNotifications()}
          {screen === "map" && renderMap()}
        </motion.div>
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-surface w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8"></div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-1">
                    লেনদেনের রিসিট
                  </h2>
                  <p className="text-secondary text-sm">
                    ID: #FP-{Math.floor(100000 + Math.random() * 900000)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 rounded-full bg-surface-container-high text-secondary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 mb-8">
                <div className="flex flex-col items-center mb-6 pb-6 border-b border-outline-variant/10 text-center">
                  <div className="w-16 h-16 bg-primary-fixed/30 rounded-full flex items-center justify-center text-primary mb-3">
                    <Fuel size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    {selectedTransaction.company}
                  </h3>
                  <p className="text-sm text-secondary">
                    {selectedTransaction.location}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm">তারিখ ও সময়</span>
                    <span className="font-bold text-on-surface">
                      {selectedTransaction.date} |{" "}
                      {selectedTransaction.time || "১১:৪৫ AM"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm">তেলের পরিমাণ</span>
                    <span className="font-bold text-on-surface">
                      {selectedTransaction.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary text-sm">
                      পেমেন্ট পদ্ধতি
                    </span>
                    <span className="font-bold text-on-surface">
                      {selectedTransaction.method}
                    </span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                    <span className="text-on-surface font-bold text-lg">
                      মোট বিল
                    </span>
                    <span className="text-primary font-black text-2xl">
                      {selectedTransaction.price || "৪৫০.০০ টাকা"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-8 py-3 bg-green-50 text-green-700 rounded-2xl font-bold text-sm">
                <BadgeCheck size={20} />
                <span>পেমেন্ট সফলভাবে সম্পন্ন হয়েছে</span>
              </div>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                ঠিক আছে
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
