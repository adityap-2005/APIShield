import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustSection from "../components/landing/TrustSection";
import Features from "../components/landing/Features";
import Metrics from "../components/landing/Metrics";
import ProductPrinciple from "../components/landing/ProductPrinciple";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <Features />
        <Metrics />
        <ProductPrinciple />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
