// Generated from docs/features. Do not edit.
"use strict";
(() => {
    const $ = (selector) => document.querySelector(selector);
    const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const specs = screenSpecs.map((s) => s.split('|'));
    const groups = ['Alapok', 'Napi munka', 'Takarítás', 'Vendégélmény', 'Csapat', 'Vezetés'];
    const descriptions = [
        'Helyszínek, QR-kódok és kapcsolatok',
        'Feladatok, körjáratok és átadások',
        'A szoba előkészítésétől az ellenőrzésig',
        'Kérések, panaszok és események',
        'Együttműködés és közös tudás',
        'Átlátható működés, megalapozott döntések',
    ];
    let theme = 'light';
    let device = 'desktop';
    let tab = 'preview';
    let scope = 'all';
    let query = '';
    let compare = false;
    let current = 'overview';
    const isMvp = (f) => f.status === 'MVP';
    const imagePath = (id, t = theme, d = device) => `assets/screens/${id}-${t}-${d}.png`;
    const featureSpec = (id) => specs.find((s) => s[0] === id);
    const statusText = (f) => isMvp(f)
        ? 'Elfogadott MVP'
        : f.status.includes('javasolt')
            ? 'MVP-bővítésre javasolt'
            : 'Elfogadott · ütemezendő';
    const statusBadge = (f) => `<span class="phase ${isMvp(f) ? 'mvp' : ''}">${statusText(f)}</span>`;
    const normalized = (s) => s
        .toLocaleLowerCase('hu')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const filtered = () => featureData.filter((f) => (scope === 'all' || (scope === 'mvp' ? isMvp(f) : !isMvp(f))) &&
        normalized(`${f.title} ${f.id} ${featureSpec(f.id)[1]} ${f.requirements.join(' ')}`).includes(normalized(query)));
    function renderNav() {
        const visible = filtered();
        $('#feature-nav').innerHTML =
            groups
                .map((group, i) => {
                const items = visible.filter((f) => featureSpec(f.id)[1] === group);
                return items.length
                    ? `<div class="nav-group"><h2><span>0${i + 1}</span>${group}<small>${items.length}</small></h2>${items.map((f) => `<a href="#${f.id}" ${current === f.id ? 'aria-current="page"' : ''}><span class="nav-number">${f.id.slice(1)}</span><span>${escapeHtml(f.title)}</span><i class="${isMvp(f) ? 'mvp-dot' : 'later-dot'}"></i></a>`).join('')}</div>`
                    : '';
            })
                .join('') ||
                '<p class="empty-result">Nincs ilyen funkció. Próbálj másik keresést vagy szűrőt.</p>';
        document
            .querySelectorAll('[data-scope]')
            .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scope === scope)));
    }
    function openImage(path, label) {
        $('#dialog-title').textContent = label;
        const img = $('#dialog-img');
        img.src = path;
        img.alt = label;
        const download = $('#dialog-download');
        download.href = path;
        download.download = path.split('/').pop();
        $('#lightbox').showModal();
    }
    function overview() {
        $('#content').innerHTML =
            `<section class="overview-hero"><div class="hero-kicker"><span>HOTEL OPERATIONS, ÁTGONDOLVA</span><span>01 — 30</span></div><h1>Egy hotel.<br /><em>Összehangolt munka.</em></h1><p class="hero-copy">A szobai QR-kódtól a vezetői áttekintésig.<br />Így képzeljük el a Hoteliva mindennapjait.</p><div class="hero-actions"><a class="solid-button" href="#F02">Induljunk egy szobából <span>↗</span></a><a class="quiet-link" href="#F12">Vezetői nézet →</a></div><div class="hero-stage"><div class="stage-label"><span>DESKTOP + MOBIL</span><span>Világos / sötét</span></div><button class="desktop-shot" data-image="${imagePath('F12', 'light', 'desktop')}" data-label="Napi áttekintés · világos desktop"><img src="${imagePath('F12', 'light', 'desktop')}" alt="Hoteliva világos desktop dashboard látványterv" /></button><button class="phone-shot" data-image="${imagePath('F02', 'dark', 'mobile')}" data-label="204-es szoba · sötét mobil"><img src="${imagePath('F02', 'dark', 'mobile')}" alt="204-es szoba sötét mobilképernyőterve" /></button><div class="stage-caption">Egy beolvasás.<br /><strong>És már a helyszínen vagy.</strong></div></div></section><div class="atlas-facts"><div><strong>30</strong><span>részletezett funkció</span></div><div><strong>120</strong><span>letölthető képernyőterv</span></div><div><strong>2 × 2</strong><span>téma és eszköznézet</span></div></div><section class="chapter-section"><div class="section-heading"><div><span class="overline">FEDEZD FEL A MŰKÖDÉST</span><h2>Hat nézőpont. Egy közös rendszer.</h2></div><p>Válassz területet, vagy haladj végig<br />a bal oldali funkciójegyzéken.</p></div><div class="chapter-grid">${groups
                .map((group, i) => {
                const fs = featureData.filter((f) => featureSpec(f.id)[1] === group);
                return `<a href="#${fs[0].id}" class="chapter"><span class="chapter-top">0${i + 1}<span>↗</span></span><h3>${group}</h3><p>${descriptions[i]}</p><footer>${fs.length} funkció <span>${fs.filter(isMvp).length} az MVP-ben</span></footer></a>`;
            })
                .join('')}</div></section><section class="principles"><span class="overline">A TERV ALAPELVE</span><h2>Kevesebb keresgélés.<br />Több elvégzett munka.</h2><div><p>A helyszín már ismert. A megfelelő részleg egy érintésre elérhető. A következő műszak látja, mi történt.</p><p>A DeepSeek-fordítás, a QR-es körjárat, a minibár és a külsős csapatok már az elfogadott MVP részei.</p></div></section><footer class="atlas-footnote">Interaktív tervbemutató, nem működő hotelalkalmazás. Minden személy, hotel, érték és állapot szemléltető adat. A képernyők nem igazolnak platformkompatibilitást.</footer>`;
        bindImageButtons();
    }
    function previewMarkup(f) {
        if (compare)
            return `<div class="comparison">${['light', 'dark'].flatMap((t) => ['desktop', 'mobile'].map((d) => `<button data-image="${imagePath(f.id, t, d)}" data-label="${escapeHtml(f.title)} · ${t === 'light' ? 'világos' : 'sötét'} ${d}"><span>${t === 'light' ? 'Világos' : 'Sötét'} · ${d === 'desktop' ? 'Desktop' : 'Mobil'} ↗</span><img class="${d}" src="${imagePath(f.id, t, d)}" alt="${escapeHtml(f.title)} – ${t} ${d}" /></button>`)).join('')}</div>`;
        return `<div class="screen-stage ${device}"><button class="mockup-image-button" data-image="${imagePath(f.id)}" data-label="${escapeHtml(f.title)} · ${theme === 'light' ? 'világos' : 'sötét'} ${device}" aria-label="Látványterv nagyítása"><img id="active-mockup" src="${imagePath(f.id)}" alt="${escapeHtml(f.title)} – ${theme === 'light' ? 'világos' : 'sötét'} ${device} látványterv" /></button>${device === 'mobile' ? '<div class="mobile-note"><span class="overline">A DOLGOZÓ KEZÉBEN</span><h3>A helyszín már ismert.<br />A következő lépés egyértelmű.</h3><p>Nagy érintési felületek, kevés kötelező mező, helyszínhez kapcsolódó gyors műveletek.</p><small>390 px széles mobilkoncepció.<br />A hosszabb képet görgetve tudod átnézni.</small></div>' : ''}</div>`;
    }
    function featurePage(f) {
        const s = featureSpec(f.id);
        const position = featureData.indexOf(f);
        $('#content').innerHTML =
            `<section class="feature-head"><div class="feature-breadcrumb"><a href="#overview">Atlasz</a><span>/</span><span>${s[1]}</span><span>/</span><b>${f.id}</b></div><div class="feature-title-row"><h1>${escapeHtml(f.title)}</h1>${statusBadge(f)}</div><p>${escapeHtml(s[4])}</p></section><div class="review-toolbar"><div class="tabs" role="tablist" aria-label="Funkció bemutatása">${[
                ['preview', 'Látványterv'],
                ['flow', 'Működés'],
                ['requirements', 'Követelmények'],
            ]
                .map(([value, label]) => `<button role="tab" data-tab="${value}" aria-selected="${tab === value}" aria-controls="feature-panel">${label}</button>`)
                .join('')}</div><span class="feature-counter">${String(position + 1).padStart(2, '0')} / 30</span></div><section id="feature-panel" role="tabpanel"></section><div class="pager"><a href="#${position > 0 ? featureData[position - 1].id : 'overview'}"><span>← ELŐZŐ</span><strong>${position > 0 ? escapeHtml(featureData[position - 1].title) : 'A teljes kép'}</strong></a><a href="#${position < 29 ? featureData[position + 1].id : 'overview'}"><span>${position < 29 ? 'KÖVETKEZŐ' : 'ÁTTEKINTÉS'} →</span><strong>${position < 29 ? escapeHtml(featureData[position + 1].title) : 'Vissza a teljes képhez'}</strong></a></div><footer class="atlas-footnote">Látványterv · fiktív adatokkal. A képen szereplő alkalmazásgombok illusztrációk; a bemutató navigációja, szűrői és képnézetei működnek.</footer>`;
        document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
            tab = button.dataset.tab;
            featurePage(f);
        }));
        renderPanel(f);
    }
    function renderPanel(f) {
        const s = featureSpec(f.id);
        if (tab === 'preview') {
            $('#feature-panel').innerHTML =
                `<div class="preview-controls"><div class="control-pair"><div class="segmented" role="group" aria-label="Képernyő témája">${[
                    ['light', '☀ Világos'],
                    ['dark', '◐ Sötét'],
                ]
                    .map(([v, l]) => `<button data-theme-choice="${v}" aria-pressed="${theme === v}">${l}</button>`)
                    .join('')}</div><div class="segmented" role="group" aria-label="Eszköznézet">${[
                    ['desktop', '▱ Desktop'],
                    ['mobile', '▯ Mobil'],
                ]
                    .map(([v, l]) => `<button data-device="${v}" aria-pressed="${device === v}">${l}</button>`)
                    .join('')}</div></div><div class="preview-actions"><button id="compare-button" aria-pressed="${compare}">${compare ? 'Egy kép' : 'Négy nézet'}</button><a id="download-image" href="${imagePath(f.id)}" download>PNG ↓</a></div></div>${previewMarkup(f)}<div class="preview-caption"><span><i></i> Kattints a képre a nagyításhoz</span><span>${compare ? 'Mind a négy változat' : `${theme === 'light' ? 'Világos' : 'Sötét'} / ${device === 'desktop' ? '1360 px desktop' : '390 px mobil'}`}</span></div><div class="flow-summary"><span class="overline">A FOLYAMAT RÖVIDEN</span><p>${s[7].split('>').map(escapeHtml).join('<span>→</span>')}</p><button id="show-flow">Nézzük meg részletesen ↗</button></div>`;
            document.querySelectorAll('[data-theme-choice]').forEach((b) => b.addEventListener('click', () => {
                theme = b.dataset.themeChoice;
                compare = false;
                renderPanel(f);
            }));
            document.querySelectorAll('[data-device]').forEach((b) => b.addEventListener('click', () => {
                device = b.dataset.device;
                compare = false;
                renderPanel(f);
            }));
            $('#compare-button').addEventListener('click', () => {
                compare = !compare;
                renderPanel(f);
            });
            $('#show-flow').addEventListener('click', () => {
                tab = 'flow';
                featurePage(f);
            });
            bindImageButtons();
        }
        else if (tab === 'flow') {
            const steps = s[7].split('>');
            $('#feature-panel').innerHTML =
                `<div class="flow-intro"><span class="overline">ÍGY KÉPZELJÜK EL</span><h2>${escapeHtml(s[3])}</h2><p>${escapeHtml(s[4])}</p></div><ol class="flow-steps">${steps.map((step, i) => `<li><span>0${i + 1}</span><div><h3>${escapeHtml(step)}</h3><p>${escapeHtml(f.requirements[Math.min(i, f.requirements.length - 1)] || '')}</p></div></li>`).join('')}</ol><div class="scenario"><span class="overline">KONKRÉT PÉLDA A KÉPERNYŐN</span>${s[6]
                    .split(';')
                    .slice(0, 3)
                    .map((r) => {
                    const [title, detail, status] = r.split('~');
                    return `<div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p><span>${escapeHtml(status)}</span></div>`;
                })
                    .join('')}</div><div class="decision-note"><strong>${statusText(f)}</strong><p>${isMvp(f) ? 'Az első használható verzió része. A részletes üzleti szabályok a fejlesztés előtt véglegesítendők.' : 'Elfogadott termékigény. A megvalósítás sorrendje még nyitott; a látványterv nem változtatja meg az MVP határát.'}</p></div>`;
        }
        else {
            $('#feature-panel').innerHTML =
                `<div class="requirements-head"><span class="overline">AZ ELMENTETT FUNKCIÓTERV ALAPJÁN</span><h2>Mit kell tudnia?</h2><p>${f.requirements.length} részletes követelmény · ${f.id}</p></div><ul class="requirements">${f.requirements.map((r, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><p>${escapeHtml(r)}</p></li>`).join('')}</ul>${f.notes.map((note) => `<div class="decision-note"><strong>Pontosítás / példa</strong><p>${escapeHtml(note)}</p></div>`).join('')}<div class="decision-note"><strong>A terv még nem megvalósítás</strong><p>Ez a bemutató a működés és a vizuális irány átbeszélését segíti. Élő szolgáltatást, valódi feladatot vagy fizetést nem indít.</p></div>`;
        }
    }
    function bindImageButtons() {
        document
            .querySelectorAll('[data-image]')
            .forEach((b) => b.addEventListener('click', () => openImage(b.dataset.image, b.dataset.label)));
    }
    function navigate() {
        const requested = location.hash.slice(1) || 'overview';
        current = featureData.some((f) => f.id === requested) ? requested : 'overview';
        if (current === 'overview')
            overview();
        else
            featurePage(featureData.find((f) => f.id === current));
        renderNav();
        document.body.classList.remove('menu-open');
        $('#menu-button').setAttribute('aria-expanded', 'false');
        document.title = `${current === 'overview' ? 'Design atlasz' : featureData.find((f) => f.id === current).title} · Hoteliva`;
        window.scrollTo({ top: 0 });
    }
    $('#feature-search').addEventListener('input', (event) => {
        query = event.target.value;
        renderNav();
    });
    document.querySelectorAll('[data-scope]').forEach((b) => b.addEventListener('click', () => {
        scope = b.dataset.scope;
        renderNav();
    }));
    $('#menu-button').addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        $('#menu-button').setAttribute('aria-expanded', String(open));
    });
    $('#atlas-theme').addEventListener('click', () => {
        const dark = document.documentElement.dataset.atlasTheme !== 'dark';
        document.documentElement.dataset.atlasTheme = dark ? 'dark' : 'light';
        $('#atlas-theme').setAttribute('aria-label', dark ? 'Világos bemutatótéma' : 'Sötét bemutatótéma');
    });
    $('#board-button').addEventListener('click', () => openImage('assets/design-study.png', 'Hoteliva · AI-val készített vizuális iránytanulmány'));
    $('#close-dialog').addEventListener('click', () => $('#lightbox').close());
    $('#lightbox').addEventListener('click', (event) => {
        if (event.target === $('#lightbox'))
            $('#lightbox').close();
    });
    window.addEventListener('hashchange', navigate);
    navigate();
})();
