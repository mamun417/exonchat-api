module.exports = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '1234',
    database: process.env.DB_NAME || 'exonchat',
    entities: ['dist/api/**/*.entity{.ts,.js}'],
    migrations: ['dist/database/migrations/**/*{.ts,.js}'],
    cli: {
        migrationsDir: 'migrations',
    },
    seeds: ['dist/database/seeds/**/*.seed{.ts,.js}'],
    factories: ['dist/database/factories/**/*.factory{.ts,.js}'],
    synchronize: true,
};
