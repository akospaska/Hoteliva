# A 30 funkció megvalósítási állapota

Ez a jegyzék megkülönbözteti a működő alkalmazáskódot az elfogadott
[teljes funkciótervtől](README.md). Nem teljes termékátvételi igazolás.
Mind a 30 modul elérhető a munkafelületen; több funkciónál az alábbi
korlátok miatt még nincs meg a teljes elfogadott terjedelem.

## Modulonként

| Azonosító                | Megvalósított működés                                                                                                     | Határ / további munka                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| F01 Hotel és helyszínek  | Hoteljóváhagyás, helyszínek, szobakeret, tömeges szobafelvétel, hotel szerinti hatókör                                    | Import újraküldése nem idempotens; saját részlegtörzs szerkesztése hiányzik                                      |
| F02 Szoba és QR          | Szobánként visszavonható QR, nyomtatási lap, jogosultságos feloldás, szobáról indított munka                              | Natív kamera, valódi nyomtató és telepített appot megnyitó domainkapcsolat nincs készüléken igazolva             |
| F03 Feladatok            | Kiosztás, elvállalás, munka, elakadás, ellenőrzés, visszaküldés, jóváhagyás, fotó, előzmény                               | Egyidejű módosítás verzióütközést ad; offline munkavégzés nincs                                                  |
| F04 Takarítás            | Napi terv, kategória, bentlakó/távozó, VIP, DND, kihagyás, textilcsere, tranzakciós szobaállapot                          | PMS foglaltságot most kézzel kell karbantartani; automatikus kapacitásoptimalizálás nincs                        |
| F05 Checklisták          | Kötelező jelölő/szám/szöveg/fotó, kivételindok, útmutató, napi/heti/havi rutin                                            | A workernek külön futnia kell                                                                                    |
| F06 Körjáratok           | Pontonként egyező QR, teljesítési feltételek, ellenőrzés                                                                  | Helyszíni kamera- és hálózati próba szükséges; NFC nincs a körben                                                |
| F07 Minibár              | Termékkatalógus, mennyiségek, szobához kötött tételek, árpillanatkép, ismételt beküldés védelme, recepciós feldolgozás    | Nem terhel PMS-számlát és nem von le automatikusan készletet                                                     |
| F08 Külsősök             | Szolgáltató, személyenként hotel/helyszín/részleg/engedély, egyedi szerepkörök, visszavonás                               | A fiókot továbbra is platform admin hívja meg                                                                    |
| F09 Fordítás             | Szerveroldali DeepSeek-adapter, eredeti szöveg, nyelvválasztás, cache, kvóta, válasz előtti új jogosultságellenőrzés      | A kulcsot a felhasználó később állítja be; külön fordítási modellel élő próba szükséges                          |
| F10 Műszakátadás         | Műszak, felelős, kapcsolt ügyek, checklist, olvasási visszaigazolás, megjegyzések                                         | Külön műszakbeosztási rendszer nincs                                                                             |
| F11 Vendégkérések        | Helyszín, típus, felelős, prioritás, határidő, közös munkafolyamat                                                        | Külső vendégkommunikációból automatikus beérkezés nincs                                                          |
| F12 Áttekintés           | Valós adatokból mutatók, részletlista, órás takarítási grafikon, sürgős ügyek, szobakártyák                               | A grafikon eszköz helyi idejét használja; nincs foglalási előrejelzés                                            |
| F13 Gyors bejelentés     | Hotelhez tartozó sablon, előtöltött munka, szobaoldali gyors műveletek                                                    | A sablonok egyszerű listában vannak, külön hierarchikus hibakatalógus nincs                                      |
| F14 Vezetői jelzés       | Hotel/típus/prioritás szerinti határidőszabály, worker, lejártügy-lista                                                   | Alkalmazáson belüli értesítés; háttérbeli push és helyettesítési szabály nincs                                   |
| F15 Szobatörténet        | Időrendi, helyszín/típus/állapot/dátum szerinti lista, eredeti ügy megnyitása                                             | Visszatérő hibák jelzése cím szerinti, nem szemantikus hibafelismerés                                            |
| F16 Személyes követés    | Jogosult kolléga megemlítése, értesítés, könyvjelző, saját emlékeztető                                                    | Háttérbeli push nincs                                                                                            |
| F17 Tudástár             | Cikk, videóhivatkozás, fotó, közzététel, verzióelőzmény, verzióhoz tartozó olvasási visszaigazolás, checklistből útmutató | Közzétételkor csak az aktuálisan jogosult célközönség kap értesítést; videó linkként tárolódik                   |
| F18 Riportok             | Dolgozói terhelés, becsült percek, aktív/várakozási/átfutási idő, dátum/részleg/dolgozó szűrő, mentett alapnézet          | Aktív idő lezárt munkaszakaszokból; nincs automatikus optimális kiosztás vagy teljes BI                          |
| F19 Panasz               | Strukturált ügy, intézkedések, kapcsolt munka, kompenzáció külön jogosultsággal                                           | A bejegyzés nem pénzügyi tranzakció                                                                              |
| F20 Rendezvény           | Naptár, kapcsolt részlegfeladatok, határidők, csomagmásolás dátumeltolással, nyitott gyermekmunka lezárási gátja          | Nincs külső rendezvényrendszer-szinkron                                                                          |
| F21 Betanítás/kilépés    | Sablon/checklist, kapcsolt szabályzat, hozzáférés-megszüntetés, nyitott munka átadása, session-visszavonás                | HR-szinkron és bérszámfejtés nincs                                                                               |
| F22 Beszerzés            | Igény, mennyiség/ár, visszaküldés, jóváhagyás, külön átvétel                                                              | Nincs automatikus rendelés/kifizetés, többszintű értékhatáros jóváhagyás                                         |
| F23 Eseményjelentés      | Korlátozott hozzáférés, időpont, leírás, fotó, kapcsolt követő feladat, előzmény                                          | A hotel kötelező mezőit és adatmegőrzését bevezetéskor még véglegesíteni kell                                    |
| F24 Audit                | Sablon több helyszínre, önálló verziópillanatképek, checklist, hiányosságból feladat                                      | Teljesített/eltérő pontok és nyitott javító munkák összesítése van; súlyozott pontozás nincs                     |
| F25 Berendezés           | Adatlap, garancia/szállító, QR, kapcsolt útmutató, ismétlődő karbantartás, mérőállás/előzmény                             | Utolsó mérések grafikonja és különbözete elérhető; használati küszöbök és PDF-dokumentumtár hiányzik             |
| F26 Eszközkiadás         | Egyidejű kiadás védelme, jogosult átvevő, átvételi visszaigazolás, visszaadás és fotóelőzmény                             | Valódi terepi átadási próba szükséges                                                                            |
| F27 Kommunikáció         | Résztvevős beszélgetés, kommentek, olvasási állapot, közlemény, ötlet, szavazás, reakció, naptár                          | Lekérdezéses frissítés; nincs WebSocket, háttérbeli push, videófeltöltés vagy részletes értesítési beállítás     |
| F28 Talált tárgy/készlet | Tárgyadatlap, kiadási indok, fotó, készletmozgás, negatív készlet tiltása, utánpótlási igény                              | Teljes leltár, raktárközi mozgás és textilkörforgás nincs                                                        |
| F29 Tudástár-AI          | Jogosult közzétett cikkek keresése, DeepSeek-válasz, forráshivatkozás, változás esetén válasz visszautasítása             | Külön asszisztensmodell; kulcsszavas forráskeresés, élő és többnyelvű minőségi próba még szükséges               |
| F30 Integrációk          | Szolgáltató- és kapcsolatigény-nyilvántartás, látható „nincs éles adapter” állapot                                        | PMS a felhasználó döntése alapján későbbi, igény szerinti feladat. HR/SSO/vendégkommunikációs éles adapter nincs |

