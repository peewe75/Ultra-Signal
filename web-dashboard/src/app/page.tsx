"use client";

import { Button } from "@/components/ui/button";
import { Clock, LogIn } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    // Data di lancio ufficiale: 28 febbraio 2026, 00:00:00
    const targetDate = new Date("2026-02-28T00:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToCountdown = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("launch-timer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.info("Lancio ufficiale il 28 Febbraio!", {
        description: "Al momento stiamo completando i test finali. Resta sintonizzato per l'apertura pubblica."
      });
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[150px]"
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 w-full z-40 border-b border-white/5 bg-black/40 backdrop-blur-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">BCS</div>
            <span className="font-semibold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">BCS AI</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex text-sm font-medium text-red-400 hover:text-red-300 transition-colors items-center gap-1 border border-red-500/20 bg-red-500/5 rounded-full px-4 py-1.5 hover:bg-red-500/10">
              <LogIn className="w-3.5 h-3.5" /> Area Admin
            </Link>
            <Link href="/sign-in" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Accedi</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section with Countdown */}
      <section className="relative pt-32 pb-20 md:pt-48 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md mb-8">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-200 tracking-wider font-mono">LANCIO UFFICIALE: 28 FEB 2026 - 00:00</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 py-2 inline-block italic">Count on it.</span><br />
            Il Lancio è Vicino.
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Le nostre infrastrutture BCS AI sono in fase finale di calibrazione. Molto presto dominerai i mercati con l&apos;automazione intelligente definitiva.
          </motion.p>

          {/* TIMER SECTION */}
          <motion.div
            id="launch-timer"
            variants={itemVariants}
            className="grid grid-cols-4 gap-3 md:gap-8 max-w-3xl mx-auto mb-16 p-8 md:p-14 bg-gradient-to-br from-zinc-900/40 via-black/40 to-blue-900/5 border border-white/10 rounded-[3rem] backdrop-blur-2xl shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] -z-10 blur-2xl" />

            {[
              { label: "Giorni", val: timeLeft?.days ?? "00" },
              { label: "Ore", val: timeLeft?.hours ?? "00" },
              { label: "Minuti", val: timeLeft?.minutes ?? "00" },
              { label: "Secondi", val: timeLeft?.seconds ?? "00" }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-4xl md:text-7xl font-black text-white mb-2 tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {String(unit.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-[0.2em]">
                  {unit.label}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button onClick={scrollToCountdown} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-12 w-full sm:w-auto text-lg h-16 font-bold shadow-2xl shadow-blue-900/50 transition-all hover:scale-105 active:scale-95">
              Partecipa al Lancio
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-12 w-full sm:w-auto text-lg h-16 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white transition-all font-semibold"
              onClick={() => toast.info('Accesso prioritario registrato', { description: 'Riceverai una notifica via Telegram non appena i server saranno live.' })}
            >
              Richiedi Accesso Prioritario
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Strategic Partners */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">Powered by Excellence</h3>
            <div className="w-12 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-10">
            <Link href="https://www.bcs-ai.com" target="_blank" className="group p-10 bg-gradient-to-b from-zinc-900/50 to-transparent border border-white/5 rounded-[2.5rem] text-center hover:border-blue-500/20 transition-all w-full md:w-80">
              <div className="text-blue-400 font-bold mb-3 text-xs tracking-widest uppercase">Finance & AI</div>
              <div className="text-white text-2xl font-black group-hover:text-blue-400 transition-colors">BCS ADVISORY</div>
            </Link>
            <Link href="https://www.studiodigitale.eu" target="_blank" className="group p-10 bg-gradient-to-b from-zinc-900/50 to-transparent border border-white/5 rounded-[2.5rem] text-center hover:border-purple-500/20 transition-all w-full md:w-80">
              <div className="text-purple-400 font-bold mb-3 text-xs tracking-widest uppercase">Legal Tech</div>
              <div className="text-white text-2xl font-black group-hover:text-purple-400 transition-colors italic leading-none">STUDIO LEGALE BCS</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 border border-white/10 flex items-center justify-center font-black text-white text-sm shadow-2xl">BCS</div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-200">BCS AI Bridge</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Automation Service</span>
            </div>
          </div>

          <div className="flex items-center gap-10 text-sm font-bold">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors underline decoration-white/10 underline-offset-4">Privacy</Link>
            <div className="flex items-center gap-2 text-blue-500 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-mono">OPENING: 28.02.2026</span>
            </div>
          </div>

          <div className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            &copy; 2026 BCS Advisory. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
    </div>
  );
}