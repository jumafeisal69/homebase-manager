export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          description: string | null
          entity: string
          entity_id: string | null
          id: string
          owner_id: string
        }
        Insert: {
          action: string
          actor_id?: string
          created_at?: string
          description?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          owner_id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          description?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          owner_id?: string
        }
        Relationships: []
      }
      buildings: {
        Row: {
          building_number: string | null
          created_at: string
          description: string | null
          floors: number
          id: string
          is_demo: boolean
          name: string
          owner_id: string
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          building_number?: string | null
          created_at?: string
          description?: string | null
          floors?: number
          id?: string
          is_demo?: boolean
          name: string
          owner_id?: string
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          building_number?: string | null
          created_at?: string
          description?: string | null
          floors?: number
          id?: string
          is_demo?: boolean
          name?: string
          owner_id?: string
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          deposit: number
          document_url: string | null
          end_date: string
          id: string
          is_demo: boolean
          monthly_rent: number
          notes: string | null
          owner_id: string
          property_id: string
          room_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deposit?: number
          document_url?: string | null
          end_date: string
          id?: string
          is_demo?: boolean
          monthly_rent?: number
          notes?: string | null
          owner_id?: string
          property_id: string
          room_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          deposit?: number
          document_url?: string | null
          end_date?: string
          id?: string
          is_demo?: boolean
          monthly_rent?: number
          notes?: string | null
          owner_id?: string
          property_id?: string
          room_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      electricity_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_demo: boolean
          meter_number: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          owner_id: string
          property_id: string
          purchase_date: string
          receipt_number: string
          receipt_url: string | null
          reference: string | null
          room_id: string | null
          source: Database["public"]["Enums"]["txn_source"]
          tenant_id: string | null
          token: string | null
          units: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_demo?: boolean
          meter_number?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          property_id: string
          purchase_date?: string
          receipt_number?: string
          receipt_url?: string | null
          reference?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["txn_source"]
          tenant_id?: string | null
          token?: string | null
          units?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          meter_number?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          property_id?: string
          purchase_date?: string
          receipt_number?: string
          receipt_url?: string | null
          reference?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["txn_source"]
          tenant_id?: string | null
          token?: string | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "electricity_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electricity_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electricity_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          expense_date: string
          id: string
          is_demo: boolean
          notes: string | null
          owner_id: string
          property_id: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          expense_date?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          owner_id?: string
          property_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          expense_date?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          owner_id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          admin_notes: string | null
          category: Database["public"]["Enums"]["maintenance_category"]
          completed_at: string | null
          cost: number
          created_at: string
          description: string
          id: string
          is_demo: boolean
          owner_id: string
          photo_url: string | null
          priority: Database["public"]["Enums"]["maintenance_priority"]
          property_id: string
          receipt_url: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          technician: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          completed_at?: string | null
          cost?: number
          created_at?: string
          description: string
          id?: string
          is_demo?: boolean
          owner_id: string
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          property_id: string
          receipt_url?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          technician?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          completed_at?: string | null
          cost?: number
          created_at?: string
          description?: string
          id?: string
          is_demo?: boolean
          owner_id?: string
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          property_id?: string
          receipt_url?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          technician?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_demo?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          archived: boolean
          created_at: string
          description: string | null
          district: string | null
          id: string
          is_demo: boolean
          name: string
          owner_id: string
          region: string | null
          status: string
          street: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          is_demo?: boolean
          name: string
          owner_id?: string
          region?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          owner_id?: string
          region?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      property_managers: {
        Row: {
          can_edit: boolean
          created_at: string
          id: string
          owner_id: string
          property_id: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          created_at?: string
          id?: string
          owner_id?: string
          property_id: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          created_at?: string
          id?: string
          owner_id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_managers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_charges: {
        Row: {
          amount: number
          amount_paid: number
          created_at: string
          due_date: string
          id: string
          is_demo: boolean
          notes: string | null
          owner_id: string
          period_month: string
          property_id: string
          room_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          created_at?: string
          due_date: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          owner_id?: string
          period_month: string
          property_id: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          created_at?: string
          due_date?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          owner_id?: string
          period_month?: string
          property_id?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_charges_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_charges_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          charge_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          owner_id: string
          payment_date: string
          property_id: string
          receipt_number: string
          reference: string | null
          room_id: string | null
          source: Database["public"]["Enums"]["txn_source"]
          tenant_id: string
        }
        Insert: {
          amount: number
          charge_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          payment_date?: string
          property_id: string
          receipt_number?: string
          reference?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["txn_source"]
          tenant_id: string
        }
        Update: {
          amount?: number
          charge_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          payment_date?: string
          property_id?: string
          receipt_number?: string
          reference?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["txn_source"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "rent_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          building_id: string
          created_at: string
          deposit_amount: number
          electricity_meter: string | null
          floor: number
          id: string
          is_demo: boolean
          monthly_rent: number
          owner_id: string
          property_id: string
          room_number: string
          room_type: string | null
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
          water_meter: string | null
        }
        Insert: {
          building_id: string
          created_at?: string
          deposit_amount?: number
          electricity_meter?: string | null
          floor?: number
          id?: string
          is_demo?: boolean
          monthly_rent?: number
          owner_id?: string
          property_id: string
          room_number: string
          room_type?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          water_meter?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string
          deposit_amount?: number
          electricity_meter?: string | null
          floor?: number
          id?: string
          is_demo?: boolean
          monthly_rent?: number
          owner_id?: string
          property_id?: string
          room_number?: string
          room_type?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          water_meter?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          currency: string
          default_due_day: number
          grace_period_days: number
          notify_contracts: boolean
          notify_maintenance: boolean
          notify_rent: boolean
          owner_id: string
          updated_at: string
        }
        Insert: {
          currency?: string
          default_due_day?: number
          grace_period_days?: number
          notify_contracts?: boolean
          notify_maintenance?: boolean
          notify_rent?: boolean
          owner_id?: string
          updated_at?: string
        }
        Update: {
          currency?: string
          default_due_day?: number
          grace_period_days?: number
          notify_contracts?: boolean
          notify_maintenance?: boolean
          notify_rent?: boolean
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_assignments: {
        Row: {
          created_at: string
          deposit: number
          deposit_refunded: number | null
          id: string
          is_active: boolean
          is_demo: boolean
          monthly_rent: number
          move_in_date: string
          move_out_date: string | null
          move_out_notes: string | null
          owner_id: string
          property_id: string
          room_id: string
          start_meter_electricity: string | null
          start_meter_water: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deposit?: number
          deposit_refunded?: number | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          monthly_rent?: number
          move_in_date?: string
          move_out_date?: string | null
          move_out_notes?: string | null
          owner_id?: string
          property_id: string
          room_id: string
          start_meter_electricity?: string | null
          start_meter_water?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          deposit?: number
          deposit_refunded?: number | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          monthly_rent?: number
          move_in_date?: string
          move_out_date?: string | null
          move_out_notes?: string | null
          owner_id?: string
          property_id?: string
          room_id?: string
          start_meter_electricity?: string | null
          start_meter_water?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          archived: boolean
          created_at: string
          date_joined: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gender: string | null
          id: string
          is_demo: boolean
          national_id: string | null
          owner_id: string
          phone: string | null
          photo_url: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean
          created_at?: string
          date_joined?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_demo?: boolean
          national_id?: string | null
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean
          created_at?: string
          date_joined?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_demo?: boolean
          national_id?: string | null
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_demo: boolean
          meter_number: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          owner_id: string
          payment_date: string
          property_id: string
          receipt_number: string
          receipt_url: string | null
          reference: string | null
          room_id: string | null
          source: Database["public"]["Enums"]["txn_source"]
          tenant_id: string | null
          units: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_demo?: boolean
          meter_number?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          payment_date?: string
          property_id: string
          receipt_number?: string
          receipt_url?: string | null
          reference?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["txn_source"]
          tenant_id?: string | null
          units?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          meter_number?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          owner_id?: string
          payment_date?: string
          property_id?: string
          receipt_number?: string
          receipt_url?: string | null
          reference?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["txn_source"]
          tenant_id?: string | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manages_property: { Args: { _property_id: string }; Returns: boolean }
      my_tenant_id: { Args: never; Returns: string }
      recalc_charge: { Args: { _charge_id: string }; Returns: undefined }
      refresh_overdue: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "manager" | "tenant"
      contract_status: "active" | "expiring_soon" | "expired" | "terminated"
      maintenance_category:
        | "electricity"
        | "water"
        | "plumbing"
        | "door"
        | "window"
        | "internet"
        | "security"
        | "other"
      maintenance_priority: "low" | "medium" | "high" | "urgent"
      maintenance_status:
        | "submitted"
        | "accepted"
        | "in_progress"
        | "completed"
        | "rejected"
      payment_method: "cash" | "bank" | "mobile_money" | "other"
      payment_status: "paid" | "partially_paid" | "pending" | "overdue"
      room_status: "vacant" | "occupied" | "reserved" | "maintenance"
      tenant_status: "active" | "pending" | "moved_out" | "suspended"
      txn_source: "manual" | "api"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "tenant"],
      contract_status: ["active", "expiring_soon", "expired", "terminated"],
      maintenance_category: [
        "electricity",
        "water",
        "plumbing",
        "door",
        "window",
        "internet",
        "security",
        "other",
      ],
      maintenance_priority: ["low", "medium", "high", "urgent"],
      maintenance_status: [
        "submitted",
        "accepted",
        "in_progress",
        "completed",
        "rejected",
      ],
      payment_method: ["cash", "bank", "mobile_money", "other"],
      payment_status: ["paid", "partially_paid", "pending", "overdue"],
      room_status: ["vacant", "occupied", "reserved", "maintenance"],
      tenant_status: ["active", "pending", "moved_out", "suspended"],
      txn_source: ["manual", "api"],
    },
  },
} as const
