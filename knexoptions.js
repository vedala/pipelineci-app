const knexEnvOptions = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: "../pipelineci-backend/mydb.sqlite"
    },
    useNullAsDefault: true
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.RDS_CERT_BUNDLE,
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 3000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        propagateCreateError: false,
      },
    }
  }
}

export default knexEnvOptions;
