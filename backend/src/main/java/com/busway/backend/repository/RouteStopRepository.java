package com.busway.backend.repository;

import com.busway.backend.entity.RouteStop;
import com.busway.backend.entity.RouteStopId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, RouteStopId> {
    // Finds all the stops for a specific route in the correct order.
    // naming like this findByRouteIdOrderByStopOrderAsc will cause an error since
    // an @EmbeddedId composite primary key was used, when it looks in the class RouteStop,
    // it cannot find routeId so we need to use an '_' which acts like '.' to tell spring to find
    // object before the underscore and open it up and look for the variable after the underscore
    List<RouteStop> findById_RouteIdOrderByStopOrderAsc(String routeId);
}
