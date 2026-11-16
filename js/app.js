/* ============================================================
   Логика адвент-календаря: даты, таймер, модалка, прогресс.
   Всё на клиенте, без бэкенда. Для правки: js/config.js
   ============================================================ */
(function () {
  'use strict';

  const TOTAL_DAYS = 30;
  const STORAGE_KEY = 'advent-calendar-opened';

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

  /* ---------- Доступность окон по датам ---------- */

  // Окошко N доступно с 00:00 по местному времени N декабря года YEAR.
  function isAvailable(dayNumber) {
    if (TEST_MODE) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unlockDate = new Date(YEAR, 11, dayNumber); // 1 декабря → 30 декабря
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
    const nextYearStart = new Date(YEAR + 1, 0, 1, 0, 0, 0, 0);
    if (new Date() >= nextYearStart) {
      return `✨ Декабрь ${YEAR} подошло к концу! С Новым годом, дорогой друг! ✨`;
    }
    return '';
  }

  function updateCountdown() {
    const congratulations = getCongratulationsText();
    if (congratulations) {
      timerEl.classList.add('finished');
      timerEl.textContent = congratulations;
      return;
    }

    timerEl.classList.remove('finished');

    // Собираем номера дней, которые ещё не были открыты.
    const unopened = [];
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      if (!openedDays.includes(d)) unopened.push(d);
    }

    const nextDay = unopened[0];
    if (nextDay === undefined) return;

    const unlockDate = new Date(YEAR, 11, nextDay, 0, 0, 0, 0);
    const diffMs = Math.max(0, unlockDate.getTime() - Date.now());
    const diffSec = Math.floor(diffMs / 1000);
    const d = Math.floor(diffSec / 86400);
    const h = Math.floor((diffSec % 86400) / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');

    // Если следующее окошко уже доступно, но не открыто — мягко намекаем.
    timerLabel.textContent = diffSec === 0 ? 'Окошко уже доступно — жми!' : 'До следующего окошка:';
  }

  /* ---------- Модальное окно ---------- */

  function openModal(dayNumber) {
    if (!isAvailable(dayNumber)) return;

    markDayOpened(dayNumber);
    renderCalendar();
    updateProgress();

    modalTitle.textContent = `День ${dayNumber}`;
    modalText.textContent = SECRETS[dayNumber - 1] || `Секрет дня ${dayNumber} ещё не добавлен.`;

    // QR-код с ссылкой на фото дня: генерируем через бесплатный API api.qrserver.com
    // Если QR_URLS[dayNumber-1] пустая строка — QR не показываем.
    if (modalQR) {
      const qrUrl = QR_URLS[dayNumber - 1] || '';
      if (qrUrl) {
        modalQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`;
        modalQR.style.display = 'block';
      } else {
        modalQR.style.display = 'none';
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

  // Показываем инструкцию каждый раз при загрузке страницы
  instructionModal.style.display = 'flex';
  instructionText.textContent = INSTRUCTION_TEXT;
  // Закрытие — крестик, оверлей или Esc
  instructionCloseBtn.addEventListener('click', closeInstructionModal);
  instructionOverlay.addEventListener('click', closeInstructionModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInstructionModal();
  });

  function closeInstructionModal() {
    instructionModal.style.display = 'none';
  }

  // Таймер тикает раз в секунду; при смене даты перерисовываем сетку,
  // чтобы в полночь новое окошко «загорелось» без перезагрузки страницы.
  let lastDateKey = new Date().toDateString();
  setInterval(() => {
    updateCountdown();
    const todayKey = new Date().toDateString();
    if (todayKey !== lastDateKey) {
      lastDateKey = todayKey;
      renderCalendar();
    }
  }, 1000);
})();
