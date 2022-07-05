"use strict";

const Router = require("express").Router;
const router = new Router();
const { SECRET_KEY } = require("../config");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const User = require("../models/user");

/** POST /login: {username, password} => {token}
 * Throw an unauthorized error if authentication fails
 */
//TODO: update timestamp
router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
  if (await User.authenticate(username, password)) {
    const token = jwt.sign({ username }, SECRET_KEY);

    return res.json({ token });
  }

  throw new UnauthorizedError("Invalid user/password");
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res, next) {
  const { username } = req.body;
  const user = await User.register(req.body);

  if (user) {
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }
});

module.exports = router;
