package com.busway.backend.service;

import com.busway.backend.dto.PathStopDto;
import com.busway.backend.graph.Edge;
import com.busway.backend.graph.Node;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RoutingEngineService {

    private final JdbcTemplate jdbcTemplate;
    private final Map<String, Node> graph = new HashMap<>();

    public RoutingEngineService(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initializeGraph(){
        // 1. Create Node for every single stop
        jdbcTemplate.query("SELECT id FROM stops", rs -> {
            String stopId = rs.getString("id");
            graph.put(stopId, new Node(stopId));
        });
        System.out.println("Loaded " + graph.size() + " Stops into Memory.");

        // 2. Build bus edges, connecting stops on the same route
        String busEdgeSql = """
                            SELECT route_id, stop_id, arrival_offset_min
                            FROM route_stops
                            ORDER BY route_id, stop_order
                            """;

        jdbcTemplate.query(busEdgeSql, rs -> {
            String currentRoute = null;
            Node previousNode = null;
            double previousTime = 0;

            do {
                String routeId = rs.getString("route_id");
                String stopId = rs.getString("stop_id");
                double arrivalTime = rs.getDouble("arrival_offset_min");

                Node currentNode = graph.get(stopId);

                // If we are on the same route, create a directed edge from the previous stop to this one
                if (routeId.equals(currentRoute) && previousNode != null && currentNode != null){
                    double travelTimeMins = Math.max(1.0, arrivalTime - previousTime); // Guaranteed at least 1 min travel time
                    previousNode.edges.add(new Edge(stopId, travelTimeMins, routeId));
                }

                currentRoute = routeId;
                previousNode = currentNode;
                previousTime = arrivalTime;
            } while (rs.next());
        });
        System.out.println("Loaded Bus Route Edges.");

        // 3. Build Walking Edges
        String walkingEdgesSql = """
            SELECT a.id AS from_stop, b.id AS to_stop,
                   ST_Distance(a.geom::geography, b.geom::geography) AS dist_meters
            FROM stops a
            JOIN stops b ON a.id != b.id
            WHERE ST_DWithin(a.geom::geography, b.geom::geography, 200)
        """;

        jdbcTemplate.query(walkingEdgesSql, rs -> {
            String fromStop = rs.getString("from_stop");
            String toStop = rs.getString("to_stop");
            double distanceMeters = rs.getDouble("dist_meters");

            Node nodeFrom = graph.get(fromStop);
            if (nodeFrom != null){
                // Average human walks 80 meters per minute
                double walkingTimeMins = distanceMeters / 80.0;
                nodeFrom.edges.add(new Edge(toStop, walkingTimeMins, "WALKING"));
            }
        });
        System.out.println("Loaded Walking Transfer Edges.");
    }

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

    public List<PathStopDto> getDetailedPath(String startStopId, String endStopId) {
        // 1. Get the IDs
        List<String> pathIds = calculateShortestPath(startStopId, endStopId);

        if (pathIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Convert the IDs into Coordinates Objects for the map
        List<PathStopDto> detailedPath = new ArrayList<>();
        String sql = "SELECT id, name, latitude, longitude FROM stops WHERE id = ?";
        for (String id : pathIds) {
            jdbcTemplate.query(sql, rs -> {
                detailedPath.add(new PathStopDto (
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getDouble("latitude"),
                        rs.getDouble("longitude")
                ));
            }, id);
        }
        return detailedPath;
    }
}
