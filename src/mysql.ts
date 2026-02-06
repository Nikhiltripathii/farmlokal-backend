import mysql from "mysql2/promise";
import { env } from "./config/env";

export const mysqlPool = mysql.createPool({
  host: env.mysql.host,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true

});
console.log("DB:", env.mysql.database);
