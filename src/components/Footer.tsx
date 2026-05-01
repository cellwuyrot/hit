import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-text-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Т</span>
              </div>
              <span className="text-lg font-bold">ТОПХИТ</span>
            </div>
            <p className="text-white/60 text-sm">
              Интернет-магазин широкого ассортимента товаров. Продукты питания, бытовая химия, электроника, товары для сада.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="font-bold mb-4">Каталог</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/catalog" className="hover:text-white transition-colors">Все категории</Link></li>
              <li><Link href="/catalog/produkty-pitaniya" className="hover:text-white transition-colors">Продукты питания</Link></li>
              <li><Link href="/catalog/bytovaya-himiya" className="hover:text-white transition-colors">Бытовая химия</Link></li>
              <li><Link href="/catalog/elektronika" className="hover:text-white transition-colors">Электроника</Link></li>
              <li><Link href="/catalog/sadovodstvo" className="hover:text-white transition-colors">Садоводство</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold mb-4">Информация</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/news" className="hover:text-white transition-colors">Новости</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Доставка и оплата</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">О компании</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Контакты</span></li>
              <li><Link href="/account" className="hover:text-white transition-colors">Личный кабинет</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-bold mb-4">Контакты</h3>
            <div className="space-y-2 text-sm text-white/60">
              <p>📞 +7 (495) 120-36-44</p>
              <p>📧 info@tophit.ru</p>
              <p>📍 г. Москва, ул. Примерная, д. 1</p>
              <p>🕒 ПН-ПТ с 09:00 до 18:00</p>
            </div>
          </div>
        </div>

        {/* Yandex Map */}
        <div className="mt-8 rounded-lg overflow-hidden border border-white/10">
          <iframe
            src="https://yandex.ru/map-widget/v1/?um=constructor%3A44c2e09e3f4f4a3b8f1b2c3d4e5f6a7b&amp;source=constructor"
            width="100%"
            height="200"
            style={{ border: 0 }}
            title="Карта — ТОПХИТ"
            loading="lazy"
          />
        </div>

        {/* Legal info */}
        <div className="border-t border-white/10 mt-8 pt-6 text-xs text-white/40 space-y-2">
          <p>© {new Date().getFullYear()} ТОПХИТ. Все права защищены.</p>
          <p>ООО «ТОПХИТ» | ИНН: 7700000000 | ОГРН: 1177700000000</p>
          <p>Юридический адрес: 101000, г. Москва, ул. Примерная, д. 1, оф. 100</p>
          <p className="text-white/30">
            Информация на сайте не является публичной офертой. Изображения товаров могут отличаться от фактического вида.
            Все цены указаны в рублях и включают НДС.
          </p>
        </div>
      </div>
    </footer>
  );
}
