/* ============================================================
   КОНФИГУРАЦИЯ АДВЕНТ-КАЛЕНДАРЯ — здесь легко поменять год, режим и тексты.

   YEAR — год адвента. Окошко N открывается в 00:00 по TIMEZONE N декабря.

   TEST_MODE — true: все окошки открыты (для тестирования).

   SECRETS — массив из 30 строк с подсказками/загадками для модалки.
             Сами тексты придумай и подставь сюда (индекс: SECRETS[0] — день 1).

   INSTRUCTION_TEXT — текст инструкции, показываемый перед началом календаря.
   QR_URLS — массив из 30 строк со ссылками на фото дней (или пустые строки).
             Каждая ссылка кодируется в QR-код для модалки (бесплатный API api.qrserver.com).

   ============================================================ */

const YEAR = 2026;

// TIMEZONE — часовой пояс, по которому считаются дни и полночь.
const TIMEZONE = 'Europe/Minsk'; // Минск, Беларусь (UTC+3 круглый год)

const TEST_MODE = false;

// SHOW_INSTRUCTION_EVERY_TIME — true: инструкция показывается при каждом входе.
// false: показывается один раз, потом запоминается в localStorage.
const SHOW_INSTRUCTION_EVERY_TIME = false;

// Пароль для входа на сайт. Введи свой — без него календарь не откроется.
// Оставь пустую строку '', чтобы отключить защиту.


//я понимаю что очень легко зайцти на этот сайт  но это защита от всяких дурачков
const ACCESS_PASSWORD = 'да';



const SECRETS = [
  'Сегодня начнется твой мега крутой и увлекательный квест, как и обещал 1 причина почему я тебя люблю это твоя улыбка самая добрая и красивая во все мире',
  'Хахаах как не странно начался второй день, и 2 причина это твоя мама',
  'Ну что надеюсь тебе понравились первые два дня и подарки там достойные , 3 причина твоя коронка она тоже симпатичная',
  'Пупупу вот и 4 день настал не поверишь но скоро будет первый юбилей, 4 причина у тебя ногти суперские)',
  'Победааааа ждали всем селом вот первый один из значимых подарков но хочу сказать что это самый маленький юбилейный подарок,5 причина у тебя дома очень вкусная еда',
  'Вот и настало время время для следующего подарка, 6 причина мне нравится проводить с тобой время',
  'Просто 7 причина у тебя туалетная бумага приятная',
  'Тут и настал 8 день и 8 причина милее тебя никого не встречал',
  'Почетный день именно столько у меня часов ушло на создание данного шедевра я только про сайт если что ,а и 9 причина в африке воды не хватает вот мы и вместе',
  'Воооооу поздравляю ровно 1/3 от всего квеста пройдена сегодня юбилей и тебя ждет очень приятный подарок поздравляю))))',
  'Ххахаах надеюсь тебе понравилось что там было вчера ну сегодня тоже нормальненький такой',
  'Бу испугалась не бойся лучше ищи внимательнее',
  'Папапапап очень хорошее число мне оно нравится  ',
  'Каждую субботу твой отец точно тебя проклинает',
  'БААААМ юбилей я честно говоря старался поэтому лови приятный бонус',
  'Фух слишком крутой подарок понимаю не каждый день такое видишь но все же вот тебе приятный бонус',
  '17 17 17 даже не знаю на что намек',
  'ХМмммм наверное столько тебе лет это из интересных фактов',
  'БЛяхан махан 19 день уже прикинь сам в шоке скоро должен ответ прийти мне а ты пока что развлекайся с подарочком',
  'Бам нах вот и еще один юбилей как ты уже поняла тут подарки такие весомые поэтому получай бубочка',
  '21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21 21',
  'Прости в прошлый день случайно на клаву сел жопой извини',
  'Так ну мы на финишной прямой скоро уже конечно конец но что поделать ',
  'День хз какой помогите я индус и меня держат в заложниках',
  'Юбилей поздравляю конечно не сто баллов как у коли ковпинца но пойдет',
  'ОСталось пять дней жаль побольше конечно такого но я уверен что у тебя и не такое будет в будущем',
  'Пам пам пам мало времени нам с тобой осталось но что поделать ',
  'Как то даже грустно я не знаю прикольно конечно получилось ',
  'Эх у меня даже слов нет ',
  'Вот и конец нашего маленького приключения надеюсь тебе все понравилось подарки в том числе я старался честно ЛЮБЛЮ ТЕБЯ!',
];

const INSTRUCTION_TEXT = 'Добро пожаловать! 🎄\n\n' +
  'Здесь ты найдешь 30 окон на 30 дней до Нового года.\n' +
  'Как пользоваться:\n' +
  '1. Смотри каждый день ровно по таймеру будет открываться одно окно\n' +
  '2. Ты как только кликнешь на него там будет одна из 30 причин почему я тебя люблю либо просто интересных фактов \n' +
  '3. А так же кое что еще\n' +
  '4. Ты не бойся содержимого потому что оно безопасно я все контролирую\n' +
    '5. Эта инструкция появится один раз и если нужно будет что то еще обьяснить обращайся ко мне(мини совет открывать с ноутбука ссылку отправлю в тг)\n' +
  '6. Удачи я в тебя верю';

