const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js"); 
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const { validateReview, isLoggedIN, isReviewAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

// Post Review Route
router.post("/", isLoggedIN, validateReview, wrapAsync(reviewController.createReview));

// post delete route
router.delete("/:reviewId", isLoggedIN, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;  