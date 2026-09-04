import type {
  DiscoveryAmenity,
  DiscoveryCity,
  DiscoveryClub,
  DiscoveryCoach,
  DiscoveryEquipment,
  DiscoveryProvince,
  DiscoverySport,
} from "./discovery.types";

const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const PREVIEW_AMENITIES: DiscoveryAmenity[] = [
  {
    id: "locker-room",
    title: "رختکن",
    icon: "lock-1",
    count: 4,
    description: "رختکن‌های جداگانه با قفسه‌های امن و فضای تعویض لباس.",
  },
  {
    id: "shower",
    title: "دوش",
    count: 8,
    description: "دوش‌های آب گرم با تهویه مناسب برای استفاده بعد از تمرین.",
    backgroundImage: unsplash("photo-1571902943202-507ec2618e8f", 800),
  },
  {
    id: "parking",
    title: "پارکینگ",
    icon: "car-1",
    count: 30,
    description: "پارکینگ اختصاصی اعضای باشگاه در محوطه مجموعه.",
  },
  {
    id: "air-conditioning",
    title: "تهویه مطبوع",
    count: 1,
    description: "سیستم تهویه مطبوع در تمام سالن‌های ورزشی.",
    backgroundImage: unsplash("photo-1534438327276-14e7789c4591", 800),
  },
];

const PREVIEW_EQUIPMENT: DiscoveryEquipment[] = [
  {
    id: "treadmill",
    title: "تردمیل",
    icon: "treadmill",
    count: 12,
    description: "تردمیل‌های حرفه‌ای با قابلیت تنظیم شیب و برنامه تمرینی.",
  },
  {
    id: "dumbbell",
    title: "دمبل",
    count: 40,
    description: "ست کامل دمبل از سبک تا سنگین برای تمرین قدرتی.",
    backgroundImage: unsplash("photo-1517836357463-d25dfeac3438", 800),
  },
  {
    id: "bike",
    title: "دوچرخه ثابت",
    icon: "bicycle",
    count: 10,
    description: "دوچرخه‌های ثابت اسپینینگ با مانیتور ضربان قلب.",
  },
  {
    id: "bench",
    title: "نیمکت پرس",
    count: 6,
    description: "نیمکت‌های پرس قابل تنظیم برای تمرین بالاتنه.",
    backgroundImage: unsplash("photo-1571019614242-c5c5dee9f50b", 800),
  },
];

const PREVIEW_COACHES: DiscoveryCoach[] = [
  {
    id: "niloofar",
    name: "نیلوفر رضایی",
    specialty: "قدرتی و تناوبی",
    imageUrl: unsplash("photo-1594381898411-846e7d193883", 800),
    badge: "منتخب",
    rating: 4.8,
    reviewsCount: 128,
    location: "تهران",
    mode: "حضوری",
  },
  {
    id: "arash",
    name: "آرش محمدی",
    specialty: "بوکس",
    imageUrl: unsplash("photo-1571019614242-c5c5dee9f50b", 800),
    badge: "مربی",
    rating: 4.6,
    reviewsCount: 90,
    location: "تهران",
    mode: "حضوری",
  },
  {
    id: "sara",
    name: "سارا کاظمی",
    specialty: "یوگا و تحرک",
    imageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b", 800),
    badge: "مربی",
    rating: 4.9,
    reviewsCount: 74,
    location: "تهران",
    mode: "آنلاین",
  },
];

const PREVIEW_SPORTS: DiscoverySport[] = [
  {
    id: "football",
    name: "فوتبال",
    category: "ورزش‌های توپی",
    icon: "soccer",
  },
  {
    id: "volleyball",
    name: "والیبال",
    category: "ورزش‌های توپی",
    icon: "volleyball",
    backgroundImage: unsplash("photo-1612872087720-bb876e2e67d1", 800),
  },
  {
    id: "swimming",
    name: "شنا",
    category: "ورزش‌های آبی",
    icon: "person-swimming",
  },
  {
    id: "tennis",
    name: "تنیس",
    category: "ورزش‌های توپی",
    icon: "tennis",
    backgroundImage: unsplash("photo-1554068865-24cecd4e34b8", 800),
  },
];

