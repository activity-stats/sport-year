import { describe, it, expect } from 'vitest';
import { detectTriathlons, detectRaceHighlights } from '../raceDetection';
import type { Activity } from '../../types';

describe('Triathlon Display Bug', () => {
  it('should show total distance for regular triathlons with "Total Distance" label', () => {
    // Create a 1/8 triathlon (super sprint) - 400m swim, 10km bike, 2.5km run
    const baseDate = new Date('2024-06-09T08:00:00Z');

    const swim: Activity = {
      id: '10337',
      name: '1/8 Triathlon - Swim 🏊',
      type: 'Swim',
      distanceKm: 0.4, // 400m swim
      durationMinutes: 8.03,
      movingTimeMinutes: 8.03,
      elevationGainMeters: 0,
      averageSpeedKmh: 2.99,
      maxSpeedKmh: 3.5,
      date: baseDate,
      workoutType: 1,
    };

    const bike: Activity = {
      id: '10338',
      name: '1/8 Triathlon - Bike 🚴',
      type: 'Ride',
      distanceKm: 10.0, // 10km bike
      durationMinutes: 20,
      movingTimeMinutes: 20,
      elevationGainMeters: 100,
      averageSpeedKmh: 30.0,
      maxSpeedKmh: 35.0,
      date: new Date(baseDate.getTime() + 600 * 1000), // 10 min after swim
      workoutType: 1,
    };

    const run: Activity = {
      id: '10339',
      name: '1/8 Triathlon - Run 🏃 🏁',
      type: 'Run',
      distanceKm: 2.5, // 2.5km run
      durationMinutes: 10.5,
      movingTimeMinutes: 10.5,
      elevationGainMeters: 50,
      averageSpeedKmh: 14.3,
      maxSpeedKmh: 16.0,
      date: new Date(baseDate.getTime() + 1800 * 1000), // 30 min after swim
      workoutType: 1,
    };

    const activities = [swim, bike, run];

    // Detect triathlons
    const triathlons = detectTriathlons(activities);

    // Should detect 1 triathlon
    expect(triathlons).toHaveLength(1);

    const tri = triathlons[0];

    // The triathlon OBJECT should have totalDistance = sum of all legs
    expect(tri.totalDistance).toBeCloseTo(12.9, 1); // 0.4 + 10 + 2.5 = 12.9

    // Should have total elevation
    expect(tri.totalElevation).toBe(150); // 0 + 100 + 50

    // Create race highlights
    const highlights = detectRaceHighlights(activities);

    // Find the triathlon highlight
    const triathlonHighlight = highlights.find((h) => h.type === 'triathlon');
    expect(triathlonHighlight).toBeDefined();

    // The highlight shows total distance with "Total Distance" label (this is correct)
    expect(triathlonHighlight?.distance).toBe(12.9);
    expect(triathlonHighlight?.elevation).toBe(150);

    // EXPECTED BEHAVIOR:
    // Shows "1/8 Triathlon - Swim 🏊" with label "Total Distance: 12.9 km"
    // And below it shows the individual splits: 0.4km, 10km, 2.5km
  });

  it('should show correct individual distances for each triathlon leg', () => {
    const baseDate = new Date('2024-06-09T08:00:00Z');

    const swim: Activity = {
      id: '10337',
      name: '1/8 Triathlon - Swim 🏊',
      type: 'Swim',
      distanceKm: 0.4,
      durationMinutes: 8.03,
      movingTimeMinutes: 8.03,
      elevationGainMeters: 0,
      averageSpeedKmh: 2.99,
      maxSpeedKmh: 3.5,
      date: baseDate,
      workoutType: 1,
    };

    const bike: Activity = {
      id: '10338',
      name: '1/8 Triathlon - Bike 🚴',
      type: 'Ride',
      distanceKm: 10.0,
      durationMinutes: 20,
      movingTimeMinutes: 20,
      elevationGainMeters: 100,
      averageSpeedKmh: 30.0,
      maxSpeedKmh: 35.0,
      date: new Date(baseDate.getTime() + 600 * 1000),
      workoutType: 1,
    };

    const run: Activity = {
      id: '10339',
      name: '1/8 Triathlon - Run 🏃 🏁',
      type: 'Run',
      distanceKm: 2.5,
      durationMinutes: 10.5,
      movingTimeMinutes: 10.5,
      elevationGainMeters: 50,
      averageSpeedKmh: 14.3,
      maxSpeedKmh: 16.0,
      date: new Date(baseDate.getTime() + 1800 * 1000),
      workoutType: 1,
    };

    const activities = [swim, bike, run];
    const highlights = detectRaceHighlights(activities);

    const triathlonHighlight = highlights.find((h) => h.type === 'triathlon');

    // The triathlon highlight should include the activities array
    expect(triathlonHighlight?.activities).toHaveLength(3);

    // Each activity should retain its INDIVIDUAL distance
    const swimActivity = triathlonHighlight?.activities?.find((a) => a.type === 'Swim');
    const bikeActivity = triathlonHighlight?.activities?.find((a) => a.type === 'Ride');
    const runActivity = triathlonHighlight?.activities?.find((a) => a.type === 'Run');

    expect(swimActivity?.distanceKm).toBe(0.4);
    expect(bikeActivity?.distanceKm).toBe(10.0);
    expect(runActivity?.distanceKm).toBe(2.5);

    // The UI should use these individual distances when displaying each leg
    // AND use highlight.distance with "Total Distance" label for the total
  });

  it('should show elevation instead of distance for mountain triathlons', () => {
    // Create a mountain triathlon with >1000m elevation
    const baseDate = new Date('2024-05-19T08:00:00Z');

    const swim: Activity = {
      id: '10334',
      name: 'T100 Triathlon - Swim 🏊',
      type: 'Swim',
      distanceKm: 1.9,
      durationMinutes: 38,
      movingTimeMinutes: 38,
      elevationGainMeters: 50, // Some elevation in open water
      averageSpeedKmh: 3.0,
      maxSpeedKmh: 3.5,
      date: baseDate,
      workoutType: 1,
    };

    const bike: Activity = {
      id: '10335',
      name: 'T100 Triathlon - Bike 🚴',
      type: 'Ride',
      distanceKm: 90.0,
      durationMinutes: 180,
      movingTimeMinutes: 180,
      elevationGainMeters: 1200, // Mountainous bike course
      averageSpeedKmh: 30.0,
      maxSpeedKmh: 45.0,
      date: new Date(baseDate.getTime() + 2400 * 1000),
      workoutType: 1,
    };

    const run: Activity = {
      id: '10336',
      name: 'T100 Triathlon - Run 🏃 🏆',
      type: 'Run',
      distanceKm: 21.1,
      durationMinutes: 98,
      movingTimeMinutes: 98,
      elevationGainMeters: 300, // Hilly run course
      averageSpeedKmh: 12.9,
      maxSpeedKmh: 15.0,
      date: new Date(baseDate.getTime() + 13200 * 1000),
      workoutType: 1,
    };

    const activities = [swim, bike, run];

    // Detect triathlons
    const triathlons = detectTriathlons(activities);

    expect(triathlons).toHaveLength(1);

    const tri = triathlons[0];

    // Total elevation should be > 1000m
    expect(tri.totalElevation).toBe(1550); // 50 + 1200 + 350

    // Should be classified as mountain type
    expect(tri.type).toBe('mountain');

    // Still has distance data
    expect(tri.totalDistance).toBeCloseTo(113.0, 1); // 1.9 + 90 + 21.1

    // Create race highlights
    const highlights = detectRaceHighlights(activities);

    const triathlonHighlight = highlights.find((h) => h.type === 'triathlon');
    expect(triathlonHighlight).toBeDefined();

    // Should have elevation data
    expect(triathlonHighlight?.elevation).toBe(1550);

    // Badge should indicate mountain triathlon
    expect(triathlonHighlight?.badge).toContain('Mountain Triathlon');

    // EXPECTED UI BEHAVIOR:
    // Shows "T100 Triathlon - Swim 🏊" with:
    // - Label: "Total Elevation" (not "Total Distance")
    // - Value: "1600 m" (not "113.0 km")
    // - Splits still show individual distances: 1.9km, 90km, 21.1km
  });
});
