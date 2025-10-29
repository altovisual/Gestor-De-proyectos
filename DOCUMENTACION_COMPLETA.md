# 📋 Documentación Completa - Proyecto Dayan
## Sistema de Gestión de Cronogramas Musicales

**Versión:** 1.0.0  
**Fecha:** Octubre 2025  
**Desarrollado para:** Proyecto Dayan - Cronograma Musical

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Funcionalidades Principales](#funcionalidades-principales)
4. [Integraciones](#integraciones)
5. [Base de Datos](#base-de-datos)
6. [Guía de Usuario](#guía-de-usuario)
7. [API y Servicios](#api-y-servicios)
8. [Configuración](#configuración)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Introducción

### Descripción General

El **Sistema de Gestión de Cronogramas Musicales** es una aplicación web moderna diseñada para gestionar proyectos musicales de manera eficiente. Permite la planificación, seguimiento y colaboración en tiempo real entre todos los participantes del proyecto.

### Características Destacadas

- ✅ **Sincronización en Tiempo Real** con Supabase
- ✅ **Integración con Google Calendar** para eventos automáticos
- ✅ **Notificaciones por Email** vía Gmail API
- ✅ **Gestión de Participantes** con roles y permisos
- ✅ **Múltiples Vistas** (Tarjetas, Compacta, Lista, Kanban, Quarters)
- ✅ **Sistema de Perspectivas** personalizables
- ✅ **Gestión de Ideas y Lanzamientos**
- ✅ **Exportación a Excel** con estadísticas
- ✅ **Interfaz Moderna** estilo iOS con Tailwind CSS

### Tecnologías Utilizadas

- **Frontend:** React 18.2.0 + Vite
- **Estilos:** Tailwind CSS 3.3.5
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Google OAuth 2.0
- **APIs:** Google Calendar API, Gmail API
- **Iconos:** Lucide React
- **Exportación:** XLSX

---

## 🏗️ Arquitectura del Sistema

### Estructura de Componentes

```
proyecto-dayan-app/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes UI base
│   │   ├── GoogleIntegration.jsx
│   │   ├── AppWithGoogleIntegration.jsx
│   │   └── ...
│   ├── services/           # Servicios y lógica de negocio
│   │   ├── googleAuth.js
│   │   ├── googleCalendar.js
│   │   ├── emailNotifications.js
│   │   ├── realtimeSync.js
│   │   ├── participantsSync.js
│   │   └── taskNotificationManager.js
│   ├── hooks/              # Custom React Hooks
│   │   └── useGoogleIntegration.js
│   ├── lib/                # Utilidades y configuración
│   │   ├── supabase.js
│   │   └── utils.js
│   ├── App.jsx             # Componente principal
│   └── main.jsx            # Punto de entrada
├── database/               # Scripts SQL
│   ├── tareas_realtime.sql
│   └── participantes_realtime.sql
└── public/                 # Archivos estáticos
```

### Flujo de Datos

```
Usuario → React UI → Servicios → Supabase/Google APIs
                ↓
         Estado Local (React)
                ↓
         Sincronización en Tiempo Real
                ↓
         Actualización UI Automática
```

---

## ⚡ Funcionalidades Principales

### 1. Gestión de Tareas

#### Crear Tareas
- **Campos disponibles:**
  - Perspectiva (categoría)
  - Actividad (nombre de la tarea)
  - Descripción
  - Responsable
  - Participantes (múltiples)
  - Fecha de inicio
  - Fecha de fin
  - Estado (Pendiente, En Progreso, Completado)
  - Prioridad (Alta, Media, Baja)
  - Subtareas

#### Editar Tareas
- Modificación en tiempo real
- Actualización automática en Supabase
- Notificaciones a participantes cuando hay cambios
- Sincronización con Google Calendar

#### Eliminar Tareas
- Confirmación antes de eliminar
- Eliminación del evento de Google Calendar asociado
- Eliminación en cascada de subtareas

#### Subtareas
- Crear subtareas dentro de cada tarea
- Marcar/desmarcar como completadas
- **Cálculo automático de progreso** basado en subtareas
- **Guardado automático** sin necesidad de hacer clic en "Guardar"
- Actualización del estado de la tarea principal

### 2. Vistas Múltiples

#### Vista de Tarjetas (Por defecto)
- Tarjetas visuales agrupadas por perspectiva
- Información completa de cada tarea
- Barra de progreso visual
- Botones de acción rápida

#### Vista Compacta
- Lista condensada con información esencial
- Ideal para ver muchas tareas a la vez
- Edición inline de fechas y responsables

#### Vista de Lista
- Tabla detallada con todas las columnas
- Ordenamiento por cualquier campo
- Filtros avanzados

#### Vista Kanban
- Columnas por estado (Pendiente, En Progreso, Completado)
- Drag & drop para cambiar estados
- Contadores por columna

#### Vista Quarters
- Visualización por trimestres
- Línea de tiempo visual
- Ideal para planificación a largo plazo

### 3. Sistema de Perspectivas

#### Perspectivas Predefinidas
- Grabación del Disco
- Marketing y Promoción
- Lanzamiento y Distribución
- Giras y Presentaciones
- Gestión Administrativa

#### Perspectivas Personalizadas
- Crear nuevas perspectivas
- Editar perspectivas existentes
- Eliminar perspectivas (con confirmación)
- Asignar colores personalizados

### 4. Gestión de Participantes

#### Agregar Participantes
- Nombre completo
- Email (requerido para notificaciones)
- Rol (Miembro, Líder, etc.)
- Avatar URL (opcional)

#### Sincronización en Tiempo Real
- Cambios visibles para todos los usuarios
- Almacenamiento en Supabase
- Backup en localStorage

#### Asignación a Tareas
- Autocompletado al escribir nombres
- Selección desde lista de participantes globales
- Múltiples participantes por tarea

### 5. Sistema de Notificaciones

#### Notificaciones por Email

**Cuando se asigna una tarea:**
- Email con diseño profesional
- Información completa de la tarea
- Fechas de inicio y fin
- Estado y progreso actual
- Botones de acción:
  - Aumentar progreso 25%
  - Marcar como completada
  - Ver detalles de la tarea

**Cuando cambia el progreso:**
- Notificación automática a todos los participantes
- Muestra progreso anterior y nuevo
- Información actualizada de la tarea

**Cuando cambia el estado:**
- Email informando el cambio de estado
- Estado anterior y nuevo
- Progreso actual

#### Notificaciones en la Aplicación
- Indicador de conexión en tiempo real
- Mensajes de éxito/error
- Confirmaciones de acciones

### 6. Integración con Google Calendar

#### Creación Automática de Eventos
- Al crear una tarea, se crea un evento en Google Calendar
- Incluye todos los participantes como invitados
- Fechas de inicio y fin sincronizadas
- Descripción completa de la tarea

#### Actualización de Eventos
- Cambios en la tarea se reflejan en el evento
- Notificaciones automáticas a invitados
- Colores según el estado de la tarea

#### Botón de Acceso Directo
- Botón "Ver en Calendar" en el modal de edición
- Abre directamente el evento en Google Calendar
- Solo visible si la tarea tiene evento asociado

#### Invitaciones Automáticas
- Google envía invitaciones por email a todos los participantes
- Los participantes pueden aceptar/rechazar
- El evento aparece en sus calendarios automáticamente

### 7. Gestión de Ideas

#### Crear Ideas
- Título
- Descripción
- Categoría
- Estado (Propuesta, En Revisión, Aprobada, Rechazada)

#### Convertir Ideas en Tareas
- Botón para convertir idea aprobada en tarea
- Campos pre-rellenados
- Vinculación automática

### 8. Gestión de Lanzamientos

#### Planificar Lanzamientos
- Nombre del lanzamiento
- Fecha de lanzamiento
- Tipo (Sencillo, EP, Álbum, Video)
- Estado
- Descripción

#### Seguimiento
- Lista de todos los lanzamientos
- Filtros por estado y tipo
- Edición y eliminación

### 9. KPIs y Métricas

#### Dashboard de Estadísticas
- Total de tareas
- Tareas completadas
- Tareas en progreso
- Tareas pendientes
- Tareas por prioridad
- Progreso por perspectiva

#### Filtros Inteligentes
- Filtrar por estado
- Filtrar por prioridad
- Filtrar por perspectiva
- Búsqueda por texto

### 10. Exportación de Datos

#### Exportar a Excel
- Todas las tareas con detalles completos
- Estadísticas generales
- Progreso por perspectiva
- Formato profesional con colores
- Descarga automática

---

## 🔗 Integraciones

### Google OAuth 2.0

#### Configuración
```javascript
// Variables de entorno requeridas
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

#### Scopes Solicitados
- `https://www.googleapis.com/auth/calendar` - Gestión de eventos
- `https://www.googleapis.com/auth/gmail.send` - Envío de emails
- `https://www.googleapis.com/auth/gmail.readonly` - Lectura de emails

#### Flujo de Autenticación
1. Usuario hace clic en "Autorizar Acceso"
2. Redirección a Google para autorización
3. Usuario acepta permisos
4. Callback con token de acceso
5. Token almacenado en localStorage
6. Estado actualizado automáticamente a "En vivo"

### Google Calendar API

#### Endpoints Utilizados
- `POST /calendars/primary/events` - Crear evento
- `PATCH /calendars/primary/events/{eventId}` - Actualizar evento
- `DELETE /calendars/primary/events/{eventId}` - Eliminar evento

#### Estructura de Evento
```javascript
{
  summary: "📋 Nombre de la Tarea",
  description: "Descripción completa...",
  start: { dateTime: "2025-10-29T10:00:00Z" },
  end: { dateTime: "2025-11-06T10:00:00Z" },
  attendees: [
    { email: "participante1@email.com" },
    { email: "participante2@email.com" }
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 1440 },
      { method: 'popup', minutes: 60 }
    ]
  }
}
```

### Gmail API

#### Envío de Emails
- Formato HTML con diseño responsive
- Codificación base64url
- Plantillas personalizadas

#### Tipos de Emails
1. **Asignación de Tarea**
2. **Actualización de Progreso**
3. **Cambio de Estado**
4. **Recordatorios Diarios**

### Supabase

#### Configuración
```javascript
// Variables de entorno requeridas
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

#### Tablas Utilizadas

**tareas**
- `id` (text, PK)
- `actividad` (text)
- `descripcion` (text)
- `fecha_inicio` (date)
- `fecha_fin` (date)
- `responsable` (text)
- `participantes` (jsonb)
- `estatus` (text)
- `progreso` (integer)
- `prioridad` (text)
- `subtareas` (jsonb)
- `perspectiva` (text)
- `calendar_event_id` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `updated_by` (text)

**participantes**
- `id` (text, PK)
- `nombre` (text)
- `email` (text, unique)
- `rol` (text)
- `avatar_url` (text)
- `created_by` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Realtime Subscriptions
- Escucha cambios en tabla `tareas`
- Escucha cambios en tabla `participantes`
- Actualización automática de UI

---

## 💾 Base de Datos

### Esquema de Tareas

```sql
CREATE TABLE tareas (
  id TEXT PRIMARY KEY,
  actividad TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  responsable TEXT,
  participantes JSONB DEFAULT '[]',
  estatus TEXT DEFAULT 'pendiente',
  progreso INTEGER DEFAULT 0,
  prioridad TEXT DEFAULT 'media',
  subtareas JSONB DEFAULT '[]',
  perspectiva TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tareas;
```

### Esquema de Participantes

```sql
CREATE TABLE participantes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol TEXT DEFAULT 'miembro',
  avatar_url TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE participantes;
```

### Índices Recomendados

```sql
-- Índice para búsquedas por email
CREATE INDEX idx_participantes_email ON participantes(email);

-- Índice para búsquedas por fecha
CREATE INDEX idx_tareas_fecha_inicio ON tareas(fecha_inicio);
CREATE INDEX idx_tareas_fecha_fin ON tareas(fecha_fin);

-- Índice para filtros por estado
CREATE INDEX idx_tareas_estatus ON tareas(estatus);
```

---

## 👥 Guía de Usuario

### Primeros Pasos

#### 1. Acceder a la Aplicación
- Abrir navegador web
- Navegar a la URL de la aplicación
- La aplicación carga automáticamente

#### 2. Autenticarse con Google (Opcional pero Recomendado)
1. Hacer clic en el botón de configuración (⚙️)
2. Seleccionar "Integraciones de Google"
3. Hacer clic en "Autorizar Acceso"
4. Seleccionar cuenta de Google
5. Aceptar permisos
6. El estado cambia automáticamente a "En vivo"

#### 3. Crear Primera Tarea
1. Hacer clic en "+ Nueva Tarea"
2. Seleccionar perspectiva
3. Ingresar nombre de la actividad
4. Agregar descripción (opcional)
5. Asignar responsable
6. Agregar participantes
7. Seleccionar fechas
8. Hacer clic en "Crear Tarea"

### Operaciones Comunes

#### Marcar Subtareas
1. Hacer clic en el checkbox de la subtarea
2. El progreso se calcula automáticamente
3. Se guarda inmediatamente en la base de datos
4. Los participantes reciben notificación si cambia el estado

#### Cambiar Vista
- Hacer clic en los botones de vista en la barra superior
- Opciones: Tarjetas, Compacta, Lista, Kanban, Quarters

#### Filtrar Tareas
- Usar los botones de filtro por estado
- Usar los botones de filtro por prioridad
- Usar la barra de búsqueda

#### Exportar Datos
1. Hacer clic en "Exportar"
2. El archivo Excel se descarga automáticamente
3. Incluye todas las tareas y estadísticas

### Gestión de Participantes

#### Agregar Participante Global
1. Hacer clic en "Participantes"
2. Ingresar nombre y email
3. Hacer clic en "Agregar"
4. El participante está disponible para todas las tareas

#### Asignar Participante a Tarea
1. Abrir modal de edición de tarea
2. En sección "Participantes", escribir nombre
3. Seleccionar de la lista de sugerencias
4. O hacer clic en participante de la lista global

### Gestión de Perspectivas

#### Crear Perspectiva
1. Hacer clic en "Perspectivas"
2. Ingresar nombre de la nueva perspectiva
3. Hacer clic en "Agregar"

#### Editar Perspectiva
1. Hacer clic en el icono de editar (✏️)
2. Modificar el nombre
3. Hacer clic en "Guardar"

---

## 🔧 API y Servicios

### Servicio de Autenticación (googleAuth.js)

```javascript
// Métodos principales
googleAuthService.authorize()        // Iniciar autorización
googleAuthService.isAuthenticated()  // Verificar estado
googleAuthService.getAccessToken()   // Obtener token
googleAuthService.getUserProfile()   // Obtener perfil
googleAuthService.signOut()          // Cerrar sesión
```

### Servicio de Calendar (googleCalendar.js)

```javascript
// Métodos principales
googleCalendarService.createTaskEvent(task, participants)
googleCalendarService.updateTaskEvent(eventId, task, participants)
googleCalendarService.deleteEvent(eventId)
```

### Servicio de Email (emailNotifications.js)

```javascript
// Métodos principales
emailNotificationService.sendTaskNotification(task, participant)
emailNotificationService.sendProgressUpdateNotification(task, participant, oldProgress, newProgress)
emailNotificationService.sendStatusChangeNotification(task, participant, oldStatus, newStatus)
```

### Servicio de Sincronización (realtimeSync.js)

```javascript
// Métodos principales
realtimeSyncService.startSync(callback)    // Iniciar sincronización
realtimeSyncService.stopSync()             // Detener sincronización
realtimeSyncService.saveTask(task, email)  // Guardar tarea
realtimeSyncService.deleteTask(taskId)     // Eliminar tarea
```

### Gestor de Notificaciones (taskNotificationManager.js)

```javascript
// Métodos principales
taskNotificationManager.notifyTaskAssignment(task, participants)
taskNotificationManager.notifyProgressUpdate(task, oldProgress, newProgress)
taskNotificationManager.notifyStatusChange(task, oldStatus, newStatus)
```

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Google OAuth
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
```

### Configuración de Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar APIs:
   - Google Calendar API
   - Gmail API
4. Crear credenciales OAuth 2.0
5. Agregar URIs autorizados:
   - `http://localhost:5173` (desarrollo)
   - Tu dominio de producción
6. Copiar Client ID

### Configuración de Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar scripts SQL de la carpeta `database/`
3. Habilitar Realtime en las tablas
4. Copiar URL y Anon Key del proyecto
5. Configurar políticas de seguridad (RLS)

### Instalación

```bash
# Clonar repositorio
git clone [url-del-repositorio]

# Instalar dependencias
cd proyecto-dayan-app
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## 🐛 Solución de Problemas

### Problema: No se conecta a Supabase

**Síntomas:**
- Estado muestra "Offline"
- No se cargan las tareas
- No se sincronizan cambios

**Soluciones:**
1. Verificar variables de entorno en `.env`
2. Verificar que las tablas existan en Supabase
3. Verificar que Realtime esté habilitado
4. Revisar consola del navegador para errores

### Problema: No se envían notificaciones

**Síntomas:**
- No llegan emails a participantes
- Error al crear eventos en Calendar

**Soluciones:**
1. Verificar autenticación con Google
2. Verificar que los participantes tengan emails válidos
3. Verificar scopes de OAuth
4. Revisar cuota de Gmail API

### Problema: Las fechas no se muestran correctamente

**Síntomas:**
- Fechas aparecen como "dd/mm/aaaa"
- Fechas no se guardan

**Soluciones:**
1. Verificar formato de fecha en base de datos (YYYY-MM-DD)
2. Limpiar caché del navegador
3. Verificar zona horaria del sistema

### Problema: El estado no cambia a "En vivo" después de autenticarse

**Síntomas:**
- Después de autenticarse, sigue mostrando "Offline"
- Necesita refrescar la página manualmente

**Soluciones:**
1. Verificar que el evento `google-auth-success` se esté disparando
2. Revisar consola del navegador
3. Limpiar localStorage y volver a autenticarse

### Logs y Debugging

**Activar logs detallados:**
```javascript
// En la consola del navegador
localStorage.setItem('debug', 'true')
```

**Ver estado de sincronización:**
```javascript
// En la consola del navegador
console.log('Tareas:', localStorage.getItem('proyectoDayanTasks'))
console.log('Participantes:', localStorage.getItem('proyectoDayanParticipants'))
```

---

## 📊 Métricas y Rendimiento

### Optimizaciones Implementadas

- **Lazy Loading** de componentes pesados
- **Memoización** de cálculos costosos
- **Debouncing** en búsquedas y filtros
- **Virtualización** de listas largas (pendiente)
- **Code Splitting** por rutas

### Tiempos de Respuesta Esperados

- Carga inicial: < 2 segundos
- Sincronización en tiempo real: < 500ms
- Creación de tarea: < 1 segundo
- Actualización de tarea: < 500ms
- Exportación a Excel: < 3 segundos

---

## 🔐 Seguridad

### Mejores Prácticas Implementadas

1. **Tokens de Acceso:**
   - Almacenados en localStorage
   - Expiración automática
   - Renovación automática

2. **Validación de Datos:**
   - Validación en frontend
   - Validación en backend (Supabase RLS)

3. **Protección de APIs:**
   - Rate limiting en Google APIs
   - Manejo de errores robusto

4. **Privacidad:**
   - No se almacenan contraseñas
   - Emails encriptados en tránsito
   - Cumplimiento con GDPR

---

## 📝 Notas de Versión

### v1.0.0 (Octubre 2025)

**Nuevas Funcionalidades:**
- ✅ Sistema completo de gestión de tareas
- ✅ Integración con Google Calendar
- ✅ Notificaciones por email automáticas
- ✅ Sincronización en tiempo real
- ✅ Múltiples vistas
- ✅ Gestión de participantes
- ✅ Sistema de perspectivas
- ✅ Exportación a Excel
- ✅ Actualización automática de estado al autenticarse

**Mejoras:**
- ✅ Guardado automático al marcar subtareas
- ✅ Cálculo automático de progreso
- ✅ Formato correcto de fechas
- ✅ Botón de acceso directo a Calendar
- ✅ Invitaciones automáticas a participantes

---

## 🤝 Soporte y Contacto

Para soporte técnico o consultas:
- **Email:** soporte@proyectodayan.com
- **Documentación:** [URL de documentación]
- **Issues:** [URL de GitHub Issues]

---

## 📄 Licencia

Este proyecto es propiedad de Proyecto Dayan. Todos los derechos reservados.

---

**Última actualización:** Octubre 29, 2025  
**Versión del documento:** 1.0.0
