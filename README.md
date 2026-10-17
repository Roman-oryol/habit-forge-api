# HabitForge — бэкенд

REST API для трекера привычек: авторизация по JWT, привычки с гибкой периодичностью, отметки выполнения, категории. Каждый пользователь видит и меняет только свои данные.

**Фронтенд:** [Roman-oryol/habit-forge](https://github.com/Roman-oryol/habit-forge) · [habit-forge-alpha.vercel.app](https://habit-forge-alpha.vercel.app/)
**Продакшн API:** `https://habit-forge-api-5nus.onrender.com/api/v1`

> Сервис на бесплатном тарифе Render засыпает при простое. Первый запрос после паузы может занять около минуты (холодный старт).

## Стек

- **Node.js + Express 5 + TypeScript** (ESM, `tsx watch` для разработки)
- **PostgreSQL** (в проде — Neon)
- **Prisma 7** с драйвер-адаптером `@prisma/adapter-pg` (версия намеренно закреплена на 7)
- **Zod** — валидация входящих данных
- **bcryptjs** — хеширование паролей, **jsonwebtoken** — JWT
- **cors**, **dotenv**

## Структура

```
src/
├── index.ts          # сборка приложения: cors, json, монтирование роутов
├── config.ts         # переменные окружения, проверка JWT_SECRET при старте
├── lib/              # prisma-клиент, хелперы ошибок Prisma
├── middleware/       # requireAuth, getUserId
├── routes/           # auth.ts, habits.ts, categories.ts
├── schemas/          # Zod-схемы входных данных
├── mappers/          # модель БД → формат ответа API
└── types/            # общие типы, расширение Express.Request
prisma/
└── schema.prisma
prisma7.config.ts
```

## Модель данных

- **User** — `email` (уникальный), `passwordHash`
- **Category** — `name`, принадлежит пользователю
- **Habit** — `name`, `createdAt`, опциональная `categoryId`, `frequencyType` (enum) + `frequencyDays` (`Int[]`) + `frequencyCount` (`Int?`)
- **Completion** — отметка выполнения за дату (`@db.Date`), уникальна по паре `(habitId, date)`

Связи: удаление привычки каскадно удаляет её отметки; удаление категории не удаляет привычки, а обнуляет у них `categoryId` (`onDelete: SetNull`).

## API

Базовый путь: `/api/v1`. Все роуты, кроме `register` и `login`, требуют заголовок `Authorization: Bearer <token>`.

| Метод  | Путь                 | Описание                                              |
| ------ | -------------------- | ----------------------------------------------------- |
| POST   | `/auth/register`     | Регистрация, возвращает токен                         |
| POST   | `/auth/login`        | Вход, возвращает токен                                |
| GET    | `/auth/me`           | Текущий пользователь                                  |
| GET    | `/habits`            | Список привычек с отметками                           |
| POST   | `/habits`            | Создать привычку                                      |
| GET    | `/habits/:id`        | Одна привычка                                         |
| PATCH  | `/habits/:id`        | Частичное обновление                                  |
| DELETE | `/habits/:id`        | Удалить                                               |
| POST   | `/habits/:id/toggle` | Переключить отметку; тело: `{ "date": "YYYY-MM-DD" }` |
| GET    | `/categories`        | Список категорий                                      |
| POST   | `/categories`        | Создать категорию                                     |
| GET    | `/categories/:id`    | Одна категория                                        |
| PATCH  | `/categories/:id`    | Переименовать                                         |
| DELETE | `/categories/:id`    | Удалить                                               |

## Безопасность

- **Пароли:** bcrypt-хеш, пароль в открытом виде нигде не хранится.
- **Логин:** одинаковый `401` и на неверный email, и на неверный пароль, чтобы нельзя было перебором выяснить, какие email зарегистрированы. Для несуществующего пользователя всё равно сравнивается хеш-заглушка — время ответа не выдаёт отсутствие аккаунта.
- **JWT:** в `sub` лежит id пользователя, срок жизни 1 час. Без `JWT_SECRET` сервер не стартует.
- **Изоляция данных (защита от IDOR):** `userId` из токена добавляется в `where` каждого запроса. Чужая запись отвечает `404`, а не `403`, чтобы не раскрывать её существование. При создании и обновлении привычки проверяется, что категория принадлежит тому же пользователю.
- **Валидация:** каждое тело запроса проходит через Zod; для PATCH используется `.partial()`.
- **Хеширование не блокирует сервер:** используется асинхронный `hash`, а не `hashSync`.

## Переменные окружения

Файл `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/habitforge
JWT_SECRET=длинная-случайная-строка
FRONTEND_URL=http://localhost:5173
PORT=3000
```

- `FRONTEND_URL` — origin, которому разрешён CORS. По умолчанию `http://localhost:5173`.
- `JWT_SECRET` в проде должен быть длинным и случайным, например `openssl rand -base64 48`.

## Локальный запуск

Нужны Node.js и PostgreSQL.

```bash
npm install
# заполните .env, создайте пустую БД
npx prisma migrate dev     # применить миграции и сгенерировать клиент
npm run dev                # http://localhost:3000
```

Скрипты:

```bash
npm run dev      # tsx watch
npm run build    # компиляция TypeScript
npm run start    # запуск собранной версии
```

## Деплой

- **БД:** Neon (постоянный бесплатный тариф).
- **API:** Render (Web Service)
  - Build: `npm install && npx prisma generate && npm run build`
  - Start: `npm run start`
  - Переменные: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`. `PORT` Render задаёт сам.
- **Миграции** на бесплатном тарифе Render (нет Pre-Deploy Command) применяются вручную с локальной машины:

```bash
DATABASE_URL="<строка подключения Neon>" npx prisma migrate deploy
```

На Windows (PowerShell): `$env:DATABASE_URL="..."; npx prisma migrate deploy`.

## Осознанные компромиссы

- **Авторизация написана вручную в учебных целях.** В коммерческом проекте я бы взял готового провайдера (Auth0, Clerk, Supabase Auth, Better Auth): сброс пароля, подтверждение email, MFA и защита от перебора там уже решены и проверены.
- **Токен отдаётся в теле ответа и хранится на клиенте в `localStorage`.** Фронтенд и API на разных доменах, поэтому httpOnly-cookie усложнили бы CORS и потребовали защиты от CSRF. Цена — риск кражи токена при XSS.
- **Express вместо NestJS, Prisma вместо «голого» `pg`:** меньше церемоний для проекта такого размера.
