export default {
  development: {
    client: "pg",
    connection: process.env.DB_URL || {
      host: "localhost",
      user: "postgres",
      port: 5432,
      password: process.env.PASSWORD,
      database: "db_from_terminal",
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DB_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};
