"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  //TODO: reformat sql and update DOCSTRINGS document or decide on errors

  static async register({ username, password, first_name, last_name, phone }) {
    console.log("password: ", password);
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username,
                          password,
                          first_name,
                          last_name,
                          phone,
                          join_at,
                          last_login_at)
      VALUES
      ($1, $2,$3,$4,$5,current_timestamp,current_timestamp)
      RETURNING username,password,first_name,last_name,phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    debugger;
    const user = result.rows[0];
    return user;
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user) {
      if ((await bcrypt.compare(password, user.password)) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
            SET last_login_at = current_timestamp
              WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username,
              first_name,
              last_name
          FROM users`
    );
    const users = result.rows;
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
                first_name,
                last_name,
                phone,
                join_at,
                last_login_at
            FROM users
            WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   * returns an empty array when there is no messages.
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT id,
                to_username,
                body,
                sent_at,
                read_at,
                t.first_name AS to_first_name,
                t.last_name AS to_last_name,
                t.phone AS to_phone
            FROM messages
              JOIN users AS t ON to_username = t.username
              JOIN users AS f ON from_username = f.username
            WHERE from_username = $1`,
      [username]
    );

    const messages = result.rows;
    const users = messages.map((m) => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.to_first_name,
        last_name: m.to_last_name,
        phone: m.to_phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));

    return users;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   * returns an empty array when there is no messages.
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT id,
                from_username,
                body,
                sent_at,
                read_at,
                f.first_name AS from_first_name,
                f.last_name AS from_last_name,
                f.phone AS from_phone
            FROM messages
              JOIN users AS t ON to_username = t.username
              JOIN users AS f ON from_username = f.username
            WHERE to_username = $1`,
      [username]
    );

    const message = result.rows;
    const users = message.map((m) => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.from_first_name,
        last_name: m.from_last_name,
        phone: m.from_phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));

    return users;
  }
}

module.exports = User;
