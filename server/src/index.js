const express = require("express");
const env = require("dotenv").config();
const app = express();
const static = require("./routes/static");
const tmdbRoute = require("./routes/tmdbRoutes");

/* ***********************
 * Middleware
 * ************************/
app.use(
	session({
		store: new (require("connect-pg-simple")(session))({
			createTableIfMissing: true,
			pool,
		}),
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		name: "sessionId",
	})
);

app.use(express.json());
app.use('/api/movies', tmdbRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});