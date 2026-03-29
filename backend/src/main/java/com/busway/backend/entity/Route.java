package com.busway.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "routes")
public class Route {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "color_hex")
    private String colorHex;

    @Column(name = "status")
    private String status;

    // Constructors
    public Route() {}

    public Route(String id, String name, String description, String colorHex, String status) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.colorHex = colorHex;
        this.status = status;
    }

    // getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}