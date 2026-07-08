import mongoose from "mongoose";

const productFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    usagePurpose: [
      {
        type: String,
        enum: [
          "indicator_design",
          "theory_of_change",
          "logframe",
          "evaluation_methods",
          "data_collection",
          "reporting",
          "learning_research",
          "other"
        ]
      }
    ],

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    requestedFeature: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    allowContact: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const ProductFeedback = mongoose.model(
  "ProductFeedback",
  productFeedbackSchema
);

export default ProductFeedback;