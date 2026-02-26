"use client";

import { Button } from "@/components/ui/button";
import { Clock, LogIn, Check, Zap, Shield, ArrowRight, Layers, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";

// ==========================================================
// 🚀 LANCIATORE UFFICIALE BCS AI
// ==========================================================
const IS_LIVE_MODE = false; // <--- DOMANI METTI A "true" PER RIPRISTINARE TUTTO
// ==========================================================

export default function LandingPage() {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
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
    const element = document.getElementById("launch-timer") || document.getElementById("pricing");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      if (!IS_LIVE_MODE) {
        toast.info("Lancio ufficiale il 28 Febbraio!", {
          description: "Stiamo completando i test finali. Resta sintonizzato per l'apertura pubblica."
        });
      }
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="fixed top-0 w-full z-40 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold">BCS</div>
            <span className="font-semibold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">BCS AI</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex text-sm font-medium text-red-400 hover:text-red-300 transition-colors items-center gap-1 border border-red-500/20 bg-red-500/5 rounded-full px-4 py-1.5 hover:bg-red-500/10">
              <LogIn className="w-3.5 h-3.5" /> Area Admin
            </Link>
            <Link href="/sign-in" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Accedi</Link>
            {IS_LIVE_MODE && (
              <Button asChild className="bg-white text-black hover:bg-gray-100 rounded-full px-6 font-semibold shadow-lg">
                <Link href="/sign-up">Inizia Ora</Link>
              </Button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 px-6">
        <motion.div className="max-w-4xl mx-auto text-center" variants={containerVariants} initial="hidden" animate="visible">

          {!IS_LIVE_MODE ? (
            <>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md mb-8">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-blue-200 tracking-wider font-mono uppercase">LANCIO UFFICIALE: 28 FEB 2026</span>
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 py-2 inline-block italic">Count on it.</span><br />
                Il Lancio è Vicino.
              </motion.h1>
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Le nostre infrastrutture BCS AI sono in fase finale di calibrazione. Molto presto dominerai i mercati con l&apos;automazione intelligente definitiva.
              </motion.p>

              <motion.div id="launch-timer" variants={itemVariants} className="grid grid-cols-4 gap-3 md:gap-8 max-w-3xl mx-auto mb-16 p-8 md:p-14 bg-gradient-to-br from-zinc-900/40 via-black/40 to-blue-900/5 border border-white/10 rounded-[3rem] backdrop-blur-2xl shadow-2xl relative group">
                {[
                  { label: "Giorni", val: timeLeft?.days ?? "00" },
                  { label: "Ore", val: timeLeft?.hours ?? "00" },
                  { label: "Minuti", val: timeLeft?.minutes ?? "00" },
                  { label: "Secondi", val: timeLeft?.seconds ?? "00" }
                ].map((unit, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="text-4xl md:text-7xl font-black text-white mb-2 tabular-nums tracking-tighter shadow-white/5">{String(unit.val).padStart(2, '0')}</div>
                    <div className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-[0.2em]">{unit.label}</div>
                  </div>
                ))}
              </motion.div>
            </>
          ) : (
            <>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-medium text-blue-200">Nuova Versione 2.0 Disponibile</span>
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                Domina i Mercati con <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 py-2 inline-block">l&apos;Automazione Intelligente</span>
              </motion.h1>
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                La tecnologia bridge definitiva per MT4 e MT5. Gestisci licenze, account e segnali con un&apos;unica dashboard professionale.
              </motion.p>
            </>
          )}

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {IS_LIVE_MODE ? (
              <>
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-8 w-full sm:w-auto text-lg h-14 font-bold shadow-xl transition-transform hover:scale-105">
                  <Link href="#pricing">Ottieni la tua Licenza <ArrowRight className="ml-2 w-5 h-5" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8 w-full sm:w-auto text-lg h-14 border-white/10 bg-white/5 backdrop-blur-md text-white transition-all hover:scale-105" onClick={() => toast.info('Video dimostrativo in arrivo!')}>
                  Scopri come funziona
                </Button>
              </>
            ) : (
              <Button onClick={scrollToCountdown} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-12 w-full sm:w-auto text-lg h-16 font-bold shadow-2xl transition-all hover:scale-105">
                Resta Sintonizzato
              </Button>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing - Mostrato solo in Live Mode */}
      {IS_LIVE_MODE && (
        <section id="pricing" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Piani Flessibili</h2>
              <p className="text-gray-400 text-lg">Scegli la licenza adatta al tuo volume operativo.</p>
            </div>
            <div className="flex justify-center mb-16 px-4">
              <div className="w-full max-w-2xl relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-25" />
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">Offerta Lancio</div>
                    <h3 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-none">Provaci <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">GRATIS</span></h3>
                    <p className="text-xl text-gray-400 font-medium">14 Giorni Full Access // Account Illimitati</p>
                  </div>
                  <Button asChild className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xl font-bold shadow-xl transition-transform hover:scale-[1.02]">
                    <Link href="/sign-up">Inizia la Prova Gratuita</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Simplified Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-16 tracking-tight">Ingegneria di precisione</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Layers, title: "Protocollo BCS-AI", desc: "Sincronizzazione segnali con latenza prossima allo zero." },
              { icon: Shield, title: "Sicurezza Militare", desc: "Crittografia end-to-end per ogni chiave licenza." },
              { icon: Zap, title: "Scalabilità Totale", desc: "Gestisci migliaia di account con un'unica dashboard cloud." }
            ].map((f, i) => (
              <div key={i} className="bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-blue-500/20 transition-all opacity-80">
                <f.icon className="w-8 h-8 text-blue-400 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Partners */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16"><h3 className="text-2xl font-black text-white mb-4 tracking-tighter text-blue-500 uppercase text-xs tracking-[0.2em]">Partner Ufficiali</h3><div className="w-12 h-1 bg-blue-600 mx-auto rounded-full" /></div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <Link href="https://www.bcs-ai.com" target="_blank" className="p-8 bg-zinc-900/40 border border-white/5 rounded-3xl text-center hover:border-blue-500/30 transition-all w-full md:w-72">
              <div className="text-blue-400 font-bold mb-2 text-xs tracking-widest uppercase">Finance & AI</div>
              <div className="text-white text-xl font-bold">BCS ADVISORY</div>
            </Link>
            <Link href="https://www.studiodigitale.eu" target="_blank" className="p-8 bg-zinc-900/40 border border-white/5 rounded-3xl text-center hover:border-purple-500/30 transition-all w-full md:w-72">
              <div className="text-purple-400 font-bold mb-2 text-xs tracking-widest uppercase">Legal Tech</div>
              <div className="text-white text-xl font-bold italic lead-none">STUDIO LEGALE BCS</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-950 border border-white/10 flex items-center justify-center font-bold text-white text-xs">BCS</div>
              <span className="font-medium text-gray-300">powered by <Link href="https://www.bcs-ai.com" target="_blank" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30">BCS AI</Link></span>
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm font-bold text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            {!IS_LIVE_MODE && <span className="text-blue-500 font-mono tracking-tighter bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10 underline decoration-blue-500/20 underline-offset-4">OPENING: 28.02.2026</span>}
          </div>
          <div className="text-gray-700 text-[10px] font-bold uppercase tracking-[0.2em]">&copy; 2026 BCS Advisory. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}