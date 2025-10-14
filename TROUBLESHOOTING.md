# 🔧 Solución de Problemas - Error 400 en Firestore

## ❌ Error: 400 Bad Request

Si ves este error en la consola:
```
Failed to load resource: the server responded with a status of 400 ()
WebChannelConnection RPC 'Listen' stream transport errored
```

### 🔍 Causas posibles:

## 1. Base de datos en modo "Datastore" ❌

**Problema más común:** El proyecto tiene Firestore en modo "Datastore" en lugar de "Native Mode".

### ✅ Cómo verificar:

1. Ve a: https://console.firebase.google.com/project/production-inland/firestore
2. Si ves un mensaje como **"Cloud Firestore in Datastore Mode"** → Este es el problema
3. Si dice simplemente **"Cloud Firestore"** → Está bien

### 💡 Solución:

**Opción A: Cambiar a Native Mode (si es posible)**
- No se puede cambiar directamente
- Tendrías que crear un nuevo proyecto Firebase

**Opción B: Usar Firestore Native Mode en el mismo proyecto**
1. Ve a Firebase Console
2. Busca la opción para "Upgrade to native mode"
3. Sigue las instrucciones

**Opción C: Crear un nuevo proyecto Firebase**
1. Crea un nuevo proyecto en Firebase Console
2. Asegúrate de seleccionar "Cloud Firestore" (no Datastore)
3. Actualiza las credenciales en `.env`

---

## 2. Firestore no está habilitado 🔥

### ✅ Cómo verificar:

1. Ve a: https://console.firebase.google.com/project/production-inland/firestore
2. ¿Ves un botón "Crear base de datos"? → Firestore no está creado
3. ¿Ves "Data", "Rules", "Indexes"? → Firestore está creado

### 💡 Solución:

Sigue la guía: [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)

---

## 3. Reglas de seguridad incorrectas 🔒

### ✅ Cómo verificar:

1. Ve a: https://console.firebase.google.com/project/production-inland/firestore/rules
2. Verifica que tengas algo como:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 💡 Solución:

1. Copia las reglas de arriba
2. Pégalas en Firebase Console > Firestore > Rules
3. Haz clic en "Publicar"
4. Recarga la aplicación

---

## 4. Usuario no autenticado 👤

### ✅ Cómo verificar:

Abre la consola del navegador y busca:
```javascript
console.log('Usuario:', auth.currentUser)
```

Si es `null`, no estás autenticado.

### 💡 Solución:

1. Asegúrate de haber iniciado sesión
2. Verifica que el usuario exista en Authentication
3. Cierra sesión y vuelve a iniciar

---

## 5. Problema con la ubicación de Firestore 🌍

### ✅ Cómo verificar:

1. Ve a Firebase Console > Firestore > Data
2. En la parte superior, verifica la ubicación
3. La URL debería ser: `https://console.firebase.google.com/project/production-inland/firestore/data`

### 💡 Solución:

La ubicación solo se puede configurar al crear Firestore por primera vez. Si hay un problema, tendrías que recrear Firestore.

---

## 6. Límites de cuota excedidos 💸

### ✅ Cómo verificar:

1. Ve a: https://console.firebase.google.com/project/production-inland/usage
2. Verifica si has excedido algún límite

### 💡 Solución:

- Espera a que se reinicie la cuota (diaria)
- O actualiza a un plan de pago si es necesario

---

## 🎯 Diagnóstico rápido

### Paso 1: Abre la consola del navegador

Busca mensajes como:

#### ✅ Si ves:
```
🔥 Firebase Config: { projectId: 'production-inland', ... }
📋 Tareas cargadas: 0
```
→ Todo está bien, solo no hay tareas

#### ❌ Si ves:
```
❌ Error al escuchar tareas: { code: 'permission-denied' }
🔒 PERMISOS DENEGADOS
```
→ Problema con las reglas de seguridad

#### ❌ Si ves:
```
❌ Error al escuchar tareas: { code: 'failed-precondition' }
⚠️ BASE DE DATOS NO CREADA
```
→ Firestore no está creado

#### ❌ Si ves:
```
400 Bad Request
```
→ Probablemente modo Datastore o Firestore no habilitado

---

## 🆘 Verificación completa

Ejecuta esto en la consola del navegador:

```javascript
// 1. Verificar configuración
console.log('Config:', {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  user: auth.currentUser?.email
});

// 2. Probar conexión
import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/config/firebase';

getDocs(collection(db, 'tasks'))
  .then(snap => console.log('✅ Firestore OK, docs:', snap.size))
  .catch(err => console.error('❌ Error:', err.code, err.message));
```

---

## 📞 Necesitas ayuda?

1. Revisa la consola del navegador
2. Copia el **código de error completo**
3. Verifica **cuál de las 6 causas** aplica
4. Sigue la solución correspondiente

---

## ✅ Checklist final

Marca lo que has verificado:

- [ ] Firestore está en **Native Mode** (no Datastore)
- [ ] Base de datos Firestore **está creada**
- [ ] Reglas de seguridad **están configuradas y publicadas**
- [ ] Usuario **está autenticado**
- [ ] Firestore tiene la **ubicación correcta**
- [ ] No has **excedido los límites** de cuota
- [ ] Has **recargado la aplicación** después de cambios
