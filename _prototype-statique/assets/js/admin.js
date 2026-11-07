/* ============================================================
   OCD LIVE — Espace équipe (tableau de bord)
   ============================================================ */
(function () {
  'use strict';

  var S = window.OCD;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var STATUS_LABEL = { nouveau: 'Nouveau', confirme: 'Confirmé', termine: 'Terminé', annule: 'Annulé' };

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------- Accès ---------------- */
  function unlock() {
    $('#gate').classList.add('hidden');
    $('#app').classList.remove('hidden');
    renderAll();
  }

  function tryCode() {
    var code = $('#gate-code').value.trim();
    if (code === S.getSettings().adminCode) {
      try { sessionStorage.setItem('ocd_admin', '1'); } catch (e) {}
      unlock();
    } else {
      $('#gate-error').classList.add('show');
      $('#gate-code').classList.add('invalid');
    }
  }

  $('#gate-btn').addEventListener('click', tryCode);
  $('#gate-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') { tryCode(); } });
  $('#logout').addEventListener('click', function () {
    try { sessionStorage.removeItem('ocd_admin'); } catch (e) {}
    window.location.reload();
  });

  /* ---------------- Onglets ---------------- */
  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      $$('.tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
      ['bookings', 'dispo', 'settings'].forEach(function (name) {
        $('#tab-' + name).classList.toggle('hidden', name !== tab.getAttribute('data-tab'));
      });
      if (tab.getAttribute('data-tab') === 'dispo') { renderAdminCalendar(); }
      if (tab.getAttribute('data-tab') === 'settings') { renderSettings(); }
    });
  });

  /* ---------------- Notifications ---------------- */
  function renderBell() {
    var n = S.unreadCount();
    var badge = $('#bell-count');
    badge.textContent = n;
    badge.classList.toggle('hidden', n === 0);
  }

  $('#bell').addEventListener('click', function (e) {
    e.stopPropagation();
    var panel = $('#notif-panel');
    if (!panel.classList.contains('hidden')) { panel.classList.add('hidden'); return; }

    var list = S.getNotifications();
    panel.innerHTML =
      '<header><h4>Notifications</h4>' +
      (list.length ? '<button class="btn btn-ghost btn-sm" id="mark-read">Tout marquer lu</button>' : '') +
      '</header>' +
      (list.length
        ? list.slice(0, 30).map(function (n) {
            return '<div class="notif-item' + (n.read ? '' : ' unread') + '">' +
              '<b>' + esc(n.title) + '</b>' +
              '<p>' + esc(n.body) + '</p>' +
              '<time>' + new Date(n.createdAt).toLocaleString('fr-FR') + '</time>' +
            '</div>';
          }).join('')
        : '<div class="empty-state" style="padding:30px"><p>Aucune notification.</p></div>');

    panel.classList.remove('hidden');
    var mark = $('#mark-read');
    if (mark) {
      mark.addEventListener('click', function () {
        S.markAllRead();
        renderBell();
        panel.classList.add('hidden');
      });
    }
  });

  document.addEventListener('click', function (e) {
    var panel = $('#notif-panel');
    if (panel && !panel.contains(e.target)) { panel.classList.add('hidden'); }
  });

  /* ---------------- Indicateurs ---------------- */
  function renderKPIs() {
    var all = S.getBookings();
    var todayISO = S.toISODate(new Date());
    var upcoming = all.filter(function (b) { return b.date >= todayISO && b.status !== 'annule'; });
    var revenue = all.filter(function (b) { return b.status !== 'annule'; })
                     .reduce(function (sum, b) { return sum + Number(b.pkg.price || 0); }, 0);
    var nouveaux = all.filter(function (b) { return b.status === 'nouveau'; }).length;

    $('#kpis').innerHTML =
      kpi('Réservations au total', all.length) +
      kpi('Lives à venir', upcoming.length) +
      kpi('À traiter', nouveaux, true) +
      kpi('Chiffre d’affaires engagé', S.formatPrice(revenue));
  }

  function kpi(label, value, accent) {
    return '<div class="kpi' + (accent ? ' accent' : '') + '"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  /* ---------------- Tableau ---------------- */
  function filtered() {
    var q = $('#search').value.trim().toLowerCase();
    var st = $('#filter-status').value;
    var md = $('#filter-mode').value;

    return S.getBookings()
      .filter(function (b) {
        if (st && b.status !== st) { return false; }
        if (md && b.mode !== md) { return false; }
        if (!q) { return true; }
        return (b.ref + ' ' + b.client.fullname + ' ' + b.client.phone + ' ' + b.client.business)
          .toLowerCase().indexOf(q) >= 0;
      })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? 1 : -1; });
  }

  function renderTable() {
    var list = filtered();
    $('#empty').classList.toggle('hidden', list.length > 0);

    $('#rows').innerHTML = list.map(function (b) {
      return '<tr>' +
        '<td class="ref-cell">' + b.ref + '<span class="sub">' + new Date(b.createdAt).toLocaleDateString('fr-FR') + '</span></td>' +
        '<td><b>' + esc(b.client.fullname) + '</b><span class="sub">' + esc(b.client.business) + ' · ' + esc(b.client.phone) + '</span></td>' +
        '<td>' + S.formatDateShort(b.date) + '<span class="sub">' + b.time + '</span></td>' +
        '<td><span class="badge mode-' + b.mode + '">' + (b.mode === 'presentiel' ? 'Présentiel' : 'Distance') + '</span></td>' +
        '<td>' + esc(b.pkg.name) + '<span class="sub">' + esc(b.pkg.duration) + '</span></td>' +
        '<td><b>' + S.formatPrice(b.pkg.price) + '</b></td>' +
        '<td><span class="badge ' + b.status + '">' + STATUS_LABEL[b.status] + '</span></td>' +
        '<td><div class="row-actions"><button data-open="' + b.ref + '">Ouvrir</button></div></td>' +
      '</tr>';
    }).join('');

    $$('#rows [data-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDetail(btn.getAttribute('data-open')); });
    });
  }

  ['#search', '#filter-status', '#filter-mode'].forEach(function (sel) {
    $(sel).addEventListener('input', renderTable);
  });

  /* ---------------- Fiche réservation ---------------- */
  function openDetail(ref) {
    var b = S.getBookings().filter(function (x) { return x.ref === ref; })[0];
    if (!b) { return; }
    var s = S.getSettings();

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal">' +
        '<div class="modal-head">' +
          '<div><h2 style="font-size:1.3rem">' + b.ref + '</h2>' +
          '<span class="badge ' + b.status + '" style="margin-top:8px;display:inline-block">' + STATUS_LABEL[b.status] + '</span></div>' +
          '<button class="icon-btn" id="close-modal">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<dl class="detail-grid">' +
            dt('Format', b.mode === 'presentiel' ? 'Présentiel — ' + s.address : 'À distance') +
            dt('Date', S.formatDateFr(b.date) + ' à ' + b.time) +
            dt('Formule', b.pkg.name + ' · ' + b.pkg.duration) +
            dt('Montant', S.formatPrice(b.pkg.price)) +
            dt('Paiement', b.client.payment || '—') +
          '</dl>' +
          '<h4>Client</h4>' +
          '<dl class="detail-grid">' +
            dt('Nom', b.client.fullname) +
            dt('Téléphone', b.client.phone) +
            dt('E-mail', b.client.email || '—') +
            dt('Activité', b.client.business + ' (' + b.client.sector + ')') +
            dt('Ville', b.client.city || '—') +
            dt('Origine', b.client.heard || '—') +
          '</dl>' +
          '<h4>Produits à présenter (' + b.products.length + ')</h4>' +
          '<ul class="prod-list">' +
            b.products.map(function (p) {
              return '<li><span>' + esc(p.name) + (p.note ? ' <span class="sub">' + esc(p.note) + '</span>' : '') + '</span>' +
                     '<b>' + (p.price ? S.formatPrice(p.price) : 'à préciser') + '</b></li>';
            }).join('') +
          '</ul>' +
          (b.client.notes ? '<h4>Note du client</h4><p style="font-size:.9rem;color:var(--ink-2)">' + esc(b.client.notes) + '</p>' : '') +
          '<h4>Statut</h4>' +
          '<select id="status-select">' +
            Object.keys(STATUS_LABEL).map(function (k) {
              return '<option value="' + k + '"' + (b.status === k ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="modal-foot">' +
          '<button class="btn btn-ghost btn-sm" id="del-booking">Supprimer</button>' +
          '<button class="btn btn-ghost btn-sm" id="copy-recap">Copier le récapitulatif</button>' +
          '<a class="btn btn-ghost btn-sm" id="mail-client" href="#">Envoyer par e-mail</a>' +
          '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="https://wa.me/' +
            b.client.phone.replace(/\D/g, '') + '?text=' +
            encodeURIComponent('Bonjour ' + b.client.fullname + ', ici OCD Live. Nous confirmons votre live du ' +
              S.formatDateFr(b.date) + ' à ' + b.time + ' (réf. ' + b.ref + ').') +
            '">Écrire au client</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);

    var recap = S.buildAdminMessage(b);
    $('#mail-client').href = 'mailto:' + (b.client.email || '') +
      '?subject=' + encodeURIComponent('OCD Live — réservation ' + b.ref) +
      '&body=' + encodeURIComponent(recap);

    function close() { backdrop.remove(); }
    $('#close-modal').addEventListener('click', close);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) { close(); } });

    $('#status-select').addEventListener('change', function () {
      S.updateBooking(b.ref, { status: this.value });
      renderAll();
      close();
      toast('Statut mis à jour.');
    });

    $('#copy-recap').addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(recap).then(function () { toast('Récapitulatif copié.'); });
      } else {
        toast('Copie non disponible sur ce navigateur.');
      }
    });

    $('#del-booking').addEventListener('click', function () {
      if (window.confirm('Supprimer définitivement la réservation ' + b.ref + ' ?')) {
        S.deleteBooking(b.ref);
        renderAll();
        close();
        toast('Réservation supprimée.');
      }
    });
  }

  function dt(label, value) {
    return '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>';
  }

  /* ---------------- Export CSV ---------------- */
  $('#export-csv').addEventListener('click', function () {
    var list = filtered();
    if (!list.length) { toast('Rien à exporter.'); return; }

    var head = ['Reference', 'Cree le', 'Statut', 'Format', 'Date', 'Heure', 'Formule', 'Montant FCFA',
                'Client', 'Telephone', 'Email', 'Activite', 'Secteur', 'Ville', 'Produits'];
    var rows = list.map(function (b) {
      return [
        b.ref, new Date(b.createdAt).toLocaleString('fr-FR'), STATUS_LABEL[b.status],
        b.mode === 'presentiel' ? 'Presentiel' : 'Distance', b.date, b.time,
        b.pkg.name + ' - ' + b.pkg.duration, b.pkg.price,
        b.client.fullname, b.client.phone, b.client.email, b.client.business,
        b.client.sector, b.client.city,
        b.products.map(function (p) { return p.name + (p.price ? ' (' + p.price + ')' : ''); }).join(' | ')
      ];
    });

    var csv = [head].concat(rows).map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');

    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ocd-live-reservations-' + S.toISODate(new Date()) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Export téléchargé.');
  });

  /* ---------------- Disponibilités ---------------- */
  var admView = new Date();
  admView = new Date(admView.getFullYear(), admView.getMonth(), 1);

  function renderAdminCalendar() {
    var y = admView.getFullYear(), m = admView.getMonth();
    $('#adm-cal-title').textContent = S.MOIS[m] + ' ' + y;

    var blocked = S.getBlockedDates();
    var booked = {};
    S.getBookings().forEach(function (b) {
      if (b.status !== 'annule') { booked[b.date] = (booked[b.date] || 0) + 1; }
    });

    var html = '';
    ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].forEach(function (d) {
      html += '<div class="cal-dow">' + d + '</div>';
    });

    var offset = (new Date(y, m, 1).getDay() + 6) % 7;
    var days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < offset; i++) { html += '<div class="cal-day empty"></div>'; }

    for (var d = 1; d <= days; d++) {
      var iso = S.toISODate(new Date(y, m, d));
      var isBlocked = blocked.indexOf(iso) >= 0;
      var count = booked[iso] || 0;
      var style = isBlocked
        ? 'background:var(--red);color:#fff'
        : (count ? 'background:var(--orange);color:#fff' : '');
      html += '<button type="button" class="cal-day" data-date="' + iso + '" style="' + style + '" ' +
              'title="' + (isBlocked ? 'Fermé — cliquer pour rouvrir' : (count + ' live(s) — cliquer pour fermer la journée')) + '">' +
              d + (count && !isBlocked ? '<span class="free" style="color:#fff">' + count + '</span>' : '') + '</button>';
    }

    $('#adm-cal').innerHTML = html;

    $$('#adm-cal [data-date]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        S.toggleBlockedDate(btn.getAttribute('data-date'));
        renderAdminCalendar();
      });
    });

    var s = S.getSettings();
    $('#slots-p').value = s.slotsPresentiel.join('\n');
    $('#slots-d').value = s.slotsDistance.join('\n');
  }

  $('#adm-prev').addEventListener('click', function () {
    admView = new Date(admView.getFullYear(), admView.getMonth() - 1, 1);
    renderAdminCalendar();
  });
  $('#adm-next').addEventListener('click', function () {
    admView = new Date(admView.getFullYear(), admView.getMonth() + 1, 1);
    renderAdminCalendar();
  });

  $('#save-slots').addEventListener('click', function () {
    var parse = function (txt) {
      return txt.split('\n').map(function (l) { return l.trim(); })
        .filter(function (l) { return /^\d{1,2}:\d{2}$/.test(l); })
        .map(function (l) { return l.length === 4 ? '0' + l : l; });
    };
    var s = S.getSettings();
    s.slotsPresentiel = parse($('#slots-p').value);
    s.slotsDistance = parse($('#slots-d').value);
    S.saveSettings(s);
    renderAdminCalendar();
    toast('Horaires enregistrés.');
  });

  /* ---------------- Paramètres ---------------- */
  function renderSettings() {
    var s = S.getSettings();
    $('#set-email').value = s.adminEmail;
    $('#set-phone').value = s.adminPhone;
    $('#set-address').value = s.address;
    $('#set-code').value = s.adminCode;

    ['presentiel', 'distance'].forEach(function (mode) {
      var target = mode === 'presentiel' ? '#prices-p' : '#prices-d';
      $(target).innerHTML = s.packages[mode].map(function (p) {
        return '<div class="price-row">' +
          '<span>' + esc(p.name) + '<em>' + esc(p.duration) + '</em></span>' +
          '<input type="number" min="0" step="500" data-mode="' + mode + '" data-id="' + p.id + '" value="' + p.price + '">' +
        '</div>';
      }).join('');
    });
  }

  $('#save-settings').addEventListener('click', function () {
    var s = S.getSettings();
    s.adminEmail = $('#set-email').value.trim();
    s.adminPhone = $('#set-phone').value.replace(/\D/g, '');
    s.address = $('#set-address').value.trim();
    s.adminCode = $('#set-code').value.trim() || s.adminCode;
    S.saveSettings(s);
    toast('Paramètres enregistrés.');
  });

  $('#save-prices').addEventListener('click', function () {
    var s = S.getSettings();
    $$('#prices-p input, #prices-d input').forEach(function (input) {
      var mode = input.getAttribute('data-mode');
      var id = input.getAttribute('data-id');
      s.packages[mode].forEach(function (p) {
        if (p.id === id) { p.price = Number(input.value) || p.price; }
      });
    });
    S.saveSettings(s);
    toast('Tarifs mis à jour sur le site.');
  });

  /* ---------------- Démo ---------------- */
  $('#seed').addEventListener('click', function () {
    var s = S.getSettings();
    var noms = [
      ['Afi Koffi', 'Afi Collection', 'Mode et prêt-à-porter', '+228 90 11 22 33'],
      ['Kossi Mensah', 'KM Électronique', 'Électronique et téléphonie', '+228 91 44 55 66'],
      ['Adjo Agbeko', 'Adjo Beauté', 'Cosmétiques et soins', '+228 92 77 88 99'],
      ['Yao Dossou', 'Dossou Sneakers', 'Chaussures et maroquinerie', '+228 93 10 20 30'],
      ['Esi Amegan', 'Esi Hair', 'Cheveux et perruques', '+228 70 40 50 60']
    ];
    var produits = [
      [['Robe pagne cérémonie', '18000', 'Tailles 38 à 44'], ['Ensemble wax 2 pièces', '25000', '3 coloris']],
      [['Smartphone reconditionné', '85000', 'Garantie 3 mois'], ['Écouteurs sans fil', '9000', '']],
      [['Sérum éclaircissant', '12000', 'Flacon 50 ml'], ['Beurre de karité pur', '3500', 'Pot 250 g']],
      [['Baskets homme', '22000', 'Pointures 40 à 45'], ['Sandales cuir', '15000', '']],
      [['Perruque lace frontal', '45000', 'Cheveux naturels'], ['Mèches brésiliennes', '30000', 'Lot de 3']]
    ];
    var statuts = ['nouveau', 'confirme', 'termine', 'nouveau', 'confirme'];

    for (var i = 0; i < 5; i++) {
      var mode = i % 2 === 0 ? 'presentiel' : 'distance';
      var slots = S.slotsFor(mode);
      var day = new Date();
      day.setDate(day.getDate() + (i + 1) * 2);
      var packs = s.packages[mode];
      var pack = packs[i % packs.length];

      var b = S.addBooking({
        mode: mode,
        date: S.toISODate(day),
        time: slots[i % slots.length],
        pkg: { id: pack.id, name: pack.name, duration: pack.duration, price: pack.price },
        client: {
          fullname: noms[i][0], phone: noms[i][3], email: '',
          city: 'Lomé', business: noms[i][1], sector: noms[i][2],
          payment: 'Mobile Money (Mixx by Yas / Flooz)', heard: 'TikTok', notes: ''
        },
        products: produits[i].map(function (p) { return { name: p[0], price: p[1], note: p[2] }; })
      });
      S.updateBooking(b.ref, { status: statuts[i] });
    }
    renderAll();
    toast('5 réservations de démonstration ajoutées.');
  });

  $('#wipe').addEventListener('click', function () {
    if (!window.confirm('Effacer toutes les réservations, notifications et dates fermées ?')) { return; }
    try {
      localStorage.removeItem(S.KEYS.bookings);
      localStorage.removeItem(S.KEYS.notifs);
      localStorage.removeItem(S.KEYS.blocked);
    } catch (e) {}
    renderAll();
    toast('Données effacées.');
  });

  /* ---------------- Rendu global ---------------- */
  function renderAll() {
    renderKPIs();
    renderTable();
    renderBell();
    if (!$('#tab-dispo').classList.contains('hidden')) { renderAdminCalendar(); }
    if (!$('#tab-settings').classList.contains('hidden')) { renderSettings(); }
  }

  // Mise à jour en direct si une réservation arrive depuis un autre onglet
  window.addEventListener('storage', function (e) {
    if (e.key === S.KEYS.bookings || e.key === S.KEYS.notifs) {
      if (!$('#app').classList.contains('hidden')) {
        renderAll();
        toast('Nouvelle activité : liste actualisée.');
      }
    }
  });

  /* ---------------- Démarrage ---------------- */
  var logged = false;
  try { logged = sessionStorage.getItem('ocd_admin') === '1'; } catch (e) {}
  if (logged) { unlock(); } else { $('#gate-code').focus(); }
})();
