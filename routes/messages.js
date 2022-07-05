"use strict";

const {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureCorrectUsers,
} = require("../middleware/auth");
const Message = require("../models/message");
const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureCorrectUsers, async function (req, res, next) {
  const message = await Message.get(req.params.id);
  return res.json({ message });
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
//TODO: params => messageData
router.post("/", ensureLoggedIn, async function (req, res, next) {
  debugger;
  const messageData = {
    from_username: res.locals.user.username,
    to_username: req.body.to_username,
    body: req.body.body,
  };
  const message = await Message.create(messageData);
  return res.json({ message });
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only intended recipient can mark as read.
 *
 **/
//TODO: condition logic is the user making that request  we can acess res.locals.user.usename
router.post("/:id/read", ensureCorrectUser, async function (req, res, next) {
  const message = await Message.markRead(req.params.id);
  return res.json({ message });
});

module.exports = router;
