# 🛠️ Instrucciones de Instalación - Proyecto Dayan App

## 📋 Requisitos del Sistema

### Software Necesario
- **Node.js** versión 16 o superior
- **npm** (viene con Node.js)
- **Navegador web moderno** (Chrome, Firefox, Edge, Safari)

### Verificar Instalación de Node.js

Abre una terminal y ejecuta:
```bash
node --version
npm --version
```

Si no tienes Node.js instalado, descárgalo de: https://nodejs.org/

## 🚀 Instalación en Windows

### Opción 1: Usando PowerShell (Recomendado)

1. **Abrir PowerShell**
   - Presiona `Win + X`
   - Selecciona "Windows PowerShell" o "Terminal"

2. **Navegar al directorio del proyecto**
   ```powershell
   cd C:\Users\altov\Downloads\documento_dayan\proyecto-dayan-app
   ```

3. **Instalar dependencias**
   ```powershell
   npm install
   ```
   ⏱️ Esto tomará 1-2 minutos

4. **Iniciar la aplicación**
   ```powershell
   npm run dev
   ```

5. **Abrir en el navegador**
   - Abre Chrome/Edge
   - Ve a: `http://localhost:5173`

### Opción 2: Usando CMD

1. **Abrir CMD**
   - Presiona `Win + R`
   - Escribe `cmd` y presiona Enter

2. **Navegar y ejecutar**
   ```cmd
   cd C:\Users\altov\Downloads\documento_dayan\proyecto-dayan-app
   npm install
   npm run dev
   ```

## 🍎 Instalación en macOS

1. **Abrir Terminal**
   - Presiona `Cmd + Space`
   - Escribe "Terminal" y presiona Enter

2. **Navegar al directorio**
   ```bash
   cd ~/Downloads/documento_dayan/proyecto-dayan-app
   ```

3. **Instalar y ejecutar**
   ```bash
   npm install
   npm run dev
   ```

4. **Abrir navegador**
   - Safari o Chrome
   - Ve a: `http://localhost:5173`

## 🐧 Instalación en Linux

1. **Abrir Terminal**
   - `Ctrl + Alt + T`

2. **Navegar al directorio**
   ```bash
   cd ~/Downloads/documento_dayan/proyecto-dayan-app
   ```

3. **Instalar y ejecutar**
   ```bash
   npm install
   npm run dev
   ```

## 📱 Acceso desde Móvil (Misma Red WiFi)

### Paso 1: Obtener IP de tu computadora

**Windows:**
```powershell
ipconfig
```
Busca "IPv4 Address" (ejemplo: 192.168.1.100)

**macOS/Linux:**
```bash
ifconfig
```
Busca "inet" (ejemplo: 192.168.1.100)

### Paso 2: Iniciar con acceso de red

```bash
npm run dev -- --host
```

### Paso 3: Acceder desde móvil

En tu teléfono, abre el navegador y ve a:
```
http://[TU-IP]:5173
```
Ejemplo: `http://192.168.1.100:5173`

## 🔧 Solución de Problemas

### Error: "npm no se reconoce como comando"

**Solución:** Node.js no está instalado o no está en el PATH
1. Descarga Node.js de https://nodejs.org/
2. Instala con las opciones por defecto
3. Reinicia la terminal
4. Verifica: `node --version`

### Error: "Cannot find module"

**Solución:** Dependencias no instaladas
```bash
npm install
```

### Error: "Port 5173 already in use"

**Solución:** El puerto está ocupado
1. Cierra otras instancias de la app
2. O usa otro puerto:
```bash
npm run dev -- --port 3000
```

### Error: "Permission denied"

**Solución en macOS/Linux:**
```bash
sudo npm install
```

**Solución en Windows:**
- Ejecuta PowerShell como Administrador

### La página no carga / Pantalla en blanco

**Soluciones:**
1. Limpia caché del navegador: `Ctrl + Shift + Delete`
2. Prueba en modo incógnito
3. Verifica la consola del navegador (F12)
4. Reinicia el servidor:
   - `Ctrl + C` para detener
   - `npm run dev` para reiniciar

### Cambios no se reflejan