## Közös műszaki alap

- MongoDB-ben mentett adatok, fényképek külön kollekcióban, változási előzmények.
- Optimista verzióellenőrzés; kapcsolt szobaállapot és takarítás közös tranzakcióban.
- Egyedi kulcsokkal védett ismétlődő munka, minibár- és csomagbeküldés.
- Backend oldali csoport/hotel/helyszín/részleg/engedély ellenőrzés.
- Platformadmin meghívás, szerződéses keretmódosítás, csoportfelfüggesztés.
- HU/EN felület, világos/sötét téma, közös [design system](../design-system.md).

## Ellenőrzési bizonyítékok és korlátok

A szervertesztek tényleges ideiglenes MongoDB replica seten futnak, több
szolgáltatáspéldány egyidejű műveleteit is vizsgálják. A tesztekben az email
és az AI helyettesített szolgáltató; valódi külső szolgáltatót nem igazolnak.

A Playwright-tesztek desktop Chrome-ban és mobilméretű Chrome-ban valódi
Expo-webes képernyőkkel dolgoznak. Belépés, feladat-létrehozás/szerkesztés/
ellenőrzés/jóváhagyás, újratöltés utáni megmaradás, QR nyomtatási dokumentum,
minibár, takarítás, napi terv, szavazás, tudástár-közzététel és mentett
riportszűrő szerepel az üzleti böngészős tesztekben.
Az összes modul mindkét témában megnyílik és képernyőképet kap.

Ez **nem** jelent 30 külön modul minden műveletére teljes E2E lefedettséget.
Az Android export JS-bundle ellenőrzés, nem telepített natív alkalmazás tesztje.
Ebben a környezetben nincs Android SDK/emulátor/csatlakoztatott készülék;
natív Android, kamerás QR, háttérből visszatérés és iOS telepített PWA
készülékes ellenőrzése még elvégzendő.

Az atlasz palettája, Manrope betűi, kártyái és desktop/mobil navigációs iránya
átkerült a design systembe. Az egyedi atlaszelrendezések teljes, képenkénti
egyezése nincs igazolva; több modul közös listát és szerkesztőt használ.
Nagy hotelcsoportos adatmennyiségre terhelési próba még nem történt.

## Következő átvételi feltételek

1. A PMS későbbre halasztva; szolgáltatóválasztás jelenleg nem átadási feltétel.
2. DeepSeek szerveroldali konfiguráció, élő fordítási és tudástár-minőségi próba.
3. Android készülék/emulátor és iOS PWA-próba, kamera és telepített linkmegnyitás.
4. A táblában megjelölt helyi hiányok és a modulonkénti mockupeltérések lezárása.
5. A pilot hotel munkatársaival teljes műszakfolyamat és reprezentatív adatmennyiség próbája.
