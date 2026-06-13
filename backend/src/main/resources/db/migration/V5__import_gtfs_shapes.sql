-- Staging Table
CREATE TABLE staging_shapes (
    shape_id VARCHAR(50),
    shape_pt_lat NUMERIC(9,6),
    shape_pt_lon NUMERIC(9,6),
    shape_pt_sequence INT
);

CREATE TABLE staging_trips_for_shapes (
    route_id VARCHAR(50),
    service_id VARCHAR(50),
    trip_id VARCHAR(50),
    trip_headsign VARCHAR(200),
    direction_id INT,
    block_id VARCHAR(50),
    shape_id VARCHAR(50)
);

-- Load Data
COPY staging_shapes FROM '/tmp/gtfs-data/shapes.txt' WITH (FORMAT csv, HEADER true);
COPY staging_trips_for_shapes FROM '/tmp/gtfs-data/trips.txt' WITH (FORMAT csv, HEADER true);

-- Shapes Table
CREATE TABLE route_shapes(
    route_id VARCHAR(50),
    lat NUMERIC(9,6),
    lon NUMERIC(9,6),
    sequence_order INT
);

-- Map routes to their shapes and insert
WITH FirstTrips AS (
    SELECT route_id, MIN(shape_id) as master_shape_id
    FROM staging_trips_for_shapes
    WHERE shape_id IS NOT NULL AND shape_id != ''
    GROUP BY route_id
)
INSERT INTO route_shapes (route_id, lat, lon, sequence_order)
SELECT ft.route_id, ss.shape_pt_lat, ss.shape_pt_lon, ss.shape_pt_sequence
FROM FirstTrips ft
JOIN staging_shapes ss ON ft.master_shape_id = ss.shape_id;

DROP TABLE staging_shapes;
DROP TABLE staging_trips_for_shapes;