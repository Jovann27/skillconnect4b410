import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import Service from '../models/serviceSchema.js';
import ErrorHandler from '../middlewares/error.js';


export const getAllServices = catchAsyncError(async (req, res, next) => {
    const services = await Service.find({ expired: false });

    res.status(200).json({
        success: true,
        services,
    });
});

export const postService = catchAsyncError(async (req, res, next) => {
    const {
        title,
        description,
        location,
        fixedPrice,
        priceFrom,
        priceTo,
        category,
    } = req.body;

    // Basic required fields check
    if (!title || !description || !location || !category) {
        return next(new ErrorHandler("Please fill all the fields", 400));
    }

    // Validate pricing
    const isRangedPrice = priceFrom !== undefined && priceTo !== undefined;
    const isFixed = fixedPrice !== undefined && fixedPrice !== null;

    // ❌ Neither fixed nor range is provided
    if (!isFixed && !isRangedPrice) {
        return next(new ErrorHandler("Please provide either a fixed price or a price range", 400));
    }

    // ❌ Both fixed and range are provided
    if (isFixed && isRangedPrice) {
        return next(new ErrorHandler("Cannot provide both fixed price and price range", 400));
    }

    // ❌ If range is provided, ensure priceFrom is not greater than priceTo
    if (isRangedPrice && priceFrom > priceTo) {
        return next(new ErrorHandler("Starting price cannot be greater than ending price", 400));
    }

    const service = await Service.create({
        title,
        description,
        location,
        fixedPrice,
        priceFrom,
        priceTo,
        category,
        createdBy: req.user._id,
        expired: false,
    });

    res.status(201).json({
        success: true,
        service,
        message: "Service needed posted successfully",
    });
});

export const getMyServices = catchAsyncError(async(req, res, next) => {
    const { role } = req.user;
    if (role === "Service Provider") {
        return next(new ErrorHandler("Service Provider is not allowed to access this resources!", 400));
    }
    const myServices = await Service.find({createdBy: req.user._id});
    res.status(200).json({
        success: true,
        myServices,
    });
});

export const updateMyService = catchAsyncError(async(req, res, next) => {
    const { role } = req.user;
    if (role === "Service Provider") {
        return next(new ErrorHandler("Service Provider is not allowed to access this resources!", 400));
    }
    const { id } = req.params;
    let service = await Service.findById(id);
    if(!id){
        return next(new ErrorHandler("Oops, Service not found", 400));
    }
    service = await Service.findByIdAndUpdate(id, req.body, {
        new : true,
        runValidators: true,
        useFindAndModify: false
    })
    res.status(200).json({
        success: true,
        service,
        message: "Service Updated Successfully!",
    });
})

export const deleteService = catchAsyncError(async( req, res, next) => {
    const { role } = req.user;
    if (role === "Service Provider") {
        return next(new ErrorHandler("Service Provider is not allowed to access this resources!", 400));
    }
    const { id } = req.params;
    let service = await Service.findById(id);
    if(!id){
        return next(new ErrorHandler("Oops, Service not found", 400));
    }
    await service.deleteOne();
    res.status(200).json({
        success: true,
        message: "Service Deleted Successfully!"
    })
})