import { useRows } from "@/lib/db";
import type { Building, Property, Room, Tenant } from "@/lib/types";

export function useProperties() {
  return useRows<Property>("properties", {
    filters: [{ col: "archived", value: false }],
    order: { col: "name", asc: true },
  });
}

export function useBuildings(propertyId?: string) {
  return useRows<Building>("buildings", {
    select: "*, properties(name)",
    filters: propertyId ? [{ col: "property_id", value: propertyId }] : [],
    order: { col: "name", asc: true },
  });
}

export function useRoomsList(filters: { propertyId?: string | undefined; buildingId?: string | undefined } = {}) {
  return useRows<Room>("rooms", {
    select: "*, buildings(name), properties(name)",
    filters: [
      { col: "property_id", value: filters.propertyId },
      { col: "building_id", value: filters.buildingId },
    ],
    order: { col: "room_number", asc: true },
  });
}

export function useTenantsList() {
  return useRows<Tenant>("tenants", {
    filters: [{ col: "archived", value: false }],
    order: { col: "full_name", asc: true },
  });
}
