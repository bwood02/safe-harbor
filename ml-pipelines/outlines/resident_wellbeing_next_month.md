# Strategy: Case Management & Resident Wellbeing
**Goal:** Prevent "Girls Falling Through the Cracks."

## 1. Feature Engineering (The Wellness Index)
To track progress vs. struggle, create a `composite_wellness_score`:
- **Formula:** Simple **mean** of `general_health_score`, `sleep_quality_score`, `nutrition_score`, and `energy_level_score` (columns in `health_wellbeing_records`).
- **Trend Features:** Calculate `wellness_diff_30d` (Current Month - Previous Month).

## 2. Defining "Struggling" (The Target)
A resident is flagged as "Struggling" if:
- They have an `incident_report` with `severity_level > 3`.
- Their `emotional_state_end` is "Distressed" or "Withdrawn" for two consecutive sessions.
- Their `composite_wellness_score` drops by more than 20% in a month.

## 3. Relationships to Explore
- **Dosage:** Does `session_duration_minutes` (from `process_recordings`) correlate with an increase in `wellness_score`?
- **Stability:** Does a high `attendance_rate` (from `education_records`) predict a lower likelihood of `incident_reports`?
- **Intervention:** Compare the impact of `home_visitation_count` vs. `process_recording_count`.

## 4. Business Application
The output should be a "Resident Risk Dashboard" that ranks girls by their predicted probability of a negative incident next month.