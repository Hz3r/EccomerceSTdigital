import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { warnPendingMigrations } from "./config/migrations.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    void warnPendingMigrations();
})

