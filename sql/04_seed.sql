-- =====================================================================
-- Campus Lost & Found  |  04_seed.sql  (sample data)
-- All demo accounts use the password:  Demo@1234
-- Dates are relative to CURRENT_DATE so reports always look recent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------
INSERT INTO departments (code, name) VALUES
 ('CSE',  'Computer Science and Engineering'),
 ('AIML', 'CSE (AI & ML)'),
 ('ECE',  'Electronics and Communication'),
 ('EEE',  'Electrical and Electronics'),
 ('ME',   'Mechanical Engineering'),
 ('BT',   'Biotechnology');

-- ---------------------------------------------------------------------
-- users: 1 admin, 2 staff (security desk), 16 students
-- ---------------------------------------------------------------------
INSERT INTO users (srn, name, email, phone, password_hash, role, dept_id) VALUES
 (NULL, 'Admin Office',        'admin@campus.edu',    '9800000001', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'admin', NULL),
 (NULL, 'Ramesh (Security)',   'security@campus.edu', '9800000002', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'staff', NULL),
 (NULL, 'Lakshmi (Library)',   'library@campus.edu',  '9800000003', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'staff', NULL),
 ('PES1UG24AM187', 'Vishnu Patruni',   'vishnu@campus.edu',  '9811111104', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 2),
 ('PES1UG24CS045', 'Ananya Rao',       'ananya@campus.edu',  '9811111105', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 1),
 ('PES1UG24EC012', 'Karthik Reddy',    'karthik@campus.edu', '9811111106', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 3),
 ('PES1UG24AM202', 'Pravith Mohandas', 'pravith@campus.edu', '9811111107', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 2),
 ('PES1UG24ME033', 'Sneha Kulkarni',   'sneha@campus.edu',   '9811111108', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 5),
 ('PES1UG24CS101', 'Rahul Menon',      'rahul@campus.edu',   '9811111109', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 1),
 ('PES1UG24BT007', 'Divya Shetty',     'divya@campus.edu',   '9811111110', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 6),
 ('PES1UG24EE021', 'Arjun Nair',       'arjun@campus.edu',   '9811111111', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 4),
 ('PES1UG24CS150', 'Meera Iyer',       'meera@campus.edu',   '9811111112', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 1),
 ('PES1UG24AM099', 'Rohan Gupta',      'rohan@campus.edu',   '9811111113', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 2),
 ('PES1UG24EC064', 'Priya Sharma',     'priya@campus.edu',   '9811111114', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 3),
 ('PES1UG24ME078', 'Aditya Joshi',     'aditya@campus.edu',  '9811111115', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 5),
 ('PES1UG24CS200', 'Fatima Khan',      'fatima@campus.edu',  '9811111116', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 1),
 ('PES1UG24AM120', 'Nikhil Varma',     'nikhil@campus.edu',  '9811111117', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 2),
 ('PES1UG24BT015', 'Ishita Das',       'ishita@campus.edu',  '9811111118', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 6),
 ('PES1UG24EE044', 'Siddharth Rao',    'sid@campus.edu',     '9811111119', '$2b$10$jDBIBUYPiJzgglVfwD5LW.XtS2rRA49ZgK4XlECgJU9yOG1Wf8vwa', 'student', 4);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
INSERT INTO categories (name, is_high_value, retention_days) VALUES
 ('Electronics',              TRUE,  60),   -- 1
 ('ID Cards & Documents',     TRUE,  90),   -- 2
 ('Wallets & Purses',         TRUE,  60),   -- 3
 ('Bags & Backpacks',         FALSE, 30),   -- 4
 ('Keys',                     FALSE, 30),   -- 5
 ('Water Bottles',            FALSE, 14),   -- 6
 ('Books & Notes',            FALSE, 30),   -- 7
 ('Clothing & Accessories',   FALSE, 30),   -- 8
 ('Stationery & Calculators', FALSE, 21);   -- 9

