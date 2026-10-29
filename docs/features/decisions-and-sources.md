# Nyitott döntések és kutatási háttér

[Vissza a funkciójegyzékhez](README.md).

## Rögzített döntések

- Gyors, egyszerű, saját telefonon használható helyszíni munkavégzés a fő cél.
- A hotel maga nyomtathatja a helyszínek QR-kódjait.
- A beolvasás a konkrét szobához és annak teendőihez vezet.
- Napi/heti/havi checklisták és részlegek közötti gyors feladatrögzítés szükséges.
- A fordítás DeepSeek API-val készül. A modell feladatfüggő: külön szerveres
  beállítás tartozik a fordításhoz és a tudástár-asszisztenshez.
  A kulcsot a felhasználó később állítja be; az élő próba addig függőben marad.
- Frissített döntés: jelenleg nincs kiválasztott PMS; a PMS-integráció későbbi,
  konkrét hoteligényhez kötött fejlesztés, nem a mostani átadás feltétele.
  A DeepSeek-kulcs rendelkezésre áll a felhasználónál; a helyi szerveres
  konfiguráció és az élő próba ettől külön ellenőrizendő.
- Speciális takarítási szabályok, minibár és külsős takarítócégek az MVP részei.
- Ellenőrző körjáratok szükségesek, az MVP-ben kizárólag QR-kóddal.
- A további megbeszélt funkciókat is meg kell őrizni megvalósítandó igényként.
- A dokumentálás nem jelent kódmegvalósítást vagy minden bővítés MVP-be emelését.

## Következő termékdöntések

1. Első pilot: hotelméret, részlegek, létszám és jelenlegi munkaszervezési eszközök.
2. Későbbi PMS-igény esetén szolgáltató, adatirányok és hozzáférés kiválasztása.
3. Jogosultságmátrix: ki oszthat ki, ellenőrizhet, nyithat újra és láthat személyes adatot?
4. Napi listák adatforrása PMS nélkül; szobafoglaltság és takarítás összekapcsolása.
5. Takarítási szabályok elsőbbsége: VIP, sürgősség, DND, kimaradás és újrapróbálás.
6. Checklisták esedékessége, hotelidőzóna, kihagyások és sablonverziók kezelése.
7. Fordítás célnyelvei, automatikus/kérésre indítás, költségkeret és hibakezelés.
8. Minibár fogyasztásának elszámolása vendégváltáskor; javítás és feldolgozás jogai.
9. Külsős cégvezető jogosultságai és több hotelcsoportos szolgáltatói működés későbbi határa.
10. Körjáratnál kötelező-e a sorrend; félbehagyott kör átadható-e másik dolgozónak?
11. Eszkaláció időzítése, ismétlése, helyettesítése és prioritásonkénti szabályai.
12. Push értesítések tényleges működése natív Androidon és telepített iOS PWA-ban.
13. Hálózati hiba esetén piszkozatvédelem; kell-e később teljes offline munkavégzés?
14. Fotó- és dokumentumtárolás, hozzáférés, megőrzés és exportálás részletei.
15. Újonnan felvett funkciók sorrendje; a javasolt MVP-bővítések végleges köre.

Ezek specifikációs kérdések, nem az elfogadott funkcióigények visszavonásai.

## Kulcsfontosságú elfogadási helyzetek

- Kijelentkezett dolgozó szobai QR-t olvas, belép, ugyanahhoz a szobához jut vissza.
- Idegen hotel dolgozója és vendég ugyanazzal a kóddal sem lát belső adatot.
- Két dolgozó egyszerre próbál elvállalni egy munkát; a végső felelős egyértelmű.
- Tiszta, de műszakilag tiltott szoba nem jelenik meg automatikusan kiadhatóként.
- Új heti checklist képződik úgy, hogy az előző hét teljesítése megmarad.
- Kimaradt takarítás és kihagyott ellenőrzőpont nem számít sikeres teljesítésnek.
- A fordítószolgáltatás hibázik, de az eredeti feladat menthető és olvasható.
- Minibárbejegyzés javítása és recepciós feldolgozása visszakövethető.
- Külsős dolgozó deaktiválása után a munkái átadhatók, előzményei megmaradnak.
- A következő műszak felismeri az elakadt és át nem vett ügyeket.
- Mobilon hiba után megmarad a szöveg, és látszik, hogy az adat még nincs elküldve.

