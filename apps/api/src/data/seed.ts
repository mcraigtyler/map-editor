import { AppDataSource } from './datasource';

async function seed() {
  await AppDataSource.initialize();
  await AppDataSource.query(`
    INSERT INTO features (kind, geom, tags)
    VALUES
      (
        'point',
        ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[0,0]}'),4326),
        '{"name":"Null Island"}'
      ),
      (
        'line',
        ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[0,0],[1,1]]}'),4326),
        '{"name":"Test Line"}'
      );
  `);
  await AppDataSource.destroy();
}

seed().then(() => {
  console.log('Database seeded');
});

