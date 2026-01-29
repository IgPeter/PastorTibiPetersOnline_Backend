const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Subscription } = require("../models/subscription");
const { User } = require("../models/user");
const {
  generateAccessToken,
  createPlan,
  createProduct,
  createSubscription,
} = require("../helpers/paypalMiddlewares");
const {
  createPaystackPlan,
  initializeTransaction,
} = require("../helpers/paystackMiddlewares");
const e = require("express");

const subscriptionData = {
  plan: "",
  desc: "",
};

router.get(`/`, async (req, res) => {
  try {
    const subscriptions = await Subscription.find();

    if (!subscriptions) {
      res.status(404).json("Subscriptions were not found");
    }

    const response = {
      count: subscriptions.length,
      subscription: subscriptions.map((eachSubscription) => {
        return {
          _id: eachSubscription.id,
          plan: eachSubscription.plan,
          desc: eachSubscription.desc,
          price: eachSubscription.price,
          request: {
            type: "GET",
            Url: "localhost:3000/api/v1/subscription",
          },
        };
      }),
    };
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
  }
});

router.get(`/status/:userId`, async (req, res) => {
  const user = await Subscription.findById(req.params.userId);

  if (!user) {
    res.status(500).json({ message: "The user was not found" });
  }

  if (!user.isSubscriber) {
    return res
      .status(200)
      .json({ message: "User not a subscriber", active: false });
  }

  res.status(200).json({ message: "User is a subscriber", active: true });
});

//updating category
router.put(`/:id`, async (req, res) => {
  await Subscription.findByIdAndUpdate(
    req.params.id,
    {
      plan: req.body.plan,
      desc: req.body.desc,
      price: req.body.price,
    },

    { new: true },
  )
    .then((subscription) => {
      res.status(200).json(subscription);
    })
    .catch((err) => {
      res.status(500).json({
        message: "Couldn't update subscription data",
        error: err,
      });
    });
});

