import { task } from "hardhat/config";
import { hexToString, toHex, parseAbiParameters } from "viem";

task("deploy-shield-factory").setAction(async (_args, hre) => {
  const factory = await hre.viem.deployContract("ShieldWalletFactory", []);
  const factoryAddr = await factory.address;

  console.log(`Factory address: ${factoryAddr}`);
  return factoryAddr;
});

task("deploy-default-callback-handler").setAction(async (_args, hre) => {
  const defaultCallbackHandler = await hre.viem.deployContract("DefaultCallbackHandler", []);
  const defaultCallbackHandlerAddr  = await defaultCallbackHandler.address;

  console.log(`Default Callback Handler address: ${defaultCallbackHandlerAddr}`);
  return defaultCallbackHandlerAddr;
});

task("deploy-shield-implementation").setAction(async (_args, hre) => {
  const shieldWalletImplementation = await hre.viem.deployContract("ShieldWallet", []);
  const shieldWalletImplementationAddr  = await shieldWalletImplementation.address;

  console.log(`Shield  Wallet Implementation: ${shieldWalletImplementationAddr}`);
  return shieldWalletImplementationAddr;
});



task("create-secret")
  .addParam("address", "contract address")
  .setAction(async (args, hre) => {
    const vigil = await hre.viem.getContractAt("Vigil", args.address);
    const tx = await vigil.write.createSecret([
      "ingredient",
      BigInt(3) /* seconds */,
      toHex("brussels sprouts"),
    ]);
    console.log("Storing a secret in", tx);
  });

task("check-secret")
  .addParam("address", "contract address")
  .setAction(async (args, hre) => {
    const vigil = await hre.viem.getContractAt("Vigil", args.address);

    try {
      console.log("Checking the secret");
      await vigil.read.revealSecret([BigInt(0)]);
      console.log("Uh oh. The secret was available!");
      process.exit(1);
    } catch (e: any) {
      console.log("failed to fetch secret:", e.message);
    }
    console.log("Waiting...");

    await new Promise((resolve) => setTimeout(resolve, 10_000));
    console.log("Checking the secret again");
    const secret = await vigil.read.revealSecret([BigInt(0)]); // Get the value.

    console.log("The secret ingredient is", hexToString(secret));
  });

task("full-vigil").setAction(async (_args, hre) => {
  await hre.run("compile");

  const address = await hre.run("deploy");

  await hre.run("create-secret", { address });
  await hre.run("check-secret", { address });
});
