// Strava API response types
export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: ActivityType;
  sport_type: string;
  start_date: string; // ISO 8601
  start_date_local: string;
  timezone: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  elev_high?: number;
  elev_low?: number;
  suffer_score?: number;
  calories?: number;
  kilojoules?: number;
  workout_type?: number; // For runs: 0=default, 1=race, 2=long run, 3=workout
  kudos_count?: number;
  map?: {
    id: string;
    summary_polyline?: string;
    resource_state: number;
  };
}

export type ActivityType =
  | 'Run'
  | 'Ride'
  | 'Swim'
  | 'VirtualRide'
  | 'Walk'
  | 'Hike'
  | 'AlpineSki'
  | 'BackcountrySki'
  | 'Canoeing'
  | 'Crossfit'
  | 'EBikeRide'
  | 'Elliptical'
  | 'IceSkate'
  | 'InlineSkate'
  | 'Kayaking'
  | 'Kitesurf'
  | 'NordicSki'
  | 'RockClimbing'
  | 'RollerSki'
  | 'Rowing'
  | 'Snowboard'
  | 'Snowshoe'
  | 'StairStepper'
  | 'StandUpPaddling'
  | 'Surfing'
  | 'WeightTraining'
  | 'Windsurf'
  | 'Workout'
  | 'Yoga';

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

export interface StravaStats {
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
  recent_ride_totals: ActivityTotals;
  recent_run_totals: ActivityTotals;
  recent_swim_totals: ActivityTotals;
  ytd_ride_totals: ActivityTotals;
  ytd_run_totals: ActivityTotals;
  ytd_swim_totals: ActivityTotals;
  all_ride_totals: ActivityTotals;
  all_run_totals: ActivityTotals;
  all_swim_totals: ActivityTotals;
}

export interface ActivityTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}
