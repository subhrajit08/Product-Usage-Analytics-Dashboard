import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'POSTGRES',
  host: '127.0.0.1',
  port: 5432,
  database: 'analytics_db',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || 'ALL';

  try {
    const client = await pool.connect();
    let whereClause = `WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (clientId !== 'ALL') {
      whereClause += ` AND client_id = $${paramIndex}`;
      queryParams.push(clientId);
      paramIndex++;
    }

    // 1. Fetch Exact Dropdown Lists
    let dropdowns = { clients: [], channels: [], languages: [], types: [] };
    try {
      dropdowns.clients = (await client.query(`SELECT DISTINCT client_id as value FROM channel_user_processing_summary WHERE client_id IS NOT NULL ORDER BY client_id`)).rows.map(r => r.value);
      dropdowns.channels = (await client.query(`SELECT DISTINCT 'Channel ' || channel_name as value FROM channel_user_processing_summary WHERE channel_name IS NOT NULL ORDER BY value`)).rows.map(r => r.value);
      dropdowns.languages = (await client.query(`SELECT DISTINCT language as value FROM language_processing_summary WHERE language IS NOT NULL ORDER BY language`)).rows.map(r => r.value);
      dropdowns.types = (await client.query(`SELECT DISTINCT output_type as value FROM output_type_processing_summary WHERE output_type IS NOT NULL ORDER BY output_type`)).rows.map(r => r.value);
    } catch (err) { console.error('Error fetching dropdowns:', err.message); }

    // 2. Fetch Dynamic Table Data
    let tableData = { channel: [], client: [], user: [] };
    try {
      tableData.channel = (await client.query(`SELECT 'Channel ' || channel_name as name, SUM(uploaded_count::numeric) as uploaded, SUM(created_count::numeric) as processed, SUM(published_count::numeric) as published FROM channel_user_processing_summary ${whereClause} GROUP BY channel_name ORDER BY uploaded DESC LIMIT 10`, queryParams)).rows;
      tableData.client = (await client.query(`SELECT client_id as name, SUM(uploaded_count::numeric) as uploaded, SUM(created_count::numeric) as processed, SUM(published_count::numeric) as published FROM channel_user_processing_summary ${whereClause} GROUP BY client_id ORDER BY uploaded DESC LIMIT 10`, queryParams)).rows;
      tableData.user = (await client.query(`SELECT user_name as name, SUM(uploaded_count::numeric) as uploaded, SUM(created_count::numeric) as processed, SUM(published_count::numeric) as published FROM channel_user_processing_summary ${whereClause} GROUP BY user_name ORDER BY uploaded DESC LIMIT 10`, queryParams)).rows;
    } catch (err) { console.error('Error fetching table data:', err.message); }

    // 3. NEW: Fetch REAL Chart Data for the Multi-Dimensional Analysis
    let chartData = { Client: [], Channel: [], Language: [], 'Input Type': [], 'Output Type': [] };
    try {
      chartData['Client'] = (await client.query(`SELECT client_id as label, SUM(uploaded_count::numeric) as value FROM channel_user_processing_summary ${whereClause} GROUP BY client_id ORDER BY value DESC LIMIT 5`, queryParams)).rows;
      chartData['Channel'] = (await client.query(`SELECT 'Channel ' || channel_name as label, SUM(uploaded_count::numeric) as value FROM channel_user_processing_summary ${whereClause} GROUP BY channel_name ORDER BY value DESC LIMIT 5`, queryParams)).rows;
      chartData['Language'] = (await client.query(`SELECT language as label, SUM(uploaded_count::numeric) as value FROM language_processing_summary ${whereClause} GROUP BY language ORDER BY value DESC LIMIT 5`, queryParams)).rows;
      chartData['Input Type'] = (await client.query(`SELECT input_type as label, SUM(uploaded_count::numeric) as value FROM input_type_processing_summary ${whereClause} GROUP BY input_type ORDER BY value DESC LIMIT 5`, queryParams)).rows;
      chartData['Output Type'] = (await client.query(`SELECT output_type as label, SUM(uploaded_count::numeric) as value FROM output_type_processing_summary ${whereClause} GROUP BY output_type ORDER BY value DESC LIMIT 5`, queryParams)).rows;
    } catch (err) { console.error('Error fetching chart data:', err.message); }

    client.release();

    return NextResponse.json({
      dropdowns,
      tableData,
      chartData
    });

  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}