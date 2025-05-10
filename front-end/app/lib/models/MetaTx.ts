import { Schema, model, models } from "mongoose";

const SignatureSchema = new Schema(
  {
    signer: { type: String, required: true }, // dirección del signer
    signature: { type: String, required: true }, // firma EIP-712
  },
  { _id: false }
);

const MetaTxSchema = new Schema(
  {
    executionId: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      required: true,
    },
    executionData: {
      type: String,
      required: true,
    },
    threshold: {
      type: String,
      required: true,
    },
    blockTimestamp: {
      type: Number,
      required: true,
    },
    multisigWallet: {
      type: Schema.Types.ObjectId,
      ref: "MultisigWallet",
      required: true,
    },
    addressWallet: {
      type: String,
      required: true,
    },
    dataToSign: {
      type: Object,
      required: true,
    },
    signatures: {
      type: [SignatureSchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: true, // dirección del que inició la meta-tx
    },
    status: {
      type: String,
      enum: ["pending", "executed", "cancelled"],
      default: "pending",
    },
    executedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
const MetaTx = models.MetaTx || model("MetaTx", MetaTxSchema);

export default MetaTx;
