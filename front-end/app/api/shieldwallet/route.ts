import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import MultisigWallet from "@/app/lib/models/MultisigWallet";
import MetaTx from "@/app/lib/models/MetaTx";
const ObjectId = require("mongodb").ObjectId;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return new NextResponse(
      JSON.stringify({ message: "Address is required" }),
      { status: 400 }
    );
  }
  try {
    await dbConnect();

    const multisigWallet = await MultisigWallet.find({
      // address always in lowercase
      "signers.address": address.toLowerCase(),
    });

    if (!multisigWallet) {
      return new NextResponse(
        JSON.stringify({ message: "No multisig wallet found" }),
        { status: 404 }
      );
    }
    return new NextResponse(
      JSON.stringify({ message: "Multisig wallet found", multisigWallet }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
// const MultisigWalletSchema = new Schema({
//   accountName: { type: String, required: true },
//   addressWallet: { type: String, required: true, unique: true },
//   selectedNetwork: { type: NetworkSchema, required: true },
//   signers: { type: [SignerSchema], required: true },
//   threshold: { type: Number, required: true },
//   creator: { type: String, required: true },
//   managementThreshold: { type: Number, required: true },
//   revocationThreshold: { type: Number, required: true },
//   proposer: { type: String, required: true },
//   timeLockDelay: { type: Number, required: true },
//   allowedTargets: { type: [String], required: true },
// });

export async function POST(req: Request) {
  const body = await req.json();
  const {
    accountName,
    addressWallet,
    selectedNetwork,
    signers,
    threshold,
    creator,
    managementThreshold,
    revocationThreshold,
    proposer,
    timeLockDelay,
    allowedTargets,
  } = body;

  if (
    !accountName ||
    !addressWallet ||
    !selectedNetwork ||
    !signers ||
    !threshold ||
    !creator ||
    !managementThreshold ||
    !revocationThreshold ||
    !proposer ||
    !timeLockDelay ||
    !allowedTargets
  ) {
    return new NextResponse(
      JSON.stringify({ message: "All fields are required" }),
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const newMultisigWallet = await new MultisigWallet({
      accountName: accountName,
      addressWallet: addressWallet.toLowerCase(),
      selectedNetwork: selectedNetwork,
      signers: signers,
      threshold: threshold,
      creator: creator,
      managementThreshold: managementThreshold,
      revocationThreshold: revocationThreshold,
      proposer: proposer,
      timeLockDelay: timeLockDelay,
      allowedTargets: allowedTargets,
    });

    await newMultisigWallet.save();

    if (!newMultisigWallet) {
      return new NextResponse(
        JSON.stringify({ message: "Failed to create multisig wallet" }),
        { status: 400 }
      );
    }
    return new NextResponse(
      JSON.stringify({
        message: "Multisig wallet created successfully",
        newMultisigWallet,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