-- ---------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------
INSERT INTO locations (building, area, is_collection_point) VALUES
 ('Main Library',     'Ground Floor',        FALSE),  -- 1
 ('Main Library',     'Reading Hall',        FALSE),  -- 2
 ('Food Court',       'Seating Area',        FALSE),  -- 3
 ('Food Court',       'Coffee Counter',      FALSE),  -- 4
 ('MRD Block',        'Lab 3',               FALSE),  -- 5
 ('BE Block',         'Classroom 401',       FALSE),  -- 6
 ('Sports Complex',   'Gym',                 FALSE),  -- 7
 ('Sports Complex',   'Basketball Court',    FALSE),  -- 8
 ('Auditorium',       'Main Hall',           FALSE),  -- 9
 ('Parking',          'Two-wheeler Parking', FALSE),  -- 10
 ('Security Office',  'Main Gate',           TRUE),   -- 11
 ('Main Library',     'Help Desk',           TRUE),   -- 12
 ('Admin Block',      'Reception',           TRUE);   -- 13

-- ---------------------------------------------------------------------
-- items  (reporter, category, location, storage, type, title, description,
--         colour, brand, event_date, status)
-- ---------------------------------------------------------------------
INSERT INTO items (reporter_id, category_id, location_id, storage_location_id, report_type,
                   title, description, color, brand, event_date, status) VALUES
-- ---- older reports that were resolved ----
 (4,  1, 1,  NULL, 'lost',  'JBL Tune 510 headphones', 'Black over-ear wireless headphones, has a hackathon sticker on the left side of the headband.', 'black', 'JBL', CURRENT_DATE - 110, 'open'),
 (9,  1, 2,  12,   'found', 'Black JBL wireless headphones', 'Found a pair of black JBL headphones on a reading hall table near the window.', 'black', 'JBL', CURRENT_DATE - 109, 'open'),
 (5,  2, 3,  NULL, 'lost',  'Student ID card', 'Lost my college ID card with a blue lanyard somewhere in the food court.', 'blue', NULL, CURRENT_DATE - 95, 'open'),
 (2,  2, 3,  11,   'found', 'College ID card with blue lanyard', 'ID card on a blue lanyard found under a food court table.', 'blue', NULL, CURRENT_DATE - 95, 'open'),
 (6,  3, 10, NULL, 'lost',  'Brown leather wallet', 'Brown Woodland leather wallet with bank cards, a metro card and a photo.', 'brown', 'Woodland', CURRENT_DATE - 80, 'open'),
 (12, 3, 10, 11,   'found', 'Brown wallet with cards', 'Found a brown leather wallet near the bike parking entrance, has some cards inside.', 'brown', 'Woodland', CURRENT_DATE - 79, 'open'),
 (7,  9, 6,  NULL, 'lost',  'Casio fx-991EX calculator', 'Scientific calculator left in classroom 401 after the maths exam.', 'black', 'Casio', CURRENT_DATE - 70, 'open'),
 (14, 9, 6,  13,   'found', 'Scientific calculator Casio', 'Casio scientific calculator found on a bench in classroom 401.', 'black', 'Casio', CURRENT_DATE - 70, 'open'),
 (8,  6, 7,  NULL, 'lost',  'Blue Milton water bottle', 'Blue steel Milton bottle, 1 litre, left at the gym.', 'blue', 'Milton', CURRENT_DATE - 50, 'open'),
 (15, 6, 7,  11,   'found', 'Blue steel bottle at gym', 'Blue steel water bottle found near the treadmills in the gym.', 'blue', 'Milton', CURRENT_DATE - 50, 'open'),
 (10, 5, 10, NULL, 'lost',  'Honda bike keys with keychain', 'Honda Activa key with a red Spiderman keychain, lost in parking.', 'red', 'Honda', CURRENT_DATE - 45, 'open'),
 (16, 5, 10, 11,   'found', 'Bike key with red keychain', 'Two-wheeler key with a red keychain lying in the parking lot.', 'red', 'Honda', CURRENT_DATE - 44, 'open'),
 (11, 1, 5,  NULL, 'lost',  'HP laptop charger 65W', 'HP 65W laptop charger with a small tape mark on the brick, forgot it in Lab 3.', 'black', 'HP', CURRENT_DATE - 40, 'open'),
 (17, 1, 5,  13,   'found', 'Laptop charger left in lab 3', 'Black HP laptop charger plugged in at a Lab 3 workstation after class.', 'black', 'HP', CURRENT_DATE - 40, 'open'),
 (13, 7, 2,  NULL, 'lost',  'DBMS textbook Navathe', 'Fundamentals of Database Systems by Elmasri and Navathe, my name is written inside.', 'white', NULL, CURRENT_DATE - 30, 'open'),
 (18, 7, 2,  12,   'found', 'Database systems book by Elmasri Navathe', 'Found a DBMS textbook (Elmasri Navathe) in the reading hall.', 'white', NULL, CURRENT_DATE - 29, 'open'),
