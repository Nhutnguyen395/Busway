-- CREATE temporary staging tables
CREATE TABLE staging_trips (
    route_id VARCHAR(50),
    service_id VARCHAR(50),
    trip_id VARCHAR(50),
    trip_headsign VARCHAR(200),
    direction_id INT,
    block_id VARCHAR(50),
    shape_id VARCHAR(50)
);

CREATE TABLE staging_stop_times (
    trip_id VARCHAR(50),
    arrival_time VARCHAR(20),
    departure_time VARCHAR(20),
    stop_id VARCHAR(50),
    stop_sequence INT,
    stop_headsign VARCHAR(200),
    pickup_type INT,
    drop_off_type INT,
    shape_dist_traveled NUMERIC(10,4),
    timepoint INT
);

-- Load the csv data into the staging tables
COPY staging_trips FROM '/tmp/gtfs-data/trips.txt' WITH (FORMAT csv, HEADER true);
COPY staging_stop_times FROM '/tmp/gtfs-data/stop_times.txt' WITH (FORMAT csv, HEADER true);

-- Use a Common Table Expression (CTE) to grab exactly one trip for every route_id
WITH FirstTrips AS (
    SELECT route_id, MIN(trip_id) as master_trip_id
    FROM staging_trips
    GROUP BY route_id
)
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset_min)
SELECT
    ft.route_id,
    sst.stop_id,
    sst.stop_sequence,
    (sst.stop_sequence * 2) -- Fake a 2-minute offset between every stop for our simulator
FROM FirstTrips ft
JOIN staging_stop_times sst ON ft.master_trip_id = sst.trip_id
ON CONFLICT (route_id, stop_id) DO NOTHING; -- Prevents crashes if a bus visits the same stop twice in a loop.

DROP TABLE staging_trips;
DROP TABLE staging_stop_times;