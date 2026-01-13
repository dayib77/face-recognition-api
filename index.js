import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc"; //

import databases from "./model/database.js";
import register from "./controllers/controllerRegister.js";
import returnClarifaiOptions from "./middleware/clarifaiHelperFunction.js";

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const corsOptions = {
  origin: clientOrigin, // Adjust this to your frontend's origin
  optionsSuccessStatus: 200,
  Credentials: true,
};

const app = express(); // Initialize Express app
app.use(helmet()); // Use Helmet for security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions)); // Enable CORS with specified options

const stub = ClarifaiStub.grpc(); // Initialize Clarifai gRPC stub
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY; // Load from environment variable

const metadata = new grpc.Metadata(); // Initialize metadata
metadata.set("authorization", "Key " + CLARIFAI_API_KEY);

// console.log(process.env);

// Root route to fetch all users
app.get("/", async (req, res) => {
  const users = await databases.select("*").from("users");
  res.json(users);
});

// Register endpoint
app.post("/register", register(databases, bcrypt)); // Use the register router

app.get("/login", async (req, res) => {
  const loginData = await databases.select("*").from("login");
  res.json(loginData);
});

// Signin endpoint with rate limiting
const signinLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 2, // 2 attempts per IP
  standardHeaders: true, // Return RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

app.post("/signin", signinLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const result = await databases("login")
      .join("users", "login.user_id", "users.id")
      .select(
        "login.password_hash",
        "users.id",
        "users.full_name",
        "users.email",
        "users.entries"
      )
      .where("users.email", email)
      .first();

    if (!result) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, result.password_hash);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const { password_hash, ...user } = result; // Exclude password_hash from user object
    res.json(user);
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  const user = await databases.select("*").from("users").where({ id });
  if (user.length === 0)
    return res.status(404).json({ message: "User not found" });
  res.json(user[0]);
});

app.post("/imageurl", async (req, res) => {
  const { input } = req.body;

  stub.PostModelOutputs(
    {
      user_app_id: {
        user_id: "clarifai",
        app_id: "main",
      },
      model_id: "face-detection",
      inputs: [{ data: { image: { url: input } } }],
    },
    metadata,
    (err, response) => {
      if (err) {
        console.log("Error: " + err);
        return;
      }

      // check error status
      if (response.status.code !== 10000) {
        console.log(
          "Received failed status: " +
            response.status.description +
            "\n" +
            response.status.details
        );
        return;
      }
      console.log("Clarifai API response:\n", response);
      res.json(response);
    }
  );

  // Alternative fetch implementation (commented out)
  // try {
  //   const response = await fetch(
  //     `https://api.clarifai.com/v2/models/face-detection/versions/6dc7e46bc9124c5c8824be4822abe105/outputs`,
  //     returnClarifaiOptions(input)
  //   );
  //   const data = await response.json();
  //   // console.log("Clarifai API response:\n", data);
  //   res.json(data);
  // } catch (error) {
  //   console.error("Error calling Clarifai API:", error);
  //   res.status(500).json({ message: "Unable to work with API" });
  // }
});

app.patch("/image", async (req, res) => {
  const { id } = req.body;
  const user = await databases.select("*").from("users").where({ id });

  if (user.length === 0)
    return res.status(404).json({ message: "User not found" });

  const updatedUser = await databases("users")
    .where({ id })
    .increment("entries", 1)
    .returning("*");
  res.json({ entries: updatedUser[0].entries });
});

const PORT = process.env.PORT || 3000; // listen dynamically
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
