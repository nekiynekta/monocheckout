export async function handler(event, context) {
  const monoApiKey = process.env.MONO_API_KEY;

  if (event.httpMethod === "OPTIONS") {
    // Handle preflight request
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }
  
  try {
    const { cart, order_ref, total } = JSON.parse(event.body);

    if (!cart || cart.length === 0) {
      console.warn('Empty cart received!');
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: "Cart is empty!" })
      };
    }
  
    // Safe cart processing
    const safeCart = cart.map(item => ({
      name: item.name,
      price: item.price,
      cnt: Math.max(1, parseInt(item.cnt) || 1)
    }));

    const data = {
      order_ref: `${order_ref}`,
      amount: total,
      ccy: 980,
      count: safeCart.reduce((sum, item) => sum + item.cnt, 0),
      products: safeCart,
      dlv_method_list: ["np_brnm", "np_box"],
      payment_method_list: ["card"],
      dlv_pay_merchant: false,
      payments_number: 1,
      callback_url: "https://monocheckout-test.netlify.app/.netlify/functions/mono-callback",
      return_url: "https://www.htotse.com/successful-payment",
      fl_recall: true,
      hold: false,
      destination: `Оплата за замовлення ${order_ref}`
    };

  
    console.log('Data for Monobank:', JSON.stringify(data, null, 2)); // Request log
  
    const response = await fetch("https://api.monobank.ua/personal/checkout/order", {
      method: "POST",
      headers: {
        "X-Token": monoApiKey, // replace with your valid token
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  
    const resJson = await response.json();
  
    console.log('Monobank response:', JSON.stringify(resJson, null, 2)); // Response log
  
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
    console.error('Error in checkout function:', error); // Error log
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
}


//      callback_url: "https://webhook.site/a8e16df5-fff9-43d0-8485-051d854a47bd", - callback_url
// https://monocheckout-test.netlify.app/.netlify/functions/mono-callback