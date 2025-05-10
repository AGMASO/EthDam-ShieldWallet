import { Schema, model, models } from "mongoose";

const NetworkSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "" },
  },
  { _id: false }
);

const SignerSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    address: { type: String, required: true },
  },
  { _id: false }
);

const MultisigWalletSchema = new Schema({
  accountName: { type: String, required: true },
  addressWallet: { type: String, required: true, unique: true },
  selectedNetwork: { type: NetworkSchema, required: true },
  signers: { type: [SignerSchema], required: true },
  threshold: { type: Number, required: true },
  creator: { type: String, required: true },
  managementThreshold: { type: Number, required: true },
  revocationThreshold: { type: Number, required: true },
  proposer: { type: String, required: true },
  timeLockDelay: { type: Number, required: true },
  allowedTargets: { type: [String], required: true },
});

const MultisigWallet =
  models.MultisigWallet || model("MultisigWallet", MultisigWalletSchema);

export default MultisigWallet;
