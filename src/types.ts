/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LandmarkCategory = 'coffee' | 'store' | 'exit' | 'driver' | 'atm' | 'toilet' | 'restaurant' | 'gate' | 'other';

export interface Landmark360 {
  id: string;
  name: string;
  angleDeg: number; // 0 to 360 degrees
  distance: string; // e.g., "12m", "50m"
  category: LandmarkCategory;
  description?: string;
}

export interface ExitPoint {
  id: string;
  name: string;
  coords: { x: number; y: number }; // 0-100 percentage layout
}

export interface PickupHub {
  id: string;
  name: string;
  landmark: string;
  walkingTimeSec: number;
  distanceMeters: number;
  instructions: string[];
  accessibilityFriendly: boolean;
  coords: { x: number; y: number }; // 0-100 percentage layout
  capacityStatus: 'low' | 'moderate' | 'busy';
}

export interface DriverState {
  name: string;
  rating: number;
  car: string;
  plate: string;
  phone: string;
  coords: { x: number; y: number }; // 0-100 percentage layout
  etaSeconds: number;
  bearing: number; // 0-360 degrees
  avatarUrl: string;
}

export interface Scenario {
  id: string;
  name: string;
  type: 'airport' | 'railway' | 'mall' | 'office';
  description: string;
  locationName: string;
  exits: ExitPoint[];
  hubs: PickupHub[];
  landmarks360: Landmark360[];
  driver: DriverState;
}
