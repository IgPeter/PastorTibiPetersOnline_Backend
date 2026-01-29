const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isSubscriber: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  country: { type: String, required: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  phone: Number,
  avatar: String,
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

exports.User = mongoose.model("User", userSchema);
