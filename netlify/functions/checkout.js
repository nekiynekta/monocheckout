export async function handler(event, context) {
    // Отримуємо дані з тіла запиту (Cart, phone, total)
    const { cart, phone, total } = JSON.parse(event.body);
  
    // Перевірка, чи є кошик
    if (!cart || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Кошик порожній!" })
      };
    }
  
    // Формуємо дані для Monobank API
    const data = {
      order_ref: `ZAM${phone}`,  // Замовлення за номером телефону
      amount: total * 100, // сума замовлення у копійках
      ccy: 980, // валюта (грн)
      count: cart.length,
      products: cart.map(item => ({
        name: item.name,
        cnt: 1,
        price: item.price, // ціна у копійках
        code_product: item.id,  // Використовуємо id товару для code_product
        code_checkbox: "CHECK123",
        uktzed: "49019900",
        tax: [] // можна додати податки, якщо потрібно
      })),
      dlv_method_list: ["np_brnm", "np_box"], // спосіб доставки
      payment_method_list: ["card", "payment_on_delivery"], // спосіб оплати
      dlv_pay_merchant: false,
      payments_number: 1,
      callback_url: "https://your-site.com/api/mono-callback", // замініть на свій callback URL
      return_url: "https://your-site.com/thank-you", // замініть на свою сторінку подяки
      fl_recall: false,
      hold: false,
      destination: `Оплата за замовлення`
    };
  
    try {
      const response = await fetch("https://api.monobank.ua/personal/checkout/order", {
        method: "POST",
        headers: {
          "X-Token": "mplCAqWmZm8pWW4KaPmBhqg", // замініть на свій токен
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
  
      const resJson = await response.json();
  
      // Виводимо результат у консоль для тестування
      console.log("Відповідь Monobank:", resJson);
  
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          response: resJson
        })
      };
    } catch (error) {
      console.error("Помилка Monobank:", error.message);
  
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  


//   "X-Token": "mplCAqWmZm8pWW4KaPmBhqg", // заміни на свій
// "https://api.monobank.ua/personal/checkout/order"