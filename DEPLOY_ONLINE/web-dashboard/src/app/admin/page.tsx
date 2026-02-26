"use client";

import { Button } from "@/components/ui/button";
import { Plus, Users, ShieldAlert, Activity, KeyRound, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="border-b border-red-500/20 bg-zinc-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white">BCS</div>
          <span className="font-semibold text-xl text-red-500">BCS AI Control Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white rounded-xl uppercase font-bold px-6 tracking-wide" onClick={() => {
            toast.error('Kill-Switch Attivato', { description: 'Tutti gli account sincronizzati sono stati bloccati temporaneamente.' });
          }}>
            <AlertCircle className="w-5 h-5 mr-2" /> Kill-Switch Globale
          </Button>
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-medium border border-red-500 cursor-pointer" onClick={() => toast('Menu Profilo Amministratore')}>A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Row */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <Users className="w-5 h-5 text-blue-500" /> Utenti Totali
            </div>
            <div className="text-3xl font-bold">148</div>
            <div className="text-green-500 text-sm mt-1">+12 questo mese</div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <KeyRound className="w-5 h-5 text-green-500" /> Licenze Attive
            </div>
            <div className="text-3xl font-bold">115</div>
            <div className="text-gray-500 text-sm mt-1">Su 148 generate</div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <Activity className="w-5 h-5 text-purple-500" /> Sincronizzazioni
            </div>
            <div className="text-3xl font-bold">342</div>
            <div className="text-gray-500 text-sm mt-1">Nelle ultime 24h</div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Sospensioni
            </div>
            <div className="text-3xl font-bold">3</div>
            <div className="text-gray-500 text-sm mt-1">Utenti bloccati</div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca utente per email, Telegram ID o Licenza..."
              className="w-full bg-zinc-900/80 border border-white/10 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-blue-500 transition-colors text-white"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6" onClick={() => toast.success('Modulo Generazione Licenza', { description: 'Apertura modale per la generazione manuale in corso...' })}>
            <Plus className="w-4 h-4 mr-2" /> Genera Nuova Licenza
          </Button>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-6 font-medium">Utente</th>
                <th className="p-6 font-medium">Piano</th>
                <th className="p-6 font-medium">Stato Licenza</th>
                <th className="p-6 font-medium">VPS / Sync</th>
                <th className="p-6 font-medium text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: "Mario Rossi", email: "mario@example.com", plan: "PRO", status: "ACTIVE", vps: "VPS-99X21" },
                { name: "Luigi Bianchi", email: "luigi@example.com", plan: "BASIC", status: "EXPIRED", vps: "VPS-11A0B" },
                { name: "Giuseppe Verdi", email: "g.verdi@example.com", plan: "ENTERPRISE", status: "SUSPENDED", vps: "VPS-44P8Z" },
              ].map((user, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.plan === 'PRO' ? 'bg-blue-500/20 text-blue-400' : user.plan === 'ENTERPRISE' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-2 ${user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : user.status === 'EXPIRED' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : user.status === 'EXPIRED' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="font-mono text-sm text-gray-300">{user.vps}</div>
                    <div className="text-xs text-gray-600">Sync: 10 min fa</div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-white hover:bg-white/10" onClick={() => toast.info(`Dettagli utente ${user.name}`, { description: 'Caricamento pagina profilo avanzato...' })}>Dettagli</Button>
                      <Button variant="outline" size="sm" className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => toast.error(`Utente ${user.name} sospeso`, { description: 'La licenza è stata invalidata su Firebase.' })}>Sospendi</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}