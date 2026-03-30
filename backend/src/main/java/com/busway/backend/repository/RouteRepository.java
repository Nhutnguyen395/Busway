package com.busway.backend.repository;

import com.busway.backend.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RouteRepository extends JpaRepository<Route, String>{
    // save(), findAll(), findById() automatically included with JpaRepository<Route, String>
}