import React from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function AbilityEventBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-3 flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/25 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-fuchsia-300" />
      </div>
      <p className="text-white" style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
        {message}
      </p>
    </motion.div>
  );
}
