package com.busway.backend.dto;

public record PathStopDto(
        String stopId,
        String stopName,
        double lat,
        double lon
) {}