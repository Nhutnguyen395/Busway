package com.busway.backend.repository;

import com.busway.backend.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    // By naming the method like this:
    // Spring writes the SQL: SELECT * FROM vehicles WHERE license_plate = ?
    Vehicle findByLicensePlate(String licensePlate);
}
