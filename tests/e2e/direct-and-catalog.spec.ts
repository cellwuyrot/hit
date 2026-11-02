import { test, expect } from '@playwright/test';

test('Названия товаров в админ-каталоге открывают карточку', async ({page}) => {
  await page.goto('/admin');
  await page.getByPlaceholder('Логин', {exact:true}).fill('e2e-admin');
  await page.getByPlaceholder('Пароль', {exact:true}).fill('e2e-password');
  await page.getByRole('button', {name:'Войти',exact:true}).click();
  await page.getByRole('button', {name:'Каталог',exact:true}).click();
  const link=page.getByRole('link',{name:'Открыть карточку товара E2E товар в новой вкладке'});
  await expect(link).toHaveAttribute('href','/product/e2e-product');
  await expect(link).toHaveAttribute('target','_blank');
});

test('Директ: доступ только администратору, проверка идентификатора', async ({page,request}) => {
  expect((await request.get('/api/admin/direct-report?id=123')).status()).toBe(401);
  await page.goto('/admin');await page.getByPlaceholder('Логин',{exact:true}).fill('e2e-admin');await page.getByPlaceholder('Пароль',{exact:true}).fill('e2e-password');
  await page.getByRole('button',{name:'Войти',exact:true}).click();await page.getByRole('button',{name:'Сайт и продвижение',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Отчёт Яндекс Директа'})).toBeVisible();
  await page.getByLabel('ID кампании Директа').fill('abc');await page.getByRole('button',{name:'Получить отчёт'}).click();
  await expect(page.locator('p[role=alert]')).toContainText('числовой ID');
  await page.getByLabel('ID кампании Директа').fill('123');await page.getByRole('button',{name:'Получить отчёт'}).click();
  await expect(page.locator('p[role=alert]')).toContainText('не настроен на сервере');
});
