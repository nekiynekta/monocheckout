export async function handler(event, context) {
    const data = {
      order_ref: "ZAM123",
      amount: 30000,
      ccy: 980,
      count: 1,
      products: [
        {
          name: "Книга про медитацію",
          cnt: 1,
          price: 30000,
          code_product: "BOOK001",
          code_checkbox: "CHECK123",
          uktzed: "49019900",
          tax: []
        }
      ],
      dlv_method_list: ["np_box"],
      payment_method_list: ["card"],
      dlv_pay_merchant: false,
      payments_number: 1,
      callback_url: "https://your-site.com/api/mono-callback",
      return_url: "https://your-site.com/thank-you",
      fl_recall: false,
      hold: false,
      destination: "Оплата за книгу"
    };
  
    try {
      const response = await fetch("https://api.monobank.ua/personal/checkout/order", {
        method: "POST",
        headers: {
          "X-Token": "🔒ТВОЙ_ТОКЕН", // заміни на свій
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
  
      const resJson = await response.json();
  
      // Додаємо вивід у консоль для логів на Netlify
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
  