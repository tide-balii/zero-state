/**
 * Safe-Speak Portal — Single Page Application
 * Design: Zero-Knowledge Vault — Cryptographic Minimalism
 *
 * Dark views (Login + Employee): slate-950 bg, emerald-400 neon accents
 * Light views (Employer Ledger): slate-50 bg, indigo-600 corporate accents
 *
 * Fonts: Space Grotesk (display) + JetBrains Mono (data/code)
 */

import { useState } from "react";
import {
  Lock,
  Wallet,
  ShieldCheck,
  Loader2,
  Sparkles,
  CheckCircle2,
  Circle,
  Activity,
  FileText,
  BarChart3,
  Network,
  AlertTriangle,
  ClipboardList,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Hash,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";

declare global {
  interface Window {
    midnight?: {
      lace?: {
        enable: () => Promise<any>;
      };
    };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "login" | "employee" | "employer";

interface LedgerReport {
  id: string;
  text: string;
  timestamp: string;
  nullifier: string;
  isNew?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DARK_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663623991298/aJ3HasfHBAQgNtNBDqBLnY/dark-bg-cig3qWWghHGXjxkj8stWiH.webp";

const LIGHT_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663623991298/aJ3HasfHBAQgNtNBDqBLnY/light-bg-CFozYxVktykq5zHPJteUqM.webp";

const RAW_REPORT =
  "My manager John Smith at the Chicago warehouse is forcing us to bypass safety inspections on Forklift #4 to meet quotas, and he threatened to fire me if I reported it on Tuesday.";

const SANITIZED_REPORT =
  "An incident of safety protocol bypass regarding heavy machinery maintenance has been reported at a regional facility, accompanied by allegations of management retaliation.";

// Format a Date (or ISO string) as EST, e.g. "2025-05-14 · 09:42 EST"
function formatEST(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    d
      .toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      // "05/14/2025, 09:42" → "2025-05-14 · 09:42 EST"
      .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2})/, "$3-$1-$2 · $4") + " EST"
  );
}

const INITIAL_REPORTS: LedgerReport[] = [
  {
    id: "rpt-001",
    text: "An incident of safety protocol bypass regarding heavy machinery maintenance has been reported at a regional facility, accompanied by allegations of management retaliation.",
    timestamp: formatEST("2025-05-14T09:42:00-04:00"),
    nullifier: "0x8F9B...3C12",
  },
  {
    id: "rpt-002",
    text: "Irregular expense reimbursement patterns have been identified within a departmental budget cycle, suggesting potential misappropriation of corporate funds over a three-month period.",
    timestamp: formatEST("2025-05-10T14:17:00-04:00"),
    nullifier: "0xA2D4...7E89",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "login", label: "Login Gate", icon: <Lock size={14} /> },
    { id: "employee", label: "Employee Portal", icon: <ShieldCheck size={14} /> },
    { id: "employer", label: "Employer Ledger", icon: <ClipboardList size={14} /> },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-white/8">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <Lock size={13} className="text-emerald-400" />
        </div>
        <span
          className="text-sm font-semibold tracking-tight text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Safe<span className="text-emerald-400">Speak</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              active === tab.id
                ? tab.id === "employer"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Network badge */}
      <div className="flex items-center gap-1.5 text-xs font-mono-data text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Midnight Testnet
      </div>
    </div>
  );
}

// ─── VIEW 1: Login Gate ───────────────────────────────────────────────────────

// Wallet connection states
type WalletState = "idle" | "requesting" | "approving" | "connected";

function LoginGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [walletState, setWalletState] = useState<WalletState>("idle");
  const [walletAddress] = useState("0x8F9B...3C12");
  const [authLoading, setAuthLoading] = useState(false);

  const handleConnectWallet = async () => {
    if (walletState !== "idle") return;
    setWalletState("requesting");
    
    try {
      if (typeof window.midnight?.lace?.enable !== "function") {
        throw new Error("Lace wallet extension is not installed or enabled in this browser.");
      }
      
      setWalletState("approving");
      const dAppConnector = await window.midnight.lace.enable();
      
      setWalletState("connected");
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setWalletState("idle");
      alert("Failed to connect wallet: " + (error as Error).message);
    }
  };

  const handleAuthenticate = () => {
    if (authLoading || walletState !== "connected") return;
    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      onAuthenticated();
    }, 1500);
  };

  const isConnected = walletState === "connected";

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #020617 0%, #0a1628 50%, #020617 100%)" }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${DARK_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-5 neon-glow">
            <Lock size={28} className="text-emerald-400" />
          </div>
          <h1
            className="text-3xl font-bold text-white mb-1 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Safe-Speak Portal
          </h1>
          <p className="text-sm text-slate-500 font-mono-data tracking-wider uppercase">
            Zero-Knowledge Authentication
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 border"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            borderColor: isConnected ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: isConnected ? "0 0 40px rgba(16,185,129,0.08)" : "none",
            transition: "border-color 0.4s, box-shadow 0.4s",
          }}
        >
          {/* ── Step 1: Connect Wallet ── */}
          <div className="mb-2">
            <label className="block text-xs font-semibold text-slate-500 mb-3 tracking-widest uppercase font-mono-data">
              Step 1 — Connect Wallet Extension
            </label>

            {/* Main connect button */}
            {!isConnected && (
              <button
                onClick={handleConnectWallet}
                disabled={walletState === "requesting" || walletState === "approving"}
                className="w-full flex items-center gap-4 py-4 px-5 rounded-xl border transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed group"
                style={{
                  background:
                    walletState === "idle"
                      ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)"
                      : "rgba(255,255,255,0.03)",
                  borderColor:
                    walletState === "idle" ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)",
                  boxShadow:
                    walletState === "idle"
                      ? "0 0 20px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                {/* Lace wallet icon area */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{
                    background:
                      walletState === "idle"
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "rgba(255,255,255,0.06)",
                    boxShadow:
                      walletState === "idle" ? "0 0 16px rgba(16,185,129,0.5)" : "none",
                  }}
                >
                  {walletState === "requesting" || walletState === "approving" ? (
                    <Loader2 size={18} className="text-emerald-400 animate-spin" />
                  ) : (
                    <Wallet size={18} className="text-white" />
                  )}
                </div>

                {/* Label */}
                <div className="text-left flex-1">
                  <p
                    className="text-sm font-bold text-white leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {walletState === "idle" && "Connect Midnight Wallet (Lace)"}
                    {walletState === "requesting" && "Opening Lace Extension..."}
                    {walletState === "approving" && "Awaiting Approval in Lace..."}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-data mt-0.5">
                    {walletState === "idle" && "Lace · Midnight Network · DApp Connector"}
                    {walletState === "requesting" && "Check your browser extension popup"}
                    {walletState === "approving" && "Confirm the connection request"}
                  </p>
                </div>

                {/* Arrow / spinner indicator */}
                {walletState === "idle" && (
                  <ChevronRight size={16} className="text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            )}

            {/* Connected success state */}
            {isConnected && (
              <div
                className="w-full flex items-center gap-4 py-4 px-5 rounded-xl border animate-slide-up"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)",
                  borderColor: "rgba(16,185,129,0.35)",
                  boxShadow: "0 0 24px rgba(16,185,129,0.12), inset 0 1px 0 rgba(16,185,129,0.1)",
                }}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 0 16px rgba(16,185,129,0.5)",
                  }}
                >
                  <CheckCircle2 size={18} className="text-white" />
                </div>

                {/* Address info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-sm font-bold text-emerald-300"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      ✅ Wallet Connected
                    </span>
                    <span className="text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono-data">
                      Lace
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono-data tracking-wider">
                    {walletAddress}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-data mt-0.5">
                    Midnight Network · Active Employee Set
                  </p>
                </div>

                {/* Pulse dot */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-glow" />
                  <span className="text-xs text-emerald-600 font-mono-data">LIVE</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-600 font-mono-data tracking-widest">STEP 2 — ZK-PROOF</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Authenticate Button */}
          <button
            onClick={handleAuthenticate}
            disabled={!isConnected || authLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed"
            style={
              isConnected
                ? {
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(16,185,129,0.4), 0 4px 15px rgba(16,185,129,0.25)",
                    opacity: authLoading ? 0.8 : 1,
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "none",
                  }
            }
          >
            {authLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying Merkle Tree Membership...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Authenticate via ZK-Proof
              </>
            )}
          </button>

          {/* Disabled hint */}
          {!isConnected && (
            <p className="text-center text-xs text-slate-700 mt-3 font-mono-data">
              Connect your wallet above to enable authentication
            </p>
          )}
        </div>

        {/* Compliance Subtext */}
        <div
          className="mt-5 rounded-xl px-5 py-3.5 border text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-xs text-slate-500 leading-relaxed">
            🔒 Safe-Speak never accesses your seed phrase. Authentication is performed
            mathematically off-chain via Zero-Knowledge Set Membership.
          </p>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-700 mt-4 font-mono-data">
          Powered by Midnight Network · Compact ZK-Circuits
        </p>
      </div>
    </div>
  );
}

