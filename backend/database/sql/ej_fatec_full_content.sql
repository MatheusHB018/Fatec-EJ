-- =========================================================
-- EJ FATEC - SQL COMPLETO (estrutura + conteúdo inicial)
-- Banco alvo: ej_fatec
-- Compatível com MySQL/MariaDB (XAMPP)
-- =========================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `ej_fatec`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `ej_fatec`;

-- ---------------------------------------------------------
-- Limpeza (ordem segura)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `contacts`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `api_tokens`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `editals`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `pillars`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `team_members`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `site_sections`;
DROP TABLE IF EXISTS `site_settings`;
DROP TABLE IF EXISTS `menu_items`;

-- ---------------------------------------------------------
-- Menu/Navegação
-- ---------------------------------------------------------
CREATE TABLE `menu_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `position` INT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_items_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `menu_items` (`label`, `slug`, `position`, `is_active`) VALUES
('Início',   'inicio',   1, 1),
('Sobre',    'sobre',    2, 1),
('Equipe',   'equipe',   3, 1),
('Serviços', 'servicos', 4, 1),
('Pilares',  'pilares',  5, 1),
('Projetos', 'projetos', 6, 1),
('Editais',  'editais',  7, 1),
('Contato',  'contato',  8, 1),
('Loja',     'loja',     9, 1);

-- ---------------------------------------------------------
-- Configurações gerais do CMS
-- ---------------------------------------------------------
CREATE TABLE `site_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `site_name` VARCHAR(255) NOT NULL,
  `management_name` VARCHAR(255) NOT NULL,
  `contact_email` VARCHAR(255) NULL,
  `contact_phone` VARCHAR(50) NULL,
  `address` VARCHAR(255) NULL,
  `copyright_text` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings`
(`site_name`, `management_name`, `contact_email`, `contact_phone`, `address`, `copyright_text`)
VALUES
('Empresa Júnior FATEC', 'Gestão Pioneira 2026', 'contato@empresajuniorfatec.com.br', '(18) 3222-0000', 'Fatec Presidente Prudente - R. Cav. Luiz Antonio de Moura Andrade, s/n', '© 2026 Empresa Júnior FATEC. Todos os direitos reservados.');

-- ---------------------------------------------------------
-- Usuários do painel admin
-- ---------------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `api_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_tokens_token_hash_unique` (`token_hash`),
  KEY `api_tokens_user_id_index` (`user_id`),
  CONSTRAINT `api_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Senha padrao: admin123
INSERT INTO `users` (`name`, `email`, `password`) VALUES
('Administrador EJ', 'admin@ejfatec.com.br', '$2y$12$MSSb9eM6XGz5TIswA7kMquY4PWh05rq6ArlTc95xJ3Adxpv8uKUaW');

-- ---------------------------------------------------------
-- Tabela Settings (compatível com backend atual)
-- ---------------------------------------------------------
CREATE TABLE `settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `management_name` VARCHAR(255) NOT NULL DEFAULT 'Gestão Atual',
  `hero_title` VARCHAR(255) NULL,
  `hero_subtitle` TEXT NULL,
  `about_text` TEXT NULL,
  `contact_email` VARCHAR(255) NULL,
  `contact_phone` VARCHAR(20) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings`
(`id`, `management_name`, `hero_title`, `hero_subtitle`, `about_text`, `contact_email`, `contact_phone`)
VALUES
(1, 'Gestão Pioneira 2026', 'Transformando ideias em soluções digitais', 'Desenvolvemos projetos de tecnologia com qualidade profissional e preços acessíveis, impulsionando a inovação acadêmica.', 'Fundada no ano de 2009, a Empresa Júnior da Fatec de Presidente Prudente proporciona aos seus membros a aplicação prática de conhecimentos teóricos na área de tecnologia.', 'contato@empresajuniorfatec.com.br', '(18) 3222-0000');

-- ---------------------------------------------------------
-- Seções principais do site
-- ---------------------------------------------------------
CREATE TABLE `site_sections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT NULL,
  `content` LONGTEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_sections_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_sections` (`slug`, `title`, `subtitle`, `content`, `is_active`) VALUES
('inicio', 'Transformando ideias em soluções digitais', 'Empresa Júnior da FATEC', 'Desenvolvemos projetos de tecnologia com qualidade profissional e preços acessíveis, impulsionando a inovação acadêmica.', 1),
('sobre', 'Empresa Júnior Fatec de Presidente Prudente', 'Quem Somos', 'Fundada no ano de 2009, a Empresa Júnior da Fatec de Presidente Prudente proporciona aos seus membros a aplicação prática de conhecimentos teóricos na área de tecnologia.\n\nMissão: oferecer soluções adequadas para desenvolver membros e integrar alunos, professores e empresários.\nVisão: ser uma empresa consolidada no mercado de consultoria.\nValores: respeito, inovação, responsabilidade social e coragem.', 1),
('equipe', 'Diretoria Responsável', 'Equipe', 'Conheça os líderes que conduzem a Empresa Júnior FATEC.', 1),
('servicos', 'Soluções que impulsionam seu negócio', 'Serviços', 'Oferecemos uma gama completa de serviços tecnológicos com qualidade profissional e preços acessíveis.', 1),
('pilares', 'Nossos Pilares', NULL, 'Negócios, Social e Educação.', 1),
('projetos', 'Projetos que fizeram a diferença', 'Portfólio', 'Conheça alguns dos projetos desenvolvidos pela nossa equipe para clientes reais.', 1),
('editais', 'Área de Editais', 'Editais', 'Acompanhe os editais publicados pela Empresa Júnior Fatec de Presidente Prudente.', 1),
('contato', 'Fale Conosco', 'Contato Inteligente', 'Canal para empresas e alunos entrarem em contato com a EJ FATEC.', 1),
('loja', 'Loja EJ FATEC', NULL, 'Adquira os produtos exclusivos da nossa gestão.', 1);

