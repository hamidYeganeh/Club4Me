import type { DiscoveryClub } from "./discovery.types";

const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

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
  },
];
