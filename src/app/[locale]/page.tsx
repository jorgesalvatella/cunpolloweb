import { setRequestLocale } from "next-intl/server";
import { RestaurantJsonLd } from "@/components/seo/JsonLd";
import HeroSection from "@/components/landing/HeroSection";
import VideoSection from "@/components/landing/VideoSection";
import MenuPreview from "@/components/landing/MenuPreview";
import LocationSection from "@/components/landing/LocationSection";
import CTASection from "@/components/landing/CTASection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <RestaurantJsonLd />
      <HeroSection />
      <VideoSection />
      <MenuPreview />
      <LocationSection />
      <CTASection />
    </>
  );
}
