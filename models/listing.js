const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: String,

    image: {
    url: {
        type: String,
        default: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=60"
    },
    filename: {
        type: String,
        default: "defaultimage"
    },
    bookingLockVersion: {
    type: Number,
    default: 0
    },
    
},

    price: Number,
    location: String,
    country: String,

    // ⭐ PERMANENT FIX
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },

    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }],

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

listingSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Listing", listingSchema);