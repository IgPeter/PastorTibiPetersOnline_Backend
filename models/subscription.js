const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    reference: { type: String, required: true, unique: true },
    plan: { type: String, required: true },
    desc: { type: String, required: true },
    subscriptionStatus: { type: String },
    amount: { type: Number },
    subscriber: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      payerId: String,
      paymentGateway: String,
    },
    subscriptionType: String,
    planId: String,
    startTime: Date,
    endTime: Date,
  },
  { timestamps: true },
);

subscriptionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

subscriptionSchema.set("toJSON", {
  virtuals: true,
});

exports.Subscription = mongoose.model("Subscription", subscriptionSchema);
