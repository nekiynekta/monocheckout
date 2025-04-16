export async function handler(event, context) {
    if (event.httpMethod === "OPTIONS") {
      // Handle preflight request
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // або конкретний домен Webflow
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: ""
      };
    }
  
    try {
      const { cart, phone, total } = JSON.parse(event.body);
  
      if (!cart || cart.length === 0) {
        console.warn('⚠️ Порожній кошик отримано!');
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ error: "Кошик порожній!" })
        };
      }
  
      const data = {
        order_ref: `ZAM${phone}`,
        amount: total,
        ccy: 980,
        count: cart.length,
        products: cart.map(item => ({
          name: item.name,
          cnt: item.cnt,
          price: item.price,
          code_checkbox: "CHECK123",
          uktzed: "49019900",
          tax: []
        })),
        dlv_method_list: ["np_brnm", "np_box"],
        payment_method_list: ["card", "payment_on_delivery"],
        dlv_pay_merchant: false,
        payments_number: 1,
        callback_url: "https://your-site.com/api/mono-callback",
        return_url: "https://your-site.com/thank-you",
        fl_recall: false,
        hold: false,
        destination: `Оплата за замовлення від ${phone}`
      };
  
      console.log('📦 Дані для Monobank:', JSON.stringify(data, null, 2)); // 🧾 лог запиту
  
      const response = await fetch("https://api.monobank.ua/personal/checkout/order", {
        method: "POST",
        headers: {
          "X-Token": "mplCAqWmZm8pWW4KaPmBhqg", // заміни на свій валідний токен
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
  
      const resJson = await response.json();
  
      console.log('📬 Відповідь Monobank:', JSON.stringify(resJson, null, 2)); // 🧾 лог відповіді
  
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: true,
          redirect_url: resJson.result?.redirect_url || null,
          monobank_response: resJson
        })
      };
  
    } catch (error) {
      console.error('❌ Помилка в функції checkout:', error); // 🔥 лог помилки
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: error.message })
      };
    }
}
  
  


//   "X-Token": "mplCAqWmZm8pWW4KaPmBhqg", // заміни на свій
// "https://api.monobank.ua/personal/checkout/order"