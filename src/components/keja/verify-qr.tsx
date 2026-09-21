"use client";
// KEJA HALISI — Agent "Verify Me" QR badge.
// A printable poster QR that encodes the agent's shield deep-link:
// any tenant can scan it offline from a gate poster and land on the agent's
// Scam Shield verdict — trust that travels from the street to the catalog.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, X, Download, Copy, ShieldCheck, CircleCheck, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { useT } from "@/lib/i18n";

export const shieldDeepLink = (handle: string) =>
  `https://keja-halisi.co.ke/?shield=${encodeURIComponent(handle)}`;

async function makeQr(handle: string, size: number): Promise<string> {
  return QRCode.toDataURL(shieldDeepLink(handle), {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#FFFFFF" },
  });
}

/* ---------- compact card (agent profile left column) ---------- */
export function VerifyQrCard({ handle, verified }: { handle: string; verified: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl border border-trust/25 bg-trust-soft p-4"
        aria-label="Agent verify-me QR badge"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-trust/15 blur-xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-trust text-white shadow-md">
            <QrCode className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-extrabold text-trust">{t("qrCardTitle")}</p>
            <p className="mt-0.5 text-[10.5px] font-semibold leading-snug text-trust/80">
              {t("qrCardSub")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="touch-target mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-trust py-2.5 text-[11.5px] font-extrabold text-white shadow-[0_6px_16px_rgba(25,118,210,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <QrCode className="h-3.5 w-3.5" /> {t("qrCardCta")}
        </button>
      </div>
      {open && <VerifyQrModal handle={handle} verified={verified} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ---------- poster modal ---------- */
export function VerifyQrModal({
  handle,
  verified,
  onClose,
}: {
  handle: string;
  verified: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const navigate = useKeja((s) => s.navigate);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    makeQr(handle, 560).then((url) => alive && setQr(url));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [handle, onClose]);

  const download = async () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `keja-halisi-verify-${handle.replace("@", "")}.png`;
    a.click();
    toast("success", `QR poster downloaded — ${t("qrToastDownload")}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shieldDeepLink(handle));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      toast("success", `${t("qrToastCopyTitle")} — ${shieldDeepLink(handle)}`);
    } catch {
      toast("error", t("qrToastCopyFail"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Agent verify me QR poster"
    >
      <div className="slide-up max-h-[92vh] w-full max-w-[400px] overflow-y-auto keja-scroll rounded-3xl bg-surface p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-[15px] font-extrabold text-body">
            <QrCode className="h-4 w-4 text-trust" /> {t("qrModalTitle")}
          </h3>
          <button onClick={onClose} aria-label="Close" className="touch-target grid place-items-center rounded-full hover:bg-kbg">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* the poster */}
        <div className="rounded-2xl border border-kline bg-white p-4 text-center shadow-inner" style={{ backgroundImage: "radial-gradient(#1976D2 0.75px, transparent 0.75px)", backgroundSize: "14px 14px" }}>
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-trust px-3 py-1 text-[9px] font-extrabold tracking-[0.18em] text-white">
            <ShieldCheck className="h-3 w-3" /> KEJA HALISI • VERIFIED SOURCE
          </div>
          {qr ? (
            <img
              src={qr}
              alt={`Verify QR for ${handle} — opens Scam Shield verdict`}
              className="mx-auto mt-3 h-44 w-44 rounded-xl ring-1 ring-black/5"
            />
          ) : (
            <div className="mx-auto mt-3 h-44 w-44 animate-pulse rounded-xl bg-kbg" aria-label="Generating QR" />
          )}
          <p className="mt-3 font-display text-[15px] font-extrabold text-[#111827]">{handle}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
            {t("qrPosterTagline")}
          </p>
          <p className="mx-auto mt-2 max-w-[240px] text-[9.5px] font-semibold leading-snug text-[#6b7280]">
            {t("qrPosterHow")}
          </p>
        </div>

        {/* actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={download}
            disabled={!qr}
            className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[11.5px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {t("qrDownload")}
          </button>
          <button
            onClick={copyLink}
            className={cn(
              "touch-target inline-flex items-center justify-center gap-1.5 rounded-full border py-2.5 text-[11.5px] font-extrabold transition-colors",
              copied ? "border-verified bg-verified-soft text-ok-strong" : "border-kline bg-surface text-body hover:bg-kbg"
            )}
          >
            {copied ? <CircleCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("qrCopied") : t("qrCopy")}
          </button>
        </div>
        <button
          onClick={() => { onClose(); navigate("shield", { q: handle }); }}
          className="touch-target mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-trust-soft py-2.5 text-[11.5px] font-extrabold text-trust ring-1 ring-trust/25 transition-colors hover:bg-trust/15"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> {t("qrTryShield")}
        </button>

        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-kbg px-3 py-2.5 text-[9.5px] font-semibold leading-snug text-kmuted">
          <Printer className="mt-0.5 h-3 w-3 shrink-0" /> {t("qrPosterFoot")}
        </p>
      </div>
    </div>
  );
}
