# További elfogadott funkciók

[Vissza a funkciójegyzékhez](README.md).
Minden alábbi elem kell a termékbe. A részletes működés tervezési alap;
az ütemezés és a nyitott üzleti szabályok még véglegesítendők.

## F13 – Gyors hibasablonok és vendégkérés-sablonok

Besorolás: MVP-bővítésre javasolt.

- Hotel által konfigurálható gyakori hibák és kérések, alapértelmezett címzett részleggel.
- Hibakategóriák például világítás, víz, klíma és bútor, alattuk konkrét hibatípusok.
- QR beolvasás után a helyszín automatikus; gyakori esetben nem kell gépelni.
- A sablon kiegészíthető szöveggel, fotóval, mennyiséggel és sürgősséggel.
- Vendégkérésnél például „2 törölköző”, „plusz párna”, „kiságy”.
- Az elküldött ügy a közös feladatfolyamatban követhető, nem külön elvesző üzenet.
- Sablonmódosítás nem írja át a korábban létrehozott ügy tartalmát.

## F14 – Automatikus vezetői jelzés

Besorolás: MVP-bővítésre javasolt.

- A határidőn túl nyitott feladatokról az illetékes vezető értesítést kap.
- Külön listázható az el nem vállalt, folyamatban lévő, elakadt és lejárt munka.
- Feladattípus és prioritás alapján konfigurálható figyelmeztetési idő.
- Az értesítési előzmény mutatja, kinek és mikor ment jelzés.
- Ismétlődő jelzések és helyettes vezető szabályait még pontosítani kell.
- Lezárt vagy átütemezett ügy ne kapjon elavult eszkalációt.
- Példa: sürgős vendégkérést senki nem vállal el → vezetői jelzés → új kiosztás.

## F15 – Egységes szobatörténet

Besorolás: MVP-bővítésre javasolt.

- Egy helyszínhez tartozó takarítások, ellenőrzések, javítások és minibárbejegyzések.
- Időrendi áttekintés és szűrés eseménytípusra, időszakra és állapotra.
- Az eseményből megnyitható az eredeti ügy, checklist vagy fogyasztási bejegyzés.
- A nyitott ügyek mellett a lezárt, újranyitott és javított tételek is visszakereshetők.
- Látszik, ha ugyanazon szobában rendszeresen visszatér egy hiba.
- A közös idővonal sem adhat hozzáférést olyan részletekhez, amelyekhez a dolgozó nem jogosult.

## F16 – Megemlítések, emlékeztetők, könyvjelzők

- Feladat és átadás megjegyzésében @megemlítéssel bevonható egy jogosult kolléga.
- Megemlítéskor célzott értesítés, a hozzáférés automatikus kibővítése nélkül.
- Saját emlékeztető például „nézzek rá délután”; nem módosítja az ügy közös határidejét.
- Gyakran használt információk és útmutatók könyvjelzőzhetők.
- Lezárt vagy már nem hozzáférhető ügyhöz tartozó emlékeztető megfelelően kezelendő.

## F17 – Tudástár és helyszíni munkautasítások

- Kereshető, kategorizált belső kézikönyv szöveggel, fotókkal és videóval.
- Hotel/részleg szerint elérhető működési standardok és szabályzatok.
- Takarítási lépések, vegyszerhasználat, gépkezelés, bekészítési referenciafotók.
- Checklisttételből és helyszínoldalról „Így csináld” művelettel elérhető útmutató.
- Berendezés QR-kódjáról közvetlenül elérhető a hozzá tartozó utasítás.
- Cikkfelelős, felülvizsgálati esedékesség és emlékeztető az elavulás csökkentésére.
- Verzió- és módosítási előzmény; fontos változásnál célzott értesítés.
- Kifejezett „elolvastam” visszaigazolás kérhető, az érintett cikkverzióhoz kötve.
- A puszta megnyitás és a kifejezett visszaigazolás külön adat.
- Az elolvasás nem tekinthető automatikusan a megértés vagy betanítás igazolásának.

## F18 – Kapacitásalapú kiosztás és riportok

