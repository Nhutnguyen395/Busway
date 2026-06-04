CREATE TABLE staging_routes (
    route_id VARCHAR(50),
    agency_id VARCHAR(50),
    route_short_name VARCHAR(50),
    route_long_name VARCHAR(200),
    route_desc TEXT,
    route_type INT,
    route_url TEXT,
    route_color VARCHAR(7),
    route_text_color VARCHAR(7)
);

CREATE TABLE staging_stops (
    stop_id VARCHAR(50),
    stop_code VARCHAR(50),
    stop_name VARCHAR(200),
    stop_desc TEXT,
    stop_lat NUMERIC(9,6),
    stop_lon NUMERIC(9,6),
    zone_id VARCHAR(50),
    stop_url TEXT,
    location_type INT,
    parent_station VARCHAR(50),
    stop_timezone VARCHAR(50)
);

-- Tell Postgres to look in the /tmp/gtfs-data folder that is mapped in Docker
COPY staging_routes FROM '/tmp/gtfs-data/routes.txt' WITH (FORMAT csv, HEADER true);
COPY staging_stops FROM '/tmp/gtfs-data/stops.txt' WITH (FORMAT csv, HEADER true);

DELETE FROM route_stops;
DELETE FROM routes;
DELETE FROM stops;

INSERT INTO routes (id, name, description, color_hex, status)
SELECT
    route_id,
    COALESCE(route_short_name, route_long_name), -- Use short name, but if empty use long name
    route_long_name,
    CASE
        WHEN route_color is NULL OR route_color = '' THEN '#888888'
        ELSE '#' || staging_routes.route_color
    END,
    'ACTIVE'
FROM staging_routes;

INSERT INTO stops (id, name, longitude, latitude, geom)
SELECT
    stop_id,
    stop_name,
    stop_lat,
    stop_lon,
    ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)
FROM staging_stops;

DROP TABLE staging_routes;
DROP TABLE staging_stops;