package com.busway.backend.controller;

import com.busway.backend.dto.RouteDetailsDto;
import com.busway.backend.dto.RouteSummaryDto;
import com.busway.backend.service.TransitService;
import com.busway.backend.service.RoutingEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transit")
@CrossOrigin(origins = "*")
public class TransitController {
    private final TransitService transitService;
    private final RoutingEngineService routingEngineService;

    public TransitController(TransitService transitService, RoutingEngineService routingEngineService){
        this.transitService = transitService;
        this.routingEngineService = routingEngineService;
    }

    @GetMapping("/routes")
    public ResponseEntity<List<RouteSummaryDto>> getAllRoutes() {
        return ResponseEntity.ok(transitService.getAllRoutes());
    }

    @GetMapping("/routes/{routeId}")
    public ResponseEntity<RouteDetailsDto> getRouteDetails(@PathVariable String routeId){
        try {
            RouteDetailsDto details = transitService.getRouteDetails(routeId);
            return ResponseEntity.ok(details); // Returns HTTP 200 OK with the JSON data
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/navigate")
    public ResponseEntity<List<String>> navigate(
            @RequestParam String startStopId,
            @RequestParam String endStopId) {
        List<String> optimalPathIds = routingEngineService.calculateShortestPath(startStopId, endStopId);
        return ResponseEntity.ok(optimalPathIds);
    }
}