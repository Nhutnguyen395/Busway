package com.busway.backend.graph;

import java.util.ArrayList;
import java.util.List;

public class Node {
    public final String stopId;
    public final List<Edge> edges = new ArrayList<>();

    // Used to Dijkstra's state during calculation
    public double minDistance = Double.POSITIVE_INFINITY;
    public Node previous;
    public Edge edgeToReachHere;

    public Node(String stopId){
        this.stopId = stopId;
    }
}
