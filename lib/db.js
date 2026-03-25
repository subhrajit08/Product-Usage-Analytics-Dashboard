import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'POSTGRES',
  host: 'localhost',
  port: 5432,
  database: 'analytics_db',
});

export default pool;