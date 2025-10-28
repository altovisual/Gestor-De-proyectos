# 🎵 Proyecto Dayan - Cronograma Musical

Aplicación web moderna para gestionar el cronograma de lanzamiento del proyecto musical de Dayan.

## ✨ Características

- **Dashboard Intuitivo**: Visualiza todas las tareas del proyecto en un solo lugar
- **CRUD Completo**: ⭐ **Crear, Leer, Actualizar y Eliminar** tareas con interfaz completa
- **Sistema de Participantes**: 👥 Agrega múltiples participantes por nombre a cada tarea
- **Edición Avanzada**: Modal completo para editar toda la información de las tareas
- **Sistema de Subtareas**: Divide tareas grandes en pasos manejables con CRUD completo
- **Seguimiento de Progreso**: Barras de progreso visuales y estadísticas en tiempo real
- **Filtros Avanzados**: Busca y filtra por perspectiva o palabra clave
- **Exportación a Excel**: ⭐ **Formato idéntico al documento original** - Estructura, columnas, meses y quarters exactos
- **Persistencia de Datos**: Guarda automáticamente en el navegador
- **UI/UX Excepcional**: Diseño moderno con gradientes y animaciones suaves

## 🚀 Instalación

### Requisitos Previos
- Node.js (versión 16 o superior)
- npm o yarn

### Pasos de Instalación

1. **Navega al directorio del proyecto**
   ```bash
   cd proyecto-dayan-app
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador**
   - La aplicación estará disponible en `http://localhost:5173`

## 📊 Estructura del Proyecto

```
proyecto-dayan-app/
├── src/
│   ├── components/
│   │   └── ui/          # Componentes reutilizables (Button, Card, Input, Badge)
│   ├── data/
│   │   └── projectData.js   # Datos del proyecto (perspectivas, KPIs, meses)
│   ├── lib/
│   │   └── utils.js     # Utilidades (cn para clases CSS)
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎯 Cómo Usar

### 1. **Vista General**
   - Al abrir la app, verás el objetivo del proyecto y estadísticas generales
   - Las tarjetas muestran: Total de tareas, Completadas, En Progreso y Pendientes

### 2. **Gestionar Tareas**
   - **Buscar**: Usa la barra de búsqueda para encontrar tareas específicas
   - **Filtrar**: Selecciona una perspectiva del dropdown para filtrar
   - **Agregar**: Haz clic en "Nueva Tarea" para crear actividades personalizadas
   - **Editar**: Cada tarea tiene campos editables para responsable y fechas
   - **Subtareas**: Marca checkboxes para completar subtareas

### 3. **Perspectivas del Proyecto**
   - **Grabación del Disco**: Canciones y proceso de grabación
   - **Fans en Redes Sociales**: Estrategias de crecimiento en redes
   - **Fans en Tiendas Digitales**: Listeners y suscriptores en plataformas
   - **Marca**: Posicionamiento y brand awareness
   - **Procesos Internos**: Herramientas y seguimiento de KPIs

### 4. **Exportar Reportes**
   - Haz clic en "Exportar a Excel" en la esquina superior derecha
   - Se generará un archivo Excel con 3 hojas:
     - **Resumen**: Estadísticas generales del proyecto
     - **Cronograma**: Todas las tareas con detalles completos
     - **KPIs**: Indicadores clave de rendimiento

### 5. **Reuniones con el Equipo**
   - Usa la app durante las reuniones para:
     - Capturar ideas en tiempo real
     - Asignar responsables inmediatamente
     - Establecer fechas y plazos
     - Visualizar el progreso general

### 6. **Seguimiento Continuo**
   - Los datos se guardan automáticamente en el navegador
   - Actualiza el estatus de las tareas conforme avanzas
   - Exporta reportes periódicamente para tu jefe

## 🎨 Tecnologías Utilizadas

- **React 18**: Framework de UI moderno
- **Vite**: Build tool ultrarrápido
- **TailwindCSS**: Framework de CSS utility-first
- **Lucide React**: Iconos modernos y elegantes
- **XLSX**: Librería para exportación a Excel
- **LocalStorage**: Persistencia de datos en el navegador

## 📈 Mejoras Sugeridas

### Para el Documento Original:
1. **Agregar descripciones detalladas** a cada actividad
2. **Definir responsables específicos** desde el inicio
3. **Establecer fechas realistas** para cada tarea
4. **Incluir métricas cuantificables** en los KPIs
5. **Agregar hitos importantes** del proyecto

### Para el Uso de la App:
1. **Reuniones semanales**: Revisa el progreso con el equipo
2. **Actualización diaria**: Marca subtareas completadas
3. **Reportes mensuales**: Exporta y envía a tu jefe
4. **Documentación**: Agrega notas en las descripciones
5. **Priorización**: Usa los filtros para enfocarte en lo urgente

## 🔄 Flujo de Trabajo Recomendado

1. **Inicio de Semana**
   - Revisa todas las tareas pendientes
   - Asigna responsables para la semana
   - Establece prioridades

2. **Durante la Semana**
   - Actualiza el progreso de subtareas diariamente
   - Agrega nuevas tareas según surjan
   - Comunica bloqueos o cambios

3. **Fin de Semana**
   - Exporta el reporte semanal
   - Revisa KPIs y métricas
   - Planifica la siguiente semana

4. **Reuniones con el Equipo de Dayan**
   - Abre la app en pantalla compartida
   - Captura ideas y acuerdos en tiempo real
   - Asigna tareas inmediatamente
   - Exporta resumen de la reunión

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run preview      # Previsualiza build de producción
```

## 💡 Tips para Maximizar el Uso

1. **Personaliza las perspectivas** según las necesidades específicas del proyecto
2. **Usa las descripciones** para agregar contexto importante
3. **Establece fechas realistas** consultando con el equipo
4. **Exporta regularmente** para tener historial de progreso
5. **Comparte la URL** con el equipo para colaboración

## 📞 Soporte

Si necesitas ayuda o tienes sugerencias:
- Revisa este README
- Consulta con el equipo técnico
- Documenta problemas o mejoras necesarias

---

**Creado para el Proyecto Musical de Dayan** 🎵
*Gestión profesional de cronogramas con estilo moderno*
