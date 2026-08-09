require("dotenv").config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.ATLASDB_URL;

const initDB = async () => {
    await Listing.deleteMany({});

    const listingsWithOwner = initData.data.map((obj) => ({
        ...obj,
        owner: new mongoose.Types.ObjectId("6a7843c2308929f22e3f37e3"),
    }));

    await Listing.insertMany(listingsWithOwner);
    // console.log("Total listings:", await Listing.countDocuments());
    // console.log("Database:", mongoose.connection.name);
    // console.log("Host:", mongoose.connection.host);

    console.log("data was initialized");
};

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("connected to db");

    await initDB();   

    mongoose.connection.close(); 
}

main();
