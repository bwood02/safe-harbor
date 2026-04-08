-- =========================================
-- Lighthouse Case Management System
-- Azure SQL Schema (No IDENTITY)
-- =========================================

-- SAFEHOUSES
CREATE TABLE safehouses (
    safehouse_id INT PRIMARY KEY,
    safehouse_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Philippines',
    open_date DATE,
    status VARCHAR(20),
    capacity_girls INT,
    capacity_staff INT,
    current_occupancy INT,
    notes NVARCHAR(MAX)
);

-- PARTNERS
CREATE TABLE partners (
    partner_id INT PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50),
    role_type VARCHAR(50),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    region VARCHAR(50),
    status VARCHAR(20),
    start_date DATE,
    end_date DATE,
    notes NVARCHAR(MAX)
);

-- SUPPORTERS
CREATE TABLE supporters (
    supporter_id INT PRIMARY KEY,
    supporter_type VARCHAR(50),
    display_name VARCHAR(255),
    organization_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    relationship_type VARCHAR(50),
    region VARCHAR(100),
    country VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20),
    created_at DATETIME2,
    first_donation_date DATE,
    acquisition_channel VARCHAR(50)
);

-- SOCIAL MEDIA POSTS
CREATE TABLE social_media_posts (
    post_id INT PRIMARY KEY,
    platform VARCHAR(50),
    platform_post_id VARCHAR(100),
    post_url NVARCHAR(MAX),
    created_at DATETIME2,
    day_of_week VARCHAR(15),
    post_hour INT,
    post_type VARCHAR(50),
    media_type VARCHAR(50),
    caption NVARCHAR(MAX),
    hashtags NVARCHAR(MAX),
    num_hashtags INT,
    mentions_count INT,
    has_call_to_action BIT,
    call_to_action_type VARCHAR(50),
    content_topic VARCHAR(50),
    sentiment_tone VARCHAR(50),
    caption_length INT,
    features_resident_story BIT,
    campaign_name VARCHAR(255),
    is_boosted BIT,
    boost_budget_php DECIMAL(15,2),
    impressions DECIMAL,
    reach DECIMAL,
    likes DECIMAL,
    comments DECIMAL,
    shares DECIMAL,
    saves DECIMAL,
    click_throughs DECIMAL,
    video_views DECIMAL,
    engagement_rate DECIMAL(10,6),
    profile_visits DECIMAL,
    donation_referrals DECIMAL,
    estimated_donation_value_php DECIMAL(15,2),
    follower_count_at_post DECIMAL,
    watch_time_seconds DECIMAL,
    avg_view_duration_seconds DECIMAL,
    subscriber_count_at_post DECIMAL,
    forwards DECIMAL
);

-- RESIDENTS
CREATE TABLE residents (
    resident_id INT PRIMARY KEY,
    case_control_no VARCHAR(50) UNIQUE,
    internal_code VARCHAR(50) UNIQUE,
    safehouse_id INT,
    case_status VARCHAR(20),
    sex CHAR(1) DEFAULT 'F',
    date_of_birth DATE,
    birth_status VARCHAR(50),
    place_of_birth VARCHAR(255),
    religion VARCHAR(100),
    case_category VARCHAR(50),

    sub_cat_orphaned BIT,
    sub_cat_trafficked BIT,
    sub_cat_child_labor BIT,
    sub_cat_physical_abuse BIT,
    sub_cat_sexual_abuse BIT,
    sub_cat_osaec BIT,
    sub_cat_cicl BIT,
    sub_cat_at_risk BIT,
    sub_cat_street_child BIT,
    sub_cat_child_with_hiv BIT,

    is_pwd BIT,
    pwd_type VARCHAR(100),
    has_special_needs BIT,
    special_needs_diagnosis NVARCHAR(MAX),

    family_is_4ps BIT,
    family_solo_parent BIT,
    family_indigenous BIT,
    family_parent_pwd BIT,
    family_informal_settler BIT,

    date_of_admission DATE,
    age_upon_admission VARCHAR(50),
    present_age VARCHAR(50),
    length_of_stay VARCHAR(50),
    referral_source VARCHAR(100),
    referring_agency_person VARCHAR(255),

    date_colb_registered DATE,
    date_colb_obtained DATE,

    assigned_social_worker VARCHAR(255),
    initial_case_assessment NVARCHAR(MAX),

    date_case_study_prepared DATE,
    reintegration_type VARCHAR(50),
    reintegration_status VARCHAR(50),

    initial_risk_level VARCHAR(20),
    current_risk_level VARCHAR(20),

    date_enrolled DATE,
    date_closed DATE,
    created_at DATETIME2,
    notes_restricted NVARCHAR(MAX),

    CONSTRAINT FK_residents_safehouses
        FOREIGN KEY (safehouse_id)
        REFERENCES safehouses(safehouse_id)
);