-- ---- currently open reports ----
 (4,  4, 9,  NULL, 'lost',  'Grey Wildcraft backpack', 'Grey Wildcraft backpack with a laptop sleeve and notebooks, left in the auditorium after the fest.', 'grey', 'Wildcraft', CURRENT_DATE - 6, 'open'),
 (19, 4, 9,  11,   'found', 'Grey backpack found in auditorium', 'Grey Wildcraft bag left on a seat in the auditorium main hall.', 'grey', 'Wildcraft', CURRENT_DATE - 5, 'open'),
 (5,  1, 4,  NULL, 'lost',  'AirPods Pro case', 'White Apple AirPods Pro charging case with initials engraved, lost at the coffee counter.', 'white', 'Apple', CURRENT_DATE - 4, 'open'),
 (12, 1, 3,  12,   'found', 'White Apple earbuds case', 'White Apple earphone case found in the food court seating area.', 'white', 'Apple', CURRENT_DATE - 3, 'open'),
 (6,  8, 8,  NULL, 'lost',  'Silver ring', 'Thin silver ring, took it off while playing basketball.', 'silver', NULL, CURRENT_DATE - 8, 'open'),
 (7,  8, 7,  NULL, 'lost',  'Black hoodie with college logo', 'Black hoodie with the college logo and AIML 2024 printed on the back.', 'black', NULL, CURRENT_DATE - 10, 'open'),
 (14, 8, 7,  11,   'found', 'Black hoodie left on gym bench', 'Black college hoodie found on a bench in the gym.', 'black', NULL, CURRENT_DATE - 9, 'open'),
 (8,  2, 1,  NULL, 'lost',  'Aadhaar and college ID in plastic cover', 'Transparent plastic cover with my Aadhaar card and college ID card.', NULL, NULL, CURRENT_DATE - 3, 'open'),
 (3,  2, 12, 12,   'found', 'ID cards in a transparent cover', 'Two ID cards in a clear plastic pouch handed in at the library help desk.', NULL, NULL, CURRENT_DATE - 2, 'open'),
 (10, 1, 6,  NULL, 'lost',  'Lenovo wireless mouse', 'Black Lenovo wireless mouse with USB receiver.', 'black', 'Lenovo', CURRENT_DATE - 12, 'open'),
 (11, 7, 5,  NULL, 'lost',  'Physics lab record notebook', 'Green physics lab record with all my experiments, needed for viva.', 'green', NULL, CURRENT_DATE - 15, 'open'),
 (15, 6, 3,  11,   'found', 'Steel water bottle with stickers', 'Silver steel bottle covered with anime stickers, found at the food court.', 'silver', NULL, CURRENT_DATE - 7, 'open'),
 (13, 5, 10, NULL, 'lost',  'Hyundai car keys', 'Hyundai car key with a leather key cover.', 'black', 'Hyundai', CURRENT_DATE - 20, 'open'),
 (16, 8, 6,  13,   'found', 'Black analog wrist watch', 'Titan analog watch with black leather strap found in classroom 401.', 'black', 'Titan', CURRENT_DATE - 6, 'open'),
 (17, 8, 6,  NULL, 'lost',  'Titan watch black strap', 'Black strap Titan watch, gift from my parents, engraved on the back.', 'black', 'Titan', CURRENT_DATE - 7, 'open'),
 (18, 1, 3,  11,   'found', 'Samsung phone with cracked screen', 'Blue Samsung phone with a cracked screen protector found at the food court.', 'blue', 'Samsung', CURRENT_DATE - 1, 'open'),
 (19, 1, 4,  NULL, 'lost',  'Samsung Galaxy M34 blue phone', 'Blue Samsung Galaxy M34 mobile phone, screen guard is cracked, lost near coffee counter.', 'blue', 'Samsung', CURRENT_DATE - 1, 'open'),
 (9,  8, 1,  NULL, 'lost',  'Purple umbrella', 'Foldable purple umbrella left at the library entrance.', 'purple', NULL, CURRENT_DATE - 18, 'open'),
 (4,  9, 6,  13,   'found', 'Red pencil pouch with pens', 'Red pencil pouch with pens and a geometry box.', 'red', NULL, CURRENT_DATE - 11, 'open'),
 (12, 8, 2,  NULL, 'lost',  'Spectacles in black case', 'Prescription glasses in a black hard case.', 'black', NULL, CURRENT_DATE - 25, 'open'),
 (11, 1, 8,  11,   'found', 'boAt smartwatch', 'Black boAt smartwatch found near the basketball court bench.', 'black', 'boAt', CURRENT_DATE - 20, 'open'),
 (13, 5, 4,  11,   'found', 'Bunch of three keys', 'Three keys on a ring with a bottle opener, found at the coffee counter.', 'silver', NULL, CURRENT_DATE - 35, 'open'),
