# Hoteliva

TypeScript monorepo: Express API + Expo / React Native kliens.
Meghívásos belépés és 30 modulból álló, magyar/angol hotelműködési munkafelület.
A tényleges készültséget és a még hiányzó integrációkat az
[implementációs jegyzék](docs/features/implementation.md) részletezi.
Android natív célplatform; iOS PWA; desktop böngésző.

## Tervezett termékfunkciók

A részletes, elfogadott funkcióigényeket a [funkcióterv](docs/features/README.md)
tartalmazza. Ez termékterv, nem a már megvalósított funkciók felsorolása.

## Helyi indítás

Node.js 24 és Docker szükséges. A MongoDB a 27028-as portot használja,
hogy ne ütközzön az alapértelmezett helyi MongoDB-vel. A Docker-konfiguráció
kizárólag helyi fejlesztésre való, nem éles deployment.

```bash
npm ci
docker compose up -d --wait
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Az első platform admint egyszeri parancs hozza létre. Állítsd be az
`apps/server/.env` fájlban a `BOOTSTRAP_EMAIL` és `BOOTSTRAP_PASSWORD`
változókat (legalább 12 karakteres jelszó), majd:

```bash
npm run bootstrap -w @hoteliva/server
npm run dev
```

A bootstrap változókat utána töröld a `.env` fájlból. Nincs beégetett vagy
nyilvános alapjelszó. Meglévő fiókot a bootstrap nem ír felül.

- Kliens: http://localhost:8081
- API: http://localhost:3001
- Worker külön terminálban: `npm run dev:worker`
- Android: `npm run android -w @hoteliva/client`

Fizikai Android-eszközön a `EXPO_PUBLIC_API_URL` legyen a gép LAN-címe,
ne localhost. A végleges buildben HTTPS API szükséges. A `WEB_ORIGIN`
a böngészős kliens pontos originje; élesben az API ugyanazon site alatt
fusson (például app.example.com és api.example.com), a SameSite cookie miatt.
Proxy-beállítás nincs találomra bekapcsolva: az éles proxy-topológiát később
kell konfigurálni, különösen az IP-alapú rate limithez.

## Felépítés

```text
apps/server/src/
  controllers/   HTTP, validáció, cookie-k
  facades/       üzleti folyamatok, hozzáférések
  dals/          MongoDB, indexek, atomikus írások
  adapters/      SendGrid, DeepSeek, QR-képgenerálás
  commands/      egyszeri adminparancs
  web.ts         webprocess
  worker.ts      cron worker
apps/client/src/
  app/           Expo Router belépési pontok
  screens/       belépés és reszponzív munkafelület
  design-system/ témák, tokenek, közös vezérlők
  operations/    a 30 üzleti modul képernyői
  lib/           API, session, HU/EN szövegek
