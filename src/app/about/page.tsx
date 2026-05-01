import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="bg-bg-white rounded-xl border border-border p-6 md:p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Image src="/logo.png" alt="ТОПХИТ" width={64} height={64} className="w-16 h-16" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-dark">ТОПХИТ</h1>
                <p className="text-text-gray">Торговая компания</p>
              </div>
            </div>

            <div className="prose max-w-none text-text-gray leading-relaxed space-y-4">
              <p className="text-lg text-text-dark">
                ТОПХИТ — это динамично развивающаяся торговая компания, которая предлагает широкий и постоянно обновляемый ассортимент товаров для повседневной жизни, бизнеса и семьи. Мы стремимся объединить лучшее из разных товарных категорий, чтобы каждый клиент мог найти всё необходимое — в одном месте.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold text-text-dark mb-2">Наша цель</h3>
              <p className="text-sm text-text-gray">Создать удобную и выгодную платформу, где можно купить самые востребованные и актуальные товары по честным ценам.</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-bold text-text-dark mb-2">Наш подход</h3>
              <p className="text-sm text-text-gray">Гибкость, честность и ориентация на потребности клиента.</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="font-bold text-text-dark mb-2">Наша особенность</h3>
              <p className="text-sm text-text-gray">Регулярное расширение ассортимента и индивидуальный подход к каждому партнёру.</p>
            </div>
          </div>

          {/* About text */}
          <div className="bg-bg-white rounded-xl border border-border p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-text-dark mb-4">О нас</h2>
            <div className="text-text-gray leading-relaxed space-y-4">
              <p>
                Мы уже предлагаем товары в популярных категориях — от продуктов питания и товаров для дома до одежды, техники и аксессуаров. В будущем ассортимент будет только расти, охватывая всё больше направлений — как для розничных покупателей, так и для оптовых клиентов.
              </p>
              <p>
                Продажи ведутся через онлайн-платформу с удобной системой доставок/самовывозов и возможностью оптового сотрудничества.
              </p>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-text-dark mb-4">Контакты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-text-gray mb-1">Адрес:</p>
                  <p className="text-text-dark font-medium">127018, г. Москва, ул. Складочная д. 1 стр. 18</p>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Телефон:</p>
                  <a href="tel:+79362568950" className="text-primary font-bold text-lg hover:underline">+7 (936) 256-89-50</a>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-text-gray mb-1">Розничные заказы:</p>
                  <a href="mailto:zakaz@топхит.store" className="text-primary hover:underline font-medium">zakaz@топхит.store</a>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Оптовые заказы:</p>
                  <a href="mailto:opt@топхит.store" className="text-primary hover:underline font-medium">opt@топхит.store</a>
                </div>
                <div>
                  <p className="text-text-gray mb-1">Для поставщиков:</p>
                  <a href="mailto:info@топхит.store" className="text-primary hover:underline font-medium">info@топхит.store</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
