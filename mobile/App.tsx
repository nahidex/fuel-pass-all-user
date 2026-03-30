import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  PanResponder,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { Camera, CameraView, BarcodeScanningResult } from "expo-camera";
import axios from "axios";
// Web-compatible Map using simple View and Markers for simulation
const MapView = (props: any) => (
  <View style={[props.style, { backgroundColor: "#f1f5f9" }]}>
    {/* Grid background to simulate map tiles */}
    <View style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * 40,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "#64748b",
          }}
        />
      ))}
      {Array.from({ length: 40 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: i * 40,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: "#64748b",
          }}
        />
      ))}
    </View>
    {props.children}
  </View>
);
const Marker = (props: any) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={props.onPress}
    style={{
      position: "absolute",
      // Approximate position mapping for simulation
      left: (props.coordinate.longitude - 90.4) * 5000 + 150,
      top: (23.83 - props.coordinate.latitude) * 5000 + 100,
    }}
  >
    {props.children}
  </TouchableOpacity>
);
import {
  Fuel,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Phone,
  LogIn,
  Mail,
  Car,
  Bike,
  Truck,
  Hash,
  Palette,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Camera as CameraIcon,
  FileText,
  Check,
  Info,
  ShieldAlert,
  QrCode,
  Bell,
  ArrowLeft,
  MapPin,
  CreditCard,
  History,
  Map,
  LogOut,
  BadgeCheck,
  Plus,
  X,
  ChevronDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  NotoSerifBengali_400Regular,
  NotoSerifBengali_700Bold,
} from "@expo-google-fonts/noto-serif-bengali";
import { COLORS, GRADIENTS, SPACING, SHADOWS } from "./constants/theme";
import BASE_URL from "./constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";

const { width } = Dimensions.get("window");

type Screen =
  | "splash"
  | "login"
  | "register"
  | "dashboard"
  | "success"
  | "transactions"
  | "profile"
  | "notifications"
  | "verification_result"
  | "transaction_success"
  | "map";

const API_URL = BASE_URL;

const getFullUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
};

// Bengali digit → English digit converter
const bnToEn = (str: string) =>
  str.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

// Fuel price per liter (BDT)
const FUEL_PRICE_MAP: Record<string, number> = {
  octane: 135,
  petrol: 130,
  diesel: 106,
  cng: 43,
};

const FUEL_RATES = [
  { type: "অকটেন", price: "১৩৫.০০", change: "+২.৫০", trend: "up" },
  { type: "পেট্রোল", price: "১৩০.০০", change: "০.০০", trend: "stable" },
  { type: "ডিজেল", price: "১০৬.০০", change: "-১.০০", trend: "down" },
];

const TRANSACTIONS = [
  {
    id: 1,
    type: "অকটেন",
    amount: "৫.০",
    price: "৬৭৫.০০",
    date: "২৪ মার্চ, ২০২৪",
    method: "বিকাশ",
    location: "বিপিসি ফিলিং স্টেশন, ঢাকা",
  },
  {
    id: 2,
    type: "অকটেন",
    amount: "৭.৫",
    price: "১০১২.৫০",
    date: "২০ মার্চ, ২০২৪",
    method: "নগদ",
    location: "ট্রাস্ট ফিলিং স্টেশন",
  },
  {
    id: 3,
    type: "অকটেন",
    amount: "৪.২",
    price: "৫৬৭.০০",
    date: "১৫ মার্চ, ২০২৪",
    method: "কার্ড",
    location: "পদ্মা অয়েল কোম্পানি",
  },
];

const NOTIFICATIONS = [
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
];

