import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-text-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Company info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="ТОПХИТ" width={32} height={32} className="w-8 h-8" />
              <span className="text-lg font-bold">ТОПХИТ</span>
            </div>
            <p className="text-white/75 text-sm">
              Динамично развивающаяся торговая компания с широким ассортиментом товаров для повседневной жизни, бизнеса и семьи.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Каталог</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/75">
              <li><Link href="/catalog" className="hover:text-white transition-colors">Все категории</Link></li>
              <li><Link href="/catalog/produkty-pitaniya" className="hover:text-white transition-colors">Продукты питания</Link></li>
              <li><Link href="/catalog/bytovaya-himiya" className="hover:text-white transition-colors">Бытовая химия</Link></li>
              <li><Link href="/catalog/elektronika" className="hover:text-white transition-colors">Электроника</Link></li>
              <li><Link href="/catalog/sadovodstvo" className="hover:text-white transition-colors">Садоводство</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Информация</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/75">
              <li><Link href="/about" className="hover:text-white transition-colors">О компании</Link></li>
              <li><Link href="/wholesale" className="hover:text-white transition-colors">Оптовые продажи</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors">Новости</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Возврат и обмен</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">Личный кабинет</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Контакты</h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/75">
              <p><a href="tel:+79362568950" className="hover:text-white transition-colors">📞 +7 (936) 256-89-50</a></p>
              <p><a href="mailto:zakaz@tophitt.ru" className="hover:text-white transition-colors break-all">📧 zakaz@tophitt.ru</a></p>
              <p><a href="mailto:opt@tophitt.ru" className="hover:text-white transition-colors break-all">📧 opt@tophitt.ru (опт)</a></p>
              <p><a href="mailto:info@tophitt.ru" className="hover:text-white transition-colors break-all">📧 info@tophitt.ru (поставщики)</a></p>
              <p>📍 127018, г. Москва, ул. Складочная д. 1 стр. 18</p>
              <p>🕒 ПН-ПТ с 09:00 до 18:00</p>
            </div>
          </div>
        </div>

        {/* Social networks */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <h3 className="font-bold mb-3 sm:mb-4 text-center text-sm sm:text-base">Наши соцсети</h3>
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <a href="https://t.me/tophit_store" target="_blank" rel="nofollow noopener noreferrer"
              className="w-10 h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-colors" title="Telegram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            <a href="https://vk.com/tophit_market" target="_blank" rel="nofollow noopener noreferrer"
              className="w-10 h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-colors" title="ВКонтакте">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.042-2.763-5.32-2.763-5.778 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.644v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.644-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
              </svg>
            </a>
            <a href="https://wa.me/79362568950" target="_blank" rel="nofollow noopener noreferrer"
              className="w-10 h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-colors" title="WhatsApp">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a href="https://www.ozon.ru/seller/tophit/" target="_blank" rel="nofollow noopener noreferrer"
              className="w-10 h-10 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-colors" title="OZON">
              <svg className="w-5 h-5" viewBox="0 0 100 32" fill="none">
                <rect width="100" height="32" rx="4" fill="#005BFF" />
                <text x="50" y="22" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">OZON</text>
              </svg>
            </a>
          </div>
        </div>

        {/* Yandex Map — Moscow, Skladochnaya 1/18 */}
        <div className="mt-6 rounded-lg overflow-hidden border border-white/10">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=37.5937%2C55.8025&z=16&l=map&pt=37.5937%2C55.8025%2Cpm2rdm"
            width="100%"
            height="200"
            style={{ border: 0 }}
            title="Карта — ТОПХИТ, Москва"
            loading="lazy"
          />
        </div>

        {/* Legal info */}
        <div className="border-t border-white/10 mt-8 pt-6 text-xs text-white/55 space-y-2">
          <p>© {new Date().getFullYear()} ТОПХИТ. Все права защищены.</p>
          <p>Юридический адрес: 127018, г. Москва, ул. Складочная д. 1 стр. 18</p>
          <p className="text-white/45">
            Информация на сайте не является публичной офертой. Изображения товаров могут отличаться от фактического вида.
            Все цены указаны в рублях и включают НДС.
          </p>
        </div>
      </div>
    </footer>
  );
}
