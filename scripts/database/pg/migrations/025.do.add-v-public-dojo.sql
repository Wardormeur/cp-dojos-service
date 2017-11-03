DO $$
  BEGIN
    CREATE OR REPLACE VIEW v_dojos_public_fields AS (
        SELECT id,
        mysql_dojo_id,
        dojo_lead_id,
        name,
        creator,
        created,
        verified_at,
        verified_by,
        verified,
        need_mentors,
        stage,
        mailing_list,
        alternative_frequency,
        country,
        county,
        state,
        city,
        place,
        coordinates,
        geo_point,
        notes,
        email,
        website,
        twitter,
        google_group,
        supporter_image,
        deleted,
        deleted_by,
        deleted_at,
        private,
        url_slug,
        continent,
        alpha2,
        alpha3,
        address1,
        address2,
        country_number,
        country_name,
        admin1_code,
        admin1_name,
        admin2_code,
        admin2_name,
        admin3_code,
        admin3_name,
        admin4_code,
        admin4_name,
        place_geoname_id,
        place_name,
        tao_verified,
        expected_attendees,
        facebook,
        day,
        start_time,
        end_time,
        frequency,
        CASE WHEN (eventbrite_token IS NOT NULL AND eventbrite_wh_id IS NOT NULL)
          THEN true
          ELSE false
        END as eventbrite_connected
        FROM cd_dojos
      );
  EXCEPTION
    WHEN others THEN RAISE NOTICE 'Unhandled error: % %', SQLERRM, SQLSTATE;
  END;
$$
