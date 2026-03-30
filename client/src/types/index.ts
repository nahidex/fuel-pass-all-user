export type VehicleType = "bike" | "car" | "truck";
export type UserRole = "owner" | "operator";

export interface User {
  id: number;
  fullName: string;
  mobileNumber: string;
  email?: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
}

export interface Vehicle {
  id: number;
  userId: number;
  district: string;
  series: string;
  number: string;
  type: VehicleType;
  model: string;
  color: string;
  engineNumber: string;
  carImageUrl?: string;
  plateImageUrl?: string;
  bluebookImageUrl?: string;
  createdAt?: string;
}

export interface FuelUsage {
  id: number;
  userId: number;
  vehicleId: number;
  amountLiters: number;
  priceTotal?: number;
  fuelType: string;
  pumpName: string;
  pumpLocation: string;
  paymentMethod: string;
  createdAt: string;
}

export interface Pump {
  id: number;
  name: string;
  location: string;
  availableFuel: number;
}
