import dotenv from "dotenv";
process.env.DOTENV_CONFIG_SILENT = 'true';
dotenv.config();

import app from "./app.js";
import { dbConnection } from "./database/dbConnection.js";
import "./config/cloudinaryConfig.js";

const PORT = process.env.PORT || 4000;

dbConnection();


app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
