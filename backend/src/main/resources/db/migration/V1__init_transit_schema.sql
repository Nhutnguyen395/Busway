CREATE TABLE routes
(
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    description TEXT,
    color_hex   VARCHAR(7)  DEFAULT '#3B82F6',
    status      VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE stops (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    geom geometry(Point, 4326)
);

CREATE TABLE route_stops (
    route_id VARCHAR(50) REFERENCES routes(id),
    stop_id VARCHAR(50) REFERENCES stops(id),
    stop_order INT NOT NULL,
    arrival_offset_min INT DEFAULT 0,
    PRIMARY KEY (route_id, stop_id)
);

CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    capacity INT DEFAULT 40,
    status VARCHAR(20) DEFAULT 'IN SERVICE'
);