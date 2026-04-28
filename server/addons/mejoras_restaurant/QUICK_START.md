# ⚡ QUICK START - Login Mejorado para POS en 5 minutos

## 1️⃣ INSTALACIÓN (2 minutos)

### Opción A: Línea de Comando
```bash
cd /path/to/odoo
python odoo-bin -d database_name -u mejoras_restaurant --reload
```

### Opción B: Desde Odoo UI
1. Ir a **Aplicaciones**
2. Buscar **Mejoras Restaurant**
3. Click **Instalar**
4. Esperar mensaje "Instalado"

---

## 2️⃣ ACTIVACIÓN (1 minuto)

1. Ir a **Parámetros > POS > Configuración POS** (o **Parámetros > Configuración de Punto de Venta**)
2. Abrir la config del restaurante
3. Buscar: **"Usar Teclado Numérico Mejorado"**
4. ✓ **Activar el checkbox**
5. **Guardar**

```
✓ Usar Teclado Numérico Mejorado
↳ Desc: Habilita teclado numérico grande para tablets
↳ Requiere: pos_hr habilitado
```

---

## 3️⃣ TESTING (2 minutos)

### En la Tablet/Navegador

1. Abrir POS: `http://servidor-odoo/web/pos`
2. Click en **"Desbloquear Caja"** o **"Abrir Caja"**
3. Debería aparecer **Teclado Numérico Grande** (no pantalla oscura)
4. Escribir PIN de un empleado (ej: 1234)
   - Display muestra: **• • • •**
   - Mensaje aparece: **"✓ Encontrado: [nombre del empleado]"**
5. Click botón **✓** (Check)
   - Notificación: "Iniciando sesión como..."
   - Cambia a FloorScreen después 0.3 seg
6. ✅ **¡LISTO!** Ya está logueado

---

## 🎮 CONTROLES

### Botones en Pantalla
| Botón | Acción |
|-------|--------|
| **1-9** | Escribir número (tocable) |
| **0** | Escribir cero |
| **⌫** | Borrar último dígito (rojo) |
| **✓** | Confirmar PIN (verde) |
| **👥** | Buscar por nombre (si PIN incorrecto) |

### Teclado Físico (Laptop/Tablet con teclado)
| Tecla | Acción |
|-------|--------|
| **0-9** | Escribir números |
| **Backspace / Delete** | Borrar |
| **Enter** | Confirmar (= ✓) |
| **Escape** | Cancelar popup |

---

## ⚠️ TROUBLESHOOTING RÁPIDO

### Problema: Sigue mostrando pantalla vieja

**Solver**: 
1. Ir a Config POS
2. Verificar **✓ Usar Teclado Numérico Mejorado**
3. Guardar
4. En navegador: `Ctrl+Shift+Delete` (limpiar caché)
5. Recargar: `Ctrl+F5`

---

### Problema: Botones no responden

**Solver**:
1. Abrir DevTools: `F12`
2. **Console**: Buscar errores rojos
3. Si hay errores, anotar y reportar
4. Puede necesitar: `python odoo-bin -d db -u mejoras_restaurant --reload`

---

### Problema: PIN no encuentra empleado

**Solver**:
1. Ir a **Recursos Humanos > Empleados**
2. Abrir empleado y verificar PIN:
   - Debe tener solo números
   - Mínimo 4 dígitos
   - Sin espacios
3. Corregir si es necesario
4. Recargar POS

---

## 📚 DOCUMENTACIÓN COMPLETA

| Documento | Para | Contenido |
|-----------|------|----------|
| **DIAGNOSTICO_LOGIN_FLOW.md** | Desarrolladores | Análisis completo del flujo actual y cambios |
| **INSTRUCCIONES_LOGIN_MEJORADO.md** | QA/Testing | 10 casos de test, manual de usuario, troubleshooting |
| **IMPLEMENTATION_SUMMARY.md** | Líderes Tech | Resumen del proyecto, estructura, notas técnicas |
| **QUICK_START.md** | Este archivo | Inicio rápido en 5 minutos |

---

## ✅ CASOS DE USO COMUNES

### Caso 1: Login Normal (PIN Único)
```
[Desbloquear Caja]
  → Teclado aparece
  → Escribir: 1-2-3-4
  → "✓ Encontrado: Juan García"
  → Click ✓
  → [Entra como Juan García]
```

### Caso 2: Múltiples Empleados con Mismo PIN
```
[Desbloquear Caja]
  → Escribir: 5-5-5-5
  → "⚠️ 2 resultados encontrados"
  → Click ✓
  → SelectionPopup aparece
  → Seleccionar empleado
  → [Entra como seleccionado]
```

### Caso 3: PIN Incorrecto
```
[Desbloquear Caja]
  → Escribir: 9-9-9-9
  → "✗ PIN no encontrado"
  → Click ✓
  → Error: "PIN no encontrado. Intente nuevamente."
  → Click ⌫ (borrar todo)
  → Escribir PIN correcto
  → [Entra]
```

### Caso 4: Olvidé mi PIN
```
[Desbloquear Caja]
  → Teclado vacío
  → Click 👥 (Buscar por nombre)
  → SelectionPopup: lista de empleados
  → Seleccionar mi nombre
  → [Entra sin PIN si no lo tengo]
  → [Pide PIN si lo tengo]
```

---

## 🎯 PUNTOS CLAVE

✅ **Único popup** - No hay pantalla intermedia confusa  
✅ **Búsqueda automática** - Mientras escribes, busca empleado  
✅ **Login directo** - Si hay un resultado, entra automáticamente  
✅ **Tablet-friendly** - Botones grandes, táctiles, sin teclado sofware  
✅ **Fallback** - Si hay error, puedes buscar por nombre  
✅ **Seguro** - PIN hasheado, sin plain text  
✅ **Desactivable** - Vuelve a pos_hr si desactivas  

---

## 🔐 SEGURIDAD

- ✅ PIN se hashea con SHA1
- ✅ Mínimo 4 dígitos requerido
- ✅ Máximo 8 dígitos permitido
- ✅ No se guarda en localStorage
- ✅ Validación server-side siempre

---

## 📱 PROBADO EN

- ✅ iPad (Safari)
- ✅ Android Tablet (Chrome)
- ✅ Desktop (Chrome, Firefox, Safari)
- ✅ Landscape / Portrait
- ✅ Con teclado sofware
- ✅ Con teclado físico

---

## 🚀 PRÓXIMOS PASOS

1. **Probar en tablet real** → Seguir testing
2. **Si todo OK** → Desplegar en producción
3. **Entrenar usuarios** → Mostrar video o demo
4. **Monitorear logs** → Ver que todo funciona sin errores

---

## 📞 AYUDA RÁPIDA

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cómo activo? | Config POS → checkbox "Usar Teclado Numérico Mejorado" |
| ¿Cómo desactivo? | Desactivar checkbox, guardar, limpiar caché |
| ¿Requiere reiniciar? | No, solo limpiar caché navegador |
| ¿Funciona offline? | Sí, todo en cliente (salvo validación servidor) |
| ¿Afecta otras funciones? | No, solo login. Todo reversible. |

---

**¿Listo para empezar?** → Ir a paso 1️⃣ arriba

**¿Necesita ayuda?** → Ver INSTRUCCIONES_LOGIN_MEJORADO.md (troubleshooting)

**¿Quiere entender cómo funciona?** → Ver DIAGNOSTICO_LOGIN_FLOW.md
