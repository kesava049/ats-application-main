// ✅ routes/authRoutes.js
import express from "express";
import {
    sendOtp,
    verifyOtp,
    registerSuperadmin,
    superadminLogin,
    validateSuperadminToken,
    createUser,
    getAllUsers,
    getAllLoginHistory,
    updateUser,
    deleteUser,
    getUsersByType,
    getUserById,
    getAllCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    setDefaultLogosForCompanies,
    upload
} from "../controllers/authController.js";
import { superadminAuth } from "../middlewares/superadminAuth.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register-superadmin", registerSuperadmin);
router.post("/superadmin-login", superadminLogin);
router.get("/validate-superadmin-token", validateSuperadminToken);
router.post("/create-user", createUser);
router.get("/all-users", getAllUsers);
router.get("/users/:userType", getUsersByType);
router.get("/user/:id", getUserById);
router.get("/all-login-history", superadminAuth, getAllLoginHistory);
router.put("/update-user/:id", updateUser);
router.delete("/delete-user/:id", deleteUser);

// Company routes
router.get("/companies", getAllCompanies);
router.get("/company/:id", getCompanyById);
router.post("/create-company", superadminAuth, upload.single('logo'), createCompany);
router.put("/update-company/:id", superadminAuth, upload.single('logo'), updateCompany);
router.delete("/delete-company/:id", superadminAuth, deleteCompany);
router.post("/set-default-logos", superadminAuth, setDefaultLogosForCompanies);

export default router;