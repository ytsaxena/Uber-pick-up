/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SCENARIOS } from './scenariosData';
import { Scenario, PickupHub, ExitPoint, Landmark360 } from './types';
import {
  Map,
  Compass,
  Eye,
  Navigation,
  User,
  Car,
  Info,
  Phone,
  Shield,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  RotateCcw,
  MessageSquare,
  MapPin,
  Accessibility,
  ChevronRight,
  ArrowRight,
  Sliders,
  HelpCircle,
  X,
  Send,
  SlidersHorizontal,
  ThumbsUp,
  Share2,
  Lock,
  Wifi,
  Signal,
  BatteryCharging
} from 'lucide-react';

export default function App() {
  // Scenario and Hub selections
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('airport-t3');
  const scenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];
  
  const [selectedHubId, setSelectedHubId] = useState<string>(scenario.hubs[0]?.id || '');
  const [selectedExitId, setSelectedExitId] = useState<string>(scenario.exits[0]?.id || '');

  // Keep hub in sync when scenario changes
  useEffect(() => {
    setSelectedHubId(scenario.hubs[0]?.id || '');
    setSelectedExitId(scenario.exits[0]?.id || '');
  }, [selectedScenarioId]);

  const selectedHub = scenario.hubs.find(h => h.id === selectedHubId) || scenario.hubs[0];
  const selectedExit = scenario.exits.find(e => e.id === selectedExitId) || scenario.exits[0];

  // Mobile App Internal Tab Control
  const [activeInternalTab, setActiveInternalTab] = useState<'blueprint' | 'pano' | 'ar' | 'chat'>('blueprint');

  // Interactive 360 View State
  const [panAngle, setPanAngle] = useState<number>(180); // Default direction
  const isDraggingPano = useRef(false);
  const startDragX = useRef(0);
  const startDragAngle = useRef(0);

  // Simulated Driver approach states
  const [simOn, setSimOn] = useState<boolean>(false);
  const [simEta, setSimEta] = useState<number>(scenario.driver.etaSeconds);
  const [driverPos, setDriverPos] = useState<{ x: number; y: number }>(scenario.driver.coords);
  const [simCompleted, setSimCompleted] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // Speed multiplier

  // Keep driver start position updated when scenario changes / sim reset
  useEffect(() => {
    if (!simOn) {
      setDriverPos(scenario.driver.coords);
      setSimEta(scenario.driver.etaSeconds);
      setSimCompleted(false);
    }
  }, [selectedScenarioId, selectedHubId, simOn]);

  // AI Assistant Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot' | 'system'; text: string }>>([
    {
      sender: 'bot',
      text: "👋 Hi there! I'm your Uber Smart Pickup Co-pilot. I can guide you precisely from your exit column to your designated spot. Need terminal directions, shop lookups, or accessible path assistance?"
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // PM Case Study state controls
  const [activePMTab, setActivePMTab] = useState<'deck' | 'metrics' | 'personas'>('deck');
  const [monthlyTripsSlider, setMonthlyTripsSlider] = useState<number>(350000); // For Delhi-NCR simulation
  const [modelApproved, setModelApproved] = useState<boolean>(false);

  // Dynamic system clock for dynamic iPhone status headers
  const [systemTime, setSystemTime] = useState<string>('07:15');
  const [batteryCharge, setBatteryCharge] = useState<number>(84);

  useEffect(() => {
    // Sync time
    const tick = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setSystemTime(`${hrs}:${mins}`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simple battery discharge simulation for playfulness
  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setBatteryCharge(prev => {
        if (prev <= 10) return 92; // cycle back
        return prev - 1;
      });
    }, 180000);
    return () => clearInterval(batteryInterval);
  }, []);

  // Physics animation logic for the approaching driver on 2D Blueprint Map
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (simOn) {
      const initialEta = scenario.driver.etaSeconds;
      const startCoords = scenario.driver.coords;
      const destCoords = selectedHub.coords;

      timerId = setInterval(() => {
        setSimEta(prev => {
          const nextEta = Math.max(0, prev - (2 * simSpeed));
          
          // Calculate movement percentage
          const pct = 1 - (nextEta / initialEta);
          const movingX = startCoords.x + (destCoords.x - startCoords.x) * pct;
          const movingY = startCoords.y + (destCoords.y - startCoords.y) * pct;
          setDriverPos({ x: movingX, y: movingY });

          if (nextEta <= 0) {
            setSimOn(false);
            setSimCompleted(true);
            if (timerId) clearInterval(timerId);
            // push system chat update
            setChatMessages(msgs => [
              ...msgs,
              { sender: 'system', text: `🚖 ${scenario.driver.name} has arrived at ${selectedHub.name}. Let's look through your 360-View to spot them!` }
            ]);
            return 0;
          }
          return nextEta;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [simOn, selectedHubId, selectedScenarioId, simSpeed]);

  // Real-time calculation of relative bearing from Selected Hub to the Driver
  // This helps place the Car overlay at the mathematically correct angle inside 360 Pano!
  const dx = driverPos.x - selectedHub.coords.x;
  const dy = driverPos.y - selectedHub.coords.y;
  let driverBearing = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (driverBearing < 0) driverBearing += 360;

  // Calculate distance in meters dynamically
  const distanceMultiplier = 2.5; // Scale mapping coords distance to meters
  const deltaX = driverPos.x - selectedHub.coords.x;
  const deltaY = driverPos.y - selectedHub.coords.y;
  const driverDistanceMeters = Math.round(Math.sqrt(deltaX * deltaX + deltaX * deltaY) * distanceMultiplier);

  // Panoramic drag handler
  const handlePanoMouseDown = (e: React.MouseEvent) => {
    isDraggingPano.current = true;
    startDragX.current = e.clientX;
    startDragAngle.current = panAngle;
  };

  const handlePanoMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPano.current) return;
    const deltaX = e.clientX - startDragX.current;
    // Map horizontal pixel dragging to degrees logic
    const angleChange = deltaX * 0.4;
    let newAngle = (startDragAngle.current - angleChange) % 360;
    if (newAngle < 0) newAngle += 360;
    setPanAngle(newAngle);
  };

  const handlePanoMouseUpOrLeave = () => {
    isDraggingPano.current = false;
  };

  // Touch handlers for mobile preview screens
  const handlePanoTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingPano.current = true;
      startDragX.current = e.touches[0].clientX;
      startDragAngle.current = panAngle;
    }
  };

  const handlePanoTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingPano.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startDragX.current;
    const angleChange = deltaX * 0.4;
    let newAngle = (startDragAngle.current - angleChange) % 360;
    if (newAngle < 0) newAngle += 360;
    setPanAngle(newAngle);
  };

  // Helper calculation to check if landmark/driver is inside 360 viewport fov (100deg visible)
  const calculateLandmarkXPercent = (targetAngle: number): number | null => {
    let diff = targetAngle - panAngle;
    // Normalize to -180 to 180 range
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    const fov = 100; // Field of view angle degrees
    if (Math.abs(diff) <= fov / 2) {
      // Return 0-100% position on layout from left to right
      return 50 + (diff / (fov / 2)) * 50;
    }
    return null;
  };

  // Wide panning calculation for multi-degree physical buildings/elements
  const calculateWideXPercent = (targetAngle: number, spanDeg = 65): number | null => {
    let diff = targetAngle - panAngle;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    const maxDiff = 50 + spanDeg / 2;
    if (Math.abs(diff) <= maxDiff) {
      return 50 + (diff / 50) * 50;
    }
    return null;
  };

  // Chat message scroller
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);

  // Handle server-side Gemini AI API Assistant calls
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || aiLoading) return;

    // Display user bubble
    const userMsg = { sender: 'user' as const, text: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setAiLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          scenarioContext: {
            locationName: scenario.locationName,
            type: scenario.type,
            exits: scenario.exits,
            hubs: scenario.hubs,
            landmarks360: scenario.landmarks360,
            driver: scenario.driver,
            selectedHub: selectedHub,
            selectedExit: selectedExit
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "⚠️ Sorry, I ran into a connectivity issue. Please ensure the backend server is running and your GEMINI_API_KEY secret is configured. In the meantime, stick to the mapped columns: Pillar 10 or Zone Blue are fully safe!"
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Safe visual styling for capacity badges
  const getCapacityColor = (status: 'low' | 'moderate' | 'busy') => {
    switch (status) {
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'moderate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'busy': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  // Sizing metrics computations based on user configuration
  const baseFrictionLossMinutes = 8.5; // Average pickup delay in busy zones
  const estimatedCostPerCommuteMinute = 6.2; // Rupees/sec or currency friction
  const totalWastedHours = Math.round((monthlyTripsSlider * (baseFrictionLossMinutes * 0.45)) / 60);
  const potentialSavingsVal = Math.round(monthlyTripsSlider * (baseFrictionLossMinutes * 0.6) * estimatedCostPerCommuteMinute / 10).toLocaleString('en-IN');

  const scenarioExitsCount = scenario.exits.length;
  const scenarioHubsCount = scenario.hubs.length;

  const type = scenario.type;
  
  // Wide angles for custom 3D structures (stops popping at screen boundaries)
  const xCelestial = calculateWideXPercent(type === 'airport' ? 280 : type === 'railway' ? 85 : type === 'mall' ? 130 : 210, 20);
  
  // Panning atmospheric clouds coordinates
  const xCl1 = calculateWideXPercent(45, 30);
  const xCl2 = calculateWideXPercent(165, 30);
  const xCl3 = calculateWideXPercent(285, 30);

  // Panning distant skyline city buildings coordinates
  const xSky1 = calculateWideXPercent(30, 40);
  const xSky2 = calculateWideXPercent(90, 40);
  const xSky3 = calculateWideXPercent(150, 40);
  const xSky4 = calculateWideXPercent(210, 40);
  const xSky5 = calculateWideXPercent(270, 40);
  const xSky6 = calculateWideXPercent(330, 40);

  // Panning ground elements coordinates
  const xLane1 = calculateWideXPercent(0, 10);
  const xLane2 = calculateWideXPercent(60, 10);
  const xLane3 = calculateWideXPercent(120, 10);
  const xLane4 = calculateWideXPercent(180, 10);
  const xLane5 = calculateWideXPercent(240, 10);
  const xLane6 = calculateWideXPercent(300, 10);

  // Main 3D structures panning coordinates
  const xAirportTerminal = calculateWideXPercent(50, 120);
  const xAirportBridge = calculateWideXPercent(145, 45);
  const xAirportTower = calculateWideXPercent(185, 20);
  const xAirportParking = calculateWideXPercent(255, 100);
  const xAirportLamp1 = calculateWideXPercent(315, 10);
  const xAirportLamp2 = calculateWideXPercent(350, 10);

  const xRailwayStation = calculateWideXPercent(55, 115);
  const xRailwayClock = calculateWideXPercent(10, 20);
  const xRailwayTruss = calculateWideXPercent(135, 80);
  const xRailwayChai = calculateWideXPercent(195, 45);
  const xRailwaySignal = calculateWideXPercent(265, 15);
  const xRailwayBenches = calculateWideXPercent(330, 40);

  const xMallDome = calculateWideXPercent(60, 95);
  const xMallZara = calculateWideXPercent(15, 40);
  const xMallWatch = calculateWideXPercent(105, 40);
  const xMallFountain = calculateWideXPercent(180, 55);
  const xMallValet = calculateWideXPercent(120, 45);
  const xMallGlobe1 = calculateWideXPercent(295, 15);
  const xMallGlobe2 = calculateWideXPercent(340, 15);

  const xOfficeCyber = calculateWideXPercent(45, 125);
  const xOfficePorch = calculateWideXPercent(10, 40);
  const xOfficeSecurity = calculateWideXPercent(155, 30);
  const xOfficeCafe = calculateWideXPercent(195, 45);
  const xOfficeDirectory = calculateWideXPercent(270, 20);
  const xOfficePlanter1 = calculateWideXPercent(320, 20);
  const xOfficePlanter2 = calculateWideXPercent(350, 20);

  // Active Hub bearing for radar mapping
  const hubBearing = (() => {
    if (selectedHub.id.includes('hub-a') || selectedHub.id.includes('rail-hub-1') || selectedHub.id.includes('off-hub-1')) return 45;
    if (selectedHub.id.includes('hub-b') || selectedHub.id.includes('rail-hub-2') || selectedHub.id.includes('off-hub-2')) return 160;
    if (selectedHub.id.includes('hub-c')) return 240;
    if (selectedHub.id.includes('mall-hub-1')) return 180;
    return 90;
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-all">
      {/* Sleek Design Header from HTML blueprint */}
      <nav className="h-16 bg-black flex items-center justify-between px-8 shrink-0 shadow-lg select-none z-50">
        <div className="flex items-center gap-8">
          <div className="text-white font-black text-2xl tracking-tighter">Uber <span className="text-white/60 font-light text-sm tracking-wide ml-1">PROTOTYPE</span></div>
          <div className="h-6 w-px bg-white/20"></div>
          <div className="flex gap-6">
            <button className="text-white text-sm font-medium border-b-2 border-white pb-1">Smart Pickup</button>
            <button className="text-white/50 text-sm font-medium hover:text-white transition">Ride History</button>
            <button className="text-white/50 text-sm font-medium hover:text-white transition">Wallet</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">JD</span>
          </div>
        </div>
      </nav>

      {/* Main Grid Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-10">
        
        {/* LEFT COLUMN: Deep PM Case Deck & ROI Calculations (5 Cols in Excel terms) */}
        <section className="xl:col-span-6 flex flex-col space-y-6">
          
          {/* Header & Product Scope Brand */}
          <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black text-white mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> PM Core Sizing Assignment
            </span>
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-900 mb-2">
              Uber — Find My Ride
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Design solution prototypes solving physical pickup chaos in layered, high-congestion urban spaces. Featuring Designated Hub Stop allocation and dynamic 360° Surrounding Landmark perspective overlays.
            </p>
          </div>

          {/* PM Deck Navigation Tabs */}
          <div className="flex border border-slate-200 p-1 bg-slate-100 rounded-xl shadow-sm">
            <button
              onClick={() => setActivePMTab('deck')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activePMTab === 'deck'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" /> Feature Proposal
            </button>
            <button
              onClick={() => setActivePMTab('personas')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activePMTab === 'personas'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" /> Core Personas
            </button>
            <button
              onClick={() => setActivePMTab('metrics')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activePMTab === 'metrics'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Market Sizing / ROI
            </button>
          </div>

          {/* PM Tab Content */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 overflow-y-auto max-h-[640px] shadow-sm">
            
            {/* TAB 1: Proposal Deck */}
            {activePMTab === 'deck' && (
              <div className="space-y-6">
                
                {/* Visual Solution Synergy */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Two Solutions, One Integrated Synergistic Loop</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold mb-3 text-xs shadow-inner">01</div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Designated Smart Hubs</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Rather than placing pins anywhere on complex flyovers, we funnel commuter streams to geofenced, wheelchair-friendly "Smart Hub Columns" with distinct color bands and charging points.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold mb-3 text-xs shadow-inner">02</div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Cylinder 360° Landmark overlay</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Eliminates directional confusion. Riders pan their screen dynamically to line up real shops/exits, revealing the approaching driver's precise relative vector on top of those exact stores!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pain Points addressed */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Friction Diagnostics</h3>
                  <div className="space-y-3">
                    <div className="flex gap-4 text-xs leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-black font-extrabold whitespace-nowrap">"Where to stand?"</span>
                      <span className="text-slate-600">GPS signals jump under concrete levels (basements, arrivals). Riders are routed to unreachable lanes, prompting frantic phone calls.</span>
                    </div>
                    <div className="flex gap-4 text-xs leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-black font-extrabold whitespace-nowrap">"Will they find me?"</span>
                      <span className="text-slate-600">Drivers spend 8-12 idle minutes circling terminals, risking airport overstay penalties (up to ₹150+ in airports such as Delhi's T3) trying to spot waving hands.</span>
                    </div>
                    <div className="flex gap-4 text-xs leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-black font-extrabold whitespace-nowrap">Landmark Ambiguity</span>
                      <span className="text-slate-600">"I'm near Starbucks" — but there are 3 separate Starbucks counters on different tiers of the terminal! Our 360 compass anchors landmarks strictly in space.</span>
                    </div>
                  </div>
                </div>

                {/* Comps Analysis Table */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Competitive Comps & Gaps</h3>
                  <div className="overflow-x-auto border border-slate-205 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-black text-white font-bold">
                        <tr>
                          <th className="p-3">Company</th>
                          <th className="p-3">Existing System</th>
                          <th className="p-3">The Pickup Gap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Uber Standard</td>
                          <td className="p-3 text-slate-500">Curb pins & ETA trackers</td>
                          <td className="p-3 text-rose-600 font-medium">No spatial context or layered layout details</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Lyft</td>
                          <td className="p-3 text-slate-500">Exit selector listings</td>
                          <td className="p-3 text-rose-600 font-medium">Lacks immersive surrounding visual aids</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Grab</td>
                          <td className="p-3 text-slate-500">Mandatory doorway select</td>
                          <td className="p-3 text-rose-600 font-medium">No real-time dynamic path/pedestrian mapping</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Core Personas */}
            {activePMTab === 'personas' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Rider & Driver Target segments</h3>
                
                <div className="space-y-4">
                  {/* Persona 1 */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full border border-slate-300 overflow-hidden flex-shrink-0 bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80" alt="Rahul Persona" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">Rahul • High-Value Airport Business Traveler</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-black text-white">Frequency: High</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 font-display">"I just landed after an 8-hour flight with 2 suitcases. I cannot spend 15 minutes calling a driver to solve where Pillar 12 and Lane 2 match up on this curb."</p>
                      <div className="text-xs text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 inline-block">
                        <CheckCircle className="w-3.5 h-3.5" /> <strong>Dual-Symptom Value:</strong> Maps his exact door exit to the fastest low-density column, taking only 35s.
                      </div>
                    </div>
                  </div>

                  {/* Persona 2 */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full border border-slate-300 overflow-hidden flex-shrink-0 bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" alt="Mrs. Gupta Persona" className="w-full h-full object-cover animate-fade-in" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">Mrs. Gupta • Seniors / Low-Mobility Commuter</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-200 text-slate-800">Accessibility</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 font-display">"I have a bad knee. If the driver parks down a steep concrete staircase or down multi-tier parking without ramp exits, I'm completely stranded."</p>
                      <div className="text-xs text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 inline-block">
                        <CheckCircle className="w-3.5 h-3.5" /> <strong>Dual-Symptom Value:</strong> Real accessibility flags filter designated hubs directly with ramp and elevator paths.
                      </div>
                    </div>
                  </div>

                  {/* Persona 3 */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full border border-slate-300 overflow-hidden flex-shrink-0 bg-slate-100">
                      <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80" alt="Amit Driver Persona" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">Amit • Heavy-Traffic City Driver</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-black text-white">Efficiency</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 font-display">"Airport traffic cops fine us if we double-park for over 60 seconds on Lane 1. Standardizing stops means I park precisely, load the client in 20 seconds, and leave."</p>
                      <div className="text-xs text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 inline-block">
                        <CheckCircle className="w-3.5 h-3.5" /> <strong>Dual-Symptom Value:</strong> Decreases passenger loading cycle delay by 65%. Saves fine costs.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: Market Metrics */}
            {activePMTab === 'metrics' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* TAM SAM SOM */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Addressable Friction Market Sizing</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                      <div className="text-slate-400 text-[10px] font-bold mb-1">TAM (Global Users)</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">1.5B</div>
                      <div className="text-[9px] text-slate-500 font-medium mt-0.5">Total ride users</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                      <div className="text-slate-400 text-[10px] font-bold mb-1">SAM (Urban Cities)</div>
                      <div className="text-2xl font-black text-black font-mono">250M</div>
                      <div className="text-[9px] text-slate-500 font-medium mt-0.5">Major metro users</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center shadow-sm border-2 border-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold mb-1">SOM (Hub Trips)</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">50M</div>
                      <div className="text-[9px] text-slate-500 font-medium mt-0.5">Complex venues</div>
                    </div>
                  </div>
                </div>

                {/* ROI Savings Interactive Sliders */}
                <div className="bg-white border-2 border-black p-5 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Delhi-NCR Commute ROI Calculator</h4>
                    <span className="font-mono text-xs text-slate-500 font-bold">Configurable Scope</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Monthly trips across airports & malls:</span>
                      <span className="font-mono text-slate-900 font-bold">{monthlyTripsSlider.toLocaleString()} trips</span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="1000000"
                      step="50000"
                      value={monthlyTripsSlider}
                      onChange={(e) => setMonthlyTripsSlider(Number(e.target.value))}
                      className="w-full accent-black h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Friction Time Recovered</div>
                      <div className="text-2xl font-black text-slate-900 font-mono flex items-baseline gap-1 mt-0.5">
                        {totalWastedHours.toLocaleString()} <span className="text-xs text-slate-500">hours/mo</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Saves average commute time by 4 minutes per booking.</p>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Econ Platform Value (₹)</div>
                      <div className="text-2xl font-black text-emerald-700 font-mono flex items-baseline gap-1 mt-0.5">
                        ₹{potentialSavingsVal} <span className="text-xs text-emerald-600">/mo</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Based on reduced cancel overhead & efficiency multiplier.</p>
                    </div>
                  </div>
                </div>

                {/* Success Targets bar indicators */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">Key Performance Metric Impacts</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Rider Cancellation Rates</span>
                      <span className="text-slate-900 font-mono font-bold">-38%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-black h-full rounded-full" style={{ width: '38%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Rider Wait-time on Curbed Lanes</span>
                      <span className="text-slate-900 font-mono font-bold">-22%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-black h-full rounded-full" style={{ width: '22%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Driver Direct Calls & Coordination Span</span>
                      <span className="text-slate-900 font-mono font-bold">-65%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-black h-full rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Citation & Feedback Controls - NO margin slop indicated */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
              <span className="font-display">Product Hypothesis • Verified Sandbox</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setModelApproved(true)}
                  className={`transition flex items-center gap-1 ${modelApproved ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-black hover:font-bold'}`}
                >
                  <ThumbsUp className="w-3.5 h-3.5 inline mr-1" /> 
                  <span>{modelApproved ? 'Approved ✓' : 'Log Approval'}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT COLUMN: iPhone 15 Pro Hardware Frame Simulator (7 Cols) */}
        <section className="xl:col-span-6 flex flex-col items-center justify-start py-2">
          
          {/* Target Location Swapper */}
          <div className="w-full max-w-[400px] mb-4 space-y-2.5">
            <label className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5" /> SELECT COMPLEX URBAN TRANSIT POINT:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setSimOn(false);
                    setSimCompleted(false);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border text-left flex flex-col justify-between h-[56px] transition-all shadow-sm ${
                    selectedScenarioId === sc.id
                      ? 'bg-black text-white border-black shadow-md font-bold'
                      : 'bg-white text-slate-705 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{sc.name}</span>
                  <span className={`text-[9px] uppercase font-mono py-0.5 rounded ${
                    selectedScenarioId === sc.id ? 'text-white/60' : 'text-slate-400'
                  }`}>
                    {sc.type} layout
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* iPhone 15 Pro Wrapper - STRICTMOBILE BOUNDARY */}
          <div className="w-full max-w-[395px] h-[780px] bg-slate-50 border-[8px] border-slate-900 rounded-[50px] shadow-2xl relative flex flex-col overflow-hidden select-none">
            
            {/* Dynamic Island Chamber */}
            <div className="absolute top-[13px] left-1/2 -translate-x-1/2 w-[110px] h-[26px] bg-black rounded-full z-50 flex items-center justify-between px-3.5 shadow-inner">
              <div className="w-[8px] h-[8px] rounded-full bg-slate-900/60 border border-slate-800/40 relative">
                <div className="absolute inset-0.5 bg-blue-600 rounded-full opacity-60" />
              </div>
              {/* Dynamic Island green sensor dot representing GPS is Active */}
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* iPhone Top Status Bar Bar -> Light Design */}
            <div className="h-[40px] bg-white flex justify-between items-end px-7 pb-2.5 text-[11px] font-semibold text-slate-700 z-40 relative border-b border-slate-100">
              <span className="font-mono text-slate-800 select-none">{systemTime}</span>
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-slate-700" />
                <span className="text-[10px] font-mono select-none text-slate-705">5G</span>
                <Wifi className="w-3.5 h-3.5 text-slate-700" />
                <div className="flex items-center gap-0.5 border border-slate-300 rounded-sm px-0.5 py-0.2">
                  <span className="text-[9px] font-mono leading-none text-slate-700">{batteryCharge}%</span>
                  <div className="w-2.5 h-1.5 bg-emerald-500 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Simulated Live Location Indicator Sub-Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between z-30 shadow-sm">
              <div className="flex items-center gap-2 max-w-[80%]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-slate-800 text-xs font-bold truncate leading-none">
                  {scenario.locationName}
                </span>
              </div>
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-black text-white rounded-full uppercase tracking-wide">
                GPS LOCK ✔
              </span>
            </div>

            {/* SCREEN SCROLLABLE VIEW CONTAINER */}
            <div className="flex-1 bg-white flex flex-col min-h-0 relative">

              {/* TAB CONTROLS (Blueprint Map vs 360 Camera vs AR vs Assistant) */}
              <div className="grid grid-cols-4 border-b border-slate-200 bg-white text-center select-none z-30">
                <button
                  onClick={() => setActiveInternalTab('blueprint')}
                  className={`py-3 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeInternalTab === 'blueprint'
                      ? 'text-black border-b-2 border-black bg-slate-50/60 font-bold'
                      : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>2D Layout</span>
                </button>
                <button
                  onClick={() => setActiveInternalTab('pano')}
                  className={`py-3 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeInternalTab === 'pano'
                      ? 'text-black border-b-2 border-black bg-slate-50/60 font-bold'
                      : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <div className="relative">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    {simOn && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>
                  <span>360° View</span>
                </button>
                <button
                  onClick={() => setActiveInternalTab('ar')}
                  className={`py-3 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeInternalTab === 'ar'
                      ? 'text-black border-b-2 border-black bg-slate-50/60 font-bold'
                      : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>AR Walk</span>
                </button>
                <button
                  onClick={() => setActiveInternalTab('chat')}
                  className={`py-3 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all relative ${
                    activeInternalTab === 'chat'
                      ? 'text-black border-b-2 border-black bg-slate-50/60 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>AI Guide</span>
                  {chatMessages.length > 1 && activeInternalTab !== 'chat' && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-sky-400" />
                  )}
                </button>
              </div>

              {/* ACTUAL ACTIVE CANVAS ELEMENTS */}
              <div className="flex-1 min-h-0 overflow-y-auto relative no-scrollbar flex flex-col">
                
                {/* 1. BLUEPRINT VIEW: 2D Interactive floor plans */}
                {activeInternalTab === 'blueprint' && (
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 bg-slate-50 flex align-center justify-between text-[11px] text-slate-500 border-b border-slate-200">
                      <span>Stand at Exit to align compass tracking:</span>
                      <span className="text-slate-800 font-bold">Scale: 1:240</span>
                    </div>

                    {/* Interactive Arena SVG grid map layout */}
                    <div className="w-full h-[280px] bg-[#E6E8EA] border-b border-slate-200 relative p-4 select-none group" style={{ backgroundImage: 'radial-gradient(#CED2D6 2px, transparent 2px)', backgroundSize: '24px 24px' }}>
                      
                      {/* Terminal building concrete boundary */}
                      <div className="absolute bottom-0 inset-x-0 h-[65px] bg-white border-t border-slate-300 rounded-t-lg shadow-sm flex items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-display font-medium tracking-widest uppercase">
                          TERMINAL MAIN AIR-LOCK DECK
                        </span>
                      </div>

                      {/* Lane outlines represent driveway areas */}
                      <div className="absolute top-[35%] inset-x-0 h-[30px] border-y border-dashed border-slate-300 bg-slate-100/60 flex items-center justify-center">
                        <span className="text-[9px] text-slate-600 font-mono tracking-wider">DRIVEWAY LANE 1 (Private / Uber Stops)</span>
                      </div>
                      <div className="absolute top-[10%] inset-x-0 h-[30px] border-y border-slate-300/40 flex items-center justify-center">
                        <span className="text-[9px] text-slate-500 font-mono">DRIVEWAY LANE 2 (Taxi / Shuttle Pool)</span>
                      </div>

                      {/* EXIT DOORS IN SCENARIO PLOTTED */}
                      {scenario.exits.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => setSelectedExitId(ex.id)}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/exit transition"
                          style={{ left: `${ex.coords.x}%`, top: `${ex.coords.y}%` }}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-[10px] shadow ${
                            selectedExitId === ex.id
                              ? 'bg-black text-white border-black ring-2 ring-black/30'
                              : 'bg-white text-slate-700 border-slate-300 hover:text-black hover:border-black'
                          }`}>
                            🚪
                          </div>
                          <span className="text-[8px] bg-black text-white px-1 py-0.5 rounded shadow mt-1 whitespace-nowrap font-medium pointer-events-none">
                            {ex.name}
                          </span>
                        </button>
                      ))}

                      {/* PATHWAY ROUTING FROM EXIT TO SMART HUB (DYNAMIC SVG LINE) */}
                      {selectedExit && selectedHub && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <g>
                            {/* Dotted directional guidelines */}
                            <path
                              d={`M ${(selectedExit.coords.x / 100) * 365} ${(selectedExit.coords.y / 100) * 280} Q ${((selectedExit.coords.x + selectedHub.coords.x) / 200) * 365} ${((selectedExit.coords.y + selectedHub.coords.y + 15) / 200) * 280} ${(selectedHub.coords.x / 100) * 365} ${(selectedHub.coords.y / 100) * 280}`}
                              fill="none"
                              stroke="black"
                              strokeWidth="3.5"
                              className="animate-dash"
                            />
                            {/* Path shadow glow keyframe */}
                            <path
                              d={`M ${(selectedExit.coords.x / 100) * 365} ${(selectedExit.coords.y / 100) * 280} Q ${((selectedExit.coords.x + selectedHub.coords.x) / 200) * 365} ${((selectedExit.coords.y + selectedHub.coords.y + 15) / 200) * 280} ${(selectedHub.coords.x / 100) * 365} ${(selectedHub.coords.y / 100) * 280}`}
                              fill="none"
                              stroke="black"
                              strokeWidth="10"
                              opacity="0.10"
                            />
                          </g>
                        </svg>
                      )}

                      {/* HUB CHIPS PLOTTED ON MATRIX */}
                      {scenario.hubs.map((hub) => (
                        <button
                          key={hub.id}
                          onClick={() => setSelectedHubId(hub.id)}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/hub transition"
                          style={{ left: `${hub.coords.x}%`, top: `${hub.coords.y}%` }}
                        >
                          {/* Pulse ring indicating tracking accuracy */}
                          <div className={`absolute w-10 h-10 rounded-full bg-black/10 border border-black/20 pointer-events-none ${
                            selectedHubId === hub.id ? 'animate-pulse-ring' : 'hidden'
                          }`} />
                          
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-lg font-bold text-xs font-mono transition transform hover:scale-110 ${
                            selectedHubId === hub.id
                              ? 'bg-black text-white border-black scale-105'
                              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                          }`}>
                            {selectedHubId === hub.id ? (
                              <MapPin className="w-4 h-4" />
                            ) : (
                              hub.id.endsWith('1') || hub.id.endsWith('a') ? 'A' : hub.id.endsWith('2') || hub.id.endsWith('b') ? 'B' : 'C'
                            )}
                          </div>
                          
                          <div className="absolute -top-7 text-[8px] tracking-wide font-bold bg-black text-white border border-slate-800 px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                            {hub.id.endsWith('1') || hub.id.endsWith('a') ? 'HUB A' : hub.id.endsWith('2') || hub.id.endsWith('b') ? 'HUB B' : 'HUB C'}
                          </div>
                        </button>
                      ))}

                      {/* DYNAMIC DRIVER CAR DOT */}
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none animate-fade-in"
                        style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
                      >
                        {/* Radial green target sweep */}
                        <div className="absolute -inset-2.5 bg-black/10 border border-black/25 rounded-full animate-ping pointer-events-none" />
                        
                        <div className="bg-black text-white w-7 h-7 rounded-full shadow-lg border-2 border-white flex items-center justify-center select-none">
                          <Car className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[8px] font-mono tracking-tight font-bold bg-black text-white border border-slate-800 px-1 py-0.2 rounded mt-1 shadow whitespace-nowrap">
                          {scenario.driver.car.split(' ').pop()} ({driverDistanceMeters}m)
                        </span>
                      </div>

                    </div>

                    {/* Exit and Hub detailed Guidance Information Box */}
                    <div className="p-4 space-y-4 animate-fade-in">
                      
                      {/* Hub details card */}
                      <div className="bg-white border-2 border-black p-5 rounded-2xl space-y-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">SELECTED DESIGNATED TARGET HUB:</span>
                            <h3 className="text-sm font-bold text-black flex items-center gap-1.5 leading-tight">
                              {selectedHub.name}
                            </h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getCapacityColor(selectedHub.capacityStatus)}`}>
                            {selectedHub.capacityStatus} load
                          </span>
                        </div>

                        {/* Walking metadata stats */}
                        <div className="grid grid-cols-3 gap-2 py-1 select-none text-center">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-800 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-400 block font-bold">Walk Time</span>
                            <span className="text-xs font-bold font-mono text-slate-900">{selectedHub.walkingTimeSec} seconds</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <Navigation className="w-3.5 h-3.5 text-slate-800 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-400 block font-bold">Distance</span>
                            <span className="text-xs font-bold font-mono text-slate-900">{selectedHub.distanceMeters} meters</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <Accessibility className="w-3.5 h-3.5 text-slate-800 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-400 block font-bold">Wheelchair</span>
                            <span className={`text-[10px] font-bold uppercase ${
                              selectedHub.accessibilityFriendly ? 'text-emerald-700' : 'text-slate-500'
                            }`}>
                              {selectedHub.accessibilityFriendly ? 'Accessible' : 'No Ramps'}
                            </span>
                          </div>
                        </div>

                        {/* Step-by-Step Guidance details */}
                        <div className="text-xs bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block mb-2">Pedestrian Path Guidelines:</span>
                          <ul className="space-y-2">
                            {selectedHub.instructions.map((inst, idx) => (
                              <li key={idx} className="flex gap-2 text-slate-600 leading-relaxed text-xs">
                                <span className="bg-black text-white font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{inst}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. COMPASS 360 LANDMARK VIEW: High tactile simulation pan viewer */}
                {activeInternalTab === 'pano' && (
                    <div className="flex-1 flex flex-col">
                      
                      {/* Visual 360 viewer display box */}
                      <div 
                        className="w-full h-[220px] bg-indigo-950 p-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing border-b border-slate-300 block group"
                        onMouseDown={handlePanoMouseDown}
                        onMouseMove={handlePanoMouseMove}
                        onMouseUp={handlePanoMouseUpOrLeave}
                        onMouseLeave={handlePanoMouseUpOrLeave}
                        onTouchStart={handlePanoTouchStart}
                        onTouchMove={handlePanoTouchMove}
                        onTouchEnd={handlePanoMouseUpOrLeave}
                      >
                        {/* Immersive Street View Environment Rendered using coordinates vector shapes */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 220" preserveAspectRatio="none">
                          <defs>
                            {/* Theme Custom Gradients dynamically computed according to location type */}
                            {type === 'airport' && (
                              <>
                                <linearGradient id="gPanoSky" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#0B1530" />
                                  <stop offset="55%" stopColor="#1E193C" />
                                  <stop offset="100%" stopColor="#F43F5E" />
                                </linearGradient>
                                <linearGradient id="gPanoGround" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1E293B" />
                                  <stop offset="100%" stopColor="#0F172A" />
                                </linearGradient>
                                <linearGradient id="gTerminalGlass" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(14, 165, 233, 0.45)" />
                                  <stop offset="100%" stopColor="rgba(2, 132, 199, 0.05)" />
                                </linearGradient>
                              </>
                            )}
                            {type === 'railway' && (
                              <>
                                <linearGradient id="gPanoSky" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1B1745" />
                                  <stop offset="70%" stopColor="#2D286A" />
                                  <stop offset="100%" stopColor="#4F46E5" />
                                </linearGradient>
                                <linearGradient id="gPanoGround" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#334155" />
                                  <stop offset="100%" stopColor="#1E293B" />
                                </linearGradient>
                              </>
                            )}
                            {type === 'mall' && (
                              <>
                                <linearGradient id="gPanoSky" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#0284C7" />
                                  <stop offset="65%" stopColor="#38BDF8" />
                                  <stop offset="100%" stopColor="#BAE6FD" />
                                </linearGradient>
                                <linearGradient id="gPanoGround" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#E2E8F0" />
                                  <stop offset="100%" stopColor="#94A3B8" />
                                </linearGradient>
                                <linearGradient id="gMallDome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(236, 72, 153, 0.35)" />
                                  <stop offset="100%" stopColor="rgba(219, 39, 119, 0.05)" />
                                </linearGradient>
                              </>
                            )}
                            {type === 'office' && (
                              <>
                                <linearGradient id="gPanoSky" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#030712" />
                                  <stop offset="65%" stopColor="#111827" />
                                  <stop offset="100%" stopColor="#1F2937" />
                                </linearGradient>
                                <linearGradient id="gPanoGround" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1F2937" />
                                  <stop offset="100%" stopColor="#030712" />
                                </linearGradient>
                                <linearGradient id="gOfficeGlass" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.35)" />
                                  <stop offset="100%" stopColor="rgba(22, 163, 74, 0.05)" />
                                </linearGradient>
                              </>
                            )}
                            {/* Radial neon glow templates */}
                            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.85)" />
                              <stop offset="30%" stopColor="rgba(245, 158, 11, 0.35)" />
                              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                            </radialGradient>
                            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="rgba(254, 240, 138, 0.75)" />
                              <stop offset="40%" stopColor="rgba(254, 240, 138, 0.25)" />
                              <stop offset="100%" stopColor="rgba(254, 240, 138, 0)" />
                            </radialGradient>
                            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="rgba(253, 224, 71, 0.8)" />
                              <stop offset="40%" stopColor="rgba(253, 224, 71, 0.25)" />
                              <stop offset="100%" stopColor="rgba(253, 224, 71, 0)" />
                            </radialGradient>
                            <radialGradient id="fountainGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.75)" />
                              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.2)" />
                              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                            </radialGradient>
                          </defs>

                          {/* 1. SKY CANVAS */}
                          <rect x="0" y="0" width="400" height="150" fill="url(#gPanoSky)" />

                          {/* 2. DYNAMIC CELESTIAL BACKGROUND OBJECTS */}
                          {xCelestial !== null && (
                            <g transform={`translate(${xCelestial * 4}, 0)`}>
                              {type === 'office' ? (
                                <>
                                  <circle cx="0" cy="45" r="24" fill="url(#moonGlow)" />
                                  <path d="M-6,40 A10,12 0 1,0 6,50 A12,14 0 1,1 -6,40" fill="#fef08a" />
                                </>
                              ) : type === 'mall' ? (
                                <>
                                  <circle cx="0" cy="40" r="28" fill="url(#sunGlow)" />
                                  <circle cx="0" cy="40" r="10" fill="#f59e0b" />
                                </>
                              ) : (
                                <>
                                  <circle cx="0" cy="65" r="32" fill="url(#sunGlow)" />
                                  <circle cx="0" cy="65" r="14" fill="#fc604c" />
                                </>
                              )}
                            </g>
                          )}

                          {/* 3. CLOUDS OVERLAY PATTERNS */}
                          {xCl1 !== null && (
                            <path d="M-30,45 Q-20,35 -10,40 Q0,30 15,35 Q25,30 35,40 Q45,45 35,50 L-30,50 Z" fill="#ffffff" opacity="0.15" transform={`translate(${xCl1 * 4}, 0)`} />
                          )}
                          {xCl2 !== null && (
                            <path d="M-25,30 Q-15,22 -5,25 Q5,15 20,20 Q30,15 38,25 Q45,30 38,35 L-25,35 Z" fill="#ffffff" opacity="0.1" transform={`translate(${xCl2 * 4}, 0)`} />
                          )}
                          {xCl3 !== null && (
                            <path d="M-35,55 Q-25,43 -12,48 Q5,38 22,43 Q32,38 42,50 Q48,55 38,58 L-35,58 Z" fill="#ffffff" opacity="0.12" transform={`translate(${xCl3 * 4}, 0)`} />
                          )}

                          {/* 4. SILHOUETTE SKYLINE BUILDING BLOCKS */}
                          {xSky1 !== null && <rect x="-15" y="80" width="30" height="70" fill={type === 'mall' ? '#cbd5e1' : '#1e1b4b'} opacity="0.15" transform={`translate(${xSky1 * 4}, 0)`} />}
                          {xSky2 !== null && <rect x="-20" y="65" width="40" height="85" fill={type === 'mall' ? '#cbd5e1' : '#1e1b4b'} opacity="0.12" transform={`translate(${xSky2 * 4}, 0)`} />}
                          {xSky3 !== null && <rect x="-12" y="90" width="24" height="60" fill={type === 'mall' ? '#94a3b8' : '#1e1b4b'} opacity="0.15" transform={`translate(${xSky3 * 4}, 0)`} />}
                          {xSky4 !== null && <rect x="-24" y="75" width="48" height="75" fill={type === 'mall' ? '#cbd5e1' : '#1e1b4b'} opacity="0.14" transform={`translate(${xSky4 * 4}, 0)`} />}
                          {xSky5 !== null && <rect x="-16" y="55" width="32" height="95" fill={type === 'mall' ? '#94a3b8' : '#1e1b4b'} opacity="0.1" transform={`translate(${xSky5 * 4}, 0)`} />}
                          {xSky6 !== null && <rect x="-18" y="85" width="36" height="65" fill={type === 'mall' ? '#cbd5e1' : '#1e1b4b'} opacity="0.15" transform={`translate(${xSky6 * 4}, 0)`} />}

                          {/* 5. SEAMLESS STREET ASYPHALT CARRIAGEWAY */}
                          <rect x="0" y="150" width="400" height="70" fill="url(#gPanoGround)" />
                          {/* Curb line splitting block */}
                          <line x1="0" y1="150" x2="400" y2="150" stroke={type === 'mall' ? '#cbd5e1' : '#334155'} strokeWidth="1.5" />
                          <rect x="0" y="150" width="400" height="3" fill={type === 'mall' ? '#94a3b8' : '#1e293b'} />

                          {/* 6. HIGH-PRECISION 2D PANNING ROAD SEPARATORS */}
                          {xLane1 !== null && <polygon points="-2,152 -6,220 6,220 2,152" fill="rgba(255, 255, 255, 0.15)" transform={`translate(${xLane1 * 4}, 0)`} />}
                          {xLane2 !== null && <polygon points="-2,152 -6,220 6,220 2,152" fill="rgba(255, 255, 255, 0.15)" transform={`translate(${xLane2 * 4}, 0)`} />}
                          {xLane3 !== null && <polygon points="-2,152 -6,220 6,220 2,152" fill="rgba(255, 255, 255, 0.15)" transform={`translate(${xLane3 * 4}, 0)`} />}
                          {xLane4 !== null && <polygon points="-2,152 -6,220 6,220 2,152" fill="rgba(255, 255, 255, 0.15)" transform={`translate(${xLane4 * 4}, 0)`} />}
                          {xLane5 !== null && <polygon points="-2,152 -6,220 6,220 2,152" fill="rgba(255, 255, 255, 0.15)" transform={`translate(${xLane5 * 4}, 0)`} />}
                          {xLane6 !== null && <polygon points="-2,152 -6,220 6,220 2,152" fill="rgba(255, 255, 255, 0.15)" transform={`translate(${xLane6 * 4}, 0)`} />}

                          {/* Zebra Crosswalk in front of Terminal Arrivals */}
                          {type === 'airport' && xAirportTerminal !== null && (
                            <g transform={`translate(${xAirportTerminal * 4}, 0)`}>
                              {/* 5 perspective painted zebra lines block */}
                              <polygon points="-50,152 -110,220 -80,220 -30,152" fill="rgba(255,255,255,0.22)" />
                              <polygon points="-20,152 -60,220 -30,220 0,152" fill="rgba(255,255,255,0.22)" />
                              <polygon points="10,152 -10,220 20,220 30,152" fill="rgba(255,255,255,0.22)" />
                              <polygon points="40,152 40,220 70,220 60,152" fill="rgba(255,255,255,0.22)" />
                              <polygon points="70,152 90,220 120,220 90,152" fill="rgba(255,255,255,0.22)" />
                            </g>
                          )}
                          {type === 'railway' && xRailwayStation !== null && (
                            <g transform={`translate(${xRailwayStation * 4}, 0)`}>
                              <polygon points="-60,152 -120,220 -95,220 -40,152" fill="rgba(255,255,255,0.18)" />
                              <polygon points="-30,152 -70,220 -45,220 -10,152" fill="rgba(255,255,255,0.18)" />
                              <polygon points="0,152 -20,220 5,220 20,152" fill="rgba(255,255,255,0.18)" />
                              <polygon points="30,152 30,220 55,220 50,152" fill="rgba(255,255,255,0.18)" />
                              <polygon points="60,152 80,220 105,220 80,152" fill="rgba(255,255,255,0.18)" />
                            </g>
                          )}

                          {/* 7. DETAILED 2D PERSPECTIVE ENVIRONMENT STRUCTURES */}

                          {/* ----------------- TYPE: AIRPORT ----------------- */}
                          {type === 'airport' && (
                            <>
                              {/* Air Traffic Control Tower */}
                              {xAirportTower !== null && (
                                <g transform={`translate(${xAirportTower * 4}, 0)`}>
                                  <rect x="-6" y="25" width="12" height="125" fill="#1E293B" stroke="#475569" />
                                  <polygon points="-12,25 12,25 8,40 -8,40" fill="#334155" stroke="#475569" />
                                  <circle cx="0" cy="22" r="4" fill="#E2E8F0" />
                                  <circle cx="0" cy="22" r="1.5" fill="#EF4444" className="animate-pulse" />
                                </g>
                              )}

                              {/* Terminal Facade Building */}
                              {xAirportTerminal !== null && (
                                <g transform={`translate(${xAirportTerminal * 4}, 0)`}>
                                  {/* Main Building Panel Back */}
                                  <rect x="-115" y="30" width="230" height="120" fill="url(#gTerminalGlass)" stroke="#38BDF8" strokeWidth="2" rx="3" />
                                  {/* Steel Mullions Repeating */}
                                  {[-80, -40, 0, 40, 80].map((mx) => (
                                    <line key={mx} x1={mx} y1="30" x2={mx} y2="150" stroke="#0284C7" strokeWidth="1" opacity="0.4" />
                                  ))}
                                  {[-70, -30, 10, 50, 90].map((mx) => (
                                    <g key={mx}>
                                      {/* Diagonal steel bracing truss */}
                                      <line x1={mx - 15} y1="30" x2={mx + 15} y2="150" stroke="rgba(2, 132, 199, 0.2)" strokeWidth="1" />
                                      <line x1={mx + 15} y1="30" x2={mx - 15} y2="150" stroke="rgba(2, 132, 199, 0.2)" strokeWidth="1" />
                                    </g>
                                  ))}
                                  {/* Overhead horizontal beams */}
                                  <line x1="-115" y1="50" x2="115" y2="50" stroke="#0284C7" strokeWidth="1" opacity="0.5" />
                                  <line x1="-115" y1="80" x2="115" y2="80" stroke="#0284C7" strokeWidth="1.5" opacity="0.5" />

                                  {/* Canopy Gate 2 Entrance Dome Outlines */}
                                  <g transform="translate(-40, 0)">
                                    <path d="M-30,150 L-30,110 L30,110 L30,150 Z" fill="rgba(15, 23, 42, 0.9)" stroke="#F59E0B" strokeWidth="1.5" />
                                    <rect x="-24" y="114" width="48" height="11" fill="#000" rx="2" stroke="#475569" />
                                    <text x="0" y="122" fill="#F59E0B" fontSize="6.5" textAnchor="middle" fontWeight="black" className="font-sans">GATE 1 • DOMESTIC</text>
                                    <polygon points="-35,110 35,110 25,102 -25,102" fill="#1E293B" stroke="#475569" />
                                  </g>
                                  
                                  <g transform="translate(40, 0)">
                                    <path d="M-30,150 L-30,110 L30,110 L30,150 Z" fill="rgba(15, 23, 42, 0.9)" stroke="#F59E0B" strokeWidth="1.5" />
                                    <rect x="-24" y="114" width="48" height="11" fill="#000" rx="2" stroke="#475569" />
                                    <text x="0" y="122" fill="#F59E0B" fontSize="6.5" textAnchor="middle" fontWeight="black" className="font-sans">GATE 2 • INTERNATIONAL</text>
                                    <polygon points="-35,110 35,110 25,102 -25,102" fill="#1E293B" stroke="#475569" />
                                  </g>

                                  {/* Terminal top logo */}
                                  <text x="0" y="44" fill="#FFFFFF" opacity="0.8" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">INDIRA GANDHI INTL TERMINAL 3</text>
                                </g>
                              )}

                              {/* Crossing foot-bridge */}
                              {xAirportBridge !== null && (
                                <g transform={`translate(${xAirportBridge * 4}, 0)`}>
                                  <polygon points="-35,40 35,45 35,65 -35,60" fill="rgba(30, 41, 59, 0.9)" stroke="#475569" strokeWidth="1.5" />
                                  <line x1="-35" y1="50" x2="35" y2="55" stroke="#0284C7" strokeWidth="1" strokeDasharray="5,2" />
                                  {/* Support pillars */}
                                  <line x1="-30" y1="60" x2="-30" y2="150" stroke="#475569" strokeWidth="4" />
                                  <line x1="25" y1="64" x2="25" y2="150" stroke="#475569" strokeWidth="4" />
                                </g>
                              )}

                              {/* Multi-Level Hub Parking Lot */}
                              {xAirportParking !== null && (
                                <g transform={`translate(${xAirportParking * 4}, 0)`}>
                                  <rect x="-90" y="45" width="180" height="105" fill="#111827" stroke="#334155" strokeWidth="2" rx="4" />
                                  {/* Repeating structural arch support grids */}
                                  {[-70, -40, -10, 20, 50, 80].map((ax, idx) => (
                                    <g key={idx}>
                                      <path d={`M${ax-12},150 L${ax-12},80 A12,12 0 0,1 ${ax+12},80 L${ax+12},150`} fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                                      {/* Glowing vehicle headlamps inside parking decks */}
                                      <circle cx={ax - 4} cy="100" r="1.5" fill="#FEF08A" opacity="0.8" />
                                      <circle cx={ax + 4} cy="100" r="1.5" fill="#FEF08A" opacity="0.8" />
                                      <circle cx={ax - 5} cy="130" r="1.5" fill="#FEF08A" opacity="0.8" />
                                      <circle cx={ax + 5} cy="130" r="1.5" fill="#FEF08A" opacity="0.8" />
                                    </g>
                                  ))}
                                  {/* Huge Digital Billboard Advertising Uber Pickup */}
                                  <rect x="-55" y="15" width="110" height="25" fill="#000000" rx="3" stroke="#38BDF8" strokeWidth="2" />
                                  <text x="0" y="27" fill="#38BDF8" fontSize="7" fontWeight="black" textAnchor="middle" className="font-sans">UBER SMART HUB ZONES A-C</text>
                                  <text x="0" y="36" fill="#10B981" fontSize="6.5" fontWeight="bold" textAnchor="middle" className="font-mono">DRIVERS IMMINENT</text>
                                  <line x1="0" y1="40" x2="0" y2="45" stroke="#334155" strokeWidth="4" />
                                </g>
                              )}

                              {/* Decorative Streetlamps */}
                              {xAirportLamp1 !== null && (
                                <g transform={`translate(${xAirportLamp1 * 4}, 0)`}>
                                  <path d="M0,150 L0,85 Q0,75 10,75" fill="none" stroke="#64748B" strokeWidth="2.5" />
                                  <circle cx="10" cy="75" r="4" fill="#FEF08A" />
                                  <polygon points="5,76 15,76 22,110 -2,110" fill="url(#lampGlow)" opacity="0.4" />
                                </g>
                              )}
                              {xAirportLamp2 !== null && (
                                <g transform={`translate(${xAirportLamp2 * 4}, 0)`}>
                                  <path d="M0,150 L0,85 Q0,75 10,75" fill="none" stroke="#64748B" strokeWidth="2.5" />
                                  <circle cx="10" cy="75" r="4" fill="#FEF08A" />
                                  <polygon points="5,76 15,76 22,110 -2,110" fill="url(#lampGlow)" opacity="0.4" />
                                </g>
                              )}
                            </>
                          )}


                          {/* ----------------- TYPE: RAILWAY ----------------- */}
                          {type === 'railway' && (
                            <>
                              {/* Station Red colonial Building */}
                              {xRailwayStation !== null && (
                                <g transform={`translate(${xRailwayStation * 4}, 0)`}>
                                  <rect x="-115" y="42" width="230" height="108" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="2" rx="3" />
                                  {/* Indo-Islamic colonial arches and support pillars */}
                                  {[-95, -60, -25, 25, 60, 95].map((rx, idx) => (
                                    <g key={idx}>
                                      <path d={`M${rx-14},150 L${rx-14},95 A14,14 0 0,1 ${rx+14},95 L${rx+14},150`} fill="#7F1D1D" stroke="#991B1B" />
                                      <rect x={rx - 16} y="142" width="4" height="8" fill="#FDE047" />
                                      <rect x={rx + 12} y="142" width="4" height="8" fill="#FDE047" />
                                      {/* Soft warm interior lights */}
                                      <rect x={rx-8} y="105" width="16" height="30" fill="rgba(251, 191, 36, 0.25)" rx="1" />
                                    </g>
                                  ))}
                                  {/* Golden Traditional Domes */}
                                  <path d="M-80,42 Q-80,25 -60,25 Q-40,25 -40,42 Z" fill="#D97706" />
                                  <line x1="-60" y1="25" x2="-60" y2="15" stroke="#D97706" strokeWidth="2" />
                                  <path d="M40,42 Q40,25 60,25 Q80,25 80,42 Z" fill="#D97706" />
                                  <line x1="60" y1="25" x2="60" y2="15" stroke="#D97706" strokeWidth="2" />

                                  {/* Large station entrance arch */}
                                  <path d="M-20,150 L-20,80 A20,20 0 0,1 20,80 L20,150 Z" fill="#450A0A" stroke="#FEF08A" strokeWidth="1.5" />
                                  <rect x="-45" y="48" width="90" height="22" fill="#000000" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
                                  <text x="0" y="58" fill="#FEF08A" fontSize="7" fontWeight="bold" textAnchor="middle">नई दिल्ली रेलवे स्टेशन</text>
                                  <text x="0" y="66" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">NEW DELHI RAILWAY STATION</text>
                                </g>
                              )}

                              {/* Heritage Clock Tower */}
                              {xRailwayClock !== null && (
                                <g transform={`translate(${xRailwayClock * 4}, 0)`}>
                                  <rect x="-12" y="20" width="24" height="130" fill="#991B1B" stroke="#7F1D1D" strokeWidth="2" />
                                  <polygon points="-16,20 16,20 0,5" fill="#065F46" />
                                  {/* Imperial Clock lens face */}
                                  <circle cx="0" cy="38" r="8" fill="#FFFFFF" stroke="#450A0A" strokeWidth="1.5" />
                                  <line x1="0" y1="38" x2="0" y2="33" stroke="#000000" strokeWidth="1.5" />
                                  <line x1="0" y1="38" x2="4" y2="38" stroke="#000000" strokeWidth="1.2" />
                                  <circle cx="0" cy="38" r="1" fill="#000" />
                                </g>
                              )}

                              {/* Platform Overhead Metal Truss */}
                              {xRailwayTruss !== null && (
                                <g transform={`translate(${xRailwayTruss * 4}, 0)`}>
                                  <path d="M-45,35 L45,35 Q0,10 -45,35 Z" fill="none" stroke="#334155" strokeWidth="3" opacity="0.8" />
                                  <path d="M-40,35 Q0,15 40,35" fill="none" stroke="#475569" strokeWidth="1.5" />
                                  {/* Verticals */}
                                  {[-30, -15, 0, 15, 30].map((tx) => (
                                    <line key={tx} x1={tx} y1="35" x2={tx} y2="28" stroke="#475569" strokeWidth="1.5" />
                                  ))}
                                  <line x1="-40" y1="35" x2="-40" y2="150" stroke="#1E293B" strokeWidth="5" />
                                  <line x1="40" y1="35" x2="40" y2="150" stroke="#1E293B" strokeWidth="5" />
                                  {/* Hanging Sign */}
                                  <rect x="-22" y="44" width="44" height="15" fill="#FDE047" rx="1" stroke="#000" />
                                  <text x="0" y="54" fill="#000" fontSize="7" fontWeight="black" textAnchor="middle">PF 1-2 OUT</text>
                                </g>
                              )}

                              {/* Retail Bazar chai stall */}
                              {xRailwayChai !== null && (
                                <g transform={`translate(${xRailwayChai * 4}, 0)`}>
                                  <rect x="-35" y="105" width="70" height="45" fill="#78350F" stroke="#451A03" strokeWidth="1.5" rx="3" />
                                  <rect x="-28" y="109" width="56" height="12" fill="#000000" stroke="#F59E0B" strokeWidth="1" />
                                  <text x="0" y="118" fill="#F59E0B" fontSize="7" fontWeight="black" textAnchor="middle">★ CHAI POINT KIOSK</text>
                                  {/* Cups and jars on shelf */}
                                  <rect x="-24" y="126" width="10" height="8" fill="#F3F4F6" rx="0.5" />
                                  <circle cx="2" cy="130" r="3" fill="#D97706" />
                                  <circle cx="12" cy="130" r="3" fill="#B45309" />
                                  {/* Stools beside */}
                                  <line x1="-42" y1="135" x2="-42" y2="150" stroke="#475569" strokeWidth="2.5" />
                                  <line x1="-48" y1="135" x2="-48" y2="150" stroke="#475569" strokeWidth="2.5" />
                                  <ellipse cx="-45" cy="135" rx="6" ry="1.5" fill="#94A3B8" />
                                </g>
                              )}

                              {/* Rail Signal pole */}
                              {xRailwaySignal !== null && (
                                <g transform={`translate(${xRailwaySignal * 4}, 0)`}>
                                  <line x1="0" y1="60" x2="0" y2="150" stroke="#475569" strokeWidth="3.5" />
                                  <rect x="-5" y="60" width="10" height="28" fill="#0F172A" rx="2" />
                                  <circle cx="0" cy="67" r="2.5" fill="#EF4444" className="animate-pulse" />
                                  <circle cx="0" cy="74" r="2.5" fill="#FEF08A" opacity="0.3" />
                                  <circle cx="0" cy="81" r="2.5" fill="#10B981" opacity="0.3" />
                                </g>
                              )}
                            </>
                          )}


                          {/* ----------------- TYPE: MALL ----------------- */}
                          {type === 'mall' && (
                            <>
                              {/* Central Glass Dome */}
                              {xMallDome !== null && (
                                <g transform={`translate(${xMallDome * 4}, 0)`}>
                                  {/* Glass curved dome back */}
                                  <path d="M-85,150 A85,90 0 0,1 85,150 Z" fill="url(#gMallDome)" stroke="#DB2777" strokeWidth="2" />
                                  {/* Curved spider web struts */}
                                  <path d="M-65,150 A65,70 0 0,1 65,150 Z" fill="none" stroke="rgba(219,39,119,0.4)" strokeWidth="1" />
                                  <path d="M-45,150 A45,50 0 0,1 45,150 Z" fill="none" stroke="rgba(219,39,119,0.4)" strokeWidth="1" />
                                  {/* Radial struts */}
                                  {[-75, -50, -25, 0, 25, 50, 75].map((angDeg) => {
                                    const rad = (angDeg * Math.PI) / 180;
                                    const tx = 85 * Math.sin(rad);
                                    const ty = 150 - 90 * Math.cos(rad);
                                    return <line key={angDeg} x1="0" y1="150" x2={tx} y2={ty} stroke="rgba(219,39,119,0.4)" strokeWidth="1.2" />;
                                  })}
                                  {/* Entrance Grand canopy */}
                                  <path d="M-35,150 L-25,115 L25,115 L35,150 Z" fill="rgba(15, 23, 42, 0.95)" stroke="#EC4899" strokeWidth="1.5" />
                                  <rect x="-20" y="122" width="40" height="12" fill="#000" rx="1" stroke="#334155" />
                                  <text x="0" y="130" fill="#EC4899" fontSize="6.5" fontWeight="bold" textAnchor="middle">MAIN DOME ROTUNDA</text>
                                </g>
                              )}

                              {/* Storefront Zara */}
                              {xMallZara !== null && (
                                <g transform={`translate(${xMallZara * 4}, 0)`}>
                                  <rect x="-30" y="65" width="60" height="85" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" rx="2" />
                                  {/* Huge Glass showcase pane */}
                                  <rect x="-24" y="80" width="48" height="70" fill="rgba(255,255,255,0.7)" stroke="#CBD5E1" />
                                  {/* Brand logo */}
                                  <text x="0" y="75" fill="#000000" fontSize="8" fontWeight="black" textAnchor="middle" letterSpacing="2">ZARA</text>
                                  {/* Mannequin outlines */}
                                  <line x1="-10" y1="100" x2="-10" y2="148" stroke="#1E293B" strokeWidth="3" />
                                  <circle cx="-10" cy="95" r="3" fill="#1E293B" />
                                  <line x1="10" y1="105" x2="10" y2="148" stroke="#475569" strokeWidth="3" />
                                  <circle cx="10" cy="100" r="3" fill="#475569" />
                                </g>
                              )}

                              {/* Storefront Watch shop */}
                              {xMallWatch !== null && (
                                <g transform={`translate(${xMallWatch * 4}, 0)`}>
                                  <rect x="-30" y="65" width="60" height="85" fill="#1E1B4B" stroke="#312E81" strokeWidth="1.5" rx="2" />
                                  <rect x="-24" y="80" width="48" height="70" fill="rgba(30, 41, 59, 0.4)" stroke="#4338CA" />
                                  <text x="0" y="75" fill="#F59E0B" fontSize="6.5" fontWeight="extrabold" textAnchor="middle" letterSpacing="1">OMEGA LUXURY</text>
                                  <circle cx="0" cy="115" r="10" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                                  <line x1="0" y1="115" x2="0" y2="110" stroke="#F59E0B" strokeWidth="1.5" />
                                  <line x1="0" y1="115" x2="4" y2="115" stroke="#F59E0B" strokeWidth="1" />
                                </g>
                              )}

                              {/* Musical Fountain Plaza */}
                              {xMallFountain !== null && (
                                <g transform={`translate(${xMallFountain * 4}, 0)`}>
                                  {/* Fountain Basin */}
                                  <ellipse cx="0" cy="148" rx="45" ry="8" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
                                  <ellipse cx="0" cy="145" rx="40" ry="6" fill="#0891B2" />
                                  <circle cx="0" cy="145" r="28" fill="url(#fountainGlow)" />
                                  {/* Water shooting vectors */}
                                  <path d="M-30,145 Q-15,80 0,80 Q15,80 30,145" fill="none" stroke="#E0F2FE" strokeWidth="2.5" opacity="0.8" />
                                  <path d="M-20,145 Q-10,95 0,95 Q10,95 20,145" fill="none" stroke="#E0F2FE" strokeWidth="1.5" opacity="0.8" />
                                  <path d="M-10,145 Q-5,110 0,110 Q5,110 10,145" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
                                  {/* Center core jets */}
                                  <line x1="0" y1="145" x2="0" y2="70" stroke="#FFFFFF" strokeWidth="3" opacity="0.95" />
                                </g>
                              )}

                              {/* Luxury Valet Porch */}
                              {xMallValet !== null && (
                                <g transform={`translate(${xMallValet * 4}, 0)`}>
                                  <polygon points="-28,105 28,105 20,95 -20,95" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                                  <line x1="-24" y1="105" x2="-24" y2="150" stroke="#94A3B8" strokeWidth="3" />
                                  <line x1="20" y1="105" x2="20" y2="150" stroke="#94A3B8" strokeWidth="3" />
                                  <rect x="-10" y="118" width="20" height="32" fill="#D97706" rx="1" />
                                  <text x="0" y="130" fill="#FFF" fontSize="6.5" textAnchor="middle" fontWeight="bold">VALET</text>
                                </g>
                              )}
                            </>
                          )}


                          {/* ----------------- TYPE: OFFICE ----------------- */}
                          {type === 'office' && (
                            <>
                              {/* CyberCity Glass Tower 10 */}
                              {xOfficeCyber !== null && (
                                <g transform={`translate(${xOfficeCyber * 4}, 0)`}>
                                  <rect x="-110" y="15" width="220" height="135" fill="url(#gOfficeGlass)" stroke="#22C55E" strokeWidth="2" rx="3" />
                                  {/* Grid mullions */}
                                  {[-90, -70, -50, -30, -10, 10, 30, 50, 70, 90].map((mx) => (
                                    <line key={mx} x1={mx} y1="15" x2={mx} y2="150" stroke="#166534" strokeWidth="1" opacity="0.35" />
                                  ))}
                                  {[30, 50, 70, 90, 110, 130].map((my) => (
                                    <line key={my} x1="-110" y1={my} x2="110" y2={my} stroke="#166534" strokeWidth="1" opacity="0.35" />
                                  ))}
                                  {/* Glowing internal corporate lights */}
                                  {[-80, -40, 0, 40, 80].map((coordX) => (
                                    <g key={coordX}>
                                      <rect x={coordX - 6} y="40" width="12" height="6" fill="#FEF08A" opacity="0.4" />
                                      <rect x={coordX + 10} y="60" width="12" height="6" fill="#84CC16" opacity="0.3" />
                                      <rect x={coordX - 14} y="80" width="12" height="6" fill="#FEF08A" opacity="0.4" />
                                      <rect x={coordX + 4} y="110" width="12" height="6" fill="#FEF08A" opacity="0.5" />
                                    </g>
                                  ))}
                                  {/* Corporate branding badge */}
                                  <text x="0" y="27" fill="#22C55E" fontSize="9" fontWeight="black" textAnchor="middle" letterSpacing="1">DLF CYBER HELIX • TOWER 10</text>
                                </g>
                              )}

                              {/* Driveway Cantilever Porch */}
                              {xOfficePorch !== null && (
                                <g transform={`translate(${xOfficePorch * 4}, 0)`}>
                                  <polygon points="-28,105 28,105 22,95 -22,95" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                                  <line x1="-24" y1="105" x2="-24" y2="150" stroke="#475569" strokeWidth="3" />
                                  <line x1="22" y1="105" x2="22" y2="150" stroke="#475569" strokeWidth="3" />
                                  {/* Revolving lobby doors visual */}
                                  <rect x="-16" y="115" width="32" height="35" fill="rgba(255, 255, 255, 0.15)" stroke="#64748B" />
                                  <line x1="0" y1="115" x2="0" y2="150" stroke="#64748B" strokeWidth="2" />
                                </g>
                              )}

                              {/* Security Bollards Post */}
                              {xOfficeSecurity !== null && (
                                <g transform={`translate(${xOfficeSecurity * 4}, 0)`}>
                                  <rect x="-15" y="100" width="30" height="50" fill="#0F172A" stroke="#334155" strokeWidth="1.5" rx="2" />
                                  <line x1="0" y1="100" x2="0" y2="115" stroke="#EF4444" strokeWidth="2" />
                                  {/* Striped stripe lines */}
                                  <line x1="-12" y1="110" x2="12" y2="110" stroke="#F59E0B" strokeWidth="3" strokeDasharray="3,3" />
                                  {/* Active security gate boom barrier */}
                                  <line x1="15" y1="125" x2="45" y2="125" stroke="#EF4444" strokeWidth="4" />
                                  <line x1="15" y1="125" x2="45" y2="125" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="5,5" />
                                  <circle cx="15" cy="125" r="4" fill="#64748B" />
                                </g>
                              )}

                              {/* Costa Cafe Kiosk */}
                              {xOfficeCafe !== null && (
                                <g transform={`translate(${xOfficeCafe * 4}, 0)`}>
                                  <rect x="-35" y="110" width="70" height="40" fill="#451A03" rx="3" />
                                  <rect x="-30" y="114" width="60" height="11" fill="#000" stroke="#22C55E" strokeWidth="1" />
                                  <text x="0" y="122" fill="#22C55E" fontSize="6" fontWeight="bold" textAnchor="middle">COSTA ESPRESSO HUB</text>
                                </g>
                              )}
                            </>
                          )}

                        </svg>

                        {/* Direction Center Grid guide line overlays */}
                        <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none select-none">
                          <span className="text-[10px] bg-slate-950/80 text-amber-405 px-2.5 py-1 rounded-full border border-slate-800 font-mono uppercase tracking-widest text-[#f59e0b] shadow-sm">
                            Viewing: {Math.round(panAngle)}° {
                              panAngle >= 337.5 || panAngle < 22.5 ? 'N' :
                              panAngle >= 22.5 && panAngle < 67.5 ? 'NE' :
                              panAngle >= 67.5 && panAngle < 112.5 ? 'E' :
                              panAngle >= 112.5 && panAngle < 157.5 ? 'SE' :
                              panAngle >= 157.5 && panAngle < 202.5 ? 'S' :
                              panAngle >= 202.5 && panAngle < 247.5 ? 'SW' :
                              panAngle >= 247.5 && panAngle < 292.5 ? 'W' : 'NW'
                            }
                          </span>
                        </div>

                        {/* LANDMARK BADGES FLOATING DYNAMICALLY */}
                        {scenario.landmarks360.map((lm) => {
                          const xPct = calculateLandmarkXPercent(lm.angleDeg);
                          if (xPct === null) return null;

                          return (
                            <div
                              key={lm.id}
                              className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75 select-none"
                              style={{ left: `${xPct}%`, top: '32%' }}
                            >
                              <div className="bg-black text-[10px] border-2 border-black p-1.5 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap bg-white text-slate-900 border-slate-200">
                                <span className="text-xs">
                                  {lm.category === 'coffee' ? '☕' : lm.category === 'store' ? '🛒' : lm.category === 'exit' ? '🚪' : lm.category === 'atm' ? '🏪' : '📍'}
                                </span>
                                <div className="text-left">
                                  <span className="text-[9px] font-extrabold text-slate-900 block leading-tight">{lm.name}</span>
                                  <span className="text-[8px] text-slate-500 block font-mono font-semibold">{lm.distance} • bearing {lm.angleDeg}°</span>
                                </div>
                              </div>
                              {/* Visual guide drop needle */}
                              <div className="w-1 h-14 bg-black/20 border-l border-dashed border-black/30" />
                            </div>
                          );
                        })}

                        {/* DYNAMIC DRIVER VEHICLE IN Horizon (FLOAT BY ANGLE BEARING) */}
                        {(() => {
                          const xPct = calculateLandmarkXPercent(driverBearing);
                          if (xPct === null) return null;

                          // Visual vehicle size scales inversely to distance! Increments closer.
                          const maxDistance = 250;
                          const closenessPct = Math.min(1, Math.max(0.12, 1 - (driverDistanceMeters / maxDistance)));
                          const pixelWidth = Math.round(55 + (closenessPct * 65));
                          const opacityVal = 0.5 + (closenessPct * 0.5);

                          return (
                            <div
                              className="absolute -translate-x-1/2 flex flex-col items-center select-none cursor-pointer z-10 transition-all duration-100"
                              style={{
                                left: `${xPct}%`,
                                top: `${48 - (closenessPct * 10)}%`,
                                opacity: opacityVal
                              }}
                            >
                              {/* Floating vehicle details */}
                              <div className="bg-sky-700 text-white font-black px-2 py-0.5 rounded-full text-[8.5px] shadow-lg mb-1.5 border border-sky-620 whitespace-nowrap animate-bounce-slow">
                                🚖 RAHUL IS HERE ({driverDistanceMeters}m)
                              </div>
                              
                              {/* Stylized Rear End / front of Uber Dzire Suzuki car */}
                              <div 
                                className="bg-black border-2 border-sky-450 rounded-2xl p-2 text-center flex items-center gap-2 shadow-md bg-slate-950"
                                style={{ width: `${pixelWidth}px` }}
                              >
                                <Car className="w-5 h-5 text-sky-400 flex-shrink-0 animate-pulse" />
                                <div className="text-left select-none text-[8.5px] overflow-hidden truncate">
                                  <span className="text-white block font-black truncate leading-none">{scenario.driver.car}</span>
                                  <span className="text-sky-350 block font-mono font-bold leading-none mt-1">DL 1C AB 4296</span>
                                </div>
                              </div>
                              
                              {/* Visual wheel trail */}
                              <div className="w-1 h-12 bg-sky-500/20 border-l border-dashed border-sky-500/40" />
                            </div>
                          );
                        })()}

                        {/* HIGH-FIDELITY mini-radar compass hud overlay in the corner */}
                        <div className="absolute top-2 right-2 bg-black/90 border-2 border-slate-800 p-0.5 rounded-full w-[54px] h-[54px] overflow-hidden z-20 flex items-center justify-center shadow-md">
                          <svg className="w-full h-full" viewBox="0 0 48 48">
                            {/* Outer compass rim */}
                            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
                            
                            {/* Compass direction indicators standing upright */}
                            <text x="24" y="8" fill="#FFFFFF" opacity="0.5" fontSize="5" fontWeight="black" textAnchor="middle">N</text>
                            <text x="41" y="26" fill="#FFFFFF" opacity="0.3" fontSize="5" fontWeight="bold" textAnchor="middle">E</text>
                            <text x="24" y="44" fill="#FFFFFF" opacity="0.3" fontSize="5" fontWeight="bold" textAnchor="middle">S</text>
                            <text x="7" y="26" fill="#FFFFFF" opacity="0.3" fontSize="5" fontWeight="bold" textAnchor="middle">W</text>
                            
                            {/* Rotating active FoV radar beam wedge */}
                            <g style={{ transform: `rotate(${panAngle}deg)`, transformOrigin: '24px 24px', transition: 'transform 0.08s ease-out' }}>
                              {/* Glowing yellow sweep cone */}
                              <path d="M24,24 L14,7 A12,12 0 0,1 34,7 Z" fill="rgba(34, 197, 94, 0.25)" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="1" />
                              <circle cx="24" cy="24" r="3" fill="#10B981" />
                            </g>
                            
                            {/* Static active center indicator dot */}
                            <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />

                            {/* Driver golden dot on radar */}
                            {(() => {
                              const rad = (driverBearing * Math.PI) / 180;
                              const dotX = 24 + 14 * Math.sin(rad);
                              const dotY = 24 - 14 * Math.cos(rad);
                              return (
                                <circle cx={dotX} cy={dotY} r="2" fill="#F59E0B" className="animate-pulse" />
                              );
                            })()}

                            {/* Target Hub green dot on radar */}
                            {(() => {
                              const rad = (hubBearing * Math.PI) / 180;
                              const dotX = 24 + 14 * Math.sin(rad);
                              const dotY = 24 - 14 * Math.cos(rad);
                              return (
                                <circle cx={dotX} cy={dotY} r="2.2" fill="#10B981" className="animate-ping" style={{ animationDuration: '2s' }} />
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Drag overlay tutorial */}
                        <div className="absolute top-2 left-2 bg-black/80 text-[9px] text-white px-2.5 py-1 rounded select-none pointer-events-none">
                          ↔ DRAG LEFT / RIGHT TO PAN AR VIEW
                        </div>

                      </div>

                    {/* Surrounding controller & tactile visual guidance feedback */}
                    <div className="p-4 space-y-4">
                      
                      {/* Physical Compass quick alignments helper selection */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">COMPASS ASSISTANCE:</span>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <button
                            onClick={() => setPanAngle(0)}
                            className="py-1.5 text-xs font-bold border border-slate-200 bg-white rounded-xl text-slate-800 hover:bg-slate-50 transition shadow-sm"
                          >
                            North (0°)
                          </button>
                          <button
                            onClick={() => setPanAngle(90)}
                            className="py-1.5 text-xs font-bold border border-slate-200 bg-white rounded-xl text-slate-800 hover:bg-slate-50 transition shadow-sm"
                          >
                            East (90°)
                          </button>
                          <button
                            onClick={() => setPanAngle(180)}
                            className="py-1.5 text-xs font-bold border border-slate-200 bg-white rounded-xl text-slate-800 hover:bg-slate-50 transition shadow-sm"
                          >
                            South (180°)
                          </button>
                          <button
                            onClick={() => setPanAngle(270)}
                            className="py-1.5 text-xs font-bold border border-slate-200 bg-white rounded-xl text-slate-800 hover:bg-slate-50 transition shadow-sm"
                          >
                            West (270°)
                          </button>
                        </div>
                      </div>

                      {/* Interactive bearing angle slider */}
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Horizontal Pan Lens angle:</span>
                          <span className="font-mono text-black font-black">{Math.round(panAngle)}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="359"
                          value={Math.round(panAngle)}
                          onChange={(e) => setPanAngle(Number(e.target.value))}
                          className="w-full accent-black h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono select-none">
                          <span>N (0°)</span>
                          <span>E (90°)</span>
                          <span>S (180°)</span>
                          <span>W (270°)</span>
                        </div>
                      </div>

                      {/* Real-time driver sight vector status summary card */}
                      <div className="bg-white p-3.5 border-2 border-black rounded-2xl flex items-center justify-between select-none shadow-sm">
                        <div className="flex items-center gap-2">
                          <Compass className="w-5 h-5 text-black animate-pulse" />
                          <div>
                            <span className="text-[10px] text-slate-400 block leading-tight font-bold">Driver Direction Vector:</span>
                            <span className="text-xs font-bold text-slate-900 block mt-0.5">
                              Bearing {Math.round(driverBearing)}° ({driverDistanceMeters}m away)
                            </span>
                          </div>
                        </div>
                        
                        {(() => {
                          const angleDiff = Math.abs((driverBearing - panAngle) % 360);
                          const isAligned = angleDiff < 30 || angleDiff > 330;
                          return (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              isAligned
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isAligned ? '✨ Active in view' : 'Turn to locate'}
                            </span>
                          );
                        })()}
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. STEP-BY-STEP CAMERA AR HUD GUIDANCE */}
                {activeInternalTab === 'ar' && (
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200 flex justify-between select-none font-bold">
                      <span>Live camera waypoint overlay alignment:</span>
                      <span className="text-emerald-700 font-semibold">• Active</span>
                    </div>

                    {/* Camera simulation canvas */}
                    <div className="w-full h-[280px] bg-slate-900 relative border-b border-slate-300 flex items-center justify-center p-4">
                      
                      {/* Background overlay mock camera aperture corner lines */}
                      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/60" />
                      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/60" />
                      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/60" />
                      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/60" />

                      <div className="text-center space-y-4 max-w-[80%] z-10">
                        {/* Huge HUD navigation chevrons */}
                        <div className="flex justify-center space-x-1 animate-bounce">
                          <Navigation className="w-8 h-8 text-emerald-400 rotate-90" />
                          <Navigation className="w-8 h-8 text-emerald-400 rotate-90 opacity-60" />
                          <Navigation className="w-8 h-8 text-emerald-400 rotate-90 opacity-30" />
                        </div>
                        
                        <div className="space-y-1 select-none">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Walk out Exit Doors to Pillar 10
                          </h4>
                          <p className="text-[10px] text-slate-300">
                            Hold your physical phone aligned with the green guidance line. Keep left passing the arrivals counter.
                          </p>
                        </div>
                        
                        {/* Anchor checkpoint indicator */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-xs font-bold rounded-full border border-slate-850 text-emerald-450 shadow">
                          <CheckCircle className="w-3.5 h-3.5" /> 18m straight ahead
                        </div>
                      </div>

                      {/* Ambient blur overlays representation */}
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-none" />
                    </div>

                    {/* Detailed guidelines */}
                    <div className="p-4 space-y-4 text-xs animate-fade-in">
                      <div className="bg-white border-2 border-black p-5 rounded-2xl shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Accessibility className="w-5 h-5 text-emerald-700" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">ADA Compliant Pedestrian Path Active</h4>
                        </div>
                        <p className="text-xs text-slate-505 leading-relaxed font-display">
                          Our smart stop AR pathway maps strictly to wheelchair accessible routes, avoiding steep stairways or high curb lips. If you need special assistance, your driver Rahul is already notified.
                        </p>
                      </div>

                      <button
                        onClick={() => alert("Simulating gyroscope orientation recalibration. Complete!")}
                        className="w-full py-2.5 text-xs font-extrabold bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 transition rounded-xl shadow-sm cursor-pointer"
                      >
                        🔄 Recalibrate Compass Guide Sensors
                      </button>
                    </div>

                  </div>
                )}

                {/* 4. CHAT WITH AI ASSISTANT (GEMINI PROXY HANDLER) */}
                {activeInternalTab === 'chat' && (
                  <div className="flex-1 flex flex-col min-h-0 bg-white">
                    <div className="p-2.5 bg-slate-50 text-[10px] text-slate-500 border-b border-slate-200 select-none text-center font-bold">
                      Connected to Gemini 3.5 Assistant • Synced to location: <strong>{scenario.name}</strong>
                    </div>

                    {/* Chat Bubble list */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            msg.sender === 'user' ? 'justify-end' : 'justify-start'
                          } ${msg.sender === 'system' ? 'justify-center my-1' : ''}`}
                        >
                          {msg.sender === 'system' ? (
                            <div className="bg-slate-100 border border-slate-200 text-[10px] text-slate-700 px-3 py-1 rounded-full font-sans tracking-wide">
                              {msg.text}
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 max-w-[85%]">
                              {msg.sender === 'bot' && (
                                <div className="w-6 h-6 rounded-full bg-black border border-slate-200 font-bold text-[9px] flex items-center justify-center text-white">
                                  🤖
                                </div>
                              )}
                              <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                msg.sender === 'user'
                                  ? 'bg-black text-white font-medium rounded-tr-none'
                                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Simulated thinking indicator */}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-black border border-slate-200 font-bold text-[9px] flex items-center justify-center text-white">
                              🤖
                            </div>
                            <div className="bg-slate-50 border border-slate-200 text-slate-500 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce [animation-delay:0.4s]" />
                              <span>Co-pilot writing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Quick helper Clickable preset questions */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">Click to Ask Assistant:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                        <button
                          onClick={() => handleSendChatMessage(`How do I reach ${selectedHub.name.split(' ')[0]} Hub from exit gate 2?`)}
                          className="flex-shrink-0 px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition shadow-sm font-semibold cursor-pointer"
                        >
                          🚪 Exit directions to selected Hub
                        </button>
                        <button
                          onClick={() => handleSendChatMessage("Where is Starbucks located close to arrivals?")}
                          className="flex-shrink-0 px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition shadow-sm font-semibold cursor-pointer"
                        >
                          ☕ Locate starch check / coffee
                        </button>
                        <button
                          onClick={() => handleSendChatMessage("How can I double check accessibility or ramp paths for Hub C?")}
                          className="flex-shrink-0 px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 transition shadow-sm font-semibold cursor-pointer"
                        >
                          ♿ Wheelchair / ramp exits review
                        </button>
                      </div>
                    </div>

                    {/* Message input block */}
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type question for Uber Co-pilot..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-black font-semibold"
                      />
                      <button
                        onClick={() => handleSendChatMessage()}
                        disabled={aiLoading}
                        className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold hover:bg-slate-900 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>

              {/* DYNAMIC APPROACH SIMULATION STATION (BOTTOM BOARD) */}
              <div className="border-t border-slate-200 bg-white p-4 space-y-3 z-30">
                
                {/* Driver information deck */}
                <div className="flex items-center justify-between select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border border-slate-250 overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={scenario.driver.avatarUrl} alt="Driver avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-none block">{scenario.driver.name}</span>
                        <span className="text-[10px] font-bold text-slate-800 font-mono">★ {scenario.driver.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {scenario.driver.car} • <strong className="font-mono text-slate-800 font-extrabold">{scenario.driver.plate}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Immediate call button */}
                  <a
                    href={`tel:${scenario.driver.phone}`}
                    className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 transition shadow-sm cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Simulated Approaching control logic metrics */}
                <div className="bg-slate-50 border border-slate-220 p-3 rounded-2xl flex items-center justify-between select-none shadow-sm">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Simulated ride status:</span>
                    <span className="text-xs text-slate-800 font-bold block mt-0.5 animate-fade-in">
                      {simOn ? (
                        <span className="text-sky-700 font-bold flex items-center gap-1">
                          🚖 Driver Approaching — {simEta}s left
                        </span>
                      ) : simCompleted ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          ✔ Driver At Selected Hub ({selectedHub.id.startsWith('hub') ? 'Zone A' : 'Spot B'})!
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">Ride Connected • Idle approach</span>
                      )}
                    </span>
                  </div>

                  {/* Configurable speed modifier controls */}
                  {simOn && (
                    <div className="flex items-center gap-1 bg-slate-200 px-2 py-1 rounded-xl border border-slate-300 text-[95%]">
                      <span className="text-[9px] text-slate-500 font-mono">Speed:</span>
                      <button
                        onClick={() => setSimSpeed(1)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${simSpeed === 1 ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        1x
                      </button>
                      <button
                        onClick={() => setSimSpeed(3)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${simSpeed === 3 ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        3x
                      </button>
                      <button
                        onClick={() => setSimSpeed(8)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${simSpeed === 8 ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        8x
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary approach trigger controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (simOn) {
                        setSimOn(false);
                      } else {
                        setSimOn(true);
                        setSimCompleted(false);
                        // Add a contextual message to chat indicating start
                        setChatMessages(prev => [
                          ...prev,
                          { sender: 'system' as const, text: `🚖 Ride Approaching standard Pillar Stop. Use the 360-degree tracker tab to observe real physical horizon converge.` }
                        ]);
                      }
                    }}
                    className={`flex-1 py-3 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 transform active:scale-98 transition cursor-pointer shadow-sm ${
                      simOn
                        ? 'bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 font-bold'
                        : 'bg-black text-white hover:bg-slate-900 font-extrabold'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>{simOn ? 'Pause Approach Simulation' : 'Simulate Ride / Driver Approach'}</span>
                  </button>

                  {/* Reset scenario simulation */}
                  {(simOn || simCompleted) && (
                    <button
                      onClick={() => {
                        setSimOn(false);
                        setSimCompleted(false);
                        setDriverPos(scenario.driver.coords);
                        setSimEta(scenario.driver.etaSeconds);
                        setSimSpeed(1);
                      }}
                      className="px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-350 transition flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* iPhone Home Bottom Swipe Pill Bar */}
            <div className="h-[20px] bg-white flex items-center justify-center pb-2 border-t border-slate-100">
              <div className="w-[125px] h-[4px] bg-black/30 rounded-full" />
            </div>

          </div>

        </section>

      </main>

      {/* Unified footer note */}
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-400">
        <p className="font-mono">Created for Uber Product Management Assignment — Deep Visual-Tactile Friction Simulator, 2026</p>
      </footer>
    </div>
  );
}
