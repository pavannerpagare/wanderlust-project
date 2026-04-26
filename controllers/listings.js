const Listing = require("../models/listing");
const opencage = require("opencage-api-client");
const axios = require("axios");


module.exports.index = async (req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});

};

module.exports.renderNewForm = (req, res) => {
    console.log(req.user);
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: { path: "author" }
        });
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};


module.exports.createListing = async (req, res) => {

    const geoData = await opencage.geocode({
        q: req.body.listing.location,
        key: process.env.GEOCODING_API_KEY,
    });

    const newListing = new Listing(req.body.listing);

    // ✅ REAL coordinates from API
    newListing.geometry = {
        type: "Point",
        coordinates: [
            geoData.results[0].geometry.lng,
            geoData.results[0].geometry.lat
        ],
    };

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    newListing.owner = req.user._id;
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};


module.exports.renderEditForm = async(req,res) => {
        let {id} = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
        }
        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/uploads", "/uploads/h_300,w_250");
        res.render("listings/edit.ejs", {listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    
    // ⭐ Geocode AGAIN if location changed
    const geoData = await opencage.geocode({
        q: req.body.listing.location,
        key: process.env.GEOCODING_API_KEY,
    });

    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true, runValidators: true }
    );

    if (typeof req.file !== "undefined") {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    return res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res) => {
        let {id} = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        req.flash("success", "Listing Deleted!");
        return res.redirect("/listings");

};


