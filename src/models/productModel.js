import mongoose from "mongoose";
const ProductSchema = new mongoose.Schema({
    serialNumber: String,
    requestId: String,
    productName: String,
    inputImageUrls: [String],
    outputImageUrls: [String],
    status: { type: String, default: 'pending' },
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;