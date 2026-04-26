const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js"); 
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const {isLoggedIN, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage }); 


//New route
router.get(
    "/new",
    isLoggedIN,
    listingController.renderNewForm
);

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIN,
        validateListing, 
        upload.single("listing[image]"),                  
        wrapAsync(listingController.createListing)
    );



router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIN,
        isOwner,
        validateListing,
        upload.single("listing[image]"),
        wrapAsync(listingController.updateListing))
    .delete(
        isLoggedIN, 
        isOwner,
        wrapAsync(listingController.destroyListing)
    );



//Edit route
router.get(
    "/:id/edit", 
    isLoggedIN, 
    isOwner,
    wrapAsync(listingController.renderEditForm)
);
    

module.exports = router; 