- Dolgozónként látható kiosztott munkamennyiség, nyitott feladatok és becsült terhelés.
- Szobatípus és takarításfajta szerinti becsült perc vagy munkapont használható.
- A nagy apartman és kis szoba, napi és távozás utáni takarítás eltérően súlyozható.
- Kézi átrendezés, előzetes napi tervezés; automatikus kiosztás későbbi részletes szabályokkal.
- Tényleges takarítási és ellenőrzési idő, napi elkészült szobák, elmaradások.
- Hibák és kérések teljes átfutási ideje, visszatérő hibatípusok és helyszínek.
- Csúcsidőszakok és torlódások: mikor jön sok kérés, hol várakozik a munka.
- Hotel/részleg/időszak szerinti szűrés, csoportszintű vezetői összesítés.
- Személyre szabható vezetői nézetek és mentett szűrések.
- A mért idő különbözzön az aktív munkától, várakozástól és teljes átfutástól.
- A PMS-ből érkező távozási időt igénylő mutatók csak megfelelő adatkapcsolattal használhatók.

## F19 – Panaszok és kompenzáció

- Strukturált panaszlap szobával/helyszínnel, típussal, prioritással és felelőssel.
- Megoldási határidő, eszkaláció, státusz és kapcsolódó javítási/feladatügyek.
- Megtett intézkedés, vendéggel megbeszélt megoldás és utánkövetés rögzítése.
- Kompenzáció típusa és költsége, például reggeli vagy kedvezmény.
- Vendég visszajelzése/hangulata rögzíthető; a mezők és hozzáférések pontosítandók.
- Példa: zajpanasz → recepció intézi → karbantartási feladat → megoldás → utánkövetés.
- A pénzügyi jóváhagyás és számlázás nem következik automatikusan a bejegyzésből.

## F20 – Rendezvények közös feladatcsomagjai

- Rendezvény neve, időpontja, helyszínei, kapcsolattartója és közös instrukciói.
- Egy eseményhez több részleg saját feladatai és checklistái kapcsolódnak.
- Újrahasználható eseménysablonok, például esküvő, konferencia, csoportérkezés.
- Feladatonként felelős és határidő, eseményszintű haladás és változásértesítés.
- Közös naptárban megjeleníthető fontos időpontok.
- Példa: konferenciaterem előkészítése, takarítása, technikai ellenőrzése egy csomagban.

## F21 – Betanítás, belépési és kilépési folyamat

- Szerepkör/részleg szerinti betanítási sablon új dolgozónak.
- Oktatások, útmutatók, helyszínbejárás, eszközhasználat és próbamunka.
- Betanító vagy ellenőrző felelős; teljesítés és vezetői visszajelzés külön rögzíthető.
- Kapcsolódó belső szabályzatok, juttatási és munkavégzési információk.
- Kilépéskor kulcs, munkaruha és eszköz visszaadása, nyitott feladatok átadása.
- Hozzáférés megszüntetésének nyomon követése, a történeti adatok megtartásával.
- Szabadság-, képzési és egyéb HR-kérelmekhez sablonos folyamatok tervezendők.
- Személyes HR-adatokhoz külön hozzáférés kell; nem kerülnek általános részlegnézetbe.
- Ez nem írja át a platform admin által végzett fióklétrehozás jelenlegi szabályát.

## F22 – Beszerzési és beruházási igények

- Igény tárgya, indoka, mennyisége, becsült ára, helyszíne és opcionális fotó/ajánlat.
- Beküldő, illetékes jóváhagyó, döntés és indoklás követése.
- Visszaküldés pontosításra, elutasítás, jóváhagyás és beszerzés állapota.
- Hotel- és csoportszinten kezelhető kérelmek, megfelelő jogosultsággal.
- Példa: új porszívó vagy hibás eszköz cseréje.
- Jóváhagyási értékhatárok és több lépcső esetén a szabályok még tisztázandók.
- A jóváhagyás nem jelent automatikus megrendelést vagy kifizetést.

## F23 – Esemény- és baleseti jegyzőkönyvek

- Sablonos rögzítés helyszínnel, időponttal, eseménytípussal és tényszerű leírással.
- Képek, megtett intézkedések és kapcsolódó követő feladatok.
- Illetékes vezető értesítése, korlátozott láthatóság és módosítási előzmény.
- Hiányzó információk pótlása, felülvizsgálat és lezárás.
- A konkrét kötelező mezőket és megőrzést a bevezetés előtt tisztázni kell.

## F24 – Hotelcsoportos sablonok és auditok

- Központi checklisták, munkautasítások és minőségi követelmények több hotelre.
- Sablonok kiadása, verziókövetés és helyi eltérések kezelése.
- Auditok tervezése, hotel/részleg szerinti végrehajtása és eredmények összesítése.
- Hiányosságból felelőshöz és határidőhöz kötött javító feladat.
- Vezetői áttekintés több hotel nyitott ügyeiről és visszatérő problémáiról.
- A központi frissítés ne írja át észrevétlenül a már elvégzett ellenőrzés tartalmát.

