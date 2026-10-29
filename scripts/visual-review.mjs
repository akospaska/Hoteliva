import { readFile, writeFile, access } from 'node:fs/promises';

// The review page references actual test screenshots and fails generation if any are missing.
const source = await readFile('apps/client/src/operations/modules.ts', 'utf8');
const modules = [...source.matchAll(/'(F\d{2})\|([^|]+)\|/g)].map((m) => ({
  id: m[1],
  name: m[2],
}));
for (const { id } of modules) {
  for (const theme of ['light', 'dark']) {
    for (const device of ['desktop', 'mobile-web']) {
      await access(`test-results/screens/${id}-${device}-${theme}.png`);
    }
  }
}
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
await writeFile(
  'test-results/visual-review.html',
  `<!doctype html>
<html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hoteliva · vizuális ellenőrzés</title>
<style>
body{margin:0;background:#f5f6f2;color:#193d35;font:15px system-ui,sans-serif}
header{padding:24px 32px;background:#153c32;color:white}h1{margin:0 0 8px;font-size:26px}
header p{max-width:1000px;line-height:1.6;color:#d5ebaa}main{padding:24px 32px}
nav{display:flex;gap:16px;flex-wrap:wrap;align-items:end;margin-bottom:24px}
label{display:grid;gap:8px}select,button{font:inherit;padding:12px;border:1px solid #65766d;border-radius:8px;background:white;color:#193d35}
button{cursor:pointer;min-height:44px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
figure{margin:0;padding:16px;background:white;border-radius:14px;min-width:0}figcaption{margin-bottom:12px;font-weight:600}
img{width:100%;height:auto;display:block;border:1px solid #dfe6dd}.mobile img{max-width:420px;margin:auto}
a{color:inherit}footer{padding:24px 0;color:#65766d;line-height:1.6}
@media(max-width:800px){.pair{grid-template-columns:1fr}header,main{padding:16px}}
</style><header><h1>Hoteliva · mockup és megvalósítás</h1>
<p>30 modul · világos és sötét téma · desktop és mobilméretű Expo web.
Balra az elfogadott látványterv, jobbra a Playwright által készített valódi alkalmazáskép.
Eltérő mintaadatok és képméretek; ez összehasonlító nézet, nem automatikus megfelelőségi igazolás.</p></header>
<main><nav><label>Funkció<select id="module">${modules.map((m) => `<option value="${m.id}">${m.id} · ${escape(m.name)}</option>`).join('')}</select></label>
<label>Téma<select id="theme"><option value="light">Világos</option><option value="dark">Sötét</option></select></label>
<label>Nézet<select id="device"><option value="desktop">Desktop</option><option value="mobile">Mobil web</option></select></label>
<button id="previous">← Előző</button><button id="next">Következő →</button></nav>
<section class="pair"><figure><figcaption>Elfogadott mockup</figcaption><a id="reference-link" target="_blank"><img id="reference" alt="Elfogadott mockup"></a></figure>
<figure><figcaption>Jelenlegi Expo alkalmazás</figcaption><a id="actual-link" target="_blank"><img id="actual" alt="Tényleges alkalmazásképernyő"></a></figure></section>
<footer>A képek a teszt futásakor látható első képernyőt mutatják. Mobil web ≠ natív Android-teszt.
Részletes készültség: <a href="../docs/features/implementation.md">implementációs jegyzék</a>.
A képre kattintva teljes méretben is megnyitható.</footer></main>
<script>
const moduleSelect = document.getElementById('module');
const theme = document.getElementById('theme');
const device = document.getElementById('device');
function render(){
  const id=moduleSelect.value;
  const reference='../design/hoteliva-atlas/dist/assets/screens/'+id+'-'+theme.value+'-'+device.value+'.png';
  const actual='screens/'+id+'-'+(device.value==='mobile'?'mobile-web':'desktop')+'-'+theme.value+'.png';
  document.getElementById('reference').src=reference;
  document.getElementById('reference-link').href=reference;
  document.getElementById('actual').src=actual;
  document.getElementById('actual-link').href=actual;
  document.querySelector('.pair').classList.toggle('mobile',device.value==='mobile');
}
for(const select of [moduleSelect,theme,device])select.addEventListener('change',render);
document.getElementById('previous').onclick=()=>{moduleSelect.selectedIndex=(moduleSelect.selectedIndex+29)%30;render()};
document.getElementById('next').onclick=()=>{moduleSelect.selectedIndex=(moduleSelect.selectedIndex+1)%30;render()};
render();
</script></html>`,
);
console.log('Visual review: test-results/visual-review.html (120 verified screenshots)');
