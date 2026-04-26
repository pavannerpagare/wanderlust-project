const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const initDB = async () => {
    await Listing.deleteMany({});

    const listingsWithOwner = initData.data.map((obj) => ({
        ...obj,
        owner: new mongoose.Types.ObjectId("6991a966437cf709b14a7a9b"),
    }));

    await Listing.insertMany(listingsWithOwner);

    console.log("data was initialized");
};

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("connected to db");

    await initDB();   

    mongoose.connection.close(); 
}

main();