-- ---------------------------------------------------------
-- Equipe
-- ---------------------------------------------------------
CREATE TABLE `team_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(150) NOT NULL,
  `initials` VARCHAR(10) NULL,
  `photo_url` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `team_members` (`name`, `role`, `initials`, `display_order`, `is_active`) VALUES
('Larissa Costa', 'Presidente', 'LC', 1, 1),
('Rafael Mendes', 'Vice-Presidente', 'RM', 2, 1),
('Ana Souza', 'Diretora de Projetos', 'AS', 3, 1),
('Gustavo Pereira', 'Diretor Financeiro', 'GP', 4, 1);

-- ---------------------------------------------------------
-- Serviços
-- ---------------------------------------------------------
CREATE TABLE `services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(100) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `services` (`title`, `description`, `icon`, `display_order`, `is_active`) VALUES
('Desenvolvimento Web', 'Sites institucionais, landing pages e sistemas web responsivos.', 'globe', 1, 1),
('Aplicativos Mobile', 'Apps nativos e híbridos para Android e iOS.', 'mobile', 2, 1),
('Design UI/UX', 'Interfaces modernas, prototipagem e design systems.', 'palette', 3, 1),
('Consultoria em TI', 'Análise de requisitos e arquitetura de sistemas.', 'display', 4, 1),
('Marketing Digital', 'SEO, redes sociais e campanhas de performance.', 'chart', 5, 1),
('Banco de Dados', 'Modelagem, otimização e administração de banco de dados.', 'database', 6, 1);

-- ---------------------------------------------------------
-- Pilares
-- ---------------------------------------------------------
CREATE TABLE `pillars` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(100) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pillars` (`title`, `description`, `icon`, `display_order`, `is_active`) VALUES
('Negócios', 'Pesquisa e consultorias para empresas.', 'briefcase', 1, 1),
('Social', 'Ações que impactam a comunidade.', 'social', 2, 1),
('Educação', 'Oficinas e capacitações que compartilham conhecimentos.', 'graduation-cap', 3, 1);

-- ---------------------------------------------------------
-- Projetos
-- ---------------------------------------------------------
CREATE TABLE `projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `technologies` TEXT NULL,
  `image_url` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` (`title`, `description`, `category`, `technologies`, `is_active`, `display_order`) VALUES
('Portal Acadêmico', 'Sistema de gerenciamento acadêmico com painel administrativo completo.', 'Web', 'React, Node.js, PostgreSQL', 1, 1),
('App de Delivery', 'Aplicativo de delivery com rastreamento em tempo real e pagamentos integrados.', 'Mobile', 'React Native, Firebase', 1, 2),
('E-commerce Fashion', 'Loja virtual completa com catálogo, carrinho e checkout integrado.', 'Web', 'Next.js, Stripe, Tailwind', 1, 3);

-- ---------------------------------------------------------
-- Editais
-- ---------------------------------------------------------
CREATE TABLE `editals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Em breve',
  `enrollment_period` VARCHAR(255) NULL,
  `file_url` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `editals` (`title`, `description`, `status`, `enrollment_period`, `is_active`, `display_order`) VALUES
('Edital 01/2026', 'Processo seletivo da Empresa Júnior Fatec de Presidente Prudente.', 'Em breve', 'Período de inscrição: a definir', 1, 1),
('Edital 02/2026', 'Chamada para projetos e parcerias institucionais.', 'Em breve', 'Período de inscrição: a definir', 1, 2),
('Edital 03/2026', 'Seleção de colaboradores para áreas administrativas e técnicas.', 'Em breve', 'Período de inscrição: a definir', 1, 3);

-- ---------------------------------------------------------
-- Loja (mesma estrutura do backend atual, com seed)
-- ---------------------------------------------------------
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(8,2) NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`name`, `description`, `price`, `image_url`, `is_active`) VALUES
('Moletom EJ FATEC', 'Produto exclusivo da gestão atual com tecido premium e acabamento reforçado.', 119.90, NULL, 1),
('Caneca Oficial EJ', 'Caneca personalizada da Empresa Júnior FATEC.', 39.90, NULL, 1),
('Planner Produtivo EJ', 'Planner para organização acadêmica e profissional.', 24.90, NULL, 1),
('Camiseta Minimal EJ', 'Camiseta oficial minimalista da EJ FATEC.', 59.90, NULL, 1);

-- ---------------------------------------------------------
-- Contato (compatível com backend atual)
-- ---------------------------------------------------------
CREATE TABLE `contacts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `profile_type` ENUM('empresa', 'aluno') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `whatsapp` VARCHAR(20) NOT NULL,
  `message` TEXT NOT NULL,
  `ra` VARCHAR(20) NULL,
  `course` VARCHAR(100) NULL,
  `period` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemplo de mensagem inicial
INSERT INTO `contacts`
(`profile_type`, `name`, `email`, `whatsapp`, `message`, `ra`, `course`, `period`)
VALUES
('empresa', 'Empresa Exemplo LTDA', 'contato@empresaexemplo.com.br', '(18) 99999-0000', 'Gostaríamos de solicitar orçamento para desenvolvimento web.', NULL, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
