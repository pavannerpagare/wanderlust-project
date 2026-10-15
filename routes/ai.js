const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Joi = require("joi");

const { understandSearchQuery } = require("../services/aiService.js");

const aiSearchSchema = Joi.object({
    location: Joi.string().allow(null),
    country: Joi.string().allow(null),
    maxPrice: Joi.number().min(0).allow(null),
    minRating: Joi.number().min(1).max(5).allow(null),
    
    sortBy: Joi.string()
        .valid("price_asc", "price_desc", "rating_desc")
        .allow(null)
});

router.get("/search", wrapAsync(async (req, res) => {

    const userQuery = req.query.q;

    if (!userQuery) {
        return res.redirect("/listings");
    }

    // 1. Understand user's request using AI
    const searchParams = await understandSearchQuery(userQuery);

    const { error } = aiSearchSchema.validate(searchParams);

    if (error) {
        console.error("Invalid AI Search Parameters:", error.message);
        return res.status(400).send("Invalid AI search request.");
    }

    console.log("AI Search Parameters:", searchParams);

    // 2. Build basic MongoDB filter
    const filter = {};

    if (searchParams.location) {
        filter.location = {
            $regex: searchParams.location,
            $options: "i"
        };
    }

    if (searchParams.country) {
        filter.country = {
            $regex: searchParams.country,
            $options: "i"
        };
    }

    if (searchParams.maxPrice !== null) {
        filter.price = {
            $lte: searchParams.maxPrice
        };
    }

    // 3. Find listings
    let allListings = await Listing.find(filter);

// 4. Calculate ratings for listings
    const listingsWithRatings = [];

    for (let listing of allListings) {

        const reviews = await Review.find({
            _id: { $in: listing.reviews }
        });

        let averageRating = 0;

        if (reviews.length > 0) {
            const totalRating = reviews.reduce(
                (sum, review) => sum + review.rating,
                0
            );

            averageRating = totalRating / reviews.length;
        }

    // Keep the calculated rating temporarily
        listingsWithRatings.push({
            listing,
            averageRating
        });
    }

    // 5. Filter by minimum rating
    if (searchParams.minRating !== null) {

        const filteredListings = listingsWithRatings.filter(
            item => item.averageRating >= searchParams.minRating
        );

        listingsWithRatings.length = 0;
        listingsWithRatings.push(...filteredListings);
    }

    // 6. Sort results
    if (searchParams.sortBy === "price_asc") {

        listingsWithRatings.sort(
            (a, b) => a.listing.price - b.listing.price
        );

    }

    else if (searchParams.sortBy === "price_desc") {

        listingsWithRatings.sort(
            (a, b) => b.listing.price - a.listing.price
        );

    }

    else if (searchParams.sortBy === "rating_desc") {

        listingsWithRatings.sort(
            (a, b) => b.averageRating - a.averageRating
        );
    }

    // 7. Convert back to normal listing array
    allListings = listingsWithRatings.map(
        item => item.listing
    );

    console.log("MongoDB Filter:", filter);
    console.log("Sort By:", searchParams.sortBy);
    console.log("Listings Found:", allListings.length);

    res.render("listings/index.ejs", {
        allListings,
        searchParams,
        searchQuery: userQuery
    });
    
}));

module.exports = router;