-- PARTNER ASSIGNMENTS
CREATE TABLE partner_assignments (
    assignment_id INT PRIMARY KEY,
    partner_id INT,
    safehouse_id INT,
    program_area VARCHAR(50),
    assignment_start DATE,
    assignment_end DATE,
    responsibility_notes NVARCHAR(MAX),
    is_primary BIT,
    status VARCHAR(20),

    CONSTRAINT FK_partner_assignments_partner
        FOREIGN KEY (partner_id) REFERENCES partners(partner_id),

    CONSTRAINT FK_partner_assignments_safehouse
        FOREIGN KEY (safehouse_id) REFERENCES safehouses(safehouse_id)
);

-- PROCESS RECORDINGS
CREATE TABLE process_recordings (
    recording_id INT PRIMARY KEY,
    resident_id INT,
    session_date DATE,
    social_worker VARCHAR(255),
    session_type VARCHAR(20),
    session_duration_minutes INT,
    emotional_state_observed VARCHAR(50),
    emotional_state_end VARCHAR(50),
    session_narrative NVARCHAR(MAX),
    interventions_applied NVARCHAR(MAX),
    follow_up_actions NVARCHAR(MAX),
    progress_noted BIT,
    concerns_flagged BIT,
    referral_made BIT,
    notes_restricted NVARCHAR(MAX),

    CONSTRAINT FK_process_recordings_resident
        FOREIGN KEY (resident_id) REFERENCES residents(resident_id)
);

-- HOME VISITATIONS
CREATE TABLE home_visitations (
    visitation_id INT PRIMARY KEY,
    resident_id INT,
    visit_date DATE,
    social_worker VARCHAR(255),
    visit_type VARCHAR(50),
    location_visited NVARCHAR(MAX),
    family_members_present NVARCHAR(MAX),
    purpose NVARCHAR(MAX),
    observations NVARCHAR(MAX),
    family_cooperation_level VARCHAR(50),
    safety_concerns_noted BIT,
    follow_up_needed BIT,
    follow_up_notes NVARCHAR(MAX),
    visit_outcome VARCHAR(50),

    CONSTRAINT FK_home_visitations_resident
        FOREIGN KEY (resident_id) REFERENCES residents(resident_id)
);

-- EDUCATION RECORDS
CREATE TABLE education_records (
    education_record_id INT PRIMARY KEY,
    resident_id INT,
    record_date DATE,
    education_level VARCHAR(50),
    school_name VARCHAR(255),
    enrollment_status VARCHAR(50),
    attendance_rate DECIMAL(3,2),
    progress_percent DECIMAL(5,2),
    completion_status VARCHAR(20),
    notes NVARCHAR(MAX),

    CONSTRAINT FK_education_resident
        FOREIGN KEY (resident_id) REFERENCES residents(resident_id)
);

-- HEALTH RECORDS
CREATE TABLE health_wellbeing_records (
    health_record_id INT PRIMARY KEY,
    resident_id INT,
    record_date DATE,
    general_health_score DECIMAL(3,2),
    nutrition_score DECIMAL(3,2),
    sleep_quality_score DECIMAL(3,2),
    energy_level_score DECIMAL(3,2),
    height_cm DECIMAL(6,2),
    weight_kg DECIMAL(6,2),
    bmi DECIMAL(5,2),
    medical_checkup_done BIT,
    dental_checkup_done BIT,
    psychological_checkup_done BIT,
    notes NVARCHAR(MAX),

    CONSTRAINT FK_health_resident
        FOREIGN KEY (resident_id) REFERENCES residents(resident_id)
);