//deleting message information
router.delete(`/:id`, async (req, res) => {
  const id = req.params.id;
  Subscription.findByIdAndRemove(id)
    .then((subscription) => {
      if (subscription) {
        res.status(200).json({
          message: "susbscription deleted successfully",
          result: subscription,
          request: {
            type: "DELETE",
            url: "http://localhost:3000/subscription/" + id,
          },
        });
      } else {
        res
          .status(404)
          .json({ success: false, message: "subscription not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

//Paystack recurring order creatio starts here

router.post("/create-paystack-recurring-order", async (req, res) => {
  const plan = req.body.plan;
  const tranData = req.body.tranData;

  console.log("Plan Data:", plan);
  console.log("Transaction Data:", tranData);

  const planCode = await createPaystackPlan(plan);

  tranData.plan = planCode.data.plan_code;

  const transaction = await initializeTransaction(tranData);

  return res.status(201).json({ transaction: transaction });
});

//creating paystack order for one time payment
router.post("/create-paystack-onetime-order", async (req, res) => {
  try {
    const { email, userId, amount } = req.body;

    if (!email || !userId || !amount) {
      return res.status(400).json({ message: "Email and amount are required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isSubscriber) {
      console.log("User is already a subscriber");
      return res.status(400).json({ message: "User is already a subscriber" });
    }

    //api call to paystack to create order
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          amount: amount, // Paystack expects amount in kobo
          currency: "NGN",
          callback_url:
            "https://7eccb1612367.ngrok-free.app/api/v1/paystack/callback",
          metadata: {
            type: "one_time_purchase",
            userId: userId,
          },
        }),
      },
    );

    const data = await paystackRes.json();

    if (!data.status) {
      return res
        .status(400)
        .json({ message: "Paystack init failed", error: data });
    }

    return res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack create order error:", error);
    res.status(500).json({ message: "Failed to create Paystack order", error });
  }
});

//Verifying one time payment with paystack
router.post("/verify-paystack-payment", async (req, res) => {
  const { reference } = req.body;

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const data = await response.json();

  if (!data.status || data.data.status !== "success") {
    return res.status(400).json({
      success: false,
      message: "Payment not successful",
    });
  }

  if (data.data.amount > 0) {
    const existing = await Subscription.findOne({ reference });

    if (existing) {
      return res.json({
        success: true,
        message: "You already made payment for this reference",
      });
    }

    if (data.data.amount / 100 == 1000) {
      subscriptionData.plan = "Basic Plan";
      subscriptionData.desc = "Basic Subscription Plan for 1 month";
    } else if (data.data.amount / 100 == 2000) {
      subscriptionData.plan = "Standard Plan";
      subscriptionData.desc = "Standard Subscription Plan for 1 month";
    } else if (data.data.amount / 100 == 3000) {
      subscriptionData.plan = "Premium Plan";
      subscriptionData.desc = "Premium Subscription Plan for 1 month";
    }

    const paystackData = data.data;
    console.log("Paystack Data:", paystackData);
    const userId = paystackData.metadata?.userId; // pass this during init!

    if (!userId) {
      return res.status(400).json({ message: "No user attached to payment" });
    }

    const subscriptionDate = new Date(paystackData.paid_at);
    const subscriptionEndDate = new Date(subscriptionDate);
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // assuming 1 month subscription

    console.log("Subsription Data", subscriptionData);

    const subscription = new Subscription({
      _id: new mongoose.Types.ObjectId(),
      reference: reference,
      plan: subscriptionData.plan,
      desc: subscriptionData.desc,
      subscriptionStatus: "active",
      amount: paystackData.amount / 100, // converting kobo to naira
      subscriber: {
        id: userId,
        payerId: paystackData.id,
        paymentGateway: "PAYSTACK",
      },
      subscriptionType: "one_time",
      startTime: new Date(paystackData.paid_at),
      endTime: subscriptionEndDate,
    });

    // Save subscription to DB
    try {
      const result = await subscription.save();

      const user = await User.findById(userId);

      //crediting the user as subscriber
      if (user) {
        user.isSubscriber = true;
        user.subscription = result._id;
        await user.save();
      }

      res.status(201).json({
        success: true,
        message: "Payment verified and subscription created successfully",
        result: result,
      });
    } catch (err) {
      res.status(500).json({
        message: "Couldn't save subscription data",
        error: err,
      });
    }
  }
});

//verifying recurring subscription payment with paystack
router.post("/verify-paystack-recurring-subscription", async (req, res) => {
  const { reference } = req.body;

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const data = await response.json();

  console.log("Paystack Recurring Subscription Verification Data:", data);
  if (!data.status || data.data.status !== "success") {
    return res.status(400).json({
      success: false,
      message: "Payment not successful",
    });
  }

  // Further processing for recurring subscription can be done here
  if (data.data.amount > 0) {
    const existing = await Subscription.findOne({ reference });

    if (existing) {
      return res.json({
        success: true,
        message: "You already made payment for this reference",
      });
    }

    if (data.data.amount / 100 == 1000) {
      subscriptionData.plan = "Basic Plan";
      subscriptionData.desc = "Basic Subscription Plan for 1 month recurring";
    } else if (data.data.amount / 100 == 2000) {
      subscriptionData.plan = "Standard Plan";
      subscriptionData.desc =
        "Standard Subscription Plan for 1 month recurring";
    } else if (data.data.amount / 100 == 3000) {
      subscriptionData.plan = "Premium Plan";
      subscriptionData.desc = "Premium Subscription Plan for 1 month recurring";
    }

    const paystackData = data.data;

    const userId = paystackData.metadata?.userId; // pass this during init!

    if (!userId) {
      return res.status(400).json({ message: "No user attached to payment" });
    }

    const subscriptionDate = new Date(paystackData.paid_at);
    const subscriptionEndDate = new Date(subscriptionDate);
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // assuming 1 year subscription

    const subscription = new Subscription({
      _id: new mongoose.Types.ObjectId(),
      reference: reference,
      plan: subscriptionData.plan,
      desc: subscriptionData.desc,
      subscriptionStatus: "active",
      amount: paystackData.amount / 100, // converting kobo to naira
      subscriber: {
        id: userId,
        payerId: paystackData.id,
        paymentGateway: "PAYSTACK",
      },
      subscriptionType: "recurring",
      startTime: new Date(paystackData.paid_at),
      endTime: subscriptionEndDate,
    });

    // Save subscription to DB
    try {
      const result = await subscription.save();

      const user = await User.findById(userId);

      //crediting the user as subscriber
      if (user) {
        user.isSubscriber = true;
        user.subscription = result._id;
        await user.save();
      }

      res.status(201).json({
        success: true,
        message: "Payment verified and subscription created successfully",
        result: result,
      });
    } catch (err) {
      res.status(500).json({
        message: "Couldn't save subscription data",
        error: err,
      });
    }
  }
});
//Paystack orders ended here

/**
  Paypal routes start here
*/

//creating paypal order for one time payment
router.post("/create-paypal-onetime-order", async (req, res) => {
  const accessToken = await generateAccessToken();
  const { price } = req.body;

  try {
    const response = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // ✅ Required
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // ✅ Must be stringified
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: price.toString(),
              },
            },
          ],
        }),
      },
    );

    const data = await response.json();

    res.json({
      message: "Order created successfully",
      data,
    });
  } catch (error) {
    console.error("PayPal create order error:", error);
    res.status(500).json({ message: "Failed to create order", error });
  }
});

