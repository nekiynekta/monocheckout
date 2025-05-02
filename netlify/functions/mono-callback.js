export async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  console.log("✅ CALLBACK TRIGGERED");

  try {
    const { result } = JSON.parse(event.body);
    console.log("➡️ Отримано результат:", result);

    if (!result || !result.mainClientInfo?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing result or email" })
      };
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = "ndrew.frolov@gmail.com"; // 🔁 заміни на свій верифікований email у Brevo

    if (!brevoApiKey) {
      console.warn("❗ BREVO_API_KEY is missing in environment variables");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Email service not configured (missing API key)" })
      };
    }

    const productsHtml = result.products.map(p =>
      `<li>${p.name} — ${p.cnt} шт. — ${p.price} грн</li>`
    ).join('');

    const html = `
      <h2>Дякуємо за замовлення №${result.orderId}</h2>
      <p><strong>Клієнт:</strong> ${result.mainClientInfo.first_name} ${result.mainClientInfo.last_name}</p>
      <p><strong>Дата:</strong> ${result.dateCreate}</p>
      <p><strong>Спосіб оплати:</strong> ${result.payment_method_desc}</p>
      <p><strong>Статус:</strong> ${result.payment_status}</p>
      <h3>Товари:</h3>
      <ul>${productsHtml}</ul>
      <p><strong>Сума:</strong> ${result.amount} грн</p>
      <p><strong>Адреса доставки:</strong><br>${result.delivery_branch_address}<br>${result.deliveryAddressInfo.cityName}, ${result.deliveryAddressInfo.areaName}</p>
      <hr/>
      <p style="font-size: 12px; color: #888;">Цей лист згенеровано автоматично.</p>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Bookshop",
          email: brevoSenderEmail
        },
        to: [
          {
            email: result.mainClientInfo.email,
            name: `${result.mainClientInfo.first_name} ${result.mainClientInfo.last_name}`
          }
        ],
        subject: `Ваше замовлення №${result.orderId}`,
        htmlContent: html
      })
    });

    const resJson = await response.json();
    console.log("📬 Brevo response:", resJson);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: "Failed to send email", details: resJson })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Email sent successfully",
        messageId: resJson.messageId || null
      })
    };

  } catch (error) {
    console.error("❌ Error in mono-callback:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Unexpected error" })
    };
  }
}
