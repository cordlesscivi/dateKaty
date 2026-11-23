// Копия функций из app.js для проверки таймзоны Europe/Minsk (UTC+3 круглый год)
const TIMEZONE = 'Europe/Minsk';

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

function zonedMidnightToUtc(year, month, day) {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  return guess - getZoneOffsetMs(new Date(guess));
}

const assert = require('assert');

// 1. Смещение Минска = +3 часа круглый год
assert.strictEqual(getZoneOffsetMs(new Date(Date.UTC(2026, 11, 15, 12))), 3 * 3600 * 1000, 'offset Dec = +3h');
assert.strictEqual(getZoneOffsetMs(new Date(Date.UTC(2026, 6, 15, 12))), 3 * 3600 * 1000, 'offset Jul = +3h (no DST)');

// 2. Полночь 1 декабря 2026 в Минске = 30 ноя 2026 21:00 UTC
assert.strictEqual(zonedMidnightToUtc(2026, 12, 1), Date.UTC(2026, 10, 30, 21, 0, 0), 'Dec 1 midnight Minsk');

// 3. Полночь 1 января 2027 в Минске = 31 дек 2026 21:00 UTC
assert.strictEqual(zonedMidnightToUtc(2027, 1, 1), Date.UTC(2026, 11, 31, 21, 0, 0), 'Jan 1 midnight Minsk');

// 4. Дата в Минске: 30 ноя 23:00 UTC → в Минске уже 1 дек 02:00
function minskTodayKey(ms) {
  const shifted = new Date(ms + getZoneOffsetMs(new Date(ms)));
  return shifted.toISOString().slice(0, 10);
}
assert.strictEqual(minskTodayKey(Date.UTC(2026, 10, 30, 23, 0, 0)), '2026-12-01', 'Nov 30 23:00 UTC → Dec 1 Minsk');
assert.strictEqual(minskTodayKey(Date.UTC(2026, 10, 30, 20, 59, 59)), '2026-11-30', 'Nov 30 20:59 UTC → Nov 30 Minsk');

// 5. Логика isAvailable через сравнение ключей дат (день N доступен с 00:00 N декабря)
const YEAR_TEST = 2026;
function isAvailableAt(ms, dayNumber) {
  const todayKey = minskTodayKey(ms);
  const unlockKey = `${YEAR_TEST}-12-${String(dayNumber).padStart(2, '0')}`;
  return todayKey >= unlockKey;
}
assert.strictEqual(isAvailableAt(Date.UTC(2026, 10, 30, 23, 0, 0), 1), true, 'Dec 1 00:00 Minsk → day 1 available');
assert.strictEqual(isAvailableAt(Date.UTC(2026, 10, 30, 20, 59, 59), 1), false, 'Nov 30 23:59 Minsk → day 1 locked');
assert.strictEqual(isAvailableAt(Date.UTC(2026, 11, 15, 12), 15), true, 'Dec 15 → day 15 available');
assert.strictEqual(isAvailableAt(Date.UTC(2026, 11, 15, 12), 16), false, 'Dec 15 → day 16 locked');

// 6. Таймер считает до ближайшего ещё НЕ разблокированного дня
function nextLockedDayAt(ms) {
  for (let d = 1; d <= 30; d++) {
    if (zonedMidnightToUtc(2026, 12, d) > ms) return d;
  }
  return null;
}
assert.strictEqual(nextLockedDayAt(Date.UTC(2026, 10, 16, 12)), 1, 'Nov 16 → next locked is day 1');
assert.strictEqual(nextLockedDayAt(Date.UTC(2026, 11, 1, 0, 0, 1)), 2, 'Dec 1 00:00:01 Minsk → day 2');
assert.strictEqual(nextLockedDayAt(Date.UTC(2026, 11, 29, 20, 0, 0)), 30, 'Dec 29 23:00 Minsk → day 30 still locked');
assert.strictEqual(nextLockedDayAt(Date.UTC(2026, 11, 29, 21, 0, 0)), null, 'Dec 30 00:00 Minsk → all unlocked');

// 7. Таймер: 16 ноя 2026 18:00 UTC (= 21:00 Минск) → до 1 дек Минск осталось 14д 3ч
const nowMs = Date.UTC(2026, 10, 16, 18, 0, 0);
const target = zonedMidnightToUtc(2026, 12, 1);
const diffSec = Math.floor((target - nowMs) / 1000);
assert.strictEqual(diffSec, 14 * 86400 + 3 * 3600, 'countdown from Nov 16 18:00 UTC');

// 8. Реальный сейчас → что показывает таймер
const realTarget = zonedMidnightToUtc(2026, 12, 1);
const realDiff = Math.max(0, realTarget - Date.now());
const rSec = Math.floor(realDiff / 1000);
console.log('Real now → Dec 1 00:00 Minsk:',
  Math.floor(rSec / 86400) + 'd',
  Math.floor((rSec % 86400) / 3600) + 'h',
  Math.floor((rSec % 3600) / 60) + 'm',
  (rSec % 60) + 's');

console.log('ALL_TZ_TESTS_PASSED');
