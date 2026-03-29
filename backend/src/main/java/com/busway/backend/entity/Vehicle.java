package com.busway.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.sql.ClientInfoStatus;

@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "license_plate", unique = true, nullable = false)
    private String licensePlate;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status")
    private String status;

    // Constructors
    // JPA requires a default non-argument constructor
    public Vehicle() {}

    public Vehicle(String id, String licensePlate, Integer capacity, String status) {
        this.id = id;
        this.licensePlate = licensePlate;
        this.capacity = capacity;
        this.status = status;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.id = id; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}