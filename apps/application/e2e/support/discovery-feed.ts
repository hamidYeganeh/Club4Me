import { defaultDiscoveryLayouts } from "../../modules/discovery/components/discovery-default-layouts";

const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240'%3E%3Cpath fill='%23576782' d='M0 0h320v240H0z'/%3E%3C/svg%3E";
export const feed = defaultDiscoveryLayouts.map((layout) => ({
  ...layout,
  items: Array.from({ length: layout.skeletonCount ?? 3 }, (_, index) => {
    const common = {
      id: `${layout.id}-${index}`,
      slug: `item-${index}`,
      imageUrl: image,
    };
    switch (layout.type) {
      case "clubs":
        return {
          ...common,
          name: "باشگاه آفتاب",
          address: "تهران، خیابان ولیعصر",
          shortDescription: "تمرین حرفه‌ای",
          logoMediaId: null,
          coverMediaId: null,
          averageRating: 4.5,
          reviewsCount: 12,
          sportIds: [],
          tags: [],
        };
      case "coaches":
        return {
          ...common,
          displayName: "مربی نمونه",
          shortBio: "تمرین حرفه‌ای",
          avatarMediaId: null,
          coverMediaId: null,
          experienceYears: 5,
          serviceModes: ["حضوری"],
          averageRating: 4.5,
          reviewsCount: 12,
        };
      case "classes":
        return {
          ...common,
          title: "تمرین قدرتی",
          description: "کلاس گروهی با مربی حرفه‌ای",
          imageMediaId: null,
          sportId: "sport",
          clubId: null,
          coachIds: [],
          deliveryMode: "in_person",
          capacity: 20,
          enrollmentCount: 5,
          courseStartAt: "",
          courseEndAt: "",
          registrationStartAt: null,
          registrationEndAt: null,
          price: { amount: 100000, currency: "IRR" },
          venue: null,
          prerequisites: [],
          faqs: [],
          status: "active",
        };
      case "articles":
        return {
          ...common,
          title: "راهنمای تمرین",
          excerpt: "برنامه تمرین و تغذیه برای زندگی سالم",
          authorName: "نویسنده مجله",
          categoryId: "category",
          coverImageUrl: image,
          publishedAt: null,
        };
      case "sports":
        return {
          ...common,
          name: "بدنسازی",
          description: "تمرین و آمادگی بدنی",
          code: "BODYBUILDING",
        };
      case "banners":
        return {
          title: "تجربه تازه ورزشی",
          subtitle: "انتخاب مناسب برای تمرین",
          imageUrl: image,
          actionLabel: "مشاهده پیشنهادها",
          actionUrl: "/discovery/search",
        };
    }
  }),
}));
