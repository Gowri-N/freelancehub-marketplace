const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same client from saving
// the same freelancer more than once
favouriteSchema.index(
  {
    clientId: 1,
    freelancerId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Favourite",
  favouriteSchema
);