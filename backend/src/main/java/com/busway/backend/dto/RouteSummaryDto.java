package com.busway.backend.dto;

public record RouteSummaryDto(
        String routeId,
        String routeName,
        String colorHex
) {}