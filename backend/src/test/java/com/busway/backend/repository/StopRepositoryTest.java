package com.busway.backend.repository;

import com.busway.backend.entity.Stop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// JUnit Test for insert a route and stop into the
// database and test out the spatial query.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // ensures that our container is used and not in-memory DB
public class StopRepositoryTest {
    // 1. Tell TestContainers to spin up the EXACT same image used in docker compose
    @Container
    static PostgreSQLContainer<?> postgisContainer = new PostgreSQLContainer<>(
            DockerImageName.parse("postgis/postgis:15-3.3-alpine")
                    .asCompatibleSubstituteFor("postgres")
    )
            .withDatabaseName("transit_test_db")
            .withUsername("test")
            .withPassword("test");

    // 2. Tell Spring Boot to dynamically change it application.properties to point to this temp container
    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgisContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgisContainer::getUsername);
        registry.add("spring.datasource.password", postgisContainer::getPassword);
    }

    @Autowired
    private StopRepository stopRepository;

    private GeometryFactory geometryFactory;

    @BeforeEach
    void setUp() {
        // SRID 4326 is the standard EPSG code for GPS tracking (WGS 84)
        geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    @Test
    void shouldFindStopWithinRadius() {
        // create a stop in Garden Grove, CA
        double stopLon = -117.9389;
        double stopLat = 33.7739;

        // JTS coordinate requires (Longitude, Latitude) order
        Point stopLocation = geometryFactory.createPoint(new Coordinate(stopLon, stopLat));

        Stop gardenGroveStop = new Stop(
                "stop_1",
                "Main Street & Garden Grove Blvd",
                BigDecimal.valueOf(stopLat),
                BigDecimal.valueOf(stopLon),
                stopLocation
        );
        stopRepository.save(gardenGroveStop);

        // Search exactly at the stop's location within a 500-meter radius
        List<Stop> foundStops = stopRepository.findStopsWithinRadius(stopLon, stopLat, 500.0);

        // Search 10 miles away within 500-meter radius
        List<Stop> notFoundStops = stopRepository.findStopsWithinRadius(-117.9145, 33.8366, 500.0);

        // verify that PostGIS math works correctly
        assertThat(foundStops).hasSize(1);
        assertThat(foundStops.get(0).getName()).isEqualTo("Main Street & Garden Grove Blvd");
        assertThat(notFoundStops).isEmpty();
    }
}