export const DISCOVERY_PROVINCES: DiscoveryProvince[] = [
  {
    id: "tehran",
    name: "تهران",
    cities: [
      {
        id: "tehran-city",
        name: "تهران",
        clubsCount: 1284,
        imageUrl: unsplash("photo-1517836357463-d25dfeac3438", 600),
      },
      {
        id: "rey",
        name: "ری",
        clubsCount: 186,
        imageUrl: unsplash("photo-1571902943202-507ec2618e8f", 600),
      },
      {
        id: "shemiranat",
        name: "شمیرانات",
        clubsCount: 242,
        imageUrl: unsplash("photo-1534438327276-14e7789c4591", 600),
      },
    ],
  },
  {
    id: "isfahan",
    name: "اصفهان",
    cities: [
      {
        id: "isfahan-city",
        name: "اصفهان",
        clubsCount: 642,
        imageUrl: unsplash("photo-1548013146-72479768bada", 600),
      },
      {
        id: "kashan",
        name: "کاشان",
        clubsCount: 128,
        imageUrl: unsplash("photo-1581873372796-635b67ca2008", 600),
      },
      {
        id: "najafabad",
        name: "نجف‌آباد",
        clubsCount: 96,
        imageUrl: unsplash("photo-1604999333679-b86d54738319", 600),
      },
    ],
  },
  {
    id: "fars",
    name: "فارس",
    cities: [
      {
        id: "shiraz",
        name: "شیراز",
        clubsCount: 518,
        imageUrl: unsplash("photo-1564507592333-c60657eea523", 600),
      },
      {
        id: "marvdasht",
        name: "مرودشت",
        clubsCount: 74,
        imageUrl: unsplash("photo-1587974928442-77dc3e0dba70", 600),
      },
      {
        id: "jahrom",
        name: "جهرم",
        clubsCount: 58,
        imageUrl: unsplash("photo-1524492412937-b28074a5d7da", 600),
      },
    ],
  },
  {
    id: "razavi-khorasan",
    name: "خراسان رضوی",
    cities: [
      {
        id: "mashhad",
        name: "مشهد",
        clubsCount: 890,
        imageUrl: unsplash("photo-1571019614242-c5c5dee9f50b", 600),
      },
      {
        id: "neyshabur",
        name: "نیشابور",
        clubsCount: 112,
        imageUrl: unsplash("photo-1517836357463-d25dfeac3438", 600),
      },
      {
        id: "sabzevar",
        name: "سبزوار",
        clubsCount: 88,
        imageUrl: unsplash("photo-1571019613454-1cb2f99b2d8b", 600),
      },
    ],
  },
  {
    id: "hormozgan",
    name: "هرمزگان",
    cities: [
      {
        id: "kish",
        name: "کیش",
        clubsCount: 312,
        imageUrl: unsplash("photo-1507525428034-b723cf961d3e", 600),
      },
      {
        id: "bandar-abbas",
        name: "بندرعباس",
        clubsCount: 204,
        imageUrl: unsplash("photo-1500375592092-40eb2168fd21", 600),
      },
      {
        id: "qeshm",
        name: "قشم",
        clubsCount: 96,
        imageUrl: unsplash("photo-1473116763249-2faa772d3939", 600),
      },
    ],
  },
  {
    id: "mazandaran",
    name: "مازندران",
    cities: [
      {
        id: "ramsar",
        name: "رامسر",
        clubsCount: 276,
        imageUrl: unsplash("photo-1441974231531-c6227db76b6e", 600),
      },
      {
        id: "sari",
        name: "ساری",
        clubsCount: 168,
        imageUrl: unsplash("photo-1448375240586-882707db888b", 600),
      },
      {
        id: "babol",
        name: "بابل",
        clubsCount: 134,
        imageUrl: unsplash("photo-1446329813274-b49e939d8b31", 600),
      },
    ],
  },
  {
    id: "east-azerbaijan",
    name: "آذربایجان شرقی",
    cities: [
      {
        id: "tabriz",
        name: "تبریز",
        clubsCount: 405,
        imageUrl: unsplash("photo-1534438327276-14e7789c4591", 600),
      },
      {
        id: "maragheh",
        name: "مراغه",
        clubsCount: 72,
        imageUrl: unsplash("photo-1571902943202-507ec2618e8f", 600),
      },
      {
        id: "marand",
        name: "مرند",
        clubsCount: 54,
        imageUrl: unsplash("photo-1549719386-74dfcbf7dbed", 600),
      },
    ],
  },
  {
    id: "gilan",
    name: "گیلان",
    cities: [
      {
        id: "rasht",
        name: "رشت",
        clubsCount: 198,
        imageUrl: unsplash("photo-1448375240586-882707db888b", 600),
      },
      {
        id: "bandar-anzali",
        name: "بندر انزلی",
        clubsCount: 86,
        imageUrl: unsplash("photo-1507525428034-b723cf961d3e", 600),
      },
      {
        id: "lahijan",
        name: "لاهیجان",
        clubsCount: 64,
        imageUrl: unsplash("photo-1441974231531-c6227db76b6e", 600),
      },
    ],
  },
];

