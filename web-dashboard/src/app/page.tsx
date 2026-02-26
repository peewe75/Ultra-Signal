"use client";

import { Button } from "@/components/ui/button";
import { Clock, LogIn, Check, Zap, Shield, ArrowRight, Layers, ExternalLink, Send, MessageSquare, Info, UserPlus, Key, MousePointer2, TrendingUp } from "lucide-react";
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
    const subject = encodeURIComponent(`Richiesta Partnership: ${formState.name}`);
    const body = encodeURIComponent(`Nome/Azienda: ${formState.name}\nCanale Telegram: ${formState.channel}\n\nProposta:\n${formState.message}`);
    window.location.href = `mailto:info@studiodigitale.eu?subject=${subject}&body=${body}`;
    toast.success("Client email aperto!");
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
                <p className="text-gray-400 text-sm italic">"Riservato a Sale Segnali, Canali Telegram e Partnership"</p>
              </div>

              <form onSubmit={handlePartnerSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome o Azienda</label>
                  <input required value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl h-14 px-5 text-white focus:border-blue-500 outline-none" placeholder="Es: Alpha Signals Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Link Canale Telegram</label>
                  <input required value={formState.channel} onChange={e => setFormState({ ...formState, channel: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl h-14 px-5 text-white focus:border-blue-500 outline-none" placeholder="@tuocanale o link" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Messaggio / Proposta</label>
                  <textarea required value={formState.message} onChange={e => setFormState({ ...formState, message: e.target.value })} className="w-full bg-black border border-white/5 rounded-3xl p-5 text-white focus:border-blue-500 outline-none min-h-[100px]" placeholder="Descrivi la tua richiesta..." />
                </div>
                <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg">
                  Invia Proposta <Send className="w-5 h-5 ml-2" />
                </Button>
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
            <span className="font-semibold text-xl tracking-tight text-white">BCS AI</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin" className="hidden md:flex text-[10px] font-black text-red-400 hover:text-red-300 transition-colors items-center gap-1 border border-red-500/20 bg-red-500/10 rounded-full px-4 py-1.5">
              <LogIn className="w-3 h-3" /> Area Admin
            </Link>
            <Link href="/sign-in" className="text-sm font-bold text-gray-300 hover:text-white border border-white/5 rounded-full px-4 py-1.5 transition-all">Accedi</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-10 md:pt-48 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest font-mono">LANCIO: 28 FEB 2026 - 00:00</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 py-2 inline-block italic">Count on BCS AI.</span><br />
            Il Futuro del Trading.
          </h1>

          {!IS_LIVE_MODE && (
            <div id="launch-timer" className="grid grid-cols-4 gap-3 md:gap-8 max-w-2xl mx-auto mb-20 p-8 md:p-14 bg-[#0a0a0a50] border border-white/10 rounded-[3rem] backdrop-blur-2xl shadow-2xl">
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

      {/* EXPERIERNZA UTENTE (Carousel Concept) */}
      <section className="py-24 relative bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-6xl font-black mb-6 tracking-tighter">Automazione <span className="text-blue-500">Zero Stress</span></h2>
            <p className="text-gray-400 text-lg font-medium italic">"Nessun VPS da pagare, nessuna configurazione tecnica. Solo 4 passaggi."</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, title: "1. Ti Registri", desc: "Crea il tuo account BCS AI in 30 secondi.", color: "blue" },
              { icon: Key, title: "2. Ricevi Licenza", desc: "Attiva la prova e ricevi il tuo codice univoco.", color: "indigo" },
              { icon: MousePointer2, title: "3. Incolli nel Bot", desc: "Invia /licenza al bot del tuo canale segnali.", color: "purple" },
              { icon: TrendingUp, title: "4. Fine. Guadagni.", desc: "Il sistema replica i trade sul tuo conto MT4/5.", color: "cyan" }
            ].map((step, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className="p-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <step.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-white">{step.title}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-5 text-8xl font-black italic">{i + 1}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-blue-500 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 fill-blue-500" /> Alimentato da Infrastruttura Proprietaria Cloud
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">Piani & Licenze</h2>
            <p className="text-gray-400 text-lg font-medium">Scegli la libertà operativa senza costi nascosti di server.</p>
          </div>
          <div className="flex justify-center mb-16 px-4">
            <div className="w-full max-w-2xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[2.5rem] blur opacity-25" />
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-2xl">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">Attivabile dal 28 Febbraio</div>
                  <h3 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter leading-none italic">Provaci <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">GRATIS</span></h3>
                  <p className="text-xl text-gray-400 font-medium tracking-tight uppercase">14 Giorni Full Access // Setup Istantaneo</p>
                </div>

                {IS_LIVE_MODE ? (
                  <Button asChild className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl text-2xl font-black shadow-xl">
                    <Link href="/sign-up">Inizia la Prova</Link>
                  </Button>
                ) : (
                  <Button onClick={showWaitToast} className="w-full h-16 bg-zinc-900 text-gray-600 rounded-2xl text-xl font-black border border-white/5 cursor-not-allowed uppercase">
                    Apertura 28.02.26
                  </Button>
                )}

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 font-medium">Rinnovo mensile: <span className="text-white font-bold">30€/mese</span>. Zero commissioni sui profitti.</p>
                </div>
              </div>
            </div>
          </div>

          {/* White Label Business Section */}
          <div className="mt-24 p-8 md:p-14 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 text-blue-500 font-black text-xs uppercase mb-6 tracking-[0.2em]">
                  <MessageSquare className="w-4 h-4" /> Partner Program
                </div>
                <h2 className="text-3xl md:text-6xl font-black text-white mb-6 tracking-tighter italic leading-tight">Proposta per Sale Segnali & Canali</h2>
                <p className="text-xl text-gray-400 font-medium italic border-l-4 border-blue-600/40 pl-6 leading-relaxed max-w-2xl">
                  &quot;Fornisci ai tuoi membri l&apos;automazione definitiva a marchio tuo. Diventa un distributore autorizzato <span className="text-white underline decoration-blue-500 font-bold not-italic">BCS AI White Label</span>.&quot;
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full lg:w-auto items-center">
                <Button onClick={() => setIsPartnerModalOpen(true)} className="h-20 px-12 bg-white text-black hover:bg-gray-100 rounded-3xl font-black text-xl shadow-2xl transition-transform hover:scale-105 active:scale-95">
                  Contattaci Ora
                </Button>
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3 text-blue-500" /> info@studiodigitale.eu
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-sm font-bold text-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs">BCS</div>
            <span className="text-gray-400 uppercase tracking-widest text-[10px]">powered by <Link href="https://www.bcs-ai.com" target="_blank" className="text-white hover:text-blue-400">BCS ADVISORY</Link></span>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <div className="text-gray-700 text-[11px] uppercase tracking-[0.2em] font-black">&copy; 2026 BCS Advisory.</div>
        </div>
      </footer>
    </div>
  );
}