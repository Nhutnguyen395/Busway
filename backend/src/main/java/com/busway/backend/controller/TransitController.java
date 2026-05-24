package com.busway.backend.controller;

import com.busway.backend.dto.RouteDetailsDto;
import com.busway.backend.service.TransitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transit")
@CrossOrigin(origins = "*")
public class TransitController {
    private final TransitService transitService;

    public TransitController(TransitService transitService){
        this.transitService = transitService;
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
}
