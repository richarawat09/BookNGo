/**
 * BookNGo — Service Categories & Clean Data Registry
 * Zero pre-made businesses or dummy accounts. Clean foundation ready for user registration.
 */

// Helper to get formatted date string (YYYY-MM-DD) relative to today
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const INITIAL_CATEGORIES = [
  { id: 'cat-beauty', name: 'Beauty & Wellness', icon: '🌸', description: 'Skincare, makeup, and aesthetic wellness' },
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

// Clean state: ZERO pre-made businesses or dummy accounts
const INITIAL_PROVIDERS = [];
const INITIAL_CUSTOMERS = [];
const INITIAL_BOOKINGS = [];
const INITIAL_WAITLIST = [];
const INITIAL_REVIEWS = [];
const INITIAL_MESSAGES = [];
const INITIAL_REPORTS = [];

// Clean single sample template (loaded only on explicit user click if desired)
const SAMPLE_BLUSH_STUDIO = {
  id: 'prov-blush-sample',
  name: 'Blush & Bloom Beauty Studio',
  category: 'Salons & Spas',
  categoryId: 'cat-salon',
  tagline: 'Luxury hair styling, balayage, and restorative skin therapy',
  description: 'Boutique beauty studio offering modern haircuts, facial therapy, and personalized styling.',
  location: 'Rosewood Center',
  address: '104 Rosewood Blvd, Suite 200, Downtown',
  phone: '+1 (555) 234-8901',
  email: 'blush@salon.com',
  image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  rating: 4.9,
  reviewCount: 8,
  status: 'active',
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  openTime: '09:00',
  closeTime: '18:00',
  breaks: [{ start: '13:00', end: '13:30', label: 'Lunch Break' }],
  services: [
    { id: 'srv-b1', name: 'Signature Haircut & Blowout', category: 'Hair', price: 45, duration: 45, description: 'Consultation, wash, tailored cut, and volume blowout styling.', enabled: true },
    { id: 'srv-b2', name: 'Hydra-Glow Facial Therapy', category: 'Skin', price: 75, duration: 60, description: 'Aromatherapy steam, exfoliation, hydration mask, and LED therapy.', enabled: true },
    { id: 'srv-b3', name: 'Gel Manicure & Nail Art', category: 'Nails', price: 35, duration: 30, description: 'Cuticle care, shaping, long-lasting gel polish, and light massage.', enabled: true }
  ],
  workers: [
    { id: 'wrk-b1', name: 'Elena Rostova', title: 'Master Stylist', services: ['srv-b1', 'srv-b2', 'srv-b3'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isUnavailable: false }
  ]
};

// Global browser window attachment
if (typeof window !== 'undefined') {
  window.INITIAL_CATEGORIES = INITIAL_CATEGORIES;
  window.INITIAL_PROVIDERS = INITIAL_PROVIDERS;
  window.INITIAL_CUSTOMERS = INITIAL_CUSTOMERS;
  window.INITIAL_BOOKINGS = INITIAL_BOOKINGS;
  window.INITIAL_WAITLIST = INITIAL_WAITLIST;
  window.INITIAL_REVIEWS = INITIAL_REVIEWS;
  window.INITIAL_MESSAGES = INITIAL_MESSAGES;
  window.INITIAL_REPORTS = INITIAL_REPORTS;
  window.SAMPLE_BLUSH_STUDIO = SAMPLE_BLUSH_STUDIO;
  window.getDateOffset = getDateOffset;
}
