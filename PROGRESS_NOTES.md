# LumaBonga — work notes (internal, gitignored idea: keep local)

## Architecture
- `index.html` = the functional app (React via in-browser Babel, NO build). Entry served at `/`.
- `LumaBonga.html` = original design canvas. DO NOT TOUCH (user: "parfait").
- jsx files: lumabonga-data.jsx (store+cost engine+i18n), lumabonga-creative.jsx (nav/dashboard/sales/products/add sheet), lumabonga-stock.jsx (purchases/stock), lumabonga-product.jsx (product detail/recipe).
- Mobile layout = perfect, don't change. Desktop = full-height min(900px) centred column, no phone frame (index.html @media >=520px).

## Supabase (USER'S OTHER ACCOUNT — not in my MCP)
- project ref: ivooxizmcqkwzplimvtg ; URL https://ivooxizmcqkwzplimvtg.supabase.co
- anon key embedded in index.html (module script). service_role NEVER used.
- Shared login account: equipe@lumabonga.app ; password = the "code" the user typed in supabase_setup.sql (I DON'T know it).
- Data model: single row `app_state(id=1, data jsonb)` + `members` allowlist + RLS + realtime. SQL = supabase_setup.sql.
- I CANNOT touch their DB via MCP. To wipe DB: app Settings → Réinitialiser (needs login), or give user SQL.

## Persistence (pluggable)
- index.html sets `window.__LUMA_INITIAL` (loaded snapshot) + `window.__LUMA_SAVE` (debounced upsert to app_state). data.jsx loadPersisted/savePersisted use them, else localStorage.
- localStorage keys: `lumabonga:v1` (store), `lumabonga:tweaks` (settings), `lumabonga:auth` (supabase session).
- store has `resetStore()`.

## Git / deploy
- repo: github.com/joachimvc42/LumaBonga, branch main. Push HTTPS → GCM opens browser auth.
- Vercel connected → auto-deploy on push. vercel.com/joachims-projects-63eb4462/luma-bonga
- Last committed: 2c00d00 (currency IDR + org per transaction).

## DONE this session, NOT YET COMMITTED
1. Desktop responsive (index.html @media).
2. i18n FR/EN, default EN:
   - data.jsx: TWEAK_DEFAULTS lang:'en'; tr(), setLbLang(), LB_EN dict, LB_LOCALE; fmtDate/fmtDay locale-aware; apostrophe-normalised lookup; exposed tr/setLbLang on window.
   - index.html: useAppTweaks forces currency IDR; setLbLang(t.lang) in LumaBongaApp; setLbLang at module load for login/splash; Language row (EN/FR) in Settings; all strings wrapped tr().
   - creative.jsx / stock.jsx / product.jsx: all UI strings wrapped tr(). Labor presets stored as tr(task).

## NEXT STEPS (in order)
1. VERIFY compile: reload http://localhost:3000/index.html?v=TS in preview, check console errors=0, login screen renders. Fix bugs.
2. COMMIT + PUSH (desktop + i18n).
3. DATA TASK (user's last msg): delete all data (local+DB) + ENTER 7 real products & recipes AS A USER via browser automation (preview_click/fill or Claude_in_Chrome) to test app + fix bugs.
   - BLOCKER: need the access CODE to log in (localhost hits real DB). ASK USER for it.
   - Products are NEW (delete demo seeds). Materials must be created first, then products, then recipe ingredients per product.

## REAL DATA TO ENTER (7 products, units g/ml; drops "gtt" ~ tiny — decide unit: treat EO drops as small g, or add 'goutte'? For now enter weights as given; drops -> use grams approx or skip-precision per user).
Déodorant Naturel (~60 g): Huile abricot/jojoba 19 g, karité 4 g, cire d'abeille 3 g, maïzena 18 g, bicarbonate 15 g, vitamine E 0.5 g, HE lavande+tea tree+palmarosa 4 drops
Zinc Naturel Surf (~75 g): Zinc non nano 24 g, pigment minéral 3.5 g, karité 10 g, huile coco 11 g, huile ricin 6 g, huile jojoba 4 g, cire candelilla 4.5 g, résine liquide 6 g, maïzena 6 g, HE eucalyptus 6 drops, HE lavande 2 drops
Anti-Moustique Naturel (~100 ml): Huile coco fractionnée FCO 80 ml, huile jojoba 10 ml, HE eucalyptus citronné 4 ml, HE citronnelle 2 ml, HE géranium 2 ml, HE lavande 0.5 ml, huile neem 2 ml, vanille 4 drops, vitamine E 5 drops
Wax Naturelle Surf Tropicale (~100 g): Cire d'abeille 42 g, carnauba 4 g, candelilla 3 g, huile coco 19 g, résine liquide 20 g, oxyde de zinc 11 g, HE eucalyptus 5 drops, HE peppermint 3 drops
Dentifrice (100 g): Calcium Carbonate 35 g, Coconut Oil 30 g, White Clay 20 g, Fluoride Toothpaste 10 g, Fine Baking Soda 3 g, Siwak Sticks 12 g, Peppermint EO 6 drops, Tea Tree EO 2 drops
After Sun Balm (Lumaya) (100 g): Shea butter 28 g, FCO 10 g, jojoba oil 10 g, tamanu oil 4 g, aloe vera oil 5 g, candelilla wax 7 g, beeswax 6 g, arrowroot 8 g, vitamin E 0.5 g, vanilla absolute 0.2 g, lavender EO 0.15 g
Hair Oil After Surf (100 g): FCO 61.1 g, Jojoba 24 g, Argan 10 g, Castor 2 g, Tamanu 2 g, Vitamin E 0.5 g, Vanilla Absolute 6 drops, Ylang-Ylang EO 2 drops
