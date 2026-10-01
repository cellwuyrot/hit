#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
APP_NAME="${PM2_APP_NAME:-tophitt}"
command -v pm2 >/dev/null || { echo "PM2 не установлен" >&2; exit 1; }
[[ -f .env ]] || { echo "Нет .env. Сохраните серверную конфигурацию перед обновлением" >&2; exit 1; }
# Сборка до остановки сервиса: при ошибке работающий процесс не трогаем.
npm ci --include=dev
npx prisma validate
npx prisma generate
npm run lint
npm run build
pm2 describe "$APP_NAME" >/dev/null
pm2 stop "$APP_NAME"
echo "Создаю согласованную SQLite-копию перед миграцией..."
node --input-type=module <<'JS'
import 'dotenv/config';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
const dbPath = (process.env.DATABASE_URL || 'file:./dev.db').replace(/^file:/, '');
if (!existsSync(dbPath)) throw new Error(`База не найдена: ${dbPath}. Проверьте DATABASE_URL; новая пустая база не будет создана.`);
mkdirSync('backups', { recursive: true });
const target = path.join('backups', `before-guest-checkout-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
try { await db.backup(target); console.log(`Backup: ${target}`); }
finally { db.close(); }
JS
# При ошибке миграции процесс намеренно остаётся остановленным: не запускаем
# новый код на несовместимой схеме. Копия находится в backups/.
npx prisma migrate deploy
pm2 restart "$APP_NAME" --update-env
pm2 save
pm2 status "$APP_NAME"
echo "Обновление завершено. Проверьте сайт и pm2 logs $APP_NAME --lines 50."