export default function App() {
  const [screen, setScreen] = React.useState<Screen>("splash");
  const [userRoleActual, setUserRoleActual] = React.useState<
    "owner" | "operator" | "distributor"
  >("owner");
  const [regStep, setRegStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const [qrToken, setQrToken] = React.useState<string | null>(null);
  const [verificationData, setVerificationData] = React.useState<any>(null);
  const [fuelAmount, setFuelAmount] = React.useState("");
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [transactionResult, setTransactionResult] = React.useState<any>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<"cash" | "other">("cash");

  const [timeLeft, setTimeLeft] = React.useState(60); // 1 minute countdown
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Success Sheet Swipe Logic
  const successSheetY = React.useRef(new Animated.Value(0)).current;

  // PanResponder for swiping down the success sheet
  const successPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          successSheetY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down enough to collapse
          Animated.timing(successSheetY, {
            toValue: 300,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back
          Animated.spring(successSheetY, {
            toValue: 0,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const fetchQRData = async () => {
    try {
      console.log("Starting fetchQRData...");
      // Trying different storage keys used in the app
      let token = await AsyncStorage.getItem("fuelpass_token");
      if (!token) {
        token = await AsyncStorage.getItem("userToken");
      }

      console.log(
        "Token retrieved from storage:",
        token ? "Exists" : "Not Found",
      );

      if (!token) {
        console.error("Token not found in AsyncStorage");
        Alert.alert(
          "Error",
          "লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার লগইন করুন।",
        );
        return;
      }

      console.log("Calling API:", `${API_URL}/api/vehicle-qr`);
      const response = await axios.get(`${API_URL}/api/vehicle-qr`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000, // 5 seconds timeout
      });

      console.log("API Response Success:", response.data.success);
      if (response.data.success) {
        setQrToken(response.data.qrToken);
        setTimeLeft(60); // Reset timer to 60 seconds
      }
    } catch (error: any) {
      console.error("QR Fetch Full Error Details:");
      if (error.response) {
        // Server error response
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      } else if (error.request) {
        // Request made but no response (Network error)
        console.error(
          "Network Error: No response from server. Check if server is running on",
          API_URL,
        );
      } else {
        console.error("General Error:", error.message);
      }
    }
  };

  React.useEffect(() => {
    if (showQR) {
      console.log("Modal opened, calling fetchQRData...");
      fetchQRData();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            console.log("Timer ended, refreshing QR...");
            fetchQRData(); // Refresh if time runs out
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      console.log("Modal closed, clearing timer.");
      if (timerRef.current) clearInterval(timerRef.current);
      setQrToken(null);
      setTimeLeft(60);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showQR]);

  // QR Scanning State
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(
    null,
  );
  const [scanned, setScanned] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);

  // Auth State
  const [mobileNumber, setMobileNumber] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Registration State
  const DISTRICTS = [
    "ঢাকা মেট্রো",
    "চট্টগ্রাম মেট্রো",
    "খুলনা মেট্রো",
    "রাজশাহী মেট্রো",
    "সিলেট মেট্রো",
    "বরিশাল মেট্রো",
    "কুমিল্লা মেট্রো",
    "গাজীপুর মেট্রো",
  ];
  const SERIES = [
    "ক",
    "খ",
    "গ",
    "ঘ",
    "ঙ",
    "চ",
    "ছ",
    "জ",
    "ঝ",
    "ট",
    "ঠ",
    "ড",
    "ঢ",
    "ল",
    "ম",
    "শ",
    "হ",
  ];

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [district, setDistrict] = React.useState("ঢাকা মেট্রো");
  const [series, setSeries] = React.useState("ক");
  const [number, setNumber] = React.useState("");
  const [vehicleType, setVehicleType] = React.useState<
    "bike" | "car" | "truck"
  >("car");
  const [selectedStation, setSelectedStation] = React.useState<any>(null);
  const [pumps, setPumps] = React.useState<any[]>([]);

  // QR Modal Animation Ref
  const qrScale = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showQR) {
      Animated.spring(qrScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      qrScale.setValue(0.9);
    }
  }, [showQR]);

  // Bottom Sheet Swipe Logic
  const sheetY = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          Animated.timing(sheetY, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSelectedStation(null);
            sheetY.setValue(0);
          });
        } else {
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const fetchPumps = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pumps`);
      const data = await response.json();
      if (data.success) {
        setPumps(data.pumps);
      }
    } catch (error) {
      console.error("Error fetching pumps:", error);
    }
  };

  React.useEffect(() => {
    if (screen === "map") {
      fetchPumps();
    }
  }, [screen]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
    if (status !== "granted") {
      Alert.alert(
        "দুঃখিত",
        "কিউআর স্ক্যান করতে ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।",
      );
    } else {
      setIsScanning(true);
      setScanned(false); // Reset scanned state
    }
  };

  const verifyScannedQR = async (token: string) => {
    setLoading(true);
    try {
      console.log("Verifying QR token with API...");
      const response = await axios.post(`${API_URL}/api/verify-qr`, {
        qrToken: token,
      });

      if (response.data.success) {
        const d = response.data.data;
        setVerificationData({
          ...d,
          uuid: d.uuid,
          ownerName: d.ownerName,
          regNumber: d.reg_number,
          vehicleType: d.vehicleType,
          fuelType: d.fuel_type,
          vehiclePhoto: d.vehiclePhoto || null,
          platePhoto: d.platePhoto || null,
          bluebookPhoto: d.bluebookPhoto || null,
          dailyRemaining: d.dailyRemaining,
          dailyLimit: d.dailyLimit,
          monthlyUsage: d.monthlyUsage,
          monthlyLimit: d.monthlyLimit,
        });
        setFuelAmount(""); // Reset fuel amount
        setScreen("verification_result");
      } else {
        Alert.alert("Error", response.data.error || "ভেরিফিকেশন ব্যর্থ হয়েছে।");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      const errorMsg =
        error.response?.data?.error || "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।";
      Alert.alert("ত্রুটি", errorMsg);
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setIsScanning(false); // Close the scanner to show the result screen

    // Verify the scanned token
    verifyScannedQR(data);
  };

  // Image State
  const [carImage, setCarImage] = React.useState<string | null>(null);
  const [plateImage, setPlateImage] = React.useState<string | null>(null);
  const [bluebookImage, setBluebookImage] = React.useState<string | null>(null);

  const pickImage = async (type: "car" | "plate" | "bluebook") => {
    Alert.alert("ছবি নির্বাচন করুন", "আপনি কিভাবে ছবি দিতে চান?", [
      {
        text: "ক্যামেরা দিয়ে তুলুন",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("দুঃখিত", "ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।");
            return;
          }
          let result = await ImagePicker.launchCameraAsync({
            mediaTypes: "images" as any,
            allowsEditing: false,
            quality: 0.7,
          });
          if (!result.canceled) {
            if (type === "car") setCarImage(result.assets[0].uri);
            if (type === "plate") setPlateImage(result.assets[0].uri);
            if (type === "bluebook") setBluebookImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "গ্যালারি থেকে নিন",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("দুঃখিত", "গ্যালারি ব্যবহারের অনুমতি প্রয়োজন।");
            return;
          }
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images" as any,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });
          if (!result.canceled) {
            if (type === "car") setCarImage(result.assets[0].uri);
            if (type === "plate") setPlateImage(result.assets[0].uri);
            if (type === "bluebook") setBluebookImage(result.assets[0].uri);
          }
        },
      },
      { text: "বাতিল", style: "cancel" },
    ]);
  };

  const handleRegister = async () => {
    if (!password || !carImage || !plateImage || !bluebookImage) {
      Alert.alert("ভুল", "পাসওয়ার্ড এবং সব ছবি প্রদান করুন");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/register-vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobileNumber,
          email,
          district: district,
          series: series,
          number: number,
          type: vehicleType,
          model: "Toyota",
          color: "White",
          engineNumber: "123456",
          reg_number: `${district}-${series}-${number}`,
          fuel_type: vehicleType === "bike" ? "petrol" : "octane",
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || data.message || "Registration failed");

      // Now upload images
      const formData = new FormData();

      const appendImage = (uri: string, name: string) => {
        if (!uri) return;
        const uriParts = uri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        const fileName = uri.split("/").pop();
        formData.append(name, {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: fileName || `${name}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      };

      appendImage(carImage, "car");
      appendImage(plateImage, "plate");
      appendImage(bluebookImage, "bluebook");

      const uploadResponse = await fetch(
        `${API_URL}/api/upload-vehicle-images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.token}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );

      const uploadData = await uploadResponse.json();
      if (uploadResponse.ok && uploadData.success) {
        setScreen("success");
      } else {
        Alert.alert(
          "আংশিক সফল",
          "রেজিস্ট্রেশন হয়েছে কিন্তু ছবি আপলোড ব্যর্থ হয়েছে।",
        );
      }
    } catch (err: any) {
      Alert.alert("ত্রুটি", err.message || "সার্ভারের সাথে সংযোগ বিচ্ছিন্ন");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!mobileNumber || !password) {
      Alert.alert("Error", "মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন।");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, password }),
      });

      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem("fuelpass_token", data.token);
        // Store user data in state
        if (data.user) {
          setFullName(data.user.fullName || "");
          setEmail(data.user.email || "");
          setVehicleType(data.user.type || "car");
          setDistrict(data.user.district || "ঢাকা মেট্রো");
          setSeries(data.user.series || "ক");
          setNumber(data.user.regNumber || "");
          setCarImage(data.user.carImageUrl || null);
          setPlateImage(data.user.plateImageUrl || null);
          setBluebookImage(data.user.bluebookImageUrl || null);
          setUserRoleActual(data.user.role || "owner");
        }
        setScreen("dashboard");
      } else {
        Alert.alert("Error", "সঠিক তথ্য দিন।");
      }
    } catch (error) {
      Alert.alert("Error", "সার্ভার এরর।");
    } finally {
      setLoading(false);
    }
  };

  const renderVerificationResult = () => (
    <SafeAreaView style={styles.operatorContainer}>
      <StatusBar style="dark" />
      <View style={styles.operatorHeader}>
        <View style={styles.opHeaderLeft}>
          <TouchableOpacity
            onPress={() => {
              setIsScanning(false);
              setScreen("dashboard");
            }}
            style={styles.opHeaderBtn}
          >
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.opHeaderText}>ভেরিফিকেশন রেজাল্ট</Text>
        </View>
        <View style={styles.opAvatarBtn}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzkU12np7ikmCIa0pawT7zWUi_7ZTIMgY477OGF1TOjcdzoKF-DjThZetMzWk5n0kmUWYndq_SBiN9GPYycv1wYDguk860mJxnx6jHw0Iu2al-LsTWdd0QIJS4NHAKbrHGi4xFxGquWkLTsALc40V-ZcgpF5WANrCV-yj1vu0KqViNkdW0zrhHqaqE2NT1c-x0VIdguqTN9jxpxVtSDf8ENZchGgJJtqP82EmSBwUYS5eV0KCVP8r87mzLESpwzX-n_mw7MS-sLv3o",
            }}
            style={styles.opAvatarImg}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.opMainScroll, { gap: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Registration Photos */}
        <Text style={{ fontSize: 16, fontFamily: "NotoSerifBengali_700Bold", color: "#1e293b", paddingHorizontal: 4 }}>
          রেজিস্ট্রেশন ছবি
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { uri: verificationData?.vehiclePhoto, label: "গাড়ি" },
            { uri: verificationData?.platePhoto, label: "নম্বর প্লেট" },
            { uri: verificationData?.bluebookPhoto, label: "ব্লুবুক" },
          ].map((item, idx) => (
            <View key={idx} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View style={{ width: "100%", height: 100, borderRadius: 14, overflow: "hidden", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" }}>
                {item.uri ? (
                  <Image
                    source={{ uri: getFullUrl(item.uri) }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <FileText size={28} color="#94a3b8" />
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 11, fontFamily: "NotoSerifBengali_400Regular", color: "#64748b" }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Success Banner */}
        {/* Success Banner */}
        <View
          style={{
            backgroundColor: "#065f46",
            paddingVertical: 15,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 color="#fff" size={24} />
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontFamily: "NotoSerifBengali_700Bold",
            }}
          >
            সঠিক গাড়ি শনাক্ত হয়েছে
          </Text>
        </View>

        {/* Owner Info Card */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#f1f5f9",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "NotoSerifBengali_700Bold",
                  color: "#1e293b",
                }}
              >
                {verificationData?.ownerName}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "NotoSerifBengali_400Regular",
                  color: "#64748b",
                  marginTop: 4,
                }}
              >
                {verificationData?.vehicleType} ট্র্যান্সপোর্টার
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#ecfdf5",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#059669",
                  fontFamily: "NotoSerifBengali_700Bold",
                  fontSize: 13,
                }}
              >
                এক্টিভ পাস
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 1.5,
              backgroundColor: "#f1f5f9",
              marginBottom: 20,
            }}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "NotoSerifBengali_400Regular",
                  color: "#64748b",
                }}
              >
                আজকের অবশিষ্ট
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "NotoSerifBengali_700Bold",
                  color: "#065f46",
                  marginTop: 6,
                }}
              >
                {verificationData?.dailyRemaining} /{" "}
                {verificationData?.dailyLimit} লিটার
              </Text>
              <View
                style={{
                  height: 8,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 4,
                  marginTop: 10,
                }}
              >
                <View
                  style={{
                    width: `${(verificationData?.dailyRemaining / verificationData?.dailyLimit) * 100}%`,
                    height: "100%",
                    backgroundColor: "#065f46",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
            <View style={{ width: 20 }} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "NotoSerifBengali_400Regular",
                  color: "#64748b",
                }}
              >
                মাসিক মোট ব্যবহৃত
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "NotoSerifBengali_700Bold",
                  color: "#1e293b",
                  marginTop: 6,
                }}
              >
                {verificationData?.monthlyUsage} /{" "}
                {verificationData?.monthlyLimit} লিটার
              </Text>
              <View
                style={{
                  height: 8,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 4,
                  marginTop: 10,
                }}
              >
                <View
                  style={{
                    width: `${(verificationData?.monthlyUsage / verificationData?.monthlyLimit) * 100}%`,
                    height: "100%",
                    backgroundColor: "#cbd5e1",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Input Section */}
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "NotoSerifBengali_400Regular",
              color: "#64748b",
            }}
          >
            তেল প্রদানের পরিমাণ (লিটার)
          </Text>
          <View
            style={{
              width: 180,
              alignItems: "center",
              borderBottomWidth: 3,
              borderBottomColor: "#1e293b",
              paddingVertical: 10,
              marginTop: 5,
            }}
          >
            <Text
              style={{
                fontSize: 44,
                fontFamily: "NotoSerifBengali_700Bold",
                color: "#065f46",
              }}
            >
              {fuelAmount || "০০.০০"}
            </Text>
          </View>
        </View>

        {/* Keypad */}
        <View style={{ gap: 10 }}>
          {[
            ["১", "২", "৩"],
            ["৪", "৫", "৬"],
            ["৭", "৮", "৯"],
            [".", "০", "del"],
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10 }}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "del") {
                      setFuelAmount((prev) => prev.slice(0, -1));
                    } else if (fuelAmount.length < 5) {
                      setFuelAmount((prev) => prev + key);
                    }
                  }}
                  style={{
                    flex: 1,
                    height: 60,
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 5,
                    elevation: 1,
                  }}
                >
                  {key === "del" ? (
                    <X size={24} color="#1e293b" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 24,
                        fontFamily: "NotoSerifBengali_700Bold",
                        color: "#1e293b",
                      }}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={{ marginTop: 10 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "NotoSerifBengali_400Regular",
              color: "#64748b",
              marginBottom: 12,
            }}
          >
            পেমেন্ট মেথড
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setSelectedPayment("cash")}
              style={{
                flex: 1,
                height: 50,
                backgroundColor: selectedPayment === "cash" ? "#065f46" : "#fff",
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: selectedPayment === "cash" ? "#065f46" : "#f1f5f9",
              }}
            >
              <Text
                style={{ fontFamily: "NotoSerifBengali_700Bold", fontSize: 16, color: selectedPayment === "cash" ? "#fff" : "#1e293b" }}
              >
                নগদ (Cash)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPayment("other")}
              style={{
                flex: 1,
                height: 50,
                backgroundColor: selectedPayment === "other" ? "#065f46" : "#f1f5f9",
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: selectedPayment === "other" ? "#065f46" : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: "NotoSerifBengali_400Regular",
                  fontSize: 16,
                  color: selectedPayment === "other" ? "#fff" : "#1e293b",
                }}
              >
                অন্যান্য
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={async () => {
            setIsFinalizing(true);
            try {
              const token = await AsyncStorage.getItem("fuelpass_token");
              const liters = parseFloat(bnToEn(fuelAmount || "0"));
              const resp = await axios.post(
                `${API_URL}/api/record-transaction`,
                {
                  vehicleUuid: verificationData?.uuid,
                  amountLiters: liters,
                  fuelType: verificationData?.fuelType || "octane",
                  paymentMethod: selectedPayment,
                },
                { headers: { Authorization: `Bearer ${token}` } },
              );
              if (resp.data.success) {
                setTransactionResult(resp.data.transaction);
                setScreen("transaction_success");
              } else {
                Alert.alert("ত্রুটি", resp.data.error || "ট্রানজেকশন সংরক্ষণ ব্যর্থ");
              }
            } catch (e: any) {
              Alert.alert("ত্রুটি", e?.response?.data?.error || "সার্ভারের সাথে যোগাযোগ বিচ্ছিন্ন");
            } finally {
              setIsFinalizing(false);
            }
          }}
          disabled={!fuelAmount || isFinalizing}
          style={{
            height: 65,
            backgroundColor: "#065f46",
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
            opacity: fuelAmount ? 1 : 0.6,
          }}
        >
          {isFinalizing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontFamily: "NotoSerifBengali_700Bold",
              }}
            >
              তেল প্রদান সম্পন্ন করুন
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderTransactionSuccess = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          padding: 30,
          paddingTop: 60,
        }}
      >
        {/* Success Animation Area */}
        <View style={{ alignItems: "center", marginBottom: 30, marginTop: 20 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#d1fae5",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 10,
              borderColor: "#ecfdf5",
            }}
          >
            <Check color="#059669" size={48} strokeWidth={3} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontFamily: "NotoSerifBengali_700Bold",
              color: "#1e293b",
              textAlign: "center",
            }}
          >
            অভিনন্দন!
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontFamily: "NotoSerifBengali_700Bold",
              color: "#059669",
              textAlign: "center",
              marginTop: 5,
            }}
          >
            পেমেন্ট সফল হয়েছে
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#94a3b8",
              fontFamily: "NotoSerifBengali_400Regular",
              marginTop: 8,
            }}
          >
            ট্রানজ্যাকশন আইডি: #{transactionResult?.id || "FP------"}
          </Text>
        </View>

        {/* Receipt Card */}
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1.5,
            borderColor: "#f1f5f9",
            borderStyle: "dashed",
            width: "100%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "NotoSerifBengali_700Bold",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                যানবাহন নম্বর
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "NotoSerifBengali_700Bold",
                  color: "#1e293b",
                  marginTop: 4,
                }}
              >
                {verificationData?.regNumber || "ঢাকা মেট্রো-ল ১২-৩৪"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "NotoSerifBengali_700Bold",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                ফুয়েল টাইপ
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "NotoSerifBengali_700Bold",
                  color: "#1e293b",
                  marginTop: 4,
                }}
              >
                {(() => {
                  const fm: {[k:string]:string} = {octane:"অকটেন",petrol:"পেট্রোল",diesel:"ডিজেল",cng:"সিএনজি"};
                  return verificationData?.fuelType ? (fm[verificationData.fuelType.toLowerCase()] ?? verificationData.fuelType) : "অকটেন";
                })()} 
              </Text>
            </View>
          </View>

          <View
            style={{ height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: "#64748b",
                fontFamily: "NotoSerifBengali_700Bold",
              }}
            >
              পরিমাণ
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "NotoSerifBengali_700Bold",
                color: "#1e293b",
              }}
            >
              {fuelAmount} লিটার
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: "#64748b",
                fontFamily: "NotoSerifBengali_700Bold",
              }}
            >
              লিটার প্রতি মূল্য
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "NotoSerifBengali_700Bold",
                color: "#1e293b",
              }}
            >
              ৳{(FUEL_PRICE_MAP[(verificationData?.fuelType || "").toLowerCase()] ?? 135).toLocaleString("bn-BD")}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: "#64748b",
                fontFamily: "NotoSerifBengali_700Bold",
              }}
            >
              মোট বিল
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontFamily: "NotoSerifBengali_700Bold",
                color: "#059669",
              }}
            >
              ৳{transactionResult
                ? transactionResult.totalPrice.toLocaleString("bn-BD", { maximumFractionDigits: 2 })
                : (() => {
                    const liters = parseFloat(bnToEn(fuelAmount || "0"));
                    const pricePerLiter = FUEL_PRICE_MAP[(verificationData?.fuelType || "").toLowerCase()] ?? 135;
                    const total = liters * pricePerLiter;
                    return isNaN(total) ? "০" : total.toLocaleString("bn-BD", { maximumFractionDigits: 2 });
                  })()}
            </Text>
          </View>
        </View>

        {/* Timestamp Info */}
        <View style={{ alignItems: "center", marginTop: 25 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#94a3b8",
              fontFamily: "NotoSerifBengali_400Regular",
            }}
          >
            তারিখ: {new Date(transactionResult?.createdAt || Date.now()).toLocaleDateString("bn-BD")} •{" "}
            {new Date(transactionResult?.createdAt || Date.now()).toLocaleTimeString("bn-BD")}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: "auto", marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              height: 60,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
              marginBottom: 12,
            }}
            onPress={() => {
              setIsScanning(false);
              setScanned(false);
              setScreen("dashboard");
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontFamily: "NotoSerifBengali_700Bold",
                color: "#fff",
              }}
            >
              ড্যাশবোর্ডে ফিরুন
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              height: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              setScanned(false);
              setIsScanning(true);
              setScreen("dashboard");
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "NotoSerifBengali_700Bold",
                color: "#64748b",
              }}
            >
              পুনরায় স্ক্যান করুন
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderOperatorDashboard = () => (
    <View style={styles.operatorContainer}>
      <StatusBar style="dark" />
      <View style={styles.operatorHeader}>
        <View style={styles.opHeaderLeft}>
          <TouchableOpacity style={styles.opHeaderBtn}>
            <Plus
              size={24}
              color={COLORS.primary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>
          <Text style={styles.opHeaderText}>অপারেটর ড্যাশবোর্ড</Text>
        </View>
        <TouchableOpacity
          onPress={() => setScreen("profile")}
          style={styles.opAvatarBtn}
        >
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzkU12np7ikmCIa0pawT7zWUi_7ZTIMgY477OGF1TOjcdzoKF-DjThZetMzWk5n0kmUWYndq_SBiN9GPYycv1wYDguk860mJxnx6jHw0Iu2al-LsTWdd0QIJS4NHAKbrHGi4xFxGquWkLTsALc40V-ZcgpF5WANrCV-yj1vu0KqViNkdW0zrhHqaqE2NT1c-x0VIdguqTN9jxpxVtSDf8ENZchGgJJtqP82EmSBwUYS5eV0KCVP8r87mzLESpwzX-n_mw7MS-sLv3o",
            }}
            style={styles.opAvatarImg}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.opMainScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Scanner Section */}
        {!isScanning ? (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.opScannerCard}
            onPress={requestCameraPermission}
          >
            <View style={styles.opScannerBg}>
              <View style={styles.opScannerInner}>
                <QrCode size={120} color="#9ef4d010" />
              </View>
            </View>

            <View style={styles.opScannerOverlay}>
              <View style={styles.opScannerFrame}>
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      top: -2,
                      left: -2,
                      borderTopWidth: 4,
                      borderLeftWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      top: -2,
                      right: -2,
                      borderTopWidth: 4,
                      borderRightWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      bottom: -2,
                      left: -2,
                      borderBottomWidth: 4,
                      borderLeftWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      bottom: -2,
                      right: -2,
                      borderBottomWidth: 4,
                      borderRightWidth: 4,
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.opScanLine,
                    {
                      transform: [
                        {
                          translateY: sheetY.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 240],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.opScannerStatus}>
              <View style={styles.opPulseRow}>
                <View style={styles.opPulseDot} />
                <View style={[styles.opPulseDot, { opacity: 0.4 }]} />
                <View style={[styles.opPulseDot, { opacity: 0.1 }]} />
              </View>
              <Text style={styles.opScannerStatusText}>
                গ্রাহকের কিউআর কোড স্ক্যান করতে এখানে ট্যাপ করুন
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.opScannerCard}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <View style={styles.opScannerOverlay}>
              <View style={styles.opScannerFrame}>
                {/* Reuse corners for realism */}
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      top: -2,
                      left: -2,
                      borderTopWidth: 4,
                      borderLeftWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      top: -2,
                      right: -2,
                      borderTopWidth: 4,
                      borderRightWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      bottom: -2,
                      left: -2,
                      borderBottomWidth: 4,
                      borderLeftWidth: 4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.opScannerCorner,
                    {
                      bottom: -2,
                      right: -2,
                      borderBottomWidth: 4,
                      borderRightWidth: 4,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                onPress={() => setIsScanning(false)}
                style={{
                  position: "absolute",
                  bottom: 20,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff" }}>বাতিল করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Inventory Section */}
        <View style={styles.opInventoryCard}>
          <View style={styles.opSectionTitleRow}>
            <Fuel size={20} color={COLORS.primary} />
            <Text style={styles.opSectionTitle}>পাম্প ইনভেন্টরি</Text>
          </View>

          <View style={styles.opGaugeRow}>
            {/* Octane */}
            <View style={styles.opGaugeItem}>
              <View style={styles.opGaugeCircle}>
                <View style={styles.opGaugeCircleBg} />
                <View
                  style={[
                    styles.opGaugeProgress,
                    {
                      borderTopColor: COLORS.primary,
                      borderRightColor: COLORS.primary,
                      transform: [{ rotate: "45deg" }],
                    },
                  ]}
                />
                <Text style={styles.opGaugeValue}>৭৫%</Text>
              </View>
              <Text style={styles.opGaugeLabel}>অকটেন স্টক</Text>
              <Text style={styles.opGaugeSub}>১৫,০০০ / ২০,০০০ লিঃ</Text>
            </View>

            {/* Diesel */}
            <View style={styles.opGaugeItem}>
              <View style={styles.opGaugeCircle}>
                <View style={styles.opGaugeCircleBg} />
                <View
                  style={[
                    styles.opGaugeProgress,
                    {
                      borderTopColor: "#ef4444",
                      borderRightColor: "#ef4444",
                      transform: [{ rotate: "-135deg" }],
                    },
                  ]}
                />
                <Text style={[styles.opGaugeValue, { color: "#ef4444" }]}>
                  ১০%
                </Text>
              </View>
              <Text style={[styles.opGaugeLabel, { color: "#ef4444" }]}>
                ডিজেল স্টক
              </Text>
              <Text style={[styles.opGaugeSub, { color: "#ef4444" }]}>
                ২,০০০ / ২০,০০০ লিঃ
              </Text>
            </View>
          </View>
        </View>

        {/* Shift Summary */}
        <View style={styles.opSummaryCard}>
          <Text style={styles.opSectionTitle}>শিফট সামারি</Text>
          <View style={styles.opSummaryGrid}>
            <View style={styles.opSummaryItem}>
              <View style={styles.opSummaryIcon}>
                <History size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.opSummaryLabel}>মোট ট্রানজ্যাকশন</Text>
                <Text style={styles.opSummaryValue}>১২৮ টি</Text>
              </View>
            </View>
            <View style={styles.opSummaryItem}>
              <View style={styles.opSummaryIcon}>
                <Fuel size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.opSummaryLabel}>বিতরণ করা অকটেন</Text>
                <Text style={styles.opSummaryValue}>১,২৪০ লিঃ</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Operator Bottom Nav */}
      <View style={styles.opBottomNav}>
        <TouchableOpacity style={styles.opNavItem}>
          <View style={styles.opNavActive}>
            <Fuel size={24} color={COLORS.primary} />
          </View>
          <Text style={[styles.opNavText, { color: COLORS.primary }]}>
            ড্যাশবোর্ড
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.opNavItem}
          onPress={() => setScreen("transactions")}
        >
          <History size={24} color="#64748b" />
          <Text style={styles.opNavText}>লেনদেন</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.opNavItem}
          onPress={() => setScreen("profile")}
        >
          <User size={24} color="#64748b" />
          <Text style={styles.opNavText}>প্রোফাইল</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    getFullUrl(carImage) ||
                    "https://images.unsplash.com/photo-1540340334550-80151c0abc8c?w=100",
                }}
                style={styles.avatar}
              />
              <View style={styles.statusIndicator} />
            </View>
            <View>
              <Text style={styles.welcomeTextSmall}>শুভ সকাল,</Text>
              <Text style={styles.userNameText}>
                {fullName || "ব্যবহারকারী"}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowQR(true)}
            >
              <QrCode size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setScreen("notifications")}
            >
              <Bell size={20} color={COLORS.primary} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fuel Rates */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>জ্বালানি দর (আজ)</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>বিস্তারিত</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ratesScroll}
          >
            {FUEL_RATES.map((rate, idx) => (
              <View key={idx} style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <Text style={styles.rateType}>{rate.type}</Text>
                  {rate.trend === "up" ? (
                    <TrendingUp size={14} color="#ef4444" />
                  ) : rate.trend === "down" ? (
                    <TrendingDown size={14} color="#10b981" />
                  ) : null}
                </View>
                <Text style={styles.ratePrice}>৳{rate.price}</Text>
                <Text
                  style={[
                    styles.rateChange,
                    {
                      color:
                        rate.trend === "up"
                          ? "#ef4444"
                          : rate.trend === "down"
                            ? "#10b981"
                            : COLORS.secondary,
                    },
                  ]}
                >
                  {rate.change} / লিটার
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Combined Usage & Quota Card */}
        <View style={styles.usageContainer}>
          <View style={styles.webStyleUsageCard}>
            <Text style={styles.webStyleHeader}>আজকের অবশিষ্ট লিমিট</Text>

            <View style={styles.webGaugeWrapper}>
              <View style={styles.webGaugeBase}>
                <View style={styles.webGaugeProgress}>
                  <View
                    style={[
                      styles.webGaugeFill,
                      { transform: [{ rotate: "135deg" }] },
                    ]}
                  />
                </View>
                <View style={styles.webGaugeInner}>
                  <Text style={styles.webGaugeValue}>৩.৫</Text>
                  <Text style={styles.webGaugeUnit}>/ ৫.০ লিটার</Text>
                </View>
              </View>
            </View>

            <View style={styles.webQuotaSection}>
              <View style={styles.webQuotaHeader}>
                <Text style={styles.webQuotaLabel}>এই মাসের মোট কোটা</Text>
                <Text style={styles.webQuotaStats}>৪৫ / ১০০ লিটার</Text>
              </View>
              <View style={styles.webProgressBar}>
                <View style={[styles.webProgressFill, { width: "45%" }]} />
              </View>
              <Text style={styles.webRenewalText}>
                রিনিউয়াল ডেট: ০১ এপ্রিল ২০২৬
              </Text>
            </View>
          </View>
        </View>

        {/* My Vehicle Card (Removed the old Quota Section) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>আমার গাড়ি</Text>
          <TouchableOpacity style={styles.vehicleSmallCard}>
            <View
              style={[
                styles.vehicleIconBox,
                { backgroundColor: COLORS.primaryContainer + "20" },
              ]}
            >
              {vehicleType === "car" ? (
                <Car color={COLORS.primary} size={28} />
              ) : vehicleType === "bike" ? (
                <Bike color={COLORS.primary} size={28} />
              ) : (
                <Truck color={COLORS.primary} size={28} />
              )}
            </View>
            <View style={styles.vehicleInfoBox}>
              <Text style={styles.vehicleModelName}>
                {vehicleType === "car"
                  ? "Toyota Corolla"
                  : vehicleType === "bike"
                    ? "Yamaha FZ"
                    : "Tata 407"}
              </Text>
              <Text style={styles.vehiclePlateNumber}>
                {district}-{series}-{number || "১২-৩৪৫৬"}
              </Text>
            </View>
            <ArrowRight size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>সাম্প্রতিক লেনদেন</Text>
            <TouchableOpacity onPress={() => setScreen("transactions")}>
              <Text style={styles.seeAllText}>সব দেখুন</Text>
            </TouchableOpacity>
          </View>
          {TRANSACTIONS.map((tx) => (
            <TouchableOpacity key={tx.id} style={styles.txListItem}>
              <View style={styles.txIconBox}>
                <History size={20} color={COLORS.primary} />
              </View>
              <View style={styles.txMainInfo}>
                <Text style={styles.txTitle}>
                  {tx.type} ({tx.amount}L)
                </Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <View style={styles.txAmountInfo}>
                <Text style={styles.txPrice}>৳{tx.price}</Text>
                <Text style={styles.txStatus}>সফল</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowQR(true)}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.fabGradient}>
          <QrCode color="#fff" size={28} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setScreen("dashboard")}
        >
          <View
            style={[
              styles.navIconActive,
              { backgroundColor: COLORS.primaryContainer + "20" },
            ]}
          >
            <Fuel size={24} color={COLORS.primary} />
          </View>
          <Text style={[styles.navText, { color: COLORS.primary }]}>হোম</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setScreen("transactions")}
        >
          <History size={24} color={COLORS.secondary} />
          <Text style={styles.navText}>লেনদেন</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setScreen("map")}
        >
          <Map size={24} color={COLORS.secondary} />
          <Text style={styles.navText}>ম্যাপ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setScreen("profile")}
        >
          <User size={24} color={COLORS.secondary} />
          <Text style={styles.navText}>প্রোফাইল</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransactions = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.minimalHeader}>
        <TouchableOpacity
          style={styles.backButtonMinimal}
          onPress={() => setScreen("dashboard")}
        >
          <ArrowLeft size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.minimalHeaderTitle}>লেনদেন সমূহ</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg }}
      >
        <View style={styles.spendingSummaryCard}>
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.spendingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.spendingLabel}>মার্চে মোট খরচ</Text>
            <Text style={styles.spendingAmount}>৳ ৫,২৫০.০০</Text>
            <View style={styles.spendingFooter}>
              <View style={styles.spendingStat}>
                <Text style={styles.statLabel}>মোট জ্বালানি</Text>
                <Text style={styles.statValue}>৩৯.০ লিটার</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.spendingStat}>
                <Text style={styles.statLabel}>লেনদেন</Text>
                <Text style={styles.statValue}>৮ টি</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.txGroupTitle}>মার্চ ২০২৪</Text>
        {TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={styles.txDetailCard}>
            <View style={styles.txDetailHeader}>
              <View style={styles.txDetailIconCircle}>
                <Fuel size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.txDetailTitle}>{tx.type} সংগ্রহ</Text>
                <Text style={styles.txDetailDate}>{tx.date}</Text>
              </View>
              <Text style={styles.txDetailMainAmount}>৳{tx.price}</Text>
            </View>
            <View style={styles.txDetailDivider} />
            <View style={styles.txDetailGrid}>
              <View style={styles.txDetailGridItem}>
                <Text style={styles.txGridLabel}>পরিমাণ</Text>
                <Text style={styles.txGridValue}>{tx.amount} লিটার</Text>
              </View>
              <View style={styles.txDetailGridItem}>
                <Text style={styles.txGridLabel}>পদ্ধতি</Text>
                <Text style={styles.txGridValue}>{tx.method}</Text>
              </View>
              <View style={[styles.txDetailGridItem, { flex: 2 }]}>
                <Text style={styles.txGridLabel}>অবস্থান</Text>
                <Text style={styles.txGridValue} numberOfLines={1}>
                  {tx.location}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderProfile = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.profileHeaderMinimal}>
        <TouchableOpacity
          style={styles.backButtonMinimal}
          onPress={() => setScreen("dashboard")}
        >
          <ArrowLeft size={24} color="#064e3b" />
        </TouchableOpacity>
        <Text style={styles.minimalHeaderTitleText}>প্রোফাইল</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {fullName ? fullName.charAt(0) : "ইউ"}
              </Text>
            </View>
            <View style={styles.verifiedIconBadge}>
              <ShieldCheck size={16} color="#fff" fill="#065f46" />
            </View>
          </View>
          <Text style={styles.profileNameMain}>
            {fullName || "ব্যবহারকারী"}
          </Text>
          <View style={styles.verifiedLabelContainer}>
            <ShieldCheck size={16} color="#065f46" />
            <Text style={styles.verifiedLabelText}>ভেরিফাইড ইউজার</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.profileGroup}>
          <Text style={styles.profileGroupTitle}>ব্যক্তিগত তথ্য</Text>
          <View style={styles.profileCardFull}>
            <View style={styles.profileRowItem}>
              <View style={styles.iconBoxGray}>
                <User size={20} color="#64748b" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>নাম</Text>
                <Text style={styles.rowValue}>{fullName || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.profileRowItem}>
              <View style={styles.iconBoxGray}>
                <Phone size={20} color="#64748b" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>মোবাইল নম্বর</Text>
                <Text style={styles.rowValue}>{mobileNumber || "N/A"}</Text>
              </View>
            </View>

            <View style={[styles.profileRowItem, { borderBottomWidth: 0 }]}>
              <View style={styles.iconBoxGray}>
                <Mail size={20} color="#64748b" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>ইমেইল</Text>
                <Text style={styles.rowValue}>{email || "owner@test.com"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.profileGroup}>
          <Text style={styles.profileGroupTitle}>গাড়ির তথ্য</Text>
          <View style={styles.profileCardFull}>
            <View style={styles.profileRowItem}>
              <View style={styles.iconBoxGray}>
                <Car size={20} color="#64748b" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>গাড়ির ধরন ও মডেল</Text>
                <Text style={styles.rowValue}>
                  {vehicleType === "car"
                    ? "কার (ব্যক্তিগত)"
                    : vehicleType === "bike"
                      ? "মোটরসাইকেল"
                      : "ট্রাক"}{" "}
                  - Toyota Premio
                </Text>
              </View>
            </View>

            <View style={[styles.profileRowItem, { borderBottomWidth: 0 }]}>
              <View style={styles.iconBoxGray}>
                <Hash size={20} color="#64748b" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>নম্বর প্লেট</Text>
                <Text style={styles.rowValue}>
                  {district} {series}-{number || "ঢাকা মেট্রো-গ-১২৩৪"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.profileGroup}>
          <Text style={styles.profileGroupTitle}>সংযুক্ত নথিপত্র</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.docsRowFlat}
          >
            <View style={styles.docItemFlat}>
              {carImage ? (
                <Image
                  source={{ uri: getFullUrl(carImage) }}
                  style={styles.realDocImg}
                />
              ) : (
                <View style={styles.docImgPlaceholder} />
              )}
              <Text style={styles.docLabelFlat}>গাড়ির ছবি</Text>
            </View>
            <View style={styles.docItemFlat}>
              {plateImage ? (
                <Image
                  source={{ uri: getFullUrl(plateImage) }}
                  style={styles.realDocImg}
                />
              ) : (
                <View style={styles.docImgPlaceholder} />
              )}
              <Text style={styles.docLabelFlat}>প্লেট নম্বর</Text>
            </View>
            <View style={styles.docItemFlat}>
              {bluebookImage ? (
                <Image
                  source={{ uri: getFullUrl(bluebookImage) }}
                  style={styles.realDocImg}
                />
              ) : (
                <View style={styles.docImgPlaceholder} />
              )}
              <Text style={styles.docLabelFlat}>ব্লুবুক</Text>
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.logoutBtnProfile}
          onPress={() => setScreen("splash")}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutTextProfile}>লগআউট করুন</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Re-use bottom nav if needed, but the image shows a standalone page header */}
    </View>
  );

  const renderMap = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.profileHeaderMinimal}>
        <TouchableOpacity
          style={styles.backButtonMinimal}
          onPress={() => setScreen("dashboard")}
        >
          <ArrowLeft size={24} color="#064e3b" />
        </TouchableOpacity>
        <Text style={styles.minimalHeaderTitleText}>নিকটস্থ পাম্প</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.mapViewFull}
          initialRegion={{
            latitude: 23.8103,
            longitude: 90.4125,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* User Location Dot */}
          <Marker coordinate={{ latitude: 23.8103, longitude: 90.4125 }}>
            <View style={styles.userLocationDot}>
              <View style={styles.userLocationInner} />
            </View>
          </Marker>

          {/* Stations from Database */}
          {pumps.map((pump: any) => (
            <Marker
              key={pump.id}
              coordinate={{
                latitude: parseFloat(pump.latitude),
                longitude: parseFloat(pump.longitude),
              }}
              onPress={() =>
                setSelectedStation({
                  name: pump.name,
                  address: pump.location,
                  distance: "N/A", // We can calculate distance if needed later
                  fuels: [
                    {
                      type: "অকটেন",
                      status: pump.octane_liters > 0 ? "আছে" : "নেই",
                    },
                    {
                      type: "ডিজেল",
                      status: pump.diesel_liters > 0 ? "আছে" : "নেই",
                    },
                    {
                      type: "পেট্রোল",
                      status: pump.petrol_liters > 0 ? "আছে" : "নেই",
                    },
                  ],
                })
              }
            >
              <View style={styles.customMarkerContainer}>
                <View
                  style={[
                    styles.markerIconBox,
                    {
                      backgroundColor:
                        pump.octane_liters > 0 || pump.diesel_liters > 0
                          ? "#064e3b"
                          : "#f97316",
                    },
                  ]}
                >
                  <Fuel size={18} color="#fff" />
                </View>
                <View style={styles.markerDistanceBox}>
                  <Text style={styles.markerDistanceText}>
                    {pump.name.split(" ")[0]}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Floating Search Bar */}
        <View style={styles.mapSearchFloating}>
          <MapPin size={18} color="#64748b" />
          <Text style={styles.mapSearchText}>উত্তরা, ঢাকা</Text>
        </View>

        {/* Station Detail Popup */}
        {selectedStation && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.stationPopupContainer,
              { transform: [{ translateY: sheetY }] },
            ]}
          >
            <View style={styles.popupHandle} />
            <View style={styles.popupHeader}>
              <View>
                <Text style={styles.popupTitle}>{selectedStation.name}</Text>
                <View style={styles.popupSubRow}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.popupAddress}>
                    {selectedStation.address}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedStation(null)}
                style={styles.popupExpandBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.fuelStatusRow}>
              {selectedStation.fuels.map((f: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.fuelStatusCard,
                    f.status === "নেই" && styles.fuelStatusCardEmpty,
                  ]}
                >
                  <Text style={styles.fuelTypeName}>{f.type}</Text>
                  <Text
                    style={[
                      styles.fuelStatusText,
                      f.status === "নেই" && styles.fuelStatusTextEmpty,
                    ]}
                  >
                    {f.status}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => setSelectedStation(null)}
            >
              <Text style={styles.directionsBtnText}>তথ্য দেখুন</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );

  const renderQRModal = () => (
    <View style={styles.modalOverlay}>
      <Animated.View
        style={[
          styles.qrModalContentCompact,
          {
            transform: [{ scale: qrScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeModalBtnMinimal}
          onPress={() => setShowQR(false)}
        >
          <X size={24} color="#334155" />
        </TouchableOpacity>

        <View style={styles.qrHeaderCompact}>
          <Text style={styles.qrTitleCompact}>আপনার ফুয়েল পাস QR</Text>
          <Text style={styles.qrSubTitleCompact}>
            তেল নিতে পাম্প অপারেটরকে এই কোডটি দেখান
          </Text>
        </View>

        <View style={styles.qrFrameCompact}>
          <View style={styles.qrInnerCompact}>
            {qrToken ? (
              <QRCode
                value={qrToken}
                size={160}
                color="#000"
                backgroundColor="transparent"
              />
            ) : (
              <ActivityIndicator color={COLORS.primary} size="large" />
            )}
          </View>
        </View>

        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <Text style={{ color: "#64748b", fontSize: 13 }}>
            পুনরায় রিফ্রেশ হবে: {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")} মিনিটে
          </Text>
        </View>

        <View style={styles.qrVehicleCardCompact}>
          <Text style={styles.qrVehicleLabelCompact}>গাড়ির নম্বর</Text>
          <Text style={styles.qrPlateCompact}>
            {district} {series}-{number || "১২-৩৪৫৬"}
          </Text>
        </View>

        <View style={styles.qrVerifiedRow}>
          <ShieldCheck size={18} color="#064e3b" />
          <Text style={styles.qrVerifiedText}>নিরাপদ ও ভেরিফাইড</Text>
        </View>

        <TouchableOpacity
          style={styles.qrCloseButtonCompact}
          onPress={() => setShowQR(false)}
        >
          <Text style={styles.qrCloseButtonText}>বন্ধ করুন</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  let [fontsLoaded] = useFonts({
    NotoSerifBengali_400Regular,
    NotoSerifBengali_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {screen === "register" && (
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={styles.loginContainer}>
            {/* Header */}
            <View style={styles.regHeaderFixed}>
              <TouchableOpacity
                onPress={() =>
                  regStep > 1 ? setRegStep(regStep - 1) : setScreen("splash")
                }
                style={styles.headerIconBtn}
              >
                <ArrowRight
                  color={COLORS.primary}
                  size={24}
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </TouchableOpacity>
              <View style={styles.headerTitleCenter}>
                <Text style={styles.regHeaderTitle}>রেজিস্ট্রেশন</Text>
                <Text style={styles.stepIndicatorText}>ধাপ {regStep} এর ৩</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(regStep / 3) * 100}%` },
                ]}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: SPACING.md }}
            >
              {regStep === 1 && (
                <View style={styles.formSection}>
                  <Text style={styles.loginTitle}>ব্যক্তিগত তথ্য</Text>
                  <Text style={styles.loginSubtitle}>
                    আপনার পরিচয় নিশ্চিত করতে নিচের তথ্যগুলো দিন
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>পুরো নাম</Text>
                    <View style={styles.inputWrapper}>
                      <User
                        size={20}
                        color={COLORS.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="আপনার নাম লিখুন"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>মোবাইল (১১ ডিজিট)</Text>
                    <View style={styles.inputWrapper}>
                      <Phone
                        size={20}
                        color={COLORS.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="01XXXXXXXXX"
                        keyboardType="phone-pad"
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>ইমেইল (ঐচ্ছিক)</Text>
                    <View style={styles.inputWrapper}>
                      <Mail
                        size={20}
                        color={COLORS.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="example@mail.com"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>পাসওয়ার্ড সেট করুন</Text>
                    <View style={styles.inputWrapper}>
                      <ShieldCheck
                        size={20}
                        color={COLORS.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="ন্যূনতম ৬ ডিজিট"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color={COLORS.secondary} />
                        ) : (
                          <Eye size={20} color={COLORS.secondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() =>
                      fullName && mobileNumber && password.length >= 6
                        ? setRegStep(2)
                        : Alert.alert(
                            "ভুল",
                            "দয়া করে নাম, মোবাইল এবং ন্যূনতম ৬ ডিজিটের পাসওয়ার্ড দিন",
                          )
                    }
                  >
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.mainButtonText}>পরবর্তী ধাপ</Text>
                      <ArrowRight color="#fff" size={20} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {regStep === 2 && (
                <View style={styles.formSection}>
                  <Text style={styles.loginTitle}>যানবাহনের বিবরণ</Text>
                  <Text style={styles.loginSubtitle}>
                    সঠিক জ্বালানি কোটা পেতে আপনার গাড়ির সঠিক তথ্য দিন
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>জেলা</Text>
                    <View
                      style={[styles.inputWrapper, { paddingHorizontal: 0 }]}
                    >
                      <Picker
                        selectedValue={district}
                        onValueChange={(v) => setDistrict(v)}
                        style={{ flex: 1, height: 56, color: COLORS.onSurface }}
                      >
                        {DISTRICTS.map((d) => (
                          <Picker.Item key={d} label={d} value={d} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>সিরিজ</Text>
                      <View
                        style={[styles.inputWrapper, { paddingHorizontal: 0 }]}
                      >
                        <Picker
                          selectedValue={series}
                          onValueChange={(v) => setSeries(v)}
                          style={{
                            flex: 1,
                            height: 56,
                            color: COLORS.onSurface,
                          }}
                        >
                          {SERIES.map((s) => (
                            <Picker.Item key={s} label={s} value={s} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.label}>নম্বর</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="১২৩৪"
                          keyboardType="numeric"
                          value={number}
                          onChangeText={setNumber}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>যানবাহনের ধরণ</Text>
                    <View style={styles.typeSelector}>
                      {(["bike", "car", "truck"] as const).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.typeButton,
                            vehicleType === t && {
                              backgroundColor: COLORS.primary,
                              borderColor: COLORS.primary,
                            },
                          ]}
                          onPress={() => setVehicleType(t)}
                        >
                          {t === "bike" ? (
                            <Bike
                              size={18}
                              color={
                                vehicleType === t ? "#fff" : COLORS.secondary
                              }
                            />
                          ) : t === "car" ? (
                            <Car
                              size={18}
                              color={
                                vehicleType === t ? "#fff" : COLORS.secondary
                              }
                            />
                          ) : (
                            <Truck
                              size={18}
                              color={
                                vehicleType === t ? "#fff" : COLORS.secondary
                              }
                            />
                          )}
                          <Text
                            style={[
                              styles.typeText,
                              vehicleType === t && { color: "#fff" },
                            ]}
                          >
                            {t === "bike"
                              ? "বাইক"
                              : t === "car"
                                ? "কার"
                                : "ট্রাক"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() =>
                      number
                        ? setRegStep(3)
                        : Alert.alert("ভুল", "গাড়ির নম্বর দিন")
                    }
                  >
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.mainButtonText}>পরবর্তী ধাপ</Text>
                      <ArrowRight color="#fff" size={20} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {regStep === 3 && (
                <View style={styles.formSection}>
                  <Text style={styles.loginTitle}>ছবি ও ভেরিফিকেশন</Text>
                  <Text style={styles.loginSubtitle}>
                    সঠিক ভেরিফিকেশনের জন্য ছবিগুলো পরিষ্কারভাবে তুলুন
                  </Text>

                  <View style={styles.infoAlert}>
                    <Info size={18} color={COLORS.primary} />
                    <Text style={styles.infoAlertText}>
                      আপনার ছবিগুলো আমাদের টিম যাচাই করবে।
                    </Text>
                  </View>

                  {/* Primary Upload Card */}
                  <TouchableOpacity
                    style={[
                      styles.fullImageCard,
                      carImage && { borderColor: COLORS.primary },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => pickImage("car")}
                  >
                    {carImage ? (
                      <View style={styles.imagePreviewWrapper}>
                        <Image
                          source={{ uri: carImage }}
                          style={styles.fullImage}
                        />
                        <View style={styles.successOverlay}>
                          <CheckCircle2 color="#fff" size={32} />
                          <Text style={styles.successOverlayText}>
                            পরিবর্তন করতে ক্লিক করুন
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <View style={styles.uploadIconCircle}>
                          <CameraIcon color={COLORS.primary} size={32} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Text style={styles.uploadTitle}>গাড়ির ছবি</Text>
                          <Text style={styles.uploadDesc}>
                            মডেল ও রঙ পরিষ্কার বুঝা যায় এমন ছবি
                          </Text>
                        </View>
                        <ArrowRight color={COLORS.secondary} size={20} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.imageRow}>
                    <TouchableOpacity
                      style={[
                        styles.halfImageCard,
                        plateImage && { borderColor: COLORS.primary },
                      ]}
                      onPress={() => pickImage("plate")}
                    >
                      {plateImage ? (
                        <Image
                          source={{ uri: plateImage }}
                          style={styles.fullImage}
                        />
                      ) : (
                        <>
                          <View style={styles.miniIconCircle}>
                            <CameraIcon size={14} color={COLORS.primary} />
                          </View>
                          <Hash size={24} color={COLORS.secondary} />
                          <Text style={styles.halfCardTitle}>প্লেট নম্বর</Text>
                        </>
                      )}
                      {plateImage && (
                        <View style={styles.miniCheck}>
                          <Check size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.halfImageCard,
                        bluebookImage && { borderColor: COLORS.primary },
                      ]}
                      onPress={() => pickImage("bluebook")}
                    >
                      {bluebookImage ? (
                        <Image
                          source={{ uri: bluebookImage }}
                          style={styles.fullImage}
                        />
                      ) : (
                        <>
                          <View style={styles.miniIconCircle}>
                            <CameraIcon size={14} color={COLORS.primary} />
                          </View>
                          <FileText size={24} color={COLORS.secondary} />
                          <Text style={styles.halfCardTitle}>ব্লুবুক ছবি</Text>
                        </>
                      )}
                      {bluebookImage && (
                        <View style={styles.miniCheck}>
                          <Check size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.warningCard}>
                    <ShieldAlert color="#b91c1c" size={20} />
                    <Text style={styles.warningText}>
                      ভুল তথ্য প্রদান করলে সার্ভিসটি সাময়িকভাবে স্থগিত হতে পারে।
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.mainButtonText}>
                          রেজিস্ট্রেশন এবং ছবি সাবমিট
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      )}

      {screen === "login" && (
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View style={styles.loginContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setScreen("splash")}
            >
              <ArrowRight
                color={COLORS.onSurface}
                size={24}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>

            <View style={styles.loginHeader}>
              <View
                style={[
                  styles.loginIconCircle,
                  { backgroundColor: COLORS.primaryContainer },
                ]}
              >
                <Fuel color="#fff" size={32} />
              </View>
              <Text style={styles.loginTitle}>লগইন করুন</Text>
              <Text style={styles.loginSubtitle}>
                আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>মোবাইল নম্বর</Text>
                <View style={styles.inputWrapper}>
                  <Phone
                    size={20}
                    color={COLORS.secondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="আপনার ১১ ডিজিটের মোবাইল নম্বর"
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    placeholderTextColor={COLORS.outlineVariant}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>পাসওয়ার্ড</Text>
                <View style={styles.inputWrapper}>
                  <User
                    size={20}
                    color={COLORS.secondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="আপনার পাসওয়ার্ড"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={COLORS.outlineVariant}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={COLORS.secondary} />
                    ) : (
                      <Eye size={20} color={COLORS.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.mainButton}
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.mainButtonText}>প্রবেশ করুন</Text>
                      <LogIn color="#fff" size={20} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>অথবা</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.7}
                onPress={() => setScreen("register")}
              >
                <Text style={styles.outlineButtonText}>
                  নতুন অ্যাকাউন্ট তৈরি করুন
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}

      {screen === "splash" && (
        <SafeAreaView style={styles.safeSplash}>
          <StatusBar style="light" />
          <LinearGradient colors={GRADIENTS.primary} style={styles.container}>
            <View style={styles.topSection}>
              <View style={styles.iconCircle}>
                <Fuel color="#fff" size={48} />
              </View>
              <Text style={styles.brandTitleText}>Fuel Pass</Text>
              <Text style={styles.brandSubtitle}>BANGLADESH</Text>
            </View>

            <View style={styles.middleSection}>
              <Text style={styles.welcomeTitle}>স্বাগতম</Text>
              <Text style={styles.welcomeText}>
                দেশের জ্বালানি সাশ্রয়ে আপনার অংশগ্রহণ নিশ্চিত করুন। আজই নিবন্ধন
                করুন অথবা লগইন করুন।
              </Text>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={styles.loginButton}
                activeOpacity={0.8}
                onPress={() => setScreen("login")}
              >
                <Text style={styles.loginText}>লগইন করুন</Text>
                <ArrowRight color={COLORS.primary} size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                activeOpacity={0.8}
                onPress={() => setScreen("register")}
              >
                <Text style={styles.registerText}>নতুন রেজিস্ট্রেশন</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>
      )}

      {screen === "success" && (
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <View
            style={[
              styles.loginContainer,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: COLORS.primaryContainer,
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 24,
                },
              ]}
            >
              <CheckCircle2 color="#fff" size={48} />
            </View>
            <Text style={[styles.loginTitle, { textAlign: "center" }]}>
              রেজিস্ট্রেশন সফল হয়েছে!
            </Text>
            <Text
              style={[
                styles.loginSubtitle,
                { textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
              ]}
            >
              আপনার তথ্যগুলো আমাদের টিমের কাছে পাঠানো হয়েছে। ভেরিফিকেশন সম্পন্ন
              হলে আপনি জ্বালানি কোটা ব্যবহার করতে পারবেন।
            </Text>

            <TouchableOpacity
              style={[styles.mainButton, { width: "100%", marginTop: 40 }]}
              activeOpacity={0.8}
              onPress={() => setScreen("login")}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.buttonGradient}
              >
                <Text style={styles.mainButtonText}>লগইন করুন</Text>
                <ArrowRight color="#fff" size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {screen === "dashboard" &&
        (userRoleActual === "operator"
          ? renderOperatorDashboard()
          : renderDashboard())}
      {screen === "verification_result" && renderVerificationResult()}
      {screen === "transaction_success" && renderTransactionSuccess()}
      {screen === "transactions" && renderTransactions()}
      {screen === "profile" && renderProfile()}
      {screen === "map" && renderMap()}

      {["dashboard", "profile", "map"].includes(screen) &&
        userRoleActual === "owner" && (
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setScreen("dashboard")}
            >
              <Fuel
                size={24}
                color={screen === "dashboard" ? "#059669" : "#64748b"}
              />
              <Text
                style={[
                  styles.navText,
                  screen === "dashboard" && styles.navTextActive,
                ]}
              >
                হোম
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setScreen("map")}
            >
              <MapPin
                size={24}
                color={screen === "map" ? "#059669" : "#64748b"}
              />
              <Text
                style={[
                  styles.navText,
                  screen === "map" && styles.navTextActive,
                ]}
              >
                ম্যাপ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setScreen("profile")}
            >
              <User
                size={24}
                color={screen === "profile" ? "#059669" : "#64748b"}
              />
              <Text
                style={[
                  styles.navText,
                  screen === "profile" && styles.navTextActive,
                ]}
              >
                প্রোফাইল
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {showQR && renderQRModal()}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Operator Styles
  operatorContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  operatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  opHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  opHeaderBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  opHeaderText: {
    fontSize: 18,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  opAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer + "40",
    overflow: "hidden",
  },
  opAvatarImg: {
    width: "100%",
    height: "100%",
  },
  opMainScroll: {
    padding: 20,
    paddingBottom: 120,
  },
  opScannerCard: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#0a0a0a",
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  opScannerBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  opScannerInner: {
    opacity: 0.05,
  },
  opScannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  opScannerFrame: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderColor: "#9ef4d030",
    borderRadius: 30,
    position: "relative",
  },
  opScannerCorner: {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: COLORS.primary,
    borderRadius: 12,
  },
  opScanLine: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  opScannerStatus: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  opPulseRow: {
    flexDirection: "row",
    gap: 6,
  },
  opPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  opScannerStatusText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    letterSpacing: 1,
  },
  opInventoryCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  opSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  opSectionTitle: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  opGaugeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  opGaugeItem: {
    flex: 1,
    alignItems: "center",
  },
  opGaugeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  opGaugeCircleBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: "#f1f5f9",
  },
  opGaugeProgress: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: "transparent",
  },
  opGaugeValue: {
    fontSize: 28,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  opGaugeLabel: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  opGaugeSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  opSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  opSummaryGrid: {
    marginTop: 24,
    gap: 16,
  },
  opSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 24,
  },
  opSummaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  opSummaryLabel: {
    fontSize: 10,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  opSummaryValue: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  opBottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 72,
    backgroundColor: "#fff",
    borderRadius: 36,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  opNavItem: {
    alignItems: "center",
    gap: 4,
  },
  opNavActive: {
    width: 48,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  opNavText: {
    fontSize: 10,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#64748b",
  },
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeSplash: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 40,
  },
  loginContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  loginHeader: {
    marginBottom: SPACING.xl,
  },
  loginIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  loginSubtitle: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  formSection: {
    marginTop: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.onSurface,
  },
  mainButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: SPACING.md,
    shadowColor: SHADOWS.editorial.shadowColor,
    shadowOffset: SHADOWS.editorial.shadowOffset,
    shadowOpacity: SHADOWS.editorial.shadowOpacity,
    shadowRadius: SHADOWS.editorial.shadowRadius,
    elevation: SHADOWS.editorial.elevation,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    gap: SPACING.sm,
  },
  mainButtonText: {
    fontSize: 18,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.secondary,
    fontFamily: "NotoSerifBengali_400Regular",
    fontSize: 14,
  },
  outlineButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButtonText: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  regHeaderFixed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    gap: 8,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  stepText: {
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    fontSize: 14,
  },
  fullImageCard: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: SPACING.md,
    justifyContent: "center",
  },
  imagePreviewWrapper: {
    width: "100%",
    height: "100%",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  successOverlayText: {
    color: "#fff",
    fontFamily: "NotoSerifBengali_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  uploadPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryContainer + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  uploadDesc: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  imageRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  halfImageCard: {
    flex: 1,
    height: 120,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  halfCardTitle: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    marginTop: 8,
  },
  miniIconCircle: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.primaryContainer + "20",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  miniCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryContainer + "20",
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  infoAlertText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.primary,
  },
  warningCard: {
    flexDirection: "row",
    gap: 12,
    padding: SPACING.md,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
    marginBottom: SPACING.lg,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "#991b1b",
    lineHeight: 18,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleCenter: {
    alignItems: "center",
  },
  regHeaderTitle: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 2,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  typeText: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
  },
  topSection: {
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  brandTitleText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 4,
    marginTop: SPACING.xs,
  },
  middleSection: {
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 36,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#fff",
    marginBottom: SPACING.md,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomSection: {
    gap: SPACING.md,
  },
  loginButton: {
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    shadowColor: SHADOWS.editorial.shadowColor,
    shadowOffset: SHADOWS.editorial.shadowOffset,
    shadowOpacity: SHADOWS.editorial.shadowOpacity,
    shadowRadius: SHADOWS.editorial.shadowRadius,
    elevation: SHADOWS.editorial.elevation,
  },
  loginText: {
    fontSize: 18,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  registerButton: {
    height: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  registerText: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  // Dashboard Styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer + "40",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  welcomeTextSmall: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  userNameText: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  ratesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  rateCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rateType: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
  },
  ratePrice: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  rateChange: {
    fontSize: 10,
    fontFamily: "NotoSerifBengali_400Regular",
    marginTop: 4,
  },
  usageContainer: {
    marginTop: 24,
    paddingHorizontal: SPACING.lg,
  },
  usageCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  usageTitle: {
    fontSize: 18,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  timeBadge: {
    backgroundColor: COLORS.primaryContainer + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeBadgeText: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  gaugeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  gaugeBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  gaugeFill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  gaugeCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeValue: {
    fontSize: 32,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  gaugeUnit: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  usageDetails: {
    flex: 1,
    gap: 16,
  },
  usageDetailItem: {
    gap: 4,
  },
  usageDetailLabel: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  usageDetailValue: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  usageDetailDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  quotaSection: {
    marginTop: 24,
    paddingHorizontal: SPACING.lg,
  },
  quotaCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  quotaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  quotaTitle: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  quotaSubtitle: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  quotaPercentage: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  quotaBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quotaStats: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  quotaRemaining: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  vehicleSmallCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginTop: 8,
  },
  vehicleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfoBox: {
    flex: 1,
    marginLeft: 16,
  },
  vehicleModelName: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  vehiclePlateNumber: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    marginTop: 2,
  },
  txListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 12,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  txMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  txDate: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    marginTop: 2,
  },
  txAmountInfo: {
    alignItems: "flex-end",
  },
  txPrice: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  txStatus: {
    fontSize: 10,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#10b981",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 80,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  navIconActive: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  navText: {
    fontSize: 10,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
  },
  navTextActive: {
    color: "#059669",
  },
  // Subscreen Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  minimalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  backButtonMinimal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  minimalHeaderTitle: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  spendingSummaryCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
  },
  spendingGradient: {
    padding: 24,
  },
  spendingLabel: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  spendingAmount: {
    fontSize: 32,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#fff",
    marginVertical: 8,
  },
  spendingFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  spendingStat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#fff",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 16,
  },
  txGroupTitle: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  txDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  txDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  txDetailIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  txDetailTitle: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  txDetailDate: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    marginTop: 2,
  },
  txDetailMainAmount: {
    fontSize: 18,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  txDetailDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginBottom: 16,
  },
  txDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  txDetailGridItem: {
    flex: 1,
    minWidth: 80,
  },
  txGridLabel: {
    fontSize: 11,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  txGridValue: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    marginTop: 4,
  },
  profileHeaderCard: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatarLarge: {
    position: "relative",
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.primaryContainer + "30",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  profileNameLarge: {
    fontSize: 24,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#fff",
  },
  profileSectionTitle: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: 12,
  },
  profileDetailList: {
    backgroundColor: "#fff",
    paddingHorizontal: SPACING.lg,
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  profileDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    gap: 16,
  },
  profileDetailInfo: {
    flex: 1,
  },
  profileDetailLabel: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  profileDetailValue: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    marginTop: 2,
  },
  docsGrid: {
    paddingLeft: SPACING.lg,
    paddingRight: 20,
    gap: 12,
    marginBottom: 32,
  },
  docPreviewCard: {
    width: 120,
    gap: 8,
  },
  docImg: {
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    resizeMode: "cover",
  },
  docLabel: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    textAlign: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#ef4444",
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  clearAllText: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#ef4444",
  },
  notifItem: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    gap: 16,
    position: "relative",
  },
  notifUnread: {
    backgroundColor: COLORS.primaryContainer + "05",
  },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  notifTime: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
  },
  notifMessage: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    lineHeight: 20,
  },
  unreadDot: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  // Modal QR Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 100,
  },
  qrModalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    position: "relative",
  },
  closeModalBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
  },
  qrModalTitle: {
    fontSize: 22,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  qrModalDesc: {
    fontSize: 13,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  qrCodeContainer: {
    marginBottom: 32,
  },
  qrFrame: {
    padding: 12,
    borderRadius: 24,
  },
  qrInner: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
  },
  qrVehicleInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrPlateText: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  qrOwnerName: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    marginTop: 4,
  },
  qrRefreshBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
  },
  qrRefreshText: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  // Web-style Usage Card (Dashboard)
  webStyleUsageCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  webStyleHeader: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "#475569",
    marginBottom: 24,
    textAlign: "center",
  },
  webGaugeWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  webGaugeBase: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 8,
    borderColor: "#e2e8f0",
  },
  webGaugeProgress: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: "#059669",
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
  },
  webGaugeFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: "#059669",
  },
  webGaugeInner: { alignItems: "center" },
  webGaugeValue: {
    fontSize: 48,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#064e3b",
    lineHeight: 56,
  },
  webGaugeUnit: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "#64748b",
  },
  webQuotaSection: {
    width: "100%",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  webQuotaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  webQuotaLabel: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#475569",
  },
  webQuotaStats: {
    fontSize: 16,
    fontFamily: "NotoSerifBengali_700Bold",
    color: "#10b981",
  },
  webProgressBar: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 12,
  },
  webProgressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 5,
  },
  webRenewalText: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_400Regular",
    color: "#94a3b8",
    textAlign: "center",
  },
  // Profile Screen Styles
  profileHeaderMinimal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  minimalHeaderTitleText: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  profileHeaderSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  profileAvatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryContainer + "30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary + "40",
  },
  avatarInitial: {
    fontSize: 32,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  verifiedIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileNameMain: {
    fontSize: 20,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  verifiedLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  verifiedLabelText: {
    fontSize: 12,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.primary,
  },
  profileGroup: {
    backgroundColor: "#fff",
    marginBottom: 8,
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
    paddingBottom: 4,
  },
  profileGroupTitle: {
    fontSize: 13,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  profileCardFull: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: "hidden",
  },
  profileRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconBoxGray: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    fontFamily: "NotoSerifBengali_400Regular",
    color: COLORS.secondary,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "NotoSerifBengali_700Bold",
    color: COLORS.onSurface,
  },
  // Profile Documents
  docsRowFlat: { gap: 12, paddingBottom: 8 },
  docItemFlat: { alignItems: "center", width: 100 },
  realDocImg: { width: 100, height: 70, borderRadius: 10, resizeMode: "cover" },
  docImgPlaceholder: { width: 100, height: 70, borderRadius: 10, backgroundColor: COLORS.surfaceContainerLowest },
  docLabelFlat: { fontSize: 11, fontFamily: "NotoSerifBengali_400Regular", color: COLORS.secondary, marginTop: 6, textAlign: "center" },
  logoutBtnProfile: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, marginHorizontal: SPACING.lg, padding: 16, borderRadius: 14, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fee2e2" },
  logoutTextProfile: { fontSize: 16, fontFamily: "NotoSerifBengali_700Bold", color: "#ef4444" },
  // Map Screen
  mapContainer: { flex: 1, backgroundColor: "#f1f5f9" },
  mapViewFull: { flex: 1 },
  userLocationDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary + "30", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.primary },
  userLocationInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  customMarkerContainer: { alignItems: "center" },
  markerIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  markerDistanceBox: { backgroundColor: "#1e293b", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  markerDistanceText: { fontSize: 10, fontFamily: "NotoSerifBengali_700Bold", color: "#fff" },
  mapSearchFloating: { position: "absolute", top: 60, left: 16, right: 16, backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  mapSearchText: { fontSize: 14, fontFamily: "NotoSerifBengali_400Regular", color: COLORS.secondary },
  stationPopupContainer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  popupHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 16 },
  popupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  popupTitle: { fontSize: 18, fontFamily: "NotoSerifBengali_700Bold", color: COLORS.onSurface, maxWidth: "70%" },
  popupSubRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  popupAddress: { fontSize: 13, fontFamily: "NotoSerifBengali_400Regular", color: COLORS.secondary },
  popupExpandBtn: { backgroundColor: COLORS.surfaceContainerLowest, padding: 8, borderRadius: 10 },
  fuelStatusRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  fuelStatusCard: { flex: 1, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#bbf7d0" },
  fuelStatusCardEmpty: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  fuelTypeName: { fontSize: 11, fontFamily: "NotoSerifBengali_700Bold", color: COLORS.secondary, marginBottom: 4 },
  fuelStatusText: { fontSize: 12, fontFamily: "NotoSerifBengali_700Bold", color: "#059669" },
  fuelStatusTextEmpty: { color: "#ef4444" },
  directionsBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14 },
  directionsBtnText: { fontSize: 16, fontFamily: "NotoSerifBengali_700Bold", color: "#fff" },
  // QR Modal Compact
  qrModalContentCompact: { backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, alignItems: "center" },
  closeModalBtnMinimal: { alignSelf: "flex-end", padding: 8, borderRadius: 20, backgroundColor: COLORS.surfaceContainerLowest },
  qrHeaderCompact: { alignItems: "center", marginBottom: 20 },
  qrTitleCompact: { fontSize: 20, fontFamily: "NotoSerifBengali_700Bold", color: COLORS.onSurface },
  qrSubTitleCompact: { fontSize: 13, fontFamily: "NotoSerifBengali_400Regular", color: COLORS.secondary, marginTop: 4 },
  qrFrameCompact: { padding: 10, borderRadius: 20, backgroundColor: COLORS.primaryContainer + "20", marginBottom: 20 },
  qrInnerCompact: { backgroundColor: "#fff", padding: 12, borderRadius: 14 },
  qrVehicleCardCompact: { width: "100%", alignItems: "center", marginTop: 8 },
  qrVehicleLabelCompact: { fontSize: 11, fontFamily: "NotoSerifBengali_400Regular", color: COLORS.secondary, marginBottom: 4 },
  qrPlateCompact: { fontSize: 22, fontFamily: "NotoSerifBengali_700Bold", color: COLORS.onSurface },
  qrVerifiedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "#f0fdf4", borderRadius: 12 },
  qrVerifiedText: { fontSize: 13, fontFamily: "NotoSerifBengali_700Bold", color: "#059669" },
  qrCloseButtonCompact: { width: "100%", alignItems: "center", paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 16, marginTop: 16 },
  qrCloseButtonText: { fontSize: 16, fontFamily: "NotoSerifBengali_700Bold", color: "#fff" },
});