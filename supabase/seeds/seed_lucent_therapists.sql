-- =============================================================================
-- Lucent Referral Partners — Directory Seed
-- Run this in the Supabase SQL editor (requires service role / SQL editor access).
--
-- What this does:
--   1. Removes the three placeholder therapist accounts (Maya, Julian, Nina).
--   2. Inserts 25 real referral-partner profiles as active, approved members.
--      Each therapist gets an auth.users row (email-only, no password) so the
--      magic-link login flow will work when they are ready to claim their profile.
-- =============================================================================

do $$
declare
  v_id uuid;
begin

  -- -----------------------------------------------------------------------
  -- 1. Remove placeholder entries
  -- -----------------------------------------------------------------------
  delete from auth.users
  where id in (
    select id from public.profiles
    where slug in ('maya-hernandez-lcsw', 'julian-park-lpc', 'nina-patel-lmft')
  );

  -- -----------------------------------------------------------------------
  -- 2. Helper: create_therapist(email, full_name, slug, city,
  --            display_name, credentials, bio, approach_summary,
  --            specialties, populations, communities, insurance,
  --            payment_model, therapy_style_tags, neighborhoods,
  --            in_person, telehealth, availability,
  --            public_email, public_phone, website_url)
  --
  --    Called inline below for each therapist.
  -- -----------------------------------------------------------------------

  -- Lee Holley
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'leeholleylcsw@gmail.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Lee Holley', 'lee-holley', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Lee Holley', 'LCSW, LCDC',
    'Lee specializes in substance use disorders, harm reduction, and community integration—offering a non-judgmental, recovery-oriented approach to clients at every stage of change.',
    array['Substance Use Disorders','Harm Reduction','Mood Disorders','Chronic Relapse'],
    array['Out of network (superbill provided)'],
    'private_pay', array['CAMS','EFFT','Harm Reduction'], array['Adults','Recovery'], array[]::text[],
    array['Austin'],
    'Recovery-oriented harm reduction using CAMS and EFFT. Strong with chronic relapse and community integration.',
    true, true, 'accepting', true, true,
    'leeholleylcsw@gmail.com', '(512) 348-7820', 'https://www.holley-counseling.com/');

  -- Adriana Loya
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'adriana@hemlockhealingtherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Adriana Loya', 'adriana-loya', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Adriana Loya', 'LPC-A, LCDC',
    'Adriana works with emerging adults navigating substance use, trauma, and attachment wounds—with particular care for clients building new coping foundations.',
    array['Substance Use Disorders','Trauma','Attachment','Depression'],
    array['Aetna','Optum','Cigna','Quest Behavioral Health','United Healthcare'],
    'insurance', array['Attachment-informed','Trauma-informed'], array['Emerging Adults','Adults'], array[]::text[],
    array['Austin'],
    'Warm, attachment-informed care that meets clients where they are. Strong with emerging adults, SUD, and depression.',
    false, true, 'accepting', true, true,
    'adriana@hemlockhealingtherapy.com', '(512) 273-3816', 'https://www.hemlocktherapy.com/');

  -- Ariel Peters-Angelucci
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'arielpalcsw@apapsychotherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Ariel Peters-Angelucci', 'ariel-peters-angelucci', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Ariel Peters-Angelucci', 'LCSW',
    'Ariel helps clients heal from childhood trauma, addiction, and toxic family dynamics through somatic-aware, trauma-focused care.',
    array['Childhood Trauma','Addiction / Recovery','Co-dependency','Reparenting'],
    array['Aetna','BCBS (PPO)','Cigna / Evernorth','United Healthcare / Optum','Oscar','Oxford','UMR','Quest Behavioral','Ascension'],
    'insurance', array['EMDR','DBT','CPT'], array['Adults'], array[]::text[],
    array['Austin'],
    'EMDR, DBT, and CPT-trained with a focus on reparenting, co-dependency, and recovery. Telehealth only.',
    false, true, 'accepting', true, true,
    'arielpalcsw@apapsychotherapy.com', '(210) 695-0717', 'https://www.perfectlyimperfect-therapy.net');

  -- Easton Falke
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'easton@pathwaysgroupcc.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Easton Falke', 'easton-falke', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Easton Falke', 'LPC',
    'Easton works with adults navigating trauma, anxiety, and men''s mental health—offering evidence-based care with a collaborative, strength-focused approach.',
    array['Trauma','Anxiety','Men''s Issues','Substance Use Disorders','Self-Harm'],
    array['Aetna','BCBS','Cigna / Evernorth','Magellan','Optum','Scott & White','United','Humana','Tricare'],
    'both', array['EMDR','CBT','Collaborative'], array['Adults','Men'], array[]::text[],
    array['Austin'],
    'EMDR and CBT-trained with strength in men''s issues, emotion regulation, and SUD.',
    true, true, 'accepting', true, true,
    'easton@pathwaysgroupcc.com', '(512) 688-4303', 'https://www.pathwaysgroupcc.com/team/easton-falke');

  -- Lindley Gentile
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'lindley@austincouplesconcierge.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Lindley Gentile', 'lindley-gentile', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Lindley Gentile', 'LMFT',
    'Lindley specializes in women''s development, couples and relationships, and sex and intimacy—offering thoughtful, depth-oriented care.',
    array['Couples & Relationships','Women''s Development','Sex & Intimacy'],
    array['Out of network (superbill provided)'],
    'private_pay', array['Relational','Depth-oriented'], array['Adults','Couples','Women'], array[]::text[],
    array['Austin'],
    'Relationally grounded, with particular skill in couples, sex and intimacy, and women in life transitions.',
    false, true, 'accepting', true, true,
    'lindley@austincouplesconcierge.com', '(512) 626-3298', 'https://www.lindleygentile.com/');

  -- Tameka Thompson
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'tamekat@xcellencecounselingandwellness.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Tameka Thompson', 'tameka-thompson', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Tameka Thompson', 'LPC-S',
    'Tameka works with individuals and families navigating anxiety, depression, grief, and trauma—with specialized training in parent-child interaction and trauma-focused CBT.',
    array['Anxiety','Depression','Grief / Loss','Trauma','Mindfulness'],
    array['Aetna','BCBS of Texas','Cigna','Oscar','Oxford','United Healthcare'],
    'both', array['PCIT','TF-CBT','Solution-Focused','Mindfulness'], array['Adults','Families','Athletes','POC'], array['BIPOC'],
    array['Austin'],
    'Solution-focused, mindfulness-informed, trained in PCIT and TF-CBT. Especially effective with POC clients and families.',
    false, true, 'accepting', true, true,
    'tamekat@xcellencecounselingandwellness.com', '(512) 761-6358', 'https://www.xcellencecounselingandwellness.com/');

  -- Ali Putnam
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'therapy@aliputnam.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Ali Putnam', 'ali-putnam', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Ali Putnam', 'LMFT',
    'Ali is a Gottman-certified couples therapist working with married and partnered adults on infidelity, SUD, anxiety, and relationship repair.',
    array['Couples & Relationships','Infidelity','Substance Use Disorders','Anxiety','Women''s Issues'],
    array['Out of network'],
    'private_pay', array['Gottman','Relational'], array['Adults','Couples'], array[]::text[],
    array['Austin'],
    'Gottman-informed, with strong specialization in couples, premarital therapy, infidelity recovery, and women''s issues. Limited availability.',
    true, true, 'waitlist', true, true,
    'therapy@aliputnam.com', '512-766-0558', 'https://aliputnam.com/');

  -- Amanda Allard
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'amanda@eightarmstherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Amanda Allard', 'amanda-allard', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Amanda Allard', 'LPC-A, ATR-P, LCDC',
    'Amanda integrates art therapy, music, and experiential approaches with trauma-informed and DBT-based care—specializing in addiction, process addiction, and identity work.',
    array['Addiction','Process Addiction','Art Therapy','Trauma','Identity'],
    array['Out of network (superbill provided)'],
    'private_pay', array['Art Therapy','DBT','Experiential','Attachment'], array['Adults'], array[]::text[],
    array['Austin'],
    'Art therapy and experiential modalities alongside DBT and attachment frameworks. Effective for clients who benefit from creative, hands-on work.',
    true, true, 'accepting', true, true,
    'amanda@eightarmstherapy.com', '(352) 262-8184', 'https://eightarmstherapy.com');

  -- Ana Maria Cabezas
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'anamaria@austinbilingualtherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Ana Maria Cabezas', 'ana-maria-cabezas', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Ana Maria Cabezas', 'LPC-S',
    'Ana Maria provides bilingual (Spanish/English) trauma therapy for children and adults, with deep expertise in domestic violence, somatic experiencing, and play therapy.',
    array['Childhood Trauma','Domestic Violence','Somatic Experiencing','Play Therapy'],
    array['BCBS','Aetna (PPO)','Cigna'],
    'both', array['Somatic Experiencing','EMDR','ART','Sandtray'], array['Children','Adults','Spanish-Speaking'], array['Spanish-Speaking','Latinx'],
    array['Austin'],
    'Somatic Experiencing, EMDR, ART, and Sandtray with a culturally responsive, bilingual lens. Strong with complex trauma and DV survivors.',
    true, true, 'accepting', true, true,
    'anamaria@austinbilingualtherapy.com', '(512) 264-5558', 'https://www.austinbilingualtherapy.com/');

  -- Angela Viesca
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'aviesca@viescatxs.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Angela Viesca', 'angela-viesca', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Angela Viesca', 'LCSW-S',
    'Angela is a trauma and dissociation specialist trained in EMDR, Deep Brain Reorienting, and ketamine-assisted psychotherapy—offering advanced care for complex presentations.',
    array['Trauma','Dissociative Disorders','Ketamine-Assisted Therapy','Parts Work'],
    array['Out of network'],
    'private_pay', array['EMDR','Deep Brain Reorienting','Parts Work'], array['Adults'], array[]::text[],
    array['Austin'],
    'EMDRIA-certified, Deep Brain Reorienting, and parts work. Specializes in dissociative disorders. Currently has a waitlist.',
    true, true, 'full', false, true,
    'aviesca@viescatxs.com', '(512) 921-9022', 'https://www.viescatxs.com/angela');

  -- Anna Warde
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'recovery@counselingannawarde.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Anna Warde', 'anna-warde', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Anna Warde', 'LCDC',
    'Anna works primarily with families navigating a loved one''s substance use—offering psychoeducation, codependency support, and family systems work.',
    array['Substance Use Disorders','Codependency','Family Systems'],
    array['Out of network (superbill provided)'],
    'private_pay', array['Family Systems','Codependency','Psychoeducation'], array['Families','Adults'], array[]::text[],
    array['Austin'],
    'Family systems, codependency, and SUD-focused care. Primarily works with families of those in recovery. Saturday and evening availability.',
    true, true, 'accepting', true, true,
    'recovery@counselingannawarde.com', '(512) 413-2346', 'https://counselingannawarde.com');

  -- Brenda Lee Gauthier
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'brendaleegauthier@gmail.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Brenda Lee Gauthier', 'brenda-lee-gauthier', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Brenda Lee Gauthier', 'LCSW, LCDC, SEP',
    'Brenda Lee integrates somatic experiencing with addiction and complex trauma work—helping clients regulate their nervous systems and rebuild after significant loss.',
    array['Trauma','Addiction','ADHD','Complex Trauma','Somatic'],
    array['Out of network'],
    'private_pay', array['Somatic Experiencing','Trauma-Informed','Nervous System'], array['Adults'], array[]::text[],
    array['Austin'],
    'Somatic and nervous system-focused care for trauma, addiction, ADHD, and complex trauma. Private pay only.',
    false, true, 'accepting', true, true,
    'brendaleegauthier@gmail.com', '(310) 497-6176', 'https://www.brendaleegauthier.com/');

  -- Camila Gomez
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'camila@relationalhealingtherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Camila Gomez', 'camila-gomez', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Camila Gomez', 'LPC',
    'Camila offers bilingual (Spanish/English) therapy for complex trauma, OCD, and dissociative disorders—with a particular commitment to LGBTQ+, neurodivergent, and Latinx communities.',
    array['Complex Trauma','OCD','Dissociative Disorders','Relationship Issues'],
    array['Aetna (in-network)','Out of network (superbill)','Open Path (reduced rate)'],
    'both', array['ERP','EMDR','Trauma-Informed'], array['Adults','LGBTQ+','Neurodivergent','Spanish-Speaking'], array['LGBTQ+','Spanish-Speaking','Latinx','Neurodivergent'],
    array['Austin'],
    'ERP and EMDR-trained with advanced specialization in complex and dissociative trauma. Highly accessible via Aetna, Open Path, and sliding scale.',
    true, true, 'accepting', true, true,
    'camila@relationalhealingtherapy.com', '(512) 540-8640', 'https://www.relationalhealingtherapy.com/');

  -- Connor Bowie
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'connor.lcsw@gmail.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Connor Bowie', 'connor-bowie', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Connor Bowie', 'LCSW',
    'Connor works with adults navigating substance use disorders, trauma, and grief—offering steady, evidence-informed support in both virtual and in-person settings.',
    array['Substance Use Disorders','Trauma / PTSD','Grief'],
    array['Out of network'],
    'private_pay', array['Trauma-Informed','Evidence-Based'], array['Adults'], array[]::text[],
    array['Austin'],
    'Focused and practical care for SUD, trauma/PTSD, and grief. Private pay with sliding scale. Evening availability.',
    true, true, 'accepting', true, true,
    'connor.lcsw@gmail.com', '(703) 297-6003', 'https://connorbowie.com/');

  -- Joe Dias
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'mr.dcounseling@gmail.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Joe Dias', 'joe-dias', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Joe Dias', 'LPC-S',
    'Joe works with high-performance professionals and high-conflict couples—offering accountability-driven therapy for existential questions, SUD, and career transitions.',
    array['Substance Use Disorders','High-Conflict Couples','Career Discord','Existential'],
    array['Out of network (superbill provided)'],
    'private_pay', array['TF-CBT','REBT','Existential','High Accountability'], array['Professionals','Executives','Couples'], array[]::text[],
    array['Austin'],
    'Trauma-focused CBT, REBT, and existential frameworks. High accountability, homework-focused. Specializes in high-conflict couples and launching young adults. ~3-week waitlist.',
    true, false, 'waitlist', true, true,
    'mr.dcounseling@gmail.com', '(512) 439-9808', null);

  -- Kitty Ferguson-Mappus
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'connect@unbrokenabundance.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Kitty Ferguson-Mappus', 'kitty-ferguson-mappus', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Kitty Ferguson-Mappus', 'LCSW-S',
    'Kitty leads a group practice focused on trauma, SUD, body image, and LGBTQIA+ and neurodivergent clients—with EMDR certification and broad insurance access.',
    array['Trauma','Substance Use Disorders','Body Image','Religious Deconstruction','Mood Disorders'],
    array['BCBS','Carelon','Quest','Aetna','Curative','Moda','Sana','Medicare','United Healthcare'],
    'both', array['EMDR','Trauma-Informed'], array['Adults','LGBTQ+','Neurodivergent'], array['LGBTQ+','Neurodivergent'],
    array['Austin'],
    'EMDR-certified trauma and SUD specialist. Group practice with 7 clinicians and sliding scale options.',
    true, true, 'waitlist', true, true,
    'connect@unbrokenabundance.com', '(737) 367-3040', 'https://www.unbrokenabundance.com/');

  -- Miles Walker
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'miles@mileswalkercounseling.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Miles Walker', 'miles-walker', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Miles Walker', 'LPC, LCDC',
    'Miles brings a psychodynamic and IFS lens to trauma and substance use work—helping clients develop insight, internal coherence, and lasting change.',
    array['Trauma','Substance Use Disorders','Psychodynamic','IFS'],
    array['United','Cigna','Aetna','Optum','BCBS'],
    'both', array['Psychodynamic','IFS','Trauma-Informed'], array['Adults'], array[]::text[],
    array['Austin'],
    'Psychodynamic, IFS, and trauma-informed. Strong with SUD and relational issues. Evening availability to 8PM.',
    true, true, 'accepting', true, true,
    'miles@mileswalkercounseling.com', '(512) 609-0890', 'https://mileswalkercounseling.com');

  -- Rachel Shook
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'rachel@rachelshooktherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Rachel Shook', 'rachel-shook', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Rachel Shook', 'LCSW',
    'Rachel is an EMDR-trained therapist who works with adults navigating anxiety, depression, trauma, and life transitions—with a warm focus on clients in recovery.',
    array['Anxiety','Depression','Trauma / PTSD','Life Transitions','Recovery'],
    array['Aetna (via Alma)','Out of network (superbill)'],
    'both', array['EMDR','Trauma-Informed'], array['Adults'], array[]::text[],
    array['Austin'],
    'EMDR-trained with strong experience in anxiety, trauma/PTSD, and recovery remission. Evening availability on Tuesdays.',
    true, true, 'full', false, true,
    'rachel@rachelshooktherapy.com', '(512) 808-0483', 'https://rachelshooktherapy.com/');

  -- Shawna Moss
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'shawna@ptstherapy.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Shawna Moss', 'shawna-moss', 'Pflugerville', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Shawna Moss', 'LCSW-S',
    'Shawna uses Accelerated Resolution Therapy to help clients process trauma, anxiety, and grief efficiently—with insurance access and no current waitlist.',
    array['Trauma','Anxiety','Grief'],
    array['United','Aetna','Cigna','Medicare'],
    'both', array['ART','Trauma-Informed'], array['Adults'], array[]::text[],
    array['Pflugerville'],
    'ART-trained with strong results for trauma, anxiety, and grief. No waitlist.',
    true, true, 'accepting', true, true,
    'shawna@ptstherapy.com', '(512) 979-6708', 'https://www.ptstherapy.com');

  -- Chloe Ropner
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'hello@chloeropnerlcsw.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Chloe Ropner', 'chloe-ropner', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Chloe Ropner', 'LCSW',
    'Chloe specializes in eating disorders, body dysmorphia, and somatic healing—using IFS, RCT, and holistic approaches with broad insurance access.',
    array['Eating Disorders','Body Dysmorphia','Trauma','Somatic'],
    array['BCBS','Carelon','Cigna','Aetna','Anthem EAP','Quest','United Healthcare','Oscar','Oxford'],
    'both', array['IFS','RCT','Somatic','Holistic'], array['Adults'], array[]::text[],
    array['Austin'],
    'IFS and somatic-informed care for eating disorders, trauma, and body image. Can provide referrals to other ED specialists.',
    true, true, 'waitlist', true, true,
    'hello@chloeropnerlcsw.com', '(512) 240-2753', 'https://www.chloeropnerlcsw.com/');

  -- Carly Bassett
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'carly@carlybassettlcsw.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Carly Bassett', 'carly-bassett', 'Round Rock', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Carly Bassett', 'LCSW-S',
    'Carly combines EMDR, Gottman therapy, and ketamine-assisted psychotherapy to support grief, trauma, and relationships—with experience working with seniors and older adults.',
    array['Grief / Loss','Trauma','Relationships','Ketamine-Assisted Therapy','Older Adults'],
    array['United','Aetna','BCBS (HMO)','Medicare'],
    'both', array['EMDR','Gottman','Ketamine-Assisted'], array['Adults','Seniors','Couples'], array[]::text[],
    array['Round Rock','Westlake'],
    'EMDR, Gottman, and ketamine-assisted modalities. Co-owner of Moonstone Counseling Center. Currently full individually; group practice has openings.',
    true, true, 'full', false, true,
    'carly@carlybassettlcsw.com', '(512) 270-6170', 'http://www.carlybassettlcsw.com/');

  -- Samantha Meyer
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'samantha@complex-counseling.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Samantha Meyer', 'samantha-meyer', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Samantha Meyer', 'LPC',
    'Samantha specializes in complex trauma, DID, and neurodivergence—using an integrated EMDR and IFS approach with a warm, collaborative presence and immediate availability.',
    array['Complex Trauma','DID / Dissociative Disorders','Neurodivergence','Depression','Anxiety'],
    array['Aetna','United','Cigna'],
    'both', array['EMDR','IFS','Gottman','Integrated'], array['Adults','Adolescents','Neurodivergent'], array['Neurodivergent'],
    array['Austin'],
    'EMDR, IFS, and Gottman-trained with deep specialization in DID and complex dissociative disorders. Immediate openings available.',
    true, true, 'accepting', true, true,
    'samantha@complex-counseling.com', '(512) 730-1186', 'https://www.complex-counseling.com');

  -- Haylie Hill
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'haylie@autonomytherapyatx.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Haylie Hill', 'haylie-hill', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Haylie Hill', 'LPC',
    'Haylie works with adults navigating trauma, anxiety, eating disorders, and mood disorders—with EMDR training and an optional faith-based counseling approach.',
    array['Trauma / PTSD','Anxiety','Eating Disorders','Mood Disorders','BPD'],
    array['Aetna','United Healthcare / Optum','Moda'],
    'both', array['EMDR','Faith-Informed'], array['Adults'], array['Faith-Based'],
    array['Austin'],
    'EMDR-trained with experience in trauma, codependency, BPD, and eating disorders. In-person currently on waitlist; virtual available.',
    true, true, 'waitlist', true, true,
    'haylie@autonomytherapyatx.com', '(512) 387-1398', 'https://autonomytherapyatx.com/haylie-hill-austin-tx');

  -- Elizabeth Weber
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'eweber@therapytimeaustin.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Elizabeth Weber', 'elizabeth-weber', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Elizabeth Weber', 'LPC-S, LMFT',
    'Elizabeth works with adults navigating anxiety, relationships, perfectionism, burnout, and women''s issues—with Gottman training and a steady, lower-acuity focus.',
    array['Anxiety','Perfectionism','Burnout','Relationships','Women''s Issues'],
    array['Aetna','BCBS','Cigna','Optum','Oscar','Oxford','United Healthcare','UMR','EAP'],
    'both', array['Gottman','STAIR','Parts Work'], array['Adults','Women','Couples'], array[]::text[],
    array['Austin'],
    'Gottman, STAIR, and experiential parts work. Focused on higher-functioning adults with anxiety, perfectionism, and relational concerns.',
    true, true, 'accepting', true, true,
    'eweber@therapytimeaustin.com', '(512) 829-1066', 'https://www.therapytimeaustin.com/');

  -- Kendall Campbell
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'counseling@kendallcampbell.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Kendall Campbell', 'kendall-campbell', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Kendall Campbell', 'LMFT',
    'Kendall is a Gottman Level 2-certified therapist specializing in couples, high-conflict relationships, and infidelity recovery—with direct, results-oriented care.',
    array['Couples & Relationships','High-Conflict','Infidelity / Affairs','Trauma','Addiction'],
    array['Out of network (superbill provided)'],
    'private_pay', array['Gottman','Directive'], array['Adults','Couples','Families'], array[]::text[],
    array['Austin'],
    'Gottman Level 2 certified. Focused on couples, affairs, high conflict, trauma, and addiction. Very direct approach with no current waitlist.',
    true, true, 'accepting', true, true,
    'counseling@kendallcampbell.com', '(512) 920-3654', 'https://kendallcampbell.com/');

  -- Emery Rodriguez
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'emery.rodriguez.lpc@gmail.com', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Emery Rodriguez', 'emery-rodriguez', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Emery Rodriguez', 'LPC-A',
    'Emery works with LGBTQ+ clients, trauma survivors, and neurodivergent individuals using EMDR, somatic therapy, and ketamine-assisted modalities.',
    array['Trauma','ADHD','Neurodivergence','Somatic','Ketamine-Assisted Therapy'],
    array['Aetna'],
    'both', array['EMDR','Somatic','Ketamine-Assisted'], array['Adults','LGBTQ+','Neurodivergent'], array['LGBTQ+','Neurodivergent'],
    array['Austin'],
    'EMDR, somatic, and ketamine-assisted therapy for LGBTQ+, trauma, ADHD, and neurodivergent clients. Part of Selva Wellness Collective.',
    true, true, 'full', false, true,
    null, '(972) 526-5306', null);

  -- Michelle Sacksteder
  v_id := gen_random_uuid();
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'LiveBetter@BetterHealthCounseling.net', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');
  insert into public.profiles (id, role, membership_state, full_name, slug, city, market_slug, can_issue_referrals, membership_tier, approved_at)
  values (v_id, 'therapist', 'active', 'Michelle Sacksteder', 'michelle-sacksteder', 'Austin', 'austin-tx', false, 'free', now());
  insert into public.therapist_profiles (profile_id, public_display_name, credentials, bio, specialties, insurance_accepted, payment_model, therapy_style_tags, populations, communities, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, accepting_referrals, is_public, public_email, public_phone, website_url)
  values (v_id, 'Michelle Sacksteder', 'LPC',
    'Michelle specializes in ADHD, ASD, dissociative disorders, and maternal mental health—using Brainspotting alongside somatic and relational approaches with broad insurance access.',
    array['ADHD','ASD','Dissociative Disorders','Trauma','Maternal Mental Health'],
    array['BCBS','Cigna','Aetna','United Healthcare','UMR','Optum','Oxford','Oscar Health','Ascension','Ambetter'],
    'both', array['Brainspotting','Somatic','Relational'], array['Adults','Women','LGBTQ+','Neurodivergent'], array['LGBTQ+','Neurodivergent'],
    array['Austin'],
    'Brainspotting and somatic-informed care for neurodivergence, trauma, and women''s mental health. Accepts most major insurance plans.',
    true, true, 'accepting', true, true,
    'LiveBetter@BetterHealthCounseling.net', '512-402-3037', 'https://www.betterhealthcounseling.net/');

end $$;
