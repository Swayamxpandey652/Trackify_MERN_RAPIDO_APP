import mongoose from "mongoose";


export async function connectDB(uri) {
try {
await mongoose.connect(uri);
console.log("MongoDB connected");
} catch (error) {
console.error("MongoDB Error", error);
process.exit(1);
}
}