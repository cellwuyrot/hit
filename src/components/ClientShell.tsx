"use client";

import Toast from "@/components/Toast";
import ScrollToTop from "@/components/ScrollToTop";
import PageViewTracker from "@/components/PageViewTracker";
import RecommendationPopup from "@/components/RecommendationPopup";
import SupportChatWidget from "@/components/SupportChatWidget";

export default function ClientShell() {
  return (
    <>
      <Toast />
      <ScrollToTop />
      <PageViewTracker />
      <RecommendationPopup />
      <SupportChatWidget />
    </>
  );
}
