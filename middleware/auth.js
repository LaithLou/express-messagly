"use strict";

/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    const tokenFromRequest = req.query._token || req.body._token;
    const payload = jwt.verify(tokenFromRequest, SECRET_KEY);
    res.locals.user = payload;
    return next();
  } catch (err) {
    // error in this middleware isn't error -- continue on
    return next();
  }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/** Middleware: Requires user is user for route. */

function ensureCorrectUser(req, res, next) {
  try {
    if (!res.locals.user || res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}
//TODO: since it's specific ensure it has a better spesific name
//TODO: we need to say it in a clearer way.
/** Middleware: Requires user is authenticated and is either the to_user
 * or form_user for the message for route. */

async function ensureCorrectUsers(req, res, next) {
  const message = await Message.get(req.params.id);
  console.log(res.locals.user.username);
  console.log(message);
  try {
    if (
      !res.locals.user ||
      (res.locals.user.username !== message.to_user.username &&
        res.locals.user.username !== message.from_user.username)
    ) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensureCorrectUsers,
};
