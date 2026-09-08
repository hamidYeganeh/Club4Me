"use client";
import { Clock, Star, Compass } from "lucide-react";
import { MinimalCarousel } from "./minimal-carousel";
export default function MinimalCarouselDemo() {
  return (
    <MinimalCarousel
      cards={[
        {
          id: "hours",
          title: "روزهای کاری",
          value: "۷ روز",
          icon: Clock,
          description:
            "جزئیات ساعت کاری در بخش شرایط مراجعه نمایش داده می‌شود.",
        },
        {
          id: "status",
          title: "وضعیت",
          value: "فعال",
          icon: Compass,
          description: "پیش از مراجعه، سانس مورد نظرت را انتخاب کن.",
        },
        {
          id: "rating",
          title: "امتیاز نمونه",
          value: "۴٫۸",
          icon: Star,
          description: "این داده فقط برای پیش‌نمایش مؤلفه است.",
        },
      ]}
    />
  );
}
