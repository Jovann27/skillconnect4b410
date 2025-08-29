import mongoose from "mongoose";

export const dbConnection = async () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName: "skillconnect",
    })
    .then(() => {
        console.log("Database connected successfully");
    })
    .catch((err) => {
        console.log(`Database connection failed:, ${err}`);
    });
};
