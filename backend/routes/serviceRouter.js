import express from "express";
import { getAllServices, 
    postService, 
    getMyServices,
    updateMyService, 
    deleteService } from "../controllers/serviceController.js";
import { isAuthorized } from "../middlewares/auth.js";

const router = express.Router();   

router.get("/getall", getAllServices);
router.post("/post", isAuthorized, postService);
router.get("/getmyservices", isAuthorized, getMyServices);
router.put("/updatemyservice/:id", isAuthorized, updateMyService);
router.delete("/deleteservice/:id", isAuthorized, deleteService);


export default router;
 