```

MongoDB replica set szükséges a férőhelyfoglalás és fióklétrehozás közös
tranzakciójához; a helyi Compose ezt beállítja. Nincs MQ.
Minden worker ugyanabból a MongoDB-feladattáblából foglal külön munkát.
A session-takarításon túl a worker hozza létre az ismétlődő rutinokat,
kezeli a saját emlékeztetőket és a lejárt munkák vezetői jelzéseit.
A rutinok külön lease-t és egyedi ismétlődési kulcsot kapnak.
A worker nélkül az időzített funkciók nem futnak.

## Belépés és meghívás

A session alapértelmezésben 90 napig érvényes, kijelentkezéskor visszavonódik.
Weben HttpOnly cookie, natívan SecureStore tárolja a tokent; a DB-ben csak hash van.
A user és a hotelcsoport aktuális állapota minden hitelesített kérésnél ellenőrzött.
A kliens 30 másodpercenként és alkalmazásaktiváláskor frissíti a sessiont.

Nincs publikus regisztráció. Platform adminnal hitelesítve:

| Végpont                           | Művelet                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `POST /auth/login`                | email + password; weben session cookie                        |
| `GET /auth/me`                    | aktuális felhasználó                                          |
| `POST /auth/logout`               | session visszavonása                                          |
| `PATCH /auth/locale`              | `{ "locale": "hu" }` vagy `en`                                |
| `POST /platform/groups`           | `{ "name": "Hotelcsoport", "maxUsers": 20, "maxRooms": 100 }` |
| `POST /platform/users`            | email, name, groupId, role, opcionális locale/hotelIds        |
| `POST /platform/users/:id/resend` | függő meghívás újraküldése                                    |
| `POST /auth/activate`             | meghívóból token + választott password                        |

A létrehozható szerepek: `group_admin`, `hotel_admin`, `member`.
Hoteladminnál legalább egy hotelazonosító szükséges.
A platform admin nem rendelhető ügyfélcsoporthoz az API-n.
A műveleti végpontok minden kérésnél ellenőrzik a csoport/hotel/helyszín hatókört.
Az egyedi szerepkörök és közvetlen engedélyek összeadódnak. A jogosultságok
módosítása a már bejelentkezett munkatársak következő kérésére is érvényes.

Webes cookie-s írásokhoz `Origin: <WEB_ORIGIN>` szükséges. Natív kliensnél
`X-Hoteliva-Client: native` fejléc a login válaszában tokent kér, amit a további
kérések `Authorization: Bearer ...` fejléccel küldenek.

Emailhez `SENDGRID_API_KEY` és ellenőrzött `SENDGRID_FROM_EMAIL` szükséges.
A meghívó 24 órás, egyszer használható. Emailküldési hiba esetén az API
`{ id, emailSent: false }` választ ad; a fiók és foglalt hely megmarad,
a meghívó újraküldhető. A titkos meghívótoken nem kerül logba vagy API-válaszba.

## Ellenőrzés és build

```bash
npm run check
npm run test:browser
node scripts/visual-review.mjs
npm run build
npm run build:android -w @hoteliva/client
```

A backendtesztek saját ideiglenes MongoDB replica setet indítanak; az első
futtatás letöltheti a MongoDB binárist. Külső emailt nem küldenek.
A böngészőtesztekhez egyszer `npx playwright install chromium` szükséges.
A tesztek saját API-t és Expo szervert indítanak a 3001/8081 porton;
az ott futó fejlesztői szervert előtte állítsd le.

Az Android export a JS-csomagot ellenőrzi, nem állít elő telepíthető APK/AAB-t.
Az `eas.json` előkészíti a preview APK és production AAB profilját. Az Expo/EAS
projekt, aláírás és Play Console-fiók összekötése még nincs elvégezve.
A `com.hoteliva.app` azonosítót az első kiadás előtt véglegesíteni kell.

A webexport `apps/client/dist` könyvtárban készül, HTTPS statikus hosting és
SPA fallback kell hozzá. A PWA online-only: nincs adatcache vagy offline írás.
iOS-en a tényleges kezdőképernyős telepítést valós készüléken kell ellenőrizni.

## Tudatosan későbbi feladatok

- Támogatói belépés a valódi adminhoz kötött auditnaplóval.
- Szolgáltatóspecifikus PMS/HR/SSO/vendégkommunikációs adatkapcsolatok.
- Háttérbeli push kézbesítés, offline szinkron, nagy adathalmazok terhelési próbája.
- Elfelejtett jelszó, működő Google OAuth (a gomb most inaktív).
- Terraform/DigitalOcean provisioning, Spaces, domain és éles SendGrid-konfiguráció.
- Play Store kiadás, natív készüléktesztek, iOS PWA-készülékteszt.

## Design system és AI

A [design system leírása](docs/design-system.md) megmutatja, hol cserélhető
központilag a paletta, a tipográfia és a közös vezérlők megjelenése.
Az elfogadott mockupok a `design/hoteliva-atlas/dist/assets/screens` alatt vannak.
A böngészős teszt 120 aktuális képet készít a `test-results/screens` könyvtárba.

A fordítás és a tudástár-asszisztens szerveroldali adaptert használ.
A `DEEPSEEK_API_KEY`, `DEEPSEEK_TRANSLATION_MODEL` és
`DEEPSEEK_ASSISTANT_MODEL` csak a szerver környezetébe kerülhet.
A modellválasztás feladatfüggő: a fordítás és a tudástár-asszisztens külön
modellt használhat. A kliens nem választhat tetszőleges szolgáltatói modellt.
Kulcs/modell nélkül a szolgáltatás elérhetetlenségi hibát ad; nincs álfordítás.
Az automatizált teszt külön helyettesített szolgáltatót használ, ezért nem
igazol élő DeepSeek-kapcsolatot. Fényképek jelenleg a MongoDB külön
kollekciójában vannak, egyenként legfeljebb 4 MB mérettel; a Spaces-adapter későbbi feladat.
