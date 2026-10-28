import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0B0B14]">
          Terms of Play
        </h1>

        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-10 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4 font-body text-xs sm:text-sm leading-relaxed"
        >
          <h2 className="font-display font-black text-lg text-[#0B0B14]">
            1. No Wagering or Staking
          </h2>
          <p className="text-[#0B0B14]/80">
            Flippo is a decentralized game of chance that does not require users to stake, deposit, or risk any assets. No purchase or wager is necessary to play.
          </p>

          <h2 className="font-display font-black text-lg text-[#0B0B14]">
            2. Reward Discretion & Caps
          </h2>
          <p className="text-[#0B0B14]/80">
            Rewards are funded exclusively through the protocol treasury on Robinhood Chain. Rewards are subject to global daily budget caps, per-wallet caps, and treasury liquidity. Rewards are not guaranteed returns or financial investments.
          </p>

          <h2 className="font-display font-black text-lg text-[#0B0B14]">
            3. Fair Play & Anti-Exploit
          </h2>
          <p className="text-[#0B0B14]/80">
            The hold-time rule requires balances to be held for a minimum of 24 hours to prevent buy-flip-sell exploit loops. Wallets utilizing automated sybil attacks or bot networks may be restricted by protocol governance.
          </p>
        </Surface>
      </div>

      <Footer />
    </main>
  );
}
