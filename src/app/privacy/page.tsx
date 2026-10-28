import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0B0B14]">
          Privacy Policy
        </h1>

        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-10 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4 font-body text-xs sm:text-sm leading-relaxed"
        >
          <h2 className="font-display font-black text-lg text-[#0B0B14]">
            1. Zero Personal Data Collection
          </h2>
          <p className="text-[#0B0B14]/80">
            Flippo requires no sign-up, no email address, and no personal identifying information. The application only interacts with public wallet addresses authenticated via Privy.
          </p>

          <h2 className="font-display font-black text-lg text-[#0B0B14]">
            2. Public On-Chain Information
          </h2>
          <p className="text-[#0B0B14]/80">
            Transactions made on Robinhood Chain, such as reward claims, are publicly broadcast and permanently recorded on the public blockchain.
          </p>

          <h2 className="font-display font-black text-lg text-[#0B0B14]">
            3. Local Storage & Security
          </h2>
          <p className="text-[#0B0B14]/80">
            We store no cookies for user profiling or advertising. Any temporary session tokens are securely handled by Privy SDK on your device.
          </p>
        </Surface>
      </div>

      <Footer />
    </main>
  );
}
