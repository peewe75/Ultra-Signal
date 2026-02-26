"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UserButton } from "@clerk/nextjs";
import { Copy, Plus, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function UserDashboard() {
  const [telegramId, setTelegramId] = useState("");
  const [hasTelegramId, setHasTelegramId] = useState(true); // Default a true, lo cambieremo tramite fetch reale in futuro se Firebase risponde false
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseKey, setLicenseKey] = useState("In attesa..."); // Stato per la chiave reale
  const [errorMsg, setErrorMsg] = useState("");

  // Qui inseriremo l'hook useEffect per verificare se in Firebase l'utente ha già il Telegram ID.
  // Per ora, simuliamo che l'utente NON lo abbia inserito.
  useEffect(() => {
    // In produzione farà una chiamata /api/user/me
    setHasTelegramId(false);
  }, []);

  const handleSaveTelegramId = async () => {
    if (!telegramId || isNaN(Number(telegramId))) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/user/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.licenseKey) {
          setLicenseKey(data.licenseKey);
        }
        setHasTelegramId(true);
      } else {
        const text = await res.text();
        console.error("API error:", res.status, text);
        setErrorMsg(`Errore API (${res.status}): ${text}`);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(`Errore di rete: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans relative">

      {/* POPUP OBBLIGATORIO TELEGRAM ID */}
      <Dialog open={!hasTelegramId} onOpenChange={() => { }}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="text-blue-500 w-6 h-6" />
              Collega Telegram
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Per poter generare e inviare la tua licenza, abbiamo bisogno del tuo <b>Telegram ID numerico</b>. Non inserire l&apos;username (@).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tid" className="text-gray-300">Telegram ID Numerico</Label>
              <Input
                id="tid"
                placeholder="es. 123456789"
                className="bg-black border-white/10 text-white focus:border-blue-500"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 bg-white/5 p-3 rounded-md">
              💡 <b>Come trovarlo:</b> Cerca <code>@userinfobot</code> su Telegram, avvialo e copia il numero ID (es. 1958421) che ti restituisce.
            </p>
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm">
                {errorMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveTelegramId}
              disabled={isSubmitting || !telegramId}
            >
              {isSubmitting ? "Salvataggio..." : "Salva e Continua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white">BCS</div>
          <span className="font-semibold text-xl">Dashboard Utente</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Licenza Attiva
          </div>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 ${!hasTelegramId ? 'blur-sm pointer-events-none' : ''}`}>

        {/* Main Content (Left) */}
        <div className="md:col-span-2 space-y-8">

          {/* Subscription Card */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Il tuo Abbonamento</h2>
                <p className="text-gray-400">Gestisci il tuo piano e la fatturazione.</p>
              </div>
              <div className="bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl font-medium">PIANO PRO</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/50 rounded-2xl p-4">
                <span className="text-sm text-gray-500 block mb-1">Scadenza</span>
                <span className="font-semibold text-lg">22 Mar 2026</span>
              </div>
              <div className="bg-black/50 rounded-2xl p-4">
                <span className="text-sm text-gray-500 block mb-1">Account Utilizzati</span>
                <span className="font-semibold text-lg">2 / 3</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => toast.info('Integrazione Stripe', { description: 'Reindirizzamento al portale clienti Stripe in fase di implementazione.' })}>Gestisci su Stripe</Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl text-black" onClick={() => toast.info('Upgrade Piano', { description: 'La selezione del piano superiore sarà disponibile a breve.' })}>Esegui Upgrade</Button>
            </div>
          </div>

          {/* License & Configuration */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
            <h2 className="text-2xl font-semibold mb-6">La tua Licenza</h2>

            <div className="mb-8">
              <label className="text-sm text-gray-400 block mb-2">License Key</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-black/50 p-4 rounded-xl font-mono text-blue-400 border border-white/5 break-all">
                  {licenseKey}
                </code>
                <Button className="h-auto px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl" title="Copia negli appunti" onClick={() => { navigator.clipboard.writeText(licenseKey); toast.success('Copiato', { description: 'License Key copiata negli appunti.' }); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Usa questa chiave per attivare il bot su Telegram tramite il comando <code>/sync</code>.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-white/10 pb-2">Account MT4/MT5 Autorizzati</h3>

              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="font-mono">8899221 (IC Markets)</span>
                </div>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => toast.error('Azione Protetta', { description: 'La rimozione degli account sincronizzati deve essere fatta tramite bot Telegram.' })}>Rimuovi</Button>
              </div>

              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="font-mono">4455110 (FTMO)</span>
                </div>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-white" onClick={() => toast.error('Azione Protetta', { description: 'La rimozione degli account sincronizzati deve essere fatta tramite bot Telegram.' })}>Rimuovi</Button>
              </div>

              <Button variant="outline" className="w-full border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 h-14 rounded-xl mt-4 bg-transparent text-white" onClick={() => toast.info('Aggiunta Account MT4/MT5', { description: 'Per registrare un nuovo account, esegui il comando /sync dal bot Telegram del tuo VPS.' })}>
                <Plus className="w-4 h-4 mr-2" /> Aggiungi Account
              </Button>
            </div>
          </div>

        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-8">
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-3xl p-6">
            <h3 className="font-semibold text-blue-400 mb-2">Istruzioni Rapide</h3>
            <ol className="text-sm text-blue-100/70 space-y-4 list-decimal list-inside">
              <li>Copia la tua <strong>License Key</strong>.</li>
              <li>Avvia il bot Telegram <code>@BCSAI_AdminBot</code>.</li>
              <li>Invia il comando <code>/sync [CHIAVE] [INSTALL_ID]</code>.</li>
              <li>Scarica il token e inseriscilo nella cartella <code>Files</code> di MT4/MT5.</li>
            </ol>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="font-semibold mb-4">Supporto</h3>
            <p className="text-sm text-gray-400 mb-4">Hai bisogno di aiuto con l&apos;installazione o hai problemi con la licenza?</p>
            <Button className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white" onClick={() => toast.success('Richiesta inviata', { description: 'Un assistente ti contatterà presto sul tuo Telegram.' })}>Contatta Assistenza</Button>
          </div>
        </div>

      </main>
    </div>
  );
}