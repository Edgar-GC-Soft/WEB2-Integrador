-- Esquema de BookFlix (MySQL 8.4, utf8mb4). seed.js crea la base de datos y ejecuta este archivo.

CREATE TABLE IF NOT EXISTS roles (
  id_rol TINYINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

INSERT IGNORE INTO roles (nombre) VALUES ('usuario'), ('administrador');

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_rol TINYINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  suscripcion_activa BOOLEAN NOT NULL DEFAULT 0,
  fecha_aceptacion_terminos DATETIME NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE IF NOT EXISTS suscripciones (
  id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  paypal_subscription_id VARCHAR(100) NOT NULL UNIQUE,
  estado ENUM('pendiente','activa','cancelada','pago_fallido','expirada') NOT NULL DEFAULT 'pendiente',
  fecha_inicio DATETIME NULL,
  fecha_proxima_renovacion DATETIME NULL,
  fecha_fin DATETIME NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pagos (
  id_pago INT AUTO_INCREMENT PRIMARY KEY,
  id_suscripcion INT NOT NULL,
  paypal_payment_id VARCHAR(100) NOT NULL UNIQUE,
  monto DECIMAL(10,2) NOT NULL,
  moneda CHAR(3) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  fecha_pago DATETIME NOT NULL,
  FOREIGN KEY (id_suscripcion) REFERENCES suscripciones(id_suscripcion) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS eventos_webhook (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  paypal_event_id VARCHAR(100) NOT NULL UNIQUE,
  tipo_evento VARCHAR(80) NOT NULL,
  id_suscripcion INT NULL,
  procesado BOOLEAN NOT NULL DEFAULT 0,
  fecha_recepcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_suscripcion) REFERENCES suscripciones(id_suscripcion) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tokens_recuperacion (
  id_token INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  fecha_expiracion DATETIME NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT 0,
  INDEX idx_token_hash (token_hash),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- ol_key = identificador del libro en Open Library (ej. /works/OL123W); ia_id = item de Internet Archive con el texto
CREATE TABLE IF NOT EXISTS libros (
  id_libro INT AUTO_INCREMENT PRIMARY KEY,
  ol_key VARCHAR(50) NOT NULL UNIQUE,
  ia_id VARCHAR(150) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255) NOT NULL,
  idioma VARCHAR(5) NOT NULL,
  anio_publicacion SMALLINT NULL,
  cover_id INT NULL,
  activo BOOLEAN NOT NULL DEFAULT 0,
  fecha_importacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_libros_titulo (titulo),
  INDEX idx_libros_autor (autor)
);

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS libro_categoria (
  id_libro INT NOT NULL,
  id_categoria INT NOT NULL,
  PRIMARY KEY (id_libro, id_categoria),
  FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoritos (
  id_usuario INT NOT NULL,
  id_libro INT NOT NULL,
  fecha_agregado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_libro),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS colecciones (
  id_coleccion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coleccion_libros (
  id_coleccion INT NOT NULL,
  id_libro INT NOT NULL,
  fecha_agregado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_coleccion, id_libro),
  FOREIGN KEY (id_coleccion) REFERENCES colecciones(id_coleccion) ON DELETE CASCADE,
  FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE
);

-- Solo se muestra a suscriptores, pero la lectura se registra para todos en registro_lecturas
CREATE TABLE IF NOT EXISTS historial_lectura (
  id_usuario INT NOT NULL,
  id_libro INT NOT NULL,
  ultimo_punto INT NOT NULL DEFAULT 0,
  fecha_ultima_lectura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_libro),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registro_lecturas (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_libro INT NOT NULL,
  fecha_lectura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registro_libro (id_libro),
  INDEX idx_registro_usuario (id_usuario),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS preferencias_lector (
  id_usuario INT PRIMARY KEY,
  modo_oscuro BOOLEAN NOT NULL DEFAULT 0,
  tamano_letra TINYINT NOT NULL DEFAULT 18,
  tipografia VARCHAR(20) NOT NULL DEFAULT 'serif',
  interlineado DECIMAL(3,1) NOT NULL DEFAULT 1.7,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
