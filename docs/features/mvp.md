# MVP – napi működés és helyszíni munkavégzés

[Vissza a funkciójegyzékhez](README.md). Minden alábbi funkció tervezett MVP-igény.

## F01 – Hotel, helyszínek és csapat

- Hotelcsoport, hotelek, épületek, emeletek, szobák és közös helyiségek kezelése.
- Kezdeti szobalista importja; részlegek és dolgozói hozzárendelések.
- Hotelcsoport-admin, hoteladmin, részlegvezető és dolgozói munkavégzéshez szükséges jogok.
- Több hotelhez/részleghez rendelhető munkatárs a saját hotelcsoportján belül.
- Deaktiválás és nyitott feladatok átadása; a korábbi teljesítések szerzője megmarad.
- A fióklétrehozás és hotelaktiválás meglévő üzleti korlátai érvényesek.

## F02 – QR-kód és helyszíni gyorsoldal

- Minden szoba és közös helyiség saját QR-kódot kap.
- Egyenként és tömegesen letölthető, nyomtatható PDF hotelnévvel és szobaszámmal.
- Saját telefon kamerájából beolvasva a konkrét helyszín nyílik meg.
- Androidon cél a telepített app megnyitása, app nélkül böngészős használat.
- Belépés után visszatérés az eredetileg beolvasott szobához.
- A jogosulatlan beolvasó, például vendég, nem lát belső adatokat.
- Átnevezéskor a kód maradjon érvényes; szükség esetén visszavonható és új kiadható.
- Központi műveletek: takarítás/checklist, feladat a takarításnak, hiba a karbantartásnak.
- A helyszín automatikus, a címzett részleg a műveletből következik.
- Nyitott ügyek megjelenítése az ismételt bejelentések csökkentésére.
- Minibárrögzítés és az aktuális körjárati ellenőrzőpont elérhető ugyaninnen.
- Közös helyiségekre is működik: folyosó, mosókonyha, wellness, gépház.

Példa: 204-es szoba beolvasása → „Hibajelzés” → leírás/fotó → karbantartás megkapja.

## F03 – Feladatok és hibabejelentés

- Helyszín, részleg, felelős, határidő, prioritás, leírás, fotó és megjegyzések.
- Kiosztható egy személynek vagy részlegnek; a konkrét felelős később is kijelölhető.
- Elvállalás, munkakezdés, elakadás, teljesítés, szükség esetén ellenőrzés és újranyitás.
- Elakadás oka, például „alkatrészre vár” vagy „szoba nem hozzáférhető”.
- Egyértelmű felelősség akkor is, ha több dolgozó vagy egy részleg látja az ügyet.
- A bejelentő és érintettek értesülnek a lényeges változásokról és befejezésről.
- Előzmények: ki mit és mikor módosított; műszakváltáskor is értelmezhető állapot.
- Párhuzamos elvállalás vagy szerkesztés nem okozhat észrevétlen adatvesztést.

Példa: csöpögő csap → fotó → karbantartó elvállalja → alkatrészre vár → javítja
→ illetékes ellenőrzi → lezárás. Sikertelen javítás esetén újranyitható.

## F04 – Takarítás, szobaállapot és speciális szabályok

- Napi takarítási lista összeállítása és dolgozókhoz rendelése.
- Sorrend és sürgősség megjelenítése, munkakezdés és befejezés rögzítése.
- Ellenőrzésre váró, elfogadott és javításra visszaadott takarítás kezelése.
- A recepción is látható, friss takarítási állapot.
- A foglaltság, tisztaság/ellenőrzés és műszaki tiltás külön állapotdimenzió.
- A „takarítás kész” önmagában nem jelent vendégnek kiadható szobát.
- Szobatípusonként eltérő checklist és bekészítés.
- Napi/bentlakó takarítás és kijelentkezés utáni takarítás megkülönböztetése.
- Ágyneműcsere-intervallumok, VIP-bekészítések és sürgős szobák.
- „Ne zavarjanak”, vendég bent, takarítást nem kér és egyéb kimaradás rögzítése.
- A kihagyás oka és az esetleges újrapróbálás legyen követhető.
- Időszakos nagytakarítások és közös területek takarítása is tervezhető.

PMS nélkül tisztázandó a foglaltság, érkezés/távozás és napi lista adatgazdája;
a pilot nem épülhet ellenőrizetlen vagy túl sokszor kézzel másolt állapotokra.

## F05 – Checklisták és ismétlődő rutinok

- Vezető által szerkeszthető, több helyszínen felhasználható sablonok.
- Napi, heti, havi ütemezés; az eseményhez kötött takarítás is támogatandó.
- Minden esedékesség külön teljesítési példány, a régi pipák nem íródnak felül.
- Alapnézetben a most esedékes és elmaradt tételek jelenjenek meg.
- Tételenként dolgozó és teljesítési idő; szükség szerint megjegyzés és fotó.
- „Nem végezhető el” indokkal; a kimaradás különbözik a sikeres teljesítéstől.
- Tételből közvetlen hibabejelentés, az eredeti checklisthez kapcsolva.
- Vezetői ellenőrzés külön lépésként, ahol a folyamat megkívánja.
- Recepciós nyitás/zárás, reggeli előkészítés, közös terek ellenőrzése is lefedhető.
- Bővítendő mezők: pipa, szám és mértékegység, fotó, szöveg, megfelelő/nem megfelelő.
- A méréses és higiéniai rutinokhoz tartozó konkrét sablonokat a hotel határozza meg.

