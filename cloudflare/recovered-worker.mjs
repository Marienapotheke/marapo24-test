import {addressSuggestions as recoveredAddressSuggestions,splitStreetAddress as recoveredSplitStreet,normalizeHouseNumber as recoveredHouseNumber} from './address-suggestions.mjs';
// Editable recovered Worker; exact baseline: recovery/cloudflare-20261030/.
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .build/worker.mjs
import { createRequire } from "node:module";
import { randomBytes as ut } from "node:crypto";
import { createHmac as ot, timingSafeEqual as Sr, randomBytes as ke } from "node:crypto";
import { createHash as pr, createHmac as mr, timingSafeEqual as gr, randomBytes as ye } from "node:crypto";
import { inflateSync as yr, crc32 as Or } from "node:zlib";
import { createPublicKey as Dr } from "node:crypto";
import { createHash as br } from "node:crypto";
var require2 = createRequire("/bundle/worker.js");
var ir = Object.create;
var Ze = Object.defineProperty;
var nr = Object.getOwnPropertyDescriptor;
var ar = Object.getOwnPropertyNames;
var sr = Object.getPrototypeOf;
var or = Object.prototype.hasOwnProperty;
var dr = ((e) => typeof require2 < "u" ? require2 : typeof Proxy < "u" ? new Proxy(e, { get: /* @__PURE__ */ __name((t, n) => (typeof require2 < "u" ? require2 : t)[n], "get") }) : e)(function(e) {
  if (typeof require2 < "u") return require2.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var qe = /* @__PURE__ */ __name((e, t) => () => {
  try {
    return t || e((t = { exports: {} }).exports, t), t.exports;
  } catch (n) {
    throw t = 0, n;
  }
}, "qe");
var cr = /* @__PURE__ */ __name((e, t, n, i) => {
  if (t && typeof t == "object" || typeof t == "function") for (let r of ar(t)) !or.call(e, r) && r !== n && Ze(e, r, { get: /* @__PURE__ */ __name(() => t[r], "get"), enumerable: !(i = nr(t, r)) || i.enumerable });
  return e;
}, "cr");
var G = /* @__PURE__ */ __name((e, t, n) => (n = e != null ? ir(sr(e)) : {}, cr(t || !e || !e.__esModule ? Ze(n, "default", { value: e, enumerable: true }) : n, e)), "G");
var $ = qe((Br, tt) => {
  "use strict";
  var lr = "SpSSdF3EVNSyXbu8EZfSrcE9Yym2", ur = "p3UGBiSDr3VJ5hxe3vzihfaw2Fr2", ve = class extends Error {
    static {
      __name(this, "ve");
    }
    constructor(t, n) {
      super(n), this.code = t;
    }
  };
  function W(e, t) {
    throw new ve(e, t);
  }
  __name(W, "W");
  function Qe(e, t, n) {
    e || W("unauthenticated", "Anmeldung erforderlich."), (t?.role !== n || t.active !== true) && W("permission-denied", "Kein aktives Mitarbeiterkonto.");
  }
  __name(Qe, "Qe");
  function et(e) {
    for (let t of ["tourId", "stopId"]) (typeof e?.[t] != "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(e[t])) && W("invalid-argument", "Ung\xFCltige Lieferungsnummer.");
    return `${e.tourId.length}_${e.tourId}_${e.stopId}`;
  }
  __name(et, "et");
  function fr(e, t, n, i, r, o, s) {
    Qe(t, n, "driver");
    let d = et(e);
    (!e || Object.keys(e).some((l) => !["tourId", "stopId", "status", "signature", "completionId", "capturedAt"].includes(l))) && W("invalid-argument", "Unerlaubte Abschlussfelder."), (!i || !r) && W("not-found", "Lieferung fehlt."), i.driverId !== t && W("permission-denied", "Tour nicht zugewiesen."), (i.schemaVersion !== 2 || r.schemaVersion !== 2 || "signature" in r) && W("failed-precondition", "Alte Testdaten zuerst sicher migrieren."), (r.status !== "offen" || o) && W("already-exists", "Lieferung bereits abgeschlossen."), ["zugestellt", "nicht zugestellt"].includes(e.status) || W("invalid-argument", "Ung\xFCltiger Status.");
    let c = e.status === "zugestellt" && r.type === "privat";
    return c ? ((typeof e.signature != "string" || e.signature.length > 18e4 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(e.signature)) && W("invalid-argument", "G\xFCltige Testunterschrift erforderlich."), s(e.signature)) : e.signature != null && W("invalid-argument", "Unterschrift hier nicht erlaubt."), { proofId: d, signature: c ? e.signature : null };
  }
  __name(fr, "fr");
  tt.exports = { OFFICE: lr, DRIVER: ur, PolicyError: ve, reject: W, authorize: Qe, identifiers: et, completion: fr };
});
var Be = qe((gi, Nt) => {
  "use strict";
  var de = dr("node:crypto"), { reject: Z } = $();
  function Tt(e) {
    let t = de.createPrivateKey(e), i = de.createPublicKey(t).export({ type: "spki", format: "der" });
    return { privateKey: t, publicKey: i.toString("base64"), keyId: de.createHash("sha256").update(i).digest("hex") };
  }
  __name(Tt, "Tt");
  function xe(e, t) {
    return (typeof e != "string" || e.length > t || !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(e)) && Z("invalid-argument", "Ung\xFCltiger verschl\xFCsselter Nachweis."), Buffer.from(e, "base64");
  }
  __name(xe, "xe");
  function Tr(e, t, n, i = Date.now()) {
    (!e || typeof e != "object" || Array.isArray(e) || Object.keys(e).some((u) => !["version", "keyId", "wrappedKey", "iv", "ciphertext"].includes(u)) || e.version !== 1) && Z("invalid-argument", "Ung\xFCltiger verschl\xFCsselter Nachweis.");
    let r = Tt(n);
    e.keyId !== r.keyId && Z("failed-precondition", "Verschl\xFCsselungsschl\xFCssel nicht mehr verf\xFCgbar. Nachweis bleibt auf dem Ger\xE4t.");
    let o = xe(e.wrappedKey, 1024), s = xe(e.iv, 32), d = xe(e.ciphertext, 26e4);
    (s.length !== 12 || d.length < 17) && Z("invalid-argument", "Ung\xFCltiger verschl\xFCsselter Nachweis.");
    let c;
    try {
      let u = de.privateDecrypt({ key: r.privateKey, oaepHash: "sha256", padding: de.constants.RSA_PKCS1_OAEP_PADDING }, o);
      if (u.length !== 32) throw Error("key");
      let E = de.createDecipheriv("aes-256-gcm", u, s);
      E.setAAD(Buffer.from(JSON.stringify(t))), E.setAuthTag(d.subarray(-16)), c = JSON.parse(Buffer.concat([E.update(d.subarray(0, -16)), E.final()]).toString("utf8")), u.fill(0);
    } catch {
      Z("invalid-argument", "Nachweis wurde ver\xE4ndert oder geh\xF6rt zu einer anderen Lieferung.");
    }
    (!c || Object.keys(c).some((u) => !["signature", "capturedAt"].includes(u)) || typeof c.signature != "string" || c.signature.length > 18e4 || typeof c.capturedAt != "string") && Z("invalid-argument", "Ung\xFCltiger Nachweisinhalt.");
    let l = Date.parse(c.capturedAt);
    return (!Number.isFinite(l) || l > i + 300 * 1e3 || i - l > 2880 * 60 * 1e3) && Z("failed-precondition", "Ger\xE4tezeit pr\xFCfen. Offline-Nachweis muss innerhalb von 48 Stunden \xFCbertragen werden."), c;
  }
  __name(Tr, "Tr");
  Nt.exports = { keys: Tt, openEnvelope: Tr };
});
var it = G($(), 1);
var Me = /* @__PURE__ */ __name((e) => ["pflege", "partner"].includes(e), "Me");
function Y(e) {
  if (e === void 0) return 1;
  if (!Number.isSafeInteger(e) || e < 1 || e > 999) throw Object.assign(Error("Anzahl P\xE4ckchen muss eine ganze Zahl von 1 bis 999 sein."), { code: "invalid-argument" });
  return e;
}
__name(Y, "Y");
var te = /* @__PURE__ */ __name((e) => e.cashExempt === true || e.removed ? 0 : e.cents, "te");
function rt(e) {
  if (e === void 0) return "";
  if (typeof e != "string" || e.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(e)) throw Object.assign(Error("Fahrerkommentar pr\xFCfen (h\xF6chstens 500 Zeichen)."), { code: "invalid-argument" });
  return e.trim();
}
__name(rt, "rt");
var a = it.default.reject;
function w(e, t) {
  return e?.active === true && (e.role === t || e.roles?.includes(t));
}
__name(w, "w");
function C(e, t) {
  w(e, t) || a("permission-denied", "Keine Berechtigung f\xFCr diesen Vorgang.");
}
__name(C, "C");
function b(e = /* @__PURE__ */ new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(e);
}
__name(b, "b");
function Te(e) {
  (typeof e != "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e)) && a("invalid-argument", "Datum pr\xFCfen.");
  let t = /* @__PURE__ */ new Date(e + "T12:00:00Z");
  return (!Number.isFinite(+t) || t.toISOString().slice(0, 10) !== e) && a("invalid-argument", "Datum pr\xFCfen."), t.getUTCDay();
}
__name(Te, "Te");
var Er = { doctor1: "\xC4rztetour 1", doctor2: "\xC4rztetour 2", partner: "Partnerapotheken-Tour", hunsrueck: "Hunsr\xFCck", eifel: "Eifel", mosel: "Mosel", saturday: "Samstag: Privatkunden-Vormittag" };
function Ne(e) {
  let t = Te(e);
  return (t === 0 ? [] : t === 6 ? ["saturday"] : ["doctor1", ...t === 3 || t === 5 ? ["doctor2", "partner"] : [], "hunsrueck", "eifel", "mosel"]).map((i) => ({ id: i, label: Er[i] }));
}
__name(Ne, "Ne");
function R(e, t) {
  (!e || typeof e != "object" || Array.isArray(e) || Object.keys(e).some((n) => !t.includes(n))) && a("invalid-argument", "Ung\xFCltige Eingabefelder.");
}
__name(R, "R");
function O(e, t, n = false) {
  return (typeof e != "string" || e.length > t || n && !e.trim()) && a("invalid-argument", "Textfelder pr\xFCfen."), e.trim();
}
__name(O, "O");
function I(e) {
  return (typeof e != "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(e)) && a("invalid-argument", "Ung\xFCltige Vorgangsnummer."), e;
}
__name(I, "I");
function M(e) {
  (typeof e.completionId != "string" || !/^[0-9a-f-]{36}$/i.test(e.completionId) || typeof e.capturedAt != "string" || e.capturedAt.length > 40) && a("invalid-argument", "Ung\xFCltiger Abschluss.");
  let t = Date.parse(e.capturedAt);
  (!Number.isFinite(t) || t > Date.now() + 3e5 || Date.now() - t > 1728e5) && a("failed-precondition", "Ger\xE4tezeit oder ausstehenden Offline-Abschluss pr\xFCfen.");
}
__name(M, "M");
function re(e, t) {
  R(e, ["tourId", "type", "origin", "name", "street", "postalCode", "city", "phone", "note", "cents", "paymentReason", "parcelCount", "secondName"]), I(e.tourId), (!["privat", "arzt", "pflege", "partner"].includes(e.type) || !["Marienapotheke", "Cusanus-Apotheke"].includes(e.origin)) && a("invalid-argument", "Lieferart oder Herkunft pr\xFCfen."), t.regularType === "saturday" && e.type !== "privat" && a("failed-precondition", "Samstagstouren sind ausschlie\xDFlich f\xFCr Privatkunden.");
  let n = { type: e.type, origin: e.origin, name: O(e.name, 90, true), street: O(e.street, 100, true), postalCode: O(e.postalCode, 10, true), city: O(e.city, 90, true), phone: O(e.phone ?? "", 40), note: O(e.note ?? "", 240), cents: Me(e.type) ? 0 : e.cents, paymentReason: O(e.paymentReason ?? "", 80) };
  (!/^[0-9]{5}$/.test(n.postalCode) || !Number.isSafeInteger(n.cents) || n.cents < 0 || n.cents > 999900) && a("invalid-argument", "Postleitzahl oder Barzahlbetrag pr\xFCfen.");
  try {
    n.parcelCount = n.type === "arzt" ? 1 : Y(e.parcelCount);
  } catch (r) {
    a("invalid-argument", r.message);
  }
  let i = O(e.secondName ?? "", 90);
  return /[\u0000-\u001f\u007f]/.test(i) && a("invalid-argument", "Zweiten Namen pr\xFCfen."), i && (n.type === "arzt" || n.parcelCount < 2) && a("invalid-argument", "F\xFCr einen zweiten Namen mindestens zwei P\xE4ckchen w\xE4hlen."), i && (n.secondName = i), Me(n.type) && (n.cents = 0, n.paymentReason = "", n.cashExempt = true), n.address = n.street + ", " + n.postalCode + " " + n.city, n;
}
__name(re, "re");
var le = "__Host-marapo24-device";
var Ie = "__Host-marapo24-driver";
var ie = /* @__PURE__ */ __name((e, t, ...n) => e.prepare(t).bind(...n).first(), "ie");
var Oe = /* @__PURE__ */ __name((e, t, ...n) => e.prepare(t).bind(...n).run(), "Oe");
var F = /* @__PURE__ */ __name((e) => pr("sha256").update(e).digest("hex"), "F");
function ne(e, t, n, i) {
  return (typeof e != "string" || e.length < 40) && a("unavailable", "PIN-Anmeldung noch nicht eingerichtet."), mr("sha256", e).update(t + "\0" + n + "\0" + i).digest("hex");
}
__name(ne, "ne");
function hr(e) {
  let t = {};
  for (let n of (e.headers.get("Cookie") || "").split(";")) {
    let i = n.trim().split("=");
    i.length === 2 && (t[i[0]] = i[1]);
  }
  return t;
}
__name(hr, "hr");
var Ae = /* @__PURE__ */ __name((e, t, n) => e + "=" + t + "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=" + n, "Ae");
function ue(e, t) {
  let n = hr(e)[t];
  return typeof n == "string" && /^[A-Za-z0-9_-]{43}$/.test(n) ? n : null;
}
__name(ue, "ue");
async function _r(e, t) {
  let n = ue(e, le);
  n || a("unauthenticated", "Dieses Ger\xE4t muss zuerst vom B\xFCro freigegeben werden.");
  let i = await ie(t.DB, "SELECT * FROM driver_devices WHERE token_hash=? AND active=1 AND expires_at>?", F(n), Date.now());
  return i || a("unauthenticated", "Ger\xE4tefreigabe fehlt oder wurde aufgehoben."), i;
}
__name(_r, "_r");
async function nt(e, t) {
  let n = ue(e, Ie), i = ue(e, le);
  (!n || !i) && a("unauthenticated", "Bitte mit pers\xF6nlicher Fahrer-PIN anmelden.");
  let r = await ie(t.DB, "SELECT s.uid FROM driver_sessions s JOIN users u ON u.uid=s.uid JOIN driver_devices d ON d.id=s.device_id WHERE s.token_hash=? AND d.token_hash=? AND s.expires_at>? AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')", F(n), F(i), Date.now());
  return r || a("unauthenticated", "Fahrer-Anmeldung abgelaufen oder gesperrt."), r.uid;
}
__name(nt, "nt");
async function at(e, t, n, i) {
  if (e === "driverPinLogout") {
    R(t, []);
    let _ = ue(n, Ie);
    return _ && await Oe(i.DB, "DELETE FROM driver_sessions WHERE token_hash=?", F(_)), { data: { signedOut: true }, cookies: [Ae(Ie, "", 0)] };
  }
  if (e === "driverLoginOptions") {
    R(t, []);
    let _ = (await i.DB.prepare("SELECT u.uid,u.display_name FROM users u JOIN driver_pins p ON p.uid=u.uid WHERE u.active=1 AND p.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') ORDER BY u.display_name LIMIT 51").all()).results;
    return _.length > 50 && a("resource-exhausted", "Fahrerzahl pr\xFCfen."), { data: { deviceLabel: "Pers\xF6nliche Fahreranmeldung", drivers: _.map((T) => ({ uid: T.uid, displayName: T.display_name })) } };
  }
  R(t, ["uid", "pin"]), (typeof t.uid != "string" || t.uid.length > 128 || typeof t.pin != "string" || !/^\d{6}$/.test(t.pin)) && a("invalid-argument", "Bitte Namen und sechsstellige PIN pr\xFCfen.");
  let r = await ie(i.DB, "SELECT p.*,u.active AS user_active,u.roles FROM driver_pins p JOIN users u ON u.uid=p.uid WHERE p.uid=?", t.uid);
  r || (ne(i.DRIVER_PIN_PEPPER, t.uid, "missing", t.pin), a("unauthenticated", "Name oder PIN nicht freigegeben."));
  let o = Math.floor(Date.now() / 9e5);
  (await ie(i.DB, "INSERT INTO driver_pin_attempts(uid,window,count) VALUES (?,?,1) ON CONFLICT(uid) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count", t.uid, o)).count > 5 && a("resource-exhausted", "Zu viele PIN-Versuche. Bitte 15 Minuten warten oder B\xFCro informieren.");
  let d = ne(i.DRIVER_PIN_PEPPER, t.uid, r.salt, t.pin), c = /^[a-f0-9]{64}$/.test(r.pin_hash) ? r.pin_hash : "0".repeat(64);
  (!gr(Buffer.from(d, "hex"), Buffer.from(c, "hex")) || !r || r.active !== 1 || r.user_active !== 1 || !JSON.parse(r.roles).includes("driver")) && a("unauthenticated", "Name oder PIN nicht freigegeben.");
  let l = ue(n, le), u = l ? await ie(i.DB, "SELECT * FROM driver_devices WHERE token_hash=?", F(l)) : null, E = u ? l : ye(32).toString("base64url"), p = { id: u?.id || crypto.randomUUID() };
  await Oe(i.DB, "INSERT INTO driver_devices VALUES (?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET active=1,expires_at=excluded.expires_at", p.id, F(E), "PIN-Anmeldung", (/* @__PURE__ */ new Date()).toISOString(), Date.now() + 180 * 864e5);
  let g = ye(32).toString("base64url"), h = Date.now() + 8 * 36e5;
  return (await i.DB.batch([i.DB.prepare("DELETE FROM driver_sessions WHERE device_id=? OR expires_at<=?").bind(p.id, Date.now()), i.DB.prepare("INSERT INTO driver_sessions SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM users u JOIN driver_pins p ON p.uid=u.uid WHERE u.uid=? AND u.active=1 AND p.active=1 AND p.pin_hash=? AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')) AND EXISTS(SELECT 1 FROM driver_devices WHERE id=? AND active=1 AND expires_at>?)").bind(F(g), r.uid, p.id, h, r.uid, r.pin_hash, p.id, Date.now()), i.DB.prepare("DELETE FROM driver_pin_attempts WHERE uid=?").bind(r.uid)]))[1].meta.changes !== 1 && a("unauthenticated", "Name oder PIN nicht freigegeben."), { data: { uid: r.uid, expiresAt: h }, cookies: [Ae(Ie, g, 8 * 3600), Ae(le, E, 180 * 86400)] };
}
__name(at, "at");
async function st(e, t, n, i, r) {
  if ((!w(r, "office") || !r.isAdmin) && a("permission-denied", "Nur die Administratorin darf Fahrerger\xE4te und PINs verwalten."), e === "listDriverDevices") return R(t, []), { data: { devices: (await i.DB.prepare("SELECT id,label,active,created_at,expires_at FROM driver_devices ORDER BY created_at DESC LIMIT 51").all()).results } };
  if (e === "authorizeDriverDevice") {
    R(t, ["label"]);
    let c = O(t.label, 60, true), l;
    try {
      l = await _r(n, i);
    } catch (g) {
      if (g.code !== "unauthenticated") throw g;
    }
    if (l) return await Oe(i.DB, "UPDATE driver_devices SET label=? WHERE id=?", c, l.id), { data: { authorized: true, deviceId: l.id } };
    let u = ye(32).toString("base64url"), E = crypto.randomUUID();
    return (await Oe(i.DB, "INSERT INTO driver_devices SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND is_admin=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))", E, F(u), c, 1, (/* @__PURE__ */ new Date()).toISOString(), Date.now() + 180 * 864e5, r.uid)).meta.changes !== 1 && a("permission-denied", "Administratorfreigabe pr\xFCfen."), { data: { authorized: true, deviceId: E }, cookies: [Ae(le, u, 180 * 86400)] };
  }
  if (e === "revokeDriverDevice") {
    R(t, ["deviceId"]);
    let c = I(t.deviceId);
    return await i.DB.batch([i.DB.prepare("UPDATE driver_devices SET active=0 WHERE id=?").bind(c), i.DB.prepare("DELETE FROM driver_sessions WHERE device_id=?").bind(c)]), { data: { revoked: true } };
  }
  R(t, ["uid", "pin"]), (typeof t.uid != "string" || t.uid.length > 128 || typeof t.pin != "string" || !/^\d{6}$/.test(t.pin) || /^(\d)\1{5}$/.test(t.pin) || ["123456", "654321", "012345", "987654"].includes(t.pin)) && a("invalid-argument", "Eine pers\xF6nliche sechsstellige PIN ohne einfache Zahlenfolge w\xE4hlen.");
  let o = await ie(i.DB, "SELECT roles FROM users WHERE uid=?", t.uid);
  (!o || !JSON.parse(o.roles).includes("driver")) && a("not-found", "Fahrerkonto fehlt.");
  let s = ye(16).toString("base64url"), d = ne(i.DRIVER_PIN_PEPPER, t.uid, s, t.pin);
  return await i.DB.batch([i.DB.prepare("INSERT INTO driver_pins VALUES (?,?,?,1) ON CONFLICT(uid) DO UPDATE SET salt=excluded.salt,pin_hash=excluded.pin_hash,active=1").bind(t.uid, s, d), i.DB.prepare("DELETE FROM driver_sessions WHERE uid=?").bind(t.uid), i.DB.prepare("DELETE FROM driver_pin_attempts WHERE uid=?").bind(t.uid)]), { data: { updated: true } };
}
__name(st, "st");
var He = "__Host-marapo24-office";
var fe = /* @__PURE__ */ __name((e, t, ...n) => e.prepare(t).bind(...n).first(), "fe");
var Pe = /* @__PURE__ */ __name((e, t) => He + "=" + e + "; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=" + t, "Pe");
function dt(e) {
  let t = (e.headers.get("Cookie") || "").split(";").map((n) => n.trim()).find((n) => n.startsWith(He + "="))?.slice(He.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(t || "") ? t : null;
}
__name(dt, "dt");
function we(e) {
  (typeof e != "string" || e.length > 120) && a("invalid-argument", "Benutzernamen pr\xFCfen.");
  let t = e.trim().normalize("NFKC").toLowerCase();
  return (!/^[a-z0-9._-]+(?:@marapo24\.de)?$/.test(t) || t.length < 3) && a("invalid-argument", "Benutzernamen pr\xFCfen."), t.includes("@") ? t : t + "@marapo24.de";
}
__name(we, "we");
async function ae(e, t, n, i) {
  return (typeof e != "string" || e.length < 40) && a("unavailable", "B\xFCro-Anmeldung noch nicht eingerichtet."), (typeof i != "string" || !/^[a-f0-9]{64}$/.test(i)) && a("invalid-argument", "Passwortnachweis pr\xFCfen."), ot("sha256", e).update(t + "\0" + n + "\0" + i).digest("hex");
}
__name(ae, "ae");
async function We(e, t) {
  let n = dt(e);
  n || a("unauthenticated", "Bitte mit Benutzername und Passwort anmelden.");
  let i = await fe(t.DB, "SELECT s.uid,c.must_change,c.password_hash,c.username FROM office_sessions s JOIN office_credentials_v2 c ON c.uid=s.uid JOIN users u ON u.uid=s.uid WHERE s.token_hash=? AND s.expires_at>? AND s.credential_hash=c.password_hash AND c.active=1 AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office')", F(n), Date.now());
  return i || a("unauthenticated", "B\xFCro-Anmeldung abgelaufen oder gesperrt."), { uid: i.uid, mustChange: i.must_change === 1, credentialHash: i.password_hash, username: i.username };
}
__name(We, "We");
async function ct(e, t, n, i) {
  if (e === "officePasswordLogout") {
    R(t, []);
    let h = dt(n);
    return h && await i.DB.prepare("DELETE FROM office_sessions WHERE token_hash=?").bind(F(h)).run(), { data: { signedOut: true }, cookies: [Pe("", 0)] };
  }
  R(t, ["officeForgotPassword", "officePasswordChallenge"].includes(e) ? ["username"] : ["username", "passwordProof"]);
  let r = we(t.username);
  !["officeForgotPassword", "officePasswordChallenge"].includes(e) && (typeof t.passwordProof != "string" || !/^[a-f0-9]{64}$/.test(t.passwordProof)) && a("invalid-argument", "Zugangsdaten pr\xFCfen.");
  let o = "network:" + F(n.headers.get("CF-Connecting-IP") || "unknown"), s = Math.floor(Date.now() / 9e5);
  await i.DB.prepare("DELETE FROM office_attempts WHERE window<?").bind(s - 1).run(), (await fe(i.DB, "INSERT INTO office_attempts VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count", o, s)).count > 100 && a("resource-exhausted", "Zu viele Versuche. Bitte 15 Minuten warten.");
  let c = await fe(i.DB, "SELECT c.*,u.active AS user_active,u.roles FROM office_credentials_v2 c JOIN users u ON u.uid=c.uid WHERE c.username=?", r);
  if (e === "officePasswordChallenge") return { data: { username: r, salt: c?.salt || ot("sha256", i.OFFICE_PASSWORD_PEPPER).update("unknown:" + r).digest("base64url").slice(0, 22), scheme: c?.must_change === 1 ? "temporary" : "personal" } };
  if (e === "officeForgotPassword") return c?.active === 1 && c.user_active === 1 && await i.DB.prepare("INSERT INTO password_reset_requests VALUES (?,?) ON CONFLICT(uid) DO NOTHING").bind(c.uid, (/* @__PURE__ */ new Date()).toISOString()).run(), { data: { requested: true } };
  c || a("unauthenticated", "Benutzername oder Passwort nicht freigegeben."), (await fe(i.DB, "INSERT INTO office_attempts VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count", "user:" + c.uid, s)).count > 5 && a("resource-exhausted", "Zu viele Versuche. Bitte 15 Minuten warten oder Administratorin kontaktieren.");
  let u = await ae(i.OFFICE_PASSWORD_PEPPER, c.uid, c.salt, t.passwordProof);
  (!/^[a-f0-9]{64}$/.test(c.password_hash) || !Sr(Buffer.from(u, "hex"), Buffer.from(c.password_hash, "hex")) || c.active !== 1 || c.user_active !== 1 || !JSON.parse(c.roles).includes("office")) && a("unauthenticated", "Benutzername oder Passwort nicht freigegeben.");
  let E = ke(32).toString("base64url"), p = Date.now() + 8 * 36e5;
  return (await i.DB.batch([i.DB.prepare("DELETE FROM office_sessions WHERE expires_at<=?").bind(Date.now()), i.DB.prepare("INSERT INTO office_sessions SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM office_credentials_v2 c JOIN users u ON u.uid=c.uid WHERE c.uid=? AND c.password_hash=? AND c.active=1 AND u.active=1 AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office'))").bind(F(E), c.uid, c.password_hash, p, c.uid, c.password_hash), i.DB.prepare("DELETE FROM office_attempts WHERE key=?").bind("user:" + c.uid)]))[1].meta.changes !== 1 && a("unauthenticated", "Kontofreigabe wurde ge\xE4ndert."), { data: { uid: c.uid, mustChangePassword: c.must_change === 1, expiresAt: p }, cookies: [Pe(E, 8 * 3600)] };
}
__name(ct, "ct");
function se(e, t) {
  return w(e, "office") && e.isAdmin && e.sessionKind === "firebase" && typeof t.MASTER_ADMIN_EMAIL == "string" && e.loginEmail?.toLowerCase() === t.MASTER_ADMIN_EMAIL.toLowerCase();
}
__name(se, "se");
async function lt(e, t, n, i, r) {
  if (e === "changeOfficePassword") {
    R(t, ["passwordProof", "salt"]), (typeof t.salt != "string" || !/^[A-Za-z0-9_-]{22}$/.test(t.salt)) && a("invalid-argument", "Passwort\xE4nderung pr\xFCfen."), r.sessionKind !== "office" && a("permission-denied", "Mit dem pers\xF6nlichen B\xFCrozugang anmelden.");
    let u = await We(n, i), E = t.salt, p = await ae(i.OFFICE_PASSWORD_PEPPER, r.uid, E, t.passwordProof);
    return (await i.DB.prepare("UPDATE office_credentials_v2 SET salt=?,password_hash=?,must_change=0 WHERE uid=? AND password_hash=? AND active=1 AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))").bind(E, p, u.uid, u.credentialHash, u.uid).run()).meta.changes !== 1 && a("unauthenticated", "Kontofreigabe oder Passwort wurde inzwischen ge\xE4ndert."), await i.DB.batch([i.DB.prepare("DELETE FROM office_sessions WHERE uid=?").bind(u.uid), i.DB.prepare("DELETE FROM password_reset_requests WHERE uid=?").bind(u.uid)]), { data: { changed: true }, cookies: [Pe("", 0)] };
  }
  if (se(r, i) || a("permission-denied", "Nur der pers\xF6nliche Administratorzugang darf Passw\xF6rter wiederherstellen."), e === "listPasswordRequests") return R(t, []), { data: { requests: (await i.DB.prepare("SELECT r.uid,u.display_name AS displayName,c.username,r.requested_at AS requestedAt FROM password_reset_requests r JOIN users u ON u.uid=r.uid JOIN office_credentials_v2 c ON c.uid=r.uid ORDER BY r.requested_at LIMIT 100").all()).results } };
  R(t, ["uid", "username"]), (typeof t.uid != "string" || t.uid.length > 128) && a("invalid-argument", "Konto pr\xFCfen.");
  let o = we(t.username), s = await fe(i.DB, "SELECT roles FROM users WHERE uid=?", t.uid);
  (!s || !JSON.parse(s.roles).includes("office")) && a("not-found", "B\xFCrokonto fehlt."), t.uid === r.uid && a("failed-precondition", "Der pers\xF6nliche Administratorzugang wird \xFCber seine echte E-Mail wiederhergestellt.");
  let d = ke(18).toString("base64url"), c = ke(16).toString("base64url"), l = await ae(i.OFFICE_PASSWORD_PEPPER, t.uid, c, F(d));
  return await i.DB.batch([i.DB.prepare("INSERT INTO office_credentials_v2 VALUES (?,?,?,?,1,1) ON CONFLICT(uid) DO UPDATE SET username=excluded.username,salt=excluded.salt,password_hash=excluded.password_hash,active=1,must_change=1").bind(t.uid, o, c, l), i.DB.prepare("DELETE FROM office_sessions WHERE uid=?").bind(t.uid), i.DB.prepare("DELETE FROM office_attempts WHERE key=?").bind("user:" + t.uid), i.DB.prepare("DELETE FROM password_reset_requests WHERE uid=?").bind(t.uid)]), { data: { username: o, temporaryPassword: d, mustChangePassword: true } };
}
__name(lt, "lt");
async function ft(e, t, n) {
  se(n, t) || a("permission-denied", "Pers\xF6nlicher Administratorzugang zum Anlegen von Konten erforderlich."), R(e, ["requestId", "displayName", "roles", "username", "temporaryPasswordProof", "pin"]), (typeof e.requestId != "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.requestId) || !Array.isArray(e.roles) || !e.roles.length || e.roles.length > 2 || new Set(e.roles).size !== e.roles.length || e.roles.some((_) => !["driver", "office"].includes(_))) && a("invalid-argument", "Name und Rolle pr\xFCfen.");
  let i = "staff-" + e.requestId.toLowerCase(), r = O(e.displayName, 80, true), o = [...e.roles].sort(), s = o.includes("office"), d = o.includes("driver"), c = t.DB, l = s ? we(e.username) : null;
  (!s && ("username" in e || "temporaryPasswordProof" in e) || !d && "pin" in e) && a("invalid-argument", "Zugangsdaten passen nicht zur Rolle."), d && (typeof e.pin != "string" || !/^\d{6}$/.test(e.pin) || /^(\d)\1{5}$/.test(e.pin) || ["123456", "654321", "012345", "987654"].includes(e.pin)) && a("invalid-argument", "Eine pers\xF6nliche sechsstellige PIN ohne einfache Zahlenfolge w\xE4hlen.");
  let u = s ? ut(16).toString("base64url") : null, E = s ? await ae(t.OFFICE_PASSWORD_PEPPER, i, u, e.temporaryPasswordProof) : null, p = d ? ut(16).toString("base64url") : null, g = d ? ne(t.DRIVER_PIN_PEPPER, i, p, e.pin) : null;
  async function h() {
    let _ = await c.prepare("SELECT * FROM users WHERE uid=?").bind(i).first();
    if (!_) return false;
    let T = _.display_name === r && _.roles === JSON.stringify(o) && _.active === 1 && _.is_admin === 0;
    if (s) {
      let S = await c.prepare("SELECT * FROM office_credentials_v2 WHERE uid=?").bind(i).first();
      T = !!(T && S && S.username === l && S.active === 1 && S.must_change === 1 && S.password_hash === await ae(t.OFFICE_PASSWORD_PEPPER, i, S.salt, e.temporaryPasswordProof));
    }
    if (d) {
      let S = await c.prepare("SELECT * FROM driver_pins WHERE uid=?").bind(i).first();
      T = !!(T && S && S.active === 1 && S.pin_hash === ne(t.DRIVER_PIN_PEPPER, i, S.salt, e.pin));
    }
    return T || a("already-exists", "Dieser Anlegevorgang wurde bereits best\xE4tigt. Vorhandenes Konto in der Kontenliste pr\xFCfen."), true;
  }
  __name(h, "h");
  if (await h()) return { created: true, uid: i, username: l };
  s && await c.prepare("SELECT uid FROM office_credentials_v2 WHERE username=?").bind(l).first() && a("already-exists", "Dieser Benutzername ist bereits vergeben.");
  let v = [c.prepare("INSERT INTO users(uid,display_name,roles,active,is_admin,can_special) SELECT ?,?,?,1,0,0 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND is_admin=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office')) AND (SELECT count(*) FROM users)<100 AND (?=0 OR (SELECT count(*) FROM users WHERE EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))<50)").bind(i, r, JSON.stringify(o), n.uid, d ? 1 : 0)];
  s && v.push(c.prepare("INSERT INTO office_credentials_v2(uid,username,salt,password_hash,active,must_change) VALUES (?,?,?,?,1,1)").bind(i, l, u, E)), d && v.push(c.prepare("INSERT INTO driver_pins(uid,salt,pin_hash,active) VALUES (?,?,?,1)").bind(i, p, g));
  try {
    (await c.batch(v))[0].meta.changes !== 1 && a("failed-precondition", "Administratorfreigabe oder Kontolimit pr\xFCfen.");
  } catch {
    if (await h()) return { created: true, uid: i, username: l };
    s && await c.prepare("SELECT uid FROM office_credentials_v2 WHERE username=?").bind(l).first() && a("already-exists", "Dieser Benutzername ist bereits vergeben."), a("failed-precondition", "Konto nicht angelegt. Administratorfreigabe und Kontolimit pr\xFCfen; anschlie\xDFend erneut versuchen.");
  }
  return { created: true, uid: i, username: l };
}
__name(ft, "ft");
function k(e) {
  !w(e, "driver") && !w(e, "office") && a("permission-denied", "Kein aktiver Zustellzugang.");
}
__name(k, "k");
async function x(e, t, n, i) {
  k(n), i.driver_id !== t && a("permission-denied", "Tour ist einer anderen Person zugewiesen."), !w(n, "driver") && !await e.prepare("SELECT 1 FROM self_delivery_tours WHERE tour_id=? AND office_uid=?").bind(i.id, t).first() && a("permission-denied", "B\xFCrozug\xE4nge d\xFCrfen nur eigene Mitnahme-Touren ausliefern.");
}
__name(x, "x");
var De = "EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND (EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver') OR (EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=tours.id AND m.office_uid=users.uid))))";
async function Et(e, t, n, i) {
  k(n), R(i, ["tourId", "baseRevision", "expectedDriverId"]), I(i.tourId), (!Number.isSafeInteger(i.baseRevision) || i.baseRevision < 0) && a("invalid-argument", "Tourversion pr\xFCfen.");
  let r = await e.prepare("SELECT * FROM tours WHERE id=?").bind(i.tourId).first();
  return r ? (r.created_by !== t && a("permission-denied", "Nur selbst angelegte Touren d\xFCrfen gel\xF6scht werden."), r.driver_id !== i.expectedDriverId && a("failed-precondition", "Tour wurde inzwischen \xFCbernommen. Bitte neu laden."), (r.status !== "open" || r.started_at || r.start_id) && a("failed-precondition", "Nur noch nicht gestartete Touren d\xFCrfen gel\xF6scht werden."), (await e.prepare(`DELETE FROM tours WHERE id=? AND created_by=? AND status='open' AND started_at IS NULL AND start_id IS NULL
 AND COALESCE((SELECT revision FROM tour_activity_versions WHERE tour_id=tours.id),0)=?
 AND driver_id IS ?
 AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value IN('office','driver')))
 AND NOT EXISTS(SELECT 1 FROM proofs WHERE tour_id=tours.id)
 AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=tours.id)
 AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id AND (status!='offen' OR proof_id IS NOT NULL))`).bind(r.id, t, i.baseRevision, r.driver_id, t).run()).meta.changes < 1 && a("failed-precondition", "Tour wurde inzwischen ge\xE4ndert oder \xFCbernommen. Bitte neu laden."), { deleted: true }) : { deleted: true };
}
__name(Et, "Et");
async function pt(e, t) {
  if (!t.length) return;
  let n = (await e.prepare("SELECT tour_id,revision FROM tour_activity_versions WHERE tour_id IN(SELECT value FROM json_each(?))").bind(JSON.stringify(t.map((r) => r.id))).all()).results, i = new Map(n.map((r) => [r.tour_id, r.revision]));
  for (let r of t) r.activityRevision = i.get(r.id) || 0;
}
__name(pt, "pt");
async function mt(e, t, n, i) {
  C(n, "driver"), R(i, ["completionId", "capturedAt"]), M(i);
  let r = b(), o = (/* @__PURE__ */ new Date()).toISOString();
  await e.prepare("INSERT OR IGNORE INTO work_starts SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))").bind(t, r, o, i.capturedAt, i.completionId, t).run();
  let s = await e.prepare("SELECT day,started_at AS startedAt,captured_at AS capturedAt FROM work_starts WHERE uid=? AND day=?").bind(t, r).first();
  return s || a("permission-denied", "Fahrerzugang nicht mehr aktiv."), { workStart: s };
}
__name(mt, "mt");
async function gt(e, t, n, i, r) {
  let o = (await e.prepare("SELECT uid,(SELECT display_name FROM users WHERE users.uid=work_starts.uid) AS actorName,day,started_at AS startedAt,captured_at AS capturedAt FROM work_starts WHERE day=?" + (n === "office" ? "" : " AND uid=?")).bind(i, ...n === "office" ? [] : [t]).all()).results;
  for (let s of r) {
    let d = s.startedBy || s.driverId;
    s.workStart = o.find((l) => l.uid === d && l.day === s.date) || null;
    let c = r.filter((l) => (l.startedBy || l.driverId) === d && l.date === s.date && l.startedAt).sort((l, u) => l.startedAt.localeCompare(u.startedAt))[0];
    s.id === c?.id && s.workStart && s.startedAt >= s.workStart.startedAt && (s.preparationMinutes = Math.floor((Date.parse(s.startedAt) - Date.parse(s.workStart.startedAt)) / 6e4));
  }
  return o;
}
__name(gt, "gt");
function oe(e, t, n) {
  let i = /* @__PURE__ */ __name(() => {
    throw Object.assign(Error("Kassierten Betrag und Zahlungsgrund pr\xFCfen."), { code: "invalid-argument" });
  }, "i");
  if (!["collectedCents", "collectionReason"].some((d) => d in e)) return { collectedCents: n === "zugestellt" ? t : 0, collectionReason: "", collectionConfirmed: false };
  let o = e.collectedCents, s = e.collectionReason;
  return (!Number.isSafeInteger(o) || o < 0 || o > t || typeof s != "string" || s.length > 120) && i(), n !== "zugestellt" && (o !== 0 || s !== "") && i(), n === "zugestellt" && o < t && !["Keine pers\xF6nliche \xDCbergabe", "Kein Geld vorhanden", "Nur Teilbetrag vorhanden", "Zahlung abgelehnt", "\xDCberweist", "Sonstiger Grund"].includes(s) && i(), o === t && s !== "" && i(), { collectedCents: o, collectionReason: s, collectionConfirmed: true };
}
__name(oe, "oe");
function J(e) {
  return Number.isSafeInteger(e.collectedCents) ? e.collectedCents : e.status === "zugestellt" ? e.cents : 0;
}
__name(J, "J");
var Rr = /* @__PURE__ */ __name(async (e) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(e))))).map((t) => t.toString(16).padStart(2, "0")).join(""), "Rr");
async function ht(e, t, n, i, r) {
  k(n), R(r, i === "reopenDelivery" ? ["tourId", "stopId", "baseRevision", "reason", "cashCleared", "completionId", "capturedAt"] : ["tourId", "stopId", "baseRevision", "reason", "cents", "collectedCents", "collectionReason", "completionId", "capturedAt"]), M(r);
  let o = await Rr(r), s = await e.prepare("SELECT * FROM delivery_amendments WHERE id=?").bind(r.completionId).first();
  if (s) return (s.actor_uid !== t || s.fingerprint !== o) && a("already-exists", "Korrekturkennung bereits verwendet."), { saved: true, replacementId: JSON.parse(s.data).replacementId };
  let d = await e.prepare("SELECT * FROM tours WHERE id=?").bind(I(r.tourId)).first();
  d || a("not-found", "Tour fehlt."), await x(e, t, n, d), (!Number.isSafeInteger(r.baseRevision) || r.baseRevision < 0) && a("invalid-argument", "Korrekturversion pr\xFCfen.");
  let c = await e.prepare("SELECT * FROM stops WHERE id=? AND tour_id=?").bind(I(r.stopId), d.id).first();
  c || a("not-found", "P\xE4ckchen fehlt.");
  let l = (await e.prepare("SELECT * FROM delivery_amendments WHERE stop_id=? ORDER BY revision").bind(c.id).all()).results;
  (l.some((D) => D.kind === "reopen") || r.baseRevision !== (l.at(-1)?.revision || 0)) && a("failed-precondition", "P\xE4ckchen inzwischen korrigiert. Bitte neu laden."), await e.prepare("SELECT 1 FROM cash_settlements WHERE tour_id=?").bind(d.id).first() && a("failed-precondition", "Bereits abgerechnete Fahrten k\xF6nnen nicht korrigiert werden.");
  let u = JSON.parse(c.data), E = c.proof_id ? JSON.parse((await e.prepare("SELECT data FROM proofs WHERE id=?").bind(c.proof_id).first()).data) : null;
  E?.removed && a("failed-precondition", "Entfernte P\xE4ckchen bleiben als Entfernungsnachweis erhalten.");
  let p = l.filter((D) => D.kind === "money" && D.proof_id === c.proof_id).at(-1), g = p ? JSON.parse(p.data) : E || { ...u, collectedCents: 0 }, h = O(r.reason, 240, true);
  h.length < 3 && a("invalid-argument", "Bitte einen nachvollziehbaren Korrekturgrund eingeben.");
  let v = i === "reopenDelivery" ? "reopen" : "money", _ = (/* @__PURE__ */ new Date()).toISOString(), T = { collectedCents: 0, collectionReason: "", collectionConfirmed: true };
  if (v === "reopen") (d.status !== "running" || !E) && a("failed-precondition", "Nur best\xE4tigte Abschl\xFCsse einer laufenden Tour k\xF6nnen wieder ge\xF6ffnet werden."), r.cashCleared !== true && a("invalid-argument", "Vor dem Wieder\xF6ffnen best\xE4tigen: kein Geld kassiert oder vollst\xE4ndig zur\xFCckgegeben.");
  else {
    d.status === "running" || d.status === "finished" && E || a("failed-precondition", "Betragskorrektur erst w\xE4hrend der Fahrt oder vor der Abrechnung."), (!Number.isSafeInteger(r.cents) || r.cents < 0 || r.cents > 999999 || ["pflege", "partner"].includes(u.type) && r.cents !== 0) && a("invalid-argument", "Betrag pr\xFCfen; Pflege- und Partnerstopps bleiben bei 0 \u20AC.");
    try {
      T = oe({ collectedCents: r.collectedCents, collectionReason: r.collectionReason }, r.cents, c.status);
    } catch (D) {
      a("invalid-argument", D.message);
    }
    r.cents === g.cents && r.collectedCents === J({ ...g, status: c.status }) && a("invalid-argument", "Es wurde kein Betrag ge\xE4ndert.");
  }
  let S = { reason: h, actorName: n.displayName, previousCents: g.cents, previousCollectedCents: J({ ...g, status: c.status }), cents: v === "reopen" ? g.cents : r.cents, ...T, ...v === "reopen" ? { cashCleared: true, replacementId: crypto.randomUUID() } : {} };
  try {
    await e.prepare("INSERT INTO delivery_amendments VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(r.completionId, d.id, c.id, c.proof_id, t, r.baseRevision + 1, v, JSON.stringify(S), o, _, E?.completedAt || c.created_at).run();
  } catch {
    let m = await e.prepare("SELECT actor_uid,fingerprint,data FROM delivery_amendments WHERE id=?").bind(r.completionId).first();
    if (m?.actor_uid === t && m.fingerprint === o) return { saved: true, replacementId: JSON.parse(m.data).replacementId };
    a("failed-precondition", "Tour, Abrechnung oder P\xE4ckchen inzwischen ge\xE4ndert. Bitte neu laden.");
  }
  return { saved: true, replacementId: S.replacementId };
}
__name(ht, "ht");
async function _t(e, t, n) {
  if (!t.length) return;
  let i = (await e.prepare("SELECT * FROM delivery_amendments WHERE tour_id IN(SELECT value FROM json_each(?)) ORDER BY stop_id,revision LIMIT 10001").bind(JSON.stringify(t)).all()).results;
  i.length > 1e4 && a("resource-exhausted", "Zu viele Korrekturen f\xFCr eine \xDCbersicht. Bitte B\xFCro informieren.");
  let r = /* @__PURE__ */ new Map();
  for (let o of i) r.has(o.stop_id) || r.set(o.stop_id, []), r.get(o.stop_id).push(o);
  for (let o of Object.values(n)) for (let s of o) {
    let d = r.get(s.id) || [];
    s.amendmentRevision = d.at(-1)?.revision || 0, s.corrections = d.map((u) => ({ id: u.id, kind: u.kind, afterCompletion: !!u.proof_id, createdAt: u.created_at, actorUid: u.actor_uid, ...JSON.parse(u.data) }));
    let c = d.filter((u) => u.kind === "money" && u.proof_id && u.proof_id === s.proofId).at(-1);
    if (c) {
      let u = JSON.parse(c.data);
      s.cents = u.cents, s.collectedCents = u.collectedCents, s.collectionReason = u.collectionReason, s.collectionConfirmed = true;
    }
    let l = d.find((u) => u.kind === "reopen");
    l && (s.voided = true, s.replacementStopId = JSON.parse(l.data).replacementId);
  }
}
__name(_t, "_t");
async function St(e, t) {
  let n = (await e.prepare("SELECT kind,proof_id,created_at,data FROM delivery_amendments WHERE stop_id=? ORDER BY revision").bind(t.stopId).all()).results;
  return { ...t, corrections: n.map((i) => ({ kind: i.kind, afterCompletion: !!i.proof_id, createdAt: i.created_at, ...JSON.parse(i.data) })), voided: n.some((i) => i.kind === "reopen") };
}
__name(St, "St");
var vr = /* @__PURE__ */ __name(async (e) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(e))))).map((t) => t.toString(16).padStart(2, "0")).join(""), "vr");
async function Rt(e, t, n, i, r) {
  C(n, "driver");
  let o = i === "offerTourHandover";
  R(r, o ? ["tourId", "toUid", "completionId", "capturedAt"] : i === "acceptTourHandover" ? ["tourId", "offerId", "completionId", "capturedAt"] : ["tourId", "expectedDriverId", "completionId", "capturedAt"]), M(r);
  let s = await vr(r), d = o ? "tour_handover_offers" : "tour_assignments", c = await e.prepare("SELECT * FROM " + d + " WHERE id=?").bind(r.completionId).first();
  if (c) return ((o ? c.from_uid : c.actor_uid) !== t || c.fingerprint !== s) && a("already-exists", "\xDCbergabekennung bereits verwendet."), { saved: true };
  let l = await e.prepare("SELECT * FROM tours WHERE id=?").bind(I(r.tourId)).first();
  l || a("not-found", "Tour fehlt."), await e.prepare("SELECT 1 FROM self_delivery_tours WHERE tour_id=?").bind(l.id).first() && a("permission-denied", "Pers\xF6nliche Mitnahme-Touren werden nicht weitergegeben.");
  let u = (/* @__PURE__ */ new Date()).toISOString(), E = o ? I(r.toUid) : t, p = await e.prepare("SELECT * FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(roles) WHERE value='driver')").bind(E).first();
  (!p || E === l.driver_id) && a("failed-precondition", "Anderen aktiven Fahrer ausw\xE4hlen.");
  let g = await e.prepare("SELECT display_name FROM users WHERE uid=?").bind(l.driver_id).first();
  if (o) {
    (l.driver_id !== t || l.status !== "running") && a("permission-denied", "Nur die eigene laufende Tour kann zur \xDCbergabe angeboten werden.");
    let v = (await e.prepare("SELECT revision FROM tour_activity_versions WHERE tour_id=?").bind(l.id).first())?.revision || 0;
    try {
      await e.prepare("INSERT INTO tour_handover_offers VALUES (?,?,?,?,?,?,?,'pending',?)").bind(r.completionId, l.id, t, E, v, u, new Date(Date.now() + 15 * 6e4).toISOString(), s).run();
    } catch {
      a("failed-precondition", "Tour oder Fahrerkonto ge\xE4ndert. Bitte neu laden.");
    }
    return { saved: true };
  }
  let h = null;
  if (i === "takeOverOpenTour") (l.date !== b() || l.status !== "open" || l.driver_id !== r.expectedDriverId) && a("failed-precondition", "Tour wurde inzwischen \xFCbernommen oder gestartet. Bitte neu laden.");
  else {
    h = I(r.offerId);
    let v = await e.prepare("SELECT * FROM tour_handover_offers WHERE id=? AND tour_id=?").bind(h, l.id).first();
    (!v || v.to_uid !== t || v.from_uid !== l.driver_id || v.status !== "pending" || v.expires_at <= u) && a("failed-precondition", "\xDCbergabe nicht mehr verf\xFCgbar. Bitte neu anbieten lassen.");
  }
  try {
    await e.prepare("INSERT INTO tour_assignments VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(r.completionId, l.id, l.driver_id, t, t, h ? "confirmed" : "direct", h, JSON.stringify({ fromName: g?.display_name || "Noch nicht zugewiesen", toName: p.display_name, vehicleLabel: l.vehicle_label || null }), s, u, l.created_at).run();
  } catch {
    let v = await e.prepare("SELECT fingerprint,actor_uid FROM tour_assignments WHERE id=?").bind(r.completionId).first();
    (v?.actor_uid !== t || v?.fingerprint !== s) && a("failed-precondition", "Tour wurde inzwischen ge\xE4ndert. Erneute \xDCbergabe erforderlich.");
  }
  return { saved: true, tourId: l.id };
}
__name(Rt, "Rt");
async function vt(e, t, n, i) {
  let r = JSON.stringify(i.map((l) => l.id)), o = (await e.prepare("SELECT id,tour_id,from_uid,to_uid,kind,created_at,data FROM tour_assignments WHERE tour_id IN(SELECT value FROM json_each(?)) ORDER BY created_at,id").bind(r).all()).results, s = (await e.prepare("SELECT o.*,u.display_name AS to_name FROM tour_handover_offers o JOIN users u ON u.uid=o.to_uid WHERE o.from_uid=? AND o.status='pending' AND o.expires_at>? AND o.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions v WHERE v.tour_id=o.tour_id),0)").bind(t, (/* @__PURE__ */ new Date()).toISOString()).all()).results;
  for (let l of i) {
    let u = o.filter((p) => p.tour_id === l.id);
    l.assignmentHistory = u.map((p) => ({ kind: p.kind, createdAt: p.created_at, ...JSON.parse(p.data) })), l.startedBy = u.find((p) => p.kind === "confirmed")?.from_uid || l.driverId;
    let E = s.find((p) => p.tour_id === l.id);
    E && (l.handoverOffer = { toName: E.to_name, expiresAt: E.expires_at });
  }
  if (n !== "driver") return { incomingHandovers: [], handoverDrivers: [] };
  let d = (await e.prepare("SELECT o.id,o.tour_id AS tourId,o.expires_at AS expiresAt,t.type,t.vehicle_label AS vehicleLabel,u.display_name AS fromName FROM tour_handover_offers o JOIN tours t ON t.id=o.tour_id JOIN users u ON u.uid=o.from_uid WHERE o.to_uid=? AND o.status='pending' AND t.status='running' AND t.driver_id=o.from_uid AND o.expires_at>? AND o.activity_revision=COALESCE((SELECT revision FROM tour_activity_versions v WHERE v.tour_id=t.id),0) AND u.active=1 LIMIT 101").bind(t, (/* @__PURE__ */ new Date()).toISOString()).all()).results, c = (await e.prepare("SELECT uid,display_name AS displayName FROM users WHERE active=1 AND uid!=? AND EXISTS(SELECT 1 FROM json_each(roles) WHERE value='driver') ORDER BY display_name LIMIT 101").bind(t).all()).results;
  return { incomingHandovers: d, handoverDrivers: c };
}
__name(vt, "vt");
var sn = G(Be(), 1);
var ze = "one-year-v1";
function Ue(e = /* @__PURE__ */ new Date()) {
  if (!Number.isFinite(+e) || +e < Date.parse("2020-01-01")) throw Error("Invalid retention clock");
  return new Date(+e - 364 * 864e5).toISOString();
}
__name(Ue, "Ue");
function Nr(e, t = false) {
  let n = [["DROP TRIGGER proof_immutable_delete", []], ["DELETE FROM proofs WHERE id IN (SELECT id FROM proofs WHERE json_extract(data,'$.completedAt') < ? LIMIT 1000)", [e]], ["CREATE TRIGGER proof_immutable_delete BEFORE DELETE ON proofs BEGIN SELECT RAISE(ABORT,'immutable proof'); END", []], ["DELETE FROM stops WHERE id IN (SELECT s.id FROM stops s LEFT JOIN proofs p ON p.id=s.proof_id WHERE coalesce(s.completed_at,s.created_at) < ? AND p.id IS NULL LIMIT 1000) RETURNING id", [e]], ["DELETE FROM tour_orders WHERE tour_id IN (SELECT id FROM tours WHERE created_at < ? AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id))", [e]], ["DELETE FROM tours WHERE created_at < ? AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id)", [e]], ["DELETE FROM customers WHERE id IN (SELECT id FROM customers WHERE last_delivered_at < ? LIMIT 1000)", [e]], ["DELETE FROM address_locations WHERE id IN (SELECT id FROM address_locations WHERE updated_at < ? LIMIT 1000)", [e]], ["DELETE FROM routing_usage WHERE day < ?", [e.slice(0, 10)]]];
  return t && n.push(["DROP TRIGGER cash_settlement_immutable_delete", []], ["DELETE FROM cash_settlements WHERE tour_id IN (SELECT tour_id FROM cash_settlements WHERE retention_at < ? LIMIT 1000)", [e]], ["CREATE TRIGGER cash_settlement_immutable_delete BEFORE DELETE ON cash_settlements BEGIN SELECT RAISE(ABORT,'immutable cash settlement'); END", []]), n;
}
__name(Nr, "Nr");
async function It(e, { policy: t, now: n = /* @__PURE__ */ new Date() } = {}) {
  if (t !== ze) throw Error("Retention activation requires explicit policy approval");
  let i = await e.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='proof_immutable_delete'").first();
  if (!i?.sql?.includes("BEFORE DELETE ON proofs") || !i.sql.includes("RAISE(ABORT,'immutable proof')")) throw Error("Unexpected archive protection; cleanup stopped");
  let r = !!await e.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_settlements'").first();
  if (r) {
    let l = await e.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='cash_settlement_immutable_delete'").first();
    if (!l?.sql?.includes("BEFORE DELETE ON cash_settlements") || !l.sql.includes("RAISE(ABORT,'immutable cash settlement')")) throw Error("Unexpected cash archive protection; cleanup stopped");
  }
  let o = Ue(n), s = Nr(o, r), d = new Set((await e.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map((l) => l.name));
  for (let [l, u, E, p] of [["delivery_amendments", "retention_at", "amendment_immutable_delete", "immutable amendment"], ["tour_assignments", "retention_at", "assignment_immutable_delete", "immutable assignment"], ["tour_handover_offers", "created_at", null, null], ["work_starts", "started_at", null, null]]) d.has(l) && (E && s.push(["DROP TRIGGER " + E, []]), s.push(["DELETE FROM " + l + " WHERE " + u + " < ?", [o]]), E && s.push(["CREATE TRIGGER " + E + " BEFORE DELETE ON " + l + " BEGIN SELECT RAISE(ABORT,'" + p + "'); END", []]));
  let c = await e.batch(s.map(([l, u]) => u.length ? e.prepare(l).bind(...u) : e.prepare(l)));
  return { checkedAt: n.toISOString(), cutoff: o, maximumLiveDays: 364, deleted: { proofs: c[1].meta.changes, stops: c[3].results?.length ?? c[3].meta.changes, tourOrders: c[4].meta.changes, tours: c[5].meta.changes, customers: c[6].meta.changes, addressLocations: c[7].meta.changes, cashSettlements: r ? c[10].meta.changes : 0 } };
}
__name(It, "It");
var ce = G($(), 1);
var Ir = { recipient: "Pers\xF6nlich \xFCbergeben", neighbor: "Beim Nachbarn abgegeben", mailbox: "In den Briefkasten gelegt", dropoff: "Am Ablageort abgestellt" };
var Ar = ["Niemand angetroffen", "Nachbar nicht erreichbar", "Briefkasten nicht nutzbar", "Annahme verweigert", "Adresse nicht gefunden", "Sonstiger Grund"];
function At(e) {
  if (!Number.isSafeInteger(e) || e < 0 || e > 9999999) throw Error("Kilometerstand als ganze Zahl zwischen 0 und 9.999.999 eingeben.");
  return e;
}
__name(At, "At");
function yt(e, t, n = "recipient") {
  return e === "privat" && t === "zugestellt" && !["mailbox", "dropoff"].includes(n);
}
__name(yt, "yt");
function Ot(e, t) {
  let n = e.deliveryMethod ?? (e.status === "zugestellt" ? "recipient" : null), i = e.nonDeliveryReason ?? "", r = e.neighborName ?? "", o = e.dropoffLocation ?? "";
  if (typeof o != "string" || o.length > 160 || (n === "dropoff" ? !o.trim() : o)) throw Error("Ablageort angeben, zum Beispiel Garage.");
  if (typeof r != "string" || r.length > 90 || typeof i != "string" || i.length > 90) throw Error("Angaben zur \xDCbergabe pr\xFCfen.");
  if (e.status === "zugestellt") {
    if (!Object.hasOwn(Ir, n) || i || n !== "neighbor" && r) throw Error("\xDCbergabeart pr\xFCfen.");
  } else if (e.status === "nicht zugestellt") {
    if (n !== null || r || i && !Ar.includes(i)) throw Error("Grund f\xFCr Nichtzustellung pr\xFCfen.");
  } else throw Error("Zustellstatus pr\xFCfen.");
  return { deliveryMethod: n, nonDeliveryReason: i, neighborName: r.trim(), dropoffLocation: o.trim() };
}
__name(Ot, "Ot");
var K = G($(), 1);
function wt(e, t, n, i, r) {
  K.default.authorize(t, { role: "driver", active: true }, "driver"), K.default.identifiers(e), n.driverId !== t && K.default.reject("permission-denied", "Tour nicht zugewiesen."), (n.schemaVersion !== 2 || i.schemaVersion !== 2 || "signature" in i) && K.default.reject("failed-precondition", "Lieferdaten pr\xFCfen."), i.status !== "offen" && K.default.reject("already-exists", "Lieferung bereits abgeschlossen."), yt(i.type, e.status, e.deliveryMethod ?? "recipient") ? (typeof r != "string" || r.length > 18e4 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(r)) && K.default.reject("invalid-argument", "G\xFCltige Unterschrift erforderlich.") : r != null && K.default.reject("invalid-argument", "Unterschrift bei dieser \xDCbergabe nicht erlaubt.");
}
__name(wt, "wt");
var bt = G(Be(), 1);
var V = G($(), 1);
var Ce = /* @__PURE__ */ __name((e, t) => ((typeof e != "string" || e.length > t || e.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(e)) && V.default.reject("invalid-argument", "Invalid envelope"), Buffer.from(e, "base64")), "Ce");
var Dt;
var Ct;
function je(e) {
  if (e !== Dt) {
    let t = bt.default.keys(e), n = Ce(e.replace(/-----[^-]+-----|\s/g, ""), 1e4), i = crypto.subtle.importKey("pkcs8", n, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
    Ct = { keyId: t.keyId, publicKey: t.publicKey, rsa: i }, Dt = e;
  }
  return Ct;
}
__name(je, "je");
async function q(e, t, n, i = Date.now(), { photo: r = false } = {}) {
  (!e || Array.isArray(e) || Object.keys(e).some((E) => !["version", "keyId", "wrappedKey", "iv", "ciphertext"].includes(E)) || e.version !== 1) && V.default.reject("invalid-argument", "Invalid envelope");
  let o = je(n);
  e.keyId !== o.keyId && V.default.reject("failed-precondition", "Wrong key");
  let s = Ce(e.wrappedKey, 1024), d = Ce(e.iv, 32), c = Ce(e.ciphertext, r ? 11e5 : 26e4);
  (d.length !== 12 || c.length < 17) && V.default.reject("invalid-argument", "Invalid envelope");
  let l;
  try {
    let E = await o.rsa, p = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, E, s);
    if (p.byteLength !== 32) throw Error("Invalid AES key");
    let g = await crypto.subtle.importKey("raw", p, "AES-GCM", false, ["decrypt"]);
    new Uint8Array(p).fill(0);
    let h = await crypto.subtle.decrypt({ name: "AES-GCM", iv: d, additionalData: new TextEncoder().encode(JSON.stringify(t)) }, g, c);
    l = JSON.parse(new TextDecoder().decode(h));
  } catch {
    V.default.reject("invalid-argument", "Envelope changed");
  }
  (!l || Object.keys(l).some((E) => !["signature", "capturedAt", "driverComment"].includes(E)) || !(typeof l.signature == "string" && l.signature.length <= (r ? 8e5 : 18e4) || l.signature === null && typeof l.driverComment == "string") || typeof l.capturedAt != "string") && V.default.reject("invalid-argument", "Invalid payload");
  let u = Date.parse(l.capturedAt);
  return (!Number.isFinite(u) || u > i + 3e5 || i - u > 1728e5) && V.default.reject("failed-precondition", "Capture age"), l;
}
__name(q, "q");
var wr = /* @__PURE__ */ __name((e, t, n) => {
  let i = e + t - n, r = Math.abs(i - e), o = Math.abs(i - t), s = Math.abs(i - n);
  return r <= o && r <= s ? e : o <= s ? t : n;
}, "wr");
async function Ee(e, { photo: t = false } = {}) {
  (typeof e != "string" || e.length > (t ? 8e5 : 18e4) || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(e)) && a("invalid-argument", "Bild pr\xFCfen.");
  let n = Buffer.from(e.slice(22), "base64");
  (n.length < 45 || n.toString("base64") !== e.slice(22) || !n.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) && a("invalid-argument", "PNG pr\xFCfen.");
  let i = 8, r, o, s, d = false, c = false, l = false, u = false, E = 0, p = [];
  for (; i < n.length; ) {
    i + 12 > n.length && a("invalid-argument", "PNG besch\xE4digt.");
    let m = n.readUInt32BE(i), A = i + 12 + m;
    A > n.length && a("invalid-argument", "PNG besch\xE4digt.");
    let N = n.toString("ascii", i + 4, i + 8), f = n.subarray(i + 8, i + 8 + m);
    Or(n.subarray(i + 4, i + 8 + m)) !== n.readUInt32BE(i + 8 + m) && a("invalid-argument", "PNG besch\xE4digt."), !d && N !== "IHDR" && a("invalid-argument", "PNG-Kopf fehlt."), N === "IHDR" ? ((d || m !== 13) && a("invalid-argument", "PNG-Kopf pr\xFCfen."), d = true, r = f.readUInt32BE(0), o = f.readUInt32BE(4), (r < 1 || r > (t ? 640 : 600) || o < 1 || o > (t ? 640 : 150)) && a("invalid-argument", "Bildabmessungen zu gro\xDF."), (f[8] !== 8 || ![2, 6].includes(f[9]) || f[10] !== 0 || f[11] !== 0 || f[12] !== 0) && a("invalid-argument", "Unterschrift bitte in der App erfassen."), s = f[9] === 6 ? 4 : 3) : N === "IDAT" ? (l && a("invalid-argument", "PNG-Reihenfolge pr\xFCfen."), c = true, p.push(f), E += m) : N === "IEND" ? ((!c || m !== 0 || A !== n.length) && a("invalid-argument", "PNG-Abschluss pr\xFCfen."), u = true) : ((!["sRGB", "gAMA", "cHRM", "pHYs", "sBIT"].includes(N) || m > 32) && a("invalid-argument", "PNG-Zusatzdaten nicht zul\xE4ssig."), c && (l = true)), i = A;
  }
  (!u || !E) && a("invalid-argument", "PNG unvollst\xE4ndig.");
  let g = Buffer.concat(p, E), h = r * s, v = (h + 1) * o, _;
  try {
    _ = yr(g, { maxOutputLength: v });
  } catch {
    a("invalid-argument", "PNG besch\xE4digt oder zu gro\xDF.");
  }
  _.length !== v && a("invalid-argument", "PNG-Bildgr\xF6\xDFe pr\xFCfen.");
  for (let m = 0; m < o; m++) _[m * (h + 1)] > 4 && a("invalid-argument", "PNG-Filter pr\xFCfen.");
  if (t) return { width: r, height: o, bytes: n.length };
  let T = new Uint8Array(h), S = new Uint8Array(h), D = 0;
  for (let m = 0; m < o; m++) {
    let A = m * (h + 1), N = _[A];
    if (N > 4 && a("invalid-argument", "PNG-Filter pr\xFCfen."), N === 0) S.set(_.subarray(A + 1, A + 1 + h));
    else for (let f = 0; f < h; f++) {
      let y = f >= s ? S[f - s] : 0, j = T[f], Fe = f >= s ? T[f - s] : 0, ee = _[A + 1 + f];
      N === 1 ? ee += y : N === 2 ? ee += j : N === 3 ? ee += y + j >>> 1 : N === 4 && (ee += wr(y, j, Fe)), S[f] = ee & 255;
    }
    for (let f = 0; f < h; f += s) (s === 3 || S[f + 3] > 32) && (S[f] < 200 || S[f + 1] < 200 || S[f + 2] < 200) && D++;
    if (D >= 10) return { width: r, height: o, bytes: n.length };
    [T, S] = [S, T];
  }
  return D < 10 && a("invalid-argument", "Unterschrift ist leer."), { width: r, height: o, bytes: n.length };
}
__name(Ee, "Ee");
var Lt = /* @__PURE__ */ __name(async (e) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", e))).map((t) => t.toString(16).padStart(2, "0")).join(""), "Lt");
async function Ft(e, t, n, i, r, o) {
  if (i === "downloadCashSettlement") {
    C(n, "office"), R(r, ["tourId"]);
    let _ = await e.prepare("SELECT data FROM cash_settlements WHERE tour_id=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))").bind(I(r.tourId), t).first();
    return _ || a("not-found", "Abrechnungsnachweis fehlt oder Zugriff ge\xE4ndert."), { proof: JSON.parse(_.data), filename: "Abrechnung-Marienapotheke-" + r.tourId + ".pdf" };
  }
  let s = w(n, "office");
  s || C(n, "driver"), R(r, ["tourId", "signerName", "collectedCents", "completionId", "capturedAt", "sealedSignature"]), M(r);
  let d = await e.prepare("SELECT * FROM tours WHERE id=?").bind(I(r.tourId)).first();
  (!d || !s && d.driver_id !== t) && a("permission-denied", "Abrechnung geh\xF6rt zu einem anderen Fahrer."), d.status !== "finished" && a("failed-precondition", "Zuerst Tourende vollst\xE4ndig \xFCbertragen und best\xE4tigen lassen."), d.created_at < Ue() && a("failed-precondition", "Aufbewahrungsfrist dieser Tour ist abgelaufen.");
  let c = s ? n.displayName : O(r.signerName, 80, true);
  s && r.signerName !== c && a("invalid-argument", "Die Abrechnung wird dem angemeldeten B\xFCrozugang zugeordnet."), (c.length < 2 || !Number.isSafeInteger(r.collectedCents) || r.collectedCents < 0) && a("invalid-argument", "Name und Abrechnungsbetrag pr\xFCfen.");
  let l = await Lt(new TextEncoder().encode(JSON.stringify(r))), u = await e.prepare("SELECT * FROM cash_settlements WHERE tour_id=?").bind(d.id).first();
  if (u) {
    if ((JSON.parse(u.data).settledByUid || u.driver_id) === t && u.completion_id === r.completionId && u.fingerprint === l) return { saved: true };
    a("already-exists", "Die Abrechnung ist bereits unterschrieben.");
  }
  let E = { uid: t, tourId: d.id, purpose: "marien-cash-settlement", completionId: r.completionId }, p = await q(r.sealedSignature, E, o.DELIVERY_PROOF_PRIVATE_KEY);
  p.capturedAt !== r.capturedAt && a("invalid-argument", "Erfassungszeit ver\xE4ndert."), await Ee(p.signature);
  let g = await e.prepare("SELECT coalesce(sum(effective_collected_cents),0) cents FROM current_proof_payments WHERE tour_id=? AND json_extract(data,'$.status')='zugestellt' AND effective_origin='Marienapotheke'").bind(d.id).first();
  g.cents !== r.collectedCents && a("failed-precondition", "Abrechnungsbetrag ge\xE4ndert. Tour aktualisieren und erneut pr\xFCfen.");
  let h = await e.prepare("SELECT display_name FROM users WHERE uid=?").bind(d.driver_id).first(), v = { settledByUid: t, settledByName: n.displayName, kind: "cash-settlement", origin: "Marienapotheke", tourId: d.id, tourType: d.type, tourDate: d.date, driverId: d.driver_id, driverName: h?.display_name || "Archivierter Zugang", signerName: c, signerIdentity: s ? "authenticated-office-account" : "name-entered-on-driver-device", collectedCents: g.cents, tourEndedAt: d.ended_at, capturedAtClient: r.capturedAt, completedAt: (/* @__PURE__ */ new Date()).toISOString(), retentionAt: d.created_at, signature: p.signature, signatureSha256: await Lt(Buffer.from(p.signature.slice(22), "base64")) };
  try {
    await e.prepare("INSERT INTO cash_settlements VALUES (?,?,?,?,?,?,?)").bind(d.id, d.driver_id, r.completionId, l, g.cents, d.created_at, JSON.stringify(v)).run();
  } catch (_) {
    let T = await e.prepare("SELECT * FROM cash_settlements WHERE tour_id=?").bind(d.id).first();
    if (T) {
      if ((JSON.parse(T.data).settledByUid || T.driver_id) === t && T.completion_id === r.completionId && T.fingerprint === l) return { saved: true };
      a("already-exists", "Die Abrechnung ist bereits unterschrieben.");
    }
    throw _;
  }
  return { saved: true };
}
__name(Ft, "Ft");
var Mt = G($(), 1);
async function kt(e, t, n, i, r) {
  k(n), R(i, ["tourId", "stopId", "completionId", "capturedAt", "sealedSignature"]), M(i);
  let o = I(i.tourId), s = I(i.stopId), d = Mt.default.identifiers(i), c = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(i))))).map((S) => S.toString(16).padStart(2, "0")).join(""), l = /* @__PURE__ */ __name(() => e.prepare("SELECT * FROM proofs WHERE id=?").bind(d).first(), "l"), u = /* @__PURE__ */ __name((S) => S?.driver_id === t && S.completion_id === i.completionId && S.fingerprint === c, "u"), E = await l();
  if (E) {
    if (u(E)) return { completed: true };
    a("already-exists", "P\xE4ckchen bereits abgeschlossen oder entfernt.");
  }
  let p = await e.prepare("SELECT * FROM tours WHERE id=?").bind(o).first();
  p || a("not-found", "Tour fehlt."), await x(e, t, n, p), p.status !== "running" && a("failed-precondition", "Entfernen ist nur w\xE4hrend der laufenden Tour m\xF6glich.");
  let g = await e.prepare("SELECT * FROM stops WHERE id=? AND tour_id=?").bind(s, o).first();
  (!g || g.status !== "offen" || g.proof_id) && a("failed-precondition", "Nur offene P\xE4ckchen d\xFCrfen entfernt werden.");
  let h = await q(i.sealedSignature, { uid: t, tourId: o, stopId: s, completionId: i.completionId }, r.DELIVERY_PROOF_PRIVATE_KEY);
  (h.capturedAt !== i.capturedAt || h.signature !== null) && a("invalid-argument", "Entfernungsbest\xE4tigung pr\xFCfen.");
  let v = O(h.driverComment, 240, true);
  v.length < 3 && a("invalid-argument", "Bitte einen nachvollziehbaren Entfernungsgrund eingeben.");
  let _ = JSON.parse(g.data), T = { ..._, parcelCount: Y(_.parcelCount), originalCents: te(_), cents: te(_), collectedCents: 0, collectionReason: "", collectionConfirmed: true, kind: "package-removal", removed: true, removalReason: v, removedBy: t, removedByName: n.displayName, tourId: o, stopId: s, driverId: t, status: "nicht zugestellt", completedAt: (/* @__PURE__ */ new Date()).toISOString(), capturedAtClient: i.capturedAt, signature: null, signatureSha256: null };
  try {
    await e.prepare("INSERT INTO proofs VALUES (?,?,?,?,?,?,?)").bind(d, o, s, t, i.completionId, c, JSON.stringify(T)).run();
  } catch {
    if (u(await l())) return { completed: true };
    a("failed-precondition", "P\xE4ckchen oder Tour inzwischen ge\xE4ndert. Bitte neu laden.");
  }
  return { completed: true };
}
__name(kt, "kt");
async function Ht(e, t, n, i) {
  let r = w(n, "office");
  r || C(n, "driver");
  let o = I(i.tourId), s = I(i.stopId), d = i.baseRevision;
  (!Number.isSafeInteger(d) || d < 0 || d >= Number.MAX_SAFE_INTEGER) && a("invalid-argument", "P\xE4ckchenversion pr\xFCfen.");
  let c = await e.prepare("SELECT * FROM tours WHERE id=?").bind(o).first();
  c || a("not-found", "Tour fehlt."), ["open", "running"].includes(c.status) || a("failed-precondition", "P\xE4ckchenkorrekturen sind bis zum Tourende m\xF6glich."), c.status === "running" ? (r && c.driver_id !== t && a("failed-precondition", "W\xE4hrend der Tour darf nur die zugewiesene Person korrigieren."), await x(e, t, n, c)) : !r && c.driver_id !== t && a("permission-denied", "Nur eigene P\xE4ckchen d\xFCrfen ge\xE4ndert werden.");
  let l = await e.prepare("SELECT * FROM stops WHERE id=? AND tour_id=?").bind(s, o).first();
  l || a("not-found", "P\xE4ckchen fehlt.");
  let u = JSON.parse(l.data), E = (await e.prepare("SELECT * FROM delivery_amendments WHERE stop_id=? ORDER BY revision").bind(s).all()).results;
  E.some((U) => U.kind === "reopen") && a("failed-precondition", "Zur\xFCckgenommene P\xE4ckchen bleiben im Verlauf. Bitte den Ersatzstopp bearbeiten.");
  let p = E.at(-1)?.revision || 0;
  i.baseAmendmentRevision !== void 0 && i.baseAmendmentRevision !== p && a("failed-precondition", "Betr\xE4ge inzwischen korrigiert. Bitte neu laden."), l.proof_id && i.baseAmendmentRevision === void 0 && a("failed-precondition", "F\xFCr Korrekturen nach Zustellung aktuelle App \xF6ffnen.");
  let { stopId: g, baseRevision: h, baseAmendmentRevision: v, collectedCents: _, collectionReason: T, correctionReason: S, ...D } = i;
  D.parcelCount === void 0 && (D.parcelCount = u.parcelCount), D.secondName === void 0 && (D.secondName = u.secondName);
  let m = re(D, { regularType: c.regular_type }), A = u._corrections || [];
  A.length >= 100 && a("resource-exhausted", "Korrekturgrenze erreicht. Bitte B\xFCro informieren.");
  let N = null, f = null;
  if (l.proof_id) {
    let U = await e.prepare("SELECT data FROM proofs WHERE id=?").bind(l.proof_id).first();
    U || a("failed-precondition", "Zustellnachweis fehlt.");
    let he = JSON.parse(U.data);
    he.removed && a("failed-precondition", "Entfernte P\xE4ckchen bleiben im Verlauf.");
    let _e = E.filter((Re) => Re.kind === "money" && Re.proof_id === l.proof_id).at(-1), X = { ...he, ..._e ? JSON.parse(_e.data) : {} }, Se;
    try {
      Se = oe({ collectedCents: _ ?? J(X), collectionReason: T ?? X.collectionReason ?? "" }, m.cents, l.status);
    } catch (Re) {
      a("invalid-argument", Re.message);
    }
    f = { cents: X.cents, collectedCents: J(X), collectionReason: X.collectionReason || "" }, (m.cents !== X.cents || Se.collectedCents !== f.collectedCents || Se.collectionReason !== f.collectionReason) && (N = { reason: S ? O(S, 240, true) : "P\xE4ckchendaten korrigiert", actorName: n.displayName, previousCents: X.cents, previousCollectedCents: f.collectedCents, cents: m.cents, ...Se });
  } else (_ !== void 0 || T !== void 0) && a("invalid-argument", "Zahlung erst bei Zustellung erfassen.");
  let y = (/* @__PURE__ */ new Date()).toISOString(), j = Object.fromEntries(Object.keys(m).map((U) => [U, u[U]]));
  f && (j.cents = f.cents);
  let Fe = { by: t, actorName: n.displayName, at: y, afterDelivery: !!l.proof_id, before: j, after: m, ...N ? { paymentBefore: f, paymentAfter: { cents: N.cents, collectedCents: N.collectedCents, collectionReason: N.collectionReason } } : {} }, tr = e.prepare("UPDATE stops SET data=? WHERE id=? AND tour_id=? AND COALESCE(json_extract(data,'$._editVersion'),0)=? AND status=? AND proof_id IS ? AND COALESCE((SELECT max(revision) FROM delivery_amendments WHERE stop_id=stops.id),0)=? AND NOT EXISTS(SELECT 1 FROM cash_settlements WHERE tour_id=stops.tour_id) AND NOT EXISTS(SELECT 1 FROM delivery_amendments WHERE stop_id=stops.id AND kind='reopen') AND EXISTS(SELECT 1 FROM tours t JOIN users u ON u.uid=? WHERE t.id=stops.tour_id AND u.active=1 AND ((t.status='open' AND (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office') OR (t.driver_id=u.uid AND EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver')))) OR (t.status='running' AND t.driver_id=u.uid AND (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='driver') OR (EXISTS(SELECT 1 FROM json_each(u.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id AND m.office_uid=u.uid)))))) RETURNING id").bind(JSON.stringify({ ...m, _editVersion: d + 1, _corrections: [...A, Fe] }), s, o, d, l.status, l.proof_id, p, t), rr = e.prepare("INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT ?,COALESCE((SELECT json_group_array(id) FROM (SELECT id FROM stops WHERE tour_id=? AND status='offen' ORDER BY created_at,id)),'[]'),1,? WHERE changes()=1 ON CONFLICT(tour_id) DO UPDATE SET revision=tour_orders.revision+1,updated_at=excluded.updated_at").bind(o, o, y), Ye = [tr, rr];
  if (N) {
    let U = crypto.randomUUID(), he = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(i))))).map((_e) => _e.toString(16).padStart(2, "0")).join("");
    Ye.push(e.prepare("INSERT INTO delivery_amendments SELECT ?,?,?,?,?,?,'money',?,?,?,? WHERE changes()=1").bind(U, o, s, l.proof_id, t, p + 1, JSON.stringify(N), he, y, l.completed_at || l.created_at));
  }
  return (await e.batch(Ye))[0].results?.length !== 1 && a("failed-precondition", "P\xE4ckchen, Betr\xE4ge oder Tour inzwischen ge\xE4ndert. Bitte neu laden."), { updated: true };
}
__name(Ht, "Ht");
async function Pt(e, t) {
  let n = await e.prepare("SELECT data FROM stops WHERE id=? AND tour_id=?").bind(t.stopId, t.tourId).first();
  if (!n) return { ...t, packageCorrections: [] };
  let { _editVersion: i, _corrections: r = [], ...o } = JSON.parse(n.data);
  return { ...t, packageCorrections: r, currentPackage: o };
}
__name(Pt, "Pt");
async function Wt(e, t, n, i, r) {
  if (i === "updatePackage") return Ht(e, t, n, r);
  let o = w(n, "office");
  o || C(n, "driver");
  let s = I(r.stopId), d = I(r.tourId), c = r.baseRevision;
  (!Number.isSafeInteger(c) || c < 0 || c >= Number.MAX_SAFE_INTEGER) && a("invalid-argument", "P\xE4ckchenversion pr\xFCfen.");
  let l = await e.prepare("SELECT * FROM tours WHERE id=?").bind(d).first();
  l || a("not-found", "Tour fehlt."), !o && l.driver_id !== t && a("permission-denied", "Nur eigene P\xE4ckchen d\xFCrfen ge\xE4ndert werden."), l.status !== "open" && a("failed-precondition", "P\xE4ckchen d\xFCrfen nur vor Tourstart ge\xE4ndert oder gel\xF6scht werden.");
  let u = "status='offen' AND proof_id IS NULL AND COALESCE(json_extract(data,'$._editVersion'),0)=? AND EXISTS(SELECT 1 FROM tours WHERE id=stops.tour_id AND status='open' AND (driver_id=? OR ?=1)) AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value=?))", E = [s, d, c, t, o ? 1 : 0, t, o ? "office" : "driver"], p;
  if (i === "deletePackage") R(r, ["tourId", "stopId", "baseRevision"]), p = e.prepare("DELETE FROM stops WHERE id=? AND tour_id=? AND " + u + " RETURNING id").bind(...E);
  else {
    let { stopId: _, baseRevision: T, ...S } = r;
    if (S.parcelCount === void 0 || S.secondName === void 0) {
      let m = await e.prepare("SELECT data FROM stops WHERE id=? AND tour_id=?").bind(s, d).first();
      if (m) {
        let A = JSON.parse(m.data);
        S.parcelCount === void 0 && (S.parcelCount = A.parcelCount), S.secondName === void 0 && (S.secondName = A.secondName);
      }
    }
    let D = re(S, { regularType: l.regular_type });
    p = e.prepare("UPDATE stops SET data=? WHERE id=? AND tour_id=? AND " + u).bind(JSON.stringify({ ...D, _editVersion: c + 1 }), ...E);
  }
  let g = i === "deletePackage" ? "(SELECT json_group_array(value) FROM (SELECT value FROM json_each(tour_orders.stop_ids) WHERE value!=? ORDER BY key))" : "tour_orders.stop_ids", h = e.prepare("INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT ?,COALESCE((SELECT json_group_array(id) FROM (SELECT id FROM stops WHERE tour_id=? AND status='offen' ORDER BY created_at,id)),'[]'),1,? WHERE changes()=1 ON CONFLICT(tour_id) DO UPDATE SET stop_ids=" + g + ",revision=tour_orders.revision+1,updated_at=excluded.updated_at").bind(d, d, (/* @__PURE__ */ new Date()).toISOString(), ...i === "deletePackage" ? [s] : []);
  return (await e.batch([p, h]))[0].meta.changes < 1 && a("failed-precondition", "P\xE4ckchen oder Tour wurde inzwischen ge\xE4ndert. Bitte neu laden."), i === "deletePackage" ? { deleted: true } : { updated: true };
}
__name(Wt, "Wt");
var Ke = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
var zt = "https://firebaseappcheck.googleapis.com/v1/jwks";
var xt = /* @__PURE__ */ new Map();
var Q = /* @__PURE__ */ new Map();
var be = /* @__PURE__ */ new Map();
var Je = /* @__PURE__ */ __name((e) => Uint8Array.from(atob(e.replace(/-/g, "+").replace(/_/g, "/")), (t) => t.charCodeAt(0)), "Je");
async function Bt(e, t = false) {
  let n = xt.get(e), i = Date.now();
  if (n && n.expires > i && (!t || i - n.fetched < 6e4)) return n;
  if (be.has(e)) return be.get(e);
  let r = (async () => {
    let o;
    try {
      o = await fetch(e, { signal: AbortSignal.timeout(8e3) });
    } catch {
      a("unavailable", "Anmeldung kann derzeit nicht gepr\xFCft werden.");
    }
    o.ok || a("unavailable", "Anmeldung kann derzeit nicht gepr\xFCft werden.");
    let s = await o.json(), d = Math.min(21600, Number(o.headers.get("Cache-Control")?.match(/max-age=(\d+)/)?.[1]) || 300), c = { value: s, expires: Date.now() + d * 1e3, fetched: Date.now(), imported: /* @__PURE__ */ new Map() };
    return xt.set(e, c), c;
  })();
  be.set(e, r);
  try {
    return await r;
  } finally {
    be.delete(e);
  }
}
__name(Bt, "Bt");
async function Cr(e, t) {
  let n = await Bt(e), i = /* @__PURE__ */ __name((o) => e === Ke ? Object.hasOwn(o.value, t) && o.value[t] : o.value.keys?.find((s) => s.kid === t && s.kty === "RSA"), "i"), r = i(n);
  return r || (n = await Bt(e, true), r = i(n)), r || a("unauthenticated", "Anmeldung erneut pr\xFCfen."), n.imported.has(t) || n.imported.set(t, (async () => {
    let o = e === Ke ? Dr(r).export({ format: "jwk" }) : r;
    return crypto.subtle.importKey("jwk", o, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  })()), n.imported.get(t);
}
__name(Cr, "Cr");
async function Ut(e, t) {
  (typeof e != "string" || e.length > 16384) && a("unauthenticated", "Anmeldung erforderlich.");
  let n, i, r, o = Q.get(t + "|" + e);
  if (o && o.until > Date.now() && o.claims.exp > Math.floor(Date.now() / 1e3)) return o.claims;
  try {
    if (r = e.split("."), r.length !== 3) throw Error();
    n = JSON.parse(new TextDecoder().decode(Je(r[0]))), i = JSON.parse(new TextDecoder().decode(Je(r[1])));
  } catch {
    a("unauthenticated", "Anmeldung ung\xFCltig.");
  }
  (n.alg !== "RS256" || typeof n.kid != "string" || n.kid.length > 128 || t === zt && n.typ !== "JWT") && a("unauthenticated", "Anmeldung ung\xFCltig.");
  let s = Math.floor(Date.now() / 1e3);
  (!Number.isFinite(i.exp) || i.exp <= s || !Number.isFinite(i.iat) || i.iat > s || typeof i.sub != "string" || !i.sub || i.sub.length > 128) && a("unauthenticated", "Anmeldung abgelaufen oder ung\xFCltig.");
  let d = false, c = await Cr(t, n.kid);
  try {
    d = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", c, Je(r[2]), new TextEncoder().encode(r[0] + "." + r[1]));
  } catch {
  }
  d || a("unauthenticated", "Anmeldung ung\xFCltig.");
  for (let [l, u] of Q) u.until <= Date.now() && Q.delete(l);
  return Q.size >= 256 && Q.delete(Q.keys().next().value), Q.set(t + "|" + e, { claims: i, until: Math.min(Date.now() + 6e4, i.exp * 1e3) }), i;
}
__name(Ut, "Ut");
async function jt(e, t) {
  (t.FIREBASE_PROJECT_ID !== "marap024-botendienst-test" || t.FIREBASE_PROJECT_NUMBER !== "233196612528") && a("failed-precondition", "Nur das freigegebene Testprojekt ist zul\xE4ssig.");
  let n = e.headers.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_.-]+)$/), i = await Ut(n?.[1], Ke);
  return (i.aud !== t.FIREBASE_PROJECT_ID || i.iss !== "https://securetoken.google.com/" + t.FIREBASE_PROJECT_ID || !Number.isFinite(i.auth_time) || i.auth_time > Math.floor(Date.now() / 1e3) || i.email_verified !== true) && a("unauthenticated", "Mitarbeiter-Anmeldung und E-Mail-Best\xE4tigung pr\xFCfen."), await pe(e, t), { uid: i.sub, email: i.email };
}
__name(jt, "jt");
async function pe(e, t) {
  (t.FIREBASE_PROJECT_ID !== "marap024-botendienst-test" || t.FIREBASE_PROJECT_NUMBER !== "233196612528") && a("failed-precondition", "Nur das freigegebene Testprojekt ist zul\xE4ssig.");
  let n = await Ut(e.headers.get("X-Firebase-AppCheck"), zt);
  (n.iss !== "https://firebaseappcheck.googleapis.com/" + t.FIREBASE_PROJECT_NUMBER || !Array.isArray(n.aud) || !n.aud.includes("projects/" + t.FIREBASE_PROJECT_NUMBER) || n.sub !== t.FIREBASE_APP_ID) && a("unauthenticated", "App-Pr\xFCfung fehlgeschlagen.");
}
__name(pe, "pe");
var H = /* @__PURE__ */ __name((e) => String(e || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE"), "H");
var Jt = /* @__PURE__ */ __name((e) => H(e).replace(/\s*(?:\(mosel\)|an der mosel)\s*$/, "").replace(/\b(?:ortsteil|ot)\.?\s*/g, " ").replace(/[-–—,()/]+/g, " ").replace(/\s+/g, " ").trim(), "Jt");
var Lr = { street: "Friedrichstra\xDFe 14", postalCode: "54470", city: "Bernkastel-Kues" };
function Fr(e, t) {
  let n = Jt(e), i = [...new Set(["city", "town", "village", "municipality", "suburb", "district"].map((r) => t[r]).filter(Boolean).map(Jt))];
  return i.some((r) => r === n || i.some((o) => r !== o && (r + " " + o === n || o + " " + r === n)));
}
__name(Fr, "Fr");
var Kt = /* @__PURE__ */ __name((e) => H(e).replace(/(?:straße|strasse|str\.)(?=\s|$)/g, "strasse"), "Kt");
var Xe = /* @__PURE__ */ __name((e) => br("sha256").update(JSON.stringify(e)).digest("hex"), "Xe");
function Gt(e) {
  return { customerId: Xe([H(e.name), H(e.street), e.postalCode, H(e.city)]), customerSearchName: H(e.name) };
}
__name(Gt, "Gt");
var Le = /* @__PURE__ */ __name((e, t, ...n) => e.prepare(t).bind(...n).first(), "Le");
async function Ve(e, t, n, i) {
  k(i);
  let r = await Le(e, "SELECT * FROM tours WHERE id=?", I(n));
  return r || a("permission-denied", "Nur eigene Touren k\xF6nnen sortiert werden."), await x(e, t, i, r), r.status === "finished" && a("failed-precondition", "Tour bereits beendet."), r;
}
__name(Ve, "Ve");
var Mr = "EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND (EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver') OR (EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office') AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.office_uid=users.uid AND m.tour_id=?))))";
async function Vt(e, t, n, i, r = null) {
  R(i, ["tourId", "stopIds", "baseRevision"]), await Ve(e, t, i.tourId, n), (!Array.isArray(i.stopIds) || i.stopIds.length > 1e3 || new Set(i.stopIds).size !== i.stopIds.length || i.stopIds.some((c) => typeof c != "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(c)) || !Number.isSafeInteger(i.baseRevision) || i.baseRevision < 0) && a("invalid-argument", "Stoppreihenfolge pr\xFCfen.");
  let o = JSON.stringify(i.stopIds), s = i.baseRevision + 1;
  return (await e.prepare(`INSERT INTO tour_orders(tour_id,stop_ids,revision,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM tours WHERE id=? AND driver_id=? AND status IN('open','running')) AND ${Mr} AND (SELECT count(*) FROM stops WHERE tour_id=? AND status='offen')=json_array_length(?) AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN stops s ON s.id=j.value AND s.tour_id=? AND s.status='offen' WHERE s.id IS NULL) AND (? IS NULL OR NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN stops s ON s.id=json_extract(j.value,'$.id') WHERE s.id IS NULL OR s.data!=json_extract(j.value,'$.data'))) AND COALESCE((SELECT revision FROM tour_orders WHERE tour_id=?),0)=? ON CONFLICT(tour_id) DO UPDATE SET stop_ids=excluded.stop_ids,revision=excluded.revision,updated_at=excluded.updated_at WHERE tour_orders.revision=?`).bind(i.tourId, o, s, (/* @__PURE__ */ new Date()).toISOString(), i.tourId, t, t, i.tourId, i.tourId, o, o, i.tourId, r && JSON.stringify(r), r && JSON.stringify(r), i.tourId, i.baseRevision, i.baseRevision).run()).meta.changes < 1 && a("failed-precondition", "Tour oder Stopps wurden inzwischen ge\xE4ndert. Bitte neu laden."), { revision: s, stopIds: i.stopIds };
}
__name(Vt, "Vt");
async function $t(e, t, n) {
  if (!t.length) return;
  let i = (await e.prepare("SELECT * FROM tour_orders WHERE tour_id IN(SELECT value FROM json_each(?))").bind(JSON.stringify(t.map((o) => o.id))).all()).results, r = new Map(i.map((o) => [o.tour_id, o]));
  for (let o of t) {
    let s = r.get(o.id);
    if (o.orderRevision = s?.revision || 0, s) {
      let d = JSON.parse(s.stop_ids), c = new Map(d.map((l, u) => [l, u]));
      n[o.id]?.sort((l, u) => (c.get(l.id) ?? 1e5) - (c.get(u.id) ?? 1e5));
    }
  }
}
__name($t, "$t");
async function Yt(e, t) {
  t > 2500 && a("resource-exhausted", "Kostenloses Kartenkontingent gesch\xFCtzt. Bitte manuell sortieren.");
  let n = Date.now(), i = n - 864e5;
  await e.prepare("DELETE FROM routing_credit_events WHERE at<=?").bind(i).run(), (await e.prepare("INSERT INTO routing_credit_events SELECT ?,?,? WHERE COALESCE((SELECT sum(credits) FROM routing_credit_events WHERE at>?),0)+?<=2500").bind(crypto.randomUUID(), n, t, i, t).run()).meta.changes !== 1 && a("resource-exhausted", "Kostenloses Kartenkontingent gesch\xFCtzt. Bitte manuell sortieren."), await e.prepare("INSERT INTO routing_usage VALUES (?,?) ON CONFLICT(day) DO UPDATE SET credits=credits+excluded.credits").bind(b(), t).run();
}
__name(Yt, "Yt");
async function Zt(e, t) {
  let n;
  try {
    n = await fetch(e, { ...t, signal: AbortSignal.timeout(12e3) });
  } catch {
    a("unavailable", "Kartenberechnung nicht erreichbar. Reihenfolge bleibt erhalten.");
  }
  return n.ok || a("unavailable", "Kartenberechnung nicht best\xE4tigt. Bitte manuell sortieren."), n.json();
}
__name(Zt, "Zt");
async function Xt(e, t, n, allowSuggestions=false) {
  let i = Xe(["city-checked-v3", H(t.street), t.postalCode, H(t.city)]), r = await Le(e, "SELECT * FROM address_locations WHERE id=?", i);
  if (r) return r;
  await Yt(e, 1);
  let o = new URL("https://api-eu.geoapify.com/v1/geocode/search");
  o.searchParams.set("text", t.street + ", " + t.postalCode + " " + t.city + ", Deutschland"), o.searchParams.set("filter", "countrycode:de"), o.searchParams.set("limit", "5"), o.searchParams.set("apiKey", n);
  let s = await Zt(o), d, parsedAddress=recoveredSplitStreet(t.street), c=parsedAddress.number, l=Kt(parsedAddress.street);
  d = s.features?.slice(0,5).map(f=>f?.properties).find(p=>p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat>=-90 && p.lat<=90 && p.lon>=-180 && p.lon<=180 && p.postcode===t.postalCode && Fr(t.city,p) && Kt(p.street)===l && (!c || recoveredHouseNumber(p.housenumber)===c));
  if(!d && allowSuggestions){const proposals=recoveredAddressSuggestions(s.features,t);throw Object.assign(new ce.default.PolicyError("failed-precondition","Die Karte konnte die Lieferadresse einschließlich Hausnummer nicht eindeutig bestätigen. "+(proposals.length?"Bitte Vorschläge prüfen oder manuell sortieren.":"Keine passenden Kartenfunde vorhanden. Die eingegebene Anschrift bleibt erhalten; bitte manuell sortieren.")),{addressSuggestions:proposals});}
  return (!d || !Number.isFinite(d.lat) || !Number.isFinite(d.lon) || d.lat < -90 || d.lat > 90 || d.lon < -180 || d.lon > 180 || d.postcode !== t.postalCode || !Fr(t.city, d) || Kt(d.street) !== l || c && recoveredHouseNumber(d.housenumber) !== c) && a("failed-precondition", "Eine Lieferadresse ist auf der Karte nicht eindeutig. Bitte Adresse pr\xFCfen oder manuell sortieren."), await e.prepare("INSERT OR IGNORE INTO address_locations VALUES (?,?,?,?,?)").bind(i, d.lat, d.lon, "Geoapify / OpenStreetMap", (/* @__PURE__ */ new Date()).toISOString()).run(), { lat: d.lat, lon: d.lon };
}
__name(Xt, "Xt");
async function qt(e, t, n, i, r) {
  let o = r.DB;
  if (e === "searchCustomers") {
    !w(i, "driver") && !w(i, "office") && a("permission-denied", "Keine Kundensuche freigegeben."), R(t, ["query"]);
    let m = H(O(t.query, 80));
    return m.length < 3 ? { customers: [] } : { customers: (await o.prepare("SELECT id,data,last_delivered_at FROM customers WHERE instr(search_name,?)>0 ORDER BY last_delivered_at DESC LIMIT 10").bind(m).all()).results.map((N) => {
      let f = JSON.parse(N.data);
      return { id: N.id, type: f.type, name: f.name, street: f.street, postalCode: f.postalCode, city: f.city, phone: f.phone, lastDeliveredAt: N.last_delivered_at };
    }) };
  }
  if (e === "reorderStops") return Vt(o, n, i, t);
  if (e === "prepareRouteAddress") {
    R(t, ["tourId", "stopId"]), await Ve(o, n, t.tourId, i), (typeof r.GEOAPIFY_API_KEY != "string" || r.GEOAPIFY_API_KEY.length < 10) && a("failed-precondition", "Kostenlose Kartenberechnung wird noch eingerichtet. Manuelle Reihenfolge und Google Maps sind bereits verf\xFCgbar.");
    let m = await Le(o, "SELECT data FROM stops WHERE tour_id=? AND id=? AND status='offen'", t.tourId, I(t.stopId));
    return m || a("failed-precondition", "Stopp wurde inzwischen ge\xE4ndert."), await Xt(o, JSON.parse(m.data), r.GEOAPIFY_API_KEY,true), { prepared: true };
  }
  R(t, ["tourId", "baseRevision"]), await Ve(o, n, t.tourId, i), (!Number.isSafeInteger(t.baseRevision) || t.baseRevision < 0) && a("invalid-argument", "Tourversion pr\xFCfen."), (typeof r.GEOAPIFY_API_KEY != "string" || r.GEOAPIFY_API_KEY.length < 10) && a("failed-precondition", "Kostenlose Kartenberechnung wird noch eingerichtet. Manuelle Reihenfolge und Google Maps sind bereits verf\xFCgbar.");
  let s = (await o.prepare("SELECT id,data FROM stops WHERE tour_id=? AND status='offen' ORDER BY created_at,id LIMIT 81").bind(t.tourId).all()).results;
  s.length < 2 && a("failed-precondition", "Mindestens zwei offene Stopps erforderlich."), s.length > 80 && a("resource-exhausted", "Diese Tour bitte in kleineren Abschnitten oder manuell sortieren.");
  let d = await Le(o, "SELECT stop_ids FROM tour_orders WHERE tour_id=?", t.tourId);
  if (d) {
    let m = new Map(JSON.parse(d.stop_ids).map((A, N) => [A, N]));
    s.sort((A, N) => (m.get(A.id) ?? 1e5) - (m.get(N.id) ?? 1e5));
  }
  let c = s.map((m) => {
    let A = JSON.parse(m.data);
    return Xe(["city-checked-v3", H(A.street), A.postalCode, H(A.city)]);
  }), l = (await o.prepare("SELECT id,lat,lon FROM address_locations WHERE id IN(SELECT value FROM json_each(?))").bind(JSON.stringify(c)).all()).results, u = new Map(l.map((m) => [m.id, m])), E = c.map((m) => u.get(m));
  E.some((m) => !m) && a("failed-precondition", "Lieferadressen bitte zuerst f\xFCr die Berechnung vorbereiten.");
  let p = await Xt(o, Lr, r.GEOAPIFY_API_KEY), g = (s.length + 1) * Math.min(s.length + 1, 10);
  await Yt(o, g);
  let h = new URL("https://api-eu.geoapify.com/v1/routeplanner");
  h.searchParams.set("apiKey", r.GEOAPIFY_API_KEY);
  let v = { mode: "drive", agents: [{ start_location: [p.lon, p.lat] }], jobs: E.map((m, A) => ({ id: String(A), location: [m.lon, m.lat] })) }, _ = await Zt(h, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) }), T = _.features?.[0]?.properties?.actions;
  (_.features?.length !== 1 || _.features[0].properties.agent_index !== void 0 && _.features[0].properties.agent_index !== 0 || _.properties?.issues?.unassignedJobs?.length) && a("unavailable", "Kartenanbieter konnte nicht alle Stopps zuordnen. Reihenfolge bleibt erhalten.");
  let S = T?.filter((m) => Number.isInteger(m.job_index)).map((m) => m.job_index);
  return (!S || S.length !== s.length || new Set(S).size !== s.length || S.some((m) => m < 0 || m >= s.length)) && a("unavailable", "Kartenanbieter lieferte keine vollst\xE4ndige Reihenfolge. Vorige Reihenfolge bleibt erhalten."), T.some((m) => Number.isInteger(m.job_index) && m.job_id !== void 0 && m.job_id !== String(m.job_index)) && a("unavailable", "Kartenanbieter lieferte widerspr\xFCchliche Stoppnummern. Reihenfolge bleibt erhalten."), { ...await Vt(o, n, i, { tourId: t.tourId, baseRevision: t.baseRevision, stopIds: S.map((m) => s[m].id) }, s.map(({ id: m, data: A }) => ({ id: m, data: A }))), attribution: "Geoapify / OpenStreetMap", distance: _.features[0].properties.distance, time: _.features[0].properties.time };
}
__name(qt, "qt");
var L = /* @__PURE__ */ __name((e, t, ...n) => e.prepare(t).bind(...n).first(), "L");
var B = /* @__PURE__ */ __name(async (e, t, ...n) => (await e.prepare(t).bind(...n).all()).results, "B");
var P = /* @__PURE__ */ __name((e, t, ...n) => e.prepare(t).bind(...n).run(), "P");
var z = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "z");
var Qt = /* @__PURE__ */ __name(async (e) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(e))))).map((t) => t.toString(16).padStart(2, "0")).join(""), "Qt");
function ge(e) {
  return e ? { uid: e.uid, displayName: e.display_name, roles: JSON.parse(e.roles), active: e.active === 1, isAdmin: e.is_admin === 1, canCreateSpecialTour: e.active === 1 && JSON.parse(e.roles).includes("office") } : null;
}
__name(ge, "ge");
function $e(e) {
  return e ? { id: e.id, type: e.type, date: e.date, regularType: e.regular_type, driverId: e.driver_id, createdBy: e.created_by, status: e.status, schemaVersion: 2, createdAt: e.created_at, vehicleId: e.vehicle_id, vehicleLabel: e.vehicle_label, startedAt: e.started_at, endedAt: e.ended_at, startCapturedAtClient: e.start_captured, endCapturedAtClient: e.end_captured, startOdometerKm: e.start_odometer, endOdometerKm: e.end_odometer, workflowVersion: e.workflow_version } : null;
}
__name($e, "$e");
function er(e) {
  if (!e) return null;
  let { _editVersion: t = 0, _corrections: n = [], ...i } = JSON.parse(e.data);
  return { id: e.id, ...i, parcelCount: Y(i.parcelCount), ...e.payment_data ? JSON.parse(e.payment_data) : {}, ...e.payment_data && JSON.parse(e.payment_data).removed === 1 ? { removed: true, cents: 0 } : {}, editVersion: t, correctionCount: n.length, schemaVersion: 2, status: e.status, createdAt: e.created_at, proofId: e.proof_id, completedAt: e.completed_at };
}
__name(er, "er");
async function me(e, t, n, i) {
  k(i);
  let r = await L(e, "SELECT * FROM tours WHERE id=?", I(n.tourId));
  return r || a("not-found", "Tour fehlt."), await x(e, t, i, r), r;
}
__name(me, "me");
var Ge = "EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='driver'))";
async function kr(e, t, n, i) {
  R(i, ["view", "date", "workflowVersion", "correctionsVersion"]), i.correctionsVersion !== void 0 && i.correctionsVersion !== 1 && a("invalid-argument", "Korrekturansicht pr\xFCfen."), i.workflowVersion !== void 0 && i.workflowVersion !== 2 && a("invalid-argument", "App-Version pr\xFCfen.");
  let r = i.date || b();
  Te(r);
  let o = i.view || (w(n, "office") ? "office" : "driver");
  if (n?.active !== true) return { profile: n, tours: [], stops: {}, vehicles: [], employees: [], catalog: [], specialTours: [], cash: [] };
  o === "driver" ? k(n) : C(n, o);
  let s = w(n, "driver") ? "" : " AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=tours.id AND m.office_uid=tours.driver_id)", d = o === "office" ? await B(e, "SELECT * FROM tours WHERE date=? ORDER BY created_at LIMIT 101", r) : await B(e, "SELECT * FROM tours WHERE driver_id=? AND (status!='finished' OR date=?)" + s + " ORDER BY created_at LIMIT 101", t, r);
  d.length > 100 && a("resource-exhausted", "Zu viele Touren f\xFCr den Testlauf. Bitte B\xFCro informieren."), i.workflowVersion !== 2 && d.some((f) => f.workflow_version >= 2 && f.status !== "finished") && a("failed-precondition", "Die App wurde aktualisiert. Nach \xDCbertragung ausstehender Vorg\xE4nge alle MARAPO24-Fenster schlie\xDFen und im WLAN neu \xF6ffnen.");
  let c = "SELECT s.*,json_object('collectedCents',json_extract(p.data,'$.collectedCents'),'collectionReason',json_extract(p.data,'$.collectionReason'),'collectionConfirmed',json_extract(p.data,'$.collectionConfirmed'),'deliveryMethod',json_extract(p.data,'$.deliveryMethod'),'nonDeliveryReason',json_extract(p.data,'$.nonDeliveryReason'),'neighborName',json_extract(p.data,'$.neighborName'),'dropoffLocation',json_extract(p.data,'$.dropoffLocation'),'hasDropoffPhoto',json_extract(p.data,'$.photoSha256') IS NOT NULL,'driverComment',json_extract(p.data,'$.driverComment'),'capturedAtClient',json_extract(p.data,'$.capturedAtClient'),'removed',json_extract(p.data,'$.removed'),'removalReason',json_extract(p.data,'$.removalReason'),'removedBy',json_extract(p.data,'$.removedBy'),'removedByName',json_extract(p.data,'$.removedByName'),'removedAt',json_extract(p.data,'$.completedAt'),'originalCents',json_extract(p.data,'$.originalCents')) AS payment_data FROM stops s JOIN tours t ON t.id=s.tour_id LEFT JOIN proofs p ON p.id=s.proof_id ", l = o === "office" ? await B(e, c + "WHERE t.date=? ORDER BY s.created_at,s.id LIMIT 3001", r) : await B(e, c + "WHERE t.driver_id=? AND (t.status!='finished' OR t.date=?)" + (w(n, "driver") ? "" : " AND EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id AND m.office_uid=t.driver_id)") + " ORDER BY s.created_at,s.id LIMIT 3001", t, r);
  l.length > 3e3 && a("resource-exhausted", "Zu viele P\xE4ckchen f\xFCr den Testlauf. Bitte B\xFCro informieren.");
  let u = {};
  for (let f of d) u[f.id] = [];
  for (let f of l) u[f.tour_id] && u[f.tour_id].push(er(f));
  let E = await B(e, o === "office" ? "SELECT * FROM vehicles LIMIT 101" : "SELECT * FROM vehicles WHERE active=1 LIMIT 101"), p = o === "office" ? await B(e, "SELECT * FROM users WHERE active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value IN ('driver','office')) LIMIT 101") : [], g = await B(e, "SELECT t.id,t.regular_type,t.driver_id,t.status,u.display_name AS owner_name FROM tours t LEFT JOIN users u ON u.uid=t.driver_id WHERE t.date=? AND t.regular_type IS NOT NULL", o === "office" ? r : b()), h = (w(n, "driver") || o === "office" ? Ne(o === "office" ? r : b()) : []).map((f) => {
    let y = g.find((j) => j.regular_type === f.id);
    return { ...f, date: b(), reserved: !!y?.driver_id, prepared: !!y, status: y?.status || "open", mine: y?.driver_id === t, ownerId: y?.driver_id || null, ownerName: y?.owner_name || "", canTakeOver: !!y?.driver_id && y.driver_id !== t && y.status === "open", tourId: y?.id || null };
  }), v = w(n, "driver") ? await B(e, "SELECT t.id,t.type,t.date,t.driver_id AS ownerId,u.display_name AS ownerName FROM tours t LEFT JOIN users u ON u.uid=t.driver_id WHERE t.date=? AND t.regular_type IS NULL AND (t.driver_id IS NULL OR t.driver_id!=?) AND t.status='open' AND NOT EXISTS(SELECT 1 FROM self_delivery_tours m WHERE m.tour_id=t.id) LIMIT 101", b(), t) : [];
  await _t(e, d.map((f) => f.id), u);
  let _ = {};
  for (let f of Object.values(u).flat()) !f.voided && f.status === "zugestellt" && (_[f.origin] = (_[f.origin] || 0) + J(f));
  let T = d.map($e), S = d.length ? await B(e, "SELECT tour_id FROM self_delivery_tours WHERE tour_id IN(SELECT value FROM json_each(?))", JSON.stringify(d.map((f) => f.id))) : [];
  for (let f of T) f.selfDelivery = S.some((y) => y.tour_id === f.id);
  let D = d.length ? await B(e, "SELECT tour_id,collected_cents,json_extract(data,'$.signerName') signer_name,json_extract(data,'$.completedAt') completed_at FROM cash_settlements WHERE tour_id IN (" + d.map(() => "?").join(",") + ")", ...d.map((f) => f.id)) : [], m = new Map(D.map((f) => [f.tour_id, f]));
  for (let f of T) {
    let y = m.get(f.id);
    y && (f.cashSettlement = { collectedCents: y.collected_cents, signerName: y.signer_name, completedAt: y.completed_at });
  }
  await $t(e, T, u), await pt(e, T);
  let A = w(n, "driver") || o === "office" ? await vt(e, t, o, T) : { incomingHandovers: [], handoverDrivers: [] }, N = await gt(e, t, o, o === "office" ? r : b(), T);
  if (i.correctionsVersion !== 1) for (let f of Object.keys(u)) u[f] = u[f].filter((y) => !y.voided);
  return { profile: n, workStarts: N, ...A, tours: T, stops: u, vehicles: E.map((f) => ({ id: f.id, label: f.label, active: f.active === 1, createdAt: f.created_at })), employees: p.map((f) => ({ id: f.uid, ...ge(f) })), catalog: h, specialTours: v, cash: Object.entries(_).map(([f, y]) => ({ origin: f, cents: y })) };
}
__name(kr, "kr");
async function Hr(e, t, n, i, r, o) {
  if (i === "state") return kr(e, t, n, r);
  if (i === "deleteOwnTour") return Et(e, t, n, r);
  if (i === "startWork") return mt(e, t, n, r);
  if (["correctDeliveryAmount", "reopenDelivery"].includes(i)) return ht(e, t, n, i, r);
  if (["takeOverOpenTour", "offerTourHandover", "acceptTourHandover"].includes(i)) return Rt(e, t, n, i, r);
  if (["saveCashSettlement", "downloadCashSettlement"].includes(i)) return Ft(e, t, n, i, r, o);
  if (i === "removeProtectedPackage") return kt(e, t, n, r, o);
  if (i === "updatePackage" || i === "deletePackage") return Wt(e, t, n, i, r);
  if (i === "prepareRegularTour") {
    C(n, "office"), R(r, ["date", "typeId"]);
    let s = Ne(r.date).find((l) => l.id === r.typeId);
    s || a("invalid-argument", "Regul\xE4re Tour f\xFCr diesen Tag ausw\xE4hlen.");
    let d = await L(e, "SELECT id FROM tours WHERE date=? AND regular_type=?", r.date, r.typeId);
    if (d) return { tourId: d.id };
    let c = crypto.randomUUID();
    try {
      (await P(e, "INSERT INTO tours(id,date,type,regular_type,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,?,'open',?,2 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))", c, r.date, s.label, r.typeId, t, z(), t)).meta.changes !== 1 && a("permission-denied", "B\xFCrozugang nicht freigegeben.");
    } catch (l) {
      let u = await L(e, "SELECT id FROM tours WHERE date=? AND regular_type=?", r.date, r.typeId);
      if (u) return { tourId: u.id };
      throw l;
    }
    return { tourId: c };
  }
  if (i === "claimRegularTour") {
    C(n, "driver"), R(r, ["date", "typeId", "workflowVersion"]), r.date !== b() && a("failed-precondition", "Touren k\xF6nnen nur f\xFCr den heutigen Tag \xFCbernommen werden.");
    let s = Ne(r.date).find((l) => l.id === r.typeId);
    s || a("invalid-argument", "Diese Tour findet heute nicht statt.");
    let d = await L(e, "SELECT * FROM tours WHERE date=? AND regular_type=?", r.date, r.typeId);
    if ((!d || d.workflow_version >= 2) && r.workflowVersion !== 2 && a("failed-precondition", "Vor neuer Tour aktuelle App im WLAN neu \xF6ffnen."), d) {
      if (d.driver_id === t) return { tourId: d.id };
      if (!d.driver_id && (await P(e, `UPDATE tours SET driver_id=? WHERE id=? AND driver_id IS NULL AND status='open' AND ${Ge}`, t, d.id, t)).meta.changes === 1) return { tourId: d.id };
      a("already-exists", "Diese Tour ist bereits \xFCbernommen.");
    }
    let c = crypto.randomUUID();
    try {
      (await P(e, `INSERT INTO tours(id,date,type,regular_type,driver_id,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,?,?,'open',?,2 WHERE ${Ge}`, c, r.date, s.label, r.typeId, t, t, z(), t)).meta.changes !== 1 && a("permission-denied", "Konto nicht freigegeben.");
    } catch (l) {
      throw l instanceof ce.default.PolicyError || String(l).includes("UNIQUE") && a("already-exists", "Diese Tour wurde gerade von einem anderen Fahrer \xFCbernommen."), l;
    }
    return { tourId: c };
  }
  if (i === "createSelfTour") {
    C(n, "office"), R(r, ["date", "type"]), r.date !== b() && a("failed-precondition", "Eigene Mitnahme-Touren bitte f\xFCr heute anlegen.");
    let s = O(r.type, 90, true), d = crypto.randomUUID();
    return (await e.batch([e.prepare("INSERT INTO tours(id,date,type,driver_id,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,?,'open',?,2 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))").bind(d, r.date, s, t, t, z(), t), e.prepare("INSERT INTO self_delivery_tours SELECT id,driver_id FROM tours WHERE id=? AND driver_id=?").bind(d, t)]))[0].meta.changes !== 1 && a("permission-denied", "B\xFCrozugang nicht mehr freigegeben."), { tourId: d };
  }
  if (i === "createSpecialTour") {
    C(n, "office"), R(r, ["date", "type"]), Te(r.date);
    let s = O(r.type, 90, true), d = crypto.randomUUID();
    return (await P(e, "INSERT INTO tours(id,date,type,created_by,status,created_at,workflow_version) SELECT ?,?,?,?,'open',?,2 WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))", d, r.date, s, t, z(), t)).meta.changes !== 1 && a("permission-denied", "Berechtigung wurde ge\xE4ndert."), { tourId: d };
  }
  if (i === "claimSpecialTour") {
    C(n, "driver"), R(r, ["tourId", "workflowVersion"]), I(r.tourId);
    let s = await L(e, "SELECT driver_id,workflow_version FROM tours WHERE id=? AND date=? AND regular_type IS NULL", r.tourId, b());
    return s?.workflow_version >= 2 && r.workflowVersion !== 2 && a("failed-precondition", "Vor neuer Tour aktuelle App im WLAN neu \xF6ffnen."), s?.driver_id === t ? { tourId: r.tourId } : ((await P(e, `UPDATE tours SET driver_id=? WHERE id=? AND date=? AND driver_id IS NULL AND regular_type IS NULL AND status='open' AND ${Ge}`, t, r.tourId, b(), t)).meta.changes !== 1 && a("already-exists", "Zusatz-Tour nicht mehr verf\xFCgbar."), { tourId: r.tourId });
  }
  if (i === "createPackage") {
    let s = w(n, "office"), d;
    s ? (d = await L(e, "SELECT * FROM tours WHERE id=?", I(r.tourId)), d || a("not-found", "Tour fehlt.")) : d = await me(e, t, r, n), s && d.status === "running" && (await x(e, t, n, d), s = false), (!["open", "running"].includes(d.status) || s && d.status !== "open") && a("failed-precondition", s ? "Das B\xFCro darf P\xE4ckchen nur vor Tourstart erg\xE4nzen." : "Beendete Touren k\xF6nnen nicht erg\xE4nzt werden.");
    if (!s && d.date !== b()) a("failed-precondition", "Neue Päckchen nur in einer Tour für heute erfassen. Alte Tour zum Abschluss weiter verfügbar.");
    let c = re(r, $e(d)), l = crypto.randomUUID();
    return (await P(e, "INSERT INTO stops(id,tour_id,data,status,created_at) SELECT ?,?,?,'offen',? WHERE EXISTS(SELECT 1 FROM tours WHERE id=? AND (date=? OR ?=1) AND (status='open' OR (status='running' AND ?=0)) AND (driver_id=? OR ?=1)) AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value=?)) AND (SELECT count(*) FROM stops WHERE tour_id=?)<1000", l, d.id, JSON.stringify(c), z(), d.id, b(), s ? 1 : 0, s ? 1 : 0, t, s ? 1 : 0, t, s || !w(n, "driver") ? "office" : "driver", d.id)).meta.changes < 1 && a("failed-precondition", "Tour beendet, Konto gesperrt oder P\xE4ckchengrenze erreicht."), { stopId: l };
  }
  if (i === "createVehicle" || i === "updateVehicle") {
    if (C(n, "office"), R(r, i === "createVehicle" ? ["label"] : ["vehicleId", "active"]), i === "createVehicle") {
      let d = crypto.randomUUID();
      return (await P(e, "INSERT INTO vehicles SELECT ?,?,1,? WHERE EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))", d, O(r.label, 40, true), z(), t)).meta.changes !== 1 && a("permission-denied", "Berechtigung wurde ge\xE4ndert."), { vehicleId: d };
    }
    return typeof r.active != "boolean" && a("invalid-argument", "Fahrzeugfreigabe pr\xFCfen."), (await P(e, "UPDATE vehicles SET active=? WHERE id=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))", r.active ? 1 : 0, I(r.vehicleId), t)).meta.changes || a("not-found", "Fahrzeug fehlt oder Berechtigung ge\xE4ndert."), { updated: true };
  }
  if (i === "getDeliveryEncryptionKey") {
    k(n);
    let s = je(o.DELIVERY_PROOF_PRIVATE_KEY);
    return { version: 1, keyId: s.keyId, publicKey: s.publicKey };
  }
  if (i === "startProtectedTour" || i === "finishProtectedTour") {
    R(r, i === "startProtectedTour" ? ["tourId", "vehicleId", "completionId", "capturedAt", "odometerKm"] : ["tourId", "completionId", "capturedAt", "odometerKm"]), M(r);
    let s = await me(e, t, r, n), d = await Qt(r), c = i === "startProtectedTour", l = c ? s.start_id : s.end_id, u = c ? s.start_hash : s.end_hash;
    if (l === r.completionId && u === d) return c ? { started: true } : { finished: true };
    let E = !!await L(e, "SELECT 1 FROM self_delivery_tours WHERE tour_id=?", s.id), p = E && (c || !s.vehicle_id), g = null;
    try {
      !p && (s.workflow_version >= 2 || r.odometerKm !== void 0) && (g = At(r.odometerKm));
    } catch (v) {
      a("invalid-argument", v.message + " Bitte aktuelle App \xF6ffnen.");
    }
    if (!c && g !== null && s.start_odometer !== null && g < s.start_odometer && a("invalid-argument", "End-Kilometerstand darf nicht unter dem Start liegen."), c && p) return (await P(e, `UPDATE tours SET status='running',vehicle_label='Privatfahrzeug',started_at=?,start_captured=?,start_id=?,start_hash=? WHERE id=? AND driver_id=? AND status='open' AND ${De} AND EXISTS(SELECT 1 FROM self_delivery_tours WHERE tour_id=tours.id AND office_uid=?) AND EXISTS(SELECT 1 FROM stops WHERE tour_id=tours.id)`, z(), r.capturedAt, r.completionId, d, s.id, t, t, t)).meta.changes || a("failed-precondition", "Vor Start P\xE4ckchen erfassen und Tour pr\xFCfen."), { started: true };
    if (c) {
      s.status !== "open" && a("already-exists", "Tour wurde bereits gestartet.");
      let v = await L(e, "SELECT * FROM vehicles WHERE id=? AND active=1", I(r.vehicleId));
      if (v || a("failed-precondition", "Fahrzeug nicht freigegeben."), !(await P(e, `UPDATE tours SET status='running',vehicle_id=?,vehicle_label=(SELECT label FROM vehicles WHERE id=?),started_at=?,start_captured=?,start_id=?,start_hash=?,start_odometer=? WHERE id=? AND driver_id=? AND status='open' AND ${De} AND EXISTS(SELECT 1 FROM vehicles WHERE id=? AND active=1) AND EXISTS(SELECT 1 FROM stops WHERE tour_id=?)`, v.id, v.id, z(), r.capturedAt, r.completionId, d, g, s.id, t, t, v.id, s.id)).meta.changes) {
        let T = await me(e, t, r, ge(await L(e, "SELECT * FROM users WHERE uid=?", t)));
        (T.start_id !== r.completionId || T.start_hash !== d) && a("failed-precondition", "Vor Start P\xE4ckchen erfassen, Fahrzeug und Tour pr\xFCfen.");
      }
      return { started: true };
    }
    if (!(await P(e, `UPDATE tours SET status='finished',ended_at=?,end_captured=?,end_id=?,end_hash=?,end_odometer=? WHERE id=? AND driver_id=? AND status='running' AND ${De} AND NOT EXISTS(SELECT 1 FROM stops WHERE tour_id=? AND status='offen')`, z(), r.capturedAt, r.completionId, d, g, s.id, t, t, s.id)).meta.changes) {
      let v = await me(e, t, r, ge(await L(e, "SELECT * FROM users WHERE uid=?", t)));
      (v.end_id !== r.completionId || v.end_hash !== d) && a("failed-precondition", "Zuerst alle P\xE4ckchen abschlie\xDFen und \xFCbertragen.");
    }
    return { finished: true };
  }
  if (i === "completeProtectedDelivery") {
    R(r, ["tourId", "stopId", "status", "sealedSignature", "completionId", "capturedAt", "collectedCents", "collectionReason", "deliveryMethod", "nonDeliveryReason", "neighborName", "dropoffLocation", "sealedPhoto", "basePackageRevision"]), M(r);
    let s = await me(e, t, r, n), d = I(r.stopId), c = ce.default.identifiers(r), l = await Qt(r), u = await L(e, "SELECT * FROM proofs WHERE id=?", c);
    if (u) {
      if (u.driver_id === t && u.completion_id === r.completionId && u.fingerprint === l) return { completed: true };
      a("already-exists", "Lieferung bereits abgeschlossen.");
    }
    s.status !== "running" && a("failed-precondition", "Tour zuerst starten.");
    let E = await L(e, "SELECT * FROM stops WHERE id=? AND tour_id=?", d, s.id);
    E || a("not-found", "P\xE4ckchen fehlt."), r.basePackageRevision !== void 0 && r.basePackageRevision !== (JSON.parse(E.data)._editVersion || 0) && a("failed-precondition", "P\xE4ckchen wurde korrigiert. Bitte neu laden und Zustellung erneut pr\xFCfen.");
    let p = r.sealedSignature ? await q(r.sealedSignature, { uid: t, tourId: s.id, stopId: d, completionId: r.completionId }, o.DELIVERY_PROOF_PRIVATE_KEY) : { signature: null, capturedAt: r.capturedAt };
    p.capturedAt !== r.capturedAt && a("invalid-argument", "Erfassungszeit ver\xE4ndert.");
    let g;
    try {
      g = oe(r, te(JSON.parse(E.data)), r.status);
    } catch (N) {
      a("invalid-argument", N.message);
    }
    let h;
    try {
      h = Ot(r, JSON.parse(E.data).type);
    } catch (N) {
      a("invalid-argument", N.message);
    }
    wt({ ...r, ...h }, t, $e(s), er(E), p.signature), p.signature && await Ee(p.signature);
    let v = null;
    if (r.sealedPhoto) {
      h.deliveryMethod !== "dropoff" && a("invalid-argument", "Foto nur bei Ablage erlaubt.");
      let N = await q(r.sealedPhoto, { uid: t, tourId: s.id, stopId: d, completionId: r.completionId, purpose: "dropoff-photo" }, o.DELIVERY_PROOF_PRIVATE_KEY, Date.now(), { photo: true });
      N.capturedAt !== r.capturedAt && a("invalid-argument", "Fotozeit ver\xE4ndert."), await Ee(N.signature, { photo: true }), v = N.signature;
    }
    let _ = v ? Buffer.from(await crypto.subtle.digest("SHA-256", Buffer.from(v.slice(22), "base64"))).toString("hex") : null, T = p.signature ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Buffer.from(p.signature.slice(22), "base64")))).map((N) => N.toString(16).padStart(2, "0")).join("") : null, S;
    try {
      S = rt(p.driverComment);
    } catch (N) {
      a("invalid-argument", N.message);
    }
    let { _corrections: D, ...m } = JSON.parse(E.data), A = { ...m, photo: v, photoSha256: _, parcelCount: Y(m.parcelCount), cents: te(m), driverComment: S, ...g, ...h, ...Gt(m), tourId: s.id, stopId: d, driverId: t, status: r.status, completedAt: z(), capturedAtClient: r.capturedAt, signature: p.signature, signatureSha256: T };
    try {
      await P(e, "INSERT INTO proofs VALUES (?,?,?,?,?,?,?)", c, s.id, d, t, r.completionId, l, JSON.stringify(A));
    } catch (N) {
      let f = await L(e, "SELECT * FROM proofs WHERE id=?", c);
      if (f) {
        if (f.driver_id === t && f.completion_id === r.completionId && f.fingerprint === l) return { completed: true };
        a("already-exists", "Lieferung bereits abgeschlossen.");
      }
      throw N;
    }
    return { completed: true };
  }
  if (i === "downloadProtectedProof") {
    C(n, "office"), R(r, ["tourId", "stopId", "correctionsVersion"]);
    let s = ce.default.identifiers(r), d = await L(e, "SELECT data FROM proofs WHERE id=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND EXISTS(SELECT 1 FROM json_each(users.roles) WHERE value='office'))", s, t);
    d || a("not-found", "Nachweis fehlt oder Zugriff ge\xE4ndert.");
    let c = await Pt(e, await St(e, JSON.parse(d.data)));
    return (c.corrections.length || c.packageCorrections.length) && r.correctionsVersion !== 1 && a("failed-precondition", "Dieser Nachweis wurde korrigiert. Bitte App im WLAN neu \xF6ffnen, damit Original und Korrektur gemeinsam angezeigt werden."), { proof: c, filename: (c.removed ? "Entfernungsnachweis-" : "Zustellnachweis-") + s + ".pdf" };
  }
  if (i === "listUsers" || i === "updateUser") {
    if (C(n, "office"), n.isAdmin || a("permission-denied", "Nur die Administratorin darf Konten verwalten."), i === "listUsers") return R(r, []), { users: (await B(e, "SELECT * FROM users ORDER BY display_name LIMIT 101")).map(ge) };
    R(r, ["uid", "displayName", "roles", "active"]), (typeof r.uid != "string" || r.uid.length > 128 || !Array.isArray(r.roles) || !r.roles.length || r.roles.length > 2 || new Set(r.roles).size !== r.roles.length || r.roles.some((c) => !["office", "driver"].includes(c)) || typeof r.active != "boolean") && a("invalid-argument", "Kontofreigabe pr\xFCfen.");
    let s = await L(e, "SELECT * FROM users WHERE uid=?", r.uid);
    return s || a("not-found", "Konto zuerst sicher registrieren."), s.is_admin && (r.active !== true || !r.roles.includes("office")) && a("failed-precondition", "Administratorzugriff muss erhalten bleiben."), (await P(e, "UPDATE users SET display_name=?,roles=?,active=? WHERE uid=? AND EXISTS(SELECT 1 FROM users WHERE uid=? AND active=1 AND is_admin=1)", O(r.displayName, 80, true), JSON.stringify(r.roles), r.active ? 1 : 0, r.uid, t)).meta.changes !== 1 && a("permission-denied", "Administratorzugriff wurde ge\xE4ndert."), { updated: true };
  }
  a("not-found", "Vorgang nicht vorhanden.");
}
__name(Hr, "Hr");
async function Pr(e) {
  let t = e.body?.getReader();
  if (!t) return {};
  let n = 0, i = [];
  for (; ; ) {
    let { value: s, done: d } = await t.read();
    if (d) break;
    n += s.length, n > 15e5 && (await t.cancel(), a("resource-exhausted", "Anfrage zu gro\xDF.")), i.push(s);
  }
  let r = new Uint8Array(n), o = 0;
  for (let s of i) r.set(s, o), o += s.length;
  try {
    return JSON.parse(new TextDecoder().decode(r));
  } catch {
    a("invalid-argument", "Ung\xFCltige Anfrage.");
  }
}
__name(Pr, "Pr");
var Nn = { async scheduled(e, t) {
  if (t.RETENTION_POLICY !== ze) return;
  let n = await It(t.DB, { policy: t.RETENTION_POLICY });
  console.log(JSON.stringify({ event: "retention", ...n }));
}, async fetch(e, t) {
  let n = new URL(e.url);
  if (!n.pathname.startsWith("/api/")) return t.ASSETS ? t.ASSETS.fetch(e) : new Response("Test app not built", { status: 404 });
  if (e.method !== "POST") return Response.json({ error: { code: "invalid-argument", message: "POST required" } }, { status: 405 });
  let i = e.headers.get("Origin");
  if (i && i !== n.origin) return Response.json({ error: { code: "permission-denied", message: "Origin denied" } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    let r = n.pathname.slice(5), o = await Pr(e), s;
    if (["driverLoginOptions", "driverPinLogin", "driverPinLogout"].includes(r)) await pe(e, t), s = await at(r, o, e, t);
    else if (["officePasswordLogin", "officePasswordLogout", "officeForgotPassword", "officePasswordChallenge"].includes(r)) await pe(e, t), s = await ct(r, o, e, t);
    else {
      let c, l, u, E, p = false;
      if (e.headers.has("Authorization")) {
        let h = await jt(e, t);
        c = h.uid, u = h.email, l = "firebase";
      } else if (await pe(e, t), (e.headers.get("Cookie") || "").includes("__Host-marapo24-office=")) {
        let h = await We(e, t);
        c = h.uid, p = h.mustChange, E = h.username, l = "office";
      } else c = await nt(e, t), l = "driver";
      let g = ge(await L(t.DB, "SELECT * FROM users WHERE uid=?", c));
      g && (g = { ...g, sessionKind: l, loginEmail: u, mustChangePassword: p, officeUsername: E }, l === "driver" && (g = { ...g, roles: g.roles.filter((h) => h === "driver"), isAdmin: false, canCreateSpecialTour: false }), l === "office" && (g = { ...g, roles: g.roles.filter((h) => h === "office") }), g.canRecoverPasswords = se(g, t)), p && !["changeOfficePassword", "session"].includes(r) && a("failed-precondition", "Bitte zuerst das vorl\xE4ufige Passwort \xE4ndern."), r === "session" ? (R(o, []), s = { data: { profile: g } }) : r === "createStaffAccount" ? s = { data: await ft(o, t, g) } : ["changeOfficePassword", "listPasswordRequests", "resetOfficePassword"].includes(r) ? s = await lt(r, o, e, t, g) : ["authorizeDriverDevice", "listDriverDevices", "revokeDriverDevice", "setDriverPin"].includes(r) ? (r === "setDriverPin" && !se(g, t) && a("permission-denied", "Pers\xF6nlicher Administratorzugang zum Zur\xFCcksetzen der Fahrer-PIN erforderlich."), s = await st(r, o, e, t, g)) : ["searchCustomers", "reorderStops", "optimizeStops", "prepareRouteAddress"].includes(r) ? s = { data: await qt(r, o, c, g, t) } : s = { data: await Hr(t.DB, c, g, r, o, t) };
    }
    let d = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    for (let c of s.cookies || []) d.append("Set-Cookie", c);
    return Response.json({ data: s.data }, { headers: d });
  } catch (r) {
    let o = r instanceof ce.default.PolicyError ? r.code : "unavailable";
    return Response.json({ error: { code: o, message: r instanceof ce.default.PolicyError ? r.message : "Vorgang nicht best\xE4tigt. Daten bleiben auf dem Ger\xE4t. Bitte sp\xE4ter erneut versuchen.", ...(r instanceof ce.default.PolicyError&&Array.isArray(r.addressSuggestions)?{addressSuggestions:r.addressSuggestions}:{}) } }, { status: o === "unauthenticated" ? 401 : o === "permission-denied" ? 403 : o === "already-exists" ? 409 : o === "not-found" ? 404 : o === "unavailable" ? 503 : o === "resource-exhausted" ? 429 : 400, headers: { "Cache-Control": "no-store" } });
  }
} };
export {
  Nn as default
};
