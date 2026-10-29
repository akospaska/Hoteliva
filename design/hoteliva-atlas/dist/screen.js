// Generated from docs/features. Do not edit.
"use strict";
(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || 'F12';
    const spec = (screenSpecs.find((s) => s.startsWith(`${id}|`)) || screenSpecs[11]).split('|');
    const [, group, mode, title, subtitle, action, rawRows] = spec;
    const feature = featureData.find((f) => f.id === id);
    document.documentElement.dataset.theme = params.get('theme') === 'dark' ? 'dark' : 'light';
    const esc = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const icons = {
        home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
        grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        check: '<path d="m5 12 4 4L19 6"/>',
        list: '<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
        qr: '<path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M8 8h3v3H8Zm7 0h1v3h-1ZM8 15h3v1H8Zm7 0h3v3h-3Z"/>',
        team: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4c3 0 4 2 4 5"/>',
        bell: '<path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5Zm5 3h4"/>',
        arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
        plus: '<path d="M12 4v16M4 12h16"/>',
    };
    const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.list}</svg>`;
    const rows = rawRows.split(';').map((row) => row.split('~'));
    const tone = (value) => /Lejárt|Elakadt|Sürgős|Kimaradt/.test(value)
        ? 'danger'
        : /Kész|Aktív|Elérhető|Rögzítve/.test(value)
            ? 'good'
            : /Folyamatban|Ellenőrzés|Fontos|Következő/.test(value)
                ? 'warm'
                : 'neutral';
    const pill = (value) => `<span class="pill ${tone(value)}">${esc(value)}</span>`;
    const standardRows = () => rows
        .map(([label, detail, status], i) => `<div class="work-row"><div class="row-icon">${icon(i % 2 ? 'list' : 'check')}</div><div class="row-copy"><strong>${esc(label)}</strong><small>${esc(detail)}</small></div>${pill(status)}<span class="row-arrow">↗</span></div>`)
        .join('');
    const panel = (heading, content, extra = '') => `<section class="panel ${extra}"><div class="panel-title"><h2>${heading}</h2><span>•••</span></div>${content}</section>`;
    const stats = () => `<div class="metrics">${[
        ['24', 'Mai feladat', '+4 új ügy'],
        ['18', 'Elkészült szoba', 'A napi terv 75%-a'],
        ['06', 'Ellenőrzésre vár', 'Készen az átvételre'],
        ['02', 'Figyelmet kér', 'Vezetői intézkedés'],
    ]
        .map(([n, l, sub], i) => `<div class="metric ${i === 1 ? 'featured' : ''}"><span>${l}</span><strong>${n}<i>${i === 1 ? '↗' : '·'}</i></strong><small>${sub}</small></div>`)
        .join('')}</div>`;
    const roomGrid = () => `<div class="room-grid">${Array.from({ length: 12 }, (_, i) => `<div class="room-tile ${i === 3 ? 'selected' : ''}"><span>${201 + i}</span><small>${i % 3 === 0 ? 'Deluxe' : 'Classic'}</small><div class="status-dot s${i % 4}"></div><footer>${['Ellenőrzés', 'Tiszta', 'Takarítás', 'Várakozik'][i % 4]}</footer></div>`).join('')}</div>`;
    const progress = (value) => `<div class="progress"><i style="width:${value}%"></i></div>`;
    const chart = () => `<div class="chart">${[32, 48, 70, 58, 86, 64, 40, 23, 35, 54, 28, 18].map((n, i) => `<div><i style="height:${n}%"></i><small>${i + 7}</small></div>`).join('')}</div>`;
    let main = '';
    if (mode === 'dashboard') {
        main =
            stats() +
                `<div class="columns">${panel('A hotel ritmusa', `<div class="chart-summary"><strong>75<span>%</span></strong><p>A mai takarítások<br />elkészültek</p>${pill('Jól haladunk')}</div>${chart()}<div class="chart-legend"><i></i> Elkészült munkák óránként</div>`)}${panel('Most érdemes ránézni', standardRows())}</div>` +
                panel('Szobák egy pillantásra', roomGrid());
    }
    else if (mode === 'rooms') {
        main =
            `<div class="filters"><span class="filter selected">Összes helyszín</span><span class="filter">1. emelet</span><span class="filter">2. emelet</span><span class="filter">Közös terek</span></div>` +
                panel('Szobák · Duna Boutique', roomGrid()) +
                panel('Napi munkák', standardRows());
    }
    else if (mode === 'room') {
        main =
            `<div class="room-hero"><div><span class="eyebrow">DUNA BOUTIQUE / 2. EMELET</span><h2>204<span>Deluxe</span></h2><p>3 férőhely · 28 m² · erkély</p></div><div class="room-symbol">204</div></div><div class="room-status">${pill('Takarítás folyamatban')}${pill('Vendég távozott')}${pill('Műszaki hiba nyitva')}</div><div class="quick-actions">${[
                ['check', 'Takarítás', 'Mai checklist'],
                ['plus', 'Új feladat', 'Housekeeping'],
                ['list', 'Hibajelzés', 'Karbantartás'],
            ]
                .map(([ic, label, sub]) => `<div>${icon(ic)}<strong>${label}</strong><small>${sub}</small></div>`)
                .join('')}</div>` +
                panel('A szoba nyitott ügyei', standardRows()) +
                `<div class="note">${icon('qr')} A minibár és a teljes szobatörténet innen is elérhető.</div>`;
    }
    else if (mode === 'checklist' || mode === 'route') {
        main =
            `<div class="summary-strip"><div><span class="eyebrow">${mode === 'route' ? 'AKTUÁLIS KÖRJÁRAT' : 'MAI TELJESÍTÉS'}</span><h2>2 / 4 lépés kész</h2></div><div class="ring">50%</div></div>` +
                panel(mode === 'route' ? 'Ellenőrzőpontok' : 'Lépésről lépésre', `<div class="checklist">${rows.map(([label, detail, status], i) => `<div class="check-row"><span class="checkbox ${i < 2 ? 'checked' : ''}">${i < 2 ? '✓' : mode === 'route' ? i + 1 : ''}</span><div><strong>${esc(label)}</strong><small>${esc(detail)}</small>${i === 2 ? `<span class="inline-link">${mode === 'route' ? 'QR beolvasása →' : 'Így csináld ↗'}</span>` : ''}</div>${i < 2 ? '<small class="done-time">08:4' + i + '</small>' : ''}</div>`).join('')}</div>`) +
                `<div class="note">${icon('list')} ${mode === 'route' ? 'A beolvasás után végezd el a pont ellenőrzőlistáját.' : 'Akadály merült fel? Jelezd az okot vagy rögzíts hibát.'}</div>`;
    }
    else if (mode === 'minibar') {
        main =
            `<div class="summary-strip"><div><span class="eyebrow">SZOBÁHOZ RENDELT FOGYASZTÁS</span><h2>3 termék kiválasztva</h2><p>A recepción feldolgozásra vár majd.</p></div><span class="large-icon">${icon('grid')}</span></div>` +
                panel('Mi fogyott a minibárból?', rows
                    .map(([label, detail, status], i) => `<div class="work-row"><div class="product-icon">${['◒', '◓', '▰', '◇'][i]}</div><div class="row-copy"><strong>${label}</strong><small>${detail}</small></div><div class="stepper"><span>−</span><b>${status}</b><span>+</span></div></div>`)
                    .join('')) +
                `<div class="note">${icon('check')} Rögzítés után a fogyasztás visszakereshető és javítható.</div>`;
    }
    else if (mode === 'quick') {
        main =
            `<div class="steps"><span class="active">1 · Hibatípus</span><span>2 · Részletek</span><span>3 · Küldés</span></div><div class="quick-grid">${rows.map(([label, detail], i) => `<div class="quick-option ${i === 1 ? 'selected' : ''}"><span>${['☼', '◉', '❋', '▱'][i]}</span><strong>${label}</strong><small>${detail}</small>${i === 1 ? '<b>✓</b>' : ''}</div>`).join('')}</div>` +
                panel('Részletek', `<div class="field"><label>Helyszín</label><div>204 · Deluxe / Fürdőszoba</div></div><div class="field"><label>Megjegyzés · opcionális</label><div>A csap elzárás után is csöpög.</div></div><div class="upload">＋ Fotó hozzáadása</div>`);
    }
    else if (mode === 'translate') {
        main = `<div class="language-line"><span>Magyar · HU</span><span>→</span><span>Angol · EN</span></div><div class="translation-grid">${rows.map(([label, detail, status], i) => panel(label, `<p class="translation-text">${detail}</p><footer>${pill(status)}<small>${i ? 'Gépi fordítás · DeepSeek' : 'Eredeti szöveg · megőrizve'}</small></footer>`)).join('')}</div><div class="note">${icon('check')} A feladat mentése a fordítástól függetlenül megtörtént.</div>`;
    }
    else if (mode === 'conversation' || mode === 'assistant') {
        main = panel(mode === 'assistant'
            ? 'Kérdezz a belső útmutatókról'
            : id === 'F16'
                ? 'Az ügy beszélgetése'
                : 'Csapatbeszélgetés', `<div class="messages">${rows.map(([label, detail, status], i) => `<div class="message ${i === 1 ? 'reply' : ''}"><div class="avatar">${label.slice(0, 1)}</div><div><strong>${label} <small>${status}</small></strong><p>${detail}</p>${mode === 'assistant' && i === 1 ? '<a>Forrás: Deluxe bekészítés · 3. verzió ↗</a>' : ''}</div></div>`).join('')}</div><div class="compose">${mode === 'assistant' ? 'Írd le a kérdésed…' : 'Írj üzenetet, @ jelöléssel vonj be kollégát…'}<span>↑</span></div>`);
    }
    else if (mode === 'analytics' || mode === 'audit') {
        main =
            `<div class="metrics compact">${[
                ['86%', 'Napi készültség'],
                ['24 perc', 'Átlagos takarítás'],
                ['3', 'Figyelmet kér'],
            ]
                .map(([n, label]) => `<div class="metric"><span>${label}</span><strong>${n}</strong><small>Szemléltető mintaadat</small></div>`)
                .join('')}</div>` +
                panel(mode === 'audit' ? 'Hotelek minőségi áttekintése' : 'Terhelés a csapatban', rows
                    .map(([label, detail, status]) => `<div class="capacity"><div><strong>${label}</strong><b>${status}</b></div><small>${detail}</small>${progress(parseInt(status))}</div>`)
                    .join(''));
    }
    else if (mode === 'knowledge') {
        main =
            `<div class="knowledge-hero"><div><span class="eyebrow">KIEMELT ÚTMUTATÓ</span><h2>Így készítsd elő<br />a Deluxe szobát.</h2><p>6 lépés · 3. verzió · Housekeeping</p><span class="text-button">Útmutató megnyitása ↗</span></div><div class="bed-art"><i></i><b></b><span></span></div></div>` +
                panel('A munkádhoz kapcsolódó tudás', standardRows());
    }
    else if (mode === 'timeline') {
        main = panel('Ma és a közelmúltban', `<div class="timeline">${rows.map(([label, detail, status]) => `<div><i></i><small>${detail}</small><h3>${label}</h3>${pill(status)}</div>`).join('')}</div>`);
    }
    else if (mode === 'team') {
        main =
            `<div class="summary-strip"><div><span class="eyebrow">TISZTA TÉR KFT.</span><h2>Ugyanaz a munkafolyamat.</h2><p>Csak az engedélyezett helyszínek és feladatok.</p></div><span class="large-icon">${icon('team')}</span></div>` +
                panel('Mai csapat', standardRows()) +
                `<div class="note">${icon('check')} A kész munkákat a hotel saját ellenőre veszi át.</div>`;
    }
    else if (mode === 'form' || mode === 'asset') {
        main = `<div class="columns form-columns">${panel(mode === 'asset' ? 'Berendezésadatlap' : 'Részletek', rows.map(([label, detail, status]) => `<div class="field"><label>${label} ${pill(status)}</label><div>${detail}</div></div>`).join(''))}${panel('Következő lépés', `<div class="focus-card">${icon(mode === 'asset' ? 'qr' : 'check')}<h3>${mode === 'asset' ? 'Karbantartás esedékes' : 'Minden részlet egy helyen'}</h3><p>${mode === 'asset' ? 'Szűrőellenőrzés · november 2.' : 'Az illetékes visszajelzése után folytatható a folyamat.'}</p>${pill(mode === 'asset' ? 'Tervezett' : 'Folyamatban')}</div><div class="upload">＋ Dokumentum hozzáadása</div>`)}</div>`;
    }
    else if (mode === 'event' || mode === 'handover') {
        main =
            `<div class="summary-strip"><div><span class="eyebrow">${mode === 'event' ? 'KÖZÖS KÉSZÜLTSÉG' : 'NYITOTT ÜGYEK ÁTADÁSA'}</span><h2>${mode === 'event' ? '3 részleg · 1 közös terv' : 'Minden ügy a következő műszaknak'}</h2><p>${mode === 'event' ? 'A részlegek a saját teendőiket látják.' : 'Átadó: Nagy Dóra · átvevő: Kiss Bence'}</p></div><span class="large-icon">${icon('team')}</span></div>` +
                panel(mode === 'event' ? 'Eseményhez kapcsolódó feladatok' : 'Amit tudnod kell', standardRows()) +
                `<div class="note">${icon('list')} ${mode === 'event' ? 'Az időpont változásáról minden érintett részleg értesül.' : 'Az átvétel nem zárja le a nyitott feladatokat.'}</div>`;
    }
    else {
        main =
            `<div class="filters"><span class="filter selected">Összes</span><span class="filter">Figyelmet kér</span><span class="filter">Előzmények</span></div>` +
                panel(mode === 'integrations'
                    ? 'Tervezett adatkapcsolatok'
                    : mode === 'inventory'
                        ? 'Nyilvántartás'
                        : 'A mai ügyek', standardRows()) +
                `<div class="note">${icon('check')} ${mode === 'integrations' ? 'Koncepció: szolgáltató még nincs kiválasztva. Nincs élő kapcsolat.' : 'Az állapotváltozások és a felelősök visszakövethetők.'}</div>`;
    }
    document.getElementById('screen').innerHTML =
        `<div class="app-shell"><aside class="app-sidebar"><div class="brand"><b>h.</b><strong>hoteliva</strong></div><div class="hotel-select"><span>DB</span><div><strong>Duna Boutique</strong><small>Budapest · mintahotel</small></div><i>⌄</i></div><small class="nav-label">MUNKATÉR</small><nav>${[
            ['home', 'Áttekintés', 'F12'],
            ['grid', 'Szobák és helyszínek', 'F02'],
            ['check', 'Feladatok', 'F03'],
            ['list', 'Takarítás', 'F04'],
            ['qr', 'Körjáratok', 'F06'],
            ['team', 'Csapat', 'F08'],
        ]
            .map(([ic, label, key]) => `<div class="nav-item ${id === key || (key === 'F03' && group === 'Napi munka' && id !== 'F12' && id !== 'F06') ? 'active' : ''}">${icon(ic)}${label}${key === 'F03' ? '<b>8</b>' : ''}</div>`)
            .join('')}</nav><div class="sidebar-note"><span class="tiny-dot"></span> Minden változás mentve<small>Demóállapot · nincs élő adat</small></div><div class="profile"><span class="avatar">VJ</span><div><strong>Varga Júlia</strong><small>Hotelvezető</small></div><span>⌄</span></div></aside><div class="app-main"><header class="topbar"><div><span>Duna Boutique</span><i>/</i><strong>${esc(group)}</strong></div><div class="top-actions"><span class="search-hint">Keresés… <kbd>⌘ K</kbd></span>${icon('bell')}<span class="avatar">VJ</span></div></header><header class="mobile-top"><div class="brand"><b>h.</b><strong>hoteliva</strong></div><span class="avatar">VJ</span></header><main><div class="page-heading"><div><span class="eyebrow">${esc(group)} <i>·</i> OKTÓBER 29., CSÜTÖRTÖK</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><span class="primary top-primary">${icon('plus')}${esc(action)}</span></div>${main}<div class="mobile-action"><span class="primary">${icon(mode === 'route' ? 'qr' : 'check')}${esc(action)}</span></div><footer class="mock-label">HOTELIVA / ${id} <span>Látványterv · fiktív adatok · nem működő alkalmazás</span></footer></main></div><nav class="mobile-nav"><span>${icon('home')}Kezdőlap</span><span>${icon('check')}Feladatok</span><span class="scan">${icon('qr')}Beolvasás</span><span>${icon('team')}Csapat</span></nav></div>`;
    document.title = `${feature.title} · Hoteliva látványterv`;
})();
