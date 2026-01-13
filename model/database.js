import knex from "knex";
import knexConfig from "./knexfile.js";

const environment = process.env.NODE_ENV || "development";
const configOptions = knexConfig[environment];

// const DB_URL = process.env.DB_URL;
// const password = process.env.PASSWORD;

// const db = knex({
//   client: "pg",
//   connection: DB_URL || {
//     host: "127.0.0.1",
//     user: "postgres",
//     port: 5432,
//     password: password,
//     database: "db_from_terminal",
//   },
// });

export default knex(configOptions);
