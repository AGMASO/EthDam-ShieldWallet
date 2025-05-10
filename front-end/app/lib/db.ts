import mongoose from "mongoose";

const connection = mongoose.connection.readyState;

const dbConnect = async () => {
  if (connection === 1) {
    console.log("Already connected to the database");
  }
  if (connection === 2) {
    console.log("Connecting to the database");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      dbName: "EthDamHackathon",
      bufferCommands: true,
    });

    console.log("Connected to the database");
  } catch (error: any) {
    console.log("Error connecting to the database");
    console.log(error);
  }
};

export default dbConnect;
