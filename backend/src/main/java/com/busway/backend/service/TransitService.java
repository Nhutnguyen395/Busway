package com.busway.backend.service;

import com.busway.backend.dto. RouteDetailsDto;
import com.busway.backend.entity.Route;
import com.busway.backend.entity.RouteStop;
import com.busway.backend.entity.Stop;
import com.busway.backend.repository.RouteRepository;
import com.busway.backend.repository.RouteStopRepository;
import com.busway.backend.repository.StopRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service // Tells spring boot that this the business logic brain
public class TransitService {

    // Use final to make it immutable once set
    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final StopRepository stopRepository;

    // Constructor-based Dependency Injection:
    // dependencies are passed as arguments to the class instructor
    public TransitService(RouteRepository routeRepository,
                          RouteStopRepository routeStopRepository,
                          StopRepository stopRepository) {
        this.routeRepository = routeRepository;
        this.routeStopRepository = routeStopRepository;
        this.stopRepository = stopRepository;
    }

    // Get route, finds all its stops, orders them, and package in into a DTO.
    public RouteDetailsDto getRouteDetails(String routeId) {
        // 1. Get the raw Route data from the database. Throws an error if it doesn't exist.
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found: " + routeId));

        // 2. Get the join table records (already in RouteStopRepository)
        //    A list of all the stops within the route.
        List<RouteStop> routeStops = routeStopRepository.findById_RouteIdOrderByStopOrderAsc(routeId);

        // 3. Build a list of Stop summaries
        //    Get the list of all the stops summaries within from the route.
        List<RouteDetailsDto.StopSummary> stopSummaries = new ArrayList<>();

        for (RouteStop rs : routeStops) {
            // Fetch the physical stop data from the ID in routeStops
            Stop stop = stopRepository.findById(rs.getId().getStopId())
                    .orElseThrow(() -> new RuntimeException("Stop not found: " + rs.getId().getStopId()));

            // Map the raw data to the DTO
            stopSummaries.add(new RouteDetailsDto.StopSummary(
                    stop.getId(),
                    stop.getName(),
                    stop.getLatitude(),
                    stop.getLongitude(),
                    rs.getStopOrder(),
                    rs.getArrivalOffsetMin()
            ));
        }

        // 4. Return the package
        return new RouteDetailsDto(
                route.getId(),
                route.getName(),
                route.getColorHex(),
                stopSummaries
        );
    }
}