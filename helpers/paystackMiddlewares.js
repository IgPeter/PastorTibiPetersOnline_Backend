//creating the paystack plan
exports.createPaystackPlan = async (plan) => {
  let data;
  try {
    const response = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plan),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error:", errorData);
      return;
    }

    data = await response.json();
  } catch (error) {
    throw new Error("Something went wrong, Operation failed", error);
  }

  return data;
};

exports.initializeTransaction = async (tranData) => {
  let paymentData;
  const userId = tranData.userId;
  try {
    //Initialize payment transaction
    const paymentInit = await fetch(
      `https://api.paystack.co/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: tranData.email,
          amount: tranData.amount,
          plan: tranData.plan,
          callback_url:
            "https://7eccb1612367.ngrok-free.app/api/v1/paystack/subscription/callback",
          metadata: {
            type: "one_time_purchase",
            userId: userId,
          },
        }), //plan code gotten from paystack
      },
    );

    paymentData = await paymentInit.json();
  } catch (error) {
    console.log("Network or server error", error);
  }

  return paymentData;
};
