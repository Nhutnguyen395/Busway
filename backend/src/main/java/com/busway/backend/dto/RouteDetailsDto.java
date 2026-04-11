package com.busway.backend.dto;

import java.math.BigDecimal;
import java.util.List;

// Create a Record which is a type of class used to transfer immutable data.
// It automatically creates getters, equals(), and hashCode().
public record RouteDetailsDto(String routeId, String routeName, String colorHex, List<StopSummary> stops) {
    // Can nest records inside record, this is the StopSummary to represents the ordered stops.
    public record StopSummary(String stopId, String routeName, BigDecimal lat, BigDecimal lon,
                              Integer stopOrder, Integer arrivalDestination) {}
}