//creating paypal recurring order
router.post("/create-paypal-recurring-order", async (req, res) => {
  const { subscriptionPlan, userId } = req.body;

  const accessToken = await generateAccessToken();

  const product = await createProduct(subscriptionPlan, accessToken);
  const plan = await createPlan(product.id, subscriptionPlan, accessToken);

  const subscription = await createSubscription(plan.id, accessToken);

  if (subscription.status == "APPROVAL_PENDING") {
    return res.status(201).json({
      message: "subscription created successfully",
      subscriptionDetails: subscription,
    });
  }

  throw new Error(
    `${subscription.name}` |
      `${subscription.message}` |
      "Failed to create subscription",
  );
});

//verifying recurring subscription payment with paypal
router.post("/verify-paypal-subscription", async (req, res) => {
  const subscriptionId = req.body.subscriptionId;
  const userId = req.body.userId;
  const accessToken = await generateAccessToken();

  const response = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  console.log("PayPal Subscription Verification Data:", data);

  if (data.status != "ACTIVE") {
    return res.status(400).json({
      success: false,
      message: "Subscription not successful",
    });
  }

  console.log("Billing Info:", data.billing_info.last_payment.amount.value);

  if (data.billing_info.last_payment.amount.value == 2000.0) {
    subscriptionData.plan = "Basic Plan";
    subscriptionData.desc = "Basic Subscription Plan for 1 month recurring";
  } else if (data.billing_info.last_payment.amount.value == 50.0) {
    subscriptionData.plan = "Standard Plan";
    subscriptionData.desc = "Standard Subscription Plan for 1 month recurring";
  } else if (data.billing_info.last_payment.amount.value == 100.0) {
    subscriptionData.plan = "Premium Plan";
    subscriptionData.desc = "Premium Subscription Plan for 1 month recurring";
  }

  const subscription = new Subscription({
    _id: new mongoose.Types.ObjectId(),
    reference: subscriptionId,
    plan: subscriptionData.plan,
    desc: subscriptionData.desc,
    subscriptionStatus: data.status,
    amount: data.billing_info.last_payment.amount.value,
    subscriber: {
      id: userId,
      payerId: data.subscriber.payer_id,
      paymentGateway: "PAYPAL",
    },
    subscriptionType: "recurring",
    planId: data.plan_id,
    startTime: new Date(data.start_time),
    endTime: new Date(data.billing_info.next_billing_time),
  });

  try {
    const result = await subscription.save();
    console.log("Saved Subscription:", result);

    const user = await User.findById(userId);
    console.log("Subscriber User:", user);
    //crediting the user as subscriber
    if (user) {
      user.isSubscriber = true;
      user.subscription = result._id;
      await user.save();
    }

    res
      .status(201)
      .json({ message: "subscription verified successfully", result: result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "couldn't save subscription data", error: err });
  }
});

//Getting subscription billers public keys
router.get(`/biller/paystack`, (req, res) => {
  const paystackPublicKeys = process.env.PAYSTACK_PUBLIC_KEY;
  const paystackSecretKeys = process.env.PAYSTACK_SECRET_KEY;

  res.json({
    paystackPublicKey: paystackPublicKeys,
    paystackSecretKeys: paystackSecretKeys,
  });
});

module.exports = router;
