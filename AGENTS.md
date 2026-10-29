# Hoteliva – projektutasítások

## Termék és hatókör

- Hotelműködést támogató alkalmazás. Egy monorepo, TypeScript minden alkalmazáskódban.
- Express backend; Expo / React Native kliens. Android: natív app, cél a Play Store.
- iOS: PWA; desktop: böngésző. Mobilon gyors munkavégzés, desktopon részletes kezelés.
- Magyar és angol UI, magyar alapértelmezés. Hibaüzenetek és email-szövegek is fordítandók.
- Kódnevek és kódbeli kommentek angolul. Ez a JSDoc-leírásokra és a függvényen belüli magyarázatokra is vonatkozik; a magyar UI-szövegek ettől változatlanok.
- Jelenlegi kör: bejelentkezés, meghívásos aktiválás, üres dashboard, backend-alapok.
- Nincs nyilvános regisztráció. Felhasználót jelenleg csak platform admin hozhat létre.
- Email: SendGrid. Adatbázis: MongoDB. Későbbi fájltároló: DigitalOcean Spaces.

## Kötelező kódszabályok

- Minden módosítás után kötelező lefuttatni a Prettiert az érintett, támogatott fájlokon. Teljes projekt: `npm run format`; célzottan: `npx prettier --write <fájlok>`.
- Átadás előtt a `npm run format:check` legyen sikeres; az `npm run check` ezt is ellenőrzi. Formázás után az 500 soros korlát továbbra is érvényes: szükség esetén bontsd kisebb modulokra a fájlt.
- Saját class deklaráció és class expression TILOS, tesztekben is. Függvények, modulok, kompozíció.
- Könyvtári konstruktorok (pl. MongoClient, Error, Date) használhatók; ne vezess be saját osztályt.
- Minden kézzel karbantartott szövegfájl maximum 500 sor. Kivétel: lock- és ténylegesen generált fájlok.
- Rétegek: controller → facade → DAL. Soha ne keverd a felelősségeket.
- Controller: HTTP, inputvalidáció, cookie, státuszkód, DTO. Nincs adatbázis-import vagy üzleti döntés.
- Facade: üzleti folyamatok, jogosultságok, szolgáltatók koordinálása. Nincs Express req/res vagy közvetlen DB-kezelés.
- Minden megvalósított facade-függvény fölött közvetlenül legyen angol, leíró `/** ... */` JSDoc-komment: mit csinál üzletileg, milyen fontos feltétellel/jogosultsággal, és milyen mellékhatással. A puszta függvénynév vagy csak `@param`/`@returns` felsorolás nem elég.
- Ez a `src/facades/` alatti factorykra, objektummetódusokra, névhez kötött arrow/function expression segédekre és a factoryból közvetlenül visszaadott függvényekre is kötelező. Az egyszeri inline callbackekhez (például `map`, `filter`) nem kell külön JSDoc.
- A `npm run check:rules` AST-alapon ellenőrzi a facade-leírás meglétét és közvetlen elhelyezését, az `npm run check` részeként is. A leírás angol nyelve és üzleti pontossága kódreview-követelmény; a gépi ellenőrzés nem nyelvfelismerő.
- DAL: MongoDB-hozzáférés, indexek, atomikus írások, tranzakciók. Nincs HTTP, email vagy facade-import.
- Külső integrációk külön adapterben. Worker és admin parancs is facade-on keresztül dolgozik.
- Frontend nem importál backend-kódot; titok sosem kerül EXPO_PUBLIC változóba.

## 12-factor és processzek

- Egy verziókezelt kódbázis; explicit függőségek és lockfile; környezeti konfiguráció validálva induláskor.
- Adatbázis és egyéb szolgáltatások csatolt erőforrások; build/release/run különválasztva.
- Stateless webprocess és külön cron worker; külön indítható és horizontálisan skálázható.
- PORT alapján portkötés; gyors indulás, readiness, SIGTERM/SIGINT esetén szabályos leállás.
- Dev/staging/prod azonos működési modell; strukturált stdout/stderr log; adminfeladatok külön parancsok.
- Session, munkafoglalás, rate limit nem lehet kizárólag processzmemóriában.
- MQ jelenleg nincs. A worker feladatait MongoDB-ben atomikusan kell lefoglalni, lejáró lease-szel.
- Több worker ossza meg a külön feladatokat; legyen idempotencia és összeomlás utáni újrapróbálás.
- Globális singleton worker-lock nem megfelelő párhuzamosítás. Ne ígérj exactly-once külső mellékhatást.
- Infrastruktúra később Terraformmal, DigitalOceanen; most ne provisionálj erőforrást.

## Hozzáférés és üzleti korlátok

- Egy ügyfélfelhasználó pontosan egy hotelcsoporthoz tartozik; azon belül több hotel/részleg/szerepkör lehet.
- Platform admin külön szerep. Hotelcsoport-admin az egész csoportot, hoteladmin csak saját hoteljeit kezelheti.
- Később szerkeszthető szerepkörsablonok, saját szerepkörök és részlegek. Engedélyek összeadódnak; alapból tiltás.
- Nincs időhöz/műszakhoz kötött jogosultság; nincs kötelező 2FA.
- Minden hozzáférést backend ellenőriz. Kliensoldali elrejtés nem jogosultságvédelem.
- Egyedi szerződéses árazás; platform admin állít csoportszintű user- és szobakeretet.
- Aktív felhasználó és függő meghívó foglal helyet; deaktivált nem. Csoporton belül egy ember egyszer számít.
- Limitcsökkentés nem von vissza meglévő hozzáférést, de blokkolja az új hozzáadást.
- Új hotel aktiválásához sales-jóváhagyás szükséges.
- Felfüggesztett csoport felhasználóját vissza kell küldeni a belépéshez, „Felfüggesztve” üzenettel.
- Hosszú, visszavonható munkamenetek telefonon és desktopon.
- Későbbi támogatói belépés azonnal teljes ügyfél-admin hozzáférést ad, látható móddal és valós adminhoz kötött auditnaplóval.
- Google-belépés egyelőre kizárólag inaktív, „Hamarosan” jelölésű UI.

## Ellenőrzés

- Módosítás után releváns typecheck, szabályellenőrzés, lint és érdemi tesztek.
- Auth tesztek: jogosulatlan regisztráció, felfüggesztés meglévő sessionnel, session-visszavonás, egyszer használható meghívó.
- Több processzes invariánsokat közös valódi tesztadatbázissal ellenőrizd.
- A böngészős mobilnézet nem bizonyít natív Android- vagy iOS PWA-kompatibilitást.
- Használd a task-observer skillt érdemi munkához, és codex-toolkit-et eszközválasztáshoz.