-- ---- unresolved old reports (closed) ----
 (15, 1, 9,  NULL, 'lost',  'Sony earphones', 'Sony wired earphones lost during an event in the auditorium.', 'white', 'Sony', CURRENT_DATE - 85, 'closed'),
 (18, 3, 4,  NULL, 'lost',  'Black wallet', 'Black wallet with some cash and a library card.', 'black', NULL, CURRENT_DATE - 60, 'closed'),
 (6,  6, 3,  NULL, 'lost',  'Green water bottle', 'Green plastic Tupperware bottle.', 'green', 'Tupperware', CURRENT_DATE - 65, 'closed'),
-- ---- moderation queue / rejected ----
 (14, 8, 8,  NULL, 'lost',  'Gold chain', 'Thin gold chain with a small pendant, lost at the basketball court.', 'gold', NULL, CURRENT_DATE - 1, 'pending'),
 (5,  1, 2,  12,   'found', 'Kindle e-reader', 'Amazon Kindle e-reader in a black cover found in the reading hall.', 'black', 'Amazon', CURRENT_DATE, 'pending'),
 (16, 9, 1,  NULL, 'lost',  'test test item', 'spam report please ignore this', NULL, NULL, CURRENT_DATE - 2, 'rejected');

-- ---------------------------------------------------------------------
-- verification questions set by finders
-- ---------------------------------------------------------------------
INSERT INTO verification_questions (item_id, question, expected_answer) VALUES
 (2,  'What sticker is on the headband?',               'hackathon sticker'),
 (4,  'What name is printed on the ID card?',           'Ananya Rao'),
 (6,  'Apart from bank cards, what is inside?',         'metro card and a photo'),
 (12, 'What does the keychain look like?',              'red spiderman keychain'),
 (18, 'What is inside the laptop sleeve?',              'notebooks and a dell laptop'),
 (20, 'What is engraved on the case?',                  'initials AR'),
 (23, 'What is printed on the back of the hoodie?',     'AIML 2024'),
 (25, 'Whose names are on the cards?',                  'Sneha Kulkarni'),
 (30, 'What is engraved on the back of the watch?',     'happy 18th birthday'),
 (32, 'What is the lock screen wallpaper?',             'a golden retriever');

-- ---------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------
INSERT INTO item_images (item_id, image_url) VALUES
 (2,  '/samples/headphones.svg'),
 (18, '/samples/backpack.svg'),
 (20, '/samples/earbuds.svg'),
 (32, '/samples/phone.svg'),
 (30, '/samples/watch.svg');

