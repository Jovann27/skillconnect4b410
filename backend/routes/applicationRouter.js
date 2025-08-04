import express from "express";
import {
  serviceSeekerGetAllApplications,
  serviceProviderDeleteApplication,
  serviceProviderGetAllApplications,
  postApplication,
} from "../controllers/applicationController.js";
import { isAuthorized } from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isAuthorized, postApplication);
router.get("/serviceseeker/getall", isAuthorized, serviceSeekerGetAllApplications);
router.get("/serviceprovider/getall", isAuthorized, serviceProviderGetAllApplications);
router.delete("/delete/:id", isAuthorized, serviceProviderDeleteApplication);

export default router;