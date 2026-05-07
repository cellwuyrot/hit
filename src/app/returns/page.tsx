import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ReturnForm from "@/components/ReturnForm";

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: "Возврат и обмен" }]} />
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-dark mb-6">Возврат и обмен товара</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info — server-rendered, visible to search engines */}
            <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6 space-y-5 text-sm text-text-gray leading-relaxed">
              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Условия возврата</h2>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>Возврат товара надлежащего качества возможен в течение <strong className="text-text-dark">14 дней</strong> с момента получения</li>
                  <li>Товар не должен быть в употреблении, сохранены потребительские свойства, товарный вид, пломбы, ярлыки</li>
                  <li>Должен быть сохранён документ, подтверждающий покупку</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Товары ненадлежащего качества</h2>
                <p>Если вы обнаружили брак или дефект, вы имеете право на:</p>
                <ul className="list-disc ml-5 space-y-1.5 mt-2">
                  <li>Замену на аналогичный товар</li>
                  <li>Замену на другой товар с перерасчётом цены</li>
                  <li>Уменьшение покупной цены</li>
                  <li>Полный возврат денежных средств</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Сроки возврата средств</h2>
                <ul className="list-disc ml-5 space-y-1.5">
                  <li>При оплате наличными — в течение 3 рабочих дней</li>
                  <li>При оплате картой — в течение 10 рабочих дней</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-bold text-text-dark mb-2">Как оформить возврат</h2>
                <ol className="list-decimal ml-5 space-y-1.5">
                  <li>Заполните форму заявки на возврат</li>
                  <li>Дождитесь подтверждения от менеджера</li>
                  <li>Отправьте товар по указанному адресу</li>
                  <li>Получите возврат средств</li>
                </ol>
              </section>

              <div className="bg-bg-light rounded-lg p-4 border border-border">
                <p className="text-xs text-text-gray">По всем вопросам возврата и обмена обращайтесь:</p>
                <p className="mt-1"><a href="tel:+79362568950" className="text-primary hover:underline text-sm font-medium">+7 (936) 256-89-50</a></p>
              </div>
            </div>

            {/* Form — client component */}
            <ReturnForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
