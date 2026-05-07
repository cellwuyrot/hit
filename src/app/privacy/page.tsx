import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — ТОПХИТ",
  description: "Политика конфиденциальности и обработки персональных данных на сайте tophitt.ru. Порядок сбора, хранения и защиты данных покупателей.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-dark mb-6">Политика конфиденциальности</h1>

          <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-8 space-y-6 text-sm text-text-gray leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">1. Общие положения</h2>
              <p>Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006 №152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных.</p>
              <p className="mt-2">Оператор ставит своей важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">2. Основные понятия</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому физическому лицу (субъекту персональных данных).</li>
                <li><strong>Обработка персональных данных</strong> — любое действие с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение.</li>
                <li><strong>Оператор</strong> — интернет-магазин ТОПХИТ (tophitt.ru).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">3. Какие данные мы собираем</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>Имя и фамилия</li>
                <li>Адрес электронной почты</li>
                <li>Номер телефона</li>
                <li>Адрес доставки</li>
                <li>Информация о заказах</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">4. Цели обработки</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>Оформление и доставка заказов</li>
                <li>Связь с покупателем для подтверждения заказа</li>
                <li>Улучшение качества обслуживания</li>
                <li>Информирование об акциях и новостях (с согласия пользователя)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">5. Защита данных</h2>
              <p>Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования, распространения.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">6. Права пользователя</h2>
              <p>Субъект персональных данных имеет право:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Получить информацию об обработке своих персональных данных</li>
                <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-dark mb-2">7. Контактная информация</h2>
              <p>По вопросам обработки персональных данных обращайтесь:</p>
              <p className="mt-2">Телефон: <a href="tel:+79362568950" className="text-primary hover:underline">+7 (936) 256-89-50</a></p>
              <p>Email: <a href="mailto:info@tophitt.ru" className="text-primary hover:underline">info@tophitt.ru</a></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
