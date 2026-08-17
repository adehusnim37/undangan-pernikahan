ALTER TABLE invitation_media
  DROP CONSTRAINT IF EXISTS invitation_media_slot_check;

ALTER TABLE invitation_media
  ADD CONSTRAINT invitation_media_slot_check CHECK (slot IN (
    'hero_1', 'hero_2', 'hero_3', 'hero_4', 'hero_5', 'hero_6', 'hero_7',
    'couple_bride_portrait', 'couple_groom_portrait',
    'journey_school_portrait', 'journey_school_mark', 'journey_school_detail',
    'journey_campus_wide', 'journey_campus_small_a', 'journey_campus_small_b',
    'journey_distance_city', 'journey_distance_graduate',
    'journey_engagement_main', 'journey_engagement_ring', 'journey_wedding'
  ));
