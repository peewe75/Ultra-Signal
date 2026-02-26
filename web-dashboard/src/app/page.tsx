"use client";

import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, ArrowRight, ExternalLink, LogIn, Layers } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";

export default function LandingPage() {
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
      {/* Dynamic Background Orbs */}
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
        className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">BCS</div>
            <span className="font-semibold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">BCS AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Prezzi</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hidden sm:flex text-sm font-medium text-red-400 hover:text-red-300 transition-colors items-center gap-1 border border-red-500/20 bg-red-500/5 rounded-full px-4 py-1.5 hover:bg-red-500/10">
              <LogIn className="w-3.5 h-3.5" /> Area Admin
            </Link>
            <Link href="/sign-in" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Accedi</Link>
            <Button asChild className="bg-white text-black hover:bg-gray-100 rounded-full px-6 font-semibold shadow-lg shadow-white/10 transition-all hover:scale-105">
              <Link href="/sign-up">Inizia Ora</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-52 md:pb-32 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-medium text-blue-200">Nuova Versione 2.0 Disponibile</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            Domina i Mercati con <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 py-2 inline-block">l&apos;Automazione Intelligente</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            La tecnologia bridge definitiva per MT4 e MT5. Gestisci licenze, account e segnali con un&apos;unica dashboard professionale dal design ineguagliabile.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-8 w-full sm:w-auto text-lg h-14 cursor-pointer shadow-xl shadow-blue-900/40 transition-all hover:scale-105 border border-white/10">
              <Link href="#pricing">Ottieni la tua Licenza <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 w-full sm:w-auto text-lg h-14 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white transition-all hover:scale-105" onClick={() => toast.info('Video dimostrativo in arrivo prossimamente!', { description: 'Stiamo preparando un video tutorial completo che mostrerà tutte le funzionalità.' })}>
              Scopri come funziona
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent -z-10" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-7xl mx-auto px-6"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">L&apos;Infrastruttura Perfetta</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Progettato per scalare, costruito per la stabilità assoluta con un&apos;interfaccia premium.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Layers, title: "Multi-Terminal", desc: "Gestisci più account simultaneamente su MT4 e MT5 dalla stessa elegante interfaccia." },
              { icon: Shield, title: "Sicurezza Totale", desc: "Licenze criptate, controllo VPS avanzato e sistema anti-clonazione integrato." },
              { icon: Zap, title: "Zero Latenza", desc: "Sincronizzazione immediata dei segnali per un'esecuzione a mercato fulminea." }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-[#111] border border-white/5 rounded-3xl p-8 hover:bg-[#151515] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
                  <f.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-100">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Table */}
      <section id="pricing" className="py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-7xl mx-auto px-6"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Piani Flessibili</h2>
            <p className="text-gray-400 text-lg">Scegli la licenza adatta al tuo volume operativo, senza sorprese.</p>
          </div>
          <div className="flex justify-center mb-16 px-4">
            <div className="w-full max-w-2xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                    Offerta Lancio
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-none">
                    Provaci <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">GRATIS</span>
                  </h3>
                  <p className="text-xl text-gray-400 font-medium">14 Giorni Full Access // Account Illimitati</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-200">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">Installazioni VPS incluse</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-200">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">Zero latenza trading</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-200">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">Nessuna Carta Richiesta</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-200">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">Licenza BCS-AI Immediata</span>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xl font-bold shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer">
                  <Link href="/sign-up">Inizia la Prova Gratuita</Link>
                </Button>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                  <p className="text-sm text-gray-500">
                    Al termine della prova potrai estendere il servizio a soli <span className="text-white font-bold">30€/mese</span>.<br />
                    Nessun rinnovo automatico. Se non paghi, il servizio si disabilita semplicemente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* White Label Business Section */}
          <div className="mt-24 p-8 md:p-14 bg-gradient-to-br from-zinc-900/60 to-black border border-white/5 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h4 className="text-blue-500 font-bold tracking-[0.2em] text-xs uppercase mb-4">Partner Program</h4>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Ehi, hai una sala segnali?
                </h2>
                <p className="text-xl text-gray-400 font-medium italic border-l-4 border-blue-600/40 pl-6 leading-relaxed">
                  &quot;Trasforma la tua operatività in un brand esclusivo. Contattaci per una soluzione <span className="text-white underline decoration-blue-500 font-bold not-italic">White Label</span> su misura. Troveremo sicuramente l&apos;accordo perfetto per il tuo business.&quot;
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <Button
                  onClick={() => window.location.href = 'mailto:info@studiodigitale.eu'}
                  className="h-16 px-12 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-lg shadow-2xl transition-transform hover:scale-105"
                >
                  Contattaci per il White Label
                </Button>
                <div className="flex justify-center lg:justify-start gap-6 text-sm text-gray-500 font-medium px-4">
                  <span>BCS Advisory</span>
                  <span className="w-1 h-1 bg-gray-700 rounded-full mt-2" />
                  <span>info@studiodigitale.eu</span>
                </div>
              </div>
            </div>
          </div>
          {/* Strategic Partners Section */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-white mb-2">Partner Strategici</h3>
              <p className="text-gray-500 text-sm">Collaborazioni che garantiscono eccellenza e conformità</p>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              <Link
                href="https://www.bcs-ai.com"
                target="_blank"
                className="group relative w-full md:w-72 p-8 bg-zinc-900/40 border border-white/5 rounded-3xl text-center hover:border-blue-500/30 transition-all"
              >
                <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors rounded-3xl" />
                <div className="relative">
                  <div className="text-blue-400 font-bold mb-2 text-xs tracking-widest uppercase">Finance & AI</div>
                  <div className="text-white text-xl font-bold group-hover:text-blue-400 transition-colors">BCS ADVISORY</div>
                  <div className="mt-4 text-gray-500 text-xs flex items-center justify-center gap-2">
                    www.bcs-ai.com <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </Link>

              <Link
                href="https://www.studiodigitale.eu"
                target="_blank"
                className="group relative w-full md:w-72 p-8 bg-zinc-900/40 border border-white/5 rounded-3xl text-center hover:border-purple-500/30 transition-all"
              >
                <div className="absolute inset-0 bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-colors rounded-3xl" />
                <div className="relative">
                  <div className="text-purple-400 font-bold mb-2 text-xs tracking-widest uppercase">Legal Tech</div>
                  <div className="text-white text-xl font-bold group-hover:text-purple-400 transition-colors">STUDIO LEGALE BCS</div>
                  <div className="mt-4 text-gray-500 text-xs flex items-center justify-center gap-2">
                    studiodigitale.eu <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center font-bold text-white text-xs">BCS</div>
            <span className="font-medium text-gray-300">
              powered by <Link href="https://www.bcs-ai.com" target="_blank" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30">BCS AI</Link> &copy; 2026
            </span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Termini di Servizio</Link>
            <Link href="#" className="hover:text-white transition-colors">Supporto</Link>
          </div>
        </div>
      </footer>
    </div >
  );
}