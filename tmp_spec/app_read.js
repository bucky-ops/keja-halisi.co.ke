var Sc = HA(Xe(), 1),
  Kc = HA(hc(), 1);
var G = HA(Xe(), 1);
var Nc =
  "BASE64_LOGO_IMAGE_DATA";
var pl = HA(Xe(), 1);
var kc = (A) => A.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
  cl = (...A) =>
    A.filter((e, n, t) => {
      return Boolean(e) && e.trim() !== "" && t.indexOf(e) === n;
    })
      .join(" ")
      .trim();
var zt = HA(Xe(), 1);
var Rc = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
var gc = zt.forwardRef(
  (
    {
      color: A = "currentColor",
      size: e = 24,
      strokeWidth: n = 2,
      absoluteStrokeWidth: t,
      className: r = "",
      children: l,
      iconNode: u,
      ...i
    },
    f,
  ) => {
    return zt.createElement(
      "svg",
      {
        ref: f,
        ...Rc,
        width: e,
        height: e,
        stroke: A,
        strokeWidth: t ? (Number(n) * 24) / Number(e) : n,
        className: cl("lucide", r),
        ...i,
      },
      [
        ...u.map(([s, y]) => zt.createElement(s, y)),
        ...(Array.isArray(l) ? l : [l]),
      ],
    );
  },
);
var K = (A, e) => {
  let n = pl.forwardRef(({ className: t, ...r }, l) =>
    pl.createElement(gc, {
      ref: l,
      iconNode: e,
      className: cl(`lucide-${kc(A)}`, t),
      ...r,
    }),
  );
  return ((n.displayName = `${A}`), n);
};
var MA = K("BadgeCheck", [
  [
    "path",
    {
      d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
      key: "3c2336",
    },
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
]);
var Ft = K("Building2", [
  ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z", key: "1b4qmf" }],
  ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2", key: "i71pzd" }],
  ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2", key: "10jefs" }],
  ["path", { d: "M10 6h4", key: "1itunk" }],
  ["path", { d: "M10 10h4", key: "tcdvrf" }],
  ["path", { d: "M10 14h4", key: "kelpxr" }],
  ["path", { d: "M10 18h4", key: "1ulq68" }],
]);
var ee = K("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
var He = K("ChevronRight", [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]]);
var ne = K("CircleCheck", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
]);
var Wt = K("CreditCard", [
  [
    "rect",
    { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" },
  ],
  ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }],
]);
var Ct = K("Droplets", [
  [
    "path",
    {
      d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",
      key: "1ptgy4",
    },
  ],
  [
    "path",
    {
      d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",
      key: "1sl1rz",
    },
  ],
]);
var Et = K("Eye", [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0",
    },
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
]);
var Sn = K("FileText", [
  [
    "path",
    {
      d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
      key: "1rqfz7",
    },
  ],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }],
]);
var Be = K("Flag", [
  [
    "path",
    {
      d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
      key: "i9b6wo",
    },
  ],
  ["line", { x1: "4", x2: "4", y1: "22", y2: "15", key: "1cm3nv" }],
]);
var wt = K("Heart", [
  [
    "path",
    {
      d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
      key: "c3ymky",
    },
  ],
]);
var te = K("House", [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "1d0kgt",
    },
  ],
]);
var It = K("Info", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }],
]);
var Zt = K("LayoutDashboard", [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  [
    "rect",
    { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" },
  ],
  [
    "rect",
    { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" },
  ],
  [
    "rect",
    { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" },
  ],
]);
var Ge = K("Lock", [
  [
    "rect",
    {
      width: "18",
      height: "11",
      x: "3",
      y: "11",
      rx: "2",
      ry: "2",
      key: "1w4ew1",
    },
  ],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }],
]);
var Kn = K("MapPin", [
  [
    "path",
    {
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
      key: "1r0f0z",
    },
  ],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }],
]);
var re = K("Phone", [
  [
    "path",
    {
      d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
      key: "foiqr5",
    },
  ],
]);
var Jt = K("Play", [
  ["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }],
]);
var De = K("ShieldCheck", [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y",
    },
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
]);
var On = K("Smartphone", [
  [
    "rect",
    {
      width: "14",
      height: "20",
      x: "5",
      y: "2",
      rx: "2",
      ry: "2",
      key: "1yt0o3",
    },
  ],
  ["path", { d: "M12 18h.01", key: "mhygvu" }],
]);
var Qt = K("Store", [
  [
    "path",
    {
      d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7",
      key: "ztvudi",
    },
  ],
  ["path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", key: "1b2hhj" }],
  ["path", { d: "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4", key: "2ebpfo" }],
  ["path", { d: "M2 7h20", key: "1fcdvo" }],
  [
    "path",
    {
      d: "M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7",
      key: "6c3vgh",
    },
  ],
]);
var CA = K("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq",
    },
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }],
]);
var zn = K("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }],
]);
var Lt = K("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }],
]);
var Fn = K("Video", [
  [
    "path",
    {
      d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
      key: "ftymec",
    },
  ],
  [
    "rect",
    { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" },
  ],
]);
var Ye = K("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }],
]);
var Xc = HA(Xe(), 1),
  os = Symbol.for("react.element");
var is = Object.prototype.hasOwnProperty,
  as = Xc.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  fs = { key: !0, ref: !0, __self: !0, __source: !0 };
function Pc(A, e, n) {
  var t,
    r = {},
    l = null,
    u = null;
  (n !== void 0 && (l = "" + n),
    e.key !== void 0 && (l = "" + e.key),
    e.ref !== void 0 && (u = e.ref));
  for (t in e) is.call(e, t) && !fs.hasOwnProperty(t) && (r[t] = e[t]);
  if (A && A.defaultProps)
    for (t in ((e = A.defaultProps), e)) r[t] === void 0 && (r[t] = e[t]);
  return {
    $$typeof: os,
    type: A,
    key: l,
    ref: u,
    props: r,
    _owner: as.current,
  };
}
var o = Pc,
  a = Pc;