-- INTERVENTION PLANS
CREATE TABLE intervention_plans (
    plan_id INT PRIMARY KEY,
    resident_id INT,
    plan_category VARCHAR(50),
    plan_description NVARCHAR(MAX),
    services_provided NVARCHAR(MAX),
    target_value DECIMAL(15,2),
    target_date DATE,
    status VARCHAR(20),
    case_conference_date DATE,
    created_at DATETIME2,
    updated_at DATETIME2,

    CONSTRAINT FK_intervention_resident
        FOREIGN KEY (resident_id) REFERENCES residents(resident_id)
);

-- INCIDENT REPORTS
CREATE TABLE incident_reports (
    incident_id INT PRIMARY KEY,
    resident_id INT,
    safehouse_id INT,
    incident_date DATE,
    incident_type VARCHAR(50),
    severity VARCHAR(20),
    description NVARCHAR(MAX),
    response_taken NVARCHAR(MAX),
    resolved BIT,
    resolution_date DATE,
    reported_by VARCHAR(255),
    follow_up_required BIT,

    CONSTRAINT FK_incident_resident
        FOREIGN KEY (resident_id) REFERENCES residents(resident_id),

    CONSTRAINT FK_incident_safehouse
        FOREIGN KEY (safehouse_id) REFERENCES safehouses(safehouse_id)
);

-- DONATIONS
CREATE TABLE donations (
    donation_id INT PRIMARY KEY,
    supporter_id INT,
    donation_type VARCHAR(50),
    donation_date DATE,
    is_recurring BIT,
    campaign_name VARCHAR(255),
    channel_source VARCHAR(50),
    currency_code CHAR(3),
    amount DECIMAL(15,2),
    estimated_value DECIMAL(15,2),
    impact_unit VARCHAR(50),
    notes NVARCHAR(MAX),
    referral_post_id INT,

    CONSTRAINT FK_donations_supporter
        FOREIGN KEY (supporter_id) REFERENCES supporters(supporter_id),

    CONSTRAINT FK_donations_post
        FOREIGN KEY (referral_post_id) REFERENCES social_media_posts(post_id)
);

-- IN-KIND ITEMS
CREATE TABLE in_kind_donation_items (
    item_id INT PRIMARY KEY,
    donation_id INT,
    item_name VARCHAR(255),
    item_category VARCHAR(50),
    quantity INT,
    unit_of_measure VARCHAR(20),
    estimated_unit_value DECIMAL(15,2),
    intended_use VARCHAR(100),
    received_condition VARCHAR(50),

    CONSTRAINT FK_items_donation
        FOREIGN KEY (donation_id) REFERENCES donations(donation_id)
);

-- DONATION ALLOCATIONS
CREATE TABLE donation_allocations (
    allocation_id INT PRIMARY KEY,
    donation_id INT,
    safehouse_id INT,
    program_area VARCHAR(50),
    amount_allocated DECIMAL(15,2),
    allocation_date DATE,
    allocation_notes NVARCHAR(MAX),

    CONSTRAINT FK_allocations_donation
        FOREIGN KEY (donation_id) REFERENCES donations(donation_id),

    CONSTRAINT FK_allocations_safehouse
        FOREIGN KEY (safehouse_id) REFERENCES safehouses(safehouse_id)
);

-- SAFEHOUSE METRICS
CREATE TABLE safehouse_monthly_metrics (
    metric_id INT PRIMARY KEY,
    safehouse_id INT,
    month_start DATE,
    month_end DATE,
    active_residents INT,
    avg_education_progress DECIMAL(5,2),
    avg_health_score DECIMAL(3,2),
    process_recording_count INT,
    home_visitation_count INT,
    incident_count INT,
    notes NVARCHAR(MAX),

    CONSTRAINT FK_metrics_safehouse
        FOREIGN KEY (safehouse_id) REFERENCES safehouses(safehouse_id)
);

-- IMPACT SNAPSHOTS
CREATE TABLE public_impact_snapshots (
    snapshot_id INT PRIMARY KEY,
    snapshot_date DATE,
    headline VARCHAR(255),
    summary_text NVARCHAR(MAX),
    metric_payload_json NVARCHAR(MAX),
    is_published BIT,
    published_at DATE
);