export const DISCOVERY_CITIES: DiscoveryCity[] = DISCOVERY_PROVINCES.flatMap(
  (province) => province.cities,
);

export const DISCOVERY_CLUBS: DiscoveryClub[] = [
  {
    id: "preview",
    name: "جزیره بالی",
    location: "اندونزی",
    price: 999,
    rating: "۴.۸",
    duration: "۱۵-۱۸ ساعت",
    distance: "۱۲۵ کیلومتر",
    about:
      "باشگاه بالی جزیره‌ای گرمسیری با ساحل‌های چشم‌نواز، شالیزارهای سرسبز و فرهنگی زنده است. معابد باستانی را بگردید، روی موج‌های جهانی موج‌سواری کنید و از مهمان‌نوازی گرم مردم جزیره لذت ببرید. این مقصد ترکیبی از آرامش طبیعت و هیجان ماجراجویی را در یک سفر به‌یادماندنی کنار هم می‌آورد.",
    images: [
      unsplash("photo-1537996194471-e657df975ab4"),
      unsplash("photo-1518548419970-58e3b4079ab2"),
      unsplash("photo-1555400038-63f5ba517a47"),
      unsplash("photo-1559628376-f3fe65bd1f1b"),
    ],
    map: {
      address: "تهران، سعادت‌آباد، بلوار دریا",
      latitude: 35.778,
      longitude: 51.378,
    },
    amenities: PREVIEW_AMENITIES,
    equipment: PREVIEW_EQUIPMENT,
    sports: PREVIEW_SPORTS,
    coaches: PREVIEW_COACHES,
  },
  {
    id: "kish",
    name: "ساحل کیش",
    location: "خلیج فارس",
    price: 450,
    rating: "۴.۶",
    duration: "۸-۱۰ ساعت",
    distance: "۴۲ کیلومتر",
    about:
      "باشگاه کیش با آب‌های فیروزه‌ای، مسیرهای دوچرخه کنار دریا و سالن‌های روباز تمرینی، یک مقصد آرام برای تمرین در هوای آزاد است.",
    images: [
      unsplash("photo-1507525428034-b723cf961d3e"),
      unsplash("photo-1500375592092-40eb2168fd21"),
      unsplash("photo-1473116763249-2faa772d3939"),
    ],
    map: {
      address: "کیش، ساحل سیمین",
      latitude: 26.532,
      longitude: 53.986,
    },
    amenities: PREVIEW_AMENITIES,
    equipment: PREVIEW_EQUIPMENT,
    sports: PREVIEW_SPORTS,
    coaches: PREVIEW_COACHES,
  },
  {
    id: "north",
    name: "جنگل‌های شمال",
    location: "مازندران",
    price: 320,
    rating: "۴.۷",
    duration: "۶-۸ ساعت",
    distance: "۱۸ کیلومتر",
    about:
      "مسیرهای مه گرفته، تمرین در دل طبیعت و هوای تازه جنگل. باشگاه شمال برای کسانی است که تمرین را با پیاده‌روی و چشم‌انداز عوض نمی‌کنند.",
    images: [
      unsplash("photo-1441974231531-c6227db76b6e"),
      unsplash("photo-1448375240586-882707db888b"),
      unsplash("photo-1446329813274-b49e939d8b31"),
    ],
    map: {
      address: "رامسر، جاده جنگلی",
      latitude: 36.903,
      longitude: 50.658,
    },
    amenities: PREVIEW_AMENITIES,
    equipment: PREVIEW_EQUIPMENT,
    sports: PREVIEW_SPORTS,
    coaches: PREVIEW_COACHES,
  },
  {
    id: "isfahan",
    name: "میدان نقش جهان",
    location: "اصفهان",
    price: 280,
    rating: "۴.۹",
    duration: "۴-۶ ساعت",
    distance: "۹ کیلومتر",
    about:
      "باشگاهی در قلب بافت تاریخی اصفهان، با سالن‌های روشن، حیاط مرکزی و دسترسی آسان به مسیرهای دویدن کنار زاینده‌رود.",
    images: [
      unsplash("photo-1548013146-72479768bada"),
      unsplash("photo-1581873372796-635b67ca2008"),
      unsplash("photo-1604999333679-b86d54738319"),
    ],
    map: {
      address: "اصفهان، میدان نقش جهان",
      latitude: 32.657,
      longitude: 51.677,
    },
    amenities: PREVIEW_AMENITIES,
    equipment: PREVIEW_EQUIPMENT,
    sports: PREVIEW_SPORTS,
    coaches: PREVIEW_COACHES,
  },
  {
    id: "shiraz",
    name: "باغ ارم",
    location: "شیراز",
    price: 210,
    rating: "۴.۵",
    duration: "۵-۷ ساعت",
    distance: "۱۱ کیلومتر",
    about:
      "تمرین میان درختان سرو و عطر بهارنارنج. باشگاه ارم فضای باز و سالن سرپوشیده را در یک مجموعه آرام کنار هم دارد.",
    images: [
      unsplash("photo-1564507592333-c60657eea523"),
      unsplash("photo-1587974928442-77dc3e0dba70"),
      unsplash("photo-1524492412937-b28074a5d7da"),
    ],
    map: {
      address: "شیراز، باغ ارم",
      latitude: 29.636,
      longitude: 52.525,
    },
    amenities: PREVIEW_AMENITIES,
    equipment: PREVIEW_EQUIPMENT,
    sports: PREVIEW_SPORTS,
    coaches: PREVIEW_COACHES,
  },
  {
    id: "tehran",
    name: "بام تهران",
    location: "تهران",
    price: 180,
    rating: "۴.۴",
    duration: "۳-۵ ساعت",
    distance: "۶ کیلومتر",
    about:
      "باشگاه بام تهران با چشم‌انداز شهر، مسیرهای کوهپیمایی سبک و سالن هوازی برای تمرین بعد از غروب.",
    images: [
      unsplash("photo-1517836357463-d25dfeac3438"),
      unsplash("photo-1571019614242-c5c5dee9f50b"),
      unsplash("photo-1534438327276-14e7789c4591"),
    ],
    map: {
      address: "تهران، درکه، بام تهران",
      latitude: 35.817,
      longitude: 51.426,
    },
    amenities: PREVIEW_AMENITIES,
    equipment: PREVIEW_EQUIPMENT,
    sports: PREVIEW_SPORTS,
    coaches: PREVIEW_COACHES,
  },
];
