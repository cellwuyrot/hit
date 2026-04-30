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
                <span className="text-white font-bold">М</span>
              </div>
              <span className="text-lg font-bold">МагазинПро</span>
            </div>
            <p className="text-white/60 text-sm">
              Интернет-магазин товаров для дома, строительства и ремонта. Широкий ассортимент, низкие цены.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="font-bold mb-4">Каталог</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/catalog" className="hover:text-white transition-colors">Все категории</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Бытовая химия</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Инструменты</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Краски и лаки</span></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold mb-4">Информация</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><span className="hover:text-white transition-colors cursor-pointer">О компании</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Доставка</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Оплата</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Контакты</span></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-bold mb-4">Контакты</h3>
            <div className="space-y-2 text-sm text-white/60">
              <p>📞 +7 (495) 120-36-44</p>
              <p>📧 info@magazinpro.ru</p>
              <p>📍 Москва и МО</p>
              <p>🕒 ПН-ПТ с 09:00 до 18:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
          <p>© {new Date().getFullYear()} МагазинПро. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
