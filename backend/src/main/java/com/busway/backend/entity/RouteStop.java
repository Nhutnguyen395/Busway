package com.busway.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "route_stops")
public class RouteStop {
    @EmbeddedId
    private RouteStopId id;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "arrival_offset_min")
    private Integer arrivalOffsetMin;

    public RouteStop() {}

    public RouteStop(RouteStopId id, Integer stopOrder, Integer arrivalOffsetMin) {
        this.id = id;
        this.stopOrder = stopOrder;
        this.arrivalOffsetMin = arrivalOffsetMin;
    }

    public RouteStopId getId() { return id; }
    public void setId(RouteStopId id) { this.id = id; }

    public Integer getStopOrder() { return stopOrder; }
    public void setStopOrder(Integer stopOrder) { this.stopOrder = stopOrder; }

    public Integer getArrivalOffsetMin() { return arrivalOffsetMin; }
    public void setArrivalOffsetMin(Integer arrivalOffsetMin) { this.arrivalOffsetMin = arrivalOffsetMin; }
}