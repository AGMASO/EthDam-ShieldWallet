import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import MultisigWallet from "@/app/lib/models/MultisigWallet";
import MetaTx from "@/app/lib/models/MetaTx";
import { Types } from "mongoose";
const ObjectId = require("mongodb").ObjectId;
interface Params {
  addressWallet: string;
}
//!Metodo para encontrar todas las MetaTx de una shiedlWallet. NOTA: Pueden ser
//! Pending, Executed or Cancelled.
export async function GET(req: Request, { params }: { params: Params }) {
  const { addressWallet } = params;

  if (!addressWallet) {
    return new NextResponse(
      JSON.stringify({ message: "Address is required" }),
      {
        status: 400,
      }
    );
  }

  try {
    await dbConnect();
    const metaTxs = await MetaTx.find({
      addressWallet: addressWallet.toLowerCase(),
    });

    if (!metaTxs) {
      return new NextResponse(JSON.stringify({ message: "No metaTxs found" }), {
        status: 404,
      });
    }

    return new NextResponse(
      JSON.stringify({ message: "MetaTxs found", metaTxs }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { addressWallet } = params;
  if (!addressWallet) {
    return new NextResponse(
      JSON.stringify({ message: "Address is required" }),
      {
        status: 400,
      }
    );
  }

  const body = await req.json();
  const {
    executionId,
    mode,
    executionData,
    threshold,
    blockTimestamp,
    dataToSign,
    signatures,
    createdBy,
  } = body;

  //!daba error
  // if (
  //   !executionId ||
  //   !mode ||
  //   !executionData ||
  //   !threshold ||
  //   !blockTimestamp ||
  //   !dataToSign ||
  //   !signatures ||
  //   !createdBy
  // ) {
  //   return new NextResponse(
  //     JSON.stringify({ message: "All fields are required" }),
  //     {
  //       status: 400,
  //     }
  //   );
  // }

  try {
    await dbConnect();
    const getWallet = await MultisigWallet.findOne({
      addressWallet: addressWallet.toLowerCase(),
    });
    if (!getWallet || !Types.ObjectId.isValid(getWallet._id)) {
      return new NextResponse(
        JSON.stringify({ message: "Wallet not found or Id not correct" }),
        {
          status: 404,
        }
      );
    }

    // Check if createdBy is a valid signer
    const isValidCreator = getWallet.signers.some(
      (s: any) => s.address.toLowerCase() === createdBy.toLowerCase()
    );
    if (!isValidCreator) {
      return new NextResponse(
        JSON.stringify({ message: "Creator is not a valid signer" }),
        {
          status: 403,
        }
      );
    }

    const newMetaTx = await new MetaTx({
      executionId: executionId,
      mode: mode,
      executionData: executionData,
      threshold: threshold,
      blockTimestamp: blockTimestamp,
      multisigWallet: getWallet._id,
      addressWallet: addressWallet.toLowerCase(),
      dataToSign: dataToSign,
      signatures: signatures,
      createdBy: createdBy,
    });
    await newMetaTx.save();

    if (!newMetaTx) {
      return new NextResponse(
        JSON.stringify({ message: "Error creating metaTx" }),
        {
          status: 400,
        }
      );
    }

    //! no esta enviando el newMetaTx
    return new NextResponse(
      JSON.stringify({ message: "MetaTx created successfully", newMetaTx }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
