// server.ts
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";

// src/data/mockData.ts
var INITIAL_LOCATIONS = [
  // --- BANGALORE FACILITIES (Including 4 Original Demo Locations) ---
  {
    id: "loc-1",
    name: "Metro City Center Plaza",
    city: "Bangalore",
    area: "MG Road Commercial District",
    address: "Plot 42, Central Boulevard, Near MG Road Metro Station",
    landmark: "Opposite Metro Gate 2",
    totalSlots: 48,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    latitude: 12.9756,
    longitude: 77.6066,
    parkingType: "Multi-Level Covered",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 80 2558 9100",
    distanceFromCampusKm: 1.2
  },
  {
    id: "loc-2",
    name: "CyberTech IT Park Parking",
    city: "Bangalore",
    area: "Whitefield Tech Corridor",
    address: "Block C, Electronic City Phase 1, Tech Boulevard",
    landmark: "Near Software Technology Park Gate 4",
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    latitude: 12.9854,
    longitude: 77.7289,
    parkingType: "Underground Basement",
    operatingHours: "06:00 AM - 11:30 PM",
    openingTime: "06:00",
    closingTime: "23:30",
    contactPhone: "+91 80 4112 3400",
    distanceFromCampusKm: 4.5
  },
  {
    id: "loc-3",
    name: "Grand Central Shopping Mall",
    city: "Bangalore",
    area: "Koramangala 5th Block",
    address: "80ft Road, Sector 6, Next to Multiplex Arena",
    landmark: "Basement Level B1 & B2",
    totalSlots: 18,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    latitude: 12.9345,
    longitude: 77.6189,
    parkingType: "Multi-Level Covered",
    operatingHours: "09:00 AM - 11:00 PM",
    openingTime: "09:00",
    closingTime: "23:00",
    contactPhone: "+91 80 2553 4411",
    distanceFromCampusKm: 2.8
  },
  {
    id: "loc-4",
    name: "Railway Junction Station South",
    city: "Bangalore",
    area: "Majestic Railway Hub",
    address: "Platform 1 Circulating Area, Station Approach Rd",
    landmark: "Next to Prepaid Auto Stand",
    totalSlots: 16,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    latitude: 12.9782,
    longitude: 77.5694,
    parkingType: "Open Air Surface",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 80 2287 1420",
    distanceFromCampusKm: 5.1
  },
  {
    id: "loc-bng-5",
    name: "Kempegowda International Airport Parking T1",
    city: "Bangalore",
    area: "Devanahalli Airport Zone",
    address: "P4 Multi-Level Car Park, Terminal 1 Boulevard",
    landmark: "Opposite Terminal 1 Departure Gate 3",
    totalSlots: 32,
    rates: { firstHour: 30, additionalHour: 15 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    latitude: 13.1986,
    longitude: 77.7066,
    parkingType: "Smart Automated Stack",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 80 6678 2222",
    distanceFromCampusKm: 18
  },
  // --- TIRUPATI FACILITIES ---
  {
    id: "loc-tpt-1",
    name: "Tirupati Alipiri Grand Transit Parking",
    city: "Tirupati",
    area: "Alipiri Footway & Toll Gate",
    address: "Alipiri Bypass Road, Near Footway Entrance to Seven Hills",
    landmark: "Adjacent to Alipiri Garuda Statue & Srivari Mettu Hub",
    totalSlots: 26,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    latitude: 13.6521,
    longitude: 79.3942,
    parkingType: "Multi-Level Covered",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 877 227 7777",
    distanceFromCampusKm: 3.2
  },
  {
    id: "loc-tpt-2",
    name: "Tirupati Central Railway Station West Bay",
    city: "Tirupati",
    area: "Gandhi Road Station Hub",
    address: "Platform 4 West Circulating Area, Station Approach Rd",
    landmark: "Near APSRTC Central Bus Station Walkway",
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    latitude: 13.6288,
    longitude: 79.4192,
    parkingType: "Open Air Surface",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 877 222 5555",
    distanceFromCampusKm: 1.5
  },
  {
    id: "loc-tpt-3",
    name: "Tirumala Balaji SV Ground Parking",
    city: "Tirupati",
    area: "Tirumala Hill Top",
    address: "Outer Ring Road, Near PAC 4 & Annaprasadam Complex",
    landmark: "Behind SV Guest House & Pilgrim Amenities Center",
    totalSlots: 24,
    rates: { firstHour: 25, additionalHour: 15 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    latitude: 13.6833,
    longitude: 79.3472,
    parkingType: "Multi-Level Covered",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 877 226 3333",
    distanceFromCampusKm: 14
  },
  {
    id: "loc-tpt-4",
    name: "Bairagi Patteda Smart City Parking",
    city: "Tirupati",
    area: "Bairagi Patteda Commercial Area",
    address: "Main Commercial Street, Opposite Municipal Children Park",
    landmark: "Near Tirupati Smart City Command Center",
    totalSlots: 18,
    rates: { firstHour: 15, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    latitude: 13.619,
    longitude: 79.431,
    parkingType: "Smart Automated Stack",
    operatingHours: "06:00 AM - 11:00 PM",
    openingTime: "06:00",
    closingTime: "23:00",
    contactPhone: "+91 877 224 8899",
    distanceFromCampusKm: 2.1
  },
  // --- CHENNAI FACILITIES ---
  {
    id: "loc-chn-1",
    name: "Chennai Central Station North Plaza",
    city: "Chennai",
    area: "Park Town Heritage Zone",
    address: "Poonamallee High Road, Gate 3 Concourse",
    landmark: "Near Central Metro Station Exit 2 & Moore Market",
    totalSlots: 28,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    latitude: 13.0827,
    longitude: 80.2707,
    parkingType: "Multi-Level Covered",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 44 2535 3535",
    distanceFromCampusKm: 4
  },
  {
    id: "loc-chn-2",
    name: "T-Nagar Ranganathan Street Smart Parking",
    city: "Chennai",
    area: "T-Nagar Retail Hub",
    address: "Thanikachalam Road, Near Usman Road Junction",
    landmark: "Adjacent to T-Nagar Elevated Flyover & Shopping Mall",
    totalSlots: 24,
    rates: { firstHour: 25, additionalHour: 15 },
    image: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    latitude: 13.0418,
    longitude: 80.2341,
    parkingType: "Smart Automated Stack",
    operatingHours: "07:00 AM - 11:30 PM",
    openingTime: "07:00",
    closingTime: "23:30",
    contactPhone: "+91 44 2434 8800",
    distanceFromCampusKm: 6.2
  },
  {
    id: "loc-chn-3",
    name: "Marina Beach Promenade Parking Lot",
    city: "Chennai",
    area: "Triplicane Seafront",
    address: "Kamarajar Salai, Next to Light House & Marina Deck",
    landmark: "Opposite Queen Marys College & Gandhi Statue",
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    latitude: 13.0544,
    longitude: 80.2828,
    parkingType: "Open Air Surface",
    operatingHours: "05:00 AM - 11:30 PM",
    openingTime: "05:00",
    closingTime: "23:30",
    contactPhone: "+91 44 2844 1200",
    distanceFromCampusKm: 7.5
  },
  {
    id: "loc-chn-4",
    name: "OMR IT Corridor Park & Ride Deck",
    city: "Chennai",
    area: "Sholinganallur Tech Corridor",
    address: "Rajiv Gandhi Salai, Next to Sholinganallur Signal",
    landmark: "Near ELCOT SEZ & Cyber Vale Tech Park",
    totalSlots: 22,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    latitude: 12.901,
    longitude: 80.2279,
    parkingType: "Underground Basement",
    operatingHours: "06:00 AM - 11:30 PM",
    openingTime: "06:00",
    closingTime: "23:30",
    contactPhone: "+91 44 4390 1000",
    distanceFromCampusKm: 12
  },
  // --- HYDERABAD FACILITIES ---
  {
    id: "loc-hyd-1",
    name: "Hyderabad HITEC City Cyber Towers Parking",
    city: "Hyderabad",
    area: "Madhapur IT Hub",
    address: "Cyber Towers Quadrangle, Sector 2, HITEC City",
    landmark: "Opposite Cyber Towers Metro Station Gate A",
    totalSlots: 26,
    rates: { firstHour: 25, additionalHour: 15 },
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    latitude: 17.4504,
    longitude: 78.3808,
    parkingType: "Underground Basement",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 40 2311 0000",
    distanceFromCampusKm: 5.5
  },
  {
    id: "loc-hyd-2",
    name: "Secunderabad Junction Railway Hub Deck",
    city: "Hyderabad",
    area: "Secunderabad Railway Area",
    address: "Station Road, Platform 1 Circulating Plaza",
    landmark: "Next to Rathifile Bus Station & Metro Link",
    totalSlots: 20,
    rates: { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    latitude: 17.4334,
    longitude: 78.5045,
    parkingType: "Multi-Level Covered",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 40 2778 6170",
    distanceFromCampusKm: 8
  },
  // --- MUMBAI FACILITIES ---
  {
    id: "loc-mum-1",
    name: "BKC Financial Hub Underground Parking",
    city: "Mumbai",
    area: "Bandra Kurla Complex",
    address: "G-Block, Behind Bharat Diamond Bourse, BKC",
    landmark: "Near Jio World Drive & US Consulate",
    totalSlots: 30,
    rates: { firstHour: 30, additionalHour: 20 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    latitude: 19.0657,
    longitude: 72.8687,
    parkingType: "Underground Basement",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 22 2659 0000",
    distanceFromCampusKm: 10.2
  },
  {
    id: "loc-mum-2",
    name: "Chhatrapati Shivaji Maharaj Terminus Bay",
    city: "Mumbai",
    area: "Fort / South Mumbai",
    address: "Dr. D.N. Road, CSMT Station Concourse East",
    landmark: "Opposite BMC Headquarters & Suburban Exit 2",
    totalSlots: 22,
    rates: { firstHour: 25, additionalHour: 15 },
    image: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    latitude: 18.9401,
    longitude: 72.8353,
    parkingType: "Multi-Level Covered",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 22 2262 0000",
    distanceFromCampusKm: 12.5
  },
  // --- DELHI FACILITIES ---
  {
    id: "loc-del-1",
    name: "Connaught Place Underground Plaza",
    city: "Delhi",
    area: "Connaught Place Central Hub",
    address: "Radial Road 4, Inner Circle Block B & C",
    landmark: "Adjacent to Rajiv Chowk Metro Gate 5 & Palika Underground",
    totalSlots: 28,
    rates: { firstHour: 25, additionalHour: 15 },
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    latitude: 28.6315,
    longitude: 77.2167,
    parkingType: "Underground Basement",
    operatingHours: "07:00 AM - 12:00 AM",
    openingTime: "07:00",
    closingTime: "23:59",
    contactPhone: "+91 11 2336 0000",
    distanceFromCampusKm: 6
  },
  {
    id: "loc-del-2",
    name: "IGI Airport Terminal 3 Multi-Level Deck",
    city: "Delhi",
    area: "Aerocity IGI Airport",
    address: "Terminal 3 Parking Boulevard, Multi-Level Structure P3",
    landmark: "Connected to T3 Departure Hall via Air-conditioned Skywalk",
    totalSlots: 32,
    rates: { firstHour: 30, additionalHour: 20 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    latitude: 28.5562,
    longitude: 77.1,
    parkingType: "Smart Automated Stack",
    operatingHours: "24/7 All Days",
    openingTime: "00:00",
    closingTime: "23:59",
    contactPhone: "+91 11 4797 3000",
    distanceFromCampusKm: 15
  }
];
var INITIAL_USERS = [
  {
    id: "usr-1",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "9876543210",
    role: "user",
    password: "user123",
    createdAt: "2026-02-15T10:00:00.000Z"
  },
  {
    id: "usr-2",
    name: "Priya Patel",
    email: "priya@example.com",
    phone: "9876511223",
    role: "user",
    password: "user123",
    createdAt: "2026-02-18T14:30:00.000Z"
  },
  {
    id: "usr-admin",
    name: "System Administrator",
    email: "admin@smartparking.com",
    phone: "9999900000",
    role: "admin",
    password: "admin123",
    createdAt: "2026-01-01T08:00:00.000Z"
  }
];
function generateInitialSlots() {
  const slots2 = [];
  const loc1Slots = [
    // Ground Floor: G-01 to G-12 (Cars, Bikes, EV)
    { num: "G-01", floor: "Ground Floor", type: "car", status: "available" },
    { num: "G-02", floor: "Ground Floor", type: "car", status: "occupied" },
    { num: "G-03", floor: "Ground Floor", type: "car", status: "reserved" },
    { num: "G-04", floor: "Ground Floor", type: "car", status: "available" },
    { num: "G-05", floor: "Ground Floor", type: "ev", status: "available", charging: true },
    { num: "G-06", floor: "Ground Floor", type: "ev", status: "occupied", charging: true },
    { num: "G-07", floor: "Ground Floor", type: "bike", status: "available" },
    { num: "G-08", floor: "Ground Floor", type: "bike", status: "available" },
    { num: "G-09", floor: "Ground Floor", type: "bike", status: "occupied" },
    { num: "G-10", floor: "Ground Floor", type: "bike", status: "available" },
    { num: "G-11", floor: "Ground Floor", type: "car", status: "maintenance" },
    { num: "G-12", floor: "Ground Floor", type: "car", status: "available" },
    // Floor 1: F1-01 to F1-12
    { num: "F1-01", floor: "Floor 1", type: "car", status: "available" },
    { num: "F1-02", floor: "Floor 1", type: "car", status: "available" },
    { num: "F1-03", floor: "Floor 1", type: "car", status: "occupied" },
    { num: "F1-04", floor: "Floor 1", type: "car", status: "available" },
    { num: "F1-05", floor: "Floor 1", type: "car", status: "available" },
    { num: "F1-06", floor: "Floor 1", type: "ev", status: "available", charging: true },
    { num: "F1-07", floor: "Floor 1", type: "bike", status: "available" },
    { num: "F1-08", floor: "Floor 1", type: "bike", status: "occupied" },
    { num: "F1-09", floor: "Floor 1", type: "bike", status: "available" },
    { num: "F1-10", floor: "Floor 1", type: "car", status: "available" },
    { num: "F1-11", floor: "Floor 1", type: "car", status: "reserved" },
    { num: "F1-12", floor: "Floor 1", type: "car", status: "available" },
    // Floor 2: F2-01 to F2-12
    { num: "F2-01", floor: "Floor 2", type: "car", status: "available" },
    { num: "F2-02", floor: "Floor 2", type: "car", status: "occupied" },
    { num: "F2-03", floor: "Floor 2", type: "car", status: "available" },
    { num: "F2-04", floor: "Floor 2", type: "ev", status: "available", charging: true },
    { num: "F2-05", floor: "Floor 2", type: "ev", status: "occupied", charging: true },
    { num: "F2-06", floor: "Floor 2", type: "car", status: "available" },
    { num: "F2-07", floor: "Floor 2", type: "bike", status: "available" },
    { num: "F2-08", floor: "Floor 2", type: "bike", status: "occupied" },
    { num: "F2-09", floor: "Floor 2", type: "bike", status: "available" },
    { num: "F2-10", floor: "Floor 2", type: "car", status: "available" },
    { num: "F2-11", floor: "Floor 2", type: "car", status: "available" },
    { num: "F2-12", floor: "Floor 2", type: "car", status: "available" },
    // Floor 3: F3-01 to F3-12 (Rooftop Sky Deck)
    { num: "F3-01", floor: "Floor 3", type: "car", status: "available" },
    { num: "F3-02", floor: "Floor 3", type: "car", status: "available" },
    { num: "F3-03", floor: "Floor 3", type: "car", status: "occupied" },
    { num: "F3-04", floor: "Floor 3", type: "ev", status: "available", charging: true },
    { num: "F3-05", floor: "Floor 3", type: "car", status: "available" },
    { num: "F3-06", floor: "Floor 3", type: "car", status: "available" },
    { num: "F3-07", floor: "Floor 3", type: "bike", status: "available" },
    { num: "F3-08", floor: "Floor 3", type: "bike", status: "available" },
    { num: "F3-09", floor: "Floor 3", type: "car", status: "available" },
    { num: "F3-10", floor: "Floor 3", type: "car", status: "available" },
    { num: "F3-11", floor: "Floor 3", type: "car", status: "reserved" },
    { num: "F3-12", floor: "Floor 3", type: "car", status: "available" }
  ];
  loc1Slots.forEach((s, idx) => {
    slots2.push({
      id: `slot-loc1-${idx + 1}`,
      locationId: "loc-1",
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 8 + 10,
      isShaded: s.floor === "Ground Floor" || idx % 2 === 0
    });
  });
  const loc2Slots = [
    { num: "A-01", floor: "Basement 1", type: "car", status: "available" },
    { num: "A-02", floor: "Basement 1", type: "car", status: "occupied" },
    { num: "A-03", floor: "Basement 1", type: "ev", status: "available", charging: true },
    { num: "A-04", floor: "Basement 1", type: "bike", status: "available" },
    { num: "A-05", floor: "Basement 1", type: "bike", status: "occupied" },
    { num: "B-01", floor: "Basement 2", type: "car", status: "available" },
    { num: "B-02", floor: "Basement 2", type: "car", status: "available" },
    { num: "B-03", floor: "Basement 2", type: "car", status: "reserved" },
    { num: "B-04", floor: "Basement 2", type: "ev", status: "available", charging: true },
    { num: "B-05", floor: "Basement 2", type: "car", status: "available" }
  ];
  loc2Slots.forEach((s, idx) => {
    slots2.push({
      id: `slot-loc2-${idx + 1}`,
      locationId: "loc-2",
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 12 + 15,
      isShaded: true
    });
  });
  const loc3Slots = [
    { num: "M-101", floor: "Lower Ground", type: "car", status: "available" },
    { num: "M-102", floor: "Lower Ground", type: "car", status: "available" },
    { num: "M-103", floor: "Lower Ground", type: "ev", status: "occupied", charging: true },
    { num: "M-104", floor: "Lower Ground", type: "bike", status: "available" },
    { num: "M-105", floor: "Lower Ground", type: "car", status: "reserved" },
    { num: "M-106", floor: "Lower Ground", type: "car", status: "available" }
  ];
  loc3Slots.forEach((s, idx) => {
    slots2.push({
      id: `slot-loc3-${idx + 1}`,
      locationId: "loc-3",
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 10 + 20,
      isShaded: true
    });
  });
  const loc4Slots = [
    { num: "R-01", floor: "Open Parking Lot", type: "car", status: "available" },
    { num: "R-02", floor: "Open Parking Lot", type: "car", status: "occupied" },
    { num: "R-03", floor: "Open Parking Lot", type: "bike", status: "available" },
    { num: "R-04", floor: "Open Parking Lot", type: "bike", status: "available" },
    { num: "R-05", floor: "Open Parking Lot", type: "car", status: "available" },
    { num: "R-06", floor: "Open Parking Lot", type: "car", status: "available" }
  ];
  loc4Slots.forEach((s, idx) => {
    slots2.push({
      id: `slot-loc4-${idx + 1}`,
      locationId: "loc-4",
      slotNumber: s.num,
      floor: s.floor,
      vehicleType: s.type,
      status: s.status,
      hourlyRateFirstHour: 20,
      hourlyRateAdditional: 10,
      hasCharging: s.charging ?? false,
      distanceToEntranceMeters: (idx + 1) * 15 + 5,
      isShaded: false
    });
  });
  INITIAL_LOCATIONS.forEach((loc) => {
    if (loc.id !== "loc-1" && loc.id !== "loc-2" && loc.id !== "loc-3" && loc.id !== "loc-4") {
      const generated = generateSlotsForLocation(loc);
      slots2.push(...generated);
    }
  });
  return slots2;
}
function generateSlotsForLocation(loc) {
  const slots2 = [];
  const isBasement = loc.parkingType?.toLowerCase().includes("basement");
  const isOpen = loc.parkingType?.toLowerCase().includes("open");
  const floors = isBasement ? ["Basement 1", "Basement 2"] : isOpen ? ["Open Parking Lot"] : ["Ground Floor", "1st Floor"];
  const count = loc.totalSlots || 20;
  const perFloor = Math.ceil(count / floors.length);
  let globalIdx = 1;
  floors.forEach((floor, fIdx) => {
    const prefix = floor.startsWith("Basement") ? `B${fIdx + 1}` : floor.startsWith("Ground") ? "G" : floor.startsWith("Open") ? "P" : "F1";
    for (let i = 1; i <= perFloor && globalIdx <= count; i++) {
      const num = `${prefix}-${i < 10 ? "0" + i : i}`;
      const type = i % 6 === 0 ? "ev" : i % 3 === 0 ? "bike" : "car";
      const status = globalIdx === 2 || globalIdx === 5 ? "occupied" : globalIdx === 3 ? "reserved" : "available";
      slots2.push({
        id: `slot-${loc.id}-${globalIdx}`,
        locationId: loc.id,
        slotNumber: num,
        floor,
        vehicleType: type,
        status,
        hourlyRateFirstHour: loc.rates?.firstHour || 20,
        hourlyRateAdditional: loc.rates?.additionalHour || 10,
        hasCharging: type === "ev",
        distanceToEntranceMeters: 10 + i * 8,
        isShaded: !isOpen
      });
      globalIdx++;
    }
  });
  return slots2;
}
var INITIAL_BOOKINGS = [
  {
    id: "PK-94281",
    userId: "usr-1",
    userName: "Rahul Sharma",
    userEmail: "rahul@example.com",
    userPhone: "9876543210",
    locationId: "loc-1",
    locationName: "Metro City Center Plaza",
    slotId: "slot-loc1-3",
    slotNumber: "G-03",
    floor: "Ground Floor",
    vehicleType: "car",
    vehicleNumber: "KA 03 MX 4421",
    bookingDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    entryTime: "10:00 AM",
    exitTime: "01:00 PM",
    durationHours: 3,
    amount: 40,
    // ₹20 first hour + 2 * ₹10 = ₹40
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "UPI / PhonePe",
    transactionId: "TXN-9841284712",
    createdAt: new Date(Date.now() - 36e5).toISOString(),
    qrCodeData: "SPMS-PK-94281-SLOT-G03-LOC1"
  },
  {
    id: "PK-87114",
    userId: "usr-1",
    userName: "Rahul Sharma",
    userEmail: "rahul@example.com",
    userPhone: "9876543210",
    locationId: "loc-2",
    locationName: "CyberTech IT Park Parking",
    slotId: "slot-loc2-8",
    slotNumber: "B-03",
    floor: "Basement 2",
    vehicleType: "car",
    vehicleNumber: "KA 03 MX 4421",
    bookingDate: new Date(Date.now() - 864e5).toISOString().split("T")[0],
    entryTime: "09:00 AM",
    exitTime: "11:00 AM",
    durationHours: 2,
    amount: 30,
    // ₹20 + ₹10 = ₹30
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "Debit Card",
    transactionId: "TXN-7612349012",
    createdAt: new Date(Date.now() - 9e7).toISOString(),
    qrCodeData: "SPMS-PK-87114-SLOT-B03-LOC2"
  },
  {
    id: "PK-76229",
    userId: "usr-2",
    userName: "Priya Patel",
    userEmail: "priya@example.com",
    userPhone: "9876511223",
    locationId: "loc-1",
    locationName: "Metro City Center Plaza",
    slotId: "slot-loc1-23",
    slotNumber: "F1-11",
    floor: "1st Floor",
    vehicleType: "car",
    vehicleNumber: "KA 05 EQ 8900",
    bookingDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    entryTime: "11:30 AM",
    exitTime: "01:30 PM",
    durationHours: 2,
    amount: 30,
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "Google Pay",
    transactionId: "TXN-3829104812",
    createdAt: new Date(Date.now() - 72e5).toISOString(),
    qrCodeData: "SPMS-PK-76229-SLOT-F111-LOC1"
  }
];
var INITIAL_PAYMENTS = [
  {
    id: "pay-1",
    bookingId: "PK-94281",
    userId: "usr-1",
    userName: "Rahul Sharma",
    amount: 40,
    paymentMethod: "UPI / PhonePe",
    status: "paid",
    timestamp: new Date(Date.now() - 36e5).toISOString(),
    transactionRef: "TXN-9841284712"
  },
  {
    id: "pay-2",
    bookingId: "PK-87114",
    userId: "usr-1",
    userName: "Rahul Sharma",
    amount: 30,
    paymentMethod: "Debit Card",
    status: "paid",
    timestamp: new Date(Date.now() - 9e7).toISOString(),
    transactionRef: "TXN-7612349012"
  },
  {
    id: "pay-3",
    bookingId: "PK-76229",
    userId: "usr-2",
    userName: "Priya Patel",
    amount: 30,
    paymentMethod: "Google Pay",
    status: "paid",
    timestamp: new Date(Date.now() - 72e5).toISOString(),
    transactionRef: "TXN-3829104812"
  }
];

// server.ts
dotenv.config();
process.env.DISABLE_HMR = "true";
var app = express();
var server = http.createServer(app);
var PORT = 3e3;
var isProduction = process.env.NODE_ENV === "production";
var ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "*";
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, message: "Malformed JSON payload received." });
  }
  next(err);
});
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-App-Version, x-user-role, x-admin-id, Last-Event-ID"
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Type, X-Server-Time");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.get(["/download-project.zip", "/smart-parking-complete-project.zip", "/api/download-zip"], (req, res) => {
  const root = process.cwd();
  const zipCandidates = [
    path.resolve(root, "public", "smart-parking-complete-project.zip"),
    path.resolve(root, "dist", "smart-parking-complete-project.zip"),
    path.resolve(root, "smart-parking-complete-project.zip")
  ];
  for (const zipPath of zipCandidates) {
    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="smart-parking-complete-project.zip"');
      res.setHeader("Content-Type", "application/zip");
      return res.sendFile(zipPath);
    }
  }
  return res.status(404).send("ZIP file not ready yet. Please try again.");
});
var locations = [...INITIAL_LOCATIONS];
var slots = generateInitialSlots();
INITIAL_LOCATIONS.forEach((loc) => {
  const existing = slots.filter((s) => s.locationId === loc.id);
  if (existing.length === 0) {
    const generated = generateSlotsForLocation(loc);
    slots.push(...generated);
  }
});
var bookings = [...INITIAL_BOOKINGS];
var users = [...INITIAL_USERS];
var payments = [...INITIAL_PAYMENTS];
var notifications = [
  {
    id: "notif-1",
    userId: "usr-1",
    title: "Registration Successful",
    message: "Welcome to Smart Parking! Your driver account has been activated.",
    type: "registration",
    read: false,
    createdAt: new Date(Date.now() - 36e5 * 24).toISOString()
  },
  {
    id: "notif-2",
    userId: "usr-1",
    title: "Booking Confirmed - Bay G-03",
    message: "Reservation PK-94281 confirmed at Metro City Center Plaza. Present your QR pass at gate entry.",
    type: "booking_confirm",
    read: false,
    createdAt: new Date(Date.now() - 36e5 * 3).toISOString(),
    bookingId: "PK-94281"
  }
];
var adminNotifications = [
  {
    id: "adm-notif-1",
    adminId: "usr-admin",
    title: "New Booking: Bay G-03 Confirmed",
    message: "Reservation PK-94281 placed by Rahul Sharma (KA 03 MX 4421) at Metro City Center Plaza. Amount: \u20B940.00.",
    type: "new_booking",
    createdAt: new Date(Date.now() - 36e5 * 2.5).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: "PK-94281",
    bookingId: "PK-94281",
    metadata: {
      bookingId: "PK-94281",
      slotNumber: "G-03",
      locationName: "Metro City Center Plaza",
      userName: "Rahul Sharma",
      amount: 40
    }
  },
  {
    id: "adm-notif-2",
    adminId: "usr-admin",
    title: "Payment Received: \u20B940.00",
    message: "Online parking payment verified for Booking PK-94281 via UPI (TXN-9841284712).",
    type: "payment_update",
    createdAt: new Date(Date.now() - 36e5 * 2.4).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: "pay-1",
    bookingId: "PK-94281",
    metadata: {
      paymentId: "pay-1",
      amount: 40,
      transactionId: "TXN-9841284712"
    }
  },
  {
    id: "adm-notif-3",
    adminId: "usr-admin",
    title: "Slot Status: Bay G-02 Occupied",
    message: "Vehicle AP 03 CM 4488 entered Bay G-02 via Boom Barrier Entry Sensor 1.",
    type: "slot_update",
    createdAt: new Date(Date.now() - 36e5 * 1.5).toISOString(),
    isRead: true,
    read: true,
    relatedEntityId: "slot-loc1-2",
    metadata: {
      slotId: "slot-loc1-2",
      slotNumber: "G-02",
      status: "occupied"
    }
  },
  {
    id: "adm-notif-4",
    adminId: "usr-admin",
    title: "New User Registered: Priya Patel",
    message: "New driver account registered: priya@example.com (+91 98765 11223).",
    type: "user_registration",
    createdAt: new Date(Date.now() - 36e5 * 5).toISOString(),
    isRead: true,
    read: true,
    relatedEntityId: "usr-2",
    metadata: {
      userId: "usr-2",
      userName: "Priya Patel",
      email: "priya@example.com"
    }
  },
  {
    id: "adm-notif-5",
    adminId: "usr-admin",
    title: "Facility Capacity Alert: High Occupancy",
    message: "Metro City Center Plaza has 85% occupancy. Only 3 available bays remain.",
    type: "capacity_alert",
    createdAt: new Date(Date.now() - 36e5 * 0.8).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: "loc-1",
    metadata: {
      locationId: "loc-1",
      locationName: "Metro City Center Plaza",
      capacityPercentage: 85
    }
  }
];
function createAdminNotification(params) {
  const targetBookingId = params.metadata?.bookingId || params.relatedEntityId;
  if (targetBookingId && (params.type === "new_booking" || params.type === "payment_update")) {
    const existing = adminNotifications.find(
      (n) => n.type === params.type && (n.bookingId === targetBookingId || n.relatedEntityId === targetBookingId)
    );
    if (existing) {
      return existing;
    }
  }
  const notif = {
    id: `adm-notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    adminId: params.adminId || "usr-admin",
    title: params.title,
    message: params.message,
    type: params.type,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isRead: false,
    read: false,
    relatedEntityId: params.relatedEntityId,
    bookingId: params.metadata?.bookingId || params.relatedEntityId,
    metadata: params.metadata
  };
  adminNotifications.unshift(notif);
  persistDataToDisk();
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  if (params.type === "new_booking") {
    console.log("SERVER: Real-time booking event sent", {
      eventType: "ADMIN_NOTIFICATION",
      bookingId: notif.bookingId,
      slot: notif.metadata?.slotNumber,
      vehicle: notif.metadata?.vehicleNumber,
      user: notif.metadata?.userName,
      title: notif.title
    });
  }
  broadcastRealtimeEvent("ADMIN_NOTIFICATION", {
    notification: notif,
    unreadCount,
    action: "created"
  });
  return notif;
}
function checkLocationCapacity(locationId) {
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return;
  const locSlots = slots.filter((s) => s.locationId === locationId);
  if (locSlots.length === 0) return;
  const total = locSlots.length;
  const occupiedCount = locSlots.filter((s) => s.status === "occupied" || s.status === "reserved").length;
  const availableCount = locSlots.filter((s) => s.status === "available").length;
  const percentage = Math.round(occupiedCount / total * 100);
  if (availableCount === 0 || percentage >= 85) {
    createAdminNotification({
      title: `Capacity Alert: ${loc.name} ${availableCount === 0 ? "Full" : "Near Capacity"}`,
      message: `${loc.name} is currently at ${percentage}% capacity (${occupiedCount}/${total} slots occupied/reserved, ${availableCount} available).`,
      type: "capacity_alert",
      relatedEntityId: loc.id,
      metadata: {
        locationId: loc.id,
        locationName: loc.name,
        capacityPercentage: percentage,
        occupiedCount,
        availableCount,
        totalSlots: total,
        severity: availableCount === 0 ? "error" : "warning"
      }
    });
  }
}
var sessions = [
  {
    id: "sess-1",
    bookingId: "PK-94281",
    slotId: "slot-loc1-3",
    slotNumber: "G-03",
    locationId: "loc-1",
    vehicleNumber: "KA-01-MJ-5000",
    entryTime: new Date(Date.now() - 36e5 * 2).toISOString(),
    plannedDurationHours: 3,
    baseAmount: 40,
    totalAmountPaid: 40,
    status: "ACTIVE",
    verifiedBy: "Gate Scanner Terminal A1"
  },
  {
    id: "sess-2",
    bookingId: "PK-91204",
    slotId: "slot-loc1-2",
    slotNumber: "G-02",
    locationId: "loc-1",
    vehicleNumber: "AP 03 CM 4488",
    entryTime: new Date(Date.now() - 36e5 * 1.5).toISOString(),
    plannedDurationHours: 2,
    baseAmount: 30,
    totalAmountPaid: 30,
    status: "ACTIVE",
    verifiedBy: "Boom Barrier Entry Sensor 1"
  }
];
var DB_FILE = path.resolve(process.cwd(), "database", "smart_parking_store.json");
function persistDataToDisk() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dataToSave = {
      locations,
      slots,
      bookings,
      users,
      payments,
      sessions,
      notifications,
      adminNotifications,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), "utf8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("[Shared DB Persist Error]", err);
  }
}
function loadDataFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.locations) && parsed.locations.length > 0) locations = parsed.locations;
      if (Array.isArray(parsed.slots) && parsed.slots.length > 0) slots = parsed.slots;
      if (Array.isArray(parsed.bookings) && parsed.bookings.length > 0) bookings = parsed.bookings;
      if (Array.isArray(parsed.users) && parsed.users.length > 0) users = parsed.users;
      if (Array.isArray(parsed.payments) && parsed.payments.length > 0) payments = parsed.payments;
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) sessions = parsed.sessions;
      if (Array.isArray(parsed.notifications) && parsed.notifications.length > 0) notifications = parsed.notifications;
      if (Array.isArray(parsed.adminNotifications) && parsed.adminNotifications.length > 0) adminNotifications = parsed.adminNotifications;
      console.log(`[Shared DB] Successfully restored ${bookings.length} bookings, ${adminNotifications.length} notifications, ${slots.length} slots from ${DB_FILE}`);
      return;
    }
  } catch (err) {
    console.warn("[Shared DB Load Warning, initializing defaults]", err);
  }
  persistDataToDisk();
}
loadDataFromDisk();
var sseClients = /* @__PURE__ */ new Map();
var wss = new WebSocketServer({ server, path: "/api/ws" });
wss.on("error", (err) => {
  console.warn("[WebSocketServer Notice]", err?.message || err);
});
wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  const totalClients = wss.clients.size + sseClients.size;
  const welcomePayload = JSON.stringify({
    eventType: "CONNECTED",
    payload: {
      message: "Connected to Smart Parking Real-Time WebSocket Engine",
      connectedClients: totalClients,
      protocol: "websocket",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    activeClientsCount: totalClients
  });
  try {
    ws.send(welcomePayload);
  } catch {
  }
  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === "ping" || parsed.eventType === "ping") {
        ws.send(JSON.stringify({ eventType: "PONG", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
      }
    } catch {
    }
  });
  ws.on("error", () => {
  });
});
var wsHeartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 25e3);
wss.on("close", () => {
  clearInterval(wsHeartbeat);
});
function broadcastRealtimeEvent(eventType, payload) {
  const totalClients = wss.clients.size + sseClients.size;
  const messageData = JSON.stringify({
    eventType,
    payload,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    activeClientsCount: totalClients
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageData);
      } catch {
      }
    }
  });
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(`event: message
`);
      client.res.write(`data: ${messageData}

`);
    } catch (err) {
      sseClients.delete(clientId);
    }
  }
}
setInterval(() => {
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(`: keep-alive ${Date.now()}

`);
    } catch {
      sseClients.delete(clientId);
    }
  }
}, 2e4);
app.use((req, res, next) => {
  const isApi = req.path.startsWith("/api") || req.path.startsWith("/bookings") || req.path.startsWith("/slots") || req.path.startsWith("/locations") || req.path.startsWith("/payments") || req.path.startsWith("/sessions") || req.path.startsWith("/auth") || req.path.startsWith("/admin") || req.path.startsWith("/notifications") || req.path === "/health" || req.path === "/sync";
  if (isApi && req.path !== "/api/events" && req.path !== "/events") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  next();
});
function checkTimeOverlap(entry1, exit1, entry2, exit2) {
  const parseTimeToMinutes = (t) => {
    if (!t) return 0;
    const match = t.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridian = (match[3] || "").toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return hours * 60 + mins;
  };
  const start1 = parseTimeToMinutes(entry1);
  const end1 = parseTimeToMinutes(exit1);
  const start2 = parseTimeToMinutes(entry2);
  const end2 = parseTimeToMinutes(exit2);
  return Math.max(start1, start2) < Math.min(end1, end2);
}
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    status: "UP",
    database: process.env.DATABASE_URL || process.env.MYSQL_URL ? "CLOUD_MYSQL_CONFIGURED" : "SYNCED_CLOUD_STORE",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    connectedClients: sseClients.size,
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    serverPort: PORT
  });
});
app.get(["/api/events", "/events"], (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const userAgent = req.headers["user-agent"] || "Unknown Device";
  sseClients.set(clientId, {
    id: clientId,
    res,
    deviceInfo: userAgent,
    connectedAt: /* @__PURE__ */ new Date()
  });
  res.write(`event: connected
`);
  res.write(`data: ${JSON.stringify({
    clientId,
    connectedClients: sseClients.size,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  })}

`);
  req.on("close", () => {
    sseClients.delete(clientId);
  });
});
app.get(["/api/sync", "/sync"], (req, res) => {
  const adminUnreadCount = adminNotifications.filter((n) => !n.isRead).length;
  res.json({
    success: true,
    data: {
      locations,
      slots,
      bookings,
      payments,
      sessions,
      notifications,
      adminNotifications,
      adminUnreadCount,
      activeClientsCount: sseClients.size,
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
});
app.get(["/api/locations", "/locations"], (req, res) => {
  const { search, city } = req.query;
  let result = locations.map((loc) => {
    const locSlots = slots.filter((s) => s.locationId === loc.id);
    const availableCount = locSlots.filter((s) => s.status === "available").length;
    return {
      ...loc,
      availableSlots: locSlots.length > 0 ? availableCount : loc.availableSlots ?? Math.round(loc.totalSlots * 0.7)
    };
  });
  if (city && city !== "all") {
    result = result.filter((l) => l.city.toLowerCase() === String(city).toLowerCase());
  }
  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    result = result.filter(
      (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.area.toLowerCase().includes(q) || l.landmark.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.parkingType && l.parkingType.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, locations: result, data: result });
});
app.get(["/api/locations/:id", "/locations/:id"], (req, res) => {
  const loc = locations.find((l) => l.id === req.params.id);
  if (!loc) return res.status(404).json({ success: false, message: "Location not found" });
  const locSlots = slots.filter((s) => s.locationId === loc.id);
  const availableCount = locSlots.filter((s) => s.status === "available").length;
  const enriched = {
    ...loc,
    availableSlots: locSlots.length > 0 ? availableCount : loc.availableSlots ?? Math.round(loc.totalSlots * 0.7)
  };
  res.json({ success: true, location: enriched, data: enriched });
});
app.post(["/api/locations", "/locations"], (req, res) => {
  const { name, city, area, address, landmark, totalSlots, rates, parkingType, openingTime, closingTime, latitude, longitude } = req.body;
  if (!name || !city || !area) {
    return res.status(400).json({ success: false, message: "Name, city, and area are required." });
  }
  const newLoc = {
    id: `loc-api-${Date.now()}`,
    name,
    city,
    area,
    address: address || `${area}, ${city}`,
    landmark: landmark || `Central ${city}`,
    totalSlots: Number(totalSlots) || 20,
    rates: rates || { firstHour: 20, additionalHour: 10 },
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    parkingType: parkingType || "Multi-Level Covered",
    operatingHours: `${openingTime || "06:00 AM"} - ${closingTime || "11:30 PM"}`,
    openingTime: openingTime || "06:00",
    closingTime: closingTime || "23:30",
    latitude: Number(latitude) || 12.9716,
    longitude: Number(longitude) || 77.5946
  };
  locations.push(newLoc);
  const newSlots = generateSlotsForLocation(newLoc);
  slots.push(...newSlots);
  persistDataToDisk();
  broadcastRealtimeEvent("LOCATION_ADDED", { location: newLoc, slotsCount: newSlots.length });
  res.status(201).json({ success: true, message: "Location added successfully with generated slots", location: newLoc, data: newLoc });
});
app.get(["/api/slots", "/slots"], (req, res) => {
  const { locationId, availableOnly } = req.query;
  let result = [...slots];
  if (locationId) {
    result = result.filter((s) => s.locationId === String(locationId));
  }
  if (availableOnly === "true") {
    result = result.filter((s) => s.status === "available");
  }
  res.json({ success: true, slots: result, data: result });
});
app.get(["/api/slots/:id", "/slots/:id"], (req, res) => {
  const slot = slots.find((s) => s.id === req.params.id);
  if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
  res.json({ success: true, slot, data: slot });
});
app.put(["/api/slots/:id/status", "/slots/:id/status"], (req, res) => {
  const { status, bookingId } = req.body;
  const slotIndex = slots.findIndex((s) => s.id === req.params.id);
  if (slotIndex === -1) {
    return res.status(404).json({ success: false, message: "Slot not found" });
  }
  slots[slotIndex].status = status;
  if (bookingId) {
    slots[slotIndex].currentBookingId = bookingId;
  } else if (status === "available") {
    delete slots[slotIndex].currentBookingId;
  }
  const updatedSlot = slots[slotIndex];
  createAdminNotification({
    title: `Slot Update: Bay ${updatedSlot.slotNumber} is now ${status.toUpperCase()}`,
    message: `Parking bay ${updatedSlot.slotNumber} (${updatedSlot.floor}) status updated to ${status.toUpperCase()}${bookingId ? ` (Booking ID: ${bookingId})` : ""}.`,
    type: "slot_update",
    relatedEntityId: updatedSlot.id,
    metadata: {
      slotId: updatedSlot.id,
      slotNumber: updatedSlot.slotNumber,
      locationId: updatedSlot.locationId,
      status,
      bookingId
    }
  });
  if (status === "occupied" || status === "reserved") {
    checkLocationCapacity(updatedSlot.locationId);
  }
  persistDataToDisk();
  broadcastRealtimeEvent("SLOT_UPDATED", {
    slotId: updatedSlot.id,
    status: updatedSlot.status,
    slotNumber: updatedSlot.slotNumber,
    locationId: updatedSlot.locationId,
    bookingId
  });
  res.json({ success: true, message: `Slot status updated to ${status}`, slot: updatedSlot });
});
app.get(["/api/bookings", "/bookings"], (req, res) => {
  const { userId, bookingCode } = req.query;
  let result = [...bookings];
  if (bookingCode) {
    const found = result.find((b) => b.bookingCode === String(bookingCode) || b.id === String(bookingCode));
    if (!found) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, booking: found, data: found, bookings: [found] });
  }
  if (userId) {
    result = result.filter((b) => b.userId === String(userId));
  }
  res.json({ success: true, bookings: result, data: result });
});
app.get(["/api/bookings/:id", "/bookings/:id"], (req, res) => {
  const { id } = req.params;
  const found = bookings.find((b) => b.id === id || b.bookingCode === id);
  if (!found) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  return res.json({ success: true, booking: found, data: found });
});
app.get(["/api/admin/bookings", "/admin/bookings"], (req, res) => {
  res.json({ success: true, bookings, count: bookings.length, data: bookings });
});
app.post(["/api/bookings", "/api/bookings/", "/bookings", "/bookings/"], (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      locationId,
      slotId,
      vehicleType,
      vehicleNumber,
      bookingDate,
      entryTime,
      exitTime,
      durationHours,
      amount,
      paymentMethod
    } = req.body;
    let targetSlot = slots.find(
      (s) => slotId && s.id === slotId || locationId && s.locationId === locationId && (s.slotNumber || "").toLowerCase() === String(req.body.slotNumber || "").toLowerCase()
    );
    if (!targetSlot) {
      const loc = locations.find((l) => l.id === locationId);
      const computedSlotNum = req.body.slotNumber || (slotId ? String(slotId).replace(/^slot-[^-]+-/, "Bay-") : "Bay-01");
      targetSlot = {
        id: slotId || `slot-${locationId || "loc-1"}-${Date.now()}`,
        locationId: locationId || "loc-1",
        slotNumber: computedSlotNum,
        floor: req.body.floor || "Ground Floor",
        vehicleType: vehicleType || "car",
        status: "available",
        hourlyRateFirstHour: loc?.rates?.firstHour || 20,
        hourlyRateAdditional: loc?.rates?.additionalHour || 10,
        hasCharging: vehicleType === "ev",
        distanceToEntranceMeters: 20,
        isShaded: true
      };
      slots.push(targetSlot);
    }
    const isPreReservedBySelf = req.body.id && (targetSlot.currentBookingId === req.body.id || req.body.bookingCode === targetSlot.currentBookingId);
    if (targetSlot.status !== "available" && !isPreReservedBySelf) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Slot ${targetSlot.slotNumber} has just been reserved by another user. Please choose another bay.`
      });
    }
    const reqDate = bookingDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const reqEntry = entryTime || "10:00 AM";
    const reqExit = exitTime || "12:00 PM";
    const overlappingBooking = bookings.find((b) => {
      const isSameSlot = b.slotId === targetSlot.id || b.locationId === targetSlot.locationId && b.slotNumber === targetSlot.slotNumber;
      if (!isSameSlot) return false;
      if (b.status === "cancelled" || b.status === "completed") return false;
      if (req.body.id && (b.id === req.body.id || b.bookingCode === req.body.id)) return false;
      if (b.bookingDate !== reqDate) return false;
      return checkTimeOverlap(reqEntry, reqExit, b.entryTime, b.exitTime);
    });
    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Slot ${targetSlot.slotNumber} is already booked for ${overlappingBooking.entryTime} - ${overlappingBooking.exitTime}. Please select another slot or choose a different time.`
      });
    }
    const bookingCode = req.body.id || `PK-${Math.floor(1e4 + Math.random() * 9e4)}`;
    const targetLocation = locations.find((l) => l.id === locationId);
    const transactionId = req.body.transactionId || `TXN-${Date.now().toString().slice(-8)}`;
    const newBooking = {
      id: bookingCode,
      bookingCode,
      userId: userId || "usr-1",
      userName: userName || "Driver",
      userEmail: userEmail || "driver@example.com",
      userPhone: userPhone || "9876543210",
      locationId,
      locationName: targetLocation ? targetLocation.name : "Central Parking Facility",
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor || "Ground Floor",
      vehicleType: vehicleType || "car",
      vehicleNumber: vehicleNumber || "KA-01-AB-1234",
      bookingDate: bookingDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      entryTime: entryTime || "10:00 AM",
      exitTime: exitTime || "12:00 PM",
      durationHours: Number(durationHours) || 2,
      amount: Number(amount) || 40,
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "upi",
      status: "confirmed",
      transactionId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      qrCodeData: `SMART_PARK|${bookingCode}|${targetSlot.slotNumber}|${vehicleNumber}`
    };
    targetSlot.status = "reserved";
    targetSlot.currentBookingId = newBooking.id;
    bookings.unshift(newBooking);
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      bookingId: newBooking.id,
      amount: newBooking.amount,
      paymentMethod: paymentMethod || "upi",
      status: "completed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      transactionId
    };
    payments.unshift(paymentRecord);
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: newBooking.userId,
      title: `Booking Confirmed - Bay ${targetSlot.slotNumber}`,
      message: `Reservation ${newBooking.bookingCode} confirmed. Scan QR pass at gate barrier.`,
      type: "booking_confirm",
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      bookingId: newBooking.id
    });
    persistDataToDisk();
    const locName = targetLocation ? targetLocation.name : "Central Parking Facility";
    const entryStr = newBooking.entryTime || "Now";
    const notif = createAdminNotification({
      title: "New Parking Booking Received",
      message: `User: ${newBooking.userName} | Vehicle Number: ${newBooking.vehicleNumber} | Location: ${locName} | Floor: ${targetSlot.floor || "Ground Floor"} | Slot: ${targetSlot.slotNumber} | Booking Time: ${entryStr}`,
      type: "new_booking",
      relatedEntityId: newBooking.id,
      metadata: {
        bookingId: newBooking.id,
        bookingCode: newBooking.bookingCode,
        slotId: targetSlot.id,
        slotNumber: targetSlot.slotNumber,
        floor: targetSlot.floor || "Ground Floor",
        locationId: targetSlot.locationId,
        locationName: locName,
        userName: newBooking.userName,
        userPhone: newBooking.userPhone,
        vehicleNumber: newBooking.vehicleNumber,
        bookingTime: entryStr,
        status: "Confirmed",
        amount: newBooking.amount,
        paymentMethod: newBooking.paymentMethod
      }
    });
    createAdminNotification({
      title: `Payment Received: \u20B9${newBooking.amount}.00`,
      message: `Payment of \u20B9${newBooking.amount}.00 verified for Booking #${newBooking.bookingCode} via ${(paymentMethod || "UPI").toUpperCase()} (Txn: ${transactionId}).`,
      type: "payment_update",
      relatedEntityId: paymentRecord.id,
      metadata: {
        paymentId: paymentRecord.id,
        bookingId: newBooking.id,
        amount: newBooking.amount,
        paymentMethod: paymentMethod || "upi",
        transactionId,
        paymentStatus: "completed"
      }
    });
    checkLocationCapacity(targetSlot.locationId);
    console.log("SERVER: Real-time booking event sent", {
      eventType: "NEW_BOOKING",
      bookingId: newBooking.id,
      slot: targetSlot.slotNumber,
      floor: targetSlot.floor,
      location: locName,
      vehicle: newBooking.vehicleNumber,
      user: newBooking.userName,
      bookingTime: entryStr,
      status: newBooking.status
    });
    broadcastRealtimeEvent("NEW_BOOKING", {
      booking: newBooking,
      notification: notif,
      bookingId: newBooking.id,
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor || "Ground Floor",
      locationName: locName,
      userName: newBooking.userName,
      customerName: newBooking.userName,
      vehicleNumber: newBooking.vehicleNumber,
      bookingTime: entryStr,
      amount: newBooking.amount,
      status: "Confirmed",
      unreadCount: adminNotifications.filter((n) => !n.isRead).length
    });
    broadcastRealtimeEvent("BOOKING_CREATED", {
      booking: newBooking,
      notification: notif,
      slotId: targetSlot.id,
      slotNumber: targetSlot.slotNumber,
      floor: targetSlot.floor || "Ground Floor",
      locationId: targetSlot.locationId,
      locationName: locName,
      status: "reserved"
    });
    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: newBooking,
      data: newBooking
    });
  } catch (bookingError) {
    console.error("[Create Booking Error]", bookingError);
    res.status(500).json({
      success: false,
      message: `Server error creating booking: ${bookingError?.message || "Internal failure"}`
    });
  }
});
var handleCancelBooking = (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id || b.bookingCode === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  booking.status = "cancelled";
  if (booking.paymentStatus === "paid" || booking.paymentStatus === "completed") {
    booking.paymentStatus = "refunded";
    booking.refundStatus = "processed";
    booking.refundAmount = booking.amount;
  } else {
    booking.refundStatus = "not_applicable";
    booking.refundAmount = 0;
  }
  const targetSlot = slots.find((s) => s.id === booking.slotId);
  if (targetSlot) {
    targetSlot.status = "available";
    delete targetSlot.currentBookingId;
  }
  persistDataToDisk();
  createAdminNotification({
    title: `Booking Cancelled: #${booking.id}`,
    message: `Reservation #${booking.id} (${booking.slotNumber}, ${booking.vehicleNumber}) was cancelled by driver. Bay ${booking.slotNumber} has been released.${booking.refundStatus === "processed" ? ` Refund of \u20B9${booking.refundAmount?.toFixed(2)} processed.` : ""}`,
    type: "booking_cancellation",
    relatedEntityId: booking.id,
    metadata: {
      bookingId: booking.id,
      slotId: booking.slotId,
      slotNumber: booking.slotNumber,
      vehicleNumber: booking.vehicleNumber,
      userName: booking.userName,
      amount: booking.amount,
      refundStatus: booking.refundStatus,
      refundAmount: booking.refundAmount
    }
  });
  broadcastRealtimeEvent("BOOKING_CANCELLED", {
    bookingId: booking.id,
    slotId: booking.slotId,
    status: "available",
    refundStatus: booking.refundStatus
  });
  res.json({
    success: true,
    message: `Booking cancelled successfully and slot freed.${booking.refundStatus === "processed" ? ` \u20B9${booking.refundAmount?.toFixed(2)} refund processed.` : ""}`,
    booking,
    refundStatus: booking.refundStatus,
    refundAmount: booking.refundAmount
  });
};
app.put(["/api/bookings/:id/cancel", "/bookings/:id/cancel"], handleCancelBooking);
app.post(["/api/bookings/:id/cancel", "/bookings/:id/cancel"], handleCancelBooking);
var handleCompleteBooking = (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id || b.bookingCode === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }
  booking.status = "completed";
  booking.actualExitTime = (/* @__PURE__ */ new Date()).toISOString();
  const targetSlot = slots.find((s) => s.id === booking.slotId);
  if (targetSlot) {
    targetSlot.status = "available";
    delete targetSlot.currentBookingId;
  }
  persistDataToDisk();
  broadcastRealtimeEvent("BOOKING_COMPLETED", {
    bookingId: booking.id,
    slotId: booking.slotId,
    status: "available"
  });
  res.json({
    success: true,
    message: "Booking marked as completed",
    booking
  });
};
app.put(["/api/bookings/:id/complete", "/bookings/:id/complete"], handleCompleteBooking);
app.post(["/api/bookings/:id/complete", "/bookings/:id/complete"], handleCompleteBooking);
app.get(["/api/sessions", "/sessions"], (req, res) => {
  res.json({ success: true, sessions, data: sessions });
});
app.post(["/api/sessions/checkin", "/sessions/checkin"], (req, res) => {
  const { bookingId, vehicleNumber, verifiedBy } = req.body;
  const booking = bookings.find((b) => b.id === bookingId || b.bookingCode === bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Active booking not found for this pass" });
  }
  booking.status = "active";
  booking.actualEntryTime = (/* @__PURE__ */ new Date()).toISOString();
  const targetSlot = slots.find((s) => s.id === booking.slotId);
  if (targetSlot) {
    targetSlot.status = "occupied";
  }
  const session = {
    id: `sess-${Date.now()}`,
    bookingId: booking.id,
    slotId: booking.slotId,
    slotNumber: booking.slotNumber,
    locationId: booking.locationId,
    vehicleNumber: vehicleNumber || booking.vehicleNumber,
    entryTime: (/* @__PURE__ */ new Date()).toISOString(),
    plannedDurationHours: booking.durationHours,
    baseAmount: booking.amount,
    totalAmountPaid: booking.amount,
    status: "ACTIVE",
    verifiedBy: verifiedBy || "QR Gate Scanner A1"
  };
  sessions.unshift(session);
  persistDataToDisk();
  createAdminNotification({
    title: `Vehicle Gate Entry: Bay ${booking.slotNumber}`,
    message: `Vehicle ${vehicleNumber || booking.vehicleNumber} checked in for ${booking.slotNumber}. Boom barrier opened (${verifiedBy || "QR Gate Scanner"}).`,
    type: "slot_update",
    relatedEntityId: session.id,
    metadata: {
      sessionId: session.id,
      bookingId: booking.id,
      slotId: booking.slotId,
      slotNumber: booking.slotNumber,
      vehicleNumber: vehicleNumber || booking.vehicleNumber,
      status: "occupied"
    }
  });
  broadcastRealtimeEvent("GATE_ENTRY", {
    session,
    slotId: booking.slotId,
    status: "occupied"
  });
  res.json({ success: true, message: "Vehicle gate entry verified. Boom barrier opened.", session });
});
app.post(["/api/sessions/checkout", "/sessions/checkout"], (req, res) => {
  const { sessionId, slotId } = req.body;
  const session = sessions.find((s) => s.id === sessionId || s.slotId === slotId);
  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }
  session.status = "COMPLETED";
  session.exitTime = (/* @__PURE__ */ new Date()).toISOString();
  const booking = bookings.find((b) => b.id === session.bookingId);
  if (booking) {
    booking.status = "completed";
    booking.actualExitTime = session.exitTime;
  }
  const targetSlot = slots.find((s) => s.id === session.slotId);
  if (targetSlot) {
    targetSlot.status = "available";
    delete targetSlot.currentBookingId;
  }
  persistDataToDisk();
  createAdminNotification({
    title: `Vehicle Gate Exit: Bay ${session.slotNumber}`,
    message: `Vehicle ${session.vehicleNumber} checked out from Bay ${session.slotNumber}. Barrier opened. Bay is now available.`,
    type: "slot_update",
    relatedEntityId: session.id,
    metadata: {
      sessionId: session.id,
      bookingId: session.bookingId,
      slotId: session.slotId,
      slotNumber: session.slotNumber,
      vehicleNumber: session.vehicleNumber,
      status: "available"
    }
  });
  broadcastRealtimeEvent("GATE_EXIT", {
    sessionId: session.id,
    slotId: session.slotId,
    status: "available"
  });
  res.json({ success: true, message: "Vehicle checkout verified. Slot released.", session });
});
app.get(["/api/payments", "/payments"], (req, res) => {
  res.json({ success: true, payments, data: payments });
});
app.post(["/api/payments", "/payments"], (req, res) => {
  const { bookingId, amount, paymentMethod } = req.body;
  const newPay = {
    id: `pay-${Date.now()}`,
    bookingId,
    amount: Number(amount) || 20,
    paymentMethod: paymentMethod || "upi",
    status: "completed",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    transactionId: `TXN-${Date.now().toString().slice(-8)}`
  };
  payments.unshift(newPay);
  persistDataToDisk();
  createAdminNotification({
    title: `Payment Update: \u20B9${newPay.amount}.00`,
    message: `Payment of \u20B9${newPay.amount}.00 recorded for Booking #${newPay.bookingId} via ${newPay.paymentMethod.toUpperCase()} (Txn: ${newPay.transactionId}).`,
    type: "payment_update",
    relatedEntityId: newPay.id,
    metadata: {
      paymentId: newPay.id,
      bookingId: newPay.bookingId,
      amount: newPay.amount,
      paymentMethod: newPay.paymentMethod,
      transactionId: newPay.transactionId,
      paymentStatus: "completed"
    }
  });
  res.status(201).json({ success: true, payment: newPay, data: newPay });
});
app.all(["/api/tariff/calculate", "/tariff/calculate"], (req, res) => {
  const durationHours = Number(req.body?.durationHours || req.query?.durationHours || 1);
  const vehicleType = String(req.body?.vehicleType || req.query?.vehicleType || "car").toLowerCase();
  const hours = Math.max(1, Math.ceil(durationHours));
  let baseRate = 20;
  let addRate = 10;
  if (vehicleType === "bike") {
    baseRate = 10;
    addRate = 5;
  } else if (vehicleType === "ev") {
    baseRate = 25;
    addRate = 15;
  }
  const additionalHours = Math.max(0, hours - 1);
  const firstHourCharge = baseRate;
  const additionalHourCharge = additionalHours * addRate;
  const totalAmount = firstHourCharge + additionalHourCharge;
  res.json({
    success: true,
    data: {
      durationHours: hours,
      vehicleType,
      firstHourCharge,
      additionalHourCharge,
      additionalHours,
      totalAmount
    },
    totalAmount,
    firstHourCharge,
    additionalHourCharge,
    additionalHours,
    durationHours: hours
  });
});
app.post(["/api/auth/login", "/auth/login"], (req, res) => {
  const { email, password, asAdmin } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === (email || "").trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, message: "No account registered with this email." });
  }
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, message: "Incorrect password entered." });
  }
  if (asAdmin && user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied: Admin credentials required." });
  }
  res.json({ success: true, message: `Welcome back, ${user.name}!`, user });
});
app.post(["/api/auth/register", "/auth/register"], (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required." });
  }
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }
  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password,
    phone: phone || "",
    role: role === "admin" ? "admin" : "user",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  users.push(newUser);
  persistDataToDisk();
  createAdminNotification({
    title: `New User Registration: ${newUser.name}`,
    message: `A new driver account has registered: ${newUser.name} (${newUser.email}), Phone: ${newUser.phone || "N/A"}.`,
    type: "user_registration",
    relatedEntityId: newUser.id,
    metadata: {
      userId: newUser.id,
      userName: newUser.name,
      userEmail: newUser.email,
      phone: newUser.phone,
      role: newUser.role
    }
  });
  res.status(201).json({ success: true, message: "Account registered successfully", user: newUser });
});
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers["x-user-role"];
  const adminIdHeader = req.headers["x-admin-id"];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : "";
  const isRoleAdmin = roleHeader && String(roleHeader).toLowerCase() === "admin";
  const isAuthAdmin = token === "usr-admin" || token === "admin-token" || token.toLowerCase().includes("admin");
  const isAdminId = adminIdHeader && (adminIdHeader === "usr-admin" || adminIdHeader.toLowerCase().includes("admin"));
  const isQueryAdmin = req.query.asAdmin === "true" || req.query.role === "admin" || req.query.adminId === "usr-admin";
  const userMatch = users.find(
    (u) => (u.id === token || u.email.toLowerCase() === token.toLowerCase()) && u.role === "admin"
  );
  if (isRoleAdmin || isAuthAdmin || isAdminId || isQueryAdmin || userMatch) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied: Administrator authorization required."
  });
}
app.get(["/api/admin/notifications", "/admin/notifications"], requireAdmin, (req, res) => {
  const { filter, type, limit } = req.query;
  let result = [...adminNotifications];
  if (filter === "unread") {
    result = result.filter((n) => !n.isRead);
  }
  if (type && type !== "all") {
    result = result.filter((n) => n.type === String(type));
  }
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  const max = limit ? parseInt(String(limit), 10) : 100;
  res.json({
    success: true,
    notifications: result.slice(0, max),
    total: result.length,
    unreadCount,
    data: result.slice(0, max)
  });
});
app.get(["/api/admin/notifications/unread-count", "/admin/notifications/unread-count"], requireAdmin, (req, res) => {
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  res.json({
    success: true,
    count: unreadCount,
    unreadCount
  });
});
app.put(["/api/admin/notifications/:id/read", "/admin/notifications/:id/read"], requireAdmin, (req, res) => {
  const notif = adminNotifications.find((n) => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  notif.isRead = true;
  notif.read = true;
  persistDataToDisk();
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  broadcastRealtimeEvent("ADMIN_NOTIFICATION_READ", {
    notificationId: notif.id,
    unreadCount
  });
  res.json({
    success: true,
    message: "Notification marked as read",
    notification: notif,
    unreadCount
  });
});
app.put(["/api/admin/notifications/read-all", "/admin/notifications/read-all"], requireAdmin, (req, res) => {
  adminNotifications.forEach((n) => {
    n.isRead = true;
    n.read = true;
  });
  persistDataToDisk();
  broadcastRealtimeEvent("ADMIN_ALL_NOTIFICATIONS_READ", { unreadCount: 0 });
  res.json({
    success: true,
    message: "All admin notifications marked as read",
    unreadCount: 0
  });
});
app.delete(["/api/admin/notifications/:id", "/admin/notifications/:id"], requireAdmin, (req, res) => {
  const idx = adminNotifications.findIndex((n) => n.id === req.params.id);
  if (idx !== -1) {
    adminNotifications.splice(idx, 1);
    persistDataToDisk();
  }
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;
  res.json({ success: true, message: "Notification deleted", unreadCount });
});
app.post(["/api/admin/notifications/system-alert", "/admin/notifications/system-alert"], requireAdmin, (req, res) => {
  const { title, message, severity, relatedEntityId, metadata } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required." });
  }
  const alertNotif = createAdminNotification({
    title,
    message,
    type: "system_alert",
    relatedEntityId: relatedEntityId || "sys-event",
    metadata: {
      severity: severity || "warning",
      ...metadata || {}
    }
  });
  res.status(201).json({ success: true, notification: alertNotif, data: alertNotif });
});
app.get(["/api/notifications", "/notifications"], (req, res) => {
  const { userId } = req.query;
  const list = userId ? notifications.filter((n) => n.userId === userId || n.userId === "all") : notifications;
  res.json({ success: true, notifications: list, data: list });
});
app.put(["/api/notifications/:id/read", "/notifications/:id/read"], (req, res) => {
  const n = notifications.find((item) => item.id === req.params.id);
  if (n) {
    n.read = true;
    n.isRead = true;
  }
  res.json({ success: true, message: "Notification marked as read" });
});
app.post(["/api/realtime/broadcast", "/realtime/broadcast"], (req, res) => {
  const { eventType, payload } = req.body;
  if (eventType === "NEW_BOOKING" && payload) {
    const bId = payload.bookingId || `BK-${Date.now()}`;
    const user = payload.userName || payload.customerName || "Driver";
    const veh = payload.vehicleNumber || "KA-01-AB-1234";
    const loc = payload.locationName || "Central Parking Facility";
    const slot = payload.slotNumber || "Bay-01";
    const floor = payload.floor || "Ground Floor";
    const time = payload.bookingTime || "Just now";
    createAdminNotification({
      title: "New Parking Booking Received",
      message: `User: ${user} | Vehicle Number: ${veh} | Location: ${loc} | Floor: ${floor} | Slot: ${slot} | Booking Time: ${time}`,
      type: "new_booking",
      relatedEntityId: bId,
      metadata: { ...payload, bookingId: bId }
    });
    persistDataToDisk();
  }
  broadcastRealtimeEvent(eventType || "SYSTEM_SYNC", payload || {});
  res.json({ success: true, message: "Event broadcast to all connected devices", activeClients: sseClients.size });
});
app.all(
  [
    "/api",
    "/api/",
    "/api/*",
    "/bookings",
    "/bookings/",
    "/bookings/*",
    "/slots",
    "/slots/",
    "/slots/*",
    "/locations",
    "/locations/",
    "/locations/*",
    "/payments",
    "/payments/",
    "/payments/*",
    "/sessions",
    "/sessions/",
    "/sessions/*",
    "/auth",
    "/auth/*",
    "/admin",
    "/admin/*",
    "/notifications",
    "/notifications/",
    "/notifications/*"
  ],
  (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.path} not found. Please verify the URL.`
    });
  }
);
app.use((err, req, res, next) => {
  console.error("[API Unhandled Error]", err);
  if (res.headersSent) {
    return next(err);
  }
  if (req.path.startsWith("/api") || req.headers.accept?.includes("application/json")) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error while processing API request."
    });
  }
  next(err);
});
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/bookings") || req.path.startsWith("/slots") || req.path.startsWith("/locations") || req.path.startsWith("/payments") || req.path.startsWith("/sessions") || req.path.startsWith("/auth") || req.method !== "GET" || req.headers.accept && req.headers.accept.includes("application/json") && req.path !== "/") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.method} ${req.path} not found. Server is operational.`
    });
  }
  next();
});
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        etag: false,
        lastModified: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          }
        }
      }));
      app.get("*", (req, res) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null
        },
        appType: "spa"
      });
      app.use(vite.middlewares);
    }
  }
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Server] Port ${PORT} currently bound, retrying in 1.5s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {
        }
        server.listen(Number(PORT), "0.0.0.0");
      }, 1500);
    } else {
      console.error("[Server Error]", err);
    }
  });
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Smart Parking Full-Stack Server] running on http://0.0.0.0:${PORT}`);
    console.log(`[WebSocket Real-Time Engine] Active at /api/ws`);
    console.log(`[SSE Real-Time Engine] Active at /api/events`);
    console.log(`[Health Endpoint] Active at /api/health`);
  });
}
process.on("SIGTERM", () => {
  try {
    wss.close();
    server.close();
  } catch {
  }
  process.exit(0);
});
process.on("SIGINT", () => {
  try {
    wss.close();
    server.close();
  } catch {
  }
  process.exit(0);
});
startServer().catch((err) => {
  console.error("[Server Start Error]", err);
  process.exit(1);
});
export {
  broadcastRealtimeEvent,
  checkLocationCapacity,
  createAdminNotification,
  loadDataFromDisk,
  persistDataToDisk
};
