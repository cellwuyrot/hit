@echo off
chcp 65001 >nul 2>&1
title МагазинПро — Установка и запуск

echo ============================================
echo   МагазинПро — Интернет-магазин
echo   Автоматическая установка и запуск
echo ============================================
echo.

:: Проверяем Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo Скачайте и установите Node.js: https://nodejs.org/
    echo Рекомендуется версия LTS ^(20 или выше^).
    echo.
    pause
    exit /b 1
)

echo [1/6] Node.js найден:
node --version
echo.

:: Устанавливаем зависимости
echo [2/6] Установка зависимостей (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости.
    pause
    exit /b 1
)
echo.

:: Копируем .env если нет
if not exist ".env" (
    echo [3/6] Создание файла .env...
    copy .env.example .env >nul
) else (
    echo [3/6] Файл .env уже существует, пропускаем.
)
echo.

:: Генерируем Prisma клиент
echo [4/6] Генерация Prisma клиента...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось сгенерировать Prisma клиент.
    pause
    exit /b 1
)
echo.

:: Создаём/обновляем БД
echo [5/6] Создание базы данных и применение миграций...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Миграция не удалась, пробуем db push...
    call npx prisma db push
)
echo.

:: Заполняем БД начальными данными
echo [6/6] Заполнение базы данных тестовыми данными...
call npm run seed
echo.

echo ============================================
echo   Установка завершена!
echo   Запуск сервера разработки...
echo.
echo   Сайт:         http://localhost:3000
echo   Админ-панель: http://localhost:3000/admin
echo   Логин: admin
echo   Пароль: admin123
echo ============================================
echo.
echo Для остановки сервера нажмите Ctrl+C
echo.

:: Запускаем dev-сервер
call npm run dev
