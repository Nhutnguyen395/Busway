package com.busway.backend.entity;

import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;

@Entity
@Table(name = "stops")
public class Stop {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "latitude", nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false)
    private BigDecimal longitude;

    @Column(name = "geom", columnDefinition = "geometry(Point, 4326)")
    private Point geom;

    public Stop() {}

    public Stop(String id, String name, BigDecimal latitude, BigDecimal longitude, Point geom) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.geom = geom;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public Point getGeom() { return geom; }
    public void setGeom(Point geom) { this.geom = geom; }
}