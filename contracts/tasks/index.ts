import { task } from "hardhat/config";
import { hexToString, toHex, parseAbiParameters } from "viem";


task("test").setAction(async (_args, hre) => {
  console.log(
    parseAbiParameters(
      "(address target, uint256 value, bytes callData)[]"
    )
  );
});

task("deploy").setAction(async (_args, hre) => {
  const vigil = await hre.viem.deployContract("Vigil", []);
  const vigilAddr = await vigil.address;

  console.log(`Vigil address: ${vigilAddr}`);
  return vigilAddr;
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
