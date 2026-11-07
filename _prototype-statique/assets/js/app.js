/* ============================================================
   OCD LIVE — Tunnel de réservation (site public)
   ============================================================ */
(function () {
  'use strict';

  var S = window.OCD;

  var state = {
    step: 1,
    mode: null,     // presentiel | distance
    date: null,     // AAAA-MM-JJ
    time: null,     // HH:MM
    pkg: null,      // objet formule
    booking: null   // réservation créée
  };

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  var maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var STEPS = ['Format', 'Date & heure', 'Formule', 'Vos infos', 'Confirmation'];
  var CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  /* ---------------- Outils ---------------- */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function modeLabel(m) { return m === 'presentiel' ? 'En présentiel — Lomé (Togo)' : 'À distance'; }

  function pkgHours(pkg) {
    return pkg && /2\s*heures/i.test(pkg.duration) ? 2 : 1;
  }

  function isSubscription(pkg) {
    return pkg && /lives/i.test(pkg.duration);
  }

  /* ---------------- Navigation entre étapes ---------------- */
  function renderStepper() {
    var html = '';
    STEPS.forEach(function (name, i) {
      var n = i + 1;
      var cls = n === state.step ? 'current' : (n < state.step ? 'done' : '');
      var mark = n < state.step ? CHECK : n;
      html += '<div class="step-pill ' + cls + '" data-step="' + n + '"><i>' + mark + '</i><span>' + name + '</span></div>';
      if (n < STEPS.length) { html += '<div class="step-sep"></div>'; }
    });
    $('#stepper').innerHTML = html;

    $$('#stepper .step-pill').forEach(function (p) {
      var n = +p.getAttribute('data-step');
      if (n < state.step && state.step < 5) {
        p.style.cursor = 'pointer';
        p.onclick = function () { goTo(n); };
      }
    });
  }

  function goTo(step, skipScroll) {
    state.step = step;
    for (var i = 1; i <= 5; i++) {
      $('#panel-' + i).classList.toggle('hidden', i !== step);
    }
    renderStepper();

    if (step === 2) { renderCalendar(); renderSlots(); renderSummary('#summary-2'); }
    if (step === 3) { renderPackages(); }
    if (step === 4) { renderSummary('#summary-4'); }

    if (!skipScroll) {
      var top = $('#reserver').getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  // rend un élément cliquable aussi au clavier (Entrée / Espace)
  function clickable(el, handler) {
    el.addEventListener('click', handler);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handler();
      }
    });
  }

  /* ---------------- Étape 1 : format ---------------- */
  $$('.mode-card').forEach(function (card) {
    clickable(card, function () {
      state.mode = card.getAttribute('data-mode');
      state.date = null; state.time = null; state.pkg = null;
      $$('.mode-card').forEach(function (c) { c.classList.toggle('active', c === card); });
      $('#mode-recall').textContent = state.mode === 'presentiel'
        ? 'Live en présentiel au studio de Lomé — ouvert du lundi au samedi.'
        : 'Live à distance — disponible 7j/7, jusqu’à 21h.';
      setTimeout(function () { goTo(2); }, 140);
    });
  });

  /* ---------------- Étape 2 : calendrier ---------------- */
  function dayStatus(dateObj) {
    var iso = S.toISODate(dateObj);
    if (dateObj < today) { return { ok: false, free: 0, reason: 'passé' }; }
    if (S.getBlockedDates().indexOf(iso) >= 0) { return { ok: false, free: 0, reason: 'fermé' }; }
    if (S.closedWeekdays(state.mode).indexOf(dateObj.getDay()) >= 0) { return { ok: false, free: 0, reason: 'fermé' }; }

    var all = S.slotsFor(state.mode);
    var taken = S.takenSlots(iso, state.mode);
    var free = all.filter(function (t) { return taken.indexOf(t) < 0 && !isPastSlot(iso, t); });
    return { ok: free.length > 0, free: free.length, reason: free.length ? '' : 'complet' };
  }

  function isPastSlot(iso, time) {
    var now = new Date();
    if (iso !== S.toISODate(now)) { return false; }
    var p = time.split(':');
    var slot = new Date();
    slot.setHours(+p[0], +p[1], 0, 0);
    // on ferme la réservation 2 h avant le créneau du jour même
    return slot.getTime() - now.getTime() < 2 * 3600 * 1000;
  }

  function renderCalendar() {
    var y = view.getFullYear(), m = view.getMonth();
    $('#cal-title').textContent = S.MOIS[m] + ' ' + y;
    $('#cal-prev').disabled = view <= minMonth;
    $('#cal-next').disabled = view >= maxMonth;

    var html = '';
    ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].forEach(function (d) {
      html += '<div class="cal-dow">' + d + '</div>';
    });

    var first = new Date(y, m, 1);
    var offset = (first.getDay() + 6) % 7;           // semaine commençant le lundi
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    for (var i = 0; i < offset; i++) { html += '<div class="cal-day empty"></div>'; }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateObj = new Date(y, m, d);
      var iso = S.toISODate(dateObj);
      var st = dayStatus(dateObj);
      var cls = 'cal-day';
      if (iso === S.toISODate(new Date())) { cls += ' today'; }
      if (iso === state.date) { cls += ' selected'; }
      html += '<button type="button" class="' + cls + '" data-date="' + iso + '"' + (st.ok ? '' : ' disabled') +
              ' title="' + (st.ok ? st.free + ' créneau(x) libre(s)' : st.reason) + '">' +
              d + (st.ok ? '<span class="free">' + st.free + '</span>' : '') + '</button>';
    }

    $('#cal-grid').innerHTML = html;

    $$('#cal-grid .cal-day[data-date]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.date = btn.getAttribute('data-date');
        state.time = null;
        renderCalendar(); renderSlots(); renderSummary('#summary-2');
      });
    });
  }

  $('#cal-prev').addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderCalendar();
  });
  $('#cal-next').addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderCalendar();
  });

  /* ---------------- Étape 2 : créneaux ---------------- */
  function renderSlots() {
    var title = $('#slots-title'), grid = $('#slot-grid'), empty = $('#slots-empty');

    if (!state.date) {
      title.textContent = 'Sélectionnez d’abord un jour';
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      empty.textContent = 'Les créneaux disponibles s’afficheront ici.';
      return;
    }

    title.textContent = 'Créneaux du ' + S.formatDateFr(state.date);
    var all = S.slotsFor(state.mode);
    var taken = S.takenSlots(state.date, state.mode);

    var html = '';
    all.forEach(function (t) {
      var busy = taken.indexOf(t) >= 0 || isPastSlot(state.date, t);
      html += '<button type="button" class="slot' + (state.time === t ? ' selected' : '') + '" data-time="' + t + '"' +
              (busy ? ' disabled' : '') + '>' + t + '</button>';
    });
    grid.innerHTML = html;
    empty.classList.add('hidden');

    $$('#slot-grid .slot:not(:disabled)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.time = btn.getAttribute('data-time');
        renderSlots(); renderSummary('#summary-2');
      });
    });
  }

  /* ---------------- Récapitulatif latéral ---------------- */
  function renderSummary(sel) {
    var box = $(sel);
    if (!box) { return; }

    var rows = '';
    rows += row('Format', state.mode ? modeLabel(state.mode) : '—');
    rows += row('Date', state.date ? S.formatDateFr(state.date) : '—');
    rows += row('Heure', state.time ? state.time : '—');
    if (sel === '#summary-4') {
      rows += row('Formule', state.pkg ? state.pkg.name + ' · ' + state.pkg.duration : '—');
    }

    var total = state.pkg ? S.formatPrice(state.pkg.price) : '—';
    var cta, disabled;

    if (sel === '#summary-2') {
      cta = 'Choisir ma formule';
      disabled = !(state.date && state.time);
    } else {
      cta = 'Valider ma réservation';
      disabled = false;
    }

    box.innerHTML =
      '<h4>Votre réservation</h4>' + rows +
      (sel === '#summary-4'
        ? '<div class="sum-total"><span>Total</span><b>' + total + '</b></div>'
        : '') +
      '<button type="button" class="btn btn-primary btn-block" id="' + (sel === '#summary-2' ? 'to-step-3' : 'submit-booking') + '"' +
        (disabled ? ' disabled' : '') + '>' + cta + '</button>' +
      '<p class="sum-reassure">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:2px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
        'Aucun paiement sur le site. L’équipe vous rappelle sous 24 h pour confirmer.' +
      '</p>';

    if (sel === '#summary-2') {
      var b = $('#to-step-3');
      if (b && !disabled) { b.onclick = function () { goTo(3); }; }
    } else {
      var s = $('#submit-booking');
      if (s) { s.onclick = submitBooking; }
    }
  }

  function row(label, value) {
    return '<div class="sum-row"><span>' + esc(label) + '</span><b>' + esc(value) + '</b></div>';
  }

  /* ---------------- Étape 3 : formules ---------------- */
  function renderPackages() {
    var packs = S.getSettings().packages[state.mode] || [];
    $('#pack-recall').textContent = S.formatDateFr(state.date) + ' à ' + state.time + ' · ' + modeLabel(state.mode);
    $('#pack-grid').innerHTML = packs.map(function (p) {
      return packCard(p, state.pkg && state.pkg.id === p.id);
    }).join('');

    $$('#pack-grid .pack').forEach(function (el) {
      clickable(el, function () {
        var id = el.getAttribute('data-id');
        state.pkg = packs.filter(function (p) { return p.id === id; })[0];
        renderPackages();
        $('#to-step-4').disabled = false;
      });
    });

    $('#to-step-4').disabled = !state.pkg;
  }

  function packCard(p, selected, isShowcase) {
    var tag = p.tag
      ? '<span class="pack-tag' + (p.tag === 'Abonnement' ? ' sub' : '') + '">' + esc(p.tag) + '</span>'
      : '';
    var perks = p.perks.map(function (k) {
      return '<li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' + esc(k) + '</li>';
    }).join('');
    var sub = /lives/i.test(p.duration);

    return '<div class="pack' + (selected ? ' selected' : '') + '" data-id="' + p.id + '"' +
      (isShowcase ? '' : ' role="button" tabindex="0"') + '>' +
      tag +
      '<h3>' + esc(p.name) + '</h3>' +
      '<div class="dur">' + esc(p.duration) + '</div>' +
      '<div class="price">' + S.formatPrice(p.price) + (sub ? ' <small>/ ' + (p.id.indexOf('3') > -1 ? 'semaine' : 'mois') + '</small>' : '') + '</div>' +
      '<ul>' + perks + '</ul>' +
      (isShowcase
        ? '<div class="pack-pick" style="background:var(--line-2)">Disponible à la réservation</div>'
        : '<div class="pack-pick">' + (selected ? 'Formule choisie' : 'Choisir cette formule') + '</div>') +
      '</div>';
  }

  $('#to-step-4').addEventListener('click', function () {
    if (state.pkg) { goTo(4); }
  });

  /* ---------------- Étape 4 : produits ---------------- */
  var productCount = 0;

  function addProductRow(focus) {
    productCount++;
    var wrap = document.createElement('div');
    wrap.className = 'product-row';
    wrap.innerHTML =
      '<span class="idx">Produit ' + productCount + '</span>' +
      '<div class="field"><input type="text" class="p-name" placeholder="Nom du produit *"></div>' +
      '<div class="field"><input type="number" class="p-price" placeholder="Prix (FCFA)" min="0" step="100"></div>' +
      '<div class="field"><input type="text" class="p-note" placeholder="Détail : taille, couleur, stock…"></div>' +
      '<button type="button" class="icon-btn" title="Retirer ce produit">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>' +
      '</button>';

    wrap.querySelector('.icon-btn').addEventListener('click', function () {
      if ($$('#products .product-row').length === 1) {
        toast('Au moins un produit est nécessaire.');
        return;
      }
      wrap.remove();
      reindexProducts();
    });

    $('#products').appendChild(wrap);
    if (focus) { wrap.querySelector('.p-name').focus(); }
  }

  function reindexProducts() {
    $$('#products .product-row').forEach(function (r, i) {
      r.querySelector('.idx').textContent = 'Produit ' + (i + 1);
    });
    productCount = $$('#products .product-row').length;
  }

  $('#add-product').addEventListener('click', function () {
    if ($$('#products .product-row').length >= 15) {
      toast('15 produits au maximum par live.');
      return;
    }
    addProductRow(true);
  });

  /* ---------------- Validation et envoi ---------------- */
  function setError(input, on) {
    input.classList.toggle('invalid', on);
    var err = input.parentNode.querySelector('.field-error');
    if (err) { err.classList.toggle('show', on); }
  }

  function validate() {
    var ok = true, firstBad = null;

    var required = ['#fullname', '#phone', '#business', '#sector'];
    required.forEach(function (sel) {
      var el = $(sel);
      var bad = !el.value.trim();
      if (sel === '#phone' && !bad) {
        bad = (el.value.replace(/\D/g, '').length < 8);
      }
      setError(el, bad);
      if (bad) { ok = false; firstBad = firstBad || el; }
    });

    var mail = $('#email');
    var badMail = mail.value.trim() !== '' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value.trim());
    setError(mail, badMail);
    if (badMail) { ok = false; firstBad = firstBad || mail; }

    var products = collectProducts();
    if (!products.length) {
      ok = false;
      toast('Ajoutez au moins un produit à présenter.');
      firstBad = firstBad || $('#products .p-name');
    }

    if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return ok;
  }

  function collectProducts() {
    return $$('#products .product-row').map(function (r) {
      return {
        name: r.querySelector('.p-name').value.trim(),
        price: r.querySelector('.p-price').value.trim(),
        note: r.querySelector('.p-note').value.trim()
      };
    }).filter(function (p) { return p.name !== ''; });
  }

  function submitBooking() {
    if (!validate()) { return; }

    // dernière vérification : le créneau peut avoir été pris entre-temps
    if (S.takenSlots(state.date, state.mode).indexOf(state.time) >= 0) {
      toast('Ce créneau vient d’être réservé. Choisissez-en un autre.');
      state.time = null;
      goTo(2);
      return;
    }

    state.booking = S.addBooking({
      mode: state.mode,
      date: state.date,
      time: state.time,
      pkg: { id: state.pkg.id, name: state.pkg.name, duration: state.pkg.duration, price: state.pkg.price },
      client: {
        fullname: $('#fullname').value.trim(),
        phone: $('#phone').value.trim(),
        email: $('#email').value.trim(),
        city: $('#city').value.trim(),
        business: $('#business').value.trim(),
        sector: $('#sector').value,
        payment: $('#payment').value,
        heard: $('#heard').value,
        notes: $('#notes').value.trim()
      },
      products: collectProducts()
    });

    renderConfirmation(state.booking);
    goTo(5);
  }

  /* ---------------- Étape 5 : confirmation ---------------- */
  function renderConfirmation(b) {
    var s = S.getSettings();
    var waText = encodeURIComponent(
      'Bonjour OCD Live, je viens de réserver un live.\n' +
      'Référence : ' + b.ref + '\n' +
      'Format : ' + modeLabel(b.mode) + '\n' +
      'Date : ' + S.formatDateFr(b.date) + ' à ' + b.time + '\n' +
      'Formule : ' + b.pkg.name + ' (' + b.pkg.duration + ')\n' +
      'Nom : ' + b.client.fullname
    );

    $('#confirm-card').innerHTML =
      '<div class="confirm-icon">' +
        '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<h2>C’est réservé, ' + esc(b.client.fullname.split(' ')[0]) + ' !</h2>' +
      '<p class="muted">Notre équipe a reçu votre demande et vous rappelle sous 24 h au ' + esc(b.client.phone) + ' pour confirmer.</p>' +
      '<div class="ref">' + b.ref + '</div>' +
      '<div class="confirm-recap">' +
        row('Format', modeLabel(b.mode)) +
        row('Date', S.formatDateFr(b.date)) +
        row('Heure', b.time) +
        row('Formule', b.pkg.name + ' · ' + b.pkg.duration) +
        row('Produits', b.products.length + ' produit(s) enregistré(s)') +
        (b.mode === 'presentiel' ? row('Lieu', s.address) : row('Lieu', 'Lien de connexion envoyé par WhatsApp')) +
        '<div class="sum-total"><span>Total à régler</span><b>' + S.formatPrice(b.pkg.price) + '</b></div>' +
      '</div>' +
      '<div class="confirm-actions">' +
        '<a class="btn btn-primary" target="_blank" rel="noopener" href="https://wa.me/' + s.adminPhone + '?text=' + waText + '">Confirmer sur WhatsApp</a>' +
        '<button type="button" class="btn btn-ghost" id="ics-btn">Ajouter à mon agenda</button>' +
        '<button type="button" class="btn btn-ghost" id="new-booking">Nouvelle réservation</button>' +
      '</div>' +
      '<div class="next-steps">' +
        '<h3>La suite</h3>' +
        '<ol>' +
          '<li>Vous recevez un appel ou un message WhatsApp de l’équipe sous 24 h.</li>' +
          '<li>Le paiement se règle à ce moment-là (Mobile Money, espèces ou virement).</li>' +
          (b.mode === 'presentiel'
            ? '<li>Le jour J, présentez-vous 20 minutes avant au ' + esc(s.address) + '.</li>'
            : '<li>Un test technique est programmé la veille du direct.</li>') +
          '<li>Gardez votre référence <b>' + b.ref + '</b> pour tout échange avec nous.</li>' +
        '</ol>' +
      '</div>';

    $('#ics-btn').addEventListener('click', function () { downloadICS(b); });
    $('#new-booking').addEventListener('click', function () { window.location.reload(); });
  }

  function downloadICS(b) {
    var s = S.getSettings();
    var p = b.date.split('-');
    var t = b.time.split(':');
    var start = new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]);
    var end = new Date(start.getTime() + pkgHours(b.pkg) * 3600 * 1000);

    function fmt(d) {
      return d.getFullYear() + S.pad(d.getMonth() + 1) + S.pad(d.getDate()) + 'T' +
             S.pad(d.getHours()) + S.pad(d.getMinutes()) + '00';
    }

    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OCD Live//Reservation//FR',
      'BEGIN:VEVENT',
      'UID:' + b.ref + '@ocdlive',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start),
      'DTEND:' + fmt(end),
      'SUMMARY:Live OCD Live — ' + b.pkg.name,
      'LOCATION:' + (b.mode === 'presentiel' ? s.address : 'Live à distance'),
      'DESCRIPTION:Réservation ' + b.ref + ' — ' + b.client.business,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ocd-live-' + b.ref + '.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------------- Vitrine des formules ---------------- */
  function renderShowcase() {
    var packs = S.getSettings().packages.presentiel;
    $('#showcase-packs').innerHTML = packs.map(function (p) {
      return packCard(p, false, true);
    }).join('');
  }

  /* ---------------- Initialisation ---------------- */
  $$('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () { goTo(+btn.getAttribute('data-goto')); });
  });

  var settings = S.getSettings();
  $('#year').textContent = new Date().getFullYear();
  $('#footer-wa').href = 'https://wa.me/' + settings.adminPhone;
  $('#footer-mail').href = 'mailto:' + settings.adminEmail;

  addProductRow(false);
  renderShowcase();
  renderStepper();
})();
