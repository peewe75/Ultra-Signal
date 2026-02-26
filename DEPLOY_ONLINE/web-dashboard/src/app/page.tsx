"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, Zap, Layers, LogIn } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white">BCS</div>
            <span className="font-semibold text-xl tracking-tight">BCS AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Prezzi</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 border border-red-500/30 rounded-full px-3 py-1">
              <LogIn className="w-3 h-3" /> Area Admin
            </Link>
            <Link href="/sign-in" className="text-sm font-medium hover:text-blue-400 transition-colors">Accedi</Link>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
              <Link href="/sign-up">Inizia Ora</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Domina i Mercati con <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">l&apos;Automazione Intelligente</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            La tecnologia bridge definitiva per MT4 e MT5. Gestisci licenze, account e segnali con un'unica dashboard professionale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 w-full sm:w-auto text-lg h-14 cursor-pointer">
              <Link href="#pricing">Ottieni la tua Licenza</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 w-full sm:w-auto text-lg h-14 border-gray-800 hover:bg-gray-900 bg-black text-white hover:text-white" onClick={() => toast.info('Video dimostrativo in arrivo prossimamente!', { description: 'Stiamo preparando un video tutorial completo che mostrerà tutte le funzionalità.' })}>
              Scopri come funziona
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">L&apos;Infrastruttura Perfetta</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Progettato per scalare, costruito per la stabilità assoluta.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Layers, title: "Multi-Terminal", desc: "Gestisci più account simultaneamente su MT4 e MT5 dalla stessa interfaccia." },
              { icon: Shield, title: "Sicurezza Totale", desc: "Licenze criptate, controllo VPS avanzato e sistema anti-clonazione integrato." },
              { icon: Zap, title: "Zero Latenza", desc: "Sincronizzazione immediata dei segnali per un'esecuzione a mercato fulminea." }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm hover:bg-zinc-900 transition-colors">
                <f.icon className="w-12 h-12 text-blue-500 mb-6" />
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Piani Flessibili</h2>
            <p className="text-gray-400">Scegli la licenza adatta al tuo volume operativo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* BASIC */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-medium text-gray-400 mb-2">BASIC</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold">€59</span>
                <span className="text-gray-500">/ mese</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['1 Installazione VPS', '1 Account MT4/MT5', 'Zero Latenza', 'Supporto Base'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl h-12 cursor-pointer">
                <Link href="/sign-up">Seleziona Piano</Link>
              </Button>
            </div>
            {/* PRO */}
            <div className="bg-blue-600 rounded-3xl p-8 relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/50 flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Più Scelto
              </div>
              <h3 className="text-xl font-medium text-blue-200 mb-2">PRO</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold">€109</span>
                <span className="text-blue-200">/ mese</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['3 Installazioni VPS', '3 Account MT4/MT5', 'Sincronizzazione Multi-Terminal', 'Supporto Prioritario'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-blue-300" /> {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-white text-blue-600 hover:bg-gray-100 rounded-xl h-12 font-semibold cursor-pointer">
                <Link href="/sign-up">Inizia Ora</Link>
              </Button>
            </div>
            {/* ENTERPRISE */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-medium text-gray-400 mb-2">ENTERPRISE</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold">€199</span>
                <span className="text-gray-500">/ mese</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['10 Installazioni VPS', '10 Account MT4/MT5', 'API Access', 'Supporto Dedicato 24/7'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl h-12" onClick={() => toast.success('Richiesta Contatto Inviata', { description: 'Un nostro specialista commerciale ti contatterà al più presto per configurare il tuo piano Enterprise.' })}>Contattaci</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">BCS</div>
            <span className="font-semibold text-gray-400">
              powered by <Link href="https://www.bcs-ai.com" target="_blank" className="hover:text-blue-400 transition-colors">BCS AI</Link> &copy; 2026
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition">Termini di Servizio</Link>
            <Link href="#" className="hover:text-white transition">Supporto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}