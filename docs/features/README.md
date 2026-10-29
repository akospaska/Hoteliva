# Hoteliva – elfogadott funkcióterv

Rögzítve: 2026-10-29. Állapot: elfogadott funkcióigények, tervezés alatt.

A dokumentum a közös terméktervezés döntéseit őrzi meg. A felsorolt funkciók
kellenek a termékbe; ez nem megvalósítási vagy elkészültségi jelentés.
A jelenlegi alkalmazás állapotát a projekt gyökér-README-je írja le.

## Termékcél

A hotel dolgozói a napi feladatokat, takarítást, hibákat és műszakátadást
a kiosztástól az ellenőrzésig végig tudják vinni. Mobilon gyors helyszíni
munkavégzés, desktopon részletes tervezés és vezetői áttekintés szükséges.
A következő műszak számára is egyértelmű legyen, mi maradt nyitva és kinél van.

Kiinduló termékhatár: a Hoteliva a meglévő foglalási rendszer mellé épül.
A foglalás, számlázás és vendégnyilvántartás önálló megvalósítása nem része
az elfogadott tervnek. A PMS-integráció a legutóbbi döntés szerint későbbi,
konkrét hoteligényhez kötött fejlesztés; jelenleg nem átadási feltétel.

## Dokumentumok és ütemezés

- [Aktuális megvalósítás, bizonyítékok és hiányok modulonként](implementation.md)
- [Közös design system és redesign](../design-system.md)
- [Privát online design atlasz](https://hoteliva-design-atlas.candytiger256.chatgpt.site)
- [Interaktív design atlasz: 120 desktop- és mobilmockup](../../design/hoteliva-atlas/dist/index.html)
- [A design atlasz forrása és használata](../../design/hoteliva-atlas/README.md)

- [MVP: napi működés és QR-alapú munkavégzés](mvp.md)
- [További elfogadott funkciók és részletes bővítések](extensions.md)
- [Nyitott döntések, függőségek és kutatási források](decisions-and-sources.md)

Az **MVP** jelölés azokat az elemeket jelenti, amelyeket korábban kifejezetten
az első használható verzióba terveztünk. A **kell, ütemezendő** jelölés szintén
elfogadott igény: a felhasználó a további megbeszélt funkciókat is kérte,
de ezek teljes körét még nem sorolta az MVP-be.
A legutóbbi négy MVP-bővítési javaslat prioritási javaslat marad, amíg az
ütemezést nem véglegesítjük; nem veszhetnek el a backlogból.

## Funkciójegyzék

| Azonosító | Funkció                                              | Besorolás                    |
| --------- | ---------------------------------------------------- | ---------------------------- |
| F01       | Hotel, helyszínek és csapat                          | MVP                          |
| F02       | Nyomtatható szobai/helyszíni QR és gyors szobaoldal  | MVP                          |
| F03       | Feladatok és hibabejelentés                          | MVP                          |
| F04       | Takarítás, szobaállapot, speciális szabályok         | MVP                          |
| F05       | Napi/heti/havi checklisták és rutinok                | MVP                          |
| F06       | QR-es ellenőrző körjáratok                           | MVP                          |
| F07       | Minibárfogyasztás                                    | MVP                          |
| F08       | Külsős takarítócégek                                 | MVP                          |
| F09       | Tartalomfordítás DeepSeek API-val                    | MVP                          |
| F10       | Műszakátadás                                         | MVP                          |
| F11       | Vendégkérések                                        | MVP                          |
| F12       | Saját kezdőlap, értesítések, vezetői alapnézet       | MVP                          |
| F13       | Gyors hibasablonok és vendégkérés-sablonok           | Kell, MVP-bővítésre javasolt |
| F14       | Automatikus vezetői jelzés, el nem vállalt munkák    | Kell, MVP-bővítésre javasolt |
| F15       | Egységes szobatörténet                               | Kell, MVP-bővítésre javasolt |
| F16       | Megemlítések, emlékeztetők, könyvjelzők              | Kell, ütemezendő             |
| F17       | Tudástár és helyszíni képes munkautasítások          | Kell, ütemezendő             |
| F18       | Kapacitásalapú kiosztás és részletes riportok        | Kell, ütemezendő             |
| F19       | Panaszok és kompenzáció                              | Kell, ütemezendő             |
| F20       | Rendezvények közös feladatcsomagjai                  | Kell, ütemezendő             |
| F21       | Dolgozói betanítás és kilépési folyamat              | Kell, ütemezendő             |
| F22       | Beszerzési és beruházási kérelmek                    | Kell, ütemezendő             |
| F23       | Esemény- és baleseti jegyzőkönyvek                   | Kell, ütemezendő             |
| F24       | Hotelcsoportos sablonok, auditok, áttekintés         | Kell, ütemezendő             |
| F25       | Berendezések, megelőző karbantartás, mérőállások     | Kell, ütemezendő             |
| F26       | Eszközkiadás és visszavétel                          | Kell, ütemezendő             |
| F27       | Chat, közlemények, szavazások és közösségi hírfolyam | Kell, ütemezendő             |
| F28       | Talált tárgyak, készlet- és textilkezelés            | Kell, ütemezendő             |
| F29       | Belső tudástárból válaszoló AI                       | Kell, ütemezendő             |
| F30       | PMS és további integrációk                           | Később, konkrét igény esetén |

## Közös működési elvek

- Magyar és angol kezelőfelület, magyar alapértelmezés; a tartalomfordítás külön funkció.
- Androidon natív alkalmazás, iOS-en PWA, desktopon böngésző.
- Nagy mobilos gombok, kevés kötelező mező, helyszínből örökölt adatok.
- Egy érintésre elérhető checklist a QR-rel megnyitott helyszínről.
- Gyakori hibák és kérések néhány érintéssel rögzíthetők.
- Minden mentés állapota legyen látható; hiba esetén a piszkozat ne vesszen el.
- Gyenge hálózat kezelése szükséges; teljes offline szinkronizáció nincs még specifikálva.
- A fontos állapotváltozásokhoz szereplő, időpont és előzmény tartozzon.
- A hozzáférést a backend ellenőrzi, hotelcsoport/hotel/részleg hatókörben.
- A QR helyszínt azonosít, nem ad jogosultságot és nem igazol önmagában fizikai jelenlétet.
- A következő műszak és a vezető is értse, ki a felelős, mi az akadály, mi a következő lépés.

## Meglévő üzleti korlátok

Az AGENTS.md továbbra is irányadó: nincs nyilvános regisztráció, jelenleg csak
platform admin hozhat létre felhasználót. Egy ügyfélfiók egy hotelcsoporthoz tartozik.
A külsős dolgozók is saját fiókot kapnak és beleszámítanak a felhasználói keretbe.
A hozzáférés nincs műszakhoz kötve; kötelező 2FA nincs. A Google-belépés egyelőre
inaktív. Új hotel aktiválása sales-jóváhagyáshoz kötött.

## Javasolt fejlesztési sorrend

1. Alapadatok, csapat, QR-helyszínek, feladatok és hibák.
2. Checklisták, takarítás, speciális szabályok, recepciós áttekintés.
3. Minibár, külsős csapatok, DeepSeek-fordítás, QR-körjáratok.
4. Műszakátadás, vendégkérések, értesítések és vezetői alapnézet.
5. A további elfogadott funkciók ütemezése pilot-visszajelzések alapján.

Ez sorrendi javaslat, nem határidős vállalás. A teljes MVP fent felsorolt elemei
nem kerülnek ki a körből attól, hogy az első szűk pilot korábban indul.
