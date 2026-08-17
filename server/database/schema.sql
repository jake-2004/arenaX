-- ============================================================
-- ArenaX: AI-Powered Local Sports Poster & Tournament Management OS
-- Database Schema Definition (18 Tables)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `arenax_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `arenax_db`;

-- 1. Table: Tbl_users
CREATE TABLE IF NOT EXISTS `Tbl_users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin','Organizer','LocalUser') NOT NULL DEFAULT 'LocalUser',
  `phone` VARCHAR(20) NULL,
  `profile_image` VARCHAR(255) NULL,
  `district` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `status` ENUM('Active','Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: Tbl_organizers
CREATE TABLE IF NOT EXISTS `Tbl_organizers` (
  `organizer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `organization_name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `verification_document` VARCHAR(255) NULL,
  `approval_status` ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  FOREIGN KEY (`user_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: Tbl_teams
CREATE TABLE IF NOT EXISTS `Tbl_teams` (
  `team_id` INT AUTO_INCREMENT PRIMARY KEY,
  `owner_id` INT NOT NULL,
  `team_name` VARCHAR(100) NOT NULL,
  `logo` VARCHAR(255) NULL,
  `sport` VARCHAR(50) NOT NULL,
  `district` VARCHAR(100) NULL,
  `captain_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: Tbl_players
CREATE TABLE IF NOT EXISTS `Tbl_players` (
  `player_id` INT AUTO_INCREMENT PRIMARY KEY,
  `team_id` INT NOT NULL,
  `player_name` VARCHAR(100) NOT NULL,
  `age` INT NULL,
  `jersey_number` INT NULL,
  `position` VARCHAR(50) NULL,
  `photo` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  FOREIGN KEY (`team_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table: Tbl_tournaments
CREATE TABLE IF NOT EXISTS `Tbl_tournaments` (
  `tournament_id` INT AUTO_INCREMENT PRIMARY KEY,
  `organizer_id` INT NOT NULL,
  `tournament_name` VARCHAR(150) NOT NULL,
  `sport` VARCHAR(50) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `district` VARCHAR(100) NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `registration_deadline` DATE NOT NULL,
  `entry_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `prize_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_teams` INT NOT NULL DEFAULT 16,
  `rules` TEXT NULL,
  `status` ENUM('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  FOREIGN KEY (`organizer_id`) REFERENCES `Tbl_organizers`(`organizer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Table: Tbl_tournament_posters
CREATE TABLE IF NOT EXISTS `Tbl_tournament_posters` (
  `poster_id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `organizer_id` INT NOT NULL,
  `poster_image` VARCHAR(255) NOT NULL,
  `ai_generated` BOOLEAN DEFAULT TRUE,
  `approval_status` ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE CASCADE,
  FOREIGN KEY (`organizer_id`) REFERENCES `Tbl_organizers`(`organizer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Table: Tbl_team_registrations
CREATE TABLE IF NOT EXISTS `Tbl_team_registrations` (
  `registration_id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `registration_date` DATE DEFAULT (CURRENT_DATE),
  `payment_status` ENUM('Pending','Paid') DEFAULT 'Pending',
  `registration_status` ENUM('Pending','Accepted','Rejected') DEFAULT 'Pending',
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Table: Tbl_matches
CREATE TABLE IF NOT EXISTS `Tbl_matches` (
  `match_id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `team1_id` INT NOT NULL,
  `team2_id` INT NOT NULL,
  `match_date` DATETIME NOT NULL,
  `venue` VARCHAR(150) NOT NULL,
  `round` VARCHAR(50) NOT NULL,
  `status` ENUM('Upcoming','Live','Completed') DEFAULT 'Upcoming',
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE CASCADE,
  FOREIGN KEY (`team1_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE CASCADE,
  FOREIGN KEY (`team2_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Table: Tbl_live_scores
CREATE TABLE IF NOT EXISTS `Tbl_live_scores` (
  `score_id` INT AUTO_INCREMENT PRIMARY KEY,
  `match_id` INT NOT NULL,
  `team1_score` INT DEFAULT 0,
  `team2_score` INT DEFAULT 0,
  `winner_team_id` INT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`match_id`) REFERENCES `Tbl_matches`(`match_id`) ON DELETE CASCADE,
  FOREIGN KEY (`winner_team_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Table: Tbl_fixtures
CREATE TABLE IF NOT EXISTS `Tbl_fixtures` (
  `fixture_id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `round_name` VARCHAR(50) NOT NULL,
  `fixture_order` INT NOT NULL DEFAULT 1,
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Table: Tbl_payments
CREATE TABLE IF NOT EXISTS `Tbl_payments` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `tournament_id` INT NULL,
  `payment_type` ENUM('Hosting','Poster','Registration') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_status` ENUM('Pending','Success','Failed') DEFAULT 'Pending',
  FOREIGN KEY (`user_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Table: Tbl_notifications
CREATE TABLE IF NOT EXISTS `Tbl_notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Table: Tbl_sports
CREATE TABLE IF NOT EXISTS `Tbl_sports` (
  `sport_id` INT AUTO_INCREMENT PRIMARY KEY,
  `sport_name` VARCHAR(100) NOT NULL UNIQUE,
  `icon` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Table: Tbl_user_favorite_sports
CREATE TABLE IF NOT EXISTS `Tbl_user_favorite_sports` (
  `favorite_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `sport_id` INT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`sport_id`) REFERENCES `Tbl_sports`(`sport_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Table: Tbl_ai_recommendations
CREATE TABLE IF NOT EXISTS `Tbl_ai_recommendations` (
  `recommendation_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `tournament_id` INT NOT NULL,
  `recommendation_score` FLOAT NOT NULL DEFAULT 0.0,
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Table: Tbl_poster_templates
CREATE TABLE IF NOT EXISTS `Tbl_poster_templates` (
  `template_id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_name` VARCHAR(100) NOT NULL,
  `preview_image` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Table: Tbl_tournament_results
CREATE TABLE IF NOT EXISTS `Tbl_tournament_results` (
  `result_id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `champion_team_id` INT NULL,
  `runnerup_team_id` INT NULL,
  `third_place_team_id` INT NULL,
  `result_date` DATE NOT NULL,
  FOREIGN KEY (`tournament_id`) REFERENCES `Tbl_tournaments`(`tournament_id`) ON DELETE CASCADE,
  FOREIGN KEY (`champion_team_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE SET NULL,
  FOREIGN KEY (`runnerup_team_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE SET NULL,
  FOREIGN KEY (`third_place_team_id`) REFERENCES `Tbl_teams`(`team_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Table: Tbl_activity_logs
CREATE TABLE IF NOT EXISTS `Tbl_activity_logs` (
  `log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Tbl_users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA INSERTS FOR INITIALIZATION
-- ============================================================

INSERT INTO `Tbl_sports` (`sport_id`, `sport_name`, `icon`) VALUES
(1, 'Football', '⚽'),
(2, 'Cricket', '🏏'),
(3, 'Basketball', '🏀'),
(4, 'Tennis', '🎾'),
(5, 'Badminton', '🏸');

INSERT INTO `Tbl_users` (`user_id`, `full_name`, `email`, `password`, `role`, `district`, `status`) VALUES
(1, 'Platform Admin', 'admin@arenax.io', '$2a$10$w8.s.h580wz5z5h5w8.s.h580wz5z5', 'Admin', 'Central London', 'Active'),
(2, 'London Elite Sports Org', 'organizer@proleague.com', '$2a$10$w8.s.h580wz5z5h5w8.s.h580wz5z5', 'Organizer', 'Hackney', 'Active'),
(3, 'Alex Mercer', 'alex.player@arenax.io', '$2a$10$w8.s.h580wz5z5h5w8.s.h580wz5z5', 'LocalUser', 'London', 'Active');

INSERT INTO `Tbl_organizers` (`organizer_id`, `user_id`, `organization_name`, `approval_status`) VALUES
(1, 2, 'London Elite Sports Org', 'Approved');

INSERT INTO `Tbl_teams` (`team_id`, `owner_id`, `team_name`, `logo`, `sport`, `captain_name`) VALUES
(1, 3, 'East End Eagles FC', '⚽', 'Football', 'Alex Mercer');

INSERT INTO `Tbl_tournaments` (`tournament_id`, `organizer_id`, `tournament_name`, `sport`, `location`, `district`, `start_date`, `end_date`, `registration_deadline`, `entry_fee`, `prize_amount`, `max_teams`, `status`) VALUES
(1, 1, 'London Elite Open 5v5', 'Football', 'Hackney Marshes, London', 'Hackney', '2026-08-05', '2026-08-07', '2026-08-03', 75.00, 2500.00, 16, 'Approved');
