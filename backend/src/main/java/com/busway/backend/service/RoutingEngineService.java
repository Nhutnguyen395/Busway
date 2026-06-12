package com.busway.backend.service;

import com.busway.backend.graph.Edge;
import com.busway.backend.graph.Node;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RoutingEngineService {
    // The map of every stop in the database
    private final Map<String, Node> graph = new HashMap<>();

    // Algorithm to calculate the shortest path
    public List<String> calculateShortestPath(String startStopId, String endStopId){
        // 1. Reset the graph state for a fresh calculation
        for (Node node : graph.values()){
            node.minDistance = Double.POSITIVE_INFINITY;
            node.previous = null;
            node.edgeToReachHere = null;
        }

        Node source = graph.get(startStopId);
        if (source == null) return Collections.emptyList();

        source.minDistance = 0;

        // 2. The Priority Queue (Always look at the closest unvisited stop next)
        PriorityQueue<Node> queue = new PriorityQueue<>(Comparator.comparingDouble(n -> n.minDistance));
        queue.add(source);

        while (!queue.isEmpty()) {
            Node current = queue.poll();
            // if destination is found, stop calculating
            if (current.stopId.equals(endStopId)) { break; }

            // 3. Evaluate all the neighbors
            for (Edge edge : current.edges) {
                Node neighbor = graph.get(edge.targetStopId);
                if (neighbor == null) continue;

                // add a time penalty if the user has to switch buses
                double transferPenalty = 0;
                if (current.edgeToReachHere != null && !current.edgeToReachHere.routeId.equals(edge.routeId)){
                    transferPenalty = 5.0; // add 5 minutes penalty for wait for next bus
                }

                double distanceThroughCurrent = current.minDistance + edge.weight + transferPenalty;

                // if we found a faster way to get to this neighbor, update it
                if (distanceThroughCurrent < neighbor.minDistance){
                    queue.remove(neighbor);
                    neighbor.minDistance = distanceThroughCurrent;
                    neighbor.previous = current;
                    neighbor.edgeToReachHere = edge;
                    queue.add(neighbor);
                }
            }
        }
        // 4. Backtrack from the destination to build the final path.
        return buildPath(endStopId);
    }

    private List<String> buildPath(String endStopId){
        List<String> path = new ArrayList<>();
        Node target = graph.get(endStopId);

        if (target == null || target.previous == null) {
            return path; // no path found
        }

        for (Node node = target; node != null; node = node.previous) {
            path.add(node.stopId);
        }

        Collections.reverse(path); // reverse because it is backtracked from end to start
        return path;
    }
}
