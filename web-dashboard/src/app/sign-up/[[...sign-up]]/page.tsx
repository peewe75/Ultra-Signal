import Link from "next/link";
import { Clock, Lock } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full text-center">
        <div className="mb-10 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl animate-bounce">
          <Lock className="w-8 h-8 text-blue-500" />
        </div>

        <h1 className="text-4xl font-black mb-6 tracking-tight leading-tight">
          Registrazioni <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-black">Temporaneamente Chiuse</span>
        </h1>

        <p className="text-gray-400 mb-10 leading-relaxed font-medium">
          Stiamo ultimando la configurazione dei server BCS AI per garantire la massima stabilità operativa.
          <br />Le registrazioni apriranno ufficialmente il:
          <br /><span className="text-white font-black mt-2 inline-block bg-white/5 border border-white/10 px-4 py-1 rounded-lg">28 FEBBRAIO 2026 - 00:00</span>
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xl transition-transform hover:scale-105"
          >
            Torna alla Home
          </Link>

          <Link
            href="/sign-in"
            className="w-full h-14 border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center font-bold text-gray-300 transition-colors"
          >
            Sei già un tester? Accedi qui
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          Lancio in corso // BCS AI System
        </div>
      </div>
    </div>
  );
}