**Solución:**
1. Guarda todos los archivos
2. Espera 1-2 segundos (hot reload automático)
3. Si no funciona, recarga: `Ctrl + R`
4. Si aún no funciona, hard reload: `Ctrl + Shift + R`

## 🔄 Actualizar la Aplicación

Si se hacen cambios en el código:

1. **Detener el servidor**
   - Presiona `Ctrl + C` en la terminal

2. **Actualizar dependencias** (si es necesario)
   ```bash
   npm install
   ```

3. **Reiniciar**
   ```bash
   npm run dev
   ```

## 📦 Construir para Producción

Si quieres crear una versión optimizada:

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`

Para previsualizar la build:
```bash
npm run preview
```

## 🌐 Desplegar en Internet (Opcional)

### Opción 1: Netlify (Gratis)

1. Crea cuenta en https://netlify.com
2. Arrastra la carpeta `dist/` después de hacer `npm run build`
3. Obtén URL pública

### Opción 2: Vercel (Gratis)

1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Despliega:
   ```bash
   vercel
   ```

### Opción 3: GitHub Pages (Gratis)

1. Sube el proyecto a GitHub
2. Configura GitHub Pages
3. Accede desde: `https://[tu-usuario].github.io/proyecto-dayan-app`

## 💾 Backup de Datos

Los datos se guardan en el navegador (localStorage). Para hacer backup:

### Exportar Datos
1. Abre la app
2. Abre consola del navegador (F12)
3. Ejecuta:
   ```javascript
   localStorage.getItem('proyectoDayanTasks')
   ```
4. Copia el resultado y guárdalo en un archivo .txt

### Importar Datos
1. Abre la app
2. Abre consola del navegador (F12)
3. Ejecuta:
   ```javascript
   localStorage.setItem('proyectoDayanTasks', '[PEGA-AQUI-TUS-DATOS]')
   ```
4. Recarga la página

## 🔐 Seguridad

### Datos Locales
- Los datos se guardan solo en tu navegador
- No se envían a ningún servidor
- Son privados y seguros

### Recomendaciones
1. **Exporta regularmente** a Excel como backup
2. **No compartas** tu localStorage con desconocidos
3. **Usa HTTPS** si despliegas en internet

## 📊 Monitoreo

### Ver logs del servidor
Los logs aparecen automáticamente en la terminal donde ejecutaste `npm run dev`

### Ver errores del navegador
1. Presiona F12
2. Ve a la pestaña "Console"
3. Busca mensajes en rojo

## 🆘 Soporte Adicional

### Recursos Útiles
- **Documentación de Vite**: https://vitejs.dev/
- **Documentación de React**: https://react.dev/
- **Documentación de Tailwind**: https://tailwindcss.com/

### Comandos Útiles

```bash
# Ver versión de Node.js
node --version

# Ver versión de npm
npm --version

# Limpiar caché de npm
npm cache clean --force

# Reinstalar todo desde cero
rm -rf node_modules package-lock.json
npm install

# Ver qué está corriendo en el puerto 5173 (Windows)
netstat -ano | findstr :5173

# Ver qué está corriendo en el puerto 5173 (macOS/Linux)
lsof -i :5173
```

## ✅ Checklist de Instalación

- [ ] Node.js instalado (v16+)
- [ ] npm funcionando
- [ ] Proyecto descargado/clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Navegador abierto en `http://localhost:5173`
- [ ] Aplicación cargando correctamente
- [ ] Puedo ver las tareas
- [ ] Puedo marcar subtareas
- [ ] Puedo exportar a Excel

## 🎓 Primeros Pasos Después de Instalar

1. **Explora la interfaz** - Familiarízate con el layout
2. **Lee la GUIA_RAPIDA.md** - Aprende lo básico en 5 minutos
3. **Prueba las funcionalidades** - Marca algunas subtareas
4. **Exporta un reporte** - Verifica que funciona
5. **Lee el README.md** - Documentación completa

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa la sección "Solución de Problemas" arriba
2. Verifica los logs en la terminal
3. Revisa la consola del navegador (F12)
4. Consulta con el equipo técnico

---

**¡Listo! Ahora puedes empezar a usar la aplicación.** 🚀

Para aprender a usarla, lee: **GUIA_RAPIDA.md**
