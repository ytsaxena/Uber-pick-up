import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'airport-t3',
    name: 'Delhi Airport Terminal 3',
    locationName: 'Indira Gandhi International Airport (T3)',
    type: 'airport',
    description: 'Multi-layered arrival exits with heavy car lanes, taxi zones, and private pickup areas. Highly confusing column numbering.',
    exits: [
      { id: 'exit-1', name: 'Exit Gate 1 (Domestics)', coords: { x: 15, y: 80 } },
      { id: 'exit-2', name: 'Exit Gate 2 (All-Arrivals)', coords: { x: 45, y: 80 } },
      { id: 'exit-3', name: 'Exit Gate 3 (International)', coords: { x: 75, y: 80 } },
    ],
    hubs: [
      {
        id: 'hub-a',
        name: 'Smart Hub Spot A (Lane 1, Pillar 10)',
        landmark: 'Pillar 10, Zone Orange',
        walkingTimeSec: 35,
        distanceMeters: 28,
        instructions: [
          'Walk out of Exit Gate 1.',
          'Cross the pedestrian lane toward Lane 1.',
          'Pillar 10 will be directly on your right under the orange signage.'
        ],
        accessibilityFriendly: true,
        coords: { x: 18, y: 40 },
        capacityStatus: 'low'
      },
      {
        id: 'hub-b',
        name: 'Smart Hub Spot B (Lane 2, Pillar 16)',
        landmark: 'Pillar 16, Zone Blue',
        walkingTimeSec: 65,
        distanceMeters: 55,
        instructions: [
          'Walk out of Exit Gate 2 or 3.',
          'Walk straight across the first zebra crossing.',
          'Turn right and proceed and walk 30 meters to Pillar 16.'
        ],
        accessibilityFriendly: true,
        coords: { x: 50, y: 35 },
        capacityStatus: 'busy'
      },
      {
        id: 'hub-c',
        name: 'Smart Hub Spot C (Lane 3, Accessible)',
        landmark: 'Pillar 12 ACC, ramps present',
        walkingTimeSec: 90,
        distanceMeters: 75,
        instructions: [
          'Walk out of Exit Gate 3.',
          'Use the wheelchair-accessible ramp on the far left floor.',
          'Cross toward Lane 3, Spot 12.'
        ],
        accessibilityFriendly: true,
        coords: { x: 82, y: 30 },
        capacityStatus: 'moderate'
      }
    ],
    landmarks360: [
      { id: 'lm-starbucks', name: 'Starbucks Arrivals Coffee', angleDeg: 35, distance: '12m', category: 'coffee', description: 'Just outside Exit Gate 1' },
      { id: 'lm-exchange', name: 'Western Union Exchange Counter', angleDeg: 110, distance: '18m', category: 'store', description: 'Next to Exit Gate 2' },
      { id: 'lm-atm', name: 'SBI Bank ATM Lobby', angleDeg: 195, distance: '8m', category: 'atm', description: 'Right beside Exit Gate 3 exit path' },
      { id: 'lm-exit3', name: 'Arrival Gate 3 Vault Doors', angleDeg: 240, distance: '15m', category: 'exit', description: 'Main international passenger gate' },
      { id: 'lm-uber-sign', name: 'Bright Orange Banner (Hub A Pillar 10)', angleDeg: 45, distance: '25m', category: 'gate', description: 'Uber smart spot identifier' },
      { id: 'lm-toilet', name: 'Arrivals Restrooms Side Corridor', angleDeg: 320, distance: '20m', category: 'toilet', description: 'Behind the check-in queue' }
    ],
    driver: {
      name: 'Rahul Kumar',
      rating: 4.88,
      car: 'White Suzuki Dzire',
      plate: 'DL 1C AB 4296',
      phone: '+91 98101-XXXXX',
      coords: { x: 10, y: 15 },
      etaSeconds: 150,
      bearing: 160,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'railway-station',
    name: 'New Delhi Railway Station (NDLS)',
    locationName: 'New Delhi Railway Station (Exit Gate 1 Plaza)',
    type: 'railway',
    description: 'Extremely high passenger density, multiple platforms, baggage loaders, and narrow auto-rickshaw lanes.',
    exits: [
      { id: 'rail-exit-east', name: 'Pahar Ganj Exit Gate 1', coords: { x: 20, y: 80 } },
      { id: 'rail-exit-west', name: 'Ajmeri Gate Exit Gate 2', coords: { x: 80, y: 80 } },
    ],
    hubs: [
      {
        id: 'rail-hub-1',
        name: 'Express Hub Corner (Platform 1 Exit Plaza)',
        landmark: 'Zone Alpha, Metro Canopy Entrance',
        walkingTimeSec: 40,
        distanceMeters: 30,
        instructions: [
          'Pass through the ticket scanning turnstiles.',
          'Take a prompt left at the escalators.',
          'Assemble under the large yellow LED Uber Logo.'
        ],
        accessibilityFriendly: true,
        coords: { x: 25, y: 40 },
        capacityStatus: 'busy'
      },
      {
        id: 'rail-hub-2',
        name: 'Smart Spot 2 (West Side Lane B)',
        landmark: 'Columns 4-6 near Clock Tower Parking',
        walkingTimeSec: 75,
        distanceMeters: 60,
        instructions: [
          'Follow the Ajmeri Gate exit overhead banners.',
          'Exit toward the parking deck on your right.',
          'Arrive at the covered shelter Spot B.'
        ],
        accessibilityFriendly: false,
        coords: { x: 70, y: 45 },
        capacityStatus: 'low'
      }
    ],
    landmarks360: [
      { id: 'lm-clock', name: 'NDLS Heritage Clock Tower', angleDeg: 10, distance: '45m', category: 'other', description: 'Historical visual landmark' },
      { id: 'lm-bookstall', name: 'Higginbothams Railway Bookshop', angleDeg: 95, distance: '6m', category: 'store', description: 'Next to Platform 1 exits' },
      { id: 'lm-police', name: 'Station Police Assistance Post', angleDeg: 160, distance: '14m', category: 'other', description: 'Security checkpoint' },
      { id: 'lm-tea', name: 'Chai Point kiosk stalls', angleDeg: 285, distance: '10m', category: 'restaurant', description: 'Aroma source near waiting room' }
    ],
    driver: {
      name: 'Manpreet Singh',
      rating: 4.92,
      car: 'Sleek Silver Hyundai Aura',
      plate: 'DL 3C CC 8812',
      phone: '+91 95604-XXXXX',
      coords: { x: 95, y: 20 },
      etaSeconds: 120,
      bearing: 210,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'mall-select',
    name: 'Select Citywalk Mall (Sakeet)',
    locationName: 'Select Citywalk Driveway & Underground B2',
    type: 'mall',
    description: 'Basement congestion, cellular signal drops, luxury valet lines, crowded ground floor plazas.',
    exits: [
      { id: 'mall-gate-north', name: 'Main Dome Rotunda Exit', coords: { x: 50, y: 85 } },
      { id: 'mall-gate-basement', name: 'Escalator B1 Parking Shaft', coords: { x: 15, y: 85 } },
    ],
    hubs: [
      {
        id: 'mall-hub-1',
        name: 'Uber Smart Stop (Valet Circle)',
        landmark: 'Gate A Rotunda Outer Curb',
        walkingTimeSec: 25,
        distanceMeters: 20,
        instructions: [
          'Exit the heavy double doors at the main Central Dome.',
          'Walk around the central water fountain.',
          'You will see the illuminated Uber glass pod.'
        ],
        accessibilityFriendly: true,
        coords: { x: 52, y: 45 },
        capacityStatus: 'busy'
      },
      {
        id: 'mall-hub-2',
        name: 'Basement Bay B2 (Column G4)',
        landmark: 'Basement Parking Level -2, Row G',
        walkingTimeSec: 110,
        distanceMeters: 90,
        instructions: [
          'Take the elevators down to Parking B2.',
          'Turn left when exiting the elevator vestibule.',
          'Follow the green ceiling light rails to Column G4.'
        ],
        accessibilityFriendly: true,
        coords: { x: 20, y: 35 },
        capacityStatus: 'moderate'
      }
    ],
    landmarks360: [
      { id: 'lm-fountain', name: 'Grand Entrance Musical Fountain', angleDeg: 180, distance: '9m', category: 'other', description: 'Large dynamic bubbling water feature' },
      { id: 'lm-zara', name: 'Zara Flagship Entrance Glass', angleDeg: 20, distance: '14m', category: 'store', description: 'Visible from the ground exit' },
      { id: 'lm-valet', name: 'Valet Premium Key Counter', angleDeg: 90, distance: '12m', category: 'other', description: 'Next to taxi dispatch lane' }
    ],
    driver: {
      name: 'Amit Sharma',
      rating: 4.81,
      car: 'Maruti Ertiga (7-Seater)',
      plate: 'DL 9C Z 5012',
      phone: '+91 88021-XXXXX',
      coords: { x: 52, y: 10 },
      etaSeconds: 180,
      bearing: 180,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'office-cyber',
    name: 'DLF CyberCity (Building 10)',
    locationName: 'CyberCity Corporate Hub, Building 10 Entrance',
    type: 'office',
    description: 'Corporate building clusters with security bollards, private underground parking, and huge morning rush hour.',
    exits: [
      { id: 'off-gate-lobby', name: 'Tower B Main Revolving Lobby', coords: { x: 30, y: 80 } },
      { id: 'off-gate-skywalk', name: 'Metro Skywalk Footbridge Base', coords: { x: 75, y: 80 } },
    ],
    hubs: [
      {
        id: 'off-hub-1',
        name: 'Smart Spot Center (Lobby Roundabout)',
        landmark: 'Main Porch Pillars, Lane Black',
        walkingTimeSec: 20,
        distanceMeters: 15,
        instructions: [
          'Pass the Lobby RFID security gate.',
          'Walk directly out the main glass doors.',
          'Wait at the dedicated yellow ground markings near Pillar 2.'
        ],
        accessibilityFriendly: true,
        coords: { x: 35, y: 40 },
        capacityStatus: 'busy'
      },
      {
        id: 'off-hub-2',
        name: 'Express Hub Spot B (Outer Ring Road Gate)',
        landmark: 'Gate 2 Security Cabin exit',
        walkingTimeSec: 70,
        distanceMeters: 55,
        instructions: [
          'Take the escalator down to the outer courtyard.',
          'Walk toward Security Post Gate 2.',
          'The pickup booth is immediately next to the security barriers.'
        ],
        accessibilityFriendly: true,
        coords: { x: 78, y: 35 },
        capacityStatus: 'low'
      }
    ],
    landmarks360: [
      { id: 'lm-reception', name: 'Tower B Polished Marble Desk', angleDeg: 270, distance: '10m', category: 'other', description: 'Lobby central desk' },
      { id: 'lm-costa', name: 'Costa Coffee Express Kiosk', angleDeg: 40, distance: '8m', category: 'coffee', description: 'Office lunch break corner' },
      { id: 'lm-bollard', name: 'Pneumatic Security Bollards', angleDeg: 145, distance: '15m', category: 'other', description: 'Access control gate barrier' }
    ],
    driver: {
      name: 'Yogesh Dutt',
      rating: 4.95,
      car: 'Glossy Black Honda Amaze',
      plate: 'HR 26 BY 0098',
      phone: '+91 99990-XXXXX',
      coords: { x: 35, y: 15 },
      etaSeconds: 90,
      bearing: 10,
      avatarUrl: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=120&auto=format&fit=crop&q=80'
    }
  }
];
