/**
 * BookNGo — Demo Seed Data
 * Contains realistic demo data for multi-business appointment management platform.
 * Supports Beauty, Healthcare, Fitness, Education, Home Services, and more.
 */

// Helper to get formatted date string (YYYY-MM-DD) relative to today
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const INITIAL_CATEGORIES = [
  { id: 'cat-beauty', name: 'Beauty & Wellness', icon: '✨', description: 'Skincare, makeup, and holistic wellness centers' },
  { id: 'cat-salon', name: 'Salons & Spas', icon: '💇', description: 'Hair styling, coloring, manicures, and massages' },
  { id: 'cat-health', name: 'Healthcare & Clinics', icon: '🩺', description: 'Medical clinics, dentists, physiotherapists, and specialists' },
  { id: 'cat-fitness', name: 'Fitness & Sports', icon: '🏋️', description: 'Personal trainers, yoga studios, and athletic coaches' },
  { id: 'cat-education', name: 'Education & Tutoring', icon: '📚', description: 'Academic tutors, language instructors, and test prep' },
  { id: 'cat-consulting', name: 'Professional Consultations', icon: '💼', description: 'Legal advisers, tax consultants, and career coaches' },
  { id: 'cat-home', name: 'Home Services & Repairs', icon: '🔧', description: 'Plumbing, electrical repairs, HVAC, and cleaning' },
  { id: 'cat-auto', name: 'Automotive Services', icon: '🚗', description: 'Car detailing, mechanics, oil changes, and inspections' },
  { id: 'cat-photo', name: 'Photography & Events', icon: '📸', description: 'Portrait studios, event photographers, and videography' },
  { id: 'cat-pet', name: 'Pet Care', icon: '🐾', description: 'Veterinary clinics, dog grooming, and pet training' },
  { id: 'cat-other', name: 'Other Services', icon: '⚡', description: 'Specialized and custom booked services' }
];

