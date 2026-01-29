exports.generateAccessToken = async () => {
  const clientID = process.env.PAYPAL_CLIENTID;
  const secret = process.env.PAYPAL_SECRET;

  const credentials = Buffer.from(`${clientID}:${secret}`).toString("base64");

  const response = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );

  const data = await response.json();

  return data.access_token;
};

exports.createProduct = async (productDetails, accessToken) => {
  const response = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/catalogs/products`,
    {
      method: "POST",
      body: JSON.stringify({
        name: productDetails.plan,
        description: productDetails.desc,
        type: "DIGITAL", // Add this or "DIGITAL" — required field!
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Paypal-Request-Id": "PRODUCT8789",
      },
    },
  );

  if (!response.ok) {
    console.log("Failed to create product", response.statusText);
    return;
  }

  const data = await response.json();

  return data;
};

exports.createPlan = async (productId, productDetails, accessToken) => {
  console.log("product detaisls", productDetails);
  const response = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/billing/plans`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Paypal-Request-Id": "PLAN8789",
      },
      body: JSON.stringify({
        product_id: productId,
        name: productDetails.plan,
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // 0 = infinite
            pricing_scheme: {
              fixed_price: {
                value: productDetails.price.toFixed(2),
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 1,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create plan", response.statusText);
  }

  const data = await response.json();

  return data;
};

exports.createSubscription = async (planId, accessToken) => {
  const response = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/billing/subscriptions`,
    {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          return_url: "pastortibipetersonline://paypal/subscription/approved",
          cancel_url: "pastortibipetersonline://paypal/subscription/cancel",
        },
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create subscription", response.statusText);
  }

  const data = await response.json();

  return data;
};