## F06 – QR-es ellenőrző körjáratok

- Ellenőrzőpontokból álló útvonal, pontonként saját teendőkkel.
- Napi/heti/havi esedékesség és felelős személy vagy csoport.
- Minden pont QR-kódos; az MVP-ben nincs NFC.
- Beolvasás, elvégzett ellenőrzés és eredmény külön dokumentálható időponttal.
- Mérési értékek, fotók, megjegyzések és azonnali hibabejelentés.
- Kihagyott pontok és félbehagyott körjárat a vezető számára láthatók.
- A beolvasás önmagában nem jelenti az összes teendő teljesítését.
- Másolható QR-kód alapján nem ígérünk bizonyított fizikai jelenlétet.

Példa: gépház → hátsó kijárat → wellness; minden ponton a hozzá tartozó lista nyílik.

## F07 – Minibárfogyasztás

- Hotel által kezelt terméklista, a szobaoldalon gyors termék- és mennyiségválasztás.
- Ki, mikor, melyik szobában, milyen fogyasztást rögzített.
- Javítható bejegyzések, megmaradó módosítási előzmények.
- A recepció áttekintheti és feldolgozottnak jelölheti a fogyasztásokat.
- A feltöltési munka elkülönítendő a vendég fogyasztásának rögzítésétől.
- A szobacserék/távozások melletti elszámolási azonosítás pontosítandó.
- Automatikus számlára terheléshez külön PMS-integráció szükséges; az alapverzió rögzít.

## F08 – Külsős takarítócégek

- Szolgáltató céghez rendelhető, saját fiókkal dolgozó munkatársak.
- Csak az engedélyezett helyszínek, feladatok és szükséges adatok láthatók.
- A hotel kiosztja, követi és ellenőrzi a külsős munkát is.
- Hozzáférés visszavonható, a nyitott feladatok átadhatók.
- A történeti teljesítésnél megmarad a dolgozó és a szolgáltató azonosíthatósága.
- Az MVP-ben egy fiók egy hotelcsoporthoz tartozik, és foglal felhasználói férőhelyet.
- Több ügyfélhotelcsoportot összefogó szolgáltatói portál külön későbbi döntés.

## F09 – Fordítás DeepSeek API-val

- A választott fordítási szolgáltató DeepSeek; nem Google Translate.
- Feladatleírások, megjegyzések és checklistaszövegek fordítása a dolgozó nyelvére.
- Eredeti szöveg megőrzése, gépi fordítás egyértelmű jelölése és eredeti megnyitása.
- Azonos tartalom fordítása újra felhasználható; módosult eredetihez új fordítás tartozik.
- A feladat mentését nem blokkolja a fordítás késése vagy szolgáltatói hibája.
- Támogatott célnyelvek és automatikus/kérésre történő fordítás még pontosítandó.
- A magyar–angol kezelőfelület fordítása külön karbantartott UI-szövegkészlet marad.
- A szolgáltató elérése backendadapteren át történik; API-kulcs nem kerül a kliensbe.
- Csak az adott művelethez szükséges tartalom továbbítandó, a hozzáférési határok megtartásával.

## F10 – Műszakátadás

- Nyitott ügyek, fontos megjegyzések és következő műszak teendői egy átadásban.
- Meglévő feladatra hivatkozás, a részletek kézi másolása helyett.
- Hotel/részleg szerinti célzás, átadó és átvevő visszajelzése.
- Átvétel után is követhető megjegyzések és változások.
- Az átadás nem zárhatja le automatikusan a még nyitott feladatokat.

## F11 – Vendégkérések

- A recepció rögzíti a kérést szobával, részleggel, határidővel és prioritással.
- Kiosztás/elvállalás, teljesítés és recepción látható eredmény.
- Első körben a közös feladatkezelés egyik típusa; saját vendégapp nem szükséges.
- Példák: plusz párna, törölköző, kiságy, visszahívási kérés.
- A részletes panasz- és kompenzációkezelés külön elfogadott bővítés, F19.

## F12 – Kezdőlap, értesítések és vezetői áttekintés

- Dolgozónak mai munkák, sürgős ügyek, új hozzárendelések és elmaradások.
- Vezetőnek részleg/hotel szerinti folyamatállapotok és munkaterhelés.
- Alapmutatók: elvégzendő, folyamatban, ellenőrzésre váró és lejárt munkák.
- A mutatóból közvetlenül a megfelelő szűrt listára lehessen jutni.
- Értesítések az érintetteknek; sürgős események külön felismerhetők.
- Alkalmazáson belüli értesítési lista és platformonként megtervezendő push működés.
- A kézbesítetlen értesítés nem jelent el nem mentett feladatot.
- A natív Android, mobilweb és telepített iOS PWA működését külön kell igazolni.
