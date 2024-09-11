import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log(`${process.env.MONGODB_URL}/ImageData`)
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/ImageData`)
        console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection error ", JSON.stringify(error));
        process.exit(1)
    }
}

export default connectDB;
