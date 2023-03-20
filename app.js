//require modules
const express = require("express");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const Restaurant = require("./models/restaurant"); //載入 Restaurant model
const restaurantList = require("./restaurant.json");
const recommendRestaurants = require("./random_restaurant");
const app = express();
const port = 3000;

// 僅在非正式環境時, 使用 dotenv
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//connet to mongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

db = mongoose.connection;

//set connect error and success message
db.on("error", () => {
  console.log("MongoDB error!");
});

db.once("open", () => {
  console.log("Connect success!");
});

//set view template
app.engine("hbs", exphbs({ defaultLayout: "main", extname: "hbs" }));
app.set("view engine", "hbs");

// setting static files
app.use(express.static("public"), express.urlencoded({ extended: true }));

//set route
//首頁
app.get("/", (req, res) => {
  Restaurant.find() //取出model裡的資料
    .lean() //轉換成JS array
    .then((restaurants) => {
      res.render("index", { restaurants });
    })
    .catch((e) => console.log(e));
});

//餐廳詳細的route
app.get("/restaurants/:id", (req, res) => {
  const id = req.params.id;
  Restaurant.findById(id)
    .lean()
    .then((restaurant) => res.render("show", { restaurant }))
    .catch((e) => console.log(e));
});

//搜尋結果的route
app.get("/search", (req, res) => {
  const keyword = req.query.keyword.trim().toLowerCase();
  let restaurants = restaurantList.results.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(keyword) ||
      restaurant.category.includes(keyword)
  );
  const noResults = restaurants.length ? false : true;
  //如有搜尋到則維持原本的restaurant array, 沒有執行推薦3間餐廳的function
  restaurants = restaurants.length
    ? restaurants
    : recommendRestaurants(restaurantList.results);

  res.render("index", { restaurants, keyword, noResults });
});
//set create new restaurant route
app.get("/create", (req, res) => {
  res.send("這裡可以新增餐廳");
});

app.listen(port, () => {
  console.log(`The server is running on http://localhost:${port}`);
});
