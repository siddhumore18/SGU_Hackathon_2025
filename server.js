// server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("public"));

const ECO_KEYWORDS = [
  "organic", "biodegradable", "eco", "recycled", "sustainable",
  "compostable", "plastic-free", "bamboo", "natural", "green", "ethical"
];

const ECO_BRANDS = [
  "Patanjali", "The Body Shop", "Bare Necessities", "Ecosys", "Mamaearth",
  "Rustic Art", "Himalaya", "Khadi", "EcoRight", "Beco"
];

// ✅ /api/products Route
app.get("/api/products", async (req, res) => {
  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_shopping",
        q: "eco friendly products",
        api_key: process.env.SERP_API_KEY
      }
    });

    const allProducts = (data.shopping_results || []).map(product => ({
      title: product.title,
      price: product.price,
      link:
        product.link ||
        product.product_link ||
        product.source_link ||
        product.extensions?.find(e => typeof e === 'string' && e.startsWith('http')) ||
        "#",
      thumbnail: product.thumbnail,
      source: product.source || "",
      extensions: product.extensions || [],
      snippet: product.snippet || ""
    }));

    const filtered = allProducts.filter(product => {
      const text = `
        ${product.title || ""}
        ${product.source || ""}
        ${product.snippet || ""}
        ${(product.extensions || []).join(" ")}
      `.toLowerCase();

      const isEcoMaterial = ECO_KEYWORDS.some(keyword => text.includes(keyword));
      const isEcoBrand = ECO_BRANDS.some(brand => text.includes(brand.toLowerCase()));

      return isEcoMaterial || isEcoBrand;
    });

    res.json({
      all: allProducts.slice(0, 30),      // Only show top 30
      ecoFriendly: filtered
    });
  } catch (error) {
    console.error("Error fetching from SerpAPI:", error.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ /api/search Route
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });

  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_shopping",
        q: query,
        api_key: process.env.SERP_API_KEY
      }
    });

    const results = (data.shopping_results || []).map(product => ({
      title: product.title,
      price: product.price,
      link:
        product.link ||
        product.product_link ||
        product.source_link ||
        product.extensions?.find(e => typeof e === "string" && e.startsWith("http")) ||
        "#",
      thumbnail: product.thumbnail,
      source: product.source || "",
      extensions: product.extensions || [],
      snippet: product.snippet || ""
    }));

    res.json(results.slice(0, 10));
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
