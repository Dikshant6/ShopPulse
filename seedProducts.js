import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "./src/models/Product.js";
import { connectToDB } from "./src/config/db.js";
import bcrypt from "bcrypt";
import { User } from "./src/models/User.js";

dotenv.config();
const DB_URI = process.env.MONGO_URI;

const newProducts = [
  {
    name: "Air Max 270",
    description: "Lightweight everyday sneakers with responsive cushioning.",
    price: 12999,
    category: "Shoes",
    brand: "Nike",
    images: [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIq0EvkVSMMf--E5AmDR4BS5_5rR5T0WisuuN_MNwuOA&s=10",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBfs1k9aV5JnIPK3A6WDSZXQzyl07kjzU60495eQDlVQ&s=10",
    ],
    stock: 25,
  },

  {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable regular-fit cotton t-shirt for everyday wear.",
    price: 799,
    category: "T-Shirts",
    brand: "Overlays",
    images: [
      "https://overlaysnow.com/cdn/shop/files/24_713e9b49-b3c1-4a8c-b784-8b8cd0f79651.jpg?v=1773322980&width=3840",
      "https://overlaysnow.com/cdn/shop/files/3126.png?v=1773322980&width=800",
      "https://overlaysnow.com/cdn/shop/files/13_06099b62-8250-4a6b-a671-e27f94ba95d7.png?v=1773322980&width=3840",
      "https://overlaysnow.com/cdn/shop/files/OV5125_9c53e618-0264-4a8f-85c5-9c534ac7027f.jpg?v=1773322980&width=3840",
    ],
    stock: 50,
  },

  {
    name: "WH-1000XM5",
    description:
      "Wireless noise-cancelling headphones with premium sound quality.",
    price: 29999,
    category: "Headphones",
    brand: "Sony",
    images: [
      "https://www.sony.co.in/image/6145c1d32e6ac8e63a46c912dc33c5bb?fmt=png-alpha",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU0qg8TPnTE35lF1dC_7mPtjgXjpDBwbYVEUkyIZLcFw&s",
    ],
    stock: 15,
  },

  {
    name: "MacBook Pro 14-inch M5 Pro",
    description:
      "Premium 14-inch professional laptop powered by Apple silicon, featuring a stunning Liquid Retina XDR display and exceptional performance.",
    price: 199999,
    category: "Laptops",
    brand: "Apple",
    images: ["https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-size-select-202601-14inch?wid=5120&hei=3280&fmt=webp&qlt=90&.v=aXlkdGF0T0RUUVdDckNLaUc0OEE0NGNlZWUwMTIzdTlRMENjTTRINjJoQzFraXhFSkFYNEExYXEyZ3YrQk5RbWZvSGF2dFhlaXl5ZzZDVTRMdEVvNll2UjRaSC9URTlmd0FSb1ZTWjRnb3U5QTF6QmtBWUlXQ1lEdjlqWkpBdFc&traceId=1","https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-size-select-202601-14inch_AV1_GEO_IN?wid=5120&hei=3280&fmt=webp&qlt=90&.v=aXlkdGF0T0RUUVdDckNLaUc0OEE0NGNlZWUwMTIzdTlRMENjTTRINjJoQkxDajRZeEZ3ZUErT1h1YUplaWpsMW12REZrUzQ4ZXZsZ3R0UENuL09haDUxZkhSZ3IxeE5VWnBEYTVDMTVRNThCMThRZkQvSklEcXVnTnp0eTB0SVEyZjBjK0hmMHJDYUo2MWdFMUoyUW9B&traceId=1","https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-size-select-202601-14inch_AV2?wid=5120&hei=3280&fmt=webp&qlt=90&.v=aXlkdGF0T0RUUVdDckNLaUc0OEE0NGNlZWUwMTIzdTlRMENjTTRINjJoQ09sb0JtSjNIM2YvU2FyWFowTndBQmtXOFZBWlBHUmZ1SFluOWlKMkovNGhWb1BiTjRORlc1Y1lKU3JWempySks1Tmlta0xqSkdnRm9oYXU4QlJNbjNmbW94YnYxc1YvNXZ4emJGL0IxNFp3&traceId=1"],
    stock: 8,
  },

  {
    name: "iPhone 18 Pro Max",
    description:
      "Flagship smartphone featuring a titanium design, advanced camera system, powerful Apple silicon, and a stunning Super Retina XDR display.",
    price: 184999,
    category: "Smartphones",
    brand: "Apple",
    images: ["https://www.apple.com/v/iphone-18-pro/a/images/overview/product-viewer/3d_viewer__hgotqf9hvvee_small.jpg","https://www.apple.com/v/iphone-18-pro/a/images/overview/pro-camera/system/hero__elo7tt0mnqy6_small.jpg", "https://www.apple.com/v/iphone-18-pro/a/images/overview/highlights/colors_endframe__czfie0zmty4i_small.jpg"],
    stock: 12,
  },

  {
    name: "Galaxy S26 Ultra",
    description:
      "Premium flagship smartphone with a high-resolution AMOLED display, advanced camera system, powerful performance, and an elegant design.",
    price: 159999,
    category: "Smartphones",
    brand: "Samsung",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlbwLI674GFZ9ULwnJ-_AgoWN5JJhevLRMXdJQFRytAg&s=10","https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnUQfLtqUA-Y5s8-HW8dAABwQHoDp0QGCLs7AXu3fj3w&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5Xz7qT2ozWatgUehI_TyoH65FqJHxk2YIZ1gHRxepxg&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDDk1zCpEPWR8NqUaBj2ZvayR7SdCcJDm92l4rWsDh1w&s=10"],
    stock: 10,
  },
  {
    name: "Bose QuietComfort Ultra Headphones",
    description:
      "Premium wireless headphones with advanced noise cancellation, immersive audio, and luxurious comfort designed for long listening sessions.",
    price: 34900,
    category: "Headphones",
    brand: "Bose",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTr0eboyQgQ6eZLUGcZ567ug7E8gSCDorA6sU0o2QxTzA&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9CzziWMU9SlP1N_iF1u-EOkkvWKa6n8QRBK9VPAiIg&s=10"],
    stock: 9,
  },

  {
    name: "Apple Watch Ultra 3",
    description:
      "Rugged premium smartwatch designed for adventure and fitness, featuring a durable titanium case, advanced health features, and a bright display.",
    price: 89999,
    category: "Smartwatches",
    brand: "Apple",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX25qALqY-T3SmBJ9MgmlPdEVYXyv7RlCU2AEnu2eONw&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO7CbBsAC3HDSC7k7NZFct1HfRpShNHsWH_XKl0cbZ9g&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH-bBS5zb4cGlX2PV6OCHn1NhvryRZ3uSXrnA26tS6uA&s=10"],
    stock: 7,
  },

  {
    name: "Dell XPS 16",
    description:
      "Premium performance laptop featuring a large high-resolution display, powerful processor, dedicated graphics, and a sleek aluminum design.",
    price: 189999,
    category: "Laptops",
    brand: "Dell",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShbBUA-lPeEa2kv8wmuiwLFfk6DlI_gmw5U7fhNryx7w&s", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa3-ULAszOMngrDtn5l-IKTqZCHSkgX2CucHyQ3Ao5MA&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShaS3cDb9-oXqKoNREypA3L9FU37E5N7p9SmgShKz4Xw&s"],
    stock: 6,
  },

  {
    name: "Canon EOS R6 Mark II",
    description:
      "Professional full-frame mirrorless camera designed for photography and video, offering fast autofocus, high-quality imaging, and excellent low-light performance.",
    price: 214999,
    category: "Cameras",
    brand: "Canon",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlKDrbi_3fA9U0_FHzzMrCXvGUt426m-xRR-q96izUJg&s", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdZaQ70RS9h5NB39TcZBHZC_qrHE7VKwTMELRZNbdezA&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR45sFVc5vNWcA6qv-2DYMdxciCfPx8azpeBrFuqt488A&s=10"],
    stock: 5,
  },

  {
    name: "PlayStation 5 Pro",
    description:
      "High-performance gaming console engineered for enhanced graphics, smoother gameplay, and immersive next-generation gaming experiences.",
    price: 79999,
    category: "Gaming",
    brand: "Sony",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbR7EcjsZN7H4F857B4fYQcMMntVcX8_izuezWWVagWg&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmlWorrH-PrfXIAnpwPxXcHaeSqRSqSY7TIz4fduiy4Q&s", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQG09wvdisZdwE-1L-j0mMWNRC_Os_L-KPwGI-I9LWwXQ&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDojcrPCRTvARnHYCUfd_3yILk2mqiR_eSZjDmPeyZXA&s=10"],
    stock: 11,
  },

  {
    name: "Samsung Odyssey OLED G8",
    description:
      "Premium OLED gaming monitor featuring an ultra-fast refresh rate, vivid contrast, immersive visuals, and a sleek modern design.",
    price: 119999,
    category: "Monitors",
    brand: "Samsung",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4jpj-PNEH36X4FzHORbveRJY8HF2PMue2puNgrRPsgA&s=10","https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkV21p2Zfj1v0HHD8Oq5lEVyJWwaEzAutwq02_ePb-yg&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAX3uQae4rIY1B3NHaCg9tbo7SGX0g6KaefaTHBoDrmQ&s=10", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKIfKXCvNcZTSgd-7SEGUk7Eys5aaUQNEgYcIjf01TLA&s=10", ""],
    stock: 8,
  },

];

const seedAdmin = async () => {
  const username = "Admin";
  const email = "admin@gmail.com";
  const password = "Master@123";

  console.log(await User.find({}))

  const exisitingUser = await User.find({ email });
  if (exisitingUser) {
    console.log("Admin Already Exist skipping");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name: username,
    email,
    password: hashedPassword,
    role: "admin",
  });

  await newUser.save();
  console.log("Admin Created Successfully");
};

const seedProducts = async () => {
  try {
    await connectToDB(DB_URI);
    await Product.deleteMany({});
    await Product.insertMany(newProducts);
    console.log("Product added successfully");
    // await seedAdmin();
  } catch (error) {
    console.error("Error while initiating products");
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected!");
  }
};

seedProducts();