## A konkurenskutatás határa

A hotelkit nyilvános Solutions-oldalait 2026-10-29-én tekintettük át.
Ezek gyártói termékleírások, nem saját tesztelési eredmények. A csomagok és
integrációk befolyásolhatják az elérhetőséget. A marketingoldalak százalékos
hatékonyságígéreteit nem vettük át Hoteliva-követelményként.

A Hoteliva működési részletei saját tervezési javaslatok. Nem állítjuk, hogy a
konkurens minden részletben ugyanígy működik. A QR/NFC használata önmagában
nem egyedi piaci funkció; a gyors szobaoldal és teljes munkafolyamat minősége fontos.

## Áttekintett Solutions-oldalak

| Oldal                                                                                              | Tervezéshez használt témák                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [Corporate Management](https://hotelkit.net/solutions/corporate-management/)                       | Közös standardok, auditok, hotelcsoportos áttekintés    |
| [General Management & Operations](https://hotelkit.net/solutions/general-management-operations/)   | Vezetői dashboard, folyamatkövetés                      |
| [Front Office](https://hotelkit.net/solutions/front-office/)                                       | Műszakátadás, kérések és panaszok                       |
| [Housekeeping](https://hotelkit.net/solutions/housekeeping/)                                       | Takarításkiosztás, ellenőrzés, PMS, kihagyott takarítás |
| [Maintenance](https://hotelkit.net/solutions/maintenance/)                                         | Berendezések, karbantartás, ellenőrzőpontok             |
| [Human Resources](https://hotelkit.net/solutions/human-resources/)                                 | Betanítás, HR-folyamatok, belső kommunikáció            |
| [IT](https://hotelkit.net/solutions/it/)                                                           | Eszközkiadás, beruházási igény, SSO                     |
| [Team Communication](https://hotelkit.net/solutions/team-communication/)                           | Megemlítés, emlékeztető, közlemény, chat, szavazás      |
| [Tasks & Process Management](https://hotelkit.net/solutions/tasks-process-management/)             | Eszkaláció, sablonok, események, belépés/kilépés        |
| [SOPs & Knowledge Management](https://hotelkit.net/solutions/sop-knowledge-management/)            | Kézikönyv, helyszíni munkautasítás                      |
| [Repairs & Preventive Maintenance](https://hotelkit.net/solutions/repairs-preventive-maintenance/) | Gyors hibasablon, garancia, ismétlődő karbantartás      |
| [Cleaning Workflows](https://hotelkit.net/solutions/cleaning-workflows/)                           | Szobatörténet, VIP, külsősök, ágyneműcsere, minibár     |
| [Guest Services](https://hotelkit.net/solutions/guest-services/)                                   | Kéréssablon, panasz, kompenzáció                        |
| [Analytics & Reports](https://hotelkit.net/solutions/analytics-reports/)                           | Átfutási idők, terhelés, visszatérő problémák           |

## További korábban áttekintett források

- [Housekeeping termék](https://hotelkit.net/products/housekeeping/)
- [Facility Management termék](https://hotelkit.net/products/facility-management/)
- [Collaboration termék](https://hotelkit.net/products/collaboration/)
- [Knowledge AI](https://hotelkit.net/products/knowledge-ai/)
- [Felülvizsgálat és olvasási visszaigazolás](https://hotelkit.net/blog/up2date-with-hotelkit_summer-edition-2025/)
- [Integrációs példák](https://hotelkit.net/blog/hotelkit-annual-review-2025/)
- [Kapacitástervezési funkciók a Radisson-változatban](https://clients.hotelkit.net/radisson/table-hotelkit-access-vs-radisson-operatins-app/)

A forráslinkek kutatási háttérként maradnak meg; a termék követelményeinek
elsődleges nyilvántartása a funkciójegyzék és a hozzá tartozó részletes dokumentumok.