-- ---------------------------------------------------------------------
-- suggested matches (text-based; scripts/embed-items.mjs adds AI scores)
-- ---------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT item_id FROM items WHERE status = 'open' AND report_type = 'lost' LOOP
        CALL sp_refresh_matches(r.item_id);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- claims (inserted while items are still open; the trigger validates
-- them and computes verification_score)
-- ---------------------------------------------------------------------
INSERT INTO claims (item_id, claimant_id, lost_item_id, proof_details, answer) VALUES
 (2,  4,  1,    'They are my JBL Tune 510, bought in January. Hackathon sticker on the left side.', 'a hackathon sticker'),        -- 1
 (4,  5,  3,    'It is my ID card, my SRN is PES1UG24CS045.', 'Ananya Rao'),                                                       -- 2
 (6,  6,  5,    'My Woodland wallet, it has my SBI debit card in it.', 'metro card and a family photo'),                           -- 3
 (6,  9,  NULL, 'I lost a brown wallet around the same time.', 'some cash'),                                                       -- 4
 (8,  7,  7,    'My calculator, my roll number is scratched on the back.', NULL),                                                  -- 5
 (8,  9,  NULL, 'I think this is my calculator, I sit in 401.', NULL),                                                             -- 6
 (10, 8,  9,    'My Milton bottle, has a dent at the bottom.', NULL),                                                              -- 7
 (12, 10, 11,   'That is my Activa key, I can show the RC book.', 'spiderman keychain, red'),                                      -- 8
 (14, 19, NULL, 'I lost an HP charger in a lab last month.', NULL),                                                                -- 9
 (14, 11, 13,   'My charger, there is a strip of yellow tape on the brick.', NULL),                                                -- 10
 (16, 13, 15,   'My DBMS textbook, my name Rohan is written on the first page.', NULL),                                            -- 11
 (4,  9,  NULL, 'I found it is mine', 'not sure'),                                                                                 -- 12
 (18, 4,  17,   'My Wildcraft bag from the fest, has my DBMS notebooks.', 'notebooks and my dell laptop'),                         -- 13
 (20, 5,  19,   'My AirPods Pro, initials AR engraved on the case.', 'AR'),                                                        -- 14
 (20, 9,  NULL, 'I lost white earphones last week.', 'nothing'),                                                                   -- 15
 (23, 7,  22,   'My hoodie, it has AIML 2024 on the back.', 'AIML 2024 printed');                                                  -- 16

-- reviews and returns via the stored procedures
CALL sp_reject_claim(12, 2, 'Could not identify the card owner');
CALL sp_reject_claim(9,  1, 'Proof did not match the charger');
CALL sp_reject_claim(6,  3, 'Owner already identified by roll number');
CALL sp_approve_claim(1,  3, 'Sticker matches');
CALL sp_approve_claim(2,  2, 'SRN verified with ID');
CALL sp_approve_claim(3,  2, 'Contents verified');          -- auto-rejects claim 4
CALL sp_approve_claim(5,  3, 'Roll number on the back');
CALL sp_approve_claim(7,  2, 'Dent verified');
CALL sp_approve_claim(8,  2, 'RC book shown');
CALL sp_approve_claim(10, 1, 'Tape mark verified');
CALL sp_approve_claim(11, 3, 'Name on the first page');
CALL sp_record_handover(1,  3, 12);
CALL sp_record_handover(2,  2, 11);
CALL sp_record_handover(3,  2, 11);
CALL sp_record_handover(5,  3, 13);
CALL sp_record_handover(7,  2, 11);
CALL sp_record_handover(8,  2, 11);
CALL sp_record_handover(10, 1, 13);
-- claim 11 is approved but not yet collected

-- ---------------------------------------------------------------------
-- spread the timestamps out so turnaround / trend reports are realistic
-- (triggers disabled only for this back-dating step)
-- ---------------------------------------------------------------------
ALTER TABLE items  DISABLE TRIGGER USER;
ALTER TABLE claims DISABLE TRIGGER USER;

UPDATE items
   SET created_at = LEAST(now() - interval '2 hours',
                          event_date + time '09:00' + (item_id % 9) * interval '1 hour'),
       updated_at = LEAST(now() - interval '1 hour',
                          event_date + time '09:00' + (item_id % 9 + 2) * interval '1 hour');

UPDATE claims c
   SET created_at = LEAST(now() - interval '1 hour',
                          i.created_at + interval '18 hours' + (c.claim_id % 4) * interval '6 hours')
  FROM items i
 WHERE i.item_id = c.item_id;

UPDATE claims
   SET reviewed_at = LEAST(now(), created_at + (4 + (claim_id % 5) * 9) * interval '1 hour')
 WHERE reviewed_at IS NOT NULL;

UPDATE handovers h
   SET handed_over_at = LEAST(now(), c.reviewed_at + interval '20 hours')
  FROM claims c
 WHERE c.claim_id = h.claim_id;

UPDATE users SET created_at = now() - interval '150 days';

ALTER TABLE items  ENABLE TRIGGER USER;
ALTER TABLE claims ENABLE TRIGGER USER;

REFRESH MATERIALIZED VIEW mv_monthly_trends;
