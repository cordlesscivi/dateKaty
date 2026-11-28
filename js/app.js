/* ============================================================
   Логика адвент-календаря: даты, таймер, модалка, прогресс.
   Всё на клиенте, без бэкенда. Для правки: js/config.js
   ============================================================ */
(function () {
  'use strict';

  const TOTAL_DAYS = 30;
  const STORAGE_KEY = 'advent-calendar-opened';

  // Сердечко в центре стильного QR-кода (используется при QR_STYLE = 'styled').
  const HEART_DATA_URI =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="%23e0356b" d="M12 21s-7-4.5-9.5-9C.8 8.6 2.7 4.5 6.5 4.5c2.1 0 3.6 1.2 4.5 2.6.9-1.4 2.4-2.6 4.5-2.6 3.8 0 5.7 4.1 4 7.5C19 16.5 12 21 12 21z"/></svg>';

  const calendarGrid = document.getElementById('calendar-grid');
  const timerEl = document.getElementById('countdown');
  const timerLabel = document.getElementById('timer-label');
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const progressBar = document.getElementById('progress-bar');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const modalQR = document.getElementById('qr-code');
  const instructionModal = document.getElementById('instruction-modal');
  const instructionOverlay = document.getElementById('instruction-overlay');
  const instructionText = document.getElementById('instruction-text');
  const instructionCloseBtn = document.getElementById('instruction-close-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalOverlay = document.getElementById('modal-overlay');

  let openedDays = [];
  let lastFocusedElement = null;

  /* ---------- Прогресс: localStorage ---------- */

  function loadOpenedDays() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) openedDays = parsed;
      }
    } catch (e) {
      // localStorage может быть недоступен — просто начинаем без прогресса.
    }
  }

  function saveOpenedDays() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openedDays));
    } catch (e) {
      // Игнорируем ошибки сохранения.
    }
  }

  /* ---------- Часовой пояс (TIMEZONE из config.js) ---------- */

  // Смещение зоны TIMEZONE относительно UTC (в мс) на момент date.
  function getZoneOffsetMs(date) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = {};
    for (const p of fmt.formatToParts(date)) {
      if (p.type !== 'literal') parts[p.type] = p.value;
    }
    const asUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second),
    );
    return asUtc - date.getTime();
  }

  // «Сейчас» в зоне TIMEZONE — дата, сдвинутая так, что UTC-методы читают минское время.
  function zonedNow() {
    const now = new Date();
    return new Date(now.getTime() + getZoneOffsetMs(now));
  }

  // Абсолютное время (мс) полуночи дня в зоне TIMEZONE.
  function zonedMidnightToUtc(year, month, day) {
    const guess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    return guess - getZoneOffsetMs(new Date(guess));
  }

  /* ---------- Доступность окон по датам ---------- */

  // Окошко N доступно с 00:00 по времени Минска N декабря года YEAR.
  function isAvailable(dayNumber) {
    if (TEST_MODE) return true;
    const today = zonedNow();
    today.setUTCHours(0, 0, 0, 0);
    const unlockDate = new Date(Date.UTC(YEAR, 11, dayNumber)); // 1 декабря → 30 декабря
    return today >= unlockDate;
  }

  function isOpened(dayNumber) {
    return openedDays.includes(dayNumber);
  }

  function markDayOpened(dayNumber) {
    if (openedDays.includes(dayNumber)) return;
    openedDays.push(dayNumber);
    openedDays.sort((a, b) => a - b);
    saveOpenedDays();
    updateProgress();
  }

  function updateProgress() {
    const percent = Math.min(100, (openedDays.length / TOTAL_DAYS) * 100);
    progressBar.style.width = percent + '%';
  }

  /* ---------- Рендер календаря ---------- */

  function renderCalendar() {
    calendarGrid.innerHTML = '';

    for (let dayNumber = 1; dayNumber <= TOTAL_DAYS; dayNumber++) {
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.dataset.day = dayNumber;
      cell.style.animationDelay = (dayNumber - 1) * 45 + 'ms';

      const unlocked = isAvailable(dayNumber);

      if (!unlocked) {
        cell.classList.add('locked');
        cell.setAttribute('tabindex', '-1');
        cell.setAttribute('aria-disabled', 'true');

        const lock = document.createElement('span');
        lock.className = 'day-lock';
        lock.textContent = '🔒';
        cell.appendChild(lock);
      }

      const numberEl = document.createElement('span');
      numberEl.className = 'day-number';
      numberEl.textContent = dayNumber;
      cell.appendChild(numberEl);

      if (unlocked) {
        cell.classList.add(isOpened(dayNumber) ? 'opened' : 'available');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', `День ${dayNumber}, ${isOpened(dayNumber) ? 'уже открыто' : 'открыть'}`);
      }

      if (unlocked) {
        const hint = document.createElement('span');
        hint.className = 'day-hint';
        hint.textContent = isOpened(dayNumber) ? 'открыто' : 'настроить';
        cell.appendChild(hint);
      }

      calendarGrid.appendChild(cell);
    }
  }

  /* ---------- Таймер обратного отсчёта ---------- */

  function getCongratulationsText() {
    if (openedDays.length >= TOTAL_DAYS) {
      return '✨ Все секреты раскрыты! С Новым годом, дорогой друг! ✨';
    }
    const nextYearStartMs = zonedMidnightToUtc(YEAR + 1, 1, 1);
    if (Date.now() >= nextYearStartMs) {
      return `✨ Декабрь ${YEAR} подошло к концу! С Новым годом, дорогой друг! ✨`;
    }
    return '';
  }

  function updateCountdown() {
    // Тестовый режим: все окошки доступны, считать нечего.
    if (TEST_MODE) {
      timerEl.classList.add('finished');
      timerEl.textContent = 'Тестовый режим: все окошки доступны ✨';
      return;
    }

    const congratulations = getCongratulationsText();
    if (congratulations) {
      timerEl.classList.add('finished');
      timerEl.textContent = congratulations;
      return;
    }

    timerEl.classList.remove('finished');

    // Считаем до ближайшего окошка, которое ещё не разблокировано
    // (его полночь по Минску ещё не наступила) — независимо от того,
    // какие окошки уже открыты.
    const nowMs = Date.now();
    let nextLockedDay = null;
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      if (zonedMidnightToUtc(YEAR, 12, d) > nowMs) {
        nextLockedDay = d;
        break;
      }
    }

    // Все 30 окошек уже разблокированы — остаётся открыть недостающие.
    if (nextLockedDay === null) {
      timerEl.classList.add('finished');
      timerEl.textContent = '✨ Все окошки разблокированы! Открой оставшиеся ✨';
      return;
    }

    const unlockMs = zonedMidnightToUtc(YEAR, 12, nextLockedDay);
    const diffMs = Math.max(0, unlockMs - nowMs);
    const diffSec = Math.floor(diffMs / 1000);
    const d = Math.floor(diffSec / 86400);
    const h = Math.floor((diffSec % 86400) / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
    timerLabel.textContent = 'До следующего окошка:';
  }

  /* ---------- Модальное окно ---------- */

  function openModal(dayNumber) {
    if (!isAvailable(dayNumber)) return;

    markDayOpened(dayNumber);
    renderCalendar();
    updateProgress();

    modalTitle.textContent = `День ${dayNumber}`;
    modalText.textContent = SECRETS[dayNumber - 1] || `Секрет дня ${dayNumber} ещё не добавлен.`;

    // QR-код дня.
    // QR_STYLE = 'styled' — стильный QR с сердечком (библиотека QRCodeStyling, нужен интернет),
    // QR_STYLE = 'classic' — обычный ч/б QR через api.qrserver.com (как было).
    if (modalQR) {
      const qrUrl = QR_URLS[dayNumber - 1] || '';
      if (!qrUrl) {
        modalQR.style.display = 'none';
        modalQR.removeAttribute('src');
        return;
      }
      modalQR.style.display = 'block';

      const makeClassicQR = () => {
        modalQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`;
      };

      if (QR_STYLE === 'styled' && typeof QRCodeStyling === 'function') {
        const qr = new QRCodeStyling({
          width: 150,
          height: 150,
          type: 'canvas',
          data: qrUrl,
          margin: 6,
          qrOptions: { errorCorrectionLevel: 'H' },
          image: HEART_DATA_URI,
          imageOptions: { margin: 4, imageSize: 0.3 },
          dotsOptions: { type: 'rounded', color: '#2a1a3e' },
          cornersSquareOptions: { type: 'extra-rounded', color: '#2a1a3e' },
          cornersDotOptions: { type: 'dot', color: '#2a1a3e' },
          backgroundOptions: { color: '#ffffff' },
        });
        qr.getRawData('png').then((result) => {
          const src = typeof result === 'string' ? result : URL.createObjectURL(result);
          if (src) modalQR.src = src;
          else makeClassicQR();
        }).catch(makeClassicQR);
      } else {
        makeClassicQR();
      }
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lastFocusedElement = document.activeElement;
    if (typeof modalCloseBtn.focus === 'function') modalCloseBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  /* ---------- Инициализация ---------- */

  // Делегирование: слушатели вешаем на grid один раз, сами ячейки пересоздаём при рендере.
  calendarGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.day-cell');
    if (!cell) return;
    if (cell.classList.contains('locked')) return;
    openModal(Number(cell.dataset.day));
  });

  calendarGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const cell = e.target.closest('.day-cell');
    if (!cell) return;
    if (cell.classList.contains('locked')) return;
    e.preventDefault();
    openModal(Number(cell.dataset.day));
  });

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  loadOpenedDays();
  renderCalendar();
  updateProgress();
  updateCountdown();

  /* ---------- Инструкция ---------- */

  // Инструкция показывается один раз (или каждый раз,
  // если SHOW_INSTRUCTION_EVERY_TIME = true) — запоминаем в localStorage.
  const INSTRUCTION_SEEN_KEY = 'advent-calendar-instruction-seen';

  function showInstructionModal() {
    if (!SHOW_INSTRUCTION_EVERY_TIME && localStorage.getItem(INSTRUCTION_SEEN_KEY) === 'true') return;
    instructionText.textContent = INSTRUCTION_TEXT;
    instructionModal.classList.add('open');
    instructionModal.setAttribute('aria-hidden', 'false');
  }

  function closeInstructionModal() {
    instructionModal.classList.remove('open');
    instructionModal.setAttribute('aria-hidden', 'true');
    localStorage.setItem(INSTRUCTION_SEEN_KEY, 'true');
  }

  instructionCloseBtn.addEventListener('click', closeInstructionModal);
  instructionOverlay.addEventListener('click', closeInstructionModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInstructionModal();
  });

  /* ---------- Экран входа (пароль) ---------- */

  const UNLOCK_KEY = 'advent-calendar-unlocked';
  const lockScreen = document.getElementById('lock-screen');
  const lockForm = document.getElementById('lock-form');
  const lockInput = document.getElementById('lock-input');
  const lockError = document.getElementById('lock-error');

  function unlockApp() {
    lockScreen.style.display = 'none';
    document.body.style.overflow = '';
    showInstructionModal();
  }

  if (!ACCESS_PASSWORD || sessionStorage.getItem(UNLOCK_KEY) === 'true') {
    unlockApp();
  } else {
    lockScreen.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    lockInput.focus();
    lockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (lockInput.value.trim() === ACCESS_PASSWORD) {
        sessionStorage.setItem(UNLOCK_KEY, 'true');
        unlockApp();
      } else {
        lockError.textContent = 'Неверный пароль. Попробуй ещё раз ✨';
        lockInput.value = '';
        lockInput.focus();
      }
    });
  }

  // Таймер тикает раз в секунду; при смене даты перерисовываем сетку,
  // чтобы в полночь новое окошко «загорелось» без перезагрузки страницы.
  let lastDateKey = zonedNow().toISOString().slice(0, 10);
  setInterval(() => {
    updateCountdown();
    const todayKey = zonedNow().toISOString().slice(0, 10);
    if (todayKey !== lastDateKey) {
      lastDateKey = todayKey;
      renderCalendar();
    }
  }, 1000);
})();
