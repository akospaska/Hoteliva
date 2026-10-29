# Hoteliva design system

Az alkalmazás közös arculati rétege: `apps/client/src/design-system`.
Az üzleti modulok az `operations` könyvtárban ezt használják.

## Központi változtatási pontok

| Fájl                               | Felelősség                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `tokens.ts`                        | Világos/sötét szemantikus paletta, betűcsaládok, méretskála, térközök, lekerekítések, desktop töréspont |
| `theme.tsx`                        | Témaváltás, mentett felhasználói megjelenés, fontbetöltés                                               |
| `components.tsx`                   | Label, Panel, Action, Field, Select, Badge, Row                                                         |
| `disclosure.tsx`                   | Lenyitható kiegészítő panelek, például napi tervezés és naptár                                          |
| `date-field.tsx`                   | Közös dátumbeviteli viselkedés                                                                          |
| `login-styles.ts`, `legacy-ui.tsx` | Belépési és aktiválási felület közös megjelenése                                                        |

Új színhez szemantikus tokent adj, például `warningSoft`; ne képernyőnként
ismételd a hexakódot. A tipográfia a Manrope mellékelt regular/bold változatát
használja. A paletta vagy a közös vezérlők megváltoztatása valamennyi modulra hat.

A képernyők üzleti elrendezése továbbra is a képernyő komponensében van.
Teljes információsarchitektúra-váltást nem old meg önmagában a tokencsere;
egy arculati redesignhoz azonban nem kell harminc külön gombot/formot átírni.
A QR nyomtatási dokumentum külön nyomtatási nézet, nem a képernyőtémát követi.

## Vizuális ellenőrzés

`npm run test:browser` mind a 30 modult desktopon és mobilméretben, világos és
sötét témában megnyitja; 120 képet ment a `test-results/screens` alá.
A teszt vízszintes túlcsordulást és futásidejű hibákat is keres.

Az elfogadott referencia: `design/hoteliva-atlas/dist/assets/screens`.
A referencia és az aktuális képek más tesztadatokat mutatnak. A képek megléte
nem jelenti a teljes vizuális egyezés automatikus igazolását. A jelenlegi
implementáció közös szerkesztőket és adatlapokat használ; több modul elrendezése
eltér az egyedileg megrajzolt atlaszképektől.

A `node scripts/visual-review.mjs` parancs a tesztképek után létrehozza a
`test-results/visual-review.html` oldalt: funkciónként egymás mellett nézhető
a mockup és a tényleges képernyő, nézet- és témaváltóval.