var ge = [
    {
      name: "Western",
      sub: ["Westlands", "Dagoretti North", "Dagoretti South"],
      estates: ["Kileleshwa", "Lavington", "Kilimani"],
    },
    {
      name: "Southern",
      sub: ["Langata", "Kibra"],
      estates: ["Karen", "Langata", "South C"],
    },
    {
      name: "Central",
      sub: ["Starehe", "Kamukunji", "Mathare"],
      estates: ["Ngara", "Eastleigh", "Pangani"],
    },
    {
      name: "Eastern",
      sub: ["Embakasi North", "Embakasi West", "Embakasi Central"],
      estates: ["Buruburu", "Umoja", "Kayole"],
    },
    {
      name: "South Eastern",
      sub: ["Embakasi South", "Embakasi East", "Makadara"],
      estates: ["Syokimau", "Mlolongo", "Donholm"],
    },
    {
      name: "Northern",
      sub: ["Ruaraka", "Roysambu", "Kasarani"],
      estates: ["Zimmerman", "Roysambu", "Kasarani"],
    },
  ],
  dl = [
    {
      id: "1",
      title: "1BR Garden Apt • Natural Light",
      estate: "Kileleshwa",
      subcounty: "Westlands",
      borough: "Western",
      road: "Othaya Rd",
      rent: 35000,
      beds: 1,
      freshH: 2,
      responseMins: 8,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Agent",
      evidence: ["outside", "gate", "inside", "water", "window"],
      tiktok: "@keja.kile",
    },
    {
      id: "2",
      title: "Bedsitter • Water 24/7 • Tiled",
      estate: "Syokimau",
      subcounty: "Embakasi South",
      borough: "South Eastern",
      road: "Airport Rd",
      rent: 12000,
      beds: 0,
      freshH: 5,
      responseMins: 12,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Caretaker",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
    {
      id: "3",
      title: "2BR Ensuite • Parking •",
      estate: "Zimmerman",
      subcounty: "Roysambu",
      borough: "Northern",
      road: "Kamiti Rd",
      rent: 28000,
      beds: 2,
      freshH: 26,
      responseMins: 22,
      fee: !0,
      verified: !1,
      available: !0,
      role: "Owner",
      evidence: ["outside", "inside"],
    },
    {
      id: "4",
      title: "Studio Exec • Balcony View",
      estate: "Roysambu",
      subcounty: "Roysambu",
      borough: "Northern",
      road: "Lumumba Dr",
      rent: 18000,
      beds: 0,
      freshH: 1,
      responseMins: 5,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Developer",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
    {
      id: "5",
      title: "1BR Spacious • Near TRM",
      estate: "Kasarani",
      subcounty: "Kasarani",
      borough: "Northern",
      road: "Mwiki Rd",
      rent: 22000,
      beds: 1,
      freshH: 14,
      responseMins: 18,
      fee: !1,
      verified: !0,
      available: !1,
      role: "Agent",
      evidence: ["outside", "inside", "window"],
    },
    {
      id: "6",
      title: "2BR Master Ensuite • Buruburu Phase 2",
      estate: "Buruburu",
      subcounty: "Makadara",
      borough: "South Eastern",
      road: "Mumias South Rd",
      rent: 32000,
      beds: 2,
      freshH: 3,
      responseMins: 9,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Caretaker",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
    {
      id: "7",
      title: "Bedsitter • Langata • Secure",
      estate: "Langata",
      subcounty: "Langata",
      borough: "Southern",
      road: "Langata Rd",
      rent: 15000,
      beds: 0,
      freshH: 48,
      responseMins: 35,
      fee: !0,
      verified: !1,
      available: !0,
      role: "Agent",
      evidence: ["outside", "inside"],
    },
    {
      id: "8",
      title: "3BR Bungalow • Own Compound",
      estate: "Mlolongo",
      subcounty: "Embakasi South",
      borough: "South Eastern",
      road: "Mombasa Rd",
      rent: 45000,
      beds: 3,
      freshH: 6,
      responseMins: 11,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Owner",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
    {
      id: "9",
      title: "1BR • Kilimani • Rooftop Gym",
      estate: "Kilimani",
      subcounty: "Westlands",
      borough: "Western",
      road: "Lenana Rd",
      rent: 40000,
      beds: 1,
      freshH: 20,
      responseMins: 14,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Developer",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
    {
      id: "10",
      title: "Bedsitter • Kasarani • New Build",
      estate: "Kasarani",
      subcounty: "Kasarani",
      borough: "Northern",
      road: "Sunton Rd",
      rent: 8000,
      beds: 0,
      freshH: 0.5,
      responseMins: 4,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Caretaker",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
    {
      id: "11",
      title: "2BR • Umoja • Water + Security",
      estate: "Umoja",
      subcounty: "Embakasi West",
      borough: "Eastern",
      road: "Moi Dr",
      rent: 25000,
      beds: 2,
      freshH: 30,
      responseMins: 28,
      fee: !0,
      verified: !1,
      available: !0,
      role: "Agent",
      evidence: ["outside", "gate"],
    },
    {
      id: "12",
      title: "1BR • South C • Quiet Estate",
      estate: "South C",
      subcounty: "Langata",
      borough: "Southern",
      road: "Muhoho Ave",
      rent: 30000,
      beds: 1,
      freshH: 8,
      responseMins: 7,
      fee: !1,
      verified: !0,
      available: !0,
      role: "Owner",
      evidence: ["outside", "gate", "inside", "water", "window"],
    },
  ];
function wo() {
  let [A, e] = G.useState("pages"),
    [n, t] = G.useState(1),
    [r, l] = G.useState("desktop"),
    [u, i] = G.useState([]),
    [f, s] = G.useState(null),
    [y, q] = G.useState(null),
    [m, h] = G.useState({
      fresh: !1,
      available: !1,
      noFee: !1,
      verified: !1,
      sortResponse: !1,
    }),
    [U, k] = G.useState(dl[0]),
    [Z, d] = G.useState(!1),
    [p, v] = G.useState(!1),
    [V, R] = G.useState(!1),
    [g, P] = G.useState(0),
    [X, M] = G.useState(1),
    [O, EA] = G.useState("Agent"),
    [Wn, Oc] = G.useState(["", "", "", "", "", ""]),
    [Io, zc] = G.useState([]),
    xe = (c, S = "info") => {
      let eA = Math.random().toString(36).slice(2);
      (i((be) => [...be, { id: eA, text: c, type: S }]),
        setTimeout(() => i((be) => be.filter((Wc) => Wc.id !== eA)), 3000));
    },
    Cn = G.useMemo(() => {
      let c = [...dl];
      if (f) c = c.filter((S) => S.borough === f);
      if (y) c = c.filter((S) => S.subcounty === y);
      if (m.fresh) c = c.filter((S) => S.freshH <= 24);
      if (m.available) c = c.filter((S) => S.available);
      if (m.noFee) c = c.filter((S) => !S.fee);
      if (m.verified) c = c.filter((S) => S.verified);
      if (m.sortResponse)
        c = c.sort((S, eA) => S.responseMins - eA.responseMins);
      return c;
    }, [f, y, m]);
  G.useEffect(() => {
    if (V) {
      P(0);
      let c = setInterval(() => P((S) => (S < 3 ? S + 1 : S)), 900);
      return () => clearInterval(c);
    }
  }, [V]);
  let Fc = (c) => {
    if (
      (zc((S) => (S.includes(c) ? S.filter((eA) => eA !== c) : [...S, c])),
      xe((S) => (S ? "Removed from saved" : "Saved to shortlist"), "success"),
      !Io.includes(c))
    )
      xe("Saved • No viewing fee houses prioritized", "success");
  };
  return a("div", {
    className:
      "min-h-screen bg-[#F5F7FA] text-[#111928] font-[Inter,system-ui,sans-serif]",
    children: [
      o("style", {
        children: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        .jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
`,
      }),
      o("header", {
        className:
          "sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-black/5",
        children: a("div", {
          className:
            "max-w-[1280px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between",
          children: [
            a("div", {
              className: "flex items-center gap-3",
              children: [
                o("img", {
                  src: Nc,
                  alt: "Keja Halisi",
                  className: "h-9 w-9 rounded-lg object-contain bg-white",
                }),
                a("div", {
                  children: [
                    o("div", {
                      className:
                        "jakarta font-bold text-[16px] leading-none tracking-tight",
                      children: "KEJA HALISI",
                    }),
                    o("div", {
                      className:
                        "text-[10px] tracking-[0.14em] text-[#00B140] font-semibold -mt-0.5",
                      children: "TRUST • NO FEE • VERIFIED",
                    }),
                  ],
                }),
                a("span", {
                  className:
                    "ml-3 hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1976D2]/10 text-[#1976D2] text-[11px] font-semibold",
                  children: [
                    o("span", {
                      className:
                        "h-1.5 w-1.5 rounded-full bg-[#0E9F6E] animate-pulse",
                    }),
                    " v3 Merged • Live Filters",
                  ],
                }),
              ],
            }),
            o("nav", {
              className: "hidden lg:flex items-center gap-1",
              children: [
                ["Mood Boards", "moodboards"],
                ["Design System", "designsystem"],
                ["Pages", "pages"],
                ["Prototype", "prototype"],
                ["Payment", "payment"],
                ["Trust", "trust"],
                ["Boroughs", "boroughs"],
              ].map(([c, S]) =>
                o(
                  "button",
                  {
                    onClick: () => {
                      (e(S),
                        document
                          .getElementById(S)
                          ?.scrollIntoView({ behavior: "smooth" }));
                    },
                    className: `px-3 py-2 rounded-full text-[13px] font-medium transition ${A === S ? "bg-[#111928] text-white" : "hover:bg-black/5"}`,
                    children: c,
                  },
                  S,
                ),
              ),
            }),
            a("div", {
              className: "flex items-center gap-2",
              children: [
                a("button", {
                  onClick: () =>
                    xe("Phone masked until contact • Lead logged", "info"),
                  className:
                    "hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-[#F5F7FA] border text-[13px]",
                  children: [
                    o(re, { className: "w-4 h-4" }),
                    " Masked Call Demo",
                  ],
                }),
                o("button", {
                  onClick: () => R(!0),
                  className:
                    "px-4 py-2 rounded-full bg-[#12B44A] text-white text-[13px] font-semibold hover:opacity-90",
                  children: "M-Pesa STK",
                }),
              ],
            }),
          ],
        }),
      }),
      o("div", {
        className: "fixed bottom-4 right-4 z-50 flex flex-col gap-2",
        children: u.map((c) =>
          a(
            "div",
            {
              className: `px-4 py-3 rounded-2xl shadow-xl text-[13px] font-medium flex items-center gap-2 max-w-[320px] ${c.type === "error" ? "bg-[#E02424] text-white" : c.type === "warn" ? "bg-[#C27803] text-white" : c.type === "success" ? "bg-[#0E9F6E] text-white" : "bg-[#111928] text-white"}`,
              children: [
                c.type === "success"
                  ? o(ne, { className: "w-4 h-4" })
                  : c.type === "warn"
                    ? o(CA, { className: "w-4 h-4" })
                    : o(It, { className: "w-4 h-4" }),
                o("span", { children: c.text }),
              ],
            },
            c.id,
          ),
        ),
      }),
      a("main", {
        className: "max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-12",
        children: [
          a("div", {
            className: "grid md:grid-cols-[1.2fr_0.8fr] gap-6",
            children: [
              a("div", {
                className:
                  "bg-white rounded-[28px] p-6 md:p-8 border shadow-sm",
                children: [
                  o("div", {
                    className:
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1976D2]/10 text-[#1976D2] text-[11px] font-bold tracking-wide",
                    children:
                      "TRUST BLUE #1976D2 • SAFARICOM GREEN #00B140 • VERIFIED #0E9F6E",
                  }),
                  a("h1", {
                    className:
                      "jakarta text-[32px] md:text-[44px] font-bold leading-[0.95] mt-4 tracking-tight",
                    children: [
                      "Nairobi rentals with ",
                      o("span", {
                        className: "text-[#1976D2]",
                        children: "trust checks,",
                      }),
                      " no viewing fee, evidence video.",
                    ],
                  }),
                  o("p", {
                    className:
                      "mt-3 text-[15px] leading-6 text-black/60 max-w-[56ch]",
                    children:
                      "Keja Halisi v3 merges new updates: 4 roles including Caretaker, trust filters, fee enforcement, privacy rule (exact number hidden), evidence checklist, borough model 6×17, Market Pulse + Trustbar, freshH & response time meta.",
                  }),
                  a("div", {
                    className: "mt-5 flex flex-wrap gap-2",
                    children: [
                      a("span", {
                        className:
                          "px-3 py-1.5 rounded-full bg-[#0E9F6E] text-white text-[12px] font-semibold flex items-center gap-1.5",
                        children: [
                          o(De, { className: "w-4 h-4" }),
                          "Trust checks: phone verified • evidence video • no fee rule • re-check",
                        ],
                      }),
                      o("span", {
                        className:
                          "px-3 py-1.5 rounded-full bg-[#111928] text-white text-[12px]",
                        children: "Exact house number intentionally not shown",
                      }),
                      o("span", {
                        className:
                          "px-3 py-1.5 rounded-full border text-[12px]",
                        children:
                          "Public UI shows estate + road, not exact house number",
                      }),
                    ],
                  }),
                  a("div", {
                    className: "mt-6 flex gap-2",
                    children: [
                      o("button", {
                        onClick: () =>
                          document
                            .getElementById("pages")
                            ?.scrollIntoView({ behavior: "smooth" }),
                        className:
                          "px-5 py-3 rounded-full bg-[#161616] text-white text-[14px] font-semibold",
                        children: "Explore 7 Pages",
                      }),
                      o("button", {
                        onClick: () =>
                          document
                            .getElementById("designsystem")
                            ?.scrollIntoView({ behavior: "smooth" }),
                        className:
                          "px-5 py-3 rounded-full bg-white border text-[14px] font-semibold",
                        children: "Design System",
                      }),
                    ],
                  }),
                ],
              }),
              a("div", {
                className: "space-y-4",
                children: [
                  a("div", {
                    className: "bg-white rounded-[24px] border p-5",
                    children: [
                      a("div", {
                        className: "flex items-center justify-between",
                        children: [
                          o("h3", {
                            className: "jakarta font-bold text-[14px]",
                            children: "Market Pulse • Nairobi Live",
                          }),
                          o("span", {
                            className:
                              "text-[10px] px-2 py-1 rounded-full bg-[#0E9F6E]/10 text-[#0E9F6E] font-bold",
                            children: "LIVE TODAY",
                          }),
                        ],
                      }),
                      a("div", {
                        className: "grid grid-cols-2 gap-3 mt-4",
                        children: [
                          a("div", {
                            className: "rounded-2xl bg-[#F5F7FA] p-3",
                            children: [
                              o("div", {
                                className: "text-[11px] text-black/50",
                                children: "Verified Today",
                              }),
                              o("div", {
                                className: "jakarta text-[20px] font-bold",
                                children: "127",
                              }),
                              o("div", {
                                className: "text-[11px] text-[#0E9F6E]",
                                children: "+18% vs yest",
                              }),
                            ],
                          }),
                          a("div", {
                            className: "rounded-2xl bg-[#F5F7FA] p-3",
                            children: [
                              o("div", {
                                className: "text-[11px] text-black/50",
                                children: "Scams Blocked",
                              }),
                              o("div", {
                                className: "jakarta text-[20px] font-bold",
                                children: "34",
                              }),
                              o("div", {
                                className: "text-[11px] text-[#E02424]",
                                children: "Fee signal • repost",
                              }),
                            ],
                          }),
                          a("div", {
                            className: "rounded-2xl bg-[#F5F7FA] p-3",
                            children: [
                              o("div", {
                                className: "text-[11px] text-black/50",
                                children: "Avg Response",
                              }),
                              o("div", {
                                className: "jakarta text-[20px] font-bold",
                                children: "9 min",
                              }),
                              o("div", {
                                className: "text-[11px]",
                                children: "Fastest 4 min",
                              }),
                            ],
                          }),
                          a("div", {
                            className: "rounded-2xl bg-[#F5F7FA] p-3",
                            children: [
                              o("div", {
                                className: "text-[11px] text-black/50",
                                children: "Fresh Listings",
                              }),
                              o("div", {
                                className: "jakarta text-[20px] font-bold",
                                children: "89 ≤24h",
                              }),
                              o("div", {
                                className: "text-[11px] text-[#1976D2]",
                                children: "Kile • Syoki • Zimm",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-[#161616] rounded-[20px] p-4 text-white",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-[0.14em] opacity-60",
                        children: "TRUSTBAR PILLS",
                      }),
                      a("div", {
                        className: "mt-2 flex flex-wrap gap-2",
                        children: [
                          a("span", {
                            className:
                              "px-3 py-1.5 rounded-full bg-[#0E9F6E] text-[12px] font-semibold flex items-center gap-1",
                            children: [
                              o(MA, { className: "w-4 h-4" }),
                              "Verified Green",
                            ],
                          }),
                          o("span", {
                            className:
                              "px-3 py-1.5 rounded-full bg-[#1976D2] text-[12px] font-semibold",
                            children: "No Viewing Fee Blue",
                          }),
                          a("span", {
                            className:
                              "px-3 py-1.5 rounded-full bg-[#E02424] text-[12px] font-semibold flex items-center gap-1",
                            children: [
                              o(Be, { className: "w-4 h-4" }),
                              "Reported Red",
                            ],
                          }),
                          o("span", {
                            className:
                              "px-3 py-1.5 rounded-full bg-white text-black text-[12px] font-semibold",
                            children: "Fresh ≤24h",
                          }),
                        ],
                      }),
                      o("div", {
                        className: "mt-3 text-[12px] leading-5 opacity-70",
                        children:
                          "Every card shows freshH, response mins, fee boolean, verified. Filters hide fee listings when No Fee active.",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          a("section", {
            id: "moodboards",
            className: "scroll-mt-20",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children: "Mood Boards 3 + Winner A+B",
              }),
              o("div", {
                className: "mt-4 grid md:grid-cols-4 gap-4",
                children: [
                  {
                    name: "A • Trust Editorial",
                    desc: "Serif headings, paper texture, verified green checks, estate breadcrumbs",
                    color: "#1976D2",
                    vibe: "Editorial trust",
                  },
                  {
                    name: "B • TikTok Native",
                    desc: "Black #161616, pink #FF0050 cyan #00F2EA, vertical video, swipe",
                    color: "#161616",
                    vibe: "Native motion",
                  },
                  {
                    name: "C • M-Pesa Utility",
                    desc: "Till green #12B44A, STK push, wallet, escrow, big tap targets",
                    color: "#12B44A",
                    vibe: "Payment first",
                  },
                  {
                    name: "Winner A+B Fusion",
                    desc: "Trust Blue headers + TikTok video cards + M-Pesa wallet. Verified green pill + No-fee blue pill + masked phone",
                    color: "#0E9F6E",
                    vibe: "Keja Halisi v3",
                  },
                ].map((c) =>
                  a(
                    "div",
                    {
                      className: "bg-white rounded-[20px] border p-4",
                      children: [
                        o("div", {
                          className:
                            "h-28 rounded-[16px] flex items-center justify-center text-white font-bold",
                          style: { background: c.color },
                          children: c.vibe,
                        }),
                        o("div", {
                          className: "mt-3 jakarta font-bold text-[14px]",
                          children: c.name,
                        }),
                        o("div", {
                          className: "text-[12px] text-black/60 mt-1 leading-5",
                          children: c.desc,
                        }),
                      ],
                    },
                    c.name,
                  ),
                ),
              }),
            ],
          }),
          a("section", {
            id: "designsystem",
            className: "scroll-mt-20 space-y-6",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children: "Design System • All States + New Components",
              }),
              a("div", {
                className: "grid md:grid-cols-3 gap-4",
                children: [
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-widest opacity-60",
                        children: "BRAND TOKENS",
                      }),
                      o("div", {
                        className: "mt-3 grid grid-cols-2 gap-2 text-[11px]",
                        children: [
                          ["Trust Blue", "#1976D2"],
                          ["Safaricom Green", "#00B140"],
                          ["M-Pesa Green", "#12B44A"],
                          ["TikTok Black", "#161616"],
                          ["Pink", "#FF0050"],
                          ["Cyan", "#00F2EA"],
                          ["Verified", "#0E9F6E"],
                          ["Pending", "#C27803"],
                          ["Scam Red", "#E02424"],
                          ["BG", "#F5F7FA"],
                        ].map(([c, S]) =>
                          a(
                            "div",
                            {
                              className: "flex items-center gap-2",
                              children: [
                                o("span", {
                                  className: "h-5 w-5 rounded-full border",
                                  style: { background: S },
                                }),
                                a("span", { children: [c, " ", S] }),
                              ],
                            },
                            c,
                          ),
                        ),
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-widest opacity-60",
                        children: "ROLE SELECTOR (4 ROLES) NEW",
                      }),
                      o("div", {
                        className: "mt-3 grid grid-cols-2 gap-2",
                        children: [
                          "Agent",
                          "Owner",
                          "Developer",
                          "Caretaker",
                        ].map((c) =>
                          a(
                            "button",
                            {
                              className: `p-3 rounded-2xl border text-left ${O === c ? "bg-[#111928] text-white border-[#111928]" : "bg-[#F5F7FA] hover:bg-white"}`,
                              children: [
                                a("div", {
                                  className:
                                    "font-semibold text-[13px] flex items-center gap-1.5",
                                  children: [
                                    c === "Caretaker"
                                      ? o(Qt, { className: "w-4 h-4" })
                                      : c === "Developer"
                                        ? o(Ft, { className: "w-4 h-4" })
                                        : c === "Owner"
                                          ? o(te, { className: "w-4 h-4" })
                                          : o(Lt, { className: "w-4 h-4" }),
                                    c,
                                  ],
                                }),
                                o("div", {
                                  className: "text-[11px] opacity-70 mt-1",
                                  children:
                                    c === "Caretaker"
                                      ? "Estate mandate required • specific estates"
                                      : "Verified poster",
                                }),
                              ],
                            },
                            c,
                          ),
                        ),
                      }),
                      o("div", {
                        className:
                          "mt-3 text-[11px] bg-[#FEF3C7] border border-[#F59E0B]/30 p-2 rounded-xl",
                        children:
                          "Caretaker needs owner mandate letter • permissions for specific estates",
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-widest opacity-60",
                        children: "TRUST FILTER PILLS • ACTUALLY FILTER",
                      }),
                      a("div", {
                        className: "mt-3 flex flex-wrap gap-2",
                        children: [
                          [
                            { k: "fresh", label: "Fresh ≤24h" },
                            { k: "available", label: "Available Only" },
                            { k: "noFee", label: "No Viewing Fee" },
                            { k: "verified", label: "Verified Only" },
                          ].map((c) =>
                            o(
                              "button",
                              {
                                onClick: () =>
                                  h((S) => ({ ...S, [c.k]: !S[c.k] })),
                                className: `px-3 py-2 rounded-full text-[12px] font-semibold border transition ${m[c.k] ? "bg-[#111928] text-white border-[#111928]" : "bg-white hover:bg-[#F5F7FA]"}`,
                                children: c.label,
                              },
                              c.k,
                            ),
                          ),
                          o("button", {
                            onClick: () =>
                              h((c) => ({
                                ...c,
                                sortResponse: !c.sortResponse,
                              })),
                            className: `px-3 py-2 rounded-full text-[12px] font-semibold border ${m.sortResponse ? "bg-[#1976D2] text-white border-[#1976D2]" : "bg-white"}`,
                            children: "Response Time ↓ fastest",
                          }),
                        ],
                      }),
                      a("div", {
                        className: "mt-3 text-[11px] text-black/60",
                        children: [
                          "Showing ",
                          Cn.length,
                          " / ",
                          dl.length,
                          " • Fresh = freshH≤24h, No Fee hides fee=true",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              a("div", {
                className: "grid md:grid-cols-3 gap-4",
                children: [
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-widest opacity-60",
                        children: "EVIDENCE CHECKLIST COMPONENT NEW",
                      }),
                      a("div", {
                        className:
                          "mt-3 rounded-2xl bg-[#ECFDF5] border border-[#0E9F6E]/20 p-3",
                        children: [
                          a("div", {
                            className:
                              "text-[12px] font-bold text-[#0E9F6E] flex items-center gap-1.5",
                            children: [
                              o(ne, { className: "w-4 h-4" }),
                              "Evidence checklist: Outside • gate • inside • water running • window view",
                            ],
                          }),
                          o("div", {
                            className:
                              "mt-2 grid grid-cols-2 gap-2 text-[11px]",
                            children: [
                              "Outside",
                              "Gate",
                              "Inside",
                              "Water running",
                              "Window view",
                            ].map((c) =>
                              a(
                                "div",
                                {
                                  className: "flex items-center gap-1.5",
                                  children: [
                                    o("span", {
                                      className:
                                        "h-4 w-4 rounded-full bg-[#0E9F6E] text-white grid place-items-center text-[10px]",
                                      children: "✓",
                                    }),
                                    c,
                                  ],
                                },
                                c,
                              ),
                            ),
                          }),
                          o("div", {
                            className: "mt-2 text-[11px]",
                            children:
                              "Required before publish • AI checks presence",
                          }),
                        ],
                      }),
                      a("div", {
                        className:
                          "mt-3 rounded-2xl bg-white border p-3 flex gap-2",
                        children: [
                          o(Fn, { className: "w-4 h-4 text-[#1976D2]" }),
                          o(Ct, { className: "w-4 h-4 text-[#1976D2]" }),
                          o(Et, { className: "w-4 h-4 text-[#1976D2]" }),
                          o(te, { className: "w-4 h-4 text-[#1976D2]" }),
                          o("span", {
                            className: "text-[11px]",
                            children: "TikTok vertical evidence • 5 clips",
                          }),
                        ],
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-widest opacity-60",
                        children: "PRIVACY NOTICE + MASKED PHONE NEW",
                      }),
                      a("div", {
                        className: "mt-3 space-y-2",
                        children: [
                          a("div", {
                            className:
                              "rounded-xl bg-[#111928] text-white p-3 text-[12px] flex items-start gap-2",
                            children: [
                              o(Ge, { className: "w-4 h-4 mt-0.5" }),
                              a("span", {
                                children: [
                                  o("b", {
                                    children:
                                      "Exact house number is intentionally not shown",
                                  }),
                                  " in public prototype. Public UI shows estate + road, not exact house number. Private vault stores exact door.",
                                ],
                              }),
                            ],
                          }),
                          a("div", {
                            className:
                              "rounded-xl bg-[#F5F7FA] border p-3 text-[12px] flex items-center gap-2",
                            children: [
                              o(re, { className: "w-4 h-4" }),
                              "Phone masked until contact • Call logs lead with masked toast • Report shows 5 reasons",
                            ],
                          }),
                        ],
                      }),
                      a("div", {
                        className: "mt-3",
                        children: [
                          o("div", {
                            className: "text-[11px] opacity-60",
                            children:
                              "OTP 6 BOXES • ID SELFIE • CARETAKER MANDATE",
                          }),
                          o("div", {
                            className: "mt-2 flex gap-1.5",
                            children: Wn.map((c, S) =>
                              o(
                                "input",
                                {
                                  value: c,
                                  onChange: (eA) => {
                                    let be = [...Wn];
                                    if (
                                      ((be[S] = eA.target.value.slice(-1)),
                                      Oc(be),
                                      eA.target.value && S < 5)
                                    )
                                      document
                                        .getElementById(`otp-${S + 1}`)
                                        ?.focus();
                                  },
                                  id: `otp-${S}`,
                                  className:
                                    "h-9 w-9 rounded-xl border text-center font-bold",
                                  placeholder: "•",
                                },
                                S,
                              ),
                            ),
                          }),
                          a("div", {
                            className: "mt-2 grid grid-cols-2 gap-2",
                            children: [
                              a("div", {
                                className:
                                  "rounded-xl border border-dashed p-3 text-[11px] flex items-center gap-2",
                                children: [
                                  o(zn, { className: "w-4 h-4" }),
                                  "ID selfie upload • Liveness",
                                ],
                              }),
                              a("div", {
                                className:
                                  "rounded-xl border border-dashed p-3 text-[11px] flex items-center gap-2",
                                children: [
                                  o(Sn, { className: "w-4 h-4" }),
                                  "Caretaker mandate upload • Owner letter",
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      o("div", {
                        className: "text-[11px] tracking-widest opacity-60",
                        children: "PUBLISHING RULES + FEE ENFORCEMENT NEW",
                      }),
                      a("div", {
                        className:
                          "mt-3 rounded-2xl bg-white border p-3 space-y-2 text-[12px]",
                        children: [
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o("span", {
                                className: "text-[#0E9F6E]",
                                children: "•",
                              }),
                              a("span", {
                                children: [
                                  o("b", {
                                    children: "No viewing fee before viewing",
                                  }),
                                  " • Pay only via M-Pesa escrow after viewing",
                                ],
                              }),
                            ],
                          }),
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o("span", {
                                className: "text-[#0E9F6E]",
                                children: "•",
                              }),
                              o("span", {
                                children:
                                  "Public UI shows estate + road, not exact house number",
                              }),
                            ],
                          }),
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o("span", {
                                className: "text-[#0E9F6E]",
                                children: "•",
                              }),
                              o("span", {
                                children:
                                  "Unverified listings stay out of green catalog • Grey out",
                              }),
                            ],
                          }),
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o("span", {
                                className: "text-[#0E9F6E]",
                                children: "•",
                              }),
                              o("span", {
                                children:
                                  "Listings re-check availability before expiry • Cron 72h",
                              }),
                            ],
                          }),
                        ],
                      }),
                      a("div", {
                        className:
                          "mt-3 rounded-xl bg-[#FEF2F2] border border-[#E02424]/20 p-3 text-[12px] text-[#E02424] flex gap-2",
                        children: [
                          o(CA, { className: "w-4 h-4" }),
                          'If fee signal exists: red warning "A viewing-fee signal exists. Treat as warning and report if agent asks you to pay before viewing."',
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              a("div", {
                className: "bg-white rounded-[20px] border p-5",
                children: [
                  o("div", {
                    className: "text-[11px] tracking-widest opacity-60",
                    children: "BOROUGH GROUPING • 6 BOROUGHS × 17 SUB-COUNTIES",
                  }),
                  o("div", {
                    className: "mt-3 grid md:grid-cols-3 gap-3",
                    children: ge.map((c) =>
                      a(
                        "div",
                        {
                          className: "rounded-2xl bg-[#F5F7FA] p-3 border",
                          children: [
                            a("div", {
                              className: "jakarta font-bold text-[13px]",
                              children: [
                                c.name,
                                " • ",
                                c.sub.length,
                                " sub-counties",
                              ],
                            }),
                            o("div", {
                              className: "mt-2 flex flex-wrap gap-1.5",
                              children: c.sub.map((S) =>
                                o(
                                  "span",
                                  {
                                    className:
                                      "px-2 py-1 rounded-full bg-white border text-[11px]",
                                    children: S,
                                  },
                                  S,
                                ),
                              ),
                            }),
                            a("div", {
                              className: "mt-2 text-[11px] text-black/60",
                              children: ["Estates: ", c.estates.join(" • ")],
                            }),
                          ],
                        },
                        c.name,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
          a("section", {
            id: "pages",
            className: "scroll-mt-20",
            children: [
              a("div", {
                className: "flex flex-wrap items-center justify-between gap-3",
                children: [
                  o("h2", {
                    className: "jakarta text-[24px] font-bold",
                    children: "7 Pages Responsive • Updated v3",
                  }),
                  a("div", {
                    className: "flex items-center gap-2",
                    children: [
                      o("div", {
                        className: "flex rounded-full bg-white border p-1",
                        children: ["desktop", "tablet", "mobile"].map((c) =>
                          o(
                            "button",
                            {
                              onClick: () => l(c),
                              className: `px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize ${r === c ? "bg-[#111928] text-white" : "hover:bg-black/5"}`,
                              children: c,
                            },
                            c,
                          ),
                        ),
                      }),
                      o("div", {
                        className: "flex rounded-full bg-white border p-1",
                        children: [1, 2, 3, 4, 5, 6, 7].map((c) =>
                          o(
                            "button",
                            {
                              onClick: () => t(c),
                              className: `h-7 w-7 grid place-items-center rounded-full text-[12px] font-bold ${n === c ? "bg-[#1976D2] text-white" : "hover:bg-black/5"}`,
                              children: c,
                            },
                            c,
                          ),
                        ),
                      }),
                    ],
                  }),
                ],
              }),
              a("div", {
                className: `mt-4 mx-auto bg-white rounded-[28px] border shadow-sm overflow-hidden transition-all ${r === "mobile" ? "max-w-[390px]" : r === "tablet" ? "max-w-[820px]" : "max-w-[1280px]"}`,
                children: [
                  a("div", {
                    className:
                      "h-11 border-b flex items-center justify-between px-4 bg-[#F5F7FA]/70",
                    children: [
                      a("div", {
                        className: "flex items-center gap-2 text-[12px]",
                        children: [
                          o("span", {
                            className: "h-2.5 w-2.5 rounded-full bg-[#E02424]",
                          }),
                          o("span", {
                            className: "h-2.5 w-2.5 rounded-full bg-[#C27803]",
                          }),
                          o("span", {
                            className: "h-2.5 w-2.5 rounded-full bg-[#0E9F6E]",
                          }),
                          a("span", {
                            className: "ml-3 font-medium",
                            children: [
                              "keja.halisi.co.ke / ",
                              [
                                "home",
                                "estate",
                                "listing",
                                "agent",
                                "post",
                                "developer",
                                "admin",
                              ][n - 1],
                            ],
                          }),
                        ],
                      }),
                      a("div", {
                        className: "text-[11px] opacity-60",
                        children: ["Page ", n, " • ", r],
                      }),
                    ],
                  }),
                  a("div", {
                    className: "p-4 md:p-5",
                    children: [
                      n === 1 &&
                        a("div", {
                          className: "space-y-4",
                          children: [
                            a("div", {
                              className: "flex flex-wrap items-center gap-2",
                              children: [
                                o("span", {
                                  className: "text-[12px] font-bold",
                                  children: "Boroughs:",
                                }),
                                ge.map((c) =>
                                  o(
                                    "button",
                                    {
                                      onClick: () =>
                                        s(f === c.name ? null : c.name),
                                      className: `px-3 py-1.5 rounded-full text-[12px] font-semibold border ${f === c.name ? "bg-[#111928] text-white border-[#111928]" : "bg-white"}`,
                                      children: c.name,
                                    },
                                    c.name,
                                  ),
                                ),
                              ],
                            }),
                            a("div", {
                              className: "flex flex-wrap items-center gap-2",
                              children: [
                                o("span", {
                                  className: "text-[12px] font-bold",
                                  children: "Sub-counties:",
                                }),
                                (f
                                  ? ge.find((c) => c.name === f).sub
                                  : [
                                      "Westlands",
                                      "Roysambu",
                                      "Embakasi South",
                                      "Langata",
                                    ]
                                ).map((c) =>
                                  o(
                                    "button",
                                    {
                                      onClick: () => q(y === c ? null : c),
                                      className: `px-2.5 py-1 rounded-full text-[11px] border ${y === c ? "bg-[#1976D2] text-white border-[#1976D2]" : "bg-white"}`,
                                      children: c,
                                    },
                                    c,
                                  ),
                                ),
                              ],
                            }),
                            a("div", {
                              className: "flex flex-wrap gap-2",
                              children: [
                                a("span", {
                                  className:
                                    "px-3 py-1.5 rounded-full bg-[#F5F7FA] border text-[11px]",
                                  children: [
                                    "Showing ",
                                    Cn.length,
                                    " homes • Nairobi coverage 6 boroughs",
                                  ],
                                }),
                                o("button", {
                                  onClick: () =>
                                    h((c) => ({ ...c, fresh: !c.fresh })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] font-semibold border ${m.fresh ? "bg-[#111928] text-white" : "bg-white"}`,
                                  children: "Fresh ≤24h",
                                }),
                                o("button", {
                                  onClick: () =>
                                    h((c) => ({ ...c, noFee: !c.noFee })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] font-semibold border ${m.noFee ? "bg-[#1976D2] text-white" : "bg-white"}`,
                                  children: "No Viewing Fee",
                                }),
                                o("button", {
                                  onClick: () =>
                                    h((c) => ({ ...c, verified: !c.verified })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] font-semibold border ${m.verified ? "bg-[#0E9F6E] text-white" : "bg-white"}`,
                                  children: "Verified Only",
                                }),
                                o("button", {
                                  onClick: () =>
                                    h((c) => ({
                                      ...c,
                                      available: !c.available,
                                    })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] font-semibold border ${m.available ? "bg-[#111928] text-white" : "bg-white"}`,
                                  children: "Available Only",
                                }),
                              ],
                            }),
                            a("div", {
                              className: "grid md:grid-cols-3 gap-3",
                              children: [
                                o("div", {
                                  className:
                                    "md:col-span-2 grid sm:grid-cols-2 gap-3",
                                  children: Cn.map((c) =>
                                    a(
                                      "div",
                                      {
                                        className:
                                          "rounded-[20px] border bg-white overflow-hidden hover:shadow-md transition group",
                                        children: [
                                          a("div", {
                                            className:
                                              "h-28 bg-gradient-to-br from-[#1976D2]/20 to-[#0E9F6E]/20 relative p-3",
                                            children: [
                                              a("div", {
                                                className:
                                                  "absolute top-2 left-2 flex gap-1.5",
                                                children: [
                                                  c.verified &&
                                                    a("span", {
                                                      className:
                                                        "px-2 py-1 rounded-full bg-[#0E9F6E] text-white text-[10px] font-bold flex items-center gap-1",
                                                      children: [
                                                        o(MA, {
                                                          className: "w-3 h-3",
                                                        }),
                                                        "Verified",
                                                      ],
                                                    }),
                                                  c.freshH <= 24 &&
                                                    a("span", {
                                                      className:
                                                        "px-2 py-1 rounded-full bg-[#111928] text-white text-[10px] font-bold",
                                                      children: [
                                                        "Fresh • ",
                                                        c.freshH,
                                                        "h ago",
                                                      ],
                                                    }),
                                                  !c.fee &&
                                                    o("span", {
                                                      className:
                                                        "px-2 py-1 rounded-full bg-[#1976D2] text-white text-[10px] font-bold",
                                                      children: "No Fee",
                                                    }),
                                                ],
                                              }),
                                              o("button", {
                                                onClick: () => Fc(c.id),
                                                className:
                                                  "absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-white/90 border",
                                                children: o(wt, {
                                                  className: `w-4 h-4 ${Io.includes(c.id) ? "fill-[#E02424] text-[#E02424]" : ""}`,
                                                }),
                                              }),
                                              a("div", {
                                                className:
                                                  "absolute bottom-2 left-2 right-2 flex justify-between items-end",
                                                children: [
                                                  a("div", {
                                                    className:
                                                      "text-[11px] bg-white/90 px-2 py-1 rounded-full border",
                                                    children: [
                                                      "Response ~",
                                                      c.responseMins,
                                                      "min • ",
                                                      c.role,
                                                    ],
                                                  }),
                                                  c.fee &&
                                                    a("span", {
                                                      className:
                                                        "px-2 py-1 rounded-full bg-[#E02424] text-white text-[10px] font-bold flex items-center gap-1",
                                                      children: [
                                                        o(CA, {
                                                          className: "w-3 h-3",
                                                        }),
                                                        "Fee signal",
                                                      ],
                                                    }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          a("div", {
                                            className: "p-3",
                                            children: [
                                              a("div", {
                                                className:
                                                  "flex justify-between gap-2",
                                                children: [
                                                  o("div", {
                                                    className:
                                                      "jakarta font-bold text-[13px] leading-tight",
                                                    children: c.title,
                                                  }),
                                                  a("div", {
                                                    className:
                                                      "text-[12px] font-bold whitespace-nowrap",
                                                    children: [
                                                      "KES ",
                                                      c.rent.toLocaleString(),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              a("div", {
                                                className:
                                                  "mt-1 flex items-center gap-1 text-[11px] text-black/60",
                                                children: [
                                                  o(Kn, {
                                                    className: "w-3 h-3",
                                                  }),
                                                  c.estate,
                                                  " • ",
                                                  c.road,
                                                  " • ",
                                                  c.subcounty,
                                                  " • ",
                                                  c.borough,
                                                ],
                                              }),
                                              a("div", {
                                                className: "mt-2 flex gap-2",
                                                children: [
                                                  o("button", {
                                                    onClick: () => {
                                                      (k(c), t(3));
                                                    },
                                                    className:
                                                      "flex-1 h-8 rounded-full bg-[#111928] text-white text-[12px] font-semibold",
                                                    children:
                                                      "View • Trust checks",
                                                  }),
                                                  o("button", {
                                                    onClick: () => {
                                                      (k(c), v(!0));
                                                    },
                                                    className:
                                                      "h-8 w-8 grid place-items-center rounded-full border",
                                                    children: o(re, {
                                                      className: "w-4 h-4",
                                                    }),
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      c.id,
                                    ),
                                  ),
                                }),
                                a("div", {
                                  className: "space-y-3",
                                  children: [
                                    a("div", {
                                      className:
                                        "rounded-[20px] border p-4 bg-[#F5F7FA]",
                                      children: [
                                        o("div", {
                                          className: "text-[12px] font-bold",
                                          children: "Market Pulse",
                                        }),
                                        o("div", {
                                          className:
                                            "mt-2 text-[11px] leading-5",
                                          children:
                                            "Verified today 127 • Scams blocked 34 • Avg response 9min • Fresh 89. Trustbar: Verified Green, No Fee Blue, Reported Red.",
                                        }),
                                      ],
                                    }),
                                    a("div", {
                                      className:
                                        "rounded-[20px] border p-4 bg-white",
                                      children: [
                                        o("div", {
                                          className: "text-[12px] font-bold",
                                          children:
                                            "Trust checks row (every listing)",
                                        }),
                                        o("div", {
                                          className:
                                            "mt-2 rounded-xl bg-[#ECFDF5] border border-[#0E9F6E]/20 p-2.5 text-[11px] text-[#0E9F6E] font-medium",
                                          children:
                                            "Trust checks: phone verified • evidence video • no viewing fee rule • listing re-check enabled",
                                        }),
                                        o("div", {
                                          className:
                                            "mt-2 rounded-xl bg-[#111928] text-white p-2.5 text-[11px]",
                                          children:
                                            "Exact house number is intentionally not shown • Public UI shows estate + road, not exact house number",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      n === 2 &&
                        a("div", {
                          className: "space-y-4",
                          children: [
                            a("div", {
                              className: "flex items-center gap-1 text-[12px]",
                              children: [
                                o("span", { children: "Nairobi" }),
                                o(He, { className: "w-4 h-4 opacity-40" }),
                                o("span", { children: f || "Western" }),
                                o(He, { className: "w-4 h-4 opacity-40" }),
                                o("span", { children: y || "Westlands" }),
                                o(He, { className: "w-4 h-4 opacity-40" }),
                                o("span", {
                                  className: "font-bold",
                                  children: "Kileleshwa",
                                }),
                              ],
                            }),
                            a("div", {
                              className: "flex flex-wrap gap-2",
                              children: [
                                o("span", {
                                  className:
                                    "px-3 py-1.5 rounded-full bg-[#F5F7FA] border text-[11px]",
                                  children:
                                    "Estate page • Fresh filter • Fee warning • Response sort",
                                }),
                                a("button", {
                                  onClick: () =>
                                    h((c) => ({ ...c, fresh: !c.fresh })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] border ${m.fresh ? "bg-[#111928] text-white" : "bg-white"}`,
                                  children: [
                                    "Fresh ≤24h (",
                                    dl.filter((c) => c.freshH <= 24).length,
                                    ")",
                                  ],
                                }),
                                o("button", {
                                  onClick: () =>
                                    h((c) => ({ ...c, noFee: !c.noFee })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] border ${m.noFee ? "bg-[#1976D2] text-white" : "bg-white"}`,
                                  children: "Hide fee signal",
                                }),
                                o("button", {
                                  onClick: () =>
                                    h((c) => ({
                                      ...c,
                                      sortResponse: !c.sortResponse,
                                    })),
                                  className: `px-3 py-1.5 rounded-full text-[11px] border ${m.sortResponse ? "bg-[#1976D2] text-white" : "bg-white"}`,
                                  children: "Sort: Response Time fastest",
                                }),
                              ],
                            }),
                            o("div", {
                              className: "grid md:grid-cols-3 gap-3",
                              children: Cn.slice(0, 6).map((c) =>
                                a(
                                  "div",
                                  {
                                    className:
                                      "rounded-[18px] border p-3 bg-white",
                                    children: [
                                      a("div", {
                                        className: "flex justify-between",
                                        children: [
                                          o("span", {
                                            className: "text-[12px] font-bold",
                                            children: c.estate,
                                          }),
                                          a("span", {
                                            className: "text-[11px]",
                                            children: [
                                              c.freshH,
                                              "h ago • ~",
                                              c.responseMins,
                                              "min",
                                            ],
                                          }),
                                        ],
                                      }),
                                      a("div", {
                                        className:
                                          "mt-1 text-[11px] opacity-70",
                                        children: [
                                          c.road,
                                          " • ",
                                          c.beds === 0
                                            ? "Bedsitter"
                                            : `${c.beds}BR`,
                                          " • KES ",
                                          c.rent.toLocaleString(),
                                        ],
                                      }),
                                      a("div", {
                                        className: "mt-2 flex gap-1.5",
                                        children: [
                                          c.verified
                                            ? o("span", {
                                                className:
                                                  "px-2 py-1 rounded-full bg-[#0E9F6E] text-white text-[10px]",
                                                children: "Verified",
                                              })
                                            : o("span", {
                                                className:
                                                  "px-2 py-1 rounded-full bg-[#C27803] text-white text-[10px]",
                                                children: "Pending",
                                              }),
                                          c.fee
                                            ? o("span", {
                                                className:
                                                  "px-2 py-1 rounded-full bg-[#E02424] text-white text-[10px]",
                                                children: "Fee warning",
                                              })
                                            : o("span", {
                                                className:
                                                  "px-2 py-1 rounded-full bg-[#1976D2] text-white text-[10px]",
                                                children: "No Fee",
                                              }),
                                        ],
                                      }),
                                    ],
                                  },
                                  c.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      n === 3 &&
                        a("div", {
                          className: "grid md:grid-cols-[1.4fr_0.8fr] gap-4",
                          children: [
                            a("div", {
                              className: "space-y-3",
                              children: [
                                a("div", {
                                  className:
                                    "rounded-[20px] bg-[#111928] text-white p-4 flex items-center justify-between",
                                  children: [
                                    a("div", {
                                      children: [
                                        o("div", {
                                          className:
                                            "jakarta font-bold text-[18px]",
                                          children: U.title,
                                        }),
                                        a("div", {
                                          className:
                                            "text-[12px] opacity-80 flex items-center gap-1 mt-1",
                                          children: [
                                            o(Kn, { className: "w-4 h-4" }),
                                            U.estate,
                                            " • ",
                                            U.road,
                                            " • ",
                                            U.subcounty,
                                            " • Nairobi > ",
                                            U.borough,
                                          ],
                                        }),
                                      ],
                                    }),
                                    a("div", {
                                      className: "text-right",
                                      children: [
                                        a("div", {
                                          className: "text-[22px] font-bold",
                                          children: [
                                            "KES ",
                                            U.rent.toLocaleString(),
                                          ],
                                        }),
                                        a("div", {
                                          className: "text-[11px] opacity-70",
                                          children: [
                                            "Posted ",
                                            U.freshH,
                                            "h ago • Response ~",
                                            U.responseMins,
                                            "min",
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className:
                                    "rounded-[16px] bg-[#ECFDF5] border border-[#0E9F6E]/30 p-3 text-[12px] text-[#0E9F6E] font-semibold flex items-start gap-2",
                                  children: [
                                    o(De, { className: "w-5 h-5 shrink-0" }),
                                    "Trust checks: phone verified • evidence video • no viewing fee rule • listing re-check enabled • Verified ",
                                    U.verified
                                      ? "Green catalog"
                                      : "Pending review",
                                  ],
                                }),
                                a("div", {
                                  className:
                                    "rounded-[16px] bg-[#F5F7FA] border p-3 text-[12px] flex gap-2",
                                  children: [
                                    o(Ge, { className: "w-4 h-4" }),
                                    " ",
                                    a("span", {
                                      children: [
                                        o("b", {
                                          children:
                                            "Exact house number is intentionally not shown",
                                        }),
                                        " in public prototype. Public UI shows estate + road, not exact house number. Private vault holds door number.",
                                      ],
                                    }),
                                  ],
                                }),
                                U.fee &&
                                  a("div", {
                                    className:
                                      "rounded-[16px] bg-[#FEF2F2] border border-[#E02424]/30 p-3 text-[12px] text-[#E02424] flex gap-2",
                                    children: [
                                      o(CA, { className: "w-5 h-5" }),
                                      "A viewing-fee signal exists. Treat as warning and report if agent asks you to pay before viewing. Filter No Fee to hide.",
                                    ],
                                  }),
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-white p-4",
                                  children: [
                                    o("div", {
                                      className: "text-[12px] font-bold",
                                      children:
                                        "Evidence checklist • 5 required before publish",
                                    }),
                                    o("div", {
                                      className:
                                        "mt-2 grid grid-cols-3 gap-2 text-[11px]",
                                      children: [
                                        "Outside",
                                        "Gate",
                                        "Inside",
                                        "Water running",
                                        "Window view",
                                      ].map((c) =>
                                        a(
                                          "div",
                                          {
                                            className: `rounded-xl border p-2 flex items-center gap-1.5 ${U.evidence.includes(c.toLowerCase().split(" ")[0]) ? "bg-[#ECFDF5] border-[#0E9F6E]/30" : "bg-[#FEF2F2] border-[#E02424]/20"}`,
                                            children: [
                                              U.evidence.includes(
                                                c.toLowerCase().split(" ")[0],
                                              )
                                                ? o(ee, {
                                                    className:
                                                      "w-3 h-3 text-[#0E9F6E]",
                                                  })
                                                : o(Ye, {
                                                    className:
                                                      "w-3 h-3 text-[#E02424]",
                                                  }),
                                              c,
                                            ],
                                          },
                                          c,
                                        ),
                                      ),
                                    }),
                                    a("div", {
                                      className: "mt-3 flex gap-2 text-[11px]",
                                      children: [
                                        a("span", {
                                          className:
                                            "px-2 py-1 rounded-full bg-[#161616] text-white flex items-center gap-1",
                                          children: [
                                            o(Jt, { className: "w-3 h-3" }),
                                            "TikTok link: ",
                                            U.tiktok || "@keja.demo",
                                          ],
                                        }),
                                        a("span", {
                                          className:
                                            "px-2 py-1 rounded-full border",
                                          children: [
                                            "Poster: ",
                                            U.role,
                                            " • ID verified",
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className: "flex gap-2",
                                  children: [
                                    a("button", {
                                      onClick: () => v(!0),
                                      className:
                                        "flex-1 h-11 rounded-full bg-[#111928] text-white font-semibold text-[13px] flex items-center justify-center gap-2",
                                      children: [
                                        o(re, { className: "w-4 h-4" }),
                                        "Call • Phone masked until contact",
                                      ],
                                    }),
                                    a("button", {
                                      onClick: () => d(!0),
                                      className:
                                        "h-11 px-5 rounded-full bg-white border font-semibold text-[13px] flex items-center gap-2",
                                      children: [
                                        o(Be, { className: "w-4 h-4" }),
                                        "Report",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            a("div", {
                              className: "space-y-3",
                              children: [
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-white p-4",
                                  children: [
                                    o("div", {
                                      className: "text-[12px] font-bold",
                                      children: "Listing meta NEW",
                                    }),
                                    a("div", {
                                      className: "mt-2 space-y-2 text-[12px]",
                                      children: [
                                        a("div", {
                                          className: "flex justify-between",
                                          children: [
                                            o("span", {
                                              className: "opacity-60",
                                              children: "freshH",
                                            }),
                                            a("span", {
                                              className: "font-semibold",
                                              children: [
                                                U.freshH,
                                                "h ago • ",
                                                U.freshH <= 24
                                                  ? "Fresh"
                                                  : "Stale",
                                              ],
                                            }),
                                          ],
                                        }),
                                        a("div", {
                                          className: "flex justify-between",
                                          children: [
                                            o("span", {
                                              className: "opacity-60",
                                              children: "response time",
                                            }),
                                            a("span", {
                                              className: "font-semibold",
                                              children: [
                                                "~",
                                                U.responseMins,
                                                " mins • ",
                                                U.responseMins <= 10
                                                  ? "Fast"
                                                  : "Slow",
                                              ],
                                            }),
                                          ],
                                        }),
                                        a("div", {
                                          className: "flex justify-between",
                                          children: [
                                            o("span", {
                                              className: "opacity-60",
                                              children: "fee boolean",
                                            }),
                                            o("span", {
                                              className: `px-2 py-1 rounded-full text-[11px] ${U.fee ? "bg-[#E02424] text-white" : "bg-[#1976D2] text-white"}`,
                                              children: U.fee
                                                ? "Fee signal true"
                                                : "No fee true",
                                            }),
                                          ],
                                        }),
                                        a("div", {
                                          className: "flex justify-between",
                                          children: [
                                            o("span", {
                                              className: "opacity-60",
                                              children: "verified",
                                            }),
                                            o("span", {
                                              className: `px-2 py-1 rounded-full text-[11px] ${U.verified ? "bg-[#0E9F6E] text-white" : "bg-[#C27803] text-white"}`,
                                              children: U.verified
                                                ? "Verified"
                                                : "Pending",
                                            }),
                                          ],
                                        }),
                                        a("div", {
                                          className: "flex justify-between",
                                          children: [
                                            o("span", {
                                              className: "opacity-60",
                                              children: "available",
                                            }),
                                            o("span", {
                                              className: "font-semibold",
                                              children: U.available
                                                ? "Available Only ✅"
                                                : "Let",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-[#F5F7FA] p-4",
                                  children: [
                                    o("div", {
                                      className: "text-[12px] font-bold",
                                      children: "Privacy & trustbar pills",
                                    }),
                                    a("div", {
                                      className: "mt-2 flex flex-wrap gap-1.5",
                                      children: [
                                        o("span", {
                                          className:
                                            "px-2.5 py-1 rounded-full bg-[#0E9F6E] text-white text-[11px]",
                                          children: "Verified Green",
                                        }),
                                        o("span", {
                                          className:
                                            "px-2.5 py-1 rounded-full bg-[#1976D2] text-white text-[11px]",
                                          children: "No Viewing Fee Blue",
                                        }),
                                        o("span", {
                                          className:
                                            "px-2.5 py-1 rounded-full bg-[#E02424] text-white text-[11px]",
                                          children: "Reported Red",
                                        }),
                                      ],
                                    }),
                                    o("div", {
                                      className: "mt-2 text-[11px] leading-5",
                                      children:
                                        "Call button logs lead with masked phone • OTP 6 boxes • ID selfie • Exact number hidden.",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      n === 4 &&
                        a("div", {
                          className: "grid md:grid-cols-[0.9fr_1.1fr] gap-4",
                          children: [
                            a("div", {
                              className: "rounded-[20px] border bg-white p-4",
                              children: [
                                a("div", {
                                  className: "flex items-center gap-3",
                                  children: [
                                    o("div", {
                                      className:
                                        "h-14 w-14 rounded-2xl bg-[#111928] text-white grid place-items-center font-bold",
                                      children: "JM",
                                    }),
                                    a("div", {
                                      children: [
                                        o("div", {
                                          className: "jakarta font-bold",
                                          children: "James Mwangi • Caretaker",
                                        }),
                                        o("div", {
                                          className: "text-[11px] opacity-70",
                                          children:
                                            "Kileleshwa • Westlands • Response ~6min • 4.8 ★ (127 verified)",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                o("div", {
                                  className: "mt-3 flex flex-wrap gap-1.5",
                                  children: [
                                    "Agent",
                                    "Owner",
                                    "Developer",
                                    "Caretaker",
                                  ].map((c) =>
                                    a(
                                      "span",
                                      {
                                        className: `px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c === "Caretaker" ? "bg-[#111928] text-white border-[#111928]" : "bg-[#F5F7FA]"}`,
                                        children: [
                                          c,
                                          c === "Caretaker"
                                            ? " • Mandate verified"
                                            : "",
                                        ],
                                      },
                                      c,
                                    ),
                                  ),
                                }),
                                a("div", {
                                  className:
                                    "mt-3 rounded-xl bg-[#ECFDF5] border border-[#0E9F6E]/20 p-2.5 text-[11px]",
                                  children: [
                                    a("div", {
                                      className:
                                        "font-bold text-[#0E9F6E] flex items-center gap-1",
                                      children: [
                                        o(MA, { className: "w-4 h-4" }),
                                        "Caretaker badge • Mandate letter verified",
                                      ],
                                    }),
                                    o("div", {
                                      className: "mt-1",
                                      children:
                                        "Owner: Alice K. • Estate: Kileleshwa Green • Permitted roads: Othaya, Nyangumi • Expiry 2026-03-01 • Private vault ID",
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className: "mt-3",
                                  children: [
                                    o("div", {
                                      className: "text-[11px] font-bold",
                                      children: "Verification timeline",
                                    }),
                                    o("div", {
                                      className: "mt-2 space-y-2",
                                      children: [
                                        [
                                          "Phone verified",
                                          "✓ OTP 6 boxes",
                                          "green",
                                        ],
                                        [
                                          "ID selfie + liveness",
                                          "✓ selfie upload",
                                          "green",
                                        ],
                                        [
                                          "Mandate letter",
                                          "✓ caretaker mandate",
                                          "green",
                                        ],
                                        [
                                          "Evidence video",
                                          "✓ 5 clips",
                                          "green",
                                        ],
                                      ].map(([c, S, eA]) =>
                                        a(
                                          "div",
                                          {
                                            className:
                                              "flex items-center justify-between text-[11px]",
                                            children: [
                                              o("span", { children: c }),
                                              o("span", {
                                                className: `px-2 py-1 rounded-full ${eA === "green" ? "bg-[#0E9F6E] text-white" : "bg-[#C27803] text-white"}`,
                                                children: S,
                                              }),
                                            ],
                                          },
                                          c,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            a("div", {
                              className:
                                "rounded-[20px] border bg-[#F5F7FA] p-4",
                              children: [
                                o("div", {
                                  className: "text-[12px] font-bold",
                                  children: "Agent profile • 4 roles logic",
                                }),
                                a("div", {
                                  className:
                                    "mt-2 grid grid-cols-2 gap-2 text-[11px]",
                                  children: [
                                    a("div", {
                                      className:
                                        "rounded-xl bg-white border p-3",
                                      children: [
                                        o("b", { children: "Agent:" }),
                                        " Lists many estates • Commission • Response fastest ranking",
                                      ],
                                    }),
                                    a("div", {
                                      className:
                                        "rounded-xl bg-white border p-3",
                                      children: [
                                        o("b", { children: "Owner:" }),
                                        " Owns unit • Direct • No viewing fee • Evidence required",
                                      ],
                                    }),
                                    a("div", {
                                      className:
                                        "rounded-xl bg-white border p-3",
                                      children: [
                                        o("b", { children: "Developer:" }),
                                        " Multiple units • Wallet Till • Expiry cron • Borough grouping",
                                      ],
                                    }),
                                    a("div", {
                                      className:
                                        "rounded-xl bg-white border p-3 bg-[#111928] text-white",
                                      children: [
                                        o("b", {
                                          children: "Caretaker (new):",
                                        }),
                                        " Specific estates • Needs owner mandate letter • Permissions table • Cannot list outside mandate",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      n === 5 &&
                        a("div", {
                          className: "space-y-4",
                          children: [
                            o("div", {
                              className: "flex items-center gap-2",
                              children: [1, 2, 3, 4].map((c) =>
                                a(
                                  "div",
                                  {
                                    className: "flex items-center gap-2",
                                    children: [
                                      o("div", {
                                        className: `h-7 w-7 rounded-full grid place-items-center text-[12px] font-bold ${X >= c ? "bg-[#111928] text-white" : "bg-[#F5F7FA] border"}`,
                                        children: c,
                                      }),
                                      o("span", {
                                        className:
                                          "text-[11px] font-semibold hidden md:inline",
                                        children: [
                                          "Role",
                                          "Estate & Rent",
                                          "Verify & Evidence",
                                          "Review & Publish",
                                        ][c - 1],
                                      }),
                                      c < 4 &&
                                        o("div", {
                                          className:
                                            "w-6 h-0.5 bg-black/10 hidden md:block",
                                        }),
                                    ],
                                  },
                                  c,
                                ),
                              ),
                            }),
                            X === 1 &&
                              a("div", {
                                className: "grid md:grid-cols-2 gap-4",
                                children: [
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-white p-4",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children:
                                          "Step 1 • Role selection • 4 roles NEW",
                                      }),
                                      o("div", {
                                        className:
                                          "mt-3 grid grid-cols-2 gap-2",
                                        children: [
                                          "Agent",
                                          "Owner",
                                          "Developer",
                                          "Caretaker",
                                        ].map((c) =>
                                          a(
                                            "button",
                                            {
                                              onClick: () => EA(c),
                                              className: `p-3 rounded-2xl border text-left ${O === c ? "bg-[#111928] text-white" : "bg-[#F5F7FA] hover:bg-white"}`,
                                              children: [
                                                o("div", {
                                                  className:
                                                    "font-bold text-[13px]",
                                                  children: c,
                                                }),
                                                o("div", {
                                                  className:
                                                    "text-[11px] mt-1 opacity-70",
                                                  children:
                                                    c === "Caretaker"
                                                      ? "Needs mandate letter • specific estates"
                                                      : c === "Developer"
                                                        ? "Till + units + expiry"
                                                        : "Phone + ID verified",
                                                }),
                                              ],
                                            },
                                            c,
                                          ),
                                        ),
                                      }),
                                    ],
                                  }),
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-[#F5F7FA] p-4",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children: "Permissions preview",
                                      }),
                                      o("div", {
                                        className: "mt-2 text-[11px] leading-5",
                                        children:
                                          O === "Caretaker"
                                            ? "Caretaker can only post for estates in mandate • Owner mandate letter required • Permissions table in developer dashboard • Private vault stores letter."
                                            : `${O} can post Nairobi wide • Trust checks required • No viewing fee enforcement • Evidence checklist required.`,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            X === 2 &&
                              a("div", {
                                className: "grid md:grid-cols-2 gap-4",
                                children: [
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-white p-4 space-y-3",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children:
                                          "Step 2 • Estate / Room / Rent / Road / TikTok link",
                                      }),
                                      a("div", {
                                        className: "grid grid-cols-2 gap-2",
                                        children: [
                                          a("select", {
                                            className:
                                              "h-10 rounded-xl border px-3 text-[12px]",
                                            children: [
                                              o("option", {
                                                children: "Borough: Western",
                                              }),
                                              ge.map((c) =>
                                                o(
                                                  "option",
                                                  { children: c.name },
                                                  c.name,
                                                ),
                                              ),
                                            ],
                                          }),
                                          a("select", {
                                            className:
                                              "h-10 rounded-xl border px-3 text-[12px]",
                                            children: [
                                              o("option", {
                                                children:
                                                  "Sub-county: Westlands (17 total)",
                                              }),
                                              ge
                                                .flatMap((c) => c.sub)
                                                .map((c) =>
                                                  o(
                                                    "option",
                                                    { children: c },
                                                    c,
                                                  ),
                                                ),
                                            ],
                                          }),
                                          a("select", {
                                            className:
                                              "h-10 rounded-xl border px-3 text-[12px]",
                                            children: [
                                              o("option", {
                                                children: "Estate: Kileleshwa",
                                              }),
                                              ge
                                                .flatMap((c) => c.estates)
                                                .map((c) =>
                                                  o(
                                                    "option",
                                                    { children: c },
                                                    c,
                                                  ),
                                                ),
                                            ],
                                          }),
                                          o("input", {
                                            className:
                                              "h-10 rounded-xl border px-3 text-[12px]",
                                            placeholder:
                                              "Road: Othaya Rd (exact number hidden)",
                                          }),
                                          o("input", {
                                            className:
                                              "h-10 rounded-xl border px-3 text-[12px]",
                                            placeholder:
                                              "Rent KES 8k-45k e.g. 35000",
                                          }),
                                          o("input", {
                                            className:
                                              "h-10 rounded-xl border px-3 text-[12px]",
                                            placeholder: "TikTok link @keja...",
                                          }),
                                        ],
                                      }),
                                      o("div", {
                                        className:
                                          "rounded-xl bg-[#111928] text-white p-2.5 text-[11px]",
                                        children:
                                          "Public UI shows estate + road, not exact house number • Private vault stores door number • Phone masked until contact",
                                      }),
                                    ],
                                  }),
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-[#F5F7FA] p-4",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children: "Listing meta NEW fields",
                                      }),
                                      a("div", {
                                        className:
                                          "mt-2 grid grid-cols-2 gap-2 text-[11px]",
                                        children: [
                                          o("div", {
                                            className:
                                              "rounded-xl bg-white border p-3",
                                            children:
                                              "freshH: hours ago auto • 2h, 5h",
                                          }),
                                          o("div", {
                                            className:
                                              "rounded-xl bg-white border p-3",
                                            children:
                                              "response_time mins • fastest sort",
                                          }),
                                          o("div", {
                                            className:
                                              "rounded-xl bg-white border p-3",
                                            children:
                                              "fee boolean • triggers red warning",
                                          }),
                                          o("div", {
                                            className:
                                              "rounded-xl bg-white border p-3",
                                            children:
                                              "verified boolean • green catalog gate",
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            X === 3 &&
                              a("div", {
                                className: "grid md:grid-cols-2 gap-4",
                                children: [
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-white p-4 space-y-3",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children:
                                          "Step 3 • Ownership / Authority + Verification + Evidence",
                                      }),
                                      a("div", {
                                        className: "flex gap-2",
                                        children: [
                                          a("div", {
                                            className:
                                              "flex-1 rounded-xl border border-dashed p-3 text-[11px] flex items-center gap-2",
                                            children: [
                                              o(zn, { className: "w-4 h-4" }),
                                              "ID selfie upload • OTP 6 boxes: ",
                                              Wn.join("") || "____",
                                            ],
                                          }),
                                          a("div", {
                                            className:
                                              "flex-1 rounded-xl border border-dashed p-3 text-[11px] flex items-center gap-2",
                                            children: [
                                              o(Fn, { className: "w-4 h-4" }),
                                              "Evidence video • TikTok vertical",
                                            ],
                                          }),
                                        ],
                                      }),
                                      a("div", {
                                        className:
                                          "rounded-2xl bg-[#ECFDF5] border border-[#0E9F6E]/20 p-3",
                                        children: [
                                          o("div", {
                                            className:
                                              "text-[12px] font-bold text-[#0E9F6E]",
                                            children:
                                              "Evidence checklist: Outside • gate • inside • water running • window view",
                                          }),
                                          o("div", {
                                            className:
                                              "mt-2 grid grid-cols-2 gap-2 text-[11px]",
                                            children: [
                                              "Outside",
                                              "Gate",
                                              "Inside",
                                              "Water running",
                                              "Window view",
                                            ].map((c) =>
                                              a(
                                                "label",
                                                {
                                                  className:
                                                    "flex items-center gap-2 rounded-xl bg-white border p-2",
                                                  children: [
                                                    o("input", {
                                                      type: "checkbox",
                                                      defaultChecked: !0,
                                                    }),
                                                    o("span", { children: c }),
                                                  ],
                                                },
                                                c,
                                              ),
                                            ),
                                          }),
                                          o("div", {
                                            className:
                                              "mt-2 text-[11px] opacity-70",
                                            children:
                                              "Required before publish • AI checks presence • Green notice in Step 3",
                                          }),
                                        ],
                                      }),
                                      O === "Caretaker" &&
                                        a("div", {
                                          className:
                                            "rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/30 p-3 text-[11px] flex gap-2",
                                          children: [
                                            o(Sn, { className: "w-4 h-4" }),
                                            "Caretaker mandate upload • Owner mandate letter • Permissions for specific estates • Owner phone verification",
                                          ],
                                        }),
                                    ],
                                  }),
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-[#F5F7FA] p-4",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children:
                                          "Trust checks row + fee enforcement",
                                      }),
                                      o("div", {
                                        className:
                                          "mt-2 rounded-xl bg-[#ECFDF5] border p-2.5 text-[11px] text-[#0E9F6E]",
                                        children:
                                          "Trust checks: phone verified • evidence video • no viewing fee rule • listing re-check enabled",
                                      }),
                                      o("div", {
                                        className:
                                          "mt-2 rounded-xl bg-[#FEF2F2] border p-2.5 text-[11px] text-[#E02424]",
                                        children:
                                          "A viewing-fee signal exists. Treat as warning and report if agent asks you to pay before viewing.",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            X === 4 &&
                              a("div", {
                                className: "grid md:grid-cols-2 gap-4",
                                children: [
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-white p-4",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children:
                                          "Step 4 • Review with Publishing rules panel + Submit",
                                      }),
                                      a("div", {
                                        className:
                                          "mt-3 rounded-2xl bg-white border p-3 text-[12px] space-y-1.5",
                                        children: [
                                          o("div", {
                                            children:
                                              "• No viewing fee before viewing • Escrow refundable commitment",
                                          }),
                                          o("div", {
                                            children:
                                              "• Public UI shows estate + road, not exact house number",
                                          }),
                                          o("div", {
                                            children:
                                              "• Unverified listings stay out of green catalog",
                                          }),
                                          o("div", {
                                            children:
                                              "• Listings re-check availability before expiry • 72h cron",
                                          }),
                                          o("div", {
                                            children:
                                              "• Exact house number intentionally NOT shown",
                                          }),
                                          o("div", {
                                            children:
                                              "• Phone masked until contact • Lead logged • OTP",
                                          }),
                                        ],
                                      }),
                                      o("button", {
                                        onClick: () => {
                                          (xe(
                                            "Listing submitted • Pending verification • Evidence checklist OK",
                                            "success",
                                          ),
                                            M(1));
                                        },
                                        className:
                                          "mt-3 w-full h-11 rounded-full bg-[#0E9F6E] text-white font-semibold text-[13px]",
                                        children:
                                          "Submit • Publish rules enforced",
                                      }),
                                    ],
                                  }),
                                  a("div", {
                                    className:
                                      "rounded-[20px] border bg-[#111928] text-white p-4",
                                    children: [
                                      o("div", {
                                        className: "text-[12px] font-bold",
                                        children: "Final validation",
                                      }),
                                      a("div", {
                                        className:
                                          "mt-2 text-[11px] leading-5 opacity-80",
                                        children: [
                                          "Role ",
                                          O,
                                          " • Borough Western • Sub Westlands • Estate Kileleshwa • Road Othaya Rd (number hidden) • Rent 35k • TikTok link • Evidence 5/5 • No fee • Verified pending • freshH auto • response mins auto.",
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            a("div", {
                              className: "flex gap-2",
                              children: [
                                o("button", {
                                  disabled: X === 1,
                                  onClick: () => M((c) => Math.max(1, c - 1)),
                                  className:
                                    "px-4 py-2 rounded-full border text-[12px] disabled:opacity-40",
                                  children: "Back",
                                }),
                                a("button", {
                                  disabled: X === 4,
                                  onClick: () => M((c) => Math.min(4, c + 1)),
                                  className:
                                    "px-4 py-2 rounded-full bg-[#111928] text-white text-[12px]",
                                  children: ["Next • ", X, "/4"],
                                }),
                              ],
                            }),
                          ],
                        }),
                      n === 6 &&
                        a("div", {
                          className: "grid md:grid-cols-3 gap-4",
                          children: [
                            a("div", {
                              className: "md:col-span-2 space-y-3",
                              children: [
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-white p-4",
                                  children: [
                                    a("div", {
                                      className:
                                        "text-[12px] font-bold flex items-center gap-2",
                                      children: [
                                        o(Zt, { className: "w-4 h-4" }),
                                        "Developer Dashboard • Caretaker permissions table NEW",
                                      ],
                                    }),
                                    o("div", {
                                      className: "mt-3 overflow-auto",
                                      children: a("table", {
                                        className: "w-full text-[11px]",
                                        children: [
                                          o("thead", {
                                            className: "text-black/50",
                                            children: a("tr", {
                                              children: [
                                                o("th", {
                                                  className: "text-left p-2",
                                                  children: "Caretaker",
                                                }),
                                                o("th", {
                                                  className: "text-left p-2",
                                                  children: "Estates permitted",
                                                }),
                                                o("th", {
                                                  className: "text-left p-2",
                                                  children: "Mandate",
                                                }),
                                                o("th", {
                                                  className: "text-left p-2",
                                                  children: "Expiry",
                                                }),
                                              ],
                                            }),
                                          }),
                                          a("tbody", {
                                            children: [
                                              a("tr", {
                                                className: "border-t",
                                                children: [
                                                  o("td", {
                                                    className:
                                                      "p-2 font-semibold",
                                                    children: "James Mwangi",
                                                  }),
                                                  o("td", {
                                                    className: "p-2",
                                                    children:
                                                      "Kileleshwa, Lavington",
                                                  }),
                                                  o("td", {
                                                    className: "p-2",
                                                    children: o("span", {
                                                      className:
                                                        "px-2 py-1 rounded-full bg-[#0E9F6E] text-white",
                                                      children: "Verified",
                                                    }),
                                                  }),
                                                  o("td", {
                                                    className: "p-2",
                                                    children: "2026-03-01",
                                                  }),
                                                ],
                                              }),
                                              a("tr", {
                                                className: "border-t",
                                                children: [
                                                  o("td", {
                                                    className:
                                                      "p-2 font-semibold",
                                                    children: "Faith A.",
                                                  }),
                                                  o("td", {
                                                    className: "p-2",
                                                    children: "Syokimau only",
                                                  }),
                                                  o("td", {
                                                    className: "p-2",
                                                    children: o("span", {
                                                      className:
                                                        "px-2 py-1 rounded-full bg-[#C27803] text-white",
                                                      children: "Pending",
                                                    }),
                                                  }),
                                                  o("td", {
                                                    className: "p-2",
                                                    children: "2025-12-12",
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-white p-4",
                                  children: [
                                    o("div", {
                                      className: "text-[12px] font-bold",
                                      children:
                                        "Units with expiry countdown + Leads masked phone",
                                    }),
                                    o("div", {
                                      className:
                                        "mt-3 grid grid-cols-3 gap-2 text-[11px]",
                                      children: Cn.slice(0, 3).map((c) =>
                                        a(
                                          "div",
                                          {
                                            className:
                                              "rounded-xl bg-[#F5F7FA] border p-3",
                                            children: [
                                              a("div", {
                                                className: "font-bold",
                                                children: [
                                                  c.estate,
                                                  " • KES ",
                                                  c.rent.toLocaleString(),
                                                ],
                                              }),
                                              a("div", {
                                                className: "mt-1 opacity-70",
                                                children: [
                                                  "Expiry in ",
                                                  Math.floor(
                                                    Math.random() * 60,
                                                  ) + 12,
                                                  "h • Re-check enabled",
                                                ],
                                              }),
                                              a("div", {
                                                className:
                                                  "mt-2 flex items-center gap-1",
                                                children: [
                                                  o(re, {
                                                    className: "w-3 h-3",
                                                  }),
                                                  " ",
                                                  a("span", {
                                                    children: [
                                                      "07** *** ",
                                                      Math.floor(
                                                        Math.random() * 900,
                                                      ) + 100,
                                                    ],
                                                  }),
                                                  o("span", {
                                                    className:
                                                      "ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#111928] text-white",
                                                    children: "masked",
                                                  }),
                                                ],
                                              }),
                                            ],
                                          },
                                          c.id,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            a("div", {
                              className: "space-y-3",
                              children: [
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-[#111928] text-white p-4",
                                  children: [
                                    a("div", {
                                      className:
                                        "text-[12px] font-bold flex items-center gap-2",
                                      children: [
                                        o(Wt, { className: "w-4 h-4" }),
                                        "Wallet Till • Subscription",
                                      ],
                                    }),
                                    o("div", {
                                      className:
                                        "mt-3 text-[11px] leading-5 opacity-80",
                                      children:
                                        "Till 412 412 • Paybill • Escrow viewing commitment refundable • M-Pesa STK Push simulation no real payment • KES 999/month Developer",
                                    }),
                                    o("button", {
                                      onClick: () => R(!0),
                                      className:
                                        "mt-3 w-full h-9 rounded-full bg-[#12B44A] text-white text-[12px] font-semibold",
                                      children: "Simulate STK Push",
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className:
                                    "rounded-[20px] border bg-white p-4 text-[11px]",
                                  children: [
                                    o("div", {
                                      className: "font-bold text-[12px]",
                                      children: "Supabase new fields",
                                    }),
                                    a("div", {
                                      className:
                                        "mt-2 font-mono text-[10px] leading-4 bg-[#F5F7FA] p-2 rounded-xl",
                                      children: [
                                        "publish_state: approved|rejected",
                                        o("br", {}),
                                        "verification_level: phone|id|mandate",
                                        o("br", {}),
                                        "poster_id + role enum Caretaker",
                                        o("br", {}),
                                        "fee boolean • freshH int • response_time int",
                                        o("br", {}),
                                        "audit_events table • expiry cron",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      n === 7 &&
                        a("div", {
                          className: "grid md:grid-cols-[1.2fr_0.8fr] gap-4",
                          children: [
                            a("div", {
                              className: "rounded-[20px] border bg-white p-4",
                              children: [
                                o("div", {
                                  className: "text-[12px] font-bold",
                                  children:
                                    "Admin Dashboard • publish_state, audit_events, AI flags, expiry cron, private vault",
                                }),
                                a("div", {
                                  className:
                                    "mt-3 grid grid-cols-3 gap-2 text-[11px]",
                                  children: [
                                    a("div", {
                                      className:
                                        "rounded-xl bg-[#F5F7FA] border p-3",
                                      children: [
                                        o("div", {
                                          className: "opacity-60",
                                          children: "publish_state",
                                        }),
                                        o("div", {
                                          className: "mt-1 font-bold",
                                          children:
                                            "approved / rejected / pending",
                                        }),
                                        o("div", {
                                          className: "mt-1",
                                          children: o("span", {
                                            className:
                                              "px-2 py-1 rounded-full bg-[#0E9F6E] text-white",
                                            children: "approved 87%",
                                          }),
                                        }),
                                      ],
                                    }),
                                    a("div", {
                                      className:
                                        "rounded-xl bg-[#F5F7FA] border p-3",
                                      children: [
                                        o("div", {
                                          className: "opacity-60",
                                          children: "AI flags",
                                        }),
                                        o("div", {
                                          className: "mt-1",
                                          children:
                                            "repost • price anomaly • fee signal",
                                        }),
                                        a("div", {
                                          className: "mt-1 flex gap-1",
                                          children: [
                                            o("span", {
                                              className:
                                                "px-2 py-1 rounded-full bg-[#E02424] text-white",
                                              children: "34 fee",
                                            }),
                                            o("span", {
                                              className:
                                                "px-2 py-1 rounded-full bg-[#C27803] text-white",
                                              children: "12 repost",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    a("div", {
                                      className:
                                        "rounded-xl bg-[#F5F7FA] border p-3",
                                      children: [
                                        o("div", {
                                          className: "opacity-60",
                                          children: "expiry cron",
                                        }),
                                        o("div", {
                                          className: "mt-1 font-bold",
                                          children:
                                            "72h re-check • availability ping",
                                        }),
                                        o("div", {
                                          className: "mt-1 text-[10px]",
                                          children:
                                            "Last run: 2h ago • 89 fresh ≤24h",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                a("div", {
                                  className:
                                    "mt-3 rounded-xl bg-[#111928] text-white p-3 text-[11px] flex gap-2",
                                  children: [
                                    o(Ge, { className: "w-4 h-4" }),
                                    "Private vault indicator • Exact house number stored encrypted • Public UI shows estate + road only • Phone masked until contact • Audit log immutable",
                                  ],
                                }),
                                a("div", {
                                  className: "mt-3",
                                  children: [
                                    o("div", {
                                      className: "text-[11px] font-bold",
                                      children: "audit_events log",
                                    }),
                                    a("div", {
                                      className:
                                        "mt-2 space-y-1.5 text-[11px] font-mono bg-[#F5F7FA] rounded-xl p-2",
                                      children: [
                                        o("div", {
                                          children:
                                            "[10:23] publish_state → approved • Kileleshwa • verified true",
                                        }),
                                        o("div", {
                                          children:
                                            "[10:22] fee signal detected • Zimmerman • red warning shown • report reason: viewing_fee",
                                        }),
                                        o("div", {
                                          children:
                                            "[10:18] evidence checklist incomplete • Umoja • pending",
                                        }),
                                        o("div", {
                                          children:
                                            "[10:10] caretaker mandate verified • James M. • estates Kileleshwa",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            a("div", {
                              className:
                                "rounded-[20px] border bg-[#F5F7FA] p-4 text-[11px]",
                              children: [
                                o("div", {
                                  className: "font-bold",
                                  children: "Schema update v3",
                                }),
                                a("div", {
                                  className:
                                    "mt-2 font-mono text-[10px] leading-4 bg-white border rounded-xl p-2",
                                  children: [
                                    "enum role: Agent|Owner|Developer|Caretaker",
                                    o("br", {}),
                                    "listings: freshH int, response_time int, fee bool, verified bool, available bool, publish_state, verification_level, estate, subcounty, borough, road, exact_number_encrypted, evidence jsonb, tiktok_url, poster_id",
                                    o("br", {}),
                                    "caretaker_permissions: caretaker_id, estates[], mandate_url, verified bool, expiry",
                                    o("br", {}),
                                    "audit_events: id, listing_id, action, meta, created_at",
                                    o("br", {}),
                                    "leads: phone_masked, response_time, fee_reported bool",
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          a("section", {
            id: "prototype",
            className: "scroll-mt-20",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children:
                  "Prototype Flows • Updated with Caretaker, Fee Warning, Masked Phone",
              }),
              o("div", {
                className: "mt-4 grid md:grid-cols-3 gap-4",
                children: [
                  {
                    title: "Seeker flow",
                    steps: [
                      "Home • Market Pulse • Trustbar • Borough + Subcounty • Fresh/NoFee/Verified filters",
                      "Estate • Breadcrumb Nairobi > Western > Westlands > Kileleshwa • Sort response fastest",
                      "Listing • Trust checks green • Exact number hidden • Fee warning red • Evidence 5 clips • Call masked toast • Report 5 reasons",
                    ],
                  },
                  {
                    title: "Poster flow (4 roles)",
                    steps: [
                      "Role selector 4 • Agent/Owner/Developer/Caretaker • Caretaker needs mandate",
                      "Estate/Room/Rent/Road/TikTok • Sub-county 17 • Road only (number hidden) • freshH auto",
                      "Ownership + Verification + Evidence checklist Outside•gate•inside•water•window + Caretaker mandate if Caretaker",
                      "Review • Publishing rules panel • Submit • Unverified stays out of green catalog",
                    ],
                  },
                  {
                    title: "Trust & Payment",
                    steps: [
                      "Phone masked until contact • OTP 6 boxes • ID selfie • Mandate upload",
                      "Report modal 5 reasons: fee, fake, repost, price anomaly, unavailable • Audit log",
                      "M-Pesa STK Push simulation 'no real payment was made' • Till 412 412 • Escrow commitment fee refundable",
                    ],
                  },
                ].map((c) =>
                  a(
                    "div",
                    {
                      className: "bg-white rounded-[20px] border p-4",
                      children: [
                        o("div", {
                          className: "jakarta font-bold text-[14px]",
                          children: c.title,
                        }),
                        o("div", {
                          className: "mt-3 space-y-2",
                          children: c.steps.map((S, eA) =>
                            a(
                              "div",
                              {
                                className: "flex gap-2 text-[12px] leading-5",
                                children: [
                                  o("span", {
                                    className:
                                      "h-5 w-5 rounded-full bg-[#111928] text-white grid place-items-center text-[10px] font-bold shrink-0",
                                    children: eA + 1,
                                  }),
                                  o("span", { children: S }),
                                ],
                              },
                              eA,
                            ),
                          ),
                        }),
                      ],
                    },
                    c.title,
                  ),
                ),
              }),
            ],
          }),
          a("section", {
            id: "payment",
            className: "scroll-mt-20",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children: "Payment • M-Pesa STK Push Simulation",
              }),
              a("div", {
                className: "mt-4 grid md:grid-cols-2 gap-4",
                children: [
                  a("div", {
                    className: "bg-white rounded-[20px] border p-5",
                    children: [
                      a("div", {
                        className: "flex items-center gap-2",
                        children: [
                          o(On, { className: "w-5 h-5 text-[#12B44A]" }),
                          o("span", {
                            className: "font-bold",
                            children: "STK Push • No real payment was made",
                          }),
                        ],
                      }),
                      a("div", {
                        className: "mt-3 rounded-2xl bg-[#F5F7FA] border p-4",
                        children: [
                          a("div", {
                            className:
                              "flex items-center justify-between text-[12px]",
                            children: [
                              o("span", {
                                children: "Till 412 412 • Keja Halisi",
                              }),
                              o("span", {
                                className:
                                  "px-2 py-1 rounded-full bg-[#12B44A] text-white text-[10px] font-bold",
                                children: "M-Pesa Green #12B44A",
                              }),
                            ],
                          }),
                          o("div", {
                            className:
                              "mt-3 h-2 rounded-full bg-black/10 overflow-hidden",
                            children: o("div", {
                              className: "h-full bg-[#12B44A]",
                              style: { width: `${(g + 1) * 25}%` },
                            }),
                          }),
                          o("div", {
                            className: "mt-2 text-[11px] opacity-70",
                            children: [
                              "Enter phone • 07** *** masked until contact",
                              "STK sent • Check phone • Till 412 412",
                              "Enter M-Pesa PIN • Escrow commitment refundable",
                              "Success • Receipt • No real payment was made",
                            ][g],
                          }),
                          o("button", {
                            onClick: () => R(!0),
                            className:
                              "mt-3 w-full h-10 rounded-full bg-[#12B44A] text-white font-semibold text-[13px]",
                            children: "Trigger STK Simulation",
                          }),
                        ],
                      }),
                      o("div", {
                        className: "mt-3 text-[11px] leading-5 opacity-70",
                        children:
                          "Subscription KES 999/mo Developer • Wallet • Viewing commitment fee refundable via escrow • Phone masked until contact • Exact number hidden • Private vault.",
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-[#111928] text-white rounded-[20px] p-5",
                    children: [
                      o("div", {
                        className: "text-[12px] tracking-widest opacity-60",
                        children: "FEEDBACK LOOP • TRUST PILLS",
                      }),
                      a("div", {
                        className: "mt-3 space-y-2 text-[12px]",
                        children: [
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o(ee, { className: "w-4 h-4 text-[#0E9F6E]" }),
                              "Verified Green catalog only shows verified listings • Pending out",
                            ],
                          }),
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o(ee, { className: "w-4 h-4 text-[#1976D2]" }),
                              "No Viewing Fee Blue • Fee signal red warning + filter hides",
                            ],
                          }),
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o(ee, { className: "w-4 h-4 text-[#E02424]" }),
                              "Reported Red • 5 reasons • Audit events • AI flags repost/price anomaly/fee",
                            ],
                          }),
                          a("div", {
                            className: "flex gap-2",
                            children: [
                              o(ee, { className: "w-4 h-4 text-white" }),
                              "Fresh ≤24h • Available Only • Response Time fastest • Market Pulse live",
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          a("section", {
            id: "trust",
            className: "scroll-mt-20",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children: "Trust • No Viewing Fee Enforcement + Privacy",
              }),
              a("div", {
                className: "mt-4 grid md:grid-cols-3 gap-4",
                children: [
                  a("div", {
                    className: "bg-white rounded-[20px] border p-4",
                    children: [
                      o("div", {
                        className: "text-[12px] font-bold",
                        children: "No viewing fee rule",
                      }),
                      o("div", {
                        className: "mt-2 text-[12px] leading-5",
                        children:
                          'If listing has fee signal (fee=true), show red warning: "A viewing-fee signal exists. Treat as warning and report if agent asks you to pay before viewing." Add filter No Fee to hide those. Trust checks row every listing detail green notice.',
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-white rounded-[20px] border p-4",
                    children: [
                      o("div", {
                        className: "text-[12px] font-bold",
                        children: "Privacy rule",
                      }),
                      o("div", {
                        className: "mt-2 text-[12px] leading-5",
                        children:
                          'Exact house number is intentionally NOT shown in public prototype. Show notice "Exact house number is intentionally not shown" and "Public UI shows estate + road, not exact house number". Phone masked until contact - toast on Call.',
                      }),
                    ],
                  }),
                  a("div", {
                    className: "bg-white rounded-[20px] border p-4",
                    children: [
                      o("div", {
                        className: "text-[12px] font-bold",
                        children: "Evidence checklist",
                      }),
                      o("div", {
                        className: "mt-2 text-[12px] leading-5",
                        children:
                          'Component "Evidence checklist: Outside • gate • inside • water running • window view" as required before publish. Show as green notice in Post flow Step 3. AI checks presence.',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          a("section", {
            id: "boroughs",
            className: "scroll-mt-20",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children: "Boroughs • Nairobi Coverage 6×17 Configurable",
              }),
              a("div", {
                className: "mt-4 bg-white rounded-[24px] border p-5",
                children: [
                  o("div", {
                    className: "grid md:grid-cols-3 gap-4",
                    children: ge.map((c) =>
                      a(
                        "div",
                        {
                          className: "rounded-[20px] bg-[#F5F7FA] border p-4",
                          children: [
                            a("div", {
                              className: "flex items-center justify-between",
                              children: [
                                o("span", {
                                  className: "jakarta font-bold",
                                  children: c.name,
                                }),
                                a("span", {
                                  className:
                                    "text-[11px] px-2 py-1 rounded-full bg-white border",
                                  children: [c.sub.length, " sub-counties"],
                                }),
                              ],
                            }),
                            o("div", {
                              className: "mt-3 space-y-1.5",
                              children: c.sub.map((S) =>
                                a(
                                  "div",
                                  {
                                    className:
                                      "flex items-center justify-between text-[12px]",
                                    children: [
                                      o("span", { children: S }),
                                      a("span", {
                                        className: "text-[11px] opacity-60",
                                        children: [
                                          ge
                                            .find((eA) => eA.name === c.name)
                                            ?.estates.join(", ")
                                            .slice(0, 28),
                                          "...",
                                        ],
                                      }),
                                    ],
                                  },
                                  S,
                                ),
                              ),
                            }),
                          ],
                        },
                        c.name,
                      ),
                    ),
                  }),
                  o("div", {
                    className: "mt-4 text-[11px] opacity-60",
                    children:
                      "Configurable • Western [Westlands, Dagoretti North, Dagoretti South], Southern [Langata, Kibra], Central [Starehe, Kamukunji, Mathare], Eastern [Embakasi North, West, Central], South Eastern [Embakasi South, East, Makadara], Northern [Ruaraka, Roysambu, Kasarani]",
                  }),
                ],
              }),
            ],
          }),
          a("section", {
            id: "devspecs",
            className: "scroll-mt-20 mb-10",
            children: [
              o("h2", {
                className: "jakarta text-[24px] font-bold",
                children: "Dev Specs • Supabase Schema v3 Updated",
              }),
              a("div", {
                className:
                  "mt-4 bg-[#111928] text-white rounded-[24px] p-5 font-mono text-[11px] leading-5 overflow-auto",
                children: [
                  o("div", {
                    className: "opacity-60",
                    children:
                      "-- Keja Halisi v3 • Trust Blue #1976D2 • Safaricom #00B140 • M-Pesa #12B44A • Verified #0E9F6E",
                  }),
                  o("div", {
                    className: "mt-2",
                    children:
                      "create type poster_role as enum ('Agent','Owner','Developer','Caretaker');",
                  }),
                  o("div", {
                    children:
                      "create table listings ( id uuid pk, title text, estate text, subcounty text, borough text, road text, exact_number_encrypted text -- private vault, rent int check 8000-45000, beds int, freshH int, response_time int, fee boolean, verified boolean, available boolean, publish_state enum approved/rejected/pending, verification_level enum phone/id/mandate, poster_id uuid, role poster_role, evidence jsonb, tiktok_url text, created_at timestamptz, expiry_at timestamptz );",
                  }),
                  o("div", {
                    className: "mt-2",
                    children:
                      "create table caretaker_permissions ( id uuid pk, caretaker_id uuid, estates text[], mandate_url text, verified bool, expiry date );",
                  }),
                  o("div", {
                    children:
                      "create table audit_events ( id uuid pk, listing_id uuid, action text, meta jsonb, created_at timestamptz default now() ); -- fee signal, repost, price anomaly, expiry cron, private vault access",
                  }),
                  o("div", {
                    className: "mt-2",
                    children:
                      "-- RLS: public UI shows estate+road only, exact_number_encrypted only for admin + poster • phone masked until contact • leads table logs masked • Trust filters: fresh ≤24h, available, noFee, verified • Sort response fastest • Publishing rules enforced",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      Z &&
        o("div", {
          className:
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4",
          children: a("div", {
            className: "bg-white rounded-[24px] max-w-[420px] w-full p-5",
            children: [
              a("div", {
                className: "flex items-center justify-between",
                children: [
                  o("div", {
                    className: "jakarta font-bold",
                    children: "Report • 5 reasons",
                  }),
                  o("button", {
                    onClick: () => d(!1),
                    className:
                      "h-8 w-8 grid place-items-center rounded-full bg-[#F5F7FA] border",
                    children: o(Ye, { className: "w-4 h-4" }),
                  }),
                ],
              }),
              o("div", {
                className: "mt-3 space-y-2",
                children: [
                  "Viewing fee asked before viewing",
                  "Fake / stolen video",
                  "Repost / duplicate",
                  "Price anomaly / bait",
                  "Unavailable / already let",
                ].map((c) =>
                  a(
                    "button",
                    {
                      onClick: () => {
                        (xe(`Reported: ${c} • Audit log created`, "error"),
                          d(!1));
                      },
                      className:
                        "w-full text-left px-3 py-2.5 rounded-xl border hover:bg-[#F5F7FA] text-[13px] flex items-center gap-2",
                      children: [
                        o(Be, { className: "w-4 h-4 text-[#E02424]" }),
                        c,
                      ],
                    },
                    c,
                  ),
                ),
              }),
              o("div", {
                className:
                  "mt-3 rounded-xl bg-[#FEF2F2] border border-[#E02424]/20 p-2.5 text-[11px] text-[#E02424]",
                children:
                  "A viewing-fee signal exists. Treat as warning and report if agent asks you to pay before viewing.",
              }),
            ],
          }),
        }),
      p &&
        o("div", {
          className:
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4",
          children: a("div", {
            className: "bg-white rounded-[24px] max-w-[380px] w-full p-5",
            children: [
              a("div", {
                className: "flex items-center justify-between",
                children: [
                  o("div", {
                    className: "jakarta font-bold",
                    children: "Contact • Phone masked until contact",
                  }),
                  o("button", {
                    onClick: () => v(!1),
                    className:
                      "h-8 w-8 grid place-items-center rounded-full bg-[#F5F7FA] border",
                    children: o(Ye, { className: "w-4 h-4" }),
                  }),
                ],
              }),
              a("div", {
                className: "mt-3 rounded-2xl bg-[#111928] text-white p-4",
                children: [
                  a("div", {
                    className: "text-[12px] opacity-70",
                    children: [
                      "Agent • ",
                      U.role,
                      " • Response ~",
                      U.responseMins,
                      "min",
                    ],
                  }),
                  a("div", {
                    className: "mt-1 text-[20px] font-bold tracking-wide",
                    children: [
                      "07** *** ",
                      Math.floor(Math.random() * 900) + 100,
                    ],
                  }),
                  o("div", {
                    className: "mt-1 text-[11px] opacity-70",
                    children:
                      "Exact number masked • Lead logged • OTP verified • Trust checks: phone verified • evidence video • no fee rule • re-check",
                  }),
                ],
              }),
              o("div", {
                className:
                  "mt-3 rounded-xl bg-[#ECFDF5] border border-[#0E9F6E]/20 p-2.5 text-[11px] text-[#0E9F6E]",
                children:
                  "Trust checks: phone verified • evidence video • no viewing fee rule • listing re-check enabled",
              }),
              a("div", {
                className: "mt-3 flex gap-2",
                children: [
                  o("button", {
                    onClick: () => {
                      (xe(
                        "Phone masked until contact • Lead logged • Response time tracked",
                        "info",
                      ),
                        v(!1));
                    },
                    className:
                      "flex-1 h-10 rounded-full bg-[#111928] text-white text-[13px] font-semibold",
                    children: "Log Lead • Reveal on Call",
                  }),
                  o("button", {
                    onClick: () => v(!1),
                    className: "h-10 px-4 rounded-full border text-[13px]",
                    children: "Close",
                  }),
                ],
              }),
            ],
          }),
        }),
      V &&
        o("div", {
          className:
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4",
          children: a("div", {
            className: "bg-white rounded-[28px] max-w-[360px] w-full p-6",
            children: [
              a("div", {
                className: "flex items-center gap-3",
                children: [
                  o("div", {
                    className:
                      "h-10 w-10 rounded-2xl bg-[#12B44A] text-white grid place-items-center",
                    children: o(On, { className: "w-5 h-5" }),
                  }),
                  a("div", {
                    children: [
                      o("div", {
                        className: "font-bold",
                        children: "M-Pesa STK Push",
                      }),
                      o("div", {
                        className: "text-[11px] opacity-60",
                        children: "Till 412 412 • Safaricom Green #00B140",
                      }),
                    ],
                  }),
                ],
              }),
              a("div", {
                className: "mt-5 space-y-3",
                children: [
                  a("div", {
                    className: `h-14 rounded-2xl border flex items-center gap-3 px-4 ${g >= 0 ? "bg-[#ECFDF5] border-[#0E9F6E]/30" : "bg-[#F5F7FA]"}`,
                    children: [
                      o("div", {
                        className:
                          "h-8 w-8 rounded-full bg-white border grid place-items-center",
                        children: "1",
                      }),
                      a("div", {
                        className: "text-[12px]",
                        children: [
                          o("div", {
                            className: "font-semibold",
                            children: "Phone • Masked",
                          }),
                          o("div", {
                            className: "opacity-60",
                            children: "07** *** • OTP 6 boxes verified",
                          }),
                        ],
                      }),
                    ],
                  }),
                  a("div", {
                    className: `h-14 rounded-2xl border flex items-center gap-3 px-4 ${g >= 1 ? "bg-[#ECFDF5] border-[#0E9F6E]/30" : "bg-[#F5F7FA]"}`,
                    children: [
                      o("div", {
                        className:
                          "h-8 w-8 rounded-full bg-white border grid place-items-center",
                        children: "2",
                      }),
                      a("div", {
                        className: "text-[12px]",
                        children: [
                          o("div", {
                            className: "font-semibold",
                            children: "STK Sent • Check Phone",
                          }),
                          o("div", {
                            className: "opacity-60",
                            children: "Till 412 412 • Escrow commitment",
                          }),
                        ],
                      }),
                    ],
                  }),
                  a("div", {
                    className: `h-14 rounded-2xl border flex items-center gap-3 px-4 ${g >= 2 ? "bg-[#ECFDF5] border-[#0E9F6E]/30" : "bg-[#F5F7FA]"}`,
                    children: [
                      o("div", {
                        className:
                          "h-8 w-8 rounded-full bg-white border grid place-items-center",
                        children: "3",
                      }),
                      a("div", {
                        className: "text-[12px]",
                        children: [
                          o("div", {
                            className: "font-semibold",
                            children: "Enter M-Pesa PIN",
                          }),
                          o("div", {
                            className: "opacity-60",
                            children:
                              "Refundable • No viewing fee before viewing",
                          }),
                        ],
                      }),
                    ],
                  }),
                  a("div", {
                    className: `h-14 rounded-2xl border flex items-center gap-3 px-4 ${g >= 3 ? "bg-[#111928] text-white border-[#111928]" : "bg-[#F5F7FA]"}`,
                    children: [
                      o("div", {
                        className:
                          "h-8 w-8 rounded-full bg-white text-black border grid place-items-center",
                        children: "✓",
                      }),
                      a("div", {
                        className: "text-[12px]",
                        children: [
                          o("div", {
                            className: "font-semibold",
                            children: "Success • No real payment was made",
                          }),
                          o("div", {
                            className: "opacity-70",
                            children: "Receipt simulated • Trust enforced",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              o("button", {
                onClick: () => R(!1),
                className:
                  "mt-5 w-full h-11 rounded-full bg-[#111928] text-white font-semibold",
                children: "Close • Simulation only",
              }),
              o("div", {
                className: "mt-2 text-[10px] text-center opacity-60",
                children:
                  "Publishing rules: No viewing fee before viewing • Public UI estate+road only • Unverified out of green catalog • Re-check expiry",
              }),
            ],
          }),
        }),
      o("footer", {
        className: "border-t bg-white",
        children: a("div", {
          className:
            "max-w-[1280px] mx-auto px-4 md:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-[11px] opacity-70",
          children: [
            o("span", {
              children:
                "© Keja Halisi v3 • Trust Blue #1976D2 • M-Pesa #12B44A • Verified #0E9F6E • 4 roles inc Caretaker • Borough 6×17 • Fresh/NoFee/Verified filters • Fee warning red • Evidence checklist • Privacy exact number hidden • Phone masked until contact • 12 listings KES 8k-45k • Market Pulse + Trustbar • No lorem ipsum • Nairobi real estates",
            }),
            a("span", {
              className: "flex items-center gap-2",
              children: [
                o(De, { className: "w-4 h-4 text-[#0E9F6E]" }),
                "Trust checks: phone verified • evidence video • no viewing fee rule • listing re-check enabled",
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
Kc.createRoot(document.getElementById("root")).render(
  o(Sc.default.StrictMode, { children: o(wo, {}) }),
);
