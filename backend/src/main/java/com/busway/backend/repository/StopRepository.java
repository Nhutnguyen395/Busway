package com.busway.backend.repository;

import com.busway.backend.entity.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface StopRepository extends JpaRepository<Stop, String> {
    // Create this custom query to ask the database to calculate physical distance on the globe
    // nativeQuery being true sends the exact SQL string directly to PostgreSQL
    // ST_MakePoint(:longitude, :latitude): takes the raw GPS coordinates and create a spatial PostGIS Point Object
    // ST_SetSRID(..., 4326): 4326 is the standard WGS 84 GPS coordinates, not just random graph coordinates
    // ::geography: By casting to geography, POSTGIS calculates the curvature of the Earth and returns the distance in actual meters.
    // ST_DWithin(): checks if two spatial objects are within a certain distance of each other.
    @Query(value = """
        SELECT * FROM stops
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radiusInMeters
        )
        """, nativeQuery = true)
    List<Stop> findStopsWithinRadius(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radiusInMeters") double radiusInMeters
    );
}
