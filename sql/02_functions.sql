-- =====================================================================
-- Campus Lost & Found  |  02_functions.sql
-- Functions, stored procedures and triggers.
-- =====================================================================

-- ---------------------------------------------------------------------
-- cosine_similarity(a, b): similarity of two embedding vectors (-1 .. 1)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cosine_similarity(a REAL[], b REAL[])
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
    SELECT CASE WHEN sqrt(sum(x * x)) * sqrt(sum(y * y)) = 0 THEN 0
                ELSE sum(x * y) / (sqrt(sum(x * x)) * sqrt(sum(y * y))) END
    FROM unnest(a::FLOAT8[], b::FLOAT8[]) AS t(x, y);   -- float8 avoids REAL underflow
$$;

-- ---------------------------------------------------------------------
-- fn_find_matches(item): hybrid matching of a lost item against found
-- items (or the other way round).
--   text_score     = trigram similarity + full-text rank
--   semantic_score = cosine similarity of AI embeddings (when present)
--   score          = weighted mix + small bonuses for same place/colour/brand
-- Candidates must be the opposite report type, same category, still open,
-- and within the category's retention window.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_find_matches(p_item_id INT, p_limit INT DEFAULT 5)
RETURNS TABLE (candidate_id INT, title VARCHAR, text_score NUMERIC,
               semantic_score NUMERIC, score NUMERIC)
LANGUAGE sql STABLE AS $$
    WITH src AS (
        SELECT i.*,
               lower(i.title || ' ' || coalesce(i.brand, '') || ' ' || coalesce(i.color, '')) AS label,
               replace(plainto_tsquery('english', i.title || ' ' || coalesce(i.brand, ''))::text,
                       '&', '|') AS q_text,
               c.retention_days
        FROM items i JOIN categories c USING (category_id)
        WHERE i.item_id = p_item_id
    ),
    cand AS (
        SELECT c.item_id, c.title,
               similarity(s.label, lower(c.title || ' ' || coalesce(c.brand, '') || ' ' ||
                                         coalesce(c.color, ''))) AS trigram,
               CASE WHEN s.q_text = '' THEN 0
                    ELSE ts_rank(c.search_doc, s.q_text::tsquery, 32) END AS fts,
               CASE WHEN s.embedding IS NOT NULL AND c.embedding IS NOT NULL
                    THEN cosine_similarity(s.embedding, c.embedding) END AS semantic,
               (CASE WHEN c.location_id = s.location_id THEN 0.08 ELSE 0 END
              + CASE WHEN lower(c.color) = lower(s.color) THEN 0.04 ELSE 0 END
              + CASE WHEN lower(c.brand) = lower(s.brand) THEN 0.08 ELSE 0 END) AS bonus
        FROM src s
        JOIN items c
          ON c.report_type <> s.report_type
         AND c.category_id = s.category_id
         AND c.status IN ('open', 'matched')
         AND c.item_id <> s.item_id
         AND abs(c.event_date - s.event_date) <= s.retention_days
         -- an item cannot be found more than 2 days before it was lost
         AND (CASE WHEN s.report_type = 'lost' THEN c.event_date - s.event_date
                   ELSE s.event_date - c.event_date END) >= -2
    ),
    scored AS (
        SELECT item_id, title,
               LEAST(1, 0.6 * trigram + 0.4 * LEAST(1, fts * 3)) AS t_score,
               semantic, bonus
        FROM cand
    )
    SELECT item_id, title,
           round(t_score::numeric, 4),
           round(semantic::numeric, 4),
           round(LEAST(1, GREATEST(0,
               CASE WHEN semantic IS NULL THEN t_score
                    ELSE 0.65 * semantic + 0.35 * t_score END + bonus))::numeric, 4) AS score
    FROM scored
    ORDER BY score DESC
    LIMIT p_limit;
$$;

-- ---------------------------------------------------------------------
-- sp_refresh_matches(item): store suggestions above a threshold and
-- mark both sides as 'matched'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_refresh_matches(p_item_id INT, p_threshold NUMERIC DEFAULT 0.50)
LANGUAGE plpgsql AS $$
DECLARE
    v_type VARCHAR(5);
