export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
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
    // Parse the body and get result regardless of wrapper
    const parsedBody = JSON.parse(event.body);
    const result = parsedBody.result ?? parsedBody;

    const forwardToMake = async () => {
      try {
        await fetch("https://hook.eu2.make.com/kg3nxgp752fmmuymayempe8tk4jv454r", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ result })
        });
        console.log("✅ Дані відправлено у Make Webhook");
      } catch (makeErr) {
        console.error("❌ Помилка при відправці у Make Webhook:", makeErr);
      }
    };

    if (!result) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing result" })
      };
    }

    // Log the entire result to make sure we parse it correctly
    console.log("🧾 Отримано повний result:\n", JSON.stringify(result, null, 2));

    if (result?.payment_status?.toLowerCase() !== "success") {
      console.log("⏭️ Пропускаємо емейл: payment_status =", result?.payment_status);
      await forwardToMake();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Payment not successful, email skipped" })
      };
    }

    // Check for presence of email
    if (!result.mainClientInfo?.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing email" })
      };
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = "hello@htotse.com";

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
      <img
        src="https://monocheckout-test.netlify.app/assets/htotse-logo.png"
        alt="Hto tse logo"
        style="width:100px;  margin: 0 auto; display:block;"
      />
      <h2>Привіт!</h2>
      <h3>Класний вибір! Твій номер замовлення #${result.basket_id}</h3>
      <p><strong>Отримувач:</strong> ${result.mainClientInfo.first_name} ${result.mainClientInfo.last_name}</p>
      <p><strong>Дата і час:</strong> ${result.dateCreate}</p>
      <p><strong>Спосіб оплати:</strong> ${result.payment_method_desc}</p>
      <p><strong>Статус оплати:</strong> ${result.payment_status}</p>
      <h3>Товари:</h3>
      <ul>${productsHtml}</ul>
      <p><strong>Сума:</strong> ${result.amount} грн</p>
      <p><strong>Спосіб та адреса доставки:</strong><br>${result.delivery_branch_address}<br>${result.deliveryAddressInfo.cityName}, ${result.deliveryAddressInfo.areaName}</p>
      <hr/>
      <p>
        Якщо з замовленням все гаразд — відправимо його протягом 3 робочих днів. 
        Очікуй сповіщення від компанії-перевізника. 
        Якщо в нас виникнуть питання, ми зателефонуємо для уточнень.
      </p>
      <p>Передзамовлення відправимо щойно книга вийде з друку (орієнтовна дата вказана на сторінці книги). Ми дуже вдячні за таку підтримку і готовність зачекати.</p>
      <p>
        Якщо залишилися питання — напиши нам на пошту 
        <a href="mailto:hello@htotse.com" style="color:#1a73e8; text-decoration:none;">
          hello@htotse.com
        </a>
        або в директ в 
        <a href="https://www.instagram.com/podyvymos_htotse" 
          target="_blank" 
          style="color:#1a73e8; text-decoration:none;">
          Інстаграм</a>.
      </p>
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
          name: "Хто це?",
          email: brevoSenderEmail
        },
        to: [
          {
            email: result.mainClientInfo.email,
            name: `${result.mainClientInfo.first_name} ${result.mainClientInfo.last_name}`
          }
        ],
        subject: `Хто це замовив нові книжки? Твоє замовлення #${result.basket_id}`,
        htmlContent: html
      })
    });

    const resJson = await response.json();
    console.log("📬 Brevo response:", resJson);

    await forwardToMake();

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
