# Hoteliva – design atlasz

Interaktív HTML-bemutató a 30 elfogadott funkcióhoz, 120 PNG-látványtervvel:
funkciónként világos/sötét és desktop/mobil változat.

## Megnyitás

A `dist/index.html` közvetlenül böngészőben is megnyitható. A bemutatóhoz
nem szükséges backend vagy külső szolgáltatás; a betűkészletek is helyben vannak.
A `hoteliva-design-atlas.zip` a teljes önálló bemutató hordozható csomagja.

Keresés, MVP-szűrő, funkciónkénti navigáció, működési lépések, teljes követelménylista,
négyes képösszehasonlítás, nagyítás és PNG-letöltés tartozik hozzá.
A bemutató saját témája és a képernyőterv témája külön váltható.

## Források

- `src/`: karbantartott HTML/CSS/TypeScript források.
- `build.ts`: a projekt `docs/features` dokumentumaiból átveszi a követelményeket.
- `src/specs.ts`: fiktív képernyőadatok, témacsoportok és négylépéses folyamatok.
- `dist/`: generált, önálló statikus bemutató és a képek.
- `capture.ts`: 30 × 2 × 2 képernyőkép készítése és túlcsordulás-ellenőrzés.
- `verify.ts`: navigáció, keresés, tartalom, témák, képnézetek és mobilos működés ellenőrzése.
- `qa/`: helyi ellenőrzési képek és jelentés; nem része a publikált csomagnak.

## Újragenerálás a Hoteliva repójából

Node.js 24 és a gyökérprojekt telepített TypeScript/Playwright függőségei szükségesek.

```bash
node design/hoteliva-atlas/build.ts
python3 -m http.server 4193 --bind 127.0.0.1 --directory design/hoteliva-atlas/dist
```

Másik terminálban:

```bash
node design/hoteliva-atlas/capture.ts
node design/hoteliva-atlas/verify.ts
```

Az önálló Sites-forrás tartalmazza a kész `dist` könyvtárat, így build nélkül
közzétehető. A dokumentumokból való újragenerálás a Hoteliva repo kontextusát igényli.

## Képi eredet és hatókör

A `design-study.png` az imagegen eszközzel készített vizuális iránytanulmány.
A funkciónkénti PNG-k a saját HTML/CSS-képernyőtervek determinisztikus renderelései,
hogy a magyar feliratok és a témák következetesek maradjanak.
A Manrope betűkészlet SIL Open Font License alatt használható;
a licenc az `assets/fonts/OFL.txt` fájlban található.

Minden hotelnév, személy, feladat, mérés és állapot fiktív demóadat.
A mockupok alkalmazásgombjai képi elemek, nem végrehajtható üzleti műveletek.
Ez a bemutató nem igazolja a natív Android vagy iOS PWA alkalmazás működését.
Nem módosítja az elfogadott MVP-besorolást és nem állítja a funkciók elkészültét.
