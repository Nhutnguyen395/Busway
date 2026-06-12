package com.busway.backend.graph;

public class Edge {
    public final String targetStopId;
    public final double weight; // Time in minutes
    public final String routeId; // Which bus we are on, or "WALKING"

    public Edge(String targetStopId, double weight, String routeId) {
        this.targetStopId = targetStopId;
        this.weight = weight;
        this.routeId = routeId;
    }
}