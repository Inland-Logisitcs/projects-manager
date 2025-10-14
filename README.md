# Sync Projects - Gestor de Proyectos Kanban

Aplicación de gestión de proyectos con tablero Kanban, desarrollada con React y Firebase.

## Características

- 🔐 Autenticación con Firebase Authentication
- 📋 Tablero Kanban con drag & drop
- 🎨 Diseño inspirado en Sync (colores y logo)
- 📱 Diseño responsive
- 🔥 Firebase Firestore para almacenamiento de datos
- ⚡ Desarrollado con Vite para un desarrollo rápido

## Estructura del Proyecto

```
sync-projects/
├── public/
│   └── logo.svg
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── KanbanBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   ├── KanbanCard.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── config/
│   │   └── firebase.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── styles/
│   │   ├── index.css
│   │   ├── Login.css
│   │   ├── Dashboard.css
│   │   └── KanbanBoard.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js
```

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** con el método de Email/Password:
   - Ve a Authentication > Sign-in method
   - Habilita "Email/Password"
3. Crea una base de datos **Firestore**:
   - Ve a Firestore Database
   - Crea la base de datos en modo "producción" o "prueba"
   - Configura las reglas de seguridad (ver abajo)
4. Copia las credenciales de tu proyecto

#### Reglas de Firestore recomendadas

**IMPORTANTE:** Esta aplicación usa la base de datos llamada **`sync-projects`**, no la base de datos por defecto `(default)`.

Para configurar las reglas de la base de datos `sync-projects`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer y escribir
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

📖 **Ver guía completa:** [SYNC_PROJECTS_DB_RULES.md](SYNC_PROJECTS_DB_RULES.md)

### 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
```

### 4. Crear usuarios en Firebase

Ya que los usuarios no pueden registrarse desde la aplicación, debes crearlos manualmente:

1. Ve a Firebase Console > Authentication > Users
2. Haz clic en "Add user"
3. Ingresa el email y contraseña del usuario
4. El usuario ya puede iniciar sesión en la aplicación

## Ejecutar la aplicación

### Modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Compilar para producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`

### Preview de producción

```bash
npm run preview
```

## Flujo de la aplicación

1. **Login**: Los usuarios deben iniciar sesión con su email y contraseña
2. **Dashboard**: Después de iniciar sesión, son redirigidos al tablero Kanban
3. **Tablero Kanban**:
   - 4 columnas: Pendiente, En Progreso, Completado, Bloqueado
   - Drag & drop de tareas entre columnas
   - Crear nuevas tareas con el botón "+"
   - Eliminar tareas desde el menú de cada tarjeta
   - Estadísticas de tareas en el header

## Colores del Tema (Sync)

- **Primary**: `#015E7C` (Harbour Blue)
- **Accent**: `#0099CC` (Light Blue)
- **Background**: `#F1F5F9` (Slate 100)
- **Estados Kanban**:
  - Pendiente: `#ffd166` (Amarillo)
  - En Progreso: `#118ab2` (Azul)
  - Completado: `#06d6a0` (Verde)
  - Bloqueado: `#ef476f` (Rojo)

## Tecnologías utilizadas

- **React 18** - Librería de UI
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Firebase** - Backend (Auth + Firestore)
- **@dnd-kit** - Drag and drop functionality

## Funcionalidades implementadas

- ✅ Persistencia de tareas en Firestore
- ✅ Sincronización en tiempo real
- ✅ Autenticación de usuarios
- ✅ Tablero Kanban con drag & drop
- ✅ CRUD completo de tareas
- ✅ Prioridades de tareas

## Próximas mejoras

- [ ] Gestión de proyectos múltiples
- [ ] Asignación de tareas a usuarios específicos
- [ ] Fechas límite y recordatorios
- [ ] Comentarios en tareas
- [ ] Panel de administración para crear usuarios
- [ ] Filtros y búsqueda de tareas
- [ ] Persistir el orden de tareas al reordenar
- [ ] Modo oscuro

## Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