const INITIAL_PROVIDERS = [
  // 1. Salon & Spa
  {
    id: 'prov-1',
    name: 'Aurora Glow Salon & Spa',
    category: 'Salons & Spas',
    categoryId: 'cat-salon',
    tagline: 'Luxury hair styling, balayage, and restorative spa rituals',
    description: 'Aurora Glow offers modern beauty experiences with master stylists and certified colorists using organic botanicals.',
    location: 'Downtown Center',
    address: '104 Market Street, Suite 200, Downtown',
    phone: '+1 (555) 234-8901',
    email: 'aurora@salon.com',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 38,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '09:00',
    closeTime: '18:00',
    breaks: [{ start: '13:00', end: '13:30', label: 'Lunch Break' }],
    dateOverrides: {
      [getDateOffset(1)]: {
        isClosed: false,
        openTime: '09:00',
        closeTime: '18:00',
        capacityOverrides: { 'srv-102': 2 } // Demonstration: Hair straightening limited to 2 bookings tomorrow!
      }
    },
    services: [
      { id: 'srv-101', name: 'Precision Haircut & Blowdry', category: 'Hair', price: 45, duration: 45, description: 'Consultation, wash, tailored cut, and volume blowout styling.', enabled: true, dailyCapacity: 8 },
      { id: 'srv-102', name: 'Keratin Hair Straightening', category: 'Hair', price: 160, duration: 90, description: 'Intensive smoothing treatment for frizz-free, radiant hair.', enabled: true, dailyCapacity: 4 },
      { id: 'srv-103', name: 'Deep Cleanse Facial & Hydration', category: 'Skin', price: 75, duration: 60, description: 'Aromatherapy steam, exfoliation, extraction, and LED therapy.', enabled: true, dailyCapacity: 6 },
      { id: 'srv-104', name: 'Gel Manicure & Pedicure', category: 'Nails', price: 55, duration: 60, description: 'Nail shaping, cuticle treatment, and chip-free gel polish.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-101', name: 'Elena Rostova', title: 'Senior Stylist & Colorist', services: ['srv-101', 'srv-102'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false },
      { id: 'wrk-102', name: 'Chloe Bennett', title: 'Hair Stylist', services: ['srv-101'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-103', name: 'Maya Lin', title: 'Esthetician & Nail Specialist', services: ['srv-103', 'srv-104'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
    ]
  },

  // 2. Beauty & Wellness
  {
    id: 'prov-2',
    name: 'Luxe Skin & Aesthetics Lounge',
    category: 'Beauty & Wellness',
    categoryId: 'cat-beauty',
    tagline: 'Evidence-based skincare, dermal therapies, and lash artistry',
    description: 'Premier medical-grade aesthetics studio specializing in skin rejuvenation, lash extensions, and micro-needling.',
    location: 'Westside Heights',
    address: '422 Willow Creek Blvd, Westside',
    phone: '+1 (555) 345-6712',
    email: 'luxe@aesthetics.com',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 29,
    status: 'active',
    workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '10:00',
    closeTime: '19:00',
    breaks: [{ start: '14:00', end: '14:30', label: 'Midday Rest' }],
    dateOverrides: {},
    services: [
      { id: 'srv-201', name: 'Hydra-Facial Infusion', category: 'Facial', price: 110, duration: 60, description: 'Patented vortex suction to extract impurities and saturate with antioxidants.', enabled: true, dailyCapacity: 5 },
      { id: 'srv-202', name: 'Russian Volume Lash Extensions', category: 'Lashes', price: 95, duration: 75, description: 'Full glamour fan extensions for lush, long-lasting definition.', enabled: true, dailyCapacity: 4 },
      { id: 'srv-203', name: 'Laser Skin Rejuvenation', category: 'Aesthetics', price: 140, duration: 45, description: 'Non-invasive treatment promoting collagen production and even tone.', enabled: true, dailyCapacity: 4 }
    ],
    workers: [
      { id: 'wrk-201', name: 'Sophia Rossi', title: 'Master Esthetician', services: ['srv-201', 'srv-203'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false },
      { id: 'wrk-202', name: 'Hannah Kim', title: 'Lash & Brow Stylist', services: ['srv-202'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false }
    ]
  },

  // 3. Salon & Spa
  {
    id: 'prov-3',
    name: 'The Modern Barber & Co.',
    category: 'Salons & Spas',
    categoryId: 'cat-salon',
    tagline: 'Classic gentleman cuts, hot towel shaves, and beard grooming',
    description: 'An artisanal barbershop combining traditional craftsmanship with modern comfort and beverage service.',
    location: 'Midtown District',
    address: '88 Oakridge Ave, Midtown',
    phone: '+1 (555) 456-7890',
    email: 'modern@barber.com',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: 44,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    openTime: '08:30',
    closeTime: '19:30',
    breaks: [{ start: '12:30', end: '13:00', label: 'Lunch' }],
    dateOverrides: {},
    services: [
      { id: 'srv-301', name: 'Gentleman Haircut & Style', category: 'Hair', price: 35, duration: 30, description: 'Scissor and clipper cut tailored to your head shape, finished with neck shave.', enabled: true, dailyCapacity: 12 },
      { id: 'srv-302', name: 'Traditional Hot Towel Shave', category: 'Shave', price: 40, duration: 40, description: 'Warm lather, dual hot towels, straight razor precision, and cooling aftershave balm.', enabled: true, dailyCapacity: 8 },
      { id: 'srv-303', name: 'Beard Sculpting & Trim', category: 'Beard', price: 25, duration: 25, description: 'Beard shaping, line clean up, beard butter conditioning.', enabled: true, dailyCapacity: 10 }
    ],
    workers: [
      { id: 'wrk-301', name: 'Marcus Vance', title: 'Master Barber', services: ['srv-301', 'srv-302', 'srv-303'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-302', name: 'Julian Drake', title: 'Barber & Stylist', services: ['srv-301', 'srv-303'], workingDays: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'], isUnavailable: false }
    ]
  },

  // 4. Healthcare: Medical Clinic
  {
    id: 'prov-4',
    name: 'PrimeCare Family Medical Clinic',
    category: 'Healthcare & Clinics',
    categoryId: 'cat-health',
    tagline: 'Compassionate family medicine, health checkups, and pediatric care',
    description: 'Board-certified physicians offering comprehensive outpatient medical consultations, preventive screenings, and lab reviews.',
    location: 'Northside Medical Park',
    address: '710 Healthway Blvd, Suite 300, Northside',
    phone: '+1 (555) 567-8901',
    email: 'drsmith@care.com',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 52,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    openTime: '08:00',
    closeTime: '17:00',
    breaks: [{ start: '12:00', end: '13:00', label: 'Physician Lunch & Admin' }],
    dateOverrides: {},
    services: [
      { id: 'srv-401', name: 'General Physician Consultation', category: 'Consultation', price: 65, duration: 30, description: 'Comprehensive general health review, diagnosis, and prescription.', enabled: true, dailyCapacity: 10 },
      { id: 'srv-402', name: 'Comprehensive Annual Wellness Exam', category: 'Preventive', price: 120, duration: 60, description: 'Vital checks, blood panel order, cardiovascular review, and personalized health plan.', enabled: true, dailyCapacity: 4 },
      { id: 'srv-403', name: 'Pediatric Health Screening', category: 'Pediatrics', price: 70, duration: 30, description: 'Growth tracking, pediatric examination, and immunization guidance.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-401', name: 'Dr. Arthur Smith, MD', title: 'Internal Medicine Specialist', services: ['srv-401', 'srv-402'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-402', name: 'Dr. Emily Watson, MD', title: 'Pediatrician & Family Physician', services: ['srv-401', 'srv-403'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu'], isUnavailable: false }
    ]
  },

  // 5. Healthcare: Dental Studio
  {
    id: 'prov-5',
    name: 'Sparkle Dental & Orthodontics',
    category: 'Healthcare & Clinics',
    categoryId: 'cat-health',
    tagline: 'Gentle dental exams, scaling, ultrasonic whitening, and aligners',
    description: 'Modern dental clinic equipped with low-radiation digital 3D scans and anxiety-free gentle cleaning technology.',
    location: 'Downtown Center',
    address: '215 Grand Plaza, 4th Floor, Downtown',
    phone: '+1 (555) 678-9012',
    email: 'info@sparkledental.com',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 36,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '09:00',
    closeTime: '17:30',
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
    dateOverrides: {},
    services: [
      { id: 'srv-501', name: 'Dental Checkup & Ultrasonic Cleaning', category: 'Cleaning', price: 80, duration: 45, description: 'Oral cancer screening, plaque and tartar scaling, enamel polish.', enabled: true, dailyCapacity: 8 },
      { id: 'srv-502', name: 'Teeth Whitening Express Treatment', category: 'Cosmetic', price: 150, duration: 60, description: 'Medical grade LED accelerated enamel whitening up to 6 shades brighter.', enabled: true, dailyCapacity: 4 },
      { id: 'srv-503', name: 'Orthodontic / Clear Aligner Consult', category: 'Consultation', price: 40, duration: 30, description: '3D digital smile scan and aligner treatment simulation.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-501', name: 'Dr. Liam Nguyen, DDS', title: 'General Dentist & Prosthodontist', services: ['srv-501', 'srv-502'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-502', name: 'Dr. Rebecca Stern, DDS', title: 'Orthodontist Specialist', services: ['srv-501', 'srv-503'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
    ]
  },

  // 6. Fitness & Sports
  {
    id: 'prov-6',
    name: 'IronPulse Fitness & Performance',
    category: 'Fitness & Sports',
    categoryId: 'cat-fitness',
    tagline: '1-on-1 personal training, strength conditioning, and athletic rehab',
    description: 'High-performance training facility with certified strength coaches and biomechanics specialists.',
    location: 'Southside Marina',
    address: '500 Harborfront Drive, Building B, Southside',
    phone: '+1 (555) 789-0123',
    email: 'pulse@fitness.com',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 47,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '06:30',
    closeTime: '20:00',
    breaks: [{ start: '13:00', end: '14:00', label: 'Midday Maintenance' }],
    dateOverrides: {},
    services: [
      { id: 'srv-601', name: '1-on-1 Personal Strength Training', category: 'Training', price: 50, duration: 60, description: 'Personalized progressive resistance training program tailored to your goals.', enabled: true, dailyCapacity: 8 },
      { id: 'srv-602', name: 'Body Composition Analysis & Meal Plan', category: 'Nutrition', price: 40, duration: 30, description: 'DEXA scan/calipers assessment, metabolic rate analysis, macro guidelines.', enabled: true, dailyCapacity: 6 },
      { id: 'srv-603', name: 'Athletic Recovery & Mobility Session', category: 'Recovery', price: 45, duration: 45, description: 'Percussion therapy, myofascial release, guided mobility drills.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-601', name: 'Coach Derek Stone', title: 'CSCS Certified Strength Coach', services: ['srv-601', 'srv-603'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false },
      { id: 'wrk-602', name: 'Coach Tara Bell', title: 'Nutritionist & Mobility Specialist', services: ['srv-602', 'srv-603'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false }
    ]
  },

  // 7. Fitness & Sports: Yoga Studio
  {
    id: 'prov-7',
    name: 'Zenith Mind-Body Yoga Studio',
    category: 'Fitness & Sports',
    categoryId: 'cat-fitness',
    tagline: 'Private yoga instruction, breathwork therapy, and sound healing',
    description: 'Serene bamboo-floored sanctuary for private yoga progression, mindfulness meditation, and sound bath restorative sessions.',
    location: 'Westside Heights',
    address: '312 Pine Needle Rd, Westside',
    phone: '+1 (555) 890-1234',
    email: 'namaste@zenithyoga.com',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 31,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    openTime: '07:00',
    closeTime: '19:00',
    breaks: [{ start: '12:00', end: '13:00', label: 'Tea & Quiet Hour' }],
    dateOverrides: {},
    services: [
      { id: 'srv-701', name: 'Private Vinyasa / Hatha Yoga Class', category: 'Yoga', price: 55, duration: 60, description: 'Custom alignment cues, breathing mechanics, and targeted posture sequences.', enabled: true, dailyCapacity: 6 },
      { id: 'srv-702', name: 'Tibetan Sound Bath & Meditation', category: 'Sound', price: 60, duration: 45, description: 'Singing bowls harmonic frequency session for deep nervous system relief.', enabled: true, dailyCapacity: 5 }
    ],
    workers: [
      { id: 'wrk-701', name: 'Ananya Sharma', title: 'Senior Yoga & Meditation Master', services: ['srv-701', 'srv-702'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
    ]
  },

  // 8. Education & Tutoring
  {
    id: 'prov-8',
    name: 'Apex Academy STEM & Coding Tutors',
    category: 'Education & Tutoring',
    categoryId: 'cat-education',
    tagline: '1-on-1 Calculus, Physics, Python coding, and SAT prep',
    description: 'Accredited university graduates and software engineers offering personalized academic mentoring and project coaching.',
    location: 'Midtown District',
    address: '150 University Ave, 2nd Floor, Midtown',
    phone: '+1 (555) 901-2345',
    email: 'learn@apexacademy.com',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 39,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '10:00',
    closeTime: '20:00',
    breaks: [{ start: '14:00', end: '15:00', label: 'Break' }],
    dateOverrides: {},
    services: [
      { id: 'srv-801', name: 'High School Math & Calculus Tutoring', category: 'STEM', price: 40, duration: 60, description: 'Step-by-step problem solving in Algebra, Trigonometry, and AP Calculus.', enabled: true, dailyCapacity: 8 },
      { id: 'srv-802', name: 'Python & Web Development Coaching', category: 'Coding', price: 50, duration: 60, description: 'Hands-on programming, algorithms, debugging, and portfolio project guidance.', enabled: true, dailyCapacity: 6 },
      { id: 'srv-803', name: 'SAT / ACT Math Strategy Session', category: 'TestPrep', price: 55, duration: 60, description: 'Timed practice tests, shortcut techniques, and score optimization.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-801', name: 'Daniel Brooks, MS', title: 'Mathematics Lead Tutor', services: ['srv-801', 'srv-803'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-802', name: 'Priya Patel, BS CS', title: 'Coding & Algorithms Tutor', services: ['srv-802'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
    ]
  },

  // 9. Education: Language Institute
  {
    id: 'prov-9',
    name: 'LinguaSphere Language Lounge',
    category: 'Education & Tutoring',
    categoryId: 'cat-education',
    tagline: 'Conversational Spanish, French, German, and ESL coaching',
    description: 'Immersive native-speaker language sessions with practical scenarios for business travel, exams, and relocation.',
    location: 'Downtown Center',
    address: '89 Lexington Way, Suite 12, Downtown',
    phone: '+1 (555) 012-3456',
    email: 'speak@linguasphere.com',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: 22,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    openTime: '09:00',
    closeTime: '18:00',
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
    dateOverrides: {},
    services: [
      { id: 'srv-901', name: '1-on-1 Spanish Fluency Coaching', category: 'Language', price: 35, duration: 50, description: 'Dialogue drills, vocabulary mastery, and cultural context practice.', enabled: true, dailyCapacity: 6 },
      { id: 'srv-902', name: 'Business French for Executives', category: 'Language', price: 45, duration: 50, description: 'Formal presentation phrasing, negotiations, and corporate correspondence.', enabled: true, dailyCapacity: 5 }
    ],
    workers: [
      { id: 'wrk-901', name: 'Carlos Mendez', title: 'Native Spanish Instructor', services: ['srv-901'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-902', name: 'Claire Dubois', title: 'French Philology Specialist', services: ['srv-902'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu'], isUnavailable: false }
    ]
  },

  // 10. Home Services & Repairs
  {
    id: 'prov-10',
    name: 'FixRight Plumbing & Home Systems',
    category: 'Home Services & Repairs',
    categoryId: 'cat-home',
    tagline: 'Licensed master plumbers, leak detection, and water heater repairs',
    description: 'Rapid dispatch professional plumbers with transparent upfront pricing and 100% satisfaction guarantee.',
    location: 'Greater Metro Area',
    address: '940 Industrial Park Rd, Metro',
    phone: '+1 (555) 123-9876',
    email: 'service@fixrightpro.com',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 65,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '08:00',
    closeTime: '18:00',
    breaks: [{ start: '12:30', end: '13:30', label: 'Crew Rest' }],
    dateOverrides: {},
    services: [
      { id: 'srv-1001', name: 'Comprehensive Plumbing Diagnosis', category: 'Plumbing', price: 50, duration: 45, description: 'Detailed inspection of pressure, fixtures, drainage, and clear quote.', enabled: true, dailyCapacity: 8 },
      { id: 'srv-1002', name: 'Drain Snaking & Clog Clearance', category: 'Plumbing', price: 85, duration: 60, description: 'Mechanical auger clearing of stubborn kitchen, bath, or main pipe blockages.', enabled: true, dailyCapacity: 6 },
      { id: 'srv-1003', name: 'Water Heater Flush & Tune-up', category: 'Heating', price: 95, duration: 60, description: 'Sediment flush, anode rod inspection, burner and thermostat calibration.', enabled: true, dailyCapacity: 4 }
    ],
    workers: [
      { id: 'wrk-1001', name: 'Robert "Bob" Miller', title: 'Master Plumber (License #4982)', services: ['srv-1001', 'srv-1002', 'srv-1003'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false },
      { id: 'wrk-1002', name: 'Dave Jenkins', title: 'Journeyman Service Tech', services: ['srv-1001', 'srv-1002'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
    ]
  },

  // 11. Professional Consultations
  {
    id: 'prov-11',
    name: 'ClearPath Legal & Advisory',
    category: 'Professional Consultations',
    categoryId: 'cat-consulting',
    tagline: 'Business formation, contract reviews, and intellectual property',
    description: 'Strategic counsel for founders, freelancers, and small business owners navigating contracts, IP, and compliance.',
    location: 'Downtown Center',
    address: '600 Financial Way, 14th Floor, Downtown',
    phone: '+1 (555) 234-5678',
    email: 'counsel@clearpathlegal.com',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 18,
    status: 'active',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    openTime: '09:00',
    closeTime: '17:00',
    breaks: [{ start: '12:00', end: '13:00', label: 'Lunch' }],
    dateOverrides: {},
    services: [
      { id: 'srv-1101', name: 'Startup Business Formation Advice', category: 'Corporate', price: 90, duration: 45, description: 'Guidance on LLC vs C-Corp structuring, founder equity agreements, and filing.', enabled: true, dailyCapacity: 4 },
      { id: 'srv-1102', name: 'Contract & Non-Disclosure Review', category: 'Contracts', price: 75, duration: 30, description: 'Line-by-line review of employment, client, or vendor contracts to mitigate risks.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-1101', name: 'Victoria Vance, Esq.', title: 'Managing Partner & Attorney', services: ['srv-1101', 'srv-1102'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false }
    ]
  },

  // 12. Pending Provider for Admin Approval Flow Demonstration
  {
    id: 'prov-12',
    name: 'Paws & Whiskers Pet Grooming',
    category: 'Pet Care',
    categoryId: 'cat-pet',
    tagline: 'Gentle organic pet washes, coat trimming, and nail dremeling',
    description: 'New luxury boutique grooming salon catering to dogs and cats of all breeds with cage-free comfort.',
    location: 'Westside Heights',
    address: '810 Pet Plaza, Westside',
    phone: '+1 (555) 345-0987',
    email: 'paws@grooming.com',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    reviewCount: 0,
    status: 'pending', // Pending approval!
    workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    openTime: '09:00',
    closeTime: '17:00',
    breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
    dateOverrides: {},
    services: [
      { id: 'srv-1201', name: 'Full Spa Bath & Coat Deshedding', category: 'Bath', price: 50, duration: 60, description: 'Hypoallergenic warm bath, blowout, ear cleaning, and brush out.', enabled: true, dailyCapacity: 6 }
    ],
    workers: [
      { id: 'wrk-1201', name: 'Samantha Reed', title: 'Certified Pet Stylist', services: ['srv-1201'], workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
    ]
  }
];

const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Alex Morgan',
    email: 'alex@demo.com',
    phone: '+1 (555) 777-8899',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-08-10',
    totalVisits: 12
  },
  {
    id: 'cust-2',
    name: 'Sarah Connor',
    email: 'sarah@demo.com',
    phone: '+1 (555) 888-9900',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-09-01',
    totalVisits: 8
  },
  {
    id: 'cust-3',
    name: 'Sophia Laurent',
    email: 'sophia.l@gmail.com',
    phone: '+1 (555) 349-8812',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-07-15',
    totalVisits: 5
  },
  {
    id: 'cust-4',
    name: 'Marcus Sterling',
    email: 'marcus.s@outlook.com',
    phone: '+1 (555) 482-1920',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-05-20',
    totalVisits: 14,
    isVip: true
  },
  {
    id: 'cust-5',
    name: 'Claire Henderson',
    email: 'claire.h@icloud.com',
    phone: '+1 (555) 910-2345',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-08-01',
    totalVisits: 4
  },
  {
    id: 'cust-6',
    name: 'Daniel Kim',
    email: 'dkim@techcorp.io',
    phone: '+1 (555) 674-8899',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-09-12',
    totalVisits: 3
  },
  {
    id: 'cust-7',
    name: 'Amara Okonjo',
    email: 'amara.o@design.co',
    phone: '+1 (555) 234-9011',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-06-04',
    totalVisits: 7
  },
  {
    id: 'cust-8',
    name: 'David Miller',
    email: 'david.m@demo.com',
    phone: '+1 (555) 412-5566',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    joinedDate: '2026-08-22',
    totalVisits: 6
  }
];

// Pre-seeded bookings to test upcoming, completed, and capacity flows
const INITIAL_BOOKINGS = [
  // --- TODAY'S BOOKINGS FOR AURORA GLOW SALON (prov-1) ---
  // Elena Rostova (wrk-101)
  {
    bookingId: 'BNG-1001',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    customerEmail: 'alex@demo.com',
    customerPhone: '+1 (555) 777-8899',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    date: getDateOffset(0),
    time: '09:30',
    duration: 45,
    price: 45,
    status: 'completed',
    notes: 'Textured bob trim with heat protectant blowout.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1002',
    customerId: 'cust-2',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@demo.com',
    customerPhone: '+1 (555) 888-9900',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-102',
    serviceName: 'Keratin Hair Straightening',
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    date: getDateOffset(0),
    time: '11:15',
    duration: 90,
    price: 160,
    status: 'in-progress',
    notes: 'Deep conditioning application before keratin press.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1003',
    customerId: 'cust-8',
    customerName: 'David Miller',
    customerEmail: 'david.m@demo.com',
    customerPhone: '+1 (555) 412-5566',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    date: getDateOffset(0),
    time: '14:00',
    duration: 45,
    price: 45,
    status: 'confirmed',
    notes: 'Requested low fade with scissor work on top.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1004',
    customerId: 'cust-3',
    customerName: 'Sophia Laurent',
    customerEmail: 'sophia.l@gmail.com',
    customerPhone: '+1 (555) 349-8812',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    date: getDateOffset(0),
    time: '16:30',
    duration: 45,
    price: 45,
    status: 'confirmed',
    notes: 'Volume blowdry finish with round brush technique.',
    createdAt: new Date().toISOString()
  },

  // Chloe Bennett (wrk-102)
  {
    bookingId: 'BNG-1005',
    customerId: 'cust-5',
    customerName: 'Claire Henderson',
    customerEmail: 'claire.h@icloud.com',
    customerPhone: '+1 (555) 910-2345',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-102',
    workerName: 'Chloe Bennett',
    date: getDateOffset(0),
    time: '10:00',
    duration: 45,
    price: 45,
    status: 'completed',
    notes: 'Long layers with curtain bangs shaping.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1006',
    customerId: 'cust-6',
    customerName: 'Daniel Kim',
    customerEmail: 'dkim@techcorp.io',
    customerPhone: '+1 (555) 674-8899',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-102',
    workerName: 'Chloe Bennett',
    date: getDateOffset(0),
    time: '12:00',
    duration: 45,
    price: 45,
    status: 'confirmed',
    notes: 'Classic taper with scalp massage.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1007',
    customerId: 'cust-4',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus.s@outlook.com',
    customerPhone: '+1 (555) 482-1920',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-102',
    workerName: 'Chloe Bennett',
    date: getDateOffset(0),
    time: '15:15',
    duration: 45,
    price: 45,
    status: 'confirmed',
    notes: 'VIP guest: prepare signature espresso.',
    createdAt: new Date().toISOString()
  },

  // Maya Lin (wrk-103)
  {
    bookingId: 'BNG-1008',
    customerId: 'cust-7',
    customerName: 'Amara Okonjo',
    customerEmail: 'amara.o@design.co',
    customerPhone: '+1 (555) 234-9011',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-103',
    serviceName: 'Deep Cleanse Facial & Hydration',
    workerId: 'wrk-103',
    workerName: 'Maya Lin',
    date: getDateOffset(0),
    time: '09:00',
    duration: 60,
    price: 75,
    status: 'completed',
    notes: 'Sensitive skin serum treatment requested.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1009',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    customerEmail: 'alex@demo.com',
    customerPhone: '+1 (555) 777-8899',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-104',
    serviceName: 'Gel Manicure & Pedicure',
    workerId: 'wrk-103',
    workerName: 'Maya Lin',
    date: getDateOffset(0),
    time: '11:00',
    duration: 60,
    price: 55,
    status: 'in-progress',
    notes: 'Nude chrome finish on almond nails.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-1010',
    customerId: 'cust-5',
    customerName: 'Claire Henderson',
    customerEmail: 'claire.h@icloud.com',
    customerPhone: '+1 (555) 910-2345',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-103',
    serviceName: 'Deep Cleanse Facial & Hydration',
    workerId: 'wrk-103',
    workerName: 'Maya Lin',
    date: getDateOffset(0),
    time: '14:30',
    duration: 60,
    price: 75,
    status: 'confirmed',
    notes: 'Hydration booster with blue LED therapy.',
    createdAt: new Date().toISOString()
  },

  // --- TOMORROW & FUTURE BOOKINGS ---
  {
    bookingId: 'BNG-782194',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    customerEmail: 'alex@demo.com',
    customerPhone: '+1 (555) 777-8899',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    date: getDateOffset(2),
    time: '11:00',
    duration: 45,
    price: 45,
    status: 'confirmed',
    notes: 'Please keep length above shoulders.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-629103',
    customerId: 'cust-2',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@demo.com',
    customerPhone: '+1 (555) 888-9900',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    serviceId: 'srv-102',
    serviceName: 'Keratin Hair Straightening',
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    date: getDateOffset(1),
    time: '10:00',
    duration: 90,
    price: 160,
    status: 'confirmed',
    notes: 'Prior colored hair.',
    createdAt: new Date().toISOString()
  },
  {
    bookingId: 'BNG-410928',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    customerEmail: 'alex@demo.com',
    customerPhone: '+1 (555) 777-8899',
    providerId: 'prov-4',
    providerName: 'PrimeCare Family Medical Clinic',
    serviceId: 'srv-401',
    serviceName: 'General Physician Consultation',
    workerId: 'wrk-401',
    workerName: 'Dr. Arthur Smith, MD',
    date: getDateOffset(-3),
    time: '10:00',
    duration: 30,
    price: 65,
    status: 'completed',
    notes: 'Routine throat checkup.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    bookingId: 'BNG-193847',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    customerEmail: 'alex@demo.com',
    customerPhone: '+1 (555) 777-8899',
    providerId: 'prov-6',
    providerName: 'IronPulse Fitness & Performance',
    serviceId: 'srv-601',
    serviceName: '1-on-1 Personal Strength Training',
    workerId: 'wrk-601',
    workerName: 'Coach Derek Stone',
    date: getDateOffset(-1),
    time: '15:00',
    duration: 60,
    price: 50,
    status: 'cancelled',
    cancellationReason: 'Rescheduled for next month due to work conflict',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

// Rich Waitlist dataset inspired by Schedulo (Bagus Fikri Dribbble design)
const INITIAL_WAITLIST = [
  {
    id: 'wl-101',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    customerId: 'cust-3',
    customerName: 'Sophia Laurent',
    customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    customerPhone: '+1 (555) 349-8812',
    customerEmail: 'sophia.l@gmail.com',
    serviceId: 'srv-102',
    serviceName: 'Keratin Hair Straightening',
    duration: 90,
    price: 160,
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    preferredDate: getDateOffset(0),
    preferredTimeRange: 'Afternoon (14:00 - 17:00)',
    flexibleTime: false,
    priority: 'urgent', // urgent, vip, flexible, normal
    priorityLabel: 'High Urgency',
    status: 'waiting', // waiting, notified, booked, expired
    position: 1,
    notes: 'Corporate event gala tonight at 7 PM. Can arrive within 15 minutes of any cancellation.',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    notifiedAt: null,
    history: ['Joined waitlist 45m ago via online portal']
  },
  {
    id: 'wl-102',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    customerId: 'cust-4',
    customerName: 'Marcus Sterling',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    customerPhone: '+1 (555) 482-1920',
    customerEmail: 'marcus.s@outlook.com',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    duration: 45,
    price: 45,
    workerId: null, // Any worker
    workerName: 'Any Available Stylist',
    preferredDate: getDateOffset(0),
    preferredTimeRange: 'Morning / Midday (10:00 - 13:00)',
    flexibleTime: true,
    priority: 'vip',
    priorityLabel: 'VIP Client',
    status: 'waiting',
    position: 2,
    notes: 'VIP regular (14 visits). Open to Chloe Bennett or Elena Rostova. Needs quick blowout.',
    createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
    notifiedAt: null,
    history: ['Joined waitlist 1h 50m ago by phone']
  },
  {
    id: 'wl-103',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    customerId: 'cust-5',
    customerName: 'Claire Henderson',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    customerPhone: '+1 (555) 910-2345',
    customerEmail: 'claire.h@icloud.com',
    serviceId: 'srv-103',
    serviceName: 'Deep Cleanse Facial & Hydration',
    duration: 60,
    price: 75,
    workerId: 'wrk-103',
    workerName: 'Maya Lin',
    preferredDate: getDateOffset(0),
    preferredTimeRange: 'Late Afternoon (15:00 - 18:00)',
    flexibleTime: true,
    priority: 'flexible',
    priorityLabel: 'Flexible Window',
    status: 'notified',
    position: 3,
    notes: 'Notified 8 mins ago of potential 16:00 opening. Auto-claim window active.',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    notifiedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    expiresInMinutes: 7,
    history: ['Joined waitlist 3h ago', 'SMS Notification sent 8m ago']
  },
  {
    id: 'wl-104',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    customerId: 'cust-6',
    customerName: 'Daniel Kim',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    customerPhone: '+1 (555) 674-8899',
    customerEmail: 'dkim@techcorp.io',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    duration: 45,
    price: 45,
    workerId: 'wrk-102',
    workerName: 'Chloe Bennett',
    preferredDate: getDateOffset(0),
    preferredTimeRange: 'Late Afternoon (16:00 - 18:00)',
    flexibleTime: false,
    priority: 'urgent',
    priorityLabel: 'High Urgency',
    status: 'waiting',
    position: 4,
    notes: 'Executive evening travel at 8 PM. Needs sharp cut beforehand.',
    createdAt: new Date(Date.now() - 210 * 60000).toISOString(),
    notifiedAt: null,
    history: ['Joined waitlist 3.5h ago']
  },
  {
    id: 'wl-105',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    customerId: 'cust-7',
    customerName: 'Amara Okonjo',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    customerPhone: '+1 (555) 234-9011',
    customerEmail: 'amara.o@design.co',
    serviceId: 'srv-104',
    serviceName: 'Gel Manicure & Pedicure',
    duration: 60,
    price: 55,
    workerId: 'wrk-103',
    workerName: 'Maya Lin',
    preferredDate: getDateOffset(1),
    preferredTimeRange: 'Morning (09:00 - 12:00)',
    flexibleTime: true,
    priority: 'normal',
    priorityLabel: 'Standard',
    status: 'waiting',
    position: 5,
    notes: 'Pre-wedding event styling. Flexible with 30-min window adjustment.',
    createdAt: new Date(Date.now() - 320 * 60000).toISOString(),
    notifiedAt: null,
    history: ['Joined waitlist for tomorrow']
  },
  {
    id: 'wl-106',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    customerId: 'cust-8',
    customerName: 'David Miller',
    customerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    customerPhone: '+1 (555) 412-5566',
    customerEmail: 'david.m@demo.com',
    serviceId: 'srv-101',
    serviceName: 'Precision Haircut & Blowdry',
    duration: 45,
    price: 45,
    workerId: 'wrk-101',
    workerName: 'Elena Rostova',
    preferredDate: getDateOffset(1),
    preferredTimeRange: 'Afternoon (13:00 - 16:00)',
    flexibleTime: true,
    priority: 'flexible',
    priorityLabel: 'Flexible Window',
    status: 'waiting',
    position: 6,
    notes: 'Preferred Elena, but willing to book Chloe if slot opens earlier.',
    createdAt: new Date(Date.now() - 400 * 60000).toISOString(),
    notifiedAt: null,
    history: ['Joined waitlist for tomorrow']
  }
];

const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    bookingId: 'BNG-410928',
    providerId: 'prov-4',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    rating: 5,
    comment: 'Dr. Smith was thorough, gentle, and addressed all my health concerns with immense clarity. Great clinic atmosphere!',
    date: getDateOffset(-3)
  },
  {
    id: 'rev-2',
    bookingId: 'BNG-309182',
    providerId: 'prov-1',
    customerId: 'cust-2',
    customerName: 'Sarah Connor',
    rating: 5,
    comment: 'Elena is a miracle worker with hair! My blowout lasted 3 days and looked glossy throughout. Highly recommend.',
    date: getDateOffset(-5)
  },
  {
    id: 'rev-3',
    bookingId: 'BNG-201948',
    providerId: 'prov-6',
    customerId: 'cust-2',
    customerName: 'Sarah Connor',
    rating: 4,
    comment: 'High intensity session with Coach Derek. Challenging workouts and very motivating pointers on posture.',
    date: getDateOffset(-7)
  }
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    sender: 'customer',
    text: 'Hello! I booked an appointment for precision haircut this week. Should I arrive 10 minutes early?',
    timestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: getDateOffset(0)
  },
  {
    id: 'msg-2',
    customerId: 'cust-1',
    customerName: 'Alex Morgan',
    providerId: 'prov-1',
    providerName: 'Aurora Glow Salon & Spa',
    sender: 'provider',
    text: 'Hi Alex! Yes, arriving 5 to 10 minutes early is perfect so we can offer you complimentary herbal tea and conduct a brief styling consultation. Look forward to seeing you!',
    timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: getDateOffset(0)
  }
];

const INITIAL_REPORTS = [
  {
    id: 'rep-1',
    bookingId: 'BNG-998811',
    providerId: 'prov-3',
    providerName: 'The Modern Barber & Co.',
    customerName: 'Mark Jenkins',
    customerEmail: 'mark@demo.com',
    issue: 'Disputed appointment time slot confusion',
    details: 'Customer arrived for appointment but claims there was a 15 min wait before the chair was ready.',
    status: 'Under Review', // 'Open', 'Under Review', 'Resolved'
    date: getDateOffset(-2),
    resolution: ''
  }
];

// Attach all initial data objects to window for global browser availability
if (typeof window !== 'undefined') {
  window.INITIAL_CATEGORIES = INITIAL_CATEGORIES;
  window.INITIAL_PROVIDERS = INITIAL_PROVIDERS;
  window.INITIAL_CUSTOMERS = INITIAL_CUSTOMERS;
  window.INITIAL_BOOKINGS = INITIAL_BOOKINGS;
  window.INITIAL_WAITLIST = INITIAL_WAITLIST;
  window.INITIAL_REVIEWS = INITIAL_REVIEWS;
  window.INITIAL_MESSAGES = INITIAL_MESSAGES;
  window.INITIAL_REPORTS = INITIAL_REPORTS;
  window.getDateOffset = getDateOffset;
}
