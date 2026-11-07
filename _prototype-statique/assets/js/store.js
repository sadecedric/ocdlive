/* ============================================================
   OCD LIVE — Couche de données (prototype)
   ------------------------------------------------------------
   Prototype : tout est stocké dans le localStorage du navigateur.
   En production, remplacer les fonctions marquées  [API]  par
   des appels vers un backend (Node / PHP / Firebase...).
   ============================================================ */
(function (global) {
  'use strict';

  var KEYS = {
    bookings: 'ocd_bookings',
    notifs: 'ocd_notifications',
    blocked: 'ocd_blocked_dates',
    settings: 'ocd_settings'
  };

  /* ---------- Réglages par défaut (modifiables côté admin) ---------- */
  var DEFAULT_SETTINGS = {
    adminEmail: 'contact@ocdlive.com',
    adminPhone: '22890000000',          // WhatsApp de l'équipe (international, sans +)
    adminCode: 'ocd2026',               // code d'accès du tableau de bord (prototype)
    address: 'Studio OCD Live — Lomé, Togo',
    slotsPresentiel: ['09:00', '11:00', '14:00', '16:00', '18:00'],
    slotsDistance: ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'],
    closedWeekdaysPresentiel: [0],      // 0 = dimanche : studio fermé
    closedWeekdaysDistance: [],         // à distance : 7j/7
    packages: {
      presentiel: [
        { id: 'p1', name: 'Essentiel', duration: '1 heure de live', price: 15000, tag: '',
          perks: ['1 h de direct animé', 'Studio, lumière et son', 'Jusqu’à 5 produits présentés', 'Diffusion sur la page OCD Live'] },
        { id: 'p2', name: 'Confort', duration: '2 heures de live', price: 25000, tag: 'Le + choisi',
          perks: ['2 h de direct animé', 'Studio, lumière et son', 'Jusqu’à 12 produits présentés', 'Diffusion sur la page OCD Live', 'Replay envoyé après le live'] },
        { id: 'p3', name: 'Hebdo', duration: '3 lives dans la semaine', price: 70000, tag: 'Abonnement',
          perks: ['3 directs de 1 h dans la semaine', 'Vos produits repostés par Bovan', 'Reposts sur les réseaux OCD Live', 'Visuel de teasing offert', 'Priorité sur les créneaux'] },
        { id: 'p4', name: 'Mensuel', duration: '12 lives dans le mois', price: 240000, tag: 'Abonnement',
          perks: ['12 directs dans le mois', 'Reposts sur tous les comptes de Bovan', 'Mise en avant sur la page OCD Live', '2 montages vidéo courts par mois', 'Chef de projet dédié', 'Bilan de performance mensuel'] }
      ],
      distance: [
        { id: 'd1', name: 'Essentiel', duration: '1 heure de live', price: 12000, tag: '',
          perks: ['1 h de direct en visio', 'Test technique avant le live', 'Jusqu’à 5 produits présentés', 'Diffusion sur la page OCD Live'] },
        { id: 'd2', name: 'Confort', duration: '2 heures de live', price: 20000, tag: 'Le + choisi',
          perks: ['2 h de direct en visio', 'Test technique avant le live', 'Jusqu’à 12 produits présentés', 'Diffusion sur la page OCD Live', 'Replay envoyé après le live'] },
        { id: 'd3', name: 'Hebdo', duration: '3 lives dans la semaine', price: 55000, tag: 'Abonnement',
          perks: ['3 directs de 1 h dans la semaine', 'Vos produits repostés par Bovan', 'Reposts sur les réseaux OCD Live', 'Visuel de teasing offert', 'Priorité sur les créneaux'] },
        { id: 'd4', name: 'Mensuel', duration: '12 lives dans le mois', price: 190000, tag: 'Abonnement',
          perks: ['12 directs dans le mois', 'Reposts sur tous les comptes de Bovan', 'Mise en avant sur la page OCD Live', '2 montages vidéo courts par mois', 'Chef de projet dédié', 'Bilan de performance mensuel'] }
      ]
    }
  };

  /* ---------- Utilitaires de stockage ---------- */
  function read(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { global.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  /* ---------- Réglages ---------- */
  function getSettings() {
    var saved = read(KEYS.settings, null);
    var base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    if (saved) {
      for (var k in saved) {
        if (Object.prototype.hasOwnProperty.call(saved, k)) { base[k] = saved[k]; }
      }
    }
    return base;
  }
  function saveSettings(s) { return write(KEYS.settings, s); }
  function resetSettings() {
    try { global.localStorage.removeItem(KEYS.settings); } catch (e) {}
  }

  /* ---------- Réservations ---------- */
  function getBookings() { return read(KEYS.bookings, []); }
  function saveBookings(list) { return write(KEYS.bookings, list); }

  function makeRef() {
    var y = String(new Date().getFullYear()).slice(-2);
    var n = Math.floor(1000 + Math.random() * 9000);
    return 'OCD-' + y + '-' + n;
  }

  // [API] -> POST /bookings
  function addBooking(data) {
    var list = getBookings();
    var booking = {
      ref: makeRef(),
      createdAt: new Date().toISOString(),
      status: 'nouveau',          // nouveau | confirme | termine | annule
      mode: data.mode,            // presentiel | distance
      date: data.date,            // AAAA-MM-JJ
      time: data.time,            // HH:MM
      pkg: data.pkg,              // { id, name, duration, price }
      client: data.client,        // { fullname, phone, email, business, sector, city, notes, payment }
      products: data.products     // [{ name, price, note }]
    };
    list.push(booking);
    saveBookings(list);
    pushNotification(booking);
    notifyAdmin(booking);
    return booking;
  }

  function updateBooking(ref, patch) {
    var list = getBookings();
    for (var i = 0; i < list.length; i++) {
      if (list[i].ref === ref) {
        for (var k in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, k)) { list[i][k] = patch[k]; }
        }
        saveBookings(list);
        return list[i];
      }
    }
    return null;
  }

  function deleteBooking(ref) {
    saveBookings(getBookings().filter(function (b) { return b.ref !== ref; }));
  }

  /* ---------- Disponibilités ---------- */
  function getBlockedDates() { return read(KEYS.blocked, []); }
  function toggleBlockedDate(dateStr) {
    var list = getBlockedDates();
    var i = list.indexOf(dateStr);
    if (i >= 0) { list.splice(i, 1); } else { list.push(dateStr); }
    write(KEYS.blocked, list);
    return list;
  }

  // Créneaux déjà pris pour une date et un format donnés
  function takenSlots(dateStr, mode) {
    return getBookings()
      .filter(function (b) { return b.date === dateStr && b.mode === mode && b.status !== 'annule'; })
      .map(function (b) { return b.time; });
  }

  function slotsFor(mode) {
    var s = getSettings();
    return mode === 'presentiel' ? s.slotsPresentiel : s.slotsDistance;
  }

  function closedWeekdays(mode) {
    var s = getSettings();
    return mode === 'presentiel' ? s.closedWeekdaysPresentiel : s.closedWeekdaysDistance;
  }

  /* ---------- Notifications internes (cloche de l'admin) ---------- */
  function getNotifications() { return read(KEYS.notifs, []); }

  function pushNotification(booking) {
    var list = getNotifications();
    list.unshift({
      id: 'n' + Date.now(),
      ref: booking.ref,
      read: false,
      createdAt: booking.createdAt,
      title: 'Nouvelle réservation ' + booking.ref,
      body: booking.client.fullname + ' a réservé un live ' +
            (booking.mode === 'presentiel' ? 'en présentiel (Lomé)' : 'à distance') +
            ' le ' + formatDateFr(booking.date) + ' à ' + booking.time + '.'
    });
    write(KEYS.notifs, list.slice(0, 100));
  }

  function markAllRead() {
    write(KEYS.notifs, getNotifications().map(function (n) { n.read = true; return n; }));
  }

  function unreadCount() {
    return getNotifications().filter(function (n) { return !n.read; }).length;
  }

  /* ---------- Notification e-mail de l'équipe ----------
     [API] Prototype : la notification est enregistrée dans le site.
     Pour l'envoi réel d'e-mail, décommenter l'un des deux blocs
     ci-dessous une fois le service configuré.
  -------------------------------------------------------- */
  function notifyAdmin(booking) {
    var s = getSettings();
    var payload = {
      to: s.adminEmail,
      subject: 'OCD Live — nouvelle réservation ' + booking.ref,
      message: buildAdminMessage(booking)
    };

    // --- Option A : service sans backend (FormSubmit, EmailJS, Make, Zapier...)
    // fetch('https://formsubmit.co/ajax/' + s.adminEmail, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    //   body: JSON.stringify(payload)
    // });

    // --- Option B : backend maison
    // fetch('/api/notify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });

    if (global.console && global.console.info) {
      global.console.info('[OCD Live] Notification admin prête à être envoyée :', payload);
    }
    return payload;
  }

  function buildAdminMessage(b) {
    var lines = [];
    lines.push('NOUVELLE RÉSERVATION — ' + b.ref);
    lines.push('');
    lines.push('Format    : ' + (b.mode === 'presentiel' ? 'Présentiel — Lomé (Togo)' : 'À distance'));
    lines.push('Date      : ' + formatDateFr(b.date) + ' à ' + b.time);
    lines.push('Formule   : ' + b.pkg.name + ' (' + b.pkg.duration + ') — ' + formatPrice(b.pkg.price));
    lines.push('');
    lines.push('Client    : ' + b.client.fullname);
    lines.push('Téléphone : ' + b.client.phone);
    if (b.client.email) { lines.push('E-mail    : ' + b.client.email); }
    lines.push('Activité  : ' + b.client.business + ' (' + b.client.sector + ')');
    if (b.client.city) { lines.push('Ville     : ' + b.client.city); }
    lines.push('Paiement  : ' + (b.client.payment || 'non précisé'));
    lines.push('');
    lines.push('PRODUITS À PRÉSENTER :');
    b.products.forEach(function (p, i) {
      lines.push('  ' + (i + 1) + '. ' + p.name +
        ' — ' + (p.price ? formatPrice(p.price) : 'prix à préciser') +
        (p.note ? ' — ' + p.note : ''));
    });
    if (b.client.notes) { lines.push(''); lines.push('Note du client : ' + b.client.notes); }
    return lines.join('\n');
  }

  /* ---------- Formatage ---------- */
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatDateFr(dateStr) {
    var p = String(dateStr).split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatDateShort(dateStr) {
    var p = String(dateStr).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function formatPrice(n) {
    return String(Number(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* ---------- Export public ---------- */
  global.OCD = {
    KEYS: KEYS,
    MOIS: MOIS,
    JOURS: JOURS,
    getSettings: getSettings,
    saveSettings: saveSettings,
    resetSettings: resetSettings,
    getBookings: getBookings,
    addBooking: addBooking,
    updateBooking: updateBooking,
    deleteBooking: deleteBooking,
    getBlockedDates: getBlockedDates,
    toggleBlockedDate: toggleBlockedDate,
    takenSlots: takenSlots,
    slotsFor: slotsFor,
    closedWeekdays: closedWeekdays,
    getNotifications: getNotifications,
    markAllRead: markAllRead,
    unreadCount: unreadCount,
    buildAdminMessage: buildAdminMessage,
    notifyAdmin: notifyAdmin,
    formatDateFr: formatDateFr,
    formatDateShort: formatDateShort,
    formatPrice: formatPrice,
    toISODate: toISODate,
    pad: pad
  };
})(window);
