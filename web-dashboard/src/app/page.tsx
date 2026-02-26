"use client";

import { Button } from "@/components/ui/button";
import { Clock, LogIn, Check, Zap, Shield, ArrowRight, Layers, ExternalLink, Send, MessageSquare, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// ==========================================================
// 🚀 LANCIATORE UFFICIALE BCS AI
// ==========================================================
const IS_LIVE_MODE = false;
// ==========================================================

export default function LandingPage() {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [formState, setFormState] = useState({ name: "", channel: "", message: "" });

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

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Richiesta Partnership/White Label: ${formState.name}`);
    const body = encodeURIComponent(`Nome/Azienda: ${formState.name}\nCanale Telegram: ${formState.channel}\n\nProposta:\n${formState.message}`);
    window.location.href = `mailto:info@studiodigitale.eu?subject=${subject}&body=${body}`;
    toast.success("Client email aperto!", { description: "Invia l'email precompilata per completare la richiesta." });
    setIsPartnerModalOpen(false);
  };

  const showWaitToast = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    toast.info("Lancio ufficiale il 28 Febbraio!", {
      description: "Le registrazoni pubbliche apriranno a mezzanotte."
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative">

      {/* Modal Partnership */}
      <AnimatePresence>
        {isPartnerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPartnerModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">Canali & Partner</div>
                <h2 className="text-3xl font-black mb-2 leading-tight">Proposta <span className="text-blue-500">Business</span></h2>
                <p className="text-gray-400 text-sm">Inviaci i dettagli del tuo canale o della tua azienda. Ti risponderemo entro 24 ore.</p>
              </div>

              <form onSubmit={handlePartnerSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome o Azienda</label>
                  <input required value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl h-14 px-5 text-white focus:border-blue-500 transition-all outline-none" placeholder="Es: Alpha Signals Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Link Canale Telegram</label>
                  <input required value={formState.channel} onChange={e => setFormState({ ...formState, channel: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl h-14 px-5 text-white focus:border-blue-500 transition-all outline-none" placeholder="https://t.me/tuocanale" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Messaggio / Proposta</label>
                  <textarea required value={formState.message} onChange={e => setFormState({ ...formState, message: e.target.value })} className="w-full bg-black border border-white/5 rounded-3xl p-5 text-white focus:border-blue-500 transition-all outline-none min-h-[120px]" placeholder="Descrivi brevemente il tuo volume di utenti o la tua richiesta White Label..." />
                </div>
                <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3">
                  Invia Proposta <Send className="w-5 h-5" />
                </Button>
                <p className="text-[10px] text-center text-gray-500 mt-4 leading-relaxed uppercase tracking-tighter">
                  Inviando il modulo accetti il trattamento dati <br /> indirizzato a info@studiodigitale.eu
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <Link href="/admin" className="hidden md:flex text-xs font-bold text-red-400 hover:text-red-300 transition-colors items-center gap-1 border border-red-500/20 bg-red-500/5 rounded-full px-4 py-1.5 hover:bg-red-500/10">
              <LogIn className="w-3 h-3" /> Area Admin
            </Link>
            <Link href="/sign-in" className="text-sm font-bold text-gray-300 hover:text-white transition-colors border border-white/5 rounded-full px-4 py-1.5 hover:bg-zinc-900 shadow-xl">Accedi</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-10 md:pt-48 px-6">
        <motion.div className="max-w-4xl mx-auto text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md mb-8">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-200 tracking-wider font-mono uppercase">LANCIO UFFICIALE: 28 FEB 2026 - 00:00</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 py-2 inline-block">Il Futuro è qui.</span><br />
            {IS_LIVE_MODE ? "Benvenuti in BCS AI." : "In Fase di Lancio."}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            La tecnologia bridge definitiva per MT4 e MT5. Gestisci licenze, account e segnali con l&apos;automazione intelligente di BCS AI.
          </p>

          {!IS_LIVE_MODE && (
            <div id="launch-timer" className="grid grid-cols-4 gap-3 md:gap-8 max-w-2xl mx-auto mb-20 p-8 md:p-14 bg-gradient-to-br from-zinc-900/40 via-black/40 to-blue-900/5 border border-white/10 rounded-[3rem] backdrop-blur-2xl shadow-2xl relative group">
              {[
                { label: "Giorni", val: timeLeft?.days ?? "00" },
                { label: "Ore", val: timeLeft?.hours ?? "00" },
                { label: "Minuti", val: timeLeft?.minutes ?? "00" },
                { label: "Secondi", val: timeLeft?.seconds ?? "00" }
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-4xl md:text-6xl font-black text-white mb-2 tabular-nums">{String(unit.val).padStart(2, '0')}</div>
                  <div className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-widest">{unit.label}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Pricing Table */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">Offerta Lancio</h2>
            <p className="text-gray-400 text-lg font-medium">Scopri il piano perfetto per iniziare.</p>
          </div>
          <div className="flex justify-center mb-16 px-4">
            <div className="w-full max-w-2xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-25" />
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">Attivabile dal 28 Febbraio</div>
                  <h3 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">Provaci <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">GRATIS</span></h3>
                  <p className="text-xl text-gray-400 font-medium tracking-tight">14 Giorni Full Access // Account Illimitati</p>
                </div>

                {IS_LIVE_MODE ? (
                  <Button asChild className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xl font-bold shadow-xl">
                    <Link href="/sign-up">Inizia la Prova Gratuita</Link>
                  </Button>
                ) : (
                  <Button onClick={showWaitToast} className="w-full h-16 bg-zinc-900 text-gray-500 rounded-2xl text-xl font-black border border-white/5 cursor-not-allowed uppercase tracking-tighter">
                    Prossimamente Disponibile
                  </Button>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <p className="text-xs text-gray-500 font-medium">Al termine potrai estendere a soli <span className="text-white font-bold">30€/mese</span>. <br />Nessun obbligo di rinnovo.</p>
                </div>
              </div>
            </div>
          </div>

          {/* White Label Business Section - AGGIORNATA CON FORM */}
          <div className="mt-24 p-8 md:p-14 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 text-blue-500 font-black text-xs uppercase mb-6 tracking-[0.2em] bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
                  <MessageSquare className="w-3 h-3" /> Partnership & Sale Segnali
                </div>
                <h2 className="text-3xl md:text-6xl font-black text-white mb-6 tracking-tighter italic">Hai una sala segnali?</h2>
                <p className="text-xl text-gray-400 font-medium italic border-l-4 border-blue-600/40 pl-6 leading-relaxed max-w-2xl">
                  &quot;Trasforma la tua operatività in un brand esclusivo. Richiedi una soluzione <span className="text-white underline decoration-blue-500 font-bold not-italic font-sans">White Label</span> su misura per il tuo canale.&quot;
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full lg:w-auto">
                <Button onClick={() => setIsPartnerModalOpen(true)} className="h-20 px-12 bg-white text-black hover:bg-gray-100 rounded-3xl font-black text-xl shadow-2xl transition-transform hover:scale-105 active:scale-95">
                  Contattaci Ora
                </Button>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2">
                  <Info className="w-3 h-3 text-blue-500" /> Riservato a Canali Telegram e Aziende
                </p>
              </div>
            </div>
          </div>

          {/* Partners Section */}
          <div className="mt-40">
            <div className="text-center mb-16">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Strategic Ecosystem</h3>
              <div className="h-0.5 w-16 bg-blue-600 mx-auto rounded-full" />
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-10">
              <Link href="https://www.bcs-ai.com" target="_blank" className="p-10 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] text-center hover:border-blue-500/20 transition-all w-full md:w-80 shadow-2xl group">
                <div className="text-blue-500/60 font-black mb-3 text-[10px] tracking-[0.3em] uppercase group-hover:text-blue-400">Finance & AI</div>
                <div className="text-white text-2xl font-black italic tracking-tighter">BCS ADVISORY</div>
              </Link>
              <Link href="https://www.studiodigitale.eu" target="_blank" className="p-10 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] text-center hover:border-purple-500/20 transition-all w-full md:w-80 shadow-2xl group">
                <div className="text-purple-500/60 font-black mb-3 text-[10px] tracking-[0.3em] uppercase group-hover:text-purple-400">Legal Tech</div>
                <div className="text-white text-2xl font-black italic tracking-tighter">STUDIO LEGALE BCS</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-sm font-bold text-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs">BCS</div>
            <span>powered by <Link href="https://www.bcs-ai.com" target="_blank" className="text-gray-300 hover:text-blue-400 underline decoration-blue-500/20">BCS AI</Link></span>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <div className="text-gray-700 text-[10px] uppercase tracking-[0.2em] font-black">&copy; 2026 BCS Advisory. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}