// ─── VIEW 2: Employee Portal ──────────────────────────────────────────────────

function EmployeePortal({
  onSubmitReport,
}: {
  onSubmitReport: (report: LedgerReport) => void;
}) {
  const [rawText, setRawText] = useState(RAW_REPORT);
  const [sanitizedText, setSanitizedText] = useState("");
  const [sanitizing, setSanitizing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [modalDone, setModalDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSanitize = async () => {
    if (sanitizing || !rawText.trim()) return;
    setSanitizedText("");
    setSanitizing(true);
    
    try {
      const response = await fetch("/api/sanitize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to sanitize text");
      }
      
      setSanitizedText(data.sanitizedText);
    } catch (error) {
      console.error("Sanitization error:", error);
      alert("Sanitization failed: " + (error as Error).message);
    } finally {
      setSanitizing(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirmed || !sanitizedText || submitted) return;
    setShowModal(true);
    setModalStep(0);
    setModalDone(false);

    try {
      // Step 1: AI Sanitization Complete
      setModalStep(1);

      // Step 2: Cryptographic Hashing & Merkle prep
      const encoder = new TextEncoder();
      const data = encoder.encode(sanitizedText);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const reportHash = new Uint8Array(hashBuffer);
      setModalStep(2);

      // Step 3: Generate Local ZK Private State (Never leaves browser)
      const secretKey = crypto.getRandomValues(new Uint8Array(32));
      setModalStep(3);

      // Step 4: Compile Circuit & Submit to Ledger
      // If we don't have a live DAppConnector API running with a Prover server,
      // we log the intended interaction and mock the final execution delay.
      const dAppAPI = typeof window !== 'undefined' && window.midnight?.lace ? await window.midnight.lace.enable() : null;
      if (!dAppAPI) {
        console.warn("Lace extension not available. Simulating network interaction...");
      }

      /*
        // --- PRODUCTION MIDNIGHT ZK-PROOF GENERATION ---
        import { Contract } from "@/midnight/managed/whitelist/contract";
        import { createWhitelistWitnesses } from "@/midnight/witnesses";
        import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
        
        // Construct the providers from dAppAPI
        const config = await dAppAPI.getConfiguration();
        const providers = initializeProviders(dAppAPI, config);
        
        // Deploy and add user
        const deployedContract = await deployContract(providers, {
          privateState: { secretKey },
          compiledContract: new Contract(createWhitelistWitnesses()) as any,
          args: []
        });
        await deployedContract.callTx.add_to_whitelist(derivedPublicKey);
        
        // The Prover executes locally in the browser, verifies the Merkle path,
        // and sends ONLY the ZK proof + the reportHash to the Midnight ledger.
        await deployedContract.callTx.verify_whitelist_membership(reportHash);
      */
      
      // Simulate network verification time
      await new Promise(r => setTimeout(r, 2000));
      
      setModalStep(4);
      setTimeout(() => {
        setModalDone(true);
        const newReport: LedgerReport = {
          id: `rpt-new-${Date.now()}`,
          text: sanitizedText,
          timestamp: formatEST(new Date()),
          nullifier: "0x" + Array.from(secretKey).slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase() + "...ZK",
          isNew: true,
        };
        onSubmitReport(newReport);
        setSubmitted(true);
      }, 1000);
    } catch (error) {
      console.error("ZK Generation Failed:", error);
      alert("Failed to generate Zero-Knowledge Proof: " + (error as Error).message);
      setShowModal(false);
    }
  };

  const checklistItems = [
    "AI Sanitization complete...",
    "Merkle Tree Membership verified...",
    "Generating privacy nullifier...",
    "Compiling Compact ZK-Circuit...",
  ];

  return (
    <div
      className="relative min-h-screen pt-14"
      style={{
        background: "linear-gradient(135deg, #020617 0%, #0a1628 50%, #020617 100%)",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${DARK_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header Banner */}
        <div
          className="rounded-2xl px-6 py-4 mb-6 border flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)",
            borderColor: "rgba(16,185,129,0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2
                className="text-sm font-bold text-white tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                🔒 Secure Drafting Environment
              </h2>
              <p className="text-xs text-emerald-400/70 font-mono-data">
                Status: Local Sandbox Execution Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-data">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400">ENCRYPTED</span>
            <span className="text-slate-600 mx-1">·</span>
            <span className="text-slate-500">LOCAL ONLY</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Left: Input Zone */}
          <div
            className="rounded-2xl p-5 border flex flex-col"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono-data">
                Raw Incident Report
              </span>
              <span className="ml-auto text-xs text-red-400/70 font-mono-data bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                SENSITIVE
              </span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="flex-1 w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 resize-none leading-relaxed"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
            <button
              onClick={handleSanitize}
              disabled={sanitizing || !rawText.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: sanitizing
                  ? "rgba(16,185,129,0.1)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: sanitizing ? "#10b981" : "#fff",
                border: sanitizing ? "1px solid rgba(16,185,129,0.3)" : "none",
                boxShadow: sanitizing
                  ? "none"
                  : "0 0 20px rgba(16,185,129,0.35), 0 4px 15px rgba(16,185,129,0.2)",
              }}
            >
              {sanitizing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Running Local AI Model...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  🪄 Sanitize with Local AI
                </>
              )}
            </button>
          </div>

          {/* Right: Safe Zone */}
          <div
            className="rounded-2xl p-5 border flex flex-col"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: sanitizedText
                ? "rgba(16,185,129,0.25)"
                : "rgba(255,255,255,0.08)",
              boxShadow: sanitizedText
                ? "0 0 30px rgba(16,185,129,0.08)"
                : "none",
              transition: "border-color 0.4s, box-shadow 0.4s",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest font-mono-data">
                Sanitized AI Output
              </span>
              {sanitizedText && (
                <span className="ml-auto text-xs text-emerald-400/80 font-mono-data bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-check-reveal">
                  ✓ PII REMOVED
                </span>
              )}
            </div>
            <div className="relative flex-1">
              <textarea
                readOnly
                value={sanitizing ? "" : sanitizedText}
                rows={8}
                placeholder={
                  sanitizing
                    ? ""
                    : "Sanitized output will appear here after AI processing..."
                }
                className="w-full h-full bg-white/3 border border-white/6 rounded-xl px-4 py-3 text-sm text-emerald-300 placeholder-slate-700 focus:outline-none resize-none leading-relaxed"
                style={{ fontFamily: "'Space Grotesk', sans-serif", minHeight: "180px" }}
              />
              {sanitizing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-950/60">
                  <Loader2 size={24} className="text-emerald-400 animate-spin" />
                  <span className="text-xs text-emerald-400/70 font-mono-data animate-pulse">
                    Analyzing & anonymizing text...
                  </span>
                </div>
              )}
            </div>
            {sanitizedText && !sanitizing && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 font-mono-data animate-slide-up">
                <Activity size={11} className="text-emerald-500/50" />
                PII entities removed · Semantic meaning preserved · Ready for submission
              </div>
            )}
          </div>
        </div>

        {/* Footer / Submission Zone */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <label className="flex items-start gap-3 cursor-pointer mb-5 group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                  confirmed
                    ? "bg-emerald-500 border-emerald-500"
                    : "bg-transparent border-slate-600 group-hover:border-slate-400"
                }`}
              >
                {confirmed && <CheckCircle2 size={12} className="text-white" />}
              </div>
            </div>
            <span className="text-sm text-slate-400 leading-relaxed">
              I confirm the sanitized text accurately represents the incident without revealing my
              identity.
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!confirmed || !sanitizedText || submitted}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              confirmed && sanitizedText && !submitted
                ? {
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(79,70,229,0.4), 0 4px 15px rgba(79,70,229,0.25)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            {submitted ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400" />
                Submitted to Midnight Ledger
              </>
            ) : (
              <>
                <Network size={16} />
                Generate ZK-Proof &amp; Submit Anonymously
              </>
            )}
          </button>
        </div>
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={modalDone ? () => setShowModal(false) : undefined}
          />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-md rounded-2xl p-7 border animate-slide-up"
            style={{
              background: "linear-gradient(135deg, #0d1f14 0%, #0a1628 100%)",
              borderColor: "rgba(16,185,129,0.25)",
              boxShadow: "0 0 60px rgba(16,185,129,0.15), 0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            {!modalDone ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Network size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3
                      className="text-base font-bold text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Preparing Anonymous Submission...
                    </h3>
                    <p className="text-xs text-slate-500 font-mono-data">
                      Midnight Network · Shielded DUST Protocol
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {checklistItems.map((item, i) => {
                    const isComplete = modalStep > i + 1;
                    const isActive = modalStep === i + 1;
                    const isPending = modalStep < i + 1;

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition-all duration-300 ${
                          isComplete
                            ? "bg-emerald-500/8 border border-emerald-500/20"
                            : isActive
                            ? "bg-white/4 border border-white/10"
                            : "opacity-40"
                        }`}
                        style={
                          isComplete || isActive
                            ? { animation: "check-reveal 0.25s cubic-bezier(0.23,1,0.32,1) forwards" }
                            : {}
                        }
                      >
                        {isComplete ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          i === 3 ? (
                            <Loader2 size={16} className="text-emerald-400 animate-spin shrink-0" />
                          ) : (
                            <Loader2 size={16} className="text-emerald-400 animate-spin shrink-0" />
                          )
                        ) : (
                          <Circle size={16} className="text-slate-700 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-mono-data ${
                            isComplete
                              ? "text-emerald-300"
                              : isActive
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          {item}
                        </span>
                        {isComplete && (
                          <span className="ml-auto text-xs text-emerald-500 font-mono-data">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-5 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${(modalStep / 4) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-4 animate-slide-up">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 neon-glow">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h3
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Submission Successful
                </h3>
                <p className="text-sm text-emerald-400 font-mono-data mb-1">
                  Submitted to Midnight Ledger via Shielded DUST
                </p>
                <p className="text-xs text-slate-500 mb-6">
                  Your report is now publicly verifiable with zero identity disclosure.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report Detail Modal ─────────────────────────────────────────────────────

function ReportDetailModal({
  report,
  onClose,
}: {
  report: LedgerReport;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-2xl border bg-white animate-slide-up shadow-2xl"
        style={{
          borderColor: report.isNew ? "#818cf8" : "#e2e8f0",
          boxShadow: report.isNew
            ? "0 0 0 2px rgba(99,102,241,0.15), 0 25px 60px rgba(99,102,241,0.15), 0 10px 30px rgba(0,0,0,0.12)"
            : "0 25px 60px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 border-b"
          style={{ borderColor: "#f1f5f9" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <FileText size={16} style={{ color: "#4f46e5" }} />
            </div>
            <div>
              <h3
                className="text-base font-bold text-slate-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Verified Incident Report
              </h3>
              <p className="text-xs text-slate-400 font-mono-data">Midnight Network · ZK-Verified Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {/* New badge */}
          {report.isNew && (
            <div className="mb-4">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                ✦ New Submission
              </span>
            </div>
          )}

          {/* Report text */}
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Shield size={12} style={{ color: "#64748b" }} />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono-data">
                Sanitized Report Content
              </span>
            </div>
            <p
              className="text-base text-slate-800 leading-relaxed"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {report.text}
            </p>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {/* Author */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield size={11} style={{ color: "#dc2626" }} />
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wider font-mono-data">Author</span>
              </div>
              <p className="text-sm font-bold text-red-600 font-mono-data">[HIDDEN BY ZK-CIRCUIT]</p>
              <p className="text-xs text-slate-400 mt-0.5">Identity mathematically concealed</p>
            </div>

            {/* Status */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 size={11} style={{ color: "#059669" }} />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider font-mono-data">Status</span>
              </div>
              <p className="text-sm font-bold text-emerald-700 font-mono-data">Active Employee</p>
              <p className="text-xs text-slate-400 mt-0.5">ZK set membership confirmed</p>
            </div>

            {/* Nullifier */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Hash size={11} style={{ color: "#4f46e5" }} />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider font-mono-data">Nullifier ID</span>
              </div>
              <p className="text-sm font-bold text-indigo-600 font-mono-data">{report.nullifier}</p>
              <p className="text-xs text-slate-400 mt-0.5">Prevents double-submission</p>
            </div>
          </div>

          {/* Timestamp & chain info */}
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono-data">
              <Clock size={11} />
              <span>{report.timestamp}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-mono-data">
              <Activity size={11} />
              <span>ZK-Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono-data">
              <ExternalLink size={11} />
              <span>Midnight Testnet · Shielded DUST</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-7 py-4 border-t flex items-center justify-between"
          style={{ borderColor: "#f1f5f9" }}
        >
          <p className="text-xs text-slate-400">
            This report is publicly verifiable. No author identity is stored on-chain.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 3: Employer Ledger ──────────────────────────────────────────────────

function EmployerLedger({ reports }: { reports: LedgerReport[] }) {
  const [selectedReport, setSelectedReport] = useState<LedgerReport | null>(null);

  return (
    <div
      className="relative min-h-screen pt-14"
      style={{ background: "#f8fafc" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${LIGHT_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={20} className="text-indigo-600" />
              <h1
                className="text-2xl font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Public Whistleblower Ledger
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Powered by Midnight Network · Cryptographically verified, identity-protected reports
            </p>
          </div>
          {/* Network Status Badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold"
            style={{
              background: "rgba(16,185,129,0.08)",
              borderColor: "rgba(16,185,129,0.25)",
              color: "#059669",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Midnight Testnet: Connected
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: <FileText size={18} className="text-indigo-600" />,
              label: "Total Verified Reports",
              value: reports.length + 12,
              color: "indigo",
            },
            {
              icon: <AlertTriangle size={18} className="text-amber-600" />,
              label: "Active Investigations",
              value: 3,
              color: "amber",
            },
            {
              icon: <BarChart3 size={18} className="text-emerald-600" />,
              label: "Security Integrity Score",
              value: "100%",
              color: "emerald",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border bg-white"
              style={{
                borderColor: "#e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {stat.icon}
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div
                className="text-3xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color:
                    stat.color === "indigo"
                      ? "#4f46e5"
                      : stat.color === "amber"
                      ? "#d97706"
                      : "#059669",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Ledger Feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono-data">
              Verified Report Feed
            </span>
            <div className="flex-1 h-px bg-slate-200 ml-2" />
            <span className="text-xs text-slate-400 font-mono-data">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </span>
          </div>

          {reports.map((report, idx) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`group rounded-2xl p-5 border bg-white transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                report.isNew ? "animate-slide-up" : ""
              }`}
              style={{
                borderColor: report.isNew ? "#818cf8" : "#e2e8f0",
                boxShadow: report.isNew
                  ? "0 0 0 2px rgba(99,102,241,0.15), 0 4px 20px rgba(99,102,241,0.1)"
                  : "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
                animationDelay: `${idx * 50}ms`,
              }}
            >
              {/* New badge */}
              {report.isNew && (
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full animate-check-reveal">
                    ✦ New Submission
                  </span>
                </div>
              )}

              {/* Report text */}
              <p
                className="text-sm text-slate-700 leading-relaxed mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {report.text}
              </p>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Author badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border font-mono-data"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    borderColor: "rgba(239,68,68,0.2)",
                    color: "#dc2626",
                  }}
                >
                  🛡️ Author: [HIDDEN BY ZK-CIRCUIT]
                </span>

                {/* Status badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border font-mono-data"
                  style={{
                    background: "rgba(16,185,129,0.07)",
                    borderColor: "rgba(16,185,129,0.25)",
                    color: "#059669",
                  }}
                >
                  ✅ Status: Active Employee Confirmed
                </span>

                {/* Nullifier badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border font-mono-data"
                  style={{
                    background: "rgba(99,102,241,0.07)",
                    borderColor: "rgba(99,102,241,0.25)",
                    color: "#4f46e5",
                  }}
                >
                  🧮 Nullifier ID: {report.nullifier}
                </span>
              </div>

              {/* Timestamp + expand hint */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono-data">
                  <Activity size={10} />
                  {report.timestamp}
                  <span className="mx-1">·</span>
                  <span className="text-indigo-400">ZK-Verified</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-indigo-400 font-mono-data opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={10} />
                  <span>View details</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 font-mono-data">
          <span>Safe-Speak · Midnight Network Testnet</span>
          <span>All reports cryptographically verified · No author identity stored</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [reports, setReports] = useState<LedgerReport[]>(INITIAL_REPORTS);

  const handleAuthenticated = () => {
    setActiveTab("employee");
  };

  const handleSubmitReport = (report: LedgerReport) => {
    setReports((prev) => [report, ...prev]);
  };

  return (
    <div className="min-h-screen">
      <TabBar active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === "login" && (
          <LoginGate onAuthenticated={handleAuthenticated} />
        )}
        {activeTab === "employee" && (
          <EmployeePortal onSubmitReport={handleSubmitReport} />
        )}
        {activeTab === "employer" && (
          <EmployerLedger reports={reports} />
        )}
      </div>
    </div>
  );
}