const QR_URLS = [
    'https://drive.google.com/file/d/1A-RkdADqodRsQ7wkDzmrtH7XmQ0-WNIW/view?usp=sharing',
    'https://drive.google.com/file/d/1Lr2HJtQv2w7AOqZQuvdrY2USfMrWWo1P/view?usp=sharing',
    'https://drive.google.com/file/d/13djENNUnv6kCOyioYAx1THE592Oni9x0/view?usp=sharing',
    'https://drive.google.com/file/d/1VKBrja_7uEQ9UjDu4enX0q_bJPGFSfkm/view?usp=sharing',
    'https://drive.google.com/file/d/1FsAIWOD3n3JX4rEVwrwHWClUMkaBpwqC/view?usp=sharing', // 5
    'https://drive.google.com/file/d/10O1bzdoOwovYzlEgWHIJRMHDUZGlhQgN/view?usp=sharing',
    'https://drive.google.com/file/d/1Iz4c1Otfso6iSGWEDnyjGhbvInTWO4yv/view?usp=sharing',
    'https://drive.google.com/file/d/1sLKiLyCSD2f7FoiyeHCXyz71zZLVFhD2/view?usp=sharing',
    'https://drive.google.com/file/d/1hEQhOedm13XKVxJiFXBtGpENGlkEmJlm/view?usp=sharing',
    'https://drive.google.com/file/d/165HIjjJOonJ2hqwu5dShn45Iw40ajMvf/view?usp=sharing', // 10
    'https://drive.google.com/file/d/1KLI3Q33oQzx4q677dlq8U7sPL-6sFs04/view?usp=sharing',
    'https://drive.google.com/file/d/1EvfQS-IS7RGZ5w14w-GXl7djaUmgmuP0/view?usp=sharing',
    'https://drive.google.com/file/d/1e3JGWKj_e9YcbqkYcKOvJHE5YsCPv9Br/view?usp=sharing',
    'https://drive.google.com/file/d/1icj27DV7lRcq_yjUpvTmq7r6JTipM0H_/view?usp=sharing',
    'https://drive.google.com/file/d/1x5_hrR9KUFSozniEGjKKpe9JEcy8w3Cj/view?usp=sharing', // 15
    'https://drive.google.com/file/d/1OdHxjwB9xZ2XRVsnrNMACkV2khZrTnlw/view?usp=sharing',
    'https://drive.google.com/file/d/1ZUCbGfPGVu3b8QpwOY4NeGwhVNU-ctV8/view?usp=sharing',
    'https://drive.google.com/file/d/1RH3QhSL8YlcvUSQn0-DUPT4lC6Zp6QQV/view?usp=sharing',
    'https://drive.google.com/file/d/1vgqp8Ow6nqC8-DBovGVRzkaw_4HKihUK/view?usp=sharing',
    'https://drive.google.com/file/d/1nEipJ6FJG-nuzuBU6GZOT1aEScVAL2uY/view?usp=sharing', // 20
    'https://drive.google.com/file/d/1Fo3t-D3LCzTslm8PxqO-JVlxBL6n_k-R/view?usp=sharing',
    'https://drive.google.com/file/d/1a6j1xS6iQMWMbQo7AyyhxTOURg6Tgb1I/view?usp=sharing',
    'https://drive.google.com/file/d/1Af4NADxvEMpFvcKsTz-zkP6bDwJ3425E/view?usp=sharing',
    'https://drive.google.com/file/d/1XwJxFSkE_5x3McV4-JaNGtyb84tLrbV4/view?usp=sharing',
    'https://drive.google.com/file/d/1nPkPhgRpF3KhzpBGNydtadMX0EWwyng0/view?usp=sharing', // 25
    'https://drive.google.com/file/d/1K72m2_P3AtK8M4aLQb8HjFFt1jnE-rMh/view?usp=sharing',
    'https://drive.google.com/file/d/1DSwEgkyh2WrGPjoBUGtfqX_fykof8kem/view?usp=sharing',
    'https://drive.google.com/file/d/1Y7hRs6AHYHisEHT_P0ZdPG-07E9JUe6t/view?usp=sharing',
    'https://drive.google.com/file/d/1Ku-DtMYg2AlPhhkiU6OsSHndf7fAEOl5/view?usp=sharing',
    'https://drive.google.com/file/d/1SxI9X0-nCySbrRhRSetU0nDM4MfuvQAO/view?usp=sharing', // 30
];

// QR_STYLE — 'styled': стильные QR с сердечком (библиотека QRCodeStyling, нужен интернет),
// 'classic': обычные ч/б QR через api.qrserver.com (как было до изменения).
const QR_STYLE = 'styled';