# 1. Build the stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src. ./src
# Run the jar, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# 2. Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the built jar
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]