-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-06-2025 a las 18:56:20
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema_escolar`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividades`
--

CREATE TABLE `actividades` (
  `id_actividad` int(11) NOT NULL,
  `nombre_actividad` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` date NOT NULL,
  `id_materia` int(11) NOT NULL,
  `ponderacion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `actividades`
--

INSERT INTO `actividades` (`id_actividad`, `nombre_actividad`, `descripcion`, `fecha_creacion`, `id_materia`, `ponderacion`) VALUES
(1, 'Waos', 'increible bro', '2025-06-06', 2, 20),
(2, 'll', 'll', '2025-06-05', 14, 20),
(3, 'ddd', 'dasd', '2025-06-11', 16, 15),
(4, 'ddd', 'ff', '2025-06-26', 16, 12),
(5, 'ddddd', 'ff', '2025-06-10', 16, 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora`
--

CREATE TABLE `bitacora` (
  `id_accion` int(11) NOT NULL,
  `accion_realizada` text NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `id_estudiante` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudades`
--

CREATE TABLE `ciudades` (
  `id_ciudad` int(11) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `ciudad` varchar(150) NOT NULL,
  `capital` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `ciudades`
--

INSERT INTO `ciudades` (`id_ciudad`, `id_estado`, `ciudad`, `capital`) VALUES
(1, 1, 'Maroa', 0),
(2, 1, 'Puerto Ayacucho', 1),
(3, 1, 'San Fernando de Atabapo', 0),
(4, 2, 'Anaco', 0),
(5, 2, 'Aragua de Barcelona', 0),
(6, 2, 'Barcelona', 1),
(7, 2, 'Boca de Uchire', 0),
(8, 2, 'Cantaura', 0),
(9, 2, 'Clarines', 0),
(10, 2, 'El Chaparro', 0),
(11, 2, 'El Pao Anzoátegui', 0),
(12, 2, 'El Tigre', 0),
(13, 2, 'El Tigrito', 0),
(14, 2, 'Guanape', 0),
(15, 2, 'Guanta', 0),
(16, 2, 'Lechería', 0),
(17, 2, 'Onoto', 0),
(18, 2, 'Pariaguán', 0),
(19, 2, 'Píritu', 0),
(20, 2, 'Puerto La Cruz', 0),
(21, 2, 'Puerto Píritu', 0),
(22, 2, 'Sabana de Uchire', 0),
(23, 2, 'San Mateo Anzoátegui', 0),
(24, 2, 'San Pablo Anzoátegui', 0),
(25, 2, 'San Tomé', 0),
(26, 2, 'Santa Ana de Anzoátegui', 0),
(27, 2, 'Santa Fe Anzoátegui', 0),
(28, 2, 'Santa Rosa', 0),
(29, 2, 'Soledad', 0),
(30, 2, 'Urica', 0),
(31, 2, 'Valle de Guanape', 0),
(43, 3, 'Achaguas', 0),
(44, 3, 'Biruaca', 0),
(45, 3, 'Bruzual', 0),
(46, 3, 'El Amparo', 0),
(47, 3, 'El Nula', 0),
(48, 3, 'Elorza', 0),
(49, 3, 'Guasdualito', 0),
(50, 3, 'Mantecal', 0),
(51, 3, 'Puerto Páez', 0),
(52, 3, 'San Fernando de Apure', 1),
(53, 3, 'San Juan de Payara', 0),
(54, 4, 'Barbacoas', 0),
(55, 4, 'Cagua', 0),
(56, 4, 'Camatagua', 0),
(58, 4, 'Choroní', 0),
(59, 4, 'Colonia Tovar', 0),
(60, 4, 'El Consejo', 0),
(61, 4, 'La Victoria', 0),
(62, 4, 'Las Tejerías', 0),
(63, 4, 'Magdaleno', 0),
(64, 4, 'Maracay', 1),
(65, 4, 'Ocumare de La Costa', 0),
(66, 4, 'Palo Negro', 0),
(67, 4, 'San Casimiro', 0),
(68, 4, 'San Mateo', 0),
(69, 4, 'San Sebastián', 0),
(70, 4, 'Santa Cruz de Aragua', 0),
(71, 4, 'Tocorón', 0),
(72, 4, 'Turmero', 0),
(73, 4, 'Villa de Cura', 0),
(74, 4, 'Zuata', 0),
(75, 5, 'Barinas', 1),
(76, 5, 'Barinitas', 0),
(77, 5, 'Barrancas', 0),
(78, 5, 'Calderas', 0),
(79, 5, 'Capitanejo', 0),
(80, 5, 'Ciudad Bolivia', 0),
(81, 5, 'El Cantón', 0),
(82, 5, 'Las Veguitas', 0),
(83, 5, 'Libertad de Barinas', 0),
(84, 5, 'Sabaneta', 0),
(85, 5, 'Santa Bárbara de Barinas', 0),
(86, 5, 'Socopó', 0),
(87, 6, 'Caicara del Orinoco', 0),
(88, 6, 'Canaima', 0),
(89, 6, 'Ciudad Bolívar', 1),
(90, 6, 'Ciudad Piar', 0),
(91, 6, 'El Callao', 0),
(92, 6, 'El Dorado', 0),
(93, 6, 'El Manteco', 0),
(94, 6, 'El Palmar', 0),
(95, 6, 'El Pao', 0),
(96, 6, 'Guasipati', 0),
(97, 6, 'Guri', 0),
(98, 6, 'La Paragua', 0),
(99, 6, 'Matanzas', 0),
(100, 6, 'Puerto Ordaz', 0),
(101, 6, 'San Félix', 0),
(102, 6, 'Santa Elena de Uairén', 0),
(103, 6, 'Tumeremo', 0),
(104, 6, 'Unare', 0),
(105, 6, 'Upata', 0),
(106, 7, 'Bejuma', 0),
(107, 7, 'Belén', 0),
(108, 7, 'Campo de Carabobo', 0),
(109, 7, 'Canoabo', 0),
(110, 7, 'Central Tacarigua', 0),
(111, 7, 'Chirgua', 0),
(112, 7, 'Ciudad Alianza', 0),
(113, 7, 'El Palito', 0),
(114, 7, 'Guacara', 0),
(115, 7, 'Guigue', 0),
(116, 7, 'Las Trincheras', 0),
(117, 7, 'Los Guayos', 0),
(118, 7, 'Mariara', 0),
(119, 7, 'Miranda', 0),
(120, 7, 'Montalbán', 0),
(121, 7, 'Morón', 0),
(122, 7, 'Naguanagua', 0),
(123, 7, 'Puerto Cabello', 0),
(124, 7, 'San Joaquín', 0),
(125, 7, 'Tocuyito', 0),
(126, 7, 'Urama', 0),
(127, 7, 'Valencia', 1),
(128, 7, 'Vigirimita', 0),
(129, 8, 'Aguirre', 0),
(130, 8, 'Apartaderos Cojedes', 0),
(131, 8, 'Arismendi', 0),
(132, 8, 'Camuriquito', 0),
(133, 8, 'El Baúl', 0),
(134, 8, 'El Limón', 0),
(135, 8, 'El Pao Cojedes', 0),
(136, 8, 'El Socorro', 0),
(137, 8, 'La Aguadita', 0),
(138, 8, 'Las Vegas', 0),
(139, 8, 'Libertad de Cojedes', 0),
(140, 8, 'Mapuey', 0),
(141, 8, 'Piñedo', 0),
(142, 8, 'Samancito', 0),
(143, 8, 'San Carlos', 1),
(144, 8, 'Sucre', 0),
(145, 8, 'Tinaco', 0),
(146, 8, 'Tinaquillo', 0),
(147, 8, 'Vallecito', 0),
(148, 9, 'Tucupita', 1),
(149, 24, 'Caracas', 1),
(150, 24, 'El Junquito', 0),
(151, 10, 'Adícora', 0),
(152, 10, 'Boca de Aroa', 0),
(153, 10, 'Cabure', 0),
(154, 10, 'Capadare', 0),
(155, 10, 'Capatárida', 0),
(156, 10, 'Chichiriviche', 0),
(157, 10, 'Churuguara', 0),
(158, 10, 'Coro', 1),
(159, 10, 'Cumarebo', 0),
(160, 10, 'Dabajuro', 0),
(161, 10, 'Judibana', 0),
(162, 10, 'La Cruz de Taratara', 0),
(163, 10, 'La Vela de Coro', 0),
(164, 10, 'Los Taques', 0),
(165, 10, 'Maparari', 0),
(166, 10, 'Mene de Mauroa', 0),
(167, 10, 'Mirimire', 0),
(168, 10, 'Pedregal', 0),
(169, 10, 'Píritu Falcón', 0),
(170, 10, 'Pueblo Nuevo Falcón', 0),
(171, 10, 'Puerto Cumarebo', 0),
(172, 10, 'Punta Cardón', 0),
(173, 10, 'Punto Fijo', 0),
(174, 10, 'San Juan de Los Cayos', 0),
(175, 10, 'San Luis', 0),
(176, 10, 'Santa Ana Falcón', 0),
(177, 10, 'Santa Cruz De Bucaral', 0),
(178, 10, 'Tocopero', 0),
(179, 10, 'Tocuyo de La Costa', 0),
(180, 10, 'Tucacas', 0),
(181, 10, 'Yaracal', 0),
(182, 11, 'Altagracia de Orituco', 0),
(183, 11, 'Cabruta', 0),
(184, 11, 'Calabozo', 0),
(185, 11, 'Camaguán', 0),
(196, 11, 'Chaguaramas Guárico', 0),
(197, 11, 'El Socorro', 0),
(198, 11, 'El Sombrero', 0),
(199, 11, 'Las Mercedes de Los Llanos', 0),
(200, 11, 'Lezama', 0),
(201, 11, 'Onoto', 0),
(202, 11, 'Ortíz', 0),
(203, 11, 'San José de Guaribe', 0),
(204, 11, 'San Juan de Los Morros', 1),
(205, 11, 'San Rafael de Laya', 0),
(206, 11, 'Santa María de Ipire', 0),
(207, 11, 'Tucupido', 0),
(208, 11, 'Valle de La Pascua', 0),
(209, 11, 'Zaraza', 0),
(210, 12, 'Aguada Grande', 0),
(211, 12, 'Atarigua', 0),
(212, 12, 'Barquisimeto', 1),
(213, 12, 'Bobare', 0),
(214, 12, 'Cabudare', 0),
(215, 12, 'Carora', 0),
(216, 12, 'Cubiro', 0),
(217, 12, 'Cují', 0),
(218, 12, 'Duaca', 0),
(219, 12, 'El Manzano', 0),
(220, 12, 'El Tocuyo', 0),
(221, 12, 'Guaríco', 0),
(222, 12, 'Humocaro Alto', 0),
(223, 12, 'Humocaro Bajo', 0),
(224, 12, 'La Miel', 0),
(225, 12, 'Moroturo', 0),
(226, 12, 'Quíbor', 0),
(227, 12, 'Río Claro', 0),
(228, 12, 'Sanare', 0),
(229, 12, 'Santa Inés', 0),
(230, 12, 'Sarare', 0),
(231, 12, 'Siquisique', 0),
(232, 12, 'Tintorero', 0),
(233, 13, 'Apartaderos Mérida', 0),
(234, 13, 'Arapuey', 0),
(235, 13, 'Bailadores', 0),
(236, 13, 'Caja Seca', 0),
(237, 13, 'Canaguá', 0),
(238, 13, 'Chachopo', 0),
(239, 13, 'Chiguara', 0),
(240, 13, 'Ejido', 0),
(241, 13, 'El Vigía', 0),
(242, 13, 'La Azulita', 0),
(243, 13, 'La Playa', 0),
(244, 13, 'Lagunillas Mérida', 0),
(245, 13, 'Mérida', 1),
(246, 13, 'Mesa de Bolívar', 0),
(247, 13, 'Mucuchíes', 0),
(248, 13, 'Mucujepe', 0),
(249, 13, 'Mucuruba', 0),
(250, 13, 'Nueva Bolivia', 0),
(251, 13, 'Palmarito', 0),
(252, 13, 'Pueblo Llano', 0),
(253, 13, 'Santa Cruz de Mora', 0),
(254, 13, 'Santa Elena de Arenales', 0),
(255, 13, 'Santo Domingo', 0),
(256, 13, 'Tabáy', 0),
(257, 13, 'Timotes', 0),
(258, 13, 'Torondoy', 0),
(259, 13, 'Tovar', 0),
(260, 13, 'Tucani', 0),
(261, 13, 'Zea', 0),
(262, 14, 'Araguita', 0),
(263, 14, 'Carrizal', 0),
(264, 14, 'Caucagua', 0),
(265, 14, 'Chaguaramas Miranda', 0),
(266, 14, 'Charallave', 0),
(267, 14, 'Chirimena', 0),
(268, 14, 'Chuspa', 0),
(269, 14, 'Cúa', 0),
(270, 14, 'Cupira', 0),
(271, 14, 'Curiepe', 0),
(272, 14, 'El Guapo', 0),
(273, 14, 'El Jarillo', 0),
(274, 14, 'Filas de Mariche', 0),
(275, 14, 'Guarenas', 0),
(276, 14, 'Guatire', 0),
(277, 14, 'Higuerote', 0),
(278, 14, 'Los Anaucos', 0),
(279, 14, 'Los Teques', 1),
(280, 14, 'Ocumare del Tuy', 0),
(281, 14, 'Panaquire', 0),
(282, 14, 'Paracotos', 0),
(283, 14, 'Río Chico', 0),
(284, 14, 'San Antonio de Los Altos', 0),
(285, 14, 'San Diego de Los Altos', 0),
(286, 14, 'San Fernando del Guapo', 0),
(287, 14, 'San Francisco de Yare', 0),
(288, 14, 'San José de Los Altos', 0),
(289, 14, 'San José de Río Chico', 0),
(290, 14, 'San Pedro de Los Altos', 0),
(291, 14, 'Santa Lucía', 0),
(292, 14, 'Santa Teresa', 0),
(293, 14, 'Tacarigua de La Laguna', 0),
(294, 14, 'Tacarigua de Mamporal', 0),
(295, 14, 'Tácata', 0),
(296, 14, 'Turumo', 0),
(297, 15, 'Aguasay', 0),
(298, 15, 'Aragua de Maturín', 0),
(299, 15, 'Barrancas del Orinoco', 0),
(300, 15, 'Caicara de Maturín', 0),
(301, 15, 'Caripe', 0),
(302, 15, 'Caripito', 0),
(303, 15, 'Chaguaramal', 0),
(305, 15, 'Chaguaramas Monagas', 0),
(307, 15, 'El Furrial', 0),
(308, 15, 'El Tejero', 0),
(309, 15, 'Jusepín', 0),
(310, 15, 'La Toscana', 0),
(311, 15, 'Maturín', 1),
(312, 15, 'Miraflores', 0),
(313, 15, 'Punta de Mata', 0),
(314, 15, 'Quiriquire', 0),
(315, 15, 'San Antonio de Maturín', 0),
(316, 15, 'San Vicente Monagas', 0),
(317, 15, 'Santa Bárbara', 0),
(318, 15, 'Temblador', 0),
(319, 15, 'Teresen', 0),
(320, 15, 'Uracoa', 0),
(321, 16, 'Altagracia', 0),
(322, 16, 'Boca de Pozo', 0),
(323, 16, 'Boca de Río', 0),
(324, 16, 'El Espinal', 0),
(325, 16, 'El Valle del Espíritu Santo', 0),
(326, 16, 'El Yaque', 0),
(327, 16, 'Juangriego', 0),
(328, 16, 'La Asunción', 1),
(329, 16, 'La Guardia', 0),
(330, 16, 'Pampatar', 0),
(331, 16, 'Porlamar', 0),
(332, 16, 'Puerto Fermín', 0),
(333, 16, 'Punta de Piedras', 0),
(334, 16, 'San Francisco de Macanao', 0),
(335, 16, 'San Juan Bautista', 0),
(336, 16, 'San Pedro de Coche', 0),
(337, 16, 'Santa Ana de Nueva Esparta', 0),
(338, 16, 'Villa Rosa', 0),
(339, 17, 'Acarigua', 0),
(340, 17, 'Agua Blanca', 0),
(341, 17, 'Araure', 0),
(342, 17, 'Biscucuy', 0),
(343, 17, 'Boconoito', 0),
(344, 17, 'Campo Elías', 0),
(345, 17, 'Chabasquén', 0),
(346, 17, 'Guanare', 1),
(347, 17, 'Guanarito', 0),
(348, 17, 'La Aparición', 0),
(349, 17, 'La Misión', 0),
(350, 17, 'Mesa de Cavacas', 0),
(351, 17, 'Ospino', 0),
(352, 17, 'Papelón', 0),
(353, 17, 'Payara', 0),
(354, 17, 'Pimpinela', 0),
(355, 17, 'Píritu de Portuguesa', 0),
(356, 17, 'San Rafael de Onoto', 0),
(357, 17, 'Santa Rosalía', 0),
(358, 17, 'Turén', 0),
(359, 18, 'Altos de Sucre', 0),
(360, 18, 'Araya', 0),
(361, 18, 'Cariaco', 0),
(362, 18, 'Carúpano', 0),
(363, 18, 'Casanay', 0),
(364, 18, 'Cumaná', 1),
(365, 18, 'Cumanacoa', 0),
(366, 18, 'El Morro Puerto Santo', 0),
(367, 18, 'El Pilar', 0),
(368, 18, 'El Poblado', 0),
(369, 18, 'Guaca', 0),
(370, 18, 'Guiria', 0),
(371, 18, 'Irapa', 0),
(372, 18, 'Manicuare', 0),
(373, 18, 'Mariguitar', 0),
(374, 18, 'Río Caribe', 0),
(375, 18, 'San Antonio del Golfo', 0),
(376, 18, 'San José de Aerocuar', 0),
(377, 18, 'San Vicente de Sucre', 0),
(378, 18, 'Santa Fe de Sucre', 0),
(379, 18, 'Tunapuy', 0),
(380, 18, 'Yaguaraparo', 0),
(381, 18, 'Yoco', 0),
(382, 19, 'Abejales', 0),
(383, 19, 'Borota', 0),
(384, 19, 'Bramon', 0),
(385, 19, 'Capacho', 0),
(386, 19, 'Colón', 0),
(387, 19, 'Coloncito', 0),
(388, 19, 'Cordero', 0),
(389, 19, 'El Cobre', 0),
(390, 19, 'El Pinal', 0),
(391, 19, 'Independencia', 0),
(392, 19, 'La Fría', 0),
(393, 19, 'La Grita', 0),
(394, 19, 'La Pedrera', 0),
(395, 19, 'La Tendida', 0),
(396, 19, 'Las Delicias', 0),
(397, 19, 'Las Hernández', 0),
(398, 19, 'Lobatera', 0),
(399, 19, 'Michelena', 0),
(400, 19, 'Palmira', 0),
(401, 19, 'Pregonero', 0),
(402, 19, 'Queniquea', 0),
(403, 19, 'Rubio', 0),
(404, 19, 'San Antonio del Tachira', 0),
(405, 19, 'San Cristobal', 1),
(406, 19, 'San José de Bolívar', 0),
(407, 19, 'San Josecito', 0),
(408, 19, 'San Pedro del Río', 0),
(409, 19, 'Santa Ana Táchira', 0),
(410, 19, 'Seboruco', 0),
(411, 19, 'Táriba', 0),
(412, 19, 'Umuquena', 0),
(413, 19, 'Ureña', 0),
(414, 20, 'Batatal', 0),
(415, 20, 'Betijoque', 0),
(416, 20, 'Boconó', 0),
(417, 20, 'Carache', 0),
(418, 20, 'Chejende', 0),
(419, 20, 'Cuicas', 0),
(420, 20, 'El Dividive', 0),
(421, 20, 'El Jaguito', 0),
(422, 20, 'Escuque', 0),
(423, 20, 'Isnotú', 0),
(424, 20, 'Jajó', 0),
(425, 20, 'La Ceiba', 0),
(426, 20, 'La Concepción de Trujllo', 0),
(427, 20, 'La Mesa de Esnujaque', 0),
(428, 20, 'La Puerta', 0),
(429, 20, 'La Quebrada', 0),
(430, 20, 'Mendoza Fría', 0),
(431, 20, 'Meseta de Chimpire', 0),
(432, 20, 'Monay', 0),
(433, 20, 'Motatán', 0),
(434, 20, 'Pampán', 0),
(435, 20, 'Pampanito', 0),
(436, 20, 'Sabana de Mendoza', 0),
(437, 20, 'San Lázaro', 0),
(438, 20, 'Santa Ana de Trujillo', 0),
(439, 20, 'Tostós', 0),
(440, 20, 'Trujillo', 1),
(441, 20, 'Valera', 0),
(442, 21, 'Carayaca', 0),
(443, 21, 'Litoral', 0),
(444, 25, 'Archipiélago Los Roques', 0),
(445, 22, 'Aroa', 0),
(446, 22, 'Boraure', 0),
(447, 22, 'Campo Elías de Yaracuy', 0),
(448, 22, 'Chivacoa', 0),
(449, 22, 'Cocorote', 0),
(450, 22, 'Farriar', 0),
(451, 22, 'Guama', 0),
(452, 22, 'Marín', 0),
(453, 22, 'Nirgua', 0),
(454, 22, 'Sabana de Parra', 0),
(455, 22, 'Salom', 0),
(456, 22, 'San Felipe', 1),
(457, 22, 'San Pablo de Yaracuy', 0),
(458, 22, 'Urachiche', 0),
(459, 22, 'Yaritagua', 0),
(460, 22, 'Yumare', 0),
(461, 23, 'Bachaquero', 0),
(462, 23, 'Bobures', 0),
(463, 23, 'Cabimas', 0),
(464, 23, 'Campo Concepción', 0),
(465, 23, 'Campo Mara', 0),
(466, 23, 'Campo Rojo', 0),
(467, 23, 'Carrasquero', 0),
(468, 23, 'Casigua', 0),
(469, 23, 'Chiquinquirá', 0),
(470, 23, 'Ciudad Ojeda', 0),
(471, 23, 'El Batey', 0),
(472, 23, 'El Carmelo', 0),
(473, 23, 'El Chivo', 0),
(474, 23, 'El Guayabo', 0),
(475, 23, 'El Mene', 0),
(476, 23, 'El Venado', 0),
(477, 23, 'Encontrados', 0),
(478, 23, 'Gibraltar', 0),
(479, 23, 'Isla de Toas', 0),
(480, 23, 'La Concepción del Zulia', 0),
(481, 23, 'La Paz', 0),
(482, 23, 'La Sierrita', 0),
(483, 23, 'Lagunillas del Zulia', 0),
(484, 23, 'Las Piedras de Perijá', 0),
(485, 23, 'Los Cortijos', 0),
(486, 23, 'Machiques', 0),
(487, 23, 'Maracaibo', 1),
(488, 23, 'Mene Grande', 0),
(489, 23, 'Palmarejo', 0),
(490, 23, 'Paraguaipoa', 0),
(491, 23, 'Potrerito', 0),
(492, 23, 'Pueblo Nuevo del Zulia', 0),
(493, 23, 'Puertos de Altagracia', 0),
(494, 23, 'Punta Gorda', 0),
(495, 23, 'Sabaneta de Palma', 0),
(496, 23, 'San Francisco', 0),
(497, 23, 'San José de Perijá', 0),
(498, 23, 'San Rafael del Moján', 0),
(499, 23, 'San Timoteo', 0),
(500, 23, 'Santa Bárbara Del Zulia', 0),
(501, 23, 'Santa Cruz de Mara', 0),
(502, 23, 'Santa Cruz del Zulia', 0),
(503, 23, 'Santa Rita', 0),
(504, 23, 'Sinamaica', 0),
(505, 23, 'Tamare', 0),
(506, 23, 'Tía Juana', 0),
(507, 23, 'Villa del Rosario', 0),
(508, 21, 'La Guaira', 1),
(509, 21, 'Catia La Mar', 0),
(510, 21, 'Macuto', 0),
(511, 21, 'Naiguatá', 0),
(512, 25, 'Archipiélago Los Monjes', 0),
(513, 25, 'Isla La Tortuga y Cayos adyacentes', 0),
(514, 25, 'Isla La Sola', 0),
(515, 25, 'Islas Los Testigos', 0),
(516, 25, 'Islas Los Frailes', 0),
(517, 25, 'Isla La Orchila', 0),
(518, 25, 'Archipiélago Las Aves', 0),
(519, 25, 'Isla de Aves', 0),
(520, 25, 'Isla La Blanquilla', 0),
(521, 25, 'Isla de Patos', 0),
(522, 25, 'Islas Los Hermanos', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios`
--

CREATE TABLE `comentarios` (
  `id_comentario` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_hora` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `comentarios`
--

INSERT INTO `comentarios` (`id_comentario`, `id_estudiante`, `mensaje`, `fecha_hora`) VALUES
(1, 1, 'dww', '2025-06-16 11:04:37'),
(2, 1, 'dww', '2025-06-16 11:07:50'),
(3, 1, 'ññ', '2025-06-16 11:11:20'),
(5, 1, 'dd', '2025-06-16 11:17:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id_curso` int(11) NOT NULL,
  `curso` varchar(45) NOT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id_curso`, `curso`, `activo`) VALUES
(1, 'Matemática', 1),
(2, 'Ciencias Naturales', 1),
(3, 'Ciencias Naturales', 1),
(4, 'Historia Universal', 1),
(5, 'Lenguaje y Literatura', 1),
(6, 'cursito', 1),
(7, 'cursito1', 1),
(8, 'yeah', 1),
(9, 'yeah1', 1),
(10, 'ws', 1),
(11, 'rn', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos_materias`
--

CREATE TABLE `cursos_materias` (
  `id_curso_materia` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `id_materia` int(11) NOT NULL,
  `id_periodo` int(11) NOT NULL,
  `id_nota` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `cursos_materias`
--

INSERT INTO `cursos_materias` (`id_curso_materia`, `id_estudiante`, `id_curso`, `id_materia`, `id_periodo`, `id_nota`) VALUES
(1, 1, 1, 4, 3, 1),
(2, 18, 3, 4, 2, 2),
(3, 18, 2, 4, 2, 3),
(4, 18, 1, 5, 5, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos_periodo`
--

CREATE TABLE `cursos_periodo` (
  `id_curso_periodo` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `id_periodo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `cursos_periodo`
--

INSERT INTO `cursos_periodo` (`id_curso_periodo`, `id_curso`, `id_periodo`) VALUES
(1, 6, 2),
(2, 7, 3),
(3, 8, 1),
(4, 9, 1),
(5, 10, 5),
(6, 11, 3),
(7, 1, 5),
(8, 2, 6),
(9, 3, 4),
(10, 4, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos_seccion`
--

CREATE TABLE `cursos_seccion` (
  `id_cursos_seccion` int(11) NOT NULL,
  `id_curso` int(11) DEFAULT NULL,
  `id_seccion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursos_seccion`
--

INSERT INTO `cursos_seccion` (`id_cursos_seccion`, `id_curso`, `id_seccion`) VALUES
(1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direccion`
--

CREATE TABLE `direccion` (
  `id_direccion` int(11) NOT NULL,
  `direccion` varchar(45) NOT NULL,
  `id_ciudad` int(11) NOT NULL,
  `id_estado` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `direccion`
--

INSERT INTO `direccion` (`id_direccion`, `direccion`, `id_ciudad`, `id_estado`) VALUES
(1, 'oo', 4, 12),
(2, 'g', 212, 12),
(3, 'g', 212, 12),
(4, 'g', 212, 12),
(5, '123', 227, 12),
(6, '123', 227, 12),
(7, '123', 248, 13),
(8, 'g', 277, 14),
(9, 'g', 277, 14),
(10, 'g', 277, 14),
(11, 'g', 225, 12),
(12, '123gg12', 55, 4),
(13, 'ggbb', 224, 12),
(14, 'oog', 1, 1),
(15, 'oogg', 1, 1),
(16, 'oogF', 1, 1),
(17, 'oogFgvvg', 1, 1),
(18, '0', 278, 14),
(19, 'g', 247, 13),
(20, 'g', 247, 13),
(21, '2', 226, 12),
(22, 'gg', 225, 12),
(23, 'gg', 279, 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados`
--

CREATE TABLE `estados` (
  `id_estado` int(11) NOT NULL,
  `estados` varchar(45) NOT NULL,
  `iso-3166-2` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `estados`
--

INSERT INTO `estados` (`id_estado`, `estados`, `iso-3166-2`) VALUES
(1, 'Amazonas', 'VE-X'),
(2, 'Anzoátegui', 'VE-B'),
(3, 'Apure', 'VE-C'),
(4, 'Aragua', 'VE-D'),
(5, 'Barinas', 'VE-E'),
(6, 'Bolívar', 'VE-F'),
(7, 'Carabobo', 'VE-G'),
(8, 'Cojedes', 'VE-H'),
(9, 'Delta Amacuro', 'VE-Y'),
(10, 'Falcón', 'VE-I'),
(11, 'Guárico', 'VE-J'),
(12, 'Lara', 'VE-K'),
(13, 'Mérida', 'VE-L'),
(14, 'Miranda', 'VE-M'),
(15, 'Monagas', 'VE-N'),
(16, 'Nueva Esparta', 'VE-O'),
(17, 'Portuguesa', 'VE-P'),
(18, 'Sucre', 'VE-R'),
(19, 'Táchira', 'VE-S'),
(20, 'Trujillo', 'VE-T'),
(21, 'La Guaira', 'VE-W'),
(22, 'Yaracuy', 'VE-U'),
(23, 'Zulia', 'VE-V'),
(24, 'Distrito Capital', 'VE-A'),
(25, 'Dependencias Federales', 'VE-Z'),
(26, 'Distrito Capital', 'DC');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id_estudiante` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id_estudiante`, `id_usuario`) VALUES
(1, 1),
(3, 11),
(12, 12),
(19, 12),
(2, 13),
(13, 13),
(18, 18);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `login`
--

CREATE TABLE `login` (
  `id_login` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_hora` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `login`
--

INSERT INTO `login` (`id_login`, `id_usuario`, `fecha_hora`) VALUES
(1, 8, '2025-06-06 22:57:40'),
(2, 8, '2025-06-06 22:59:17'),
(3, 8, '2025-06-06 23:03:19'),
(4, 8, '2025-06-06 23:05:05'),
(5, 8, '2025-06-06 23:09:28'),
(6, 8, '2025-06-06 23:10:42'),
(7, 8, '2025-06-06 23:16:53'),
(8, 8, '2025-06-06 23:21:18'),
(9, 8, '2025-06-06 23:21:44'),
(10, 9, '2025-06-06 23:25:41'),
(11, 9, '2025-06-07 00:28:27'),
(12, 9, '2025-06-07 00:36:24'),
(13, 9, '2025-06-07 01:08:01'),
(14, 9, '2025-06-07 01:08:49'),
(15, 9, '2025-06-07 01:16:51'),
(16, 9, '2025-06-07 01:44:51'),
(17, 9, '2025-06-07 03:05:19'),
(18, 9, '2025-06-07 14:54:41'),
(19, 9, '2025-06-07 16:02:22'),
(20, 9, '2025-06-07 16:07:03'),
(21, 9, '2025-06-07 17:52:53'),
(22, 9, '2025-06-07 19:32:45'),
(23, 9, '2025-06-07 20:02:00'),
(24, 9, '2025-06-08 00:40:35'),
(25, 9, '2025-06-08 00:44:57'),
(26, 9, '2025-06-08 14:07:48'),
(27, 9, '2025-06-08 14:17:32'),
(28, 9, '2025-06-08 15:24:18'),
(29, 9, '2025-06-08 18:31:38'),
(30, 9, '2025-06-08 20:03:42'),
(31, 9, '2025-06-08 20:13:19'),
(32, 9, '2025-06-08 21:51:09'),
(33, 9, '2025-06-08 22:35:01'),
(34, 9, '2025-06-08 22:59:22'),
(35, 9, '2025-06-08 23:18:10'),
(36, 9, '2025-06-09 01:13:30'),
(37, 9, '2025-06-09 02:46:45'),
(38, 9, '2025-06-09 11:42:15'),
(39, 9, '2025-06-09 12:01:13'),
(40, 9, '2025-06-09 12:30:42'),
(41, 9, '2025-06-09 13:58:42'),
(42, 9, '2025-06-09 14:44:43'),
(43, 9, '2025-06-09 16:39:55'),
(44, 9, '2025-06-10 00:27:23'),
(45, 9, '2025-06-10 00:41:11'),
(46, 9, '2025-06-10 01:28:22'),
(47, 9, '2025-06-10 01:36:16'),
(48, 9, '2025-06-10 01:41:30'),
(49, 9, '2025-06-10 01:45:31'),
(50, 9, '2025-06-10 01:46:49'),
(51, 9, '2025-06-10 03:18:04'),
(52, 9, '2025-06-10 12:12:06'),
(53, 9, '2025-06-10 13:47:36'),
(54, 9, '2025-06-10 15:31:04'),
(55, 9, '2025-06-10 15:48:36'),
(56, 9, '2025-06-10 16:02:31'),
(57, 9, '2025-06-10 18:45:18'),
(58, 9, '2025-06-10 18:47:02'),
(59, 9, '2025-06-10 19:15:39'),
(60, 9, '2025-06-10 20:22:36'),
(61, 9, '2025-06-10 21:17:27'),
(62, 9, '2025-06-10 21:51:55'),
(63, 9, '2025-06-10 22:26:56'),
(64, 9, '2025-06-11 00:55:57'),
(65, 9, '2025-06-11 01:54:11'),
(66, 9, '2025-06-11 20:10:56'),
(67, 9, '2025-06-11 21:23:40'),
(68, 9, '2025-06-11 22:09:24'),
(69, 9, '2025-06-11 22:29:58'),
(70, 9, '2025-06-12 00:02:29'),
(71, 18, '2025-06-12 01:13:41'),
(72, 9, '2025-06-12 01:33:05'),
(73, 18, '2025-06-12 01:33:16'),
(74, 18, '2025-06-12 01:55:13'),
(75, 18, '2025-06-12 01:58:17'),
(76, 18, '2025-06-12 02:05:13'),
(77, 18, '2025-06-12 02:10:41'),
(78, 18, '2025-06-12 02:16:37'),
(79, 18, '2025-06-12 02:17:41'),
(80, 8, '2025-06-14 17:50:37'),
(81, 9, '2025-06-14 17:50:46'),
(82, 9, '2025-06-14 19:16:30'),
(83, 9, '2025-06-14 20:57:33'),
(84, 9, '2025-06-14 21:28:26'),
(85, 9, '2025-06-14 23:33:36'),
(86, 9, '2025-06-15 00:01:30'),
(87, 9, '2025-06-15 00:10:02'),
(88, 9, '2025-06-15 00:50:44'),
(89, 9, '2025-06-15 01:00:50'),
(90, 9, '2025-06-15 01:06:34'),
(91, 9, '2025-06-15 02:03:53'),
(92, 9, '2025-06-15 21:37:48'),
(93, 9, '2025-06-15 23:14:29'),
(94, 9, '2025-06-16 00:47:18'),
(95, 19, '2025-06-16 14:29:29'),
(96, 9, '2025-06-16 14:29:37'),
(97, 9, '2025-06-16 15:26:25'),
(98, 9, '2025-06-16 15:50:10'),
(99, 9, '2025-06-16 18:37:08'),
(100, 9, '2025-06-16 19:18:19'),
(101, 9, '2025-06-17 00:57:43'),
(102, 9, '2025-06-17 02:01:31'),
(103, 15, '2025-06-17 02:16:46'),
(104, 15, '2025-06-17 02:33:56'),
(105, 15, '2025-06-17 02:49:29'),
(106, 15, '2025-06-17 02:53:39'),
(107, 15, '2025-06-17 02:58:37'),
(108, 15, '2025-06-17 02:59:18'),
(109, 15, '2025-06-17 03:00:32'),
(110, 15, '2025-06-17 03:01:47'),
(111, 15, '2025-06-17 03:02:39'),
(112, 15, '2025-06-17 03:02:57'),
(113, 15, '2025-06-17 03:03:10'),
(114, 15, '2025-06-17 03:03:51'),
(115, 15, '2025-06-17 03:05:27'),
(116, 9, '2025-06-17 14:00:52'),
(117, 9, '2025-06-17 14:23:42'),
(118, 9, '2025-06-17 14:29:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id_materia` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `materia` varchar(45) NOT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `materias`
--

INSERT INTO `materias` (`id_materia`, `id_curso`, `materia`, `activo`) VALUES
(2, 1, 'Álgebra', 1),
(3, 1, 'Geometría', 1),
(4, 1, 'Cálculo I', 1),
(5, 2, 'Biología', 1),
(6, 2, 'Química', 1),
(7, 2, 'Física', 1),
(8, 3, 'Historia Antigua', 1),
(9, 3, 'Historia Medieval', 1),
(10, 3, 'Historia Contemporánea', 1),
(11, 4, 'Gramática', 1),
(12, 4, 'Ortografía', 1),
(13, 4, 'Literatura Universal', 1),
(14, 7, 'roma', 1),
(15, 8, 'das', 1),
(16, 7, 'ff', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias_periodo`
--

CREATE TABLE `materias_periodo` (
  `id_materia_periodo` int(11) NOT NULL,
  `id_materia` int(11) DEFAULT NULL,
  `id_periodo` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materias_periodo`
--

INSERT INTO `materias_periodo` (`id_materia_periodo`, `id_materia`, `id_periodo`) VALUES
(1, 15, 1),
(2, 14, 3),
(3, 16, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias_seccion`
--

CREATE TABLE `materias_seccion` (
  `id_cursos_materias` int(11) NOT NULL,
  `id_materia` int(11) DEFAULT NULL,
  `id_seccion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materias_seccion`
--

INSERT INTO `materias_seccion` (`id_cursos_materias`, `id_materia`, `id_seccion`) VALUES
(1, 16, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matricula`
--

CREATE TABLE `matricula` (
  `id_matricula` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `id_periodo` int(11) NOT NULL,
  `id_seccion` int(11) NOT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `matricula`
--

INSERT INTO `matricula` (`id_matricula`, `id_estudiante`, `id_periodo`, `id_seccion`, `estado`) VALUES
(1, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matricula_curso`
--

CREATE TABLE `matricula_curso` (
  `id_matricula` int(11) NOT NULL,
  `id_matricula_curso` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `matricula_curso`
--

INSERT INTO `matricula_curso` (`id_matricula`, `id_matricula_curso`, `id_curso`) VALUES
(1, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matricula_materias`
--

CREATE TABLE `matricula_materias` (
  `id_matricula_cursos` int(11) NOT NULL,
  `id_materia` int(11) NOT NULL,
  `id_matricula` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `matricula_materias`
--

INSERT INTO `matricula_materias` (`id_matricula_cursos`, `id_materia`, `id_matricula`) VALUES
(1, 4, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nivel`
--

CREATE TABLE `nivel` (
  `id_nivel` int(11) NOT NULL,
  `tipo_nivel` enum('Administrador','Profesor','Estudiante','pendiente') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `nivel`
--

INSERT INTO `nivel` (`id_nivel`, `tipo_nivel`) VALUES
(1, 'Estudiante'),
(2, 'Administrador'),
(3, 'Profesor'),
(4, 'pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas`
--

CREATE TABLE `notas` (
  `id_nota` int(11) NOT NULL,
  `id_actividad` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `nota` decimal(5,2) NOT NULL,
  `fecha_registro` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `notas`
--

INSERT INTO `notas` (`id_nota`, `id_actividad`, `id_estudiante`, `nota`, `fecha_registro`) VALUES
(1, 1, 1, 20.00, NULL),
(2, 1, 3, 15.00, '2025-06-04'),
(3, 1, 18, 15.00, '2025-06-11'),
(4, 1, 18, 5.00, '2025-06-10'),
(5, 2, 18, 15.00, '2025-06-14'),
(6, 4, 1, 15.00, NULL),
(11, 4, 12, 14.00, NULL),
(12, 4, 13, 12.00, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_admin` int(11) NOT NULL,
  `estado` enum('pendiente','visto','procesado') DEFAULT 'pendiente',
  `mensaje` varchar(255) NOT NULL DEFAULT 'Usuario por confirmación',
  `fecha` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_admin`, `estado`, `mensaje`, `fecha`) VALUES
(2, 10, 1, 'procesado', 'Usuario por confirmación', '2025-06-07 00:52:18'),
(3, 11, 1, 'procesado', 'Usuario por confirmación', '2025-06-08 00:45:28'),
(4, 13, 1, 'procesado', 'Usuario por confirmación', '2025-06-08 00:45:06'),
(5, 14, 1, 'procesado', 'Usuario por confirmación', '2025-06-10 01:37:02'),
(6, 15, 1, 'procesado', 'Usuario por confirmación', '2025-06-10 01:42:43'),
(7, 16, 1, 'procesado', 'Usuario por confirmación', '2025-06-10 01:45:42'),
(8, 17, 1, 'procesado', 'Usuario por confirmación', '2025-06-10 19:15:52'),
(9, 18, 1, 'procesado', 'Usuario por confirmación', '2025-06-11 21:26:31'),
(10, 19, 1, 'procesado', 'Usuario por confirmación', '2025-06-17 14:29:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `periodo`
--

CREATE TABLE `periodo` (
  `id_periodo` int(11) NOT NULL,
  `periodo` varchar(45) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFinal` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `periodo`
--

INSERT INTO `periodo` (`id_periodo`, `periodo`, `fechaInicio`, `fechaFinal`) VALUES
(1, '2024 - 2025', '2024-09-01', '2025-07-15'),
(2, '2023 - 2024', '2023-09-01', '2024-07-15'),
(3, '2022 - 2023', '2022-09-01', '2023-07-15'),
(4, '2024-2025', '2025-06-04', '2025-06-26'),
(5, '2022-2028', '2025-06-03', '2025-06-27'),
(6, '2022-2027', '2025-06-02', '2025-06-25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesores`
--

CREATE TABLE `profesores` (
  `id_profesor` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `profesores`
--

INSERT INTO `profesores` (`id_profesor`, `id_usuario`) VALUES
(17, 17),
(19, 19);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seccion`
--

CREATE TABLE `seccion` (
  `id_seccion` int(11) NOT NULL,
  `seccion` varchar(45) NOT NULL,
  `estado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `seccion`
--

INSERT INTO `seccion` (`id_seccion`, `seccion`, `estado`) VALUES
(1, 'Primer Grado', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `id_nivel` int(11) NOT NULL,
  `id_direccion` int(11) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `primer_nombre` varchar(85) NOT NULL,
  `segundo_nombre` varchar(45) NOT NULL,
  `primer_apellido` varchar(45) NOT NULL,
  `segundo_apellido` varchar(45) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(60) DEFAULT NULL,
  `contraseña` varchar(60) DEFAULT NULL,
  `rol` enum('admin','estudiante','profesor','pendiente') NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `ultima_conexion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `id_nivel`, `id_direccion`, `cedula`, `primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`, `telefono`, `correo`, `contraseña`, `rol`, `estado`, `ultima_conexion`) VALUES
(1, 1, 17, '1234', 'asddf', 'qqwgh', 'cf', '1', '0412-1234567', '1@gol.com', '1', 'estudiante', 1, '2025-06-06 18:08:07'),
(6, 4, 6, '245652', 'sadasd', 'yy', 'sad', 'sw', '0412-1234567', 'ad@c.com', NULL, 'pendiente', 1, NULL),
(7, 4, 7, '12345789', 'sadasd', 'yy', 'sad', 'sw', '0412-1234567', 'ad@c.com', NULL, 'pendiente', 1, NULL),
(8, 4, 8, '245657', 'sadasd', 'yy', 'd', 'sw', '0412-1234567', 'adm@gol.com', '$2b$10$b83IfLy3Rcu.ommMdO8VVOrIGVKHs9cgLgMfhxOvXDdjq/.oxh.qq', 'pendiente', 1, '2025-06-14 17:50:37'),
(9, 2, 6, '123456789', 'lol', 'lol', 'lol', 'lol', '0412-1234567', 'admin@gol.com', '$2b$10$Q5MJY2KY/zpVZhOotsxu..8nPsqXztZuijTqb3SGVSGgb8TJEA4.e', 'admin', 1, '2025-06-17 14:29:42'),
(10, 2, 10, '1234578', 'qww', 'yy', 'sad', 'sw', '0412-4565454', 'ad@gl.com', '$2b$10$NaKd.ifu0i4.xTtn1w5v6uqUAr3Y4jOr06IsZEi6NZmlvxdBH77iG', 'profesor', 1, NULL),
(11, 1, 11, '1230785', 'qww', 'yy', 'sad', 'sw', '0412-1234567', 'ad@g.com', '$2b$10$PMpTs.g8HNedR/ceFqQyCe9qHAPCtaiius9vhPufaIc07/P2VBqDO', 'estudiante', 1, NULL),
(12, 1, 12, '45654221', 'sad', 'qwef', 'gg', 'nn', '0422-1234567', 'asd@go.com', NULL, 'estudiante', 1, NULL),
(13, 1, 13, '123475', 'gg', 'ggg', 'gg', 'gg', '0412-1234567', 'lol@lol.com', '$2b$10$hZwkptOyaa26g/mLSZOkBe15zmwLalOhSka/Ln0abQjrjEXBcbEX.', 'estudiante', 1, NULL),
(14, 3, 18, '123445', 'qww', 'wos', 'fgas', 'des', '0412-4532131', 'a@pr.com', '$2b$10$wKCIqjkT58YmD/E6w7QI5urZsxQPZSQgESuSh5cA1ZIiMlBjYpxX6', 'profesor', 1, NULL),
(15, 3, 19, '45645654', 'sa', 'g', 'fb', 'n', '0414-4554254', 'wow@pr.com', '$2b$10$06KiPvjr.G27frDwsMDtte4nWRVAEmi6Sc8Zp5TL5Fw2WKYhqHc.u', 'profesor', 1, '2025-06-17 03:05:27'),
(16, 3, 20, '45654545', '12', '123', 'fff', '45', '0412-4565454', '213@go.com', '$2b$10$wLq0RnEV.2mH.RIredTJb.ot0y3VZoXi0boKmkIgJBnlrCCWNXxe6', 'profesor', 1, NULL),
(17, 3, 21, '23456464', '123', '45', 'kkk', 'ddsa', '0412-4564554', 'f@gm.com', '$2b$10$goLVsCFbNm81Klg4YQt5VuXsWfoFK7.GF2dfJH98jiGDaDx2CguqW', 'profesor', 1, NULL),
(18, 1, 22, '234234', 'gg', 'gg', 'gg', 'gg', '0412-1234567', 'gg@gg.gg', '$2b$10$OOfknBGkYbNN9pHbQmreOOdNT/YpVIu2/v5NWwT3.USrsoUb07Ckm', 'estudiante', 1, '2025-06-12 02:17:41'),
(19, 3, 23, '2456522', 'ggg', 'dss', 'ff', 'ggg', '0412-1234567', 'son@gol.com', '$2b$10$yHEW7ucvUM0R.v4du4LB4.7gdPwbXlzaqIlgNy8wAJFcUuXtTem/K', 'profesor', 1, '2025-06-16 14:29:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_administradores`
--

CREATE TABLE `usuario_administradores` (
  `id_admin` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_nivel` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuario_administradores`
--

INSERT INTO `usuario_administradores` (`id_admin`, `id_usuario`, `id_nivel`) VALUES
(1, 9, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_cursos`
--

CREATE TABLE `usuario_cursos` (
  `id_usuario_cursos` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuario_cursos`
--

INSERT INTO `usuario_cursos` (`id_usuario_cursos`, `id_usuario`, `id_curso`, `fecha_inscripcion`) VALUES
(2, 10, 1, '2025-06-07 00:52:18'),
(5, 11, 2, '2025-06-08 00:45:28'),
(20, 13, 3, '2025-06-14 23:08:54'),
(22, 12, 3, '2025-06-14 22:28:33'),
(37, 14, 2, '2025-06-14 23:33:02'),
(38, 15, 1, '2025-06-14 23:40:18'),
(39, 16, 3, '2025-06-10 05:45:42'),
(40, 17, 2, '2025-06-10 23:15:52'),
(41, 18, 3, '2025-06-14 22:57:12'),
(42, 1, 2, '2025-06-14 22:21:59'),
(43, 19, 7, '2025-06-17 18:29:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_materias`
--

CREATE TABLE `usuario_materias` (
  `id_usuario_materias` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_materia` int(11) NOT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuario_materias`
--

INSERT INTO `usuario_materias` (`id_usuario_materias`, `id_usuario`, `id_materia`, `fecha_inscripcion`) VALUES
(2, 10, 3, '2025-06-07 00:52:18'),
(5, 11, 6, '2025-06-08 00:45:28'),
(7, 13, 9, '2025-06-14 19:08:54'),
(9, 12, 9, '2025-06-14 18:28:33'),
(24, 1, 6, '2025-06-14 18:21:59'),
(25, 14, 6, '2025-06-14 19:38:47'),
(26, 15, 3, '2025-06-14 19:40:18'),
(27, 16, 9, '2025-06-14 19:40:00'),
(28, 17, 6, '2025-06-10 19:15:52'),
(29, 18, 9, '2025-06-14 18:57:12'),
(30, 1, 14, '2025-06-15 02:16:42'),
(31, 13, 14, '2025-06-15 02:16:42'),
(32, 18, 14, '2025-06-15 02:16:42'),
(33, 16, 14, '2025-06-15 02:16:42'),
(34, 12, 14, '2025-06-15 02:17:05'),
(35, 1, 16, '2025-06-15 23:15:36'),
(36, 12, 16, '2025-06-15 23:15:36'),
(37, 13, 16, '2025-06-15 23:15:36'),
(38, 15, 16, '2025-06-15 23:15:36'),
(39, 1, 15, '2025-06-15 23:21:14'),
(40, 13, 15, '2025-06-15 23:21:14'),
(41, 18, 15, '2025-06-15 23:21:14'),
(42, 14, 15, '2025-06-15 23:21:14'),
(43, 19, 16, '2025-06-17 14:29:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_periodo`
--

CREATE TABLE `usuario_periodo` (
  `id_usuario_periodo` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_periodo` int(11) NOT NULL,
  `fecha_inscripcion` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_periodo`
--

INSERT INTO `usuario_periodo` (`id_usuario_periodo`, `id_usuario`, `id_periodo`, `fecha_inscripcion`) VALUES
(2, 11, 3, '0000-00-00'),
(4, 13, 5, '2025-06-08'),
(6, 12, 3, '2025-06-08'),
(15, 1, 2, '2025-06-14'),
(16, 18, 3, '2025-06-14'),
(17, 14, 3, '2025-06-14'),
(18, 16, 5, '2025-06-14'),
(19, 15, 4, '2025-06-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_seccion`
--

CREATE TABLE `usuario_seccion` (
  `id_usuario` int(11) NOT NULL,
  `id_usuario_seccion` int(11) NOT NULL,
  `id_seccion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_seccion`
--

INSERT INTO `usuario_seccion` (`id_usuario`, `id_usuario_seccion`, `id_seccion`) VALUES
(10, 2, 1),
(11, 5, 1),
(13, 6, 1),
(12, 8, 1),
(14, 17, 1),
(15, 18, 1),
(15, 19, 1),
(16, 20, 1),
(17, 21, 1),
(18, 22, 1),
(1, 23, 1),
(19, 24, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `actividades`
--
ALTER TABLE `actividades`
  ADD PRIMARY KEY (`id_actividad`),
  ADD KEY `fk_actividades_materia` (`id_materia`);

--
-- Indices de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  ADD PRIMARY KEY (`id_accion`),
  ADD KEY `id_estudiante` (`id_estudiante`);

--
-- Indices de la tabla `ciudades`
--
ALTER TABLE `ciudades`
  ADD PRIMARY KEY (`id_ciudad`),
  ADD KEY `id_estado` (`id_estado`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id_comentario`),
  ADD KEY `id_estudiante` (`id_estudiante`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id_curso`);

--
-- Indices de la tabla `cursos_materias`
--
ALTER TABLE `cursos_materias`
  ADD PRIMARY KEY (`id_curso_materia`),
  ADD KEY `id_estudiante` (`id_estudiante`),
  ADD KEY `id_curso` (`id_curso`),
  ADD KEY `id_materia` (`id_materia`),
  ADD KEY `id_periodo` (`id_periodo`),
  ADD KEY `id_nota` (`id_nota`);

--
-- Indices de la tabla `cursos_periodo`
--
ALTER TABLE `cursos_periodo`
  ADD PRIMARY KEY (`id_curso_periodo`),
  ADD KEY `id_curso` (`id_curso`),
  ADD KEY `id_periodo` (`id_periodo`);

--
-- Indices de la tabla `cursos_seccion`
--
ALTER TABLE `cursos_seccion`
  ADD PRIMARY KEY (`id_cursos_seccion`),
  ADD KEY `id_curso` (`id_curso`),
  ADD KEY `id_seccion` (`id_seccion`);

--
-- Indices de la tabla `direccion`
--
ALTER TABLE `direccion`
  ADD PRIMARY KEY (`id_direccion`),
  ADD KEY `id_ciudad` (`id_ciudad`),
  ADD KEY `id_estado` (`id_estado`);

--
-- Indices de la tabla `estados`
--
ALTER TABLE `estados`
  ADD PRIMARY KEY (`id_estado`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id_estudiante`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`id_login`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id_materia`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `materias_periodo`
--
ALTER TABLE `materias_periodo`
  ADD PRIMARY KEY (`id_materia_periodo`),
  ADD KEY `id_materia` (`id_materia`),
  ADD KEY `id_periodo` (`id_periodo`);

--
-- Indices de la tabla `materias_seccion`
--
ALTER TABLE `materias_seccion`
  ADD PRIMARY KEY (`id_cursos_materias`),
  ADD KEY `id_materia` (`id_materia`),
  ADD KEY `id_seccion` (`id_seccion`);

--
-- Indices de la tabla `matricula`
--
ALTER TABLE `matricula`
  ADD PRIMARY KEY (`id_matricula`),
  ADD KEY `id_estudiante` (`id_estudiante`),
  ADD KEY `id_periodo` (`id_periodo`),
  ADD KEY `id_seccion` (`id_seccion`);

--
-- Indices de la tabla `matricula_curso`
--
ALTER TABLE `matricula_curso`
  ADD PRIMARY KEY (`id_matricula_curso`),
  ADD KEY `id_matricula` (`id_matricula`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `matricula_materias`
--
ALTER TABLE `matricula_materias`
  ADD PRIMARY KEY (`id_matricula_cursos`),
  ADD KEY `id_materia` (`id_materia`),
  ADD KEY `id_matricula` (`id_matricula`);

--
-- Indices de la tabla `nivel`
--
ALTER TABLE `nivel`
  ADD PRIMARY KEY (`id_nivel`);

--
-- Indices de la tabla `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`id_nota`),
  ADD KEY `id_actividad` (`id_actividad`),
  ADD KEY `id_estudiante` (`id_estudiante`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_admin` (`id_admin`);

--
-- Indices de la tabla `periodo`
--
ALTER TABLE `periodo`
  ADD PRIMARY KEY (`id_periodo`);

--
-- Indices de la tabla `profesores`
--
ALTER TABLE `profesores`
  ADD PRIMARY KEY (`id_profesor`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `seccion`
--
ALTER TABLE `seccion`
  ADD PRIMARY KEY (`id_seccion`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD KEY `id_nivel` (`id_nivel`),
  ADD KEY `id_direccion` (`id_direccion`);

--
-- Indices de la tabla `usuario_administradores`
--
ALTER TABLE `usuario_administradores`
  ADD PRIMARY KEY (`id_admin`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_nivel` (`id_nivel`);

--
-- Indices de la tabla `usuario_cursos`
--
ALTER TABLE `usuario_cursos`
  ADD PRIMARY KEY (`id_usuario_cursos`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `usuario_materias`
--
ALTER TABLE `usuario_materias`
  ADD PRIMARY KEY (`id_usuario_materias`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_materia` (`id_materia`);

--
-- Indices de la tabla `usuario_periodo`
--
ALTER TABLE `usuario_periodo`
  ADD PRIMARY KEY (`id_usuario_periodo`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_periodo` (`id_periodo`);

--
-- Indices de la tabla `usuario_seccion`
--
ALTER TABLE `usuario_seccion`
  ADD PRIMARY KEY (`id_usuario_seccion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_seccion` (`id_seccion`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `actividades`
--
ALTER TABLE `actividades`
  MODIFY `id_actividad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  MODIFY `id_accion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id_comentario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id_curso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `cursos_materias`
--
ALTER TABLE `cursos_materias`
  MODIFY `id_curso_materia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `cursos_periodo`
--
ALTER TABLE `cursos_periodo`
  MODIFY `id_curso_periodo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `cursos_seccion`
--
ALTER TABLE `cursos_seccion`
  MODIFY `id_cursos_seccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `direccion`
--
ALTER TABLE `direccion`
  MODIFY `id_direccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `estados`
--
ALTER TABLE `estados`
  MODIFY `id_estado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id_estudiante` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `login`
--
ALTER TABLE `login`
  MODIFY `id_login` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id_materia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `materias_periodo`
--
ALTER TABLE `materias_periodo`
  MODIFY `id_materia_periodo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `materias_seccion`
--
ALTER TABLE `materias_seccion`
  MODIFY `id_cursos_materias` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `matricula`
--
ALTER TABLE `matricula`
  MODIFY `id_matricula` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `matricula_curso`
--
ALTER TABLE `matricula_curso`
  MODIFY `id_matricula_curso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `matricula_materias`
--
ALTER TABLE `matricula_materias`
  MODIFY `id_matricula_cursos` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `nivel`
--
ALTER TABLE `nivel`
  MODIFY `id_nivel` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `notas`
--
ALTER TABLE `notas`
  MODIFY `id_nota` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `periodo`
--
ALTER TABLE `periodo`
  MODIFY `id_periodo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `profesores`
--
ALTER TABLE `profesores`
  MODIFY `id_profesor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `seccion`
--
ALTER TABLE `seccion`
  MODIFY `id_seccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `usuario_administradores`
--
ALTER TABLE `usuario_administradores`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuario_cursos`
--
ALTER TABLE `usuario_cursos`
  MODIFY `id_usuario_cursos` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `usuario_materias`
--
ALTER TABLE `usuario_materias`
  MODIFY `id_usuario_materias` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `usuario_periodo`
--
ALTER TABLE `usuario_periodo`
  MODIFY `id_usuario_periodo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `usuario_seccion`
--
ALTER TABLE `usuario_seccion`
  MODIFY `id_usuario_seccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividades`
--
ALTER TABLE `actividades`
  ADD CONSTRAINT `fk_actividades_materia` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `bitacora`
--
ALTER TABLE `bitacora`
  ADD CONSTRAINT `bitacora_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ciudades`
--
ALTER TABLE `ciudades`
  ADD CONSTRAINT `ciudades_ibfk_1` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `cursos_materias`
--
ALTER TABLE `cursos_materias`
  ADD CONSTRAINT `cursos_materias_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cursos_materias_ibfk_2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cursos_materias_ibfk_3` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cursos_materias_ibfk_4` FOREIGN KEY (`id_periodo`) REFERENCES `periodo` (`id_periodo`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cursos_materias_ibfk_5` FOREIGN KEY (`id_nota`) REFERENCES `notas` (`id_nota`);

--
-- Filtros para la tabla `cursos_periodo`
--
ALTER TABLE `cursos_periodo`
  ADD CONSTRAINT `cursos_periodo_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cursos_periodo_ibfk_2` FOREIGN KEY (`id_periodo`) REFERENCES `periodo` (`id_periodo`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `cursos_seccion`
--
ALTER TABLE `cursos_seccion`
  ADD CONSTRAINT `cursos_seccion_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cursos_seccion_ibfk_2` FOREIGN KEY (`id_seccion`) REFERENCES `seccion` (`id_seccion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `direccion`
--
ALTER TABLE `direccion`
  ADD CONSTRAINT `direccion_ibfk_1` FOREIGN KEY (`id_ciudad`) REFERENCES `ciudades` (`id_ciudad`) ON UPDATE CASCADE,
  ADD CONSTRAINT `direccion_ibfk_2` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `login`
--
ALTER TABLE `login`
  ADD CONSTRAINT `login_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `materias`
--
ALTER TABLE `materias`
  ADD CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `materias_periodo`
--
ALTER TABLE `materias_periodo`
  ADD CONSTRAINT `materias_periodo_ibfk_1` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `materias_periodo_ibfk_2` FOREIGN KEY (`id_periodo`) REFERENCES `periodo` (`id_periodo`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `materias_seccion`
--
ALTER TABLE `materias_seccion`
  ADD CONSTRAINT `materias_seccion_ibfk_1` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `materias_seccion_ibfk_2` FOREIGN KEY (`id_seccion`) REFERENCES `seccion` (`id_seccion`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `matricula`
--
ALTER TABLE `matricula`
  ADD CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON UPDATE CASCADE,
  ADD CONSTRAINT `matricula_ibfk_2` FOREIGN KEY (`id_periodo`) REFERENCES `periodo` (`id_periodo`) ON UPDATE CASCADE,
  ADD CONSTRAINT `matricula_ibfk_3` FOREIGN KEY (`id_seccion`) REFERENCES `seccion` (`id_seccion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `matricula_curso`
--
ALTER TABLE `matricula_curso`
  ADD CONSTRAINT `matricula_curso_ibfk_1` FOREIGN KEY (`id_matricula`) REFERENCES `matricula` (`id_matricula`) ON UPDATE CASCADE,
  ADD CONSTRAINT `matricula_curso_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `matricula_materias`
--
ALTER TABLE `matricula_materias`
  ADD CONSTRAINT `matricula_materias_ibfk_1` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON UPDATE CASCADE,
  ADD CONSTRAINT `matricula_materias_ibfk_2` FOREIGN KEY (`id_matricula`) REFERENCES `matricula` (`id_matricula`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `notas`
--
ALTER TABLE `notas`
  ADD CONSTRAINT `notas_ibfk_1` FOREIGN KEY (`id_actividad`) REFERENCES `actividades` (`id_actividad`) ON UPDATE CASCADE,
  ADD CONSTRAINT `notas_ibfk_2` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`id_admin`) REFERENCES `usuario_administradores` (`id_admin`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_nivel`) REFERENCES `nivel` (`id_nivel`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_direccion`) REFERENCES `direccion` (`id_direccion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario_administradores`
--
ALTER TABLE `usuario_administradores`
  ADD CONSTRAINT `usuario_administradores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_administradores_ibfk_2` FOREIGN KEY (`id_nivel`) REFERENCES `nivel` (`id_nivel`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario_cursos`
--
ALTER TABLE `usuario_cursos`
  ADD CONSTRAINT `usuario_cursos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_cursos_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario_materias`
--
ALTER TABLE `usuario_materias`
  ADD CONSTRAINT `usuario_materias_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_materias_ibfk_2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario_periodo`
--
ALTER TABLE `usuario_periodo`
  ADD CONSTRAINT `usuario_periodo_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_periodo_ibfk_2` FOREIGN KEY (`id_periodo`) REFERENCES `periodo` (`id_periodo`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario_seccion`
--
ALTER TABLE `usuario_seccion`
  ADD CONSTRAINT `usuario_seccion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_seccion_ibfk_2` FOREIGN KEY (`id_seccion`) REFERENCES `seccion` (`id_seccion`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
