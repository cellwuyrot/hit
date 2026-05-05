"use client";

import Toast from "@/components/Toast";
import ScrollToTop from "@/components/ScrollToTop";
import PageViewTracker from "@/components/PageViewTracker";
import RecommendationPopup from "@/components/RecommendationPopup";

export default function ClientShell() {
  return (
    <>
      <Toast />
      <ScrollToTop />
      <PageViewTracker />
      <RecommendationPopup />
    </>
  );
}
