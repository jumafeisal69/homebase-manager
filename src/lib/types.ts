export type AppRole = "admin" | "manager" | "tenant";
export type RoomStatus = "vacant" | "occupied" | "reserved" | "maintenance";
export type TenantStatus = "active" | "pending" | "moved_out" | "suspended";
export type PaymentStatus = "paid" | "partially_paid" | "pending" | "overdue";
export type PaymentMethod = "cash" | "bank" | "mobile_money" | "other";
export type ContractStatus = "active" | "expiring_soon" | "expired" | "terminated";
export type MaintenanceStatus = "submitted" | "accepted" | "in_progress" | "completed" | "rejected";
export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceCategory =
  | "electricity"
  | "water"
  | "plumbing"
  | "door"
  | "window"
  | "internet"
  | "security"
  | "other";

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  region: string | null;
  district: string | null;
  ward: string | null;
  street: string | null;
  description: string | null;
  status: string;
  is_demo: boolean;
  created_at: string;
}

export interface Building {
  id: string;
  owner_id: string;
  property_id: string;
  name: string;
  building_number: string | null;
  description: string | null;
  floors: number;
  status: string;
  is_demo: boolean;
  properties?: { name: string } | null;
}

export interface Room {
  id: string;
  owner_id: string;
  property_id: string;
  building_id: string;
  room_number: string;
  floor: number;
  room_type: string | null;
  monthly_rent: number;
  deposit_amount: number;
  electricity_meter: string | null;
  water_meter: string | null;
  status: RoomStatus;
  is_demo: boolean;
  buildings?: { name: string } | null;
  properties?: { name: string } | null;
}

export interface Tenant {
  id: string;
  owner_id: string;
  user_id: string | null;
  property_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  national_id: string | null;
  gender: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  address: string | null;
  photo_url: string | null;
  date_joined: string;
  status: TenantStatus;
  is_demo: boolean;
}

export interface Assignment {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string;
  tenant_id: string;
  move_in_date: string;
  move_out_date: string | null;
  monthly_rent: number;
  deposit: number;
  start_meter_electricity: string | null;
  start_meter_water: string | null;
  is_active: boolean;
  move_out_notes: string | null;
  deposit_refunded: number | null;
  tenants?: { full_name: string } | null;
  rooms?: { room_number: string; buildings?: { name: string } | null } | null;
}

export interface Contract {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit: number;
  status: ContractStatus;
  document_url: string | null;
  notes: string | null;
  tenants?: { full_name: string } | null;
  rooms?: { room_number: string } | null;
}

export interface RentCharge {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  tenant_id: string;
  period_month: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: PaymentStatus;
  notes: string | null;
  tenants?: { full_name: string } | null;
  rooms?: { room_number: string } | null;
}

export interface RentPayment {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  tenant_id: string;
  charge_id: string | null;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  receipt_number: string;
  tenants?: { full_name: string } | null;
  rooms?: { room_number: string } | null;
}

export interface UtilityTxn {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  tenant_id: string | null;
  meter_number: string | null;
  amount: number;
  units: number | null;
  reference: string | null;
  method: PaymentMethod;
  notes: string | null;
  receipt_number: string;
  source: "manual" | "api";
  purchase_date?: string;
  payment_date?: string;
  token?: string | null;
  tenants?: { full_name: string } | null;
  rooms?: { room_number: string } | null;
}

export interface MaintenanceRequest {
  id: string;
  owner_id: string;
  property_id: string;
  room_id: string | null;
  tenant_id: string | null;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  photo_url: string | null;
  technician: string | null;
  admin_notes: string | null;
  cost: number;
  completed_at: string | null;
  created_at: string;
  tenants?: { full_name: string } | null;
  rooms?: { room_number: string } | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  kind: string;
  is_read: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  owner_id: string;
  property_id: string | null;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}