## F25 – Berendezések, megelőző karbantartás és mérőállások

- Saját berendezésadatlap: típus, gyári szám, gyártó, helyszín, beszerzés és szállító.
- Garancia, dokumentumok, használati útmutató, korábbi javítások és következő karbantartás.
- Berendezéshez kiadható, nyomtatható QR-kód; a kód az adatlapra/útmutatóra vezet.
- Időszakos karbantartási tervek, naptár és automatikusan képződő feladatok.
- Fényképes dokumentáció, mérési eredmények, elvégző és időpont.
- Mérőóra-állások és fogyasztási adatok rögzítése mértékegységgel.
- Idősoros összehasonlítás és visszatérő meghibásodások vizsgálata.
- Használatfüggő karbantartás adatforrása és küszöbszabályai később pontosítandók.
- Berendezés mozgatásakor a korábbi helyszíni előzmény maradjon értelmezhető.

## F26 – Eszközkiadás és visszavétel

- Telefon, rádió, kulcs vagy más munkaeszköz nyilvántartása.
- Melyik dolgozónál van, mikor kapta, milyen állapotban.
- Átadás/visszavétel visszaigazolással és szükség szerint fotóval.
- Kapcsolat a belépési/kilépési checklisttel és eszközhibákkal.
- Az eszköznyilvántartás nem jelent a dolgozó saját telefonja feletti távoli vezérlést.

## F27 – Belső kommunikáció

- Egyéni és csoportos chat, részleg- és hotelhatókörű beszélgetések.
- Célzott közlemények működési változásokról, oktatásról és fontos eseményekről.
- Olvasási állapot és kérhető kifejezett visszaigazolás.
- Ötletbeküldés, hozzászólások és dolgozói szavazások.
- Közösségi hírfolyam képekkel, videókkal és reakciókkal.
- Közös naptár értekezletekhez, képzésekhez és csapateseményekhez.
- Tartalomfordítás a közös DeepSeek-megoldással, ahol indokolt.
- A végrehajtandó munka továbbra is követhető feladatként kezelendő.
- Értesítési beállításokkal csökkenthető a zaj; részletes szabályok még tervezendők.

## F28 – Talált tárgyak, készlet és textil

- Talált tárgy rögzítése fotóval, helyszínnel, időponttal és megtalálóval.
- Őrzési hely, ügyintéző, kiadás/visszajuttatás és lezárási előzmény.
- A tárgyhoz kapcsolódó személyes adatok csak az illetékesek számára láthatók.
- Fogyóeszközök és textíliák alapnyilvántartása, bevételezés és kiadás.
- Hiányok és utánpótlási igények jelzése, kapcsolódás a beszerzési kérelmekhez.
- Minibárfeltöltés és fogyasztás kapcsolata megtervezendő, kétszeres levonás nélkül.
- Raktárak, mértékegységek, textilkörforgás és leltár részletes folyamata később tisztázandó.

## F29 – Belső tudástárból válaszoló AI

- Dolgozó természetes nyelven kérdezhet a hotel jóváhagyott munkautasításairól.
- Többnyelvű válasz, hivatkozással a felhasznált belső útmutatóra.
- Csak a kérdező által elérhető források kerülhetnek a válasz alapjába.
- Elégtelen vagy ellentmondó forrásnál bizonytalanság jelzése és eredeti cikk elérése.
- A tudástár módosításait és jogosultságváltozásait követnie kell.
- A funkció nem jelent automatikus üzleti adatelemzést vagy feladatvégrehajtást.
- A fordításhoz választott DeepSeek nem jelenti automatikusan e funkció szolgáltatói döntését.

## F30 – Integrációk

Frissített döntés: nincs még kiválasztott PMS. A PMS-adapter későbbre kerül,
konkrét hoteligény esetén; nem feltétele a jelenlegi működési modulok használatának.

- PMS: foglaltság, érkezés/távozás és takarítási információk cseréje.
- Integrációnként tisztázandó, melyik rendszer az adott adat gazdája.
- Minibár számlára terhelése csak megfelelő szolgáltatói szerződés és API esetén.
- Vendégkommunikációs rendszerekből érkező kérések továbbítása belső feladattá.
- HR- és beosztási rendszerekből munkatársadatok szinkronizálása.
- Vállalati SSO külön későbbi igény; nem aktiválja a jelenlegi Google-gombot.
- Adatkapcsolati hibák, ismételt események és elavult állapotok követhető kezelése.
- Konkrét szolgáltatók, API-k és első pilotintegráció még nincsenek kiválasztva.
