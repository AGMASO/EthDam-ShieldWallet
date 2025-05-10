import MultisigWallet from "@/app/lib/models/MultisigWallet";
import dbConnect from "@/app/lib/db";
import MetaTx from "@/app/lib/models/MetaTx";
const ObjectId = require("mongodb").ObjectId;
import { NextResponse } from "next/server";

interface Params {
  addressWallet: string;
}
export async function GET(req: Request, { params }: { params: Params }) {
  const { addressWallet } = params;

  if (!addressWallet) {
    return new NextResponse(JSON.stringify({ message: "No walletId found" }), {
      status: 400,
    });
  }

  try {
    await dbConnect();

    const walletWithDetails = await MultisigWallet.findOne({
      addressWallet: addressWallet,
    });

    if (!walletWithDetails) {
      return new NextResponse(
        JSON.stringify({
          message: "No details found for that Wallet address",
        }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "Successfully found details of Wallet",
        walletWithDetails,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching wallet details:", error);
    return new NextResponse(
      JSON.stringify({ message: "Failed to fetch wallet details" }),
      { status: 500 }
    );
  }
}
