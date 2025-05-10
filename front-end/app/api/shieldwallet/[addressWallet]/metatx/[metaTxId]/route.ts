import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import MetaTx from "@/app/lib/models/MetaTx";
import { Types } from "mongoose";
import MultisigWallet from "@/app/lib/models/MultisigWallet";

const ObjectId = require("mongodb").ObjectId;

interface Params {
  addressWallet: string;
  metaTxId: string;
}

// Add GET method to fetch specific MetaTx
export async function GET(req: Request, { params }: { params: Params }) {
  const { addressWallet, metaTxId } = params;

  if (!addressWallet || !metaTxId) {
    return new NextResponse(
      JSON.stringify({ message: "Address and metaTxId are required" }),
      {
        status: 400,
      }
    );
  }

  try {
    await dbConnect();

    // Find the MetaTx
    const metaTx = await MetaTx.findOne({
      addressWallet: addressWallet.toLowerCase(),
      _id: new ObjectId(metaTxId),
    });

    if (!metaTx) {
      return new NextResponse(JSON.stringify({ message: "MetaTx not found" }), {
        status: 404,
      });
    }

    return new NextResponse(
      JSON.stringify({ message: "MetaTx found", data: metaTx }),
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

//!Metodo para anadir mas Signature a una MEtaTx ya creada
export async function PATCH(req: Request, { params }: { params: Params }) {
  const { addressWallet, metaTxId } = params;
  if (!addressWallet || !metaTxId) {
    return new NextResponse(
      JSON.stringify({ message: "Address and metaTxId are required" }),
      {
        status: 400,
      }
    );
  }

  const body = await req.json();
  const { signature, signer } = body;

  if (!signature || !signer) {
    return new NextResponse(
      JSON.stringify({ message: "Signature is required" }),
      {
        status: 400,
      }
    );
  }

  try {
    await dbConnect();
    // Find the MetaTx
    const metaTx = await MetaTx.findOne({
      addressWallet: addressWallet.toLowerCase(),
      _id: new ObjectId(metaTxId),
    });
    if (!metaTx) {
      return new NextResponse(JSON.stringify({ message: "MetaTx not found" }), {
        status: 404,
      });
    }

    //! Find the MultisigWallet to check if signer is valid
    const wallet = await MultisigWallet.findOne({
      addressWallet: addressWallet.toLowerCase(),
    });
    if (!wallet) {
      return new NextResponse(JSON.stringify({ message: "Wallet not found" }), {
        status: 404,
      });
    }

    // Check if signer is valid
    const isValidSigner = wallet.signers.some(
      (s: any) => s.address.toLowerCase() === signer.toLowerCase()
    );
    if (!isValidSigner) {
      return new NextResponse(
        JSON.stringify({ message: "Signer not authorized" }),
        { status: 403 }
      );
    }

    // Check signer cant sign two times
    const isSigned = metaTx.signatures.some(
      (s: any) => s.signer.toLowerCase() === signer.toLowerCase()
    );
    if (isSigned) {
      return new NextResponse(
        JSON.stringify({ message: "Signer already signed" }),
        { status: 400 }
      );
    }

    // Add the signature
    const getMetaTx = await MetaTx.findOneAndUpdate(
      {
        addressWallet: addressWallet.toLowerCase(),
        _id: new ObjectId(metaTxId),
      },
      {
        $push: {
          signatures: {
            signature: signature,
            signer: signer,
          },
        },
      },
      { new: true }
    );

    if (!getMetaTx) {
      return new NextResponse(JSON.stringify({ message: "MetaTx not found" }), {
        status: 404,
      });
    }
    return new NextResponse(JSON.stringify(getMetaTx), { status: 200 });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
