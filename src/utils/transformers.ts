import type { StravaActivity } from '../types/strava.ts';
import type { Activity } from '../types/activity.ts';

// DRY: Transform Strava API responses to domain model
export const transformActivity = (stravaActivity: StravaActivity): Activity => {
  return {
    id: stravaActivity.id.toString(),
    name: stravaActivity.name,
    type: stravaActivity.type,
    date: new Date(stravaActivity.start_date),
    distanceKm: stravaActivity.distance / 1000,
    durationMinutes: stravaActivity.elapsed_time / 60,
    movingTimeMinutes: stravaActivity.moving_time / 60,
    elevationGainMeters: stravaActivity.total_elevation_gain,
    averageSpeedKmh: stravaActivity.average_speed * 3.6,
    maxSpeedKmh: stravaActivity.max_speed * 3.6,
    averageHeartRate: stravaActivity.average_heartrate,
    maxHeartRate: stravaActivity.max_heartrate,
    sufferScore: stravaActivity.suffer_score,
    polyline: stravaActivity.map?.summary_polyline,
    workoutType: stravaActivity.workout_type,
  };
};

export const transformActivities = (stravaActivities: StravaActivity[]): Activity[] => {
  return stravaActivities.map(transformActivity);
};
