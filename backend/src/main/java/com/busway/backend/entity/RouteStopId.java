package com.busway.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

// @Embeddable is used to define a class to implement composite primary keys
@Embeddable
public class RouteStopId implements Serializable {
    @Column(name = "route_id")
    private String routeId;

    @Column(name = "stop_id")
    private String stopId;

    public RouteStopId() {}

    public RouteStopId(String routeId, String stopId) {
        this.routeId = routeId;
        this.stopId = stopId;
    }

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }

    public String getStopId() { return stopId; }
    public void setStopId(String stopId) { this.stopId = stopId; }

    // Hibernate requires these two methods to compare composite keys correctly
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RouteStopId that = (RouteStopId) o;
        return Objects.equals(routeId, that.routeId) && Objects.equals(stopId, that.stopId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(routeId, stopId);
    }
}