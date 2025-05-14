ALTER TABLE "role" DROP CONSTRAINT IF EXISTS "FK_b8dd0d3f71300de861dbe4d7c38";
ALTER TABLE "role" DROP CONSTRAINT IF EXISTS "FK_90be4056afb603e3142d6ab1a0f";

ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "FK_3bf47449928f5235011484b64e5";
ALTER TABLE "company" DROP CONSTRAINT IF EXISTS "FK_ac7df80d15733f2df1187953d33";


INSERT INTO "role" (
    role, can_add_company, can_add_user, can_assign_device, can_view_data, can_view_log, can_manage_iot, create_at, create_by, update_at, update_by
) VALUES (
    'System Admin', true, true, true, true, true, true, NOW(), 1, NOW(), 1
);

INSERT INTO "company" (
  name, create_at, create_by, update_at, update_by
) VALUES (
  'Ahmet Ecevit', NOW(), 1, NOW(), 1
);

INSERT INTO "user" (
    username, password, email, role_id, company_id, is_visible, create_at, create_by, update_at, update_by
) VALUES (
    'ecevah', 'ahmet', 'eecevah@gmail.com', 1, 1, true, NOW(), 1, NOW(), 1
);


ALTER TABLE "role"
    ADD CONSTRAINT "FK_role_create_by" FOREIGN KEY ("create_by") REFERENCES "user"("id"),
    ADD CONSTRAINT "FK_role_update_by" FOREIGN KEY ("update_by") REFERENCES "user"("id");

ALTER TABLE "company"
    ADD CONSTRAINT "FK_company_create_by" FOREIGN KEY ("create_by") REFERENCES "user"("id"),
    ADD CONSTRAINT "FK_company_update_by" FOREIGN KEY ("update_by") REFERENCES "user"("id");

ALTER TABLE "user"
    ADD CONSTRAINT "FK_user_create_by" FOREIGN KEY ("create_by") REFERENCES "user"("id"),
    ADD CONSTRAINT "FK_user_update_by" FOREIGN KEY ("update_by") REFERENCES "user"("id");
