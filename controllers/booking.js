
const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Booking = require("../models/booking");

exports.renderBookingForm = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.listingId);

        if (!listing) {
            return res.status(404).send("Listing not found");
        }

        res.render("bookings/new.ejs", {
            listing,
            error: null,
        });
    } catch (err) {
        next(err);
    }
};

exports.createBooking = async (req, res, next) => {
    try {
        const {
            checkIn: rawIn,
            checkOut: rawOut,
            guests: rawGuests,
        } = req.body;

        const listing = await Listing.findById(req.params.listingId);

        if (!listing) {
            return res.status(404).send("Listing not found");
        }

        // Validate date format and actual calendar dates.
        const isValidDate = (value) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
                return false;
            }

            const date = new Date(`${value}T00:00:00.000Z`);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        };

        const now = new Date();

        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-");

        const guests = Number(rawGuests);

        if (
            !isValidDate(rawIn) ||
            !isValidDate(rawOut) ||
            rawIn < today ||
            rawOut <= rawIn ||
            !Number.isInteger(guests) ||
            guests < 1
        ) {
            return res.status(400).render("bookings/new.ejs", {
                listing,
                error: "Please enter valid dates and guest details.",
            });
        }

        const checkIn = new Date(`${rawIn}T00:00:00.000Z`);
        const checkOut = new Date(`${rawOut}T00:00:00.000Z`);

        const nights = Math.round(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
        );

        // Calculate the price on the server.
        const pricePerNight = Number(listing.price);

        if (
            !Number.isFinite(pricePerNight) ||
            pricePerNight < 0
        ) {
            return res.status(400).send("Invalid property price");
        }

        const totalPrice = nights * pricePerNight;

        // Start a transaction for concurrency-safe booking creation.
        const session = await mongoose.startSession();

        let booking;

        try {
            await session.withTransaction(async () => {
                // The callback can be retried, so reset this variable.
                booking = undefined;

                // Write to the shared listing document.
                // Competing transactions for this listing must coordinate.
                const lockedListing = await Listing.findByIdAndUpdate(
                    listing._id,
                    { $inc: { bookingLockVersion: 1 } },
                    { new: true, session }
                );

                if (!lockedListing) {
                    const err = new Error("Listing not found");
                    err.code = "LISTING_NOT_FOUND";
                    throw err;
                }

                // Check availability inside the transaction.
                const conflictingBooking = await Booking.findOne({
                    listing: listing._id,
                    status: "confirmed",
                    checkIn: { $lt: checkOut },
                    checkOut: { $gt: checkIn },
                }).session(session);

                if (conflictingBooking) {
                    const err = new Error("Booking dates unavailable");
                    err.code = "BOOKING_CONFLICT";
                    throw err;
                }

                // Save the booking in the same transaction.
                booking = new Booking({
                    listing: listing._id,
                    user: req.user._id,
                    checkIn,
                    checkOut,
                    guests,
                    totalPrice,
                    status: "confirmed",
                });

                await booking.save({ session });
            });
        } catch (err) {
            if (err.code === "BOOKING_CONFLICT") {
                return res.status(409).render("bookings/new.ejs", {
                    listing,
                    error: "This property is unavailable for those dates.",
                });
            }

            if (err.code === "LISTING_NOT_FOUND") {
                return res.status(404).send("Listing not found");
            }

            throw err;
        } finally {
            await session.endSession();
        }

        if (!booking) {
            throw new Error("Booking was not created");
        }

        return res.redirect(`/bookings/${booking._id}`);
    } catch (err) {
        next(err);
    }
};

exports.showBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate("listing");

        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        if (!booking.user.equals(req.user._id)) {
            return res.status(403).send("Access denied");
        }

        res.render("bookings/show.ejs", { booking });
    } catch (err) {
        next(err);
    }
};

exports.showMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({
            user: req.user._id,
        })
            .populate("listing")
            .sort({ createdAt: -1 });

        res.render("bookings/index.ejs", { bookings });
    } catch (err) {
        next(err);
    }
};



exports.cancelBooking = async (req, res, next) => {
    const session = await mongoose.startSession();
    let outcome;

    try {
        await session.withTransaction(async () => {
            outcome = null;

            const existingBooking = await Booking.findById(
                req.params.bookingId
            ).session(session);

            if (!existingBooking) {
                outcome = "notFound";
                return;
            }

            // Only the booking owner can cancel it.
            if (!existingBooking.user.equals(req.user._id)) {
                outcome = "forbidden";
                return;
            }

            if (existingBooking.status !== "confirmed") {
                outcome = "notConfirmed";
                return;
            }

            // Use the same listing lock as booking creation.
            const lockedListing = await Listing.findByIdAndUpdate(
                existingBooking.listing,
                { $inc: { bookingLockVersion: 1 } },
                { new: true, session }
            );

            if (!lockedListing) {
                throw new Error("Listing not found during cancellation");
            }

            // Recheck status inside the transaction.
            const booking = await Booking.findById(
                req.params.bookingId
            ).session(session);

            if (!booking) {
                outcome = "notFound";
                return;
            }

            if (!booking.user.equals(req.user._id)) {
                outcome = "forbidden";
                return;
            }

            if (booking.status !== "confirmed") {
                outcome = "notConfirmed";
                return;
            }

            booking.status = "cancelled";
            await booking.save({ session });

            outcome = "cancelled";
        });

        if (outcome === "notFound") {
            return res.status(404).send("Booking not found");
        }

        if (outcome === "forbidden") {
            return res.status(403).send("You cannot cancel this booking");
        }

        if (outcome === "notConfirmed") {
            req.flash("error", "This booking is already cancelled.");
            return res.redirect("/bookings/my");
        }

        if (outcome !== "cancelled") {
            return res.status(500).send("Could not cancel booking");
        }

        req.flash("success", "Booking cancelled successfully!");
        return res.redirect("/bookings/my");

    } catch (err) {
        next(err);
    } finally {
        await session.endSession();
    }
};
