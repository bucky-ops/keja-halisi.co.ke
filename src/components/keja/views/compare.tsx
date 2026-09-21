"use client";
// KEJA HALISI — CompareView: side-by-side comparison of up to 3 listings,
// best value per row highlighted (lowest rent, biggest size, fastest response, no fee…).
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Scale, X, Play, MapPin, BadgeCheck, TriangleAlert } from "lucide-react";
import { useKeja, toast } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { computeTrustScore, scoreChipCls } from "@/lib/trust-score";
import { Fingerprint } from "lucide-react";
import { fetchListings } from "../api";
import { kes, kesShort } from "@/lib/nairobi";
import type { ListingDTO } from "@/lib/types";
import { ListingCardSkeleton } from "../listing-card";
import { VerificationBadge, FreshBadge, NoFeeBadge } from "../badges";

/* module-level rows/labels (no components created during render) */
function Best({ show, label }: { show: boolean; label: string }) {
  if (!show) return null;
  return (
    <span className="pop ml-1.5 inline-flex items-center rounded-full bg-verified px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-wide text-white">
      ✓ {label}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center border-t border-kline bg-kbg/60 px-3 py-3 text-[11px] font-extrabold uppercase tracking-wide text-kmuted md:sticky md:left-0">
        {label}
      </div>
      {children}
    </>
  );
}

