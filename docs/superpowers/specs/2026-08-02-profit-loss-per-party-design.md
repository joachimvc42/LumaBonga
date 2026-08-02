# Profit/loss counter per party + profitability-gated settlement

Date: 2026-08-02
Status: Approved by user, ready for implementation planning

## Problem

The user wants two things, both rooted in the same underlying need — being
able to see whether Lumaya and GawahBonga are each individually profitable,
and only running a settlement once they both are:

1. A visible counter showing the gains/losses each party has actually
   realized ("voir les gains réalisés par chaque partie") — today nothing
   in the UI shows this directly.
2. A settlement that only exists once BOTH parties are in profit
   ("tant qu'une des 2 parties n'est pas en bénéfices, il n'y a pas de
   settlement"): a party is in profit when what it has taken in from its
   own sales exceeds what it has spent on its own purchases and charges.
   Once both are profitable, the surplus distribution already follows the
   agreed % split. The full calculation (each party's purchases, each
   party's sales, the share that should come back to each) must be
   inspectable, not just the final number.

## What already exists (lumabonga-data.jsx:1086-1153, `totals` memo)

This is closer to done than it looks. Every sale/purchase/cost already
carries an `org` field (`'lumaya'` or `'gawah'`, set via a picker in the
add/edit form — `orgOf()` at creative.jsx:620 defaults to `'lumaya'` when
unset). From that, `totals` already computes, per party:

- `held.{lumaya,gawah}` — cash actually in each party's hands: its own
  sales − its own purchases − its own charges, **plus/minus past manual
  settlement transfers** (data.jsx:1136-1144).
- `entitled.{lumaya,gawah}` — each party's fair share of the whole
  business's distributable profit, split by `lumayaShare`% (per-product
  override, else a global default) — data.jsx:1120-1134.
- `balance = held − entitled` (data.jsx:1145) — negative means that party
  is owed money. This drives the existing Dashboard "doit recevoir" card
  (creative.jsx:471-493), the `CreaVessels` two-column balance display
  (creative.jsx:211-254), and the "Régler" button that opens the manual
  settlement form.
- `store.settlements` (data.jsx:785) plus `addSettlement`/`updateSettlement`/
  `removeSettlement` — a manual ledger of actual transfers the user records
  by hand; shown as history under the balance card
  (creative.jsx:494-517).

None of this is gated on profitability today — the balance card and
"Régler" button show unconditionally, even if a party's own trading
activity is currently a loss. And nothing shows the raw per-party
ventes/achats/charges breakdown directly — only the relative `balance`
(the owed-gap against entitlement), which conflates "what they hold" with
"what they're entitled to."

## Decision: reuse `held`'s math, add one new pre-settlement variant

`held` already computes exactly the right numbers for "is this party
profitable," except it also nets in past settlement transfers
(data.jsx:1140-1144), which would make the profitability check circular —
a party that already paid out a settlement could look unprofitable purely
because of that payment, not because its trading activity was bad. So a
new value is needed: the same held computation, stopped before the
settlements loop.

- New `grossHeld.{lumaya,gawah}` in the `totals` memo: identical to the
  existing `held` loop (data.jsx:1136-1139 — sales add, purchases/charges
  subtract, attributed via `orgOf()`), but returned as its own value
  instead of continuing into the settlements adjustment. `held` itself is
  unchanged and still feeds `balance`/the existing settlement-ledger UI as
  it does today.
- `bothProfitable = grossHeld.lumaya > 0 && grossHeld.gawah > 0`.

`entitled` is unchanged and reused as-is for the "what should come back to
each party" breakdown.

## UI

### 1. New "Profit/loss per party" card — always visible (Dashboard)

Placed near the existing KPI grid (creative.jsx:456-469) or the account
balance block (creative.jsx:471-518) — exact position decided at
implementation time, but it must sit where a user glancing at the
dashboard sees it without extra clicks, since "voir les gains réalisés"
is the primary ask.

Two columns (or stacked on narrow layouts), Lumaya vs GawahBonga, each
showing:

- Ventes (that party's `org`-attributed sales total)
- Achats (that party's purchases)
- Charges (that party's costs)
- = Gain/Perte net (`grossHeld`), colored positive/negative (reuse
  `c.pos`/`c.rose`, matching the existing margin-tile convention at
  creative.jsx:1113-1124)

This card is shown regardless of profitability — that's the point, it's
how the user finds out. No gate on this part.

### 2. Detail breakdown (expandable)

Tapping the card (or a "détail" affordance on it) expands to show the
full decomposition backing whatever settlement figure is or isn't
showing: each party's ventes/achats/charges (already on the card, just
un-collapsed further into e.g. per-org purchase/cost totals if useful),
each party's `entitled` share, and the resulting `balance`/settlement
amount. Aggregate numbers only — not a line-by-line transaction list
(the existing activity timeline, filterable by org via `OrgFilter`
creative.jsx:601, already covers that).

### 3. Gate the existing settlement suggestion on `bothProfitable`

The Dashboard's account-balance block (creative.jsx:471-493) currently
always shows either "Comptes équilibrés" or the "doit recevoir" amount +
"Régler" button, driven by `totals.balance`. This becomes conditional:

- `bothProfitable` **and** not settled (existing `settled` check,
  creative.jsx:420) → unchanged: show "doit recevoir" + "Régler" as today.
- `bothProfitable` and settled → unchanged: "Comptes équilibrés".
- **NOT** `bothProfitable` → new neutral state: no "doit recevoir" figure,
  no "Régler" button. Copy explains why (e.g. naming which party isn't yet
  profitable) rather than just hiding the block silently.

The settlement **history** list (creative.jsx:494-517, showing past
`store.settlements` entries with edit/remove) and the ability to manually
record a transfer stay available regardless of `bothProfitable` — that's
bookkeeping of real, already-happened payments, not "the calculated
settlement," and the user should still be able to log or correct a past
transfer at any time.

`CreaVessels` (creative.jsx:211-254, the two-column balance-bar visual
also gated on `onSettle`) is out of scope for this change — it already
just reflects `balance` and isn't part of what the user asked to gate;
revisit only if it turns out to visually contradict the new gated card.

## i18n

New strings need FR/EN/ID entries in lumabonga-data.jsx's translation
dictionaries: the P&L card's labels ("Perte / Profit par partie" or
similar — exact copy decided at implementation time), the detail-view
labels, and the not-yet-profitable neutral-state copy.

## Out of scope

- No change to `held`, `entitled`, `balance`, or the settlement-ledger
  functions themselves — all reused as-is.
- No change to `CreaVessels`' own always-on display.
- No per-transaction (line-by-line) breakdown in the new card — aggregate
  totals only, matching "décomposition du calcul simple mais complète"
  (simple but complete), not a duplicate of the activity timeline.
- No automatic distribution/payout action — the user still manually
  records a settlement transfer via the existing "Régler" flow once one
  is suggested; this feature only decides *whether* that suggestion shows
  and *what the numbers behind it are*, not a new payment mechanism.
