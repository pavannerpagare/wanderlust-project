const express = require("express");

const {
    renderBookingForm,
    createBooking,
    showBooking, 
    showMyBookings,
    cancelBooking
} = require("../controllers/booking");

const { isLoggedIN } = require("../middleware");

const router = express.Router();


router.get(
    "/listings/:listingId/new",
    isLoggedIN,
    renderBookingForm
);


router.post(
    "/listings/:listingId",
    isLoggedIN,
    createBooking
);

router.get(
    "/my", 
    isLoggedIN, 
    showMyBookings

);


router.get(
    "/:bookingId",
    isLoggedIN,
    showBooking
);

router.post(
    "/:bookingId/cancel",
    isLoggedIN,
    cancelBooking
);

module.exports = router;