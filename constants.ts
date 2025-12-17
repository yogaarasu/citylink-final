
// In a real app, these would be in .env. 
// Simulating the Super Admin ID restriction.
export const SUPER_ADMIN_ID_SECRET = "SA-998877"; 

export const ISSUE_CATEGORIES = [
  "Infrastructure (Potholes, Roads)",
  "Sanitation (Garbage, Debris)",
  "Utilities (Water, Power, Gas)",
  "Public Safety",
  "Parks & Recreation",
  "Other"
];

// 38 Districts of Tamil Nadu
export const MOCK_CITIES = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", 
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", 
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", 
  "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", 
  "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", 
  "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", 
  "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", 
  "Viluppuram", "Virudhunagar"
];

// Corrected RTO Codes for Tamil Nadu Districts
export const CITY_RTO_CODES: Record<string, string> = {
  "Ariyalur": "61",
  "Chengalpattu": "19",
  "Chennai": "01",
  "Coimbatore": "37",
  "Cuddalore": "31",
  "Dharmapuri": "29",
  "Dindigul": "57",
  "Erode": "33",
  "Kallakurichi": "15",
  "Kancheepuram": "21",
  "Kanyakumari": "74",
  "Karur": "47",
  "Krishnagiri": "24",
  "Madurai": "58",
  "Mayiladuthurai": "82",
  "Nagapattinam": "49",
  "Namakkal": "28",
  "Nilgiris": "43",
  "Perambalur": "46",
  "Pudukkottai": "55",
  "Ramanathapuram": "65",
  "Ranipet": "73",
  "Salem": "30",
  "Sivaganga": "63",
  "Tenkasi": "76",
  "Thanjavur": "48",
  "Theni": "60",
  "Thoothukudi": "69",
  "Tiruchirappalli": "45",
  "Tirunelveli": "72",
  "Tirupathur": "83",
  "Tiruppur": "42",
  "Tiruvallur": "20",
  "Tiruvannamalai": "25",
  "Tiruvarur": "50",
  "Vellore": "23",
  "Viluppuram": "32",
  "Virudhunagar": "67"
};
