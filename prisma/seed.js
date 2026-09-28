const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Eventora database...");

  // ─── Admin Settings ────────────────────────────────────────────────────────
  await prisma.adminSetting.upsert({
    where: { key: "commission_rate" },
    update: {},
    create: { key: "commission_rate", value: "8", label: "Platform Commission (%)" },
  });
  await prisma.adminSetting.upsert({
    where: { key: "pro_subscription_price" },
    update: {},
    create: { key: "pro_subscription_price", value: "999", label: "Pro Subscription Price (₹/month)" },
  });

  // ─── Cities ────────────────────────────────────────────────────────────────
  const ahmedabad = await prisma.city.upsert({
    where: { name: "Ahmedabad" },
    update: {},
    create: { name: "Ahmedabad", state: "Gujarat", isActive: true },
  });

  const vadodara = await prisma.city.upsert({
    where: { name: "Vadodara" },
    update: { state: "Gujarat", isActive: true },
    create: { name: "Vadodara", state: "Gujarat", isActive: true },
  });

  for (const name of ["Alkapuri", "Akota", "Fatehgunj", "Gotri", "Manjalpur", "Sama", "Vasna", "Karelibaug", "Harni", "Sayajigunj"]) {
    await prisma.area.upsert({
      where: { id: `area_vadodara_${name.toLowerCase().replace(/\s/g, "_")}` },
      update: { cityId: vadodara.id },
      create: { id: `area_vadodara_${name.toLowerCase().replace(/\s/g, "_")}`, name, cityId: vadodara.id },
    });
  }

  // ─── Areas ─────────────────────────────────────────────────────────────────
  const areaNames = [
    "Bodakdev", "Satellite", "Vastrapur", "Prahlad Nagar", "Navrangpura",
    "Maninagar", "Bopal", "South Bopal", "Thaltej", "SG Highway",
    "CG Road", "Drive In Road", "Ambawadi", "Memnagar", "Gurukul",
    "Paldi", "Naranpura", "Chandkheda", "Gota", "Nikol",
  ];
  const areas = {};
  for (const name of areaNames) {
    const area = await prisma.area.upsert({
      where: { id: `area_${name.toLowerCase().replace(/\s/g, "_")}` },
      update: {},
      create: {
        id: `area_${name.toLowerCase().replace(/\s/g, "_")}`,
        name,
        cityId: ahmedabad.id,
      },
    });
    areas[name] = area;
  }

  // ─── Categories ────────────────────────────────────────────────────────────
  const categoryData = [
    { name: "Photography", slug: "photography", icon: "📸", sortOrder: 1 },
    { name: "Videography", slug: "videography", icon: "🎬", sortOrder: 2 },
    { name: "Decoration", slug: "decoration", icon: "🎊", sortOrder: 3 },
    { name: "Catering", slug: "catering", icon: "🍽️", sortOrder: 4 },
    { name: "Makeup & Beauty", slug: "makeup", icon: "💄", sortOrder: 5 },
    { name: "Mehendi", slug: "mehendi", icon: "🌸", sortOrder: 6 },
    { name: "DJ & Music", slug: "dj", icon: "🎵", sortOrder: 7 },
    { name: "Venue", slug: "venue", icon: "🏛️", sortOrder: 8 },
    { name: "Event Planner", slug: "event-planner", icon: "📋", sortOrder: 9 },
    { name: "Cake & Bakery", slug: "cake", icon: "🎂", sortOrder: 10 },
    { name: "Entertainment", slug: "entertainment", icon: "🎭", sortOrder: 11 },
    { name: "Transport", slug: "transport", icon: "🚗", sortOrder: 12 },
    { name: "Invitation", slug: "invitation", icon: "💌", sortOrder: 13 },
  ];
  const cats = {};
  for (const c of categoryData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    cats[c.slug] = cat;
  }

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@eventora.in" },
    update: {},
    create: {
      name: "Eventora Admin",
      email: "admin@eventora.in",
      password: adminPassword,
      role: "ADMIN",
      phone: "9999999999",
    },
  });

  const customerPassword = await bcrypt.hash("customer123", 10);
  const customer1 = await prisma.user.upsert({
    where: { email: "priya.sharma@gmail.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "priya.sharma@gmail.com",
      password: customerPassword,
      role: "CUSTOMER",
      phone: "9876543210",
    },
  });

  const vendorPassword = await bcrypt.hash("vendor123", 10);

  // ─── Demo Vendors ───────────────────────────────────────────────────────────
  const vendorData = [
    {
      user: { name: "Harsh Patel Photography", email: "harsh.photography@gmail.com" },
      profile: {
        businessName: "Harsh Patel Photography",
        slug: "harsh-patel-photography",
        description: "Capturing your precious moments with artistic finesse. 8+ years of wedding and event photography in Ahmedabad.",
        longDescription: "Harsh Patel Photography is one of Ahmedabad's most sought-after wedding photography studios. Founded in 2016, we have documented over 400 weddings across Gujarat. Our candid photography style blends traditional Indian wedding customs with contemporary visual storytelling, creating timeless memories that families cherish for generations.",
        cityId: ahmedabad.id,
        areaId: areas["Satellite"].id,
        phone: "9876500001",
        whatsapp: "9876500001",
        email: "harsh.photography@gmail.com",
        instagram: "@harshphotography",
        coverImage: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&q=80",
        startingPrice: 35000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 127,
        bookingCount: 412,
        responseTime: "Within 2 hours",
        experienceYears: 8,
        isDemo: true,
      },
      categories: ["photography"],
      packages: [
        { name: "Silver", price: 35000, description: "Half-day shoot (4 hrs)", inclusions: "400 edited photos,Online gallery,2 weeks delivery", isPopular: false },
        { name: "Gold", price: 55000, description: "Full-day shoot (8 hrs)", inclusions: "700 edited photos,Pre-wedding shoot,USB drive,1 album,1 week delivery", isPopular: true },
        { name: "Diamond", price: 85000, description: "2-day wedding coverage", inclusions: "1200+ edited photos,2 photographers,Pre-wedding shoot,2 albums,Drone shots,Priority delivery", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80", caption: "Royal Wedding at The Grand Bhagwati", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80", caption: "Mehendi ceremony portrait", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80", caption: "Sangeet night candid moments", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", caption: "Bridal portrait session", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80", caption: "Corporate event coverage", eventType: "Corporate" },
        { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", caption: "Birthday celebration shoot", eventType: "Birthday" },
      ],
    },
    {
      user: { name: "Zara Events & Decoration", email: "zara.events@gmail.com" },
      profile: {
        businessName: "Zara Events & Decoration",
        slug: "zara-events-decoration",
        description: "Luxury event decoration and design for weddings, engagements and corporate events. Creating magical spaces in Ahmedabad since 2014.",
        longDescription: "Zara Events & Decoration transforms ordinary venues into extraordinary experiences. Our team of 15 creative designers specializes in floral architecture, lighting design, and thematic décor for all types of events. We have decorated over 600 events across Ahmedabad and Gujarat, including high-profile celebrity weddings and corporate galas.",
        cityId: ahmedabad.id,
        areaId: areas["Bodakdev"].id,
        phone: "9876500002",
        whatsapp: "9876500002",
        email: "zara.events@gmail.com",
        instagram: "@zaraeventsahmedabad",
        coverImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200&q=80",
        startingPrice: 45000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 89,
        bookingCount: 287,
        responseTime: "Within 3 hours",
        experienceYears: 10,
        isDemo: true,
      },
      categories: ["decoration"],
      packages: [
        { name: "Blossom", price: 45000, description: "Simple & elegant floral décor", inclusions: "Stage backdrop,Basic floral arrangements,Entrance decoration,Lighting setup", isPopular: false },
        { name: "Royal", price: 95000, description: "Premium wedding décor", inclusions: "Grand stage design,Floral mandap,Entrance gate,Complete venue dressing,Chandelier setup,Centerpieces", isPopular: true },
        { name: "Grand Maharaja", price: 195000, description: "Ultra-luxury event design", inclusions: "End-to-end venue transformation,Custom floral ceiling,LED walls,Branded elements,Dedicated design team", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80", caption: "Grand wedding mandap decoration", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1561333561-c17dd21d4476?w=800&q=80", caption: "Royal floral stage setup", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80", caption: "Engagement ceremony décor", eventType: "Engagement" },
        { url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80", caption: "Corporate gala decoration", eventType: "Corporate" },
        { url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80", caption: "Birthday party setup", eventType: "Birthday" },
      ],
    },
    {
      user: { name: "Shree Ganesh Caterers", email: "shreeganesh.caterers@gmail.com" },
      profile: {
        businessName: "Shree Ganesh Caterers",
        slug: "shree-ganesh-caterers",
        description: "Premium Gujarati and multi-cuisine catering for weddings and events. Serving authentic flavors to 200-5000 guests with impeccable hygiene.",
        longDescription: "Shree Ganesh Caterers is a third-generation family catering business established in 1992. We specialize in traditional Gujarati wedding feasts, North Indian thalis, and customized multi-cuisine menus. Our experienced team of 80+ chefs and service staff ensures seamless food service at your event. We are FSSAI certified and follow strict hygiene protocols.",
        cityId: ahmedabad.id,
        areaId: areas["Maninagar"].id,
        phone: "9876500003",
        whatsapp: "9876500003",
        email: "shreeganesh.caterers@gmail.com",
        instagram: "@shreeganeshcaterers",
        coverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&q=80",
        startingPrice: 450,
        status: "APPROVED",
        isVerified: true,
        isFeatured: false,
        rating: 4.7,
        reviewCount: 203,
        bookingCount: 634,
        responseTime: "Within 4 hours",
        experienceYears: 32,
        isDemo: true,
      },
      categories: ["catering"],
      packages: [
        { name: "Basic Thali", price: 450, description: "Per plate, min 200 guests", inclusions: "10 items Gujarati thali,Water,Service staff,Disposable plates (optional)", isPopular: false },
        { name: "Premium Thali", price: 750, description: "Per plate, min 200 guests", inclusions: "18 items thali with sweets,Live counters,Welcome drinks,Crockery service,Head chef", isPopular: true },
        { name: "Grand Buffet", price: 1100, description: "Per plate, min 300 guests", inclusions: "30+ item multi-cuisine buffet,Live stations (pizza/chaat/ice cream),Mocktail bar,Fine dining setup,Waiters service", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", caption: "Grand wedding dinner setup", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", caption: "Traditional Gujarati thali", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", caption: "Live food counters", eventType: "Corporate" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80", caption: "Dessert spread", eventType: "Birthday" },
      ],
    },
    {
      user: { name: "Glam Studio by Pooja", email: "glam.studio.pooja@gmail.com" },
      profile: {
        businessName: "Glam Studio by Pooja",
        slug: "glam-studio-by-pooja",
        description: "Award-winning bridal makeup and hair styling. Over 1000 brides transformed with our signature natural-to-glam looks.",
        longDescription: "Glam Studio by Pooja is Ahmedabad's premier bridal makeup studio. Founded by Pooja Mehta, a certified makeup artist with training from Mumbai and London, the studio specializes in traditional Indian bridal looks, airbrush makeup, and international techniques. We believe every bride deserves to look and feel her absolute best on her special day.",
        cityId: ahmedabad.id,
        areaId: areas["Vastrapur"].id,
        phone: "9876500004",
        whatsapp: "9876500004",
        email: "glam.studio.pooja@gmail.com",
        instagram: "@glamstudiobypooja",
        coverImage: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=80",
        startingPrice: 8000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 312,
        bookingCount: 1043,
        responseTime: "Within 1 hour",
        experienceYears: 9,
        isDemo: true,
      },
      categories: ["makeup"],
      packages: [
        { name: "Engagement Look", price: 8000, description: "Engagement or pre-wedding event", inclusions: "HD makeup,Hair styling,Saree/lehenga draping", isPopular: false },
        { name: "Bridal Classic", price: 18000, description: "Wedding day bridal look", inclusions: "Airbrush bridal makeup,Bridal hair styling,Jewellery setting,Touch-up kit", isPopular: true },
        { name: "Complete Bridal Package", price: 35000, description: "All wedding functions", inclusions: "Mehendi,Haldi,Engagement,Wedding day (airbrush),Reception look,5 functions covered", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80", caption: "Bridal look - Lehenga draping", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80", caption: "Reception glam look", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80", caption: "Engagement natural makeup", eventType: "Engagement" },
        { url: "https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=800&q=80", caption: "Sangeet bold eye look", eventType: "Wedding" },
      ],
    },
    {
      user: { name: "Rani Mehendi Art", email: "ranimehendi@gmail.com" },
      profile: {
        businessName: "Rani Mehendi Art",
        slug: "rani-mehendi-art",
        description: "Traditional and contemporary mehendi designs for weddings, engagements and festivals. Team of 8 expert artists serving all of Ahmedabad.",
        longDescription: "Rani Mehendi Art brings together a team of skilled mehendi artists with expertise in Rajasthani, Arabic, Indian, and Indo-Arabic fusion designs. We serve bridal parties with intricate full-hand and full-leg bridal mehendi, as well as simple designs for guests. Available for home visits, salon services, and multi-location events.",
        cityId: ahmedabad.id,
        areaId: areas["Navrangpura"].id,
        phone: "9876500005",
        whatsapp: "9876500005",
        email: "ranimehendi@gmail.com",
        instagram: "@ranimenhendiart",
        coverImage: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=200&q=80",
        startingPrice: 3000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: false,
        rating: 4.7,
        reviewCount: 445,
        bookingCount: 892,
        responseTime: "Within 2 hours",
        experienceYears: 12,
        isDemo: true,
      },
      categories: ["mehendi"],
      packages: [
        { name: "Bridal Mehendi", price: 3000, description: "Full bridal hands & feet", inclusions: "Full hand & feet (front+back),Rajasthani design,1 senior artist,4-5 hours", isPopular: false },
        { name: "Bridal + Party Pack", price: 7500, description: "Bride + 5 guests", inclusions: "Full bridal mehendi,5 guest hands,2 artists,5-6 hours", isPopular: true },
        { name: "Mehendi Night Event", price: 18000, description: "Full event for 20-30 guests", inclusions: "Bride full mehendi,20-30 guests simple design,3 artists,Event duration coverage", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800&q=80", caption: "Full bridal Rajasthani design", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1606216840342-db96fb1a2273?w=800&q=80", caption: "Arabic fusion design", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80", caption: "Guest mehendi party", eventType: "Engagement" },
      ],
    },
    {
      user: { name: "DJ Raj Entertainment", email: "djraj.entertainment@gmail.com" },
      profile: {
        businessName: "DJ Raj Entertainment",
        slug: "dj-raj-entertainment",
        description: "Professional DJ services with premium sound systems, lights and fog machines. Making your event an unforgettable party experience.",
        longDescription: "DJ Raj Entertainment is Ahmedabad's most booked DJ service with 7 years of experience and 500+ events under our belt. We offer complete entertainment packages including DJ, premium JBL/Bose sound systems, LED walls, dancing floor lights, laser shows, and live dhol players. Our team ensures energy and vibes that keep your guests dancing all night.",
        cityId: ahmedabad.id,
        areaId: areas["Thaltej"].id,
        phone: "9876500006",
        whatsapp: "9876500006",
        email: "djraj.entertainment@gmail.com",
        instagram: "@djrajahmedabad",
        coverImage: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
        startingPrice: 12000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: false,
        rating: 4.6,
        reviewCount: 178,
        bookingCount: 543,
        responseTime: "Within 1 hour",
        experienceYears: 7,
        isDemo: true,
      },
      categories: ["dj"],
      packages: [
        { name: "Basic Beat", price: 12000, description: "4 hours DJ setup", inclusions: "DJ,2 speakers,Basic lights,Fog machine", isPopular: false },
        { name: "Party Pro", price: 22000, description: "6 hours full setup", inclusions: "DJ,Premium JBL system,LED moving lights,Laser show,Fog machine,1 dhol player", isPopular: true },
        { name: "Grand Show", price: 45000, description: "8+ hours premium setup", inclusions: "Professional DJ,Concert-grade sound,LED wall,Full lighting rig,Laser show,2 dhol players,Pyrotechnics,Crowd hype entertainer", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80", caption: "Wedding sangeet party setup", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80", caption: "Corporate party night", eventType: "Corporate" },
        { url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80", caption: "LED wall setup at venue", eventType: "Birthday" },
      ],
    },
    {
      user: { name: "The Grand Venue - Ahmedabad", email: "thegrandvenue@gmail.com" },
      profile: {
        businessName: "The Grand Venue",
        slug: "the-grand-venue-ahmedabad",
        description: "Ahmedabad's most prestigious banquet and event venue. 4 halls accommodating 150-2000 guests with world-class facilities and in-house catering.",
        longDescription: "The Grand Venue is a landmark destination for weddings, corporate events, and celebrations in Ahmedabad. Spread across 50,000 sq.ft., our venue features 4 grand halls, a rooftop terrace, valet parking, luxury bridal suites, and professional A/V equipment. Our dedicated event management team handles every detail from setup to teardown.",
        cityId: ahmedabad.id,
        areaId: areas["SG Highway"].id,
        phone: "9876500007",
        whatsapp: "9876500007",
        email: "thegrandvenue@gmail.com",
        instagram: "@thegrandvenueahmedabad",
        coverImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1601637012591-69e7cf4df649?w=200&q=80",
        startingPrice: 75000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 156,
        bookingCount: 389,
        responseTime: "Within 24 hours",
        experienceYears: 15,
        isDemo: true,
      },
      categories: ["venue"],
      packages: [
        { name: "Silver Hall", price: 75000, description: "Hall for 150-300 guests", inclusions: "AC hall (150-300 pax),Basic A/V,Parking,Changing room,8 hours slot", isPopular: false },
        { name: "Grand Ballroom", price: 150000, description: "Ballroom for 500-800 guests", inclusions: "AC ballroom (500-800 pax),Premium A/V,Stage,Dedicated coordinator,Parking,Bridal suite,10 hours", isPopular: true },
        { name: "Full Venue Buyout", price: 350000, description: "Complete venue for 1000-2000 guests", inclusions: "All 4 halls,Full venue exclusivity,VIP lounge,Complete A/V,Outdoor area,14 hours", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80", caption: "Grand ballroom wedding setup", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1601637012591-69e7cf4df649?w=800&q=80", caption: "Corporate conference setup", eventType: "Corporate" },
        { url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80", caption: "Reception dinner layout", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=80", caption: "Rooftop terrace event", eventType: "Birthday" },
      ],
    },
    {
      user: { name: "Celebrations Event Planner", email: "celebrations.eventplanner@gmail.com" },
      profile: {
        businessName: "Celebrations Event Planner",
        slug: "celebrations-event-planner",
        description: "Full-service event management company. From concept to execution, we plan, coordinate and manage your perfect event in Ahmedabad.",
        longDescription: "Celebrations Event Planner is a premium event management company with over 12 years of experience managing weddings, corporate events, and private celebrations in Gujarat. Our dedicated team of 20 event professionals handles everything from venue scouting and vendor coordination to on-the-day management, ensuring your vision becomes a seamless reality.",
        cityId: ahmedabad.id,
        areaId: areas["Prahlad Nagar"].id,
        phone: "9876500008",
        whatsapp: "9876500008",
        email: "celebrations.eventplanner@gmail.com",
        instagram: "@celebrationsahmedabad",
        coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=200&q=80",
        startingPrice: 50000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: false,
        rating: 4.8,
        reviewCount: 94,
        bookingCount: 218,
        responseTime: "Within 6 hours",
        experienceYears: 12,
        isDemo: true,
      },
      categories: ["event-planner"],
      packages: [
        { name: "Day-Of Coordination", price: 50000, description: "Event day management only", inclusions: "1 dedicated coordinator,Vendor coordination on day,Timeline management,Problem solving,10 hours coverage", isPopular: false },
        { name: "Full Wedding Planner", price: 150000, description: "Complete wedding planning", inclusions: "Venue sourcing,All vendor negotiation,Budget management,Guest management,Complete coordination (all functions)', isPopular: true", isPopular: true },
        { name: "Destination Wedding", price: 300000, description: "Destination wedding management", inclusions: "All Full Wedding services,Guest accommodation,Transport coordination,Destination-specific logistics,2-person team", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", caption: "Grand wedding coordination", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80", caption: "Corporate conference management", eventType: "Corporate" },
        { url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80", caption: "Birthday extravaganza", eventType: "Birthday" },
      ],
    },
    {
      user: { name: "Reel It Films", email: "reelitfilms@gmail.com" },
      profile: {
        businessName: "Reel It Films",
        slug: "reel-it-films",
        description: "Cinematic wedding films and event videos. We tell your love story through breathtaking visuals and emotional storytelling.",
        longDescription: "Reel It Films is a premium wedding and event videography studio based in Ahmedabad. Our team of 4 cinematographers uses Sony FX3, DJI Ronin, and Aerial drone systems to create cinematic wedding films that feel like movie-quality storytelling. We specialize in Hindi/Bollywood-inspired wedding films with original background scores.",
        cityId: ahmedabad.id,
        areaId: areas["Bopal"].id,
        phone: "9876500009",
        whatsapp: "9876500009",
        email: "reelitfilms@gmail.com",
        instagram: "@reelitfilms",
        coverImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&q=80",
        startingPrice: 30000,
        status: "APPROVED",
        isVerified: true,
        isFeatured: false,
        rating: 4.8,
        reviewCount: 87,
        bookingCount: 198,
        responseTime: "Within 3 hours",
        experienceYears: 6,
        isDemo: true,
      },
      categories: ["videography"],
      packages: [
        { name: "Film Highlights", price: 30000, description: "5-7 min cinematic highlight", inclusions: "Full wedding day coverage,5-7 min cinematic highlight film,RAW footage,2 cameras", isPopular: false },
        { name: "Full Wedding Film", price: 55000, description: "Complete 20-25 min film", inclusions: "2-day coverage,20-25 min full film,5-7 min highlight,Drone shots,RAW footage,3 cameras", isPopular: true },
        { name: "Luxury Film Package", price: 90000, description: "Documentary-style wedding film", inclusions: "3-day complete coverage,Documentary-style 45 min film,Highlight film,Pre-wedding film,Aerial drone,Original music score,4 cinematographers", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80", caption: "Aerial wedding cinematography", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1606216840342-db96fb1a2273?w=800&q=80", caption: "Mehendi ceremony film", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1538093348838-af2c01c4d3f1?w=800&q=80", caption: "Corporate event documentary", eventType: "Corporate" },
      ],
    },
    {
      user: { name: "Sweet Dreams Cake Studio", email: "sweetdreams.cake@gmail.com" },
      profile: {
        businessName: "Sweet Dreams Cake Studio",
        slug: "sweet-dreams-cake-studio",
        description: "Custom designer cakes and dessert tables for weddings, birthdays and all celebrations. 100% eggless options available.",
        longDescription: "Sweet Dreams Cake Studio crafts premium designer cakes for every occasion. Specializing in tall multi-tier wedding cakes, themed birthday cakes, dessert tables, and corporate gift boxes. All cakes are made fresh with premium ingredients. We offer full eggless options without compromising on taste or design quality. Free delivery within Ahmedabad.",
        cityId: ahmedabad.id,
        areaId: areas["CG Road"].id,
        phone: "9876500010",
        whatsapp: "9876500010",
        email: "sweetdreams.cake@gmail.com",
        instagram: "@sweetdreamscakestudio",
        coverImage: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1200&q=80",
        logoImage: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=200&q=80",
        startingPrice: 2500,
        status: "APPROVED",
        isVerified: false,
        isFeatured: false,
        rating: 4.6,
        reviewCount: 234,
        bookingCount: 567,
        responseTime: "Within 4 hours",
        experienceYears: 5,
        isDemo: true,
      },
      categories: ["cake"],
      packages: [
        { name: "Designer Cake", price: 2500, description: "2-3 kg single tier designer cake", inclusions: "Custom design,Fresh cream,Fondant work,Free delivery Ahmedabad", isPopular: false },
        { name: "Wedding Cake", price: 12000, description: "3-tier wedding cake, 8-10 kg", inclusions: "3-tier custom design,Fondant + sugar flowers,Gold/silver detailing,Cake cutting set,Personalized topper", isPopular: true },
        { name: "Dessert Table Package", price: 25000, description: "Full dessert station for 200+ guests", inclusions: "Wedding cake,50 cupcakes,30 cake pops,Macarons,Cheesecake,Complete setup & display", isPopular: false },
      ],
      portfolio: [
        { url: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80", caption: "3-tier wedding cake", eventType: "Wedding" },
        { url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80", caption: "Themed birthday cake", eventType: "Birthday" },
        { url: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80", caption: "Dessert table spread", eventType: "Birthday" },
      ],
    },
  ];

  for (const vd of vendorData) {
    // Create vendor user
    const vendorUser = await prisma.user.upsert({
      where: { email: vd.user.email },
      update: {},
      create: {
        name: vd.user.name,
        email: vd.user.email,
        password: vendorPassword,
        role: "VENDOR",
        phone: vd.profile.phone,
      },
    });

    // Create vendor profile
    const vendor = await prisma.vendorProfile.upsert({
      where: { userId: vendorUser.id },
      update: {},
      create: {
        ...vd.profile,
        userId: vendorUser.id,
      },
    });

    // Link categories
    for (const catSlug of vd.categories) {
      if (cats[catSlug]) {
        await prisma.vendorCategory.upsert({
          where: { vendorId_categoryId: { vendorId: vendor.id, categoryId: cats[catSlug].id } },
          update: {},
          create: {
            vendorId: vendor.id,
            categoryId: cats[catSlug].id,
            isPrimary: true,
          },
        });
      }
    }

    // Create packages
    for (const pkg of vd.packages) {
      await prisma.package.create({ data: { ...pkg, vendorId: vendor.id } });
    }

    // Create portfolio
    for (let i = 0; i < vd.portfolio.length; i++) {
      await prisma.portfolioImage.create({
        data: { ...vd.portfolio[i], vendorId: vendor.id, sortOrder: i },
      });
    }

    // Create subscription
    await prisma.vendorSubscription.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: { vendorId: vendor.id, plan: "FREE" },
    });

    // Feature top vendors
    if (vd.profile.isFeatured) {
      const now = new Date();
      const future = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      await prisma.featuredListing.upsert({
        where: { vendorId: vendor.id },
        update: {},
        create: { vendorId: vendor.id, startDate: now, endDate: future },
      });
    }

    console.log(`✅ Created vendor: ${vd.profile.businessName}`);
  }

  // ─── Demo Event for Customer ────────────────────────────────────────────────
  const demoEvent = await prisma.event.create({
    data: {
      userId: customer1.id,
      name: "Priya & Rahul Wedding",
      eventType: "Wedding",
      city: "Ahmedabad",
      area: "Satellite",
      eventDate: "2026-12-10",
      guestCount: 500,
      totalBudget: 1200000,
      status: "PLANNING",
    },
  });

  const serviceAllocations = [
    { serviceName: "Venue", allocatedBudget: 300000 },
    { serviceName: "Catering", allocatedBudget: 250000 },
    { serviceName: "Photography", allocatedBudget: 85000 },
    { serviceName: "Videography", allocatedBudget: 55000 },
    { serviceName: "Decoration", allocatedBudget: 150000 },
    { serviceName: "Makeup", allocatedBudget: 35000 },
    { serviceName: "Mehendi", allocatedBudget: 18000 },
    { serviceName: "DJ", allocatedBudget: 45000 },
    { serviceName: "Event Planner", allocatedBudget: 150000 },
    { serviceName: "Invitation", allocatedBudget: 20000 },
    { serviceName: "Transport", allocatedBudget: 42000 },
  ];

  for (const s of serviceAllocations) {
    await prisma.eventService.create({ data: { ...s, eventId: demoEvent.id } });
  }

  console.log("✅ Created demo event for customer");
  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Demo accounts:");
  console.log("  Admin: admin@eventora.in / admin123");
  console.log("  Customer: priya.sharma@gmail.com / customer123");
  console.log("  Any vendor: [vendor email] / vendor123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
