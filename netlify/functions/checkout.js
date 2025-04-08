export async function handler(event, context) {
    if (event.httpMethod === "OPTIONS") {
      // Handle preflight request
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // або вкажи твій Webflow домен
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: ""
      };
    }
  
    try {
      const { cart, phone, total } = JSON.parse(event.body);
  
      if (!cart || cart.length === 0) {
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
        amount: total * 100,
        ccy: 980,
        count: cart.length,
        products: cart.map(item => ({
          name: item.name,
          cnt: 1,
          price: item.price * 100,
          code_product: item.id,
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
  
      const response = await fetch("https://api.monobank.ua/personal/checkout/order", {
        method: "POST",
        headers: {
          "X-Token": "mplCAqWmZm8pWW4KaPmBhqg",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
  
      const resJson = await response.json();
  
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: true,
          redirect_url: resJson.pageUrl || null,
          monobank_response: resJson
        })
      };
    } catch (error) {
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