BEGIN
    SELECT report_type INTO v_type FROM items WHERE item_id = p_item_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item % does not exist', p_item_id;
    END IF;

    INSERT INTO matches (lost_item_id, found_item_id, score, text_score, semantic_score)
    SELECT CASE WHEN v_type = 'lost' THEN p_item_id ELSE m.candidate_id END,
           CASE WHEN v_type = 'lost' THEN m.candidate_id ELSE p_item_id END,
           m.score, m.text_score, m.semantic_score
    FROM fn_find_matches(p_item_id, 10) m
    WHERE m.score >= p_threshold
    ON CONFLICT (lost_item_id, found_item_id) DO UPDATE
        SET score = EXCLUDED.score,
            text_score = EXCLUDED.text_score,
            semantic_score = EXCLUDED.semantic_score
        WHERE matches.status = 'suggested';

    UPDATE items SET status = 'matched'
    WHERE status = 'open'
      AND item_id IN (SELECT lost_item_id FROM matches
                      WHERE status = 'suggested' AND p_item_id IN (lost_item_id, found_item_id)
                      UNION
                      SELECT found_item_id FROM matches
                      WHERE status = 'suggested' AND p_item_id IN (lost_item_id, found_item_id));
END;
$$;

-- ---------------------------------------------------------------------
-- sp_approve_claim: one atomic unit of work
--   approve claim -> reject competing claims -> mark items claimed
--   -> confirm/dismiss matches.   Any error rolls everything back.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_approve_claim(p_claim_id INT, p_reviewer_id INT, p_note TEXT DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
    v_claim claims%ROWTYPE;
    v_role  VARCHAR(10);
BEGIN
    SELECT role INTO v_role FROM users WHERE user_id = p_reviewer_id AND is_active;
    IF v_role IS NULL OR v_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'User % is not allowed to review claims', p_reviewer_id;
    END IF;

    SELECT * INTO v_claim FROM claims WHERE claim_id = p_claim_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim % does not exist', p_claim_id;
    END IF;
    IF v_claim.status <> 'pending' THEN
        RAISE EXCEPTION 'Claim % is already %', p_claim_id, v_claim.status;
    END IF;

    PERFORM 1 FROM items WHERE item_id = v_claim.item_id FOR UPDATE;   -- lock the item

    UPDATE claims
       SET status = 'approved', reviewed_by = p_reviewer_id, reviewed_at = now(), review_note = p_note
     WHERE claim_id = p_claim_id;

    UPDATE claims
       SET status = 'rejected', reviewed_by = p_reviewer_id, reviewed_at = now(),
           review_note = 'Another claim for this item was approved'
     WHERE item_id = v_claim.item_id AND claim_id <> p_claim_id AND status = 'pending';

    UPDATE items SET status = 'claimed'
     WHERE item_id IN (v_claim.item_id, v_claim.lost_item_id)
       AND status IN ('open', 'matched');

    UPDATE matches SET status = 'confirmed'
     WHERE found_item_id = v_claim.item_id AND lost_item_id = v_claim.lost_item_id;

    UPDATE matches SET status = 'dismissed'
     WHERE found_item_id = v_claim.item_id AND status = 'suggested';
END;
$$;

CREATE OR REPLACE PROCEDURE sp_reject_claim(p_claim_id INT, p_reviewer_id INT, p_note TEXT DEFAULT NULL)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_reviewer_id AND is_active
                                          AND role IN ('staff', 'admin')) THEN
        RAISE EXCEPTION 'User % is not allowed to review claims', p_reviewer_id;
    END IF;

    UPDATE claims
       SET status = 'rejected', reviewed_by = p_reviewer_id, reviewed_at = now(), review_note = p_note
     WHERE claim_id = p_claim_id AND status = 'pending';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim % is not pending', p_claim_id;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_record_handover: item physically returned to its owner.
--   Finder earns +10 reputation (honesty points).
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_record_handover(p_claim_id INT, p_staff_id INT,
                                               p_location_id INT, p_notes TEXT DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
    v_claim claims%ROWTYPE;
BEGIN
    SELECT * INTO v_claim FROM claims WHERE claim_id = p_claim_id FOR UPDATE;
    IF NOT FOUND OR v_claim.status <> 'approved' THEN
        RAISE EXCEPTION 'Claim % is not approved', p_claim_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_staff_id AND role IN ('staff', 'admin')) THEN
        RAISE EXCEPTION 'User % cannot record handovers', p_staff_id;
    END IF;

    INSERT INTO handovers (claim_id, handled_by, location_id, notes)
    VALUES (p_claim_id, p_staff_id, p_location_id, p_notes);

    UPDATE items SET status = 'returned'
     WHERE item_id IN (v_claim.item_id, v_claim.lost_item_id) AND status = 'claimed';

    UPDATE users SET reputation = reputation + 10
     WHERE user_id = (SELECT reporter_id FROM items WHERE item_id = v_claim.item_id);
END;
$$;

-- ---------------------------------------------------------------------
-- fn_expire_stale_items(): close reports older than their category's
-- retention period. Returns how many were closed.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_expire_stale_items()
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE items i SET status = 'closed'
      FROM categories c
     WHERE c.category_id = i.category_id
       AND i.status IN ('open', 'matched')
       AND i.event_date < CURRENT_DATE - c.retention_days;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- keep items.updated_at current
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER items_set_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- validate items: no future dates, storage must be a collection point,
-- and only legal status transitions are allowed
CREATE OR REPLACE FUNCTION trg_validate_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.event_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'event_date (%) cannot be in the future', NEW.event_date;
    END IF;

    IF NEW.storage_location_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM locations WHERE location_id = NEW.storage_location_id AND is_collection_point) THEN
        RAISE EXCEPTION 'Location % is not a collection point', NEW.storage_location_id;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status AND NOT (
           (OLD.status = 'pending'  AND NEW.status IN ('open', 'rejected'))
        OR (OLD.status = 'open'     AND NEW.status IN ('matched', 'claimed', 'closed', 'rejected'))
        OR (OLD.status = 'matched'  AND NEW.status IN ('open', 'claimed', 'closed'))
        OR (OLD.status = 'claimed'  AND NEW.status IN ('returned', 'open'))
        OR (OLD.status = 'closed'   AND NEW.status = 'open')) THEN
        RAISE EXCEPTION 'Illegal status change % -> % for item %', OLD.status, NEW.status, OLD.item_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER items_validate
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION trg_validate_item();

-- validate claims + auto-compute the verification score
CREATE OR REPLACE FUNCTION trg_validate_claim()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_item     items%ROWTYPE;
    v_expected VARCHAR(200);
BEGIN
    SELECT * INTO v_item FROM items WHERE item_id = NEW.item_id;

    IF v_item.report_type <> 'found' THEN
        RAISE EXCEPTION 'Only found items can be claimed';
    END IF;
    IF v_item.status NOT IN ('open', 'matched') THEN
        RAISE EXCEPTION 'Item % is % and cannot be claimed', NEW.item_id, v_item.status;
    END IF;
    IF v_item.reporter_id = NEW.claimant_id THEN
        RAISE EXCEPTION 'You cannot claim an item you reported as found';
    END IF;
    IF NEW.lost_item_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM items WHERE item_id = NEW.lost_item_id
                              AND report_type = 'lost' AND reporter_id = NEW.claimant_id) THEN
        RAISE EXCEPTION 'Linked lost report must be your own lost report';
    END IF;

    SELECT expected_answer INTO v_expected FROM verification_questions WHERE item_id = NEW.item_id;
    IF v_expected IS NOT NULL AND NEW.answer IS NOT NULL THEN
        NEW.verification_score := round(GREATEST(
            similarity(lower(NEW.answer), lower(v_expected)),
            word_similarity(lower(v_expected), lower(NEW.answer)))::numeric, 3);
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER claims_validate
BEFORE INSERT ON claims
FOR EACH ROW EXECUTE FUNCTION trg_validate_claim();

-- generic audit trigger: TG_ARGV[0] = primary key column
CREATE OR REPLACE FUNCTION trg_audit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_old JSONB := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
    v_new JSONB := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
BEGIN
    -- never copy secrets or large columns into the log
    v_old := v_old - 'password_hash' - 'embedding' - 'search_doc';
    v_new := v_new - 'password_hash' - 'embedding' - 'search_doc';

    -- skip updates that only touched ignored columns
    IF TG_OP = 'UPDATE' AND v_old - 'updated_at' = v_new - 'updated_at' THEN
        RETURN NULL;
    END IF;

    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME,
            (COALESCE(v_new, v_old) ->> TG_ARGV[0])::INT,
            TG_OP,
            NULLIF(current_setting('app.user_id', TRUE), '')::INT,
            v_old, v_new);
    RETURN NULL;
END;
$$;

CREATE TRIGGER items_audit  AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW EXECUTE FUNCTION trg_audit('item_id');
CREATE TRIGGER claims_audit AFTER INSERT OR UPDATE OR DELETE ON claims
FOR EACH ROW EXECUTE FUNCTION trg_audit('claim_id');
CREATE TRIGGER users_audit  AFTER UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION trg_audit('user_id');
