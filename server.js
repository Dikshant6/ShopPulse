import { app } from "./src/app.js";
import { connectToDB } from "./src/config/db.js";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

//connection required to dns for database connection
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.log("DNS setServers warning:", e.message);
}

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;


app.listen(PORT, async () => {
  await connectToDB(DB_URI);
  console.log(`server started on: http://localhost:${PORT}/`);
});
