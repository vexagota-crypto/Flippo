import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/game/hero-section";
import { TickerStrip } from "@/components/home/ticker-strip";
import { MultiplierLadder } from "@/components/home/multiplier-ladder";
import { YourRewards } from "@/components/home/your-rewards";
import { HallOfFlips } from "@/components/home/hall-of-flips";
import { HowItWorks } from "@/components/home/how-it-works";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      {/* Short curved pill Navbar */}
      <Navbar />

      {/* 8.1 Hero / Game Stage */}
      <HeroSection />

      {/* 8.2 Ticker Strip */}
      <TickerStrip />

      {/* 8.3 Multiplier Ladder */}
      <MultiplierLadder />

      {/* 8.4 Your Rewards */}
      <YourRewards />

      {/* 8.5 Hall of Flips (Leaderboard Preview) */}
      <HallOfFlips />

      {/* 8.6 How It Works + Fairness */}
      <HowItWorks />

      {/* 8.7 Huge Footer */}
      <Footer />
    </main>
  );
}