export default function CompareView() {
  const { compare, toggleCompare, clearCompare, navigate, back } = useKeja();
  const [all, setAll] = useState<ListingDTO[] | null>(null);
  const t = useT();

  useEffect(() => {
    let alive = true;
    fetchListings({ limit: 60 })
      .then((rows) => alive && setAll(rows))
      .catch(() => alive && setAll([]));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => (all ?? []).filter((l) => compare.includes(l.id)), [all, compare]);

  const minPrice = rows.length ? Math.min(...rows.map((l) => l.price)) : 0;
  const maxSize = rows.length ? Math.max(...rows.map((l) => l.sizeSqm ?? 0)) : 0;
  const minResp = rows.length ? Math.min(...rows.map((l) => l.responseTime)) : 0;
  const minDist = rows.length ? Math.min(...rows.map((l) => l.distanceToRoadM)) : 0;
  const maxEvidence = rows.length; // evidence is always 5/5 pre-publish — highlight none
  const hasNoFee = rows.some((l) => !l.fee);
  const scores = useMemo(() => new Map(rows.map((l) => [l.id, computeTrustScore(l).score])), [rows]);
  const maxScore = rows.length ? Math.max(...scores.values()) : 0;

  const gridCols =
    rows.length >= 3
      ? "md:grid-cols-[190px_repeat(3,1fr)]"
      : rows.length === 2
        ? "md:grid-cols-[190px_repeat(2,1fr)]"
        : "md:grid-cols-[190px_1fr]";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <header className="flex flex-wrap items-center gap-3">
        <button
          onClick={back}
          className="touch-target grid place-items-center rounded-full border border-kline bg-surface text-body hover:bg-kbg"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-body">
            <Scale className="h-5 w-5 text-trust" /> {t("compareTitle")}
          </h2>
          <p className="mt-0.5 text-[12px] font-semibold text-kmuted">{t("compareSub")}</p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={() => {
              clearCompare();
              toast("info", "Compare tray cleared");
            }}
            className="ml-auto touch-target inline-flex items-center gap-1.5 rounded-full border border-scam/30 bg-scam/5 px-4 text-[12px] font-extrabold text-scam hover:bg-scam/10"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </header>

      {/* loading */}
      {all === null && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* empty */}
      {all !== null && rows.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-kline bg-surface p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-trust/10">
            <Scale className="h-6 w-6 text-trust" />
          </span>
          <p className="mt-3 font-display text-[15px] font-extrabold text-body">{t("compareEmpty")}</p>
          <button
            onClick={() => navigate("estate")}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-trust px-6 text-[12.5px] font-extrabold text-white hover:shadow-md"
          >
            {t("navEstates")} →
          </button>
        </div>
      )}

      {/* table */}
      {rows.length > 0 && (
        <div className="keja-scroll mt-6 overflow-x-auto rounded-3xl border border-kline bg-surface shadow-sm">
          <div className={`grid min-w-[640px] ${gridCols} md:min-w-0`}>
            {/* header row: listing cards */}
            <div className="hidden border-b border-kline bg-kbg/60 md:block" />
            {rows.map((l) => (
              <div key={l.id} className="relative border-b border-kline p-3">
                <button
                  onClick={() => toggleCompare(l.id)}
                  aria-label={`${t("remove")} ${l.estate}`}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-kbg text-kmuted hover:bg-scam/10 hover:text-scam"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => navigate("listing", { listingId: l.id })} className="w-full text-left">
                  <div className="relative mb-2.5 h-20 overflow-hidden rounded-2xl keja-building">
                    <span className="absolute inset-0 grid place-items-center">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </span>
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[9.5px] font-extrabold text-white backdrop-blur-sm">
                      {kes(l.price)}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-[12px] font-extrabold text-body">
                    {l.estate} • {l.beds}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] font-semibold text-kmuted">
                    <MapPin className="h-2.5 w-2.5 text-trust" /> {l.road ?? l.estate}, {l.subCounty}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1">
                    <VerificationBadge status={l.poster.verificationStatus} role={l.poster.role} />
                    <FreshBadge hours={l.freshH} />
                    {!l.fee && <NoFeeBadge className="!bg-surface/90" />}
                  </p>
                </button>
              </div>
            ))}

            {/* keja score */}
            <Row label="Keja Score">
              {rows.map((l) => {
                const score = scores.get(l.id) ?? 0;
                return (
                  <div key={`ks${l.id}`} className="border-t border-kline px-3 py-3">
                    <p className="flex items-center gap-1.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-extrabold tabular-nums", scoreChipCls(score))}>
                        <Fingerprint className="h-3.5 w-3.5" /> {score}
                      </span>
                      <Best show={score === maxScore && rows.length > 1} label={t("best")} />
                    </p>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">Trust signals in one glance</p>
                  </div>
                );
              })}
            </Row>

            {/* price */}
            <Row label={t("priceRow")}>
              {rows.map((l) => (
                <div key={`p${l.id}`} className="border-t border-kline px-3 py-3">
                  <p className="font-display text-[15px] font-extrabold text-body">
                    {kes(l.price)} <span className="text-[10px] font-semibold text-kmuted">/mo</span>
                    <Best show={l.price === minPrice} label={t("best")} />
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">Deposit {kesShort(l.deposit)}</p>
                </div>
              ))}
            </Row>

            {/* beds / size */}
            <Row label={t("sizeRow")}>
              {rows.map((l) => (
                <div key={`s${l.id}`} className="border-t border-kline px-3 py-3">
                  <p className="text-[12.5px] font-extrabold text-body">
                    {l.beds} • {l.sizeSqm}sqm
                    <Best show={(l.sizeSqm ?? 0) === maxSize && maxSize > 0} label={t("best")} />
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">Floor {l.floor}</p>
                </div>
              ))}
            </Row>

            {/* response */}
            <Row label={t("respRow")}>
              {rows.map((l) => (
                <div key={`r${l.id}`} className="border-t border-kline px-3 py-3">
                  <p className="text-[12.5px] font-extrabold text-body">
                    ~{l.responseTime} min
                    <Best show={l.responseTime === minResp} label={t("best")} />
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">{l.poster.tiktokHandle} • {l.poster.rating}★</p>
                </div>
              ))}
            </Row>

            {/* distance */}
            <Row label={t("roadRow")}>
              {rows.map((l) => (
                <div key={`d${l.id}`} className="border-t border-kline px-3 py-3">
                  <p className="text-[12.5px] font-extrabold text-body">
                    {l.distanceToRoadM}m
                    <Best show={l.distanceToRoadM === minDist} label={t("best")} />
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">~{Math.round(l.distanceToRoadM / 70)} min walk • {l.weather.temp}°C</p>
                </div>
              ))}
            </Row>

            {/* fee honesty */}
            <Row label={t("feeRow")}>
              {rows.map((l) => (
                <div key={`f${l.id}`} className="border-t border-kline px-3 py-3">
                  {l.fee ? (
                    <p className="inline-flex items-center gap-1.5 rounded-lg bg-scam-soft px-2.5 py-1.5 text-[11px] font-extrabold text-scam">
                      <TriangleAlert className="h-3.5 w-3.5" /> Viewing fee charged
                    </p>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 rounded-lg bg-verified-soft px-2.5 py-1.5 text-[11px] font-extrabold text-ok">
                      ✓ {t("noFee")} <Best show={hasNoFee} label={t("best")} />
                    </p>
                  )}
                </div>
              ))}
            </Row>

            {/* evidence */}
            <Row label={t("evidenceRow")}>
              {rows.map((l) => (
                <div key={`e${l.id}`} className="border-t border-kline px-3 py-3">
                  <p className="text-[12.5px] font-extrabold text-ok">
                    ✓ 5/5 clips
                    <Best show={maxEvidence === rows.length && rows.length > 1} label={t("best")} />
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-kmuted">Outside • Gate • Inside • Water • Window</p>
                </div>
              ))}
            </Row>

            {/* CTA row */}
            <div className="hidden bg-kbg/60 md:block" />
            {rows.map((l) => (
              <div key={`c${l.id}`} className="flex flex-col gap-2 p-3">
                <button
                  onClick={() => navigate("listing", { listingId: l.id })}
                  className="h-11 rounded-xl bg-ink text-[12px] font-extrabold text-white hover:shadow-md"
                >
                  {t("view")} {l.estate} →
                </button>
                <p className="flex items-center justify-center gap-1 text-[10px] font-bold text-kmuted">
                  <BadgeCheck className="h-3 w-3 text-verified" /> {l.poster.tiktokHandle} • {l.poster.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 rounded-2xl bg-kbg px-4 py-3 text-[11px] font-semibold leading-relaxed text-kmuted">
        🛡️ Anti-scam reminder: never send money before viewing — {t("banner")}. Comparisons use live demo data only;
        exact house numbers stay hidden until contact.
      </p>
    </div>
  );
}
