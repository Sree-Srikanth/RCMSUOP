-- Application module schema (MySQL 5.7+ / MariaDB 10.3+)
-- Run once:  mysql -u root application_management < sql/001_application_module.sql

-- Gap-free counters for auto reference numbers (one row per series + year).
CREATE TABLE IF NOT EXISTS reference_sequences (
  series      VARCHAR(64)  NOT NULL PRIMARY KEY,
  last_value  INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One application per applicant per vacancy. The full form is stored as JSON
-- in form_data so no section can be silently dropped; key fields are copied
-- into columns for listing/searching.
CREATE TABLE IF NOT EXISTS job_applications (
  application_id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference_no         VARCHAR(40)  NOT NULL,
  user_id              INT UNSIGNED NOT NULL,
  vacancy_id           INT UNSIGNED NOT NULL,
  selected_job         VARCHAR(255) NOT NULL DEFAULT '',
  status               ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  current_step         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  form_data            LONGTEXT     NOT NULL,
  applicant_name       VARCHAR(255) NULL,
  applicant_email      VARCHAR(255) NULL,
  nic                  VARCHAR(20)  NULL,
  declaration_agreed   TINYINT(1)   NOT NULL DEFAULT 0,
  pdf_path             VARCHAR(500) NULL,
  submitted_at         DATETIME     NULL,
  applicant_email_sent TINYINT(1)   NOT NULL DEFAULT 0,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_applications_ref (reference_no),
  UNIQUE KEY uq_job_applications_user_vacancy (user_id, vacancy_id),
  KEY idx_job_applications_vacancy_status (vacancy_id, status),
  KEY idx_job_applications_nic (nic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit of referee notification emails (also lets admins resend).
CREATE TABLE IF NOT EXISTS application_referee_notifications (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  referee_name   VARCHAR(255) NOT NULL,
  referee_email  VARCHAR(255) NOT NULL,
  status         ENUM('sent','failed') NOT NULL,
  error          VARCHAR(500) NULL,
  sent_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_arn_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reference number on advertisements. Skip this statement if the column exists.
-- (Change `vacancies` if your table has another name — see config.php.)
ALTER TABLE vacancies
  ADD COLUMN reference_no VARCHAR(40) NULL,
  ADD UNIQUE KEY uq_vacancies_reference_no (reference_no);

-- Then give existing advertisements a number:
--   php scripts/backfill_vacancy_references.php
