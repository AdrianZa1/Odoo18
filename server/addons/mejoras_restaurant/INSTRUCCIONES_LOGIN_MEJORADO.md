# 📱 Login Mejorado con Teclado Numérico - Guía de Implementación y Testing

## 📋 Resumen de la Implementación

Este documento describe la mejora implementada al flujo de login del POS para tablets, incluida en el módulo `mejoras_restaurant`.

### ✅ Qué se implementó

1. **NumericKeyboardPopup** - Componente OWL con teclado numérico grande y táctil
2. **LoginScreen Override** - Extender LoginScreen para usar el nuevo popup
3. **Búsqueda Automática** - Encontrar automáticamente el empleado por PIN
4. **Config Toggle** - Checkbox para activar/desactivar la mejora
5. **Responsive Design** - Optimizado para mobile, tablet y desktop

---

## 🚀 INSTALACIÓN Y ACTIVACIÓN

### 1. Pre-requisitos

- ✅ Odoo 18 instalado
- ✅ Módulo `point_of_sale` habilitado
- ✅ Módulo `pos_restaurant` habilitado
- ✅ Módulo `pos_hr` habilitado (obligatorio)
- ✅ Módulo `mejoras_restaurant` instalado

### 2. Instalar el módulo

```bash
# En terminal de Odoo
cd /path/to/odoo
python odoo-bin -d database_name -u mejoras_restaurant
```

O manualmente en Odoo:
1. Ir a **Aplicaciones**
2. Buscar **Mejoras Restaurant**
3. Hacer click en **Instalar**

### 3. Activar la mejora en cada Config de POS

1. Ir a **Parámetros POS > Configuración POS**
2. Abrir la configuración de POS del restaurante
3. En la sección **Módulos**, buscar **"Usar Teclado Numérico Mejorado"**
4. Activar el checkbox ✓
5. Guardar

```
✓ Usar Teclado Numérico Mejorado
↳ Cuando está activo, usa nuevo flujo de login
↳ Requiere pos_hr habilitado
↳ Ideal para tablets
```

---

## 🧪 TESTING

### Test 1: Flujo Básico - PIN Único (PRIMER LOGIN)

**Escenario**: Usuario Juan García con PIN 1234

**Pasos**:
1. En el POS, hacer click en **"Desbloquear Caja"** o **"Abrir Caja"**
2. Debería aparecer directamente el **Teclado Numérico** (NO la pantalla intermedia)
3. El teclado tiene:
   - Display grande mostrando "─" (vacío)
   - Botones numéricos 0-9 grandes
   - Botones ⌫ (Borrar), ✓ (Confirmar)
   - Botón de búsqueda por nombre (👥)

**Escribir PIN**:
4. Tocar botones: **1** → **2** → **3** → **4**
5. Display muestra: **• • • •** (máscara con puntos)
6. Mientras escribe, debería aparecer mensaje: **"✓ Encontrado: Juan García"** (en verde)

**Confirmar**:
7. Tocar botón **✓** (Confirmar)
8. Momentáneamente aparece notificación: **"Iniciando sesión como Juan García..."**
9. Después de 0.5 segundos, cambia automáticamente a **FloorScreen** (o ProductScreen)
10. En navbar superior, debería ver **"Juan García"** como cajero actual

**✓ PASS**: Si todo funciona sin errores y entra directamente sin popup intermedio

**❌ FAIL**: Si aparece la pantalla intermedia de PIN de pos_hr, o si pide seleccionar empleado

---

### Test 2: Múltiples Resultados (PIN DUPLICADO)

**Escenario**: PIN 5555 está asignado a 2 empleados (Juan García, Juan García 2)

**Pasos**:
1. Click **"Desbloquear Caja"**
2. Teclado aparece
3. Escribir: **5** → **5** → **5** → **5**
4. Display muestra **• • • •**
5. Mensaje aparece (naranja): **"⚠️ 2 resultados encontrados"**
6. Click **✓** (Confirmar)
7. **SelectionPopup** se abre mostrando:
   - ◻ Juan García
   - ◻ Juan García 2
8. Seleccionar uno, click **Confirmar**
9. Login con el empleado seleccionado

**✓ PASS**: Muestra SelectionPopup solo si hay múltiples, permite elegir

**❌ FAIL**: Si no muestra el popup de selección, o si cierra sin hacer nada

---

### Test 3: PIN No Encontrado (REINTENTAR)

**Escenario**: Escribir PIN incorrecto (9999)

**Pasos**:
1. Click **"Desbloquear Caja"**
2. Escribir: **9** → **9** → **9** → **9**
3. Display muestra **• • • •**
4. Mensaje aparece (rojo): **"✗ PIN no encontrado"**
5. Click **✓** (Confirmar)
6. Notificación: **"PIN no encontrado. Intente nuevamente."**
7. **El popup se mantiene ABIERTO** (no cierra)
8. Click **⌫** (Borrar) - limpia el PIN
9. Display vuelve a **"─"**
10. Escribir PIN correcto (ej: 1234)
11. Click **✓** - Ahora sí entra

**✓ PASS**: Mantiene el popup abierto si PIN es incorrecto, permite reintentar

**❌ FAIL**: Si cierra el popup o no permite reintentar en el mismo popup

---

### Test 4: Buscar por Nombre (FALLBACK)

**Escenario**: Usuario olvida PIN, quiere seleccionar por nombre

**Pasos**:
1. Click **"Desbloquear Caja"**
2. Sin escribir nada (display = "─")
3. Click botón **👥** (Buscar por nombre)
4. **SelectionPopup** aparece con lista de todos los empleados
5. Seleccionar **"María López"**
6. Si María tiene PIN, mensaje: **"Ingrese el PIN de María López"**
   - Escribir PIN
   - Click **✓**
7. Si María NO tiene PIN, login directo sin pedir PIN
8. Entra como María López

**✓ PASS**: Buscar por nombre funciona como fallback, respeta PINs

**❌ FAIL**: Si no aparece SelectionPopup, o si el flujo es inconsistente

---

### Test 5: Teclado Físico (SOPORTE)

**Requisito**: Tablet o laptop con teclado físico o sofware

**Pasos**:
1. Click **"Desbloquear Caja"**
2. Teclado numérico aparece
3. **Escribir con teclado físico**:
   - Presionar teclas numéricas **1, 2, 3, 4**
   - Display debería actualizar en tiempo real
4. **Backspace** en teclado → Borra último dígito
5. **Delete** en teclado → Borra último dígito
6. **Enter** en teclado → Confirma (= click ✓)
7. **Escape** en teclado → Cancela popup

**✓ PASS**: Todas las teclas funcionan sin necesidad de hacer click en botones

**❌ FAIL**: Las teclas no funcionan, solo clickeable

---

### Test 6: Responsive - Mobile (< 576px)

**Requisito**: Tablet en orientación portrait (< 576px)

**Dimensiones esperadas**:
- Botones: ~ 40x40px
- Display PIN: ~ 2.5rem
- Popup ancho: 95% de pantalla

**Pasos**:
1. En DevTools, seleccionar vista Mobile (iPhone como referencia)
2. Click **"Desbloquear Caja"**
3. Teclado aparece
4. Escribir PIN tocando botones (deben ser fáciles de tocar)
5. Confirmar
6. Debería funcionar sin errores

**✓ PASS**: Botones son tocables, popup cabe en pantalla

**❌ FAIL**: Botones pequeños, popup se sale de pantalla, difícil de tocar

---

### Test 7: Responsive - Tablet Landscape (576px - 992px)

**Requisito**: Tablet en orientación landscape (ej: iPad)

**Dimensiones esperadas**:
- Botones: ~ 60x60px
- Display PIN: ~ 3rem
- Popup ancho: 85%, máx 500px
- Alturas optimizadas para landscape

**Pasos**:
1. En DevTools, seleccionar iPad landscape (768px)
2. Click **"Desbloquear Caja"**
3. Teclado aparece optimizado
4. Escribir PIN, confirmar
5. Debería verse cómodo, botones grandes

**✓ PASS**: Interfaz optimizada para landscape, sin scroll innecesario

**❌ FAIL**: Popup cortado, espaciado extraño, botones pequeños

---

### Test 8: Responsive - Desktop (≥ 992px)

**Requisito**: Monitor desktop o DevTools > 992px

**Dimensiones esperadas**:
- Botones: ~ 70x70px
- Display PIN: ~ 3.5rem
- Popup ancho: 450px fijo, centrado

**Pasos**:
1. En navegador desktop o DevTools > 992px
2. Click **"Desbloquear Caja"**
3. Popup aparece centrado, con buen espaciado
4. Escribir PIN, confirmar
5. Funciona normalmente

**✓ PASS**: Popup centrado, espaciado profesional

**❌ FAIL**: Popup muy pequeño, muy grande, o descentrado

---

### Test 9: Sin Módulo pos_improved_login Activado

**Escenario**: La mejora está deshabilitada en Config

**Pasos**:
1. En Config de POS, desactivar checkbox **"Usar Teclado Numérico Mejorado"**
2. Guardar
3. Recargar caché POS (puede necesitar recargar navegador)
4. Click **"Desbloquear Caja"**
5. Debería aparecer el **comportamiento original de pos_hr** (overlay con input + botones)

**✓ PASS**: Vuelve al flujo original sin NumericKeyboardPopup

**❌ FAIL**: Sigue usando NumericKeyboardPopup

---

### Test 10: Validación de Campos (SEGURIDAD)

**Escenario**: PIN debe tener mínimo 4 dígitos

**Pasos**:
1. Click **"Desbloquear Caja"**
2. Escribir solo **1** → **2** → **3** (3 dígitos)
3. Click **✓** (Confirmar)
4. Notificación: **"PIN debe tener al menos 4 dígitos"**
5. Popup se mantiene abierto
6. Escribir **4** (ahora 4 dígitos: 1234)
7. Click **✓**
8. Debería proceder a buscar

**✓ PASS**: Valida longitud mínima antes de procesar

**❌ FAIL**: Acepta PIN con menos de 4 dígitos

---

## 🎮 TESTING MANUAL EN TABLET (REAL)

### Preparación
- Tablet con navegador moderno (Chrome, Safari)
- Acceso a Odoo con POS habilitado
- AL MENOS 2 empleados con PINs diferentes

### Flujo Completo (5-10 minutos)

1. **Abra el POS en la tablet**
   - URL: `http://servidor-odoo/web/pos` (ajustar IP/dominio)
   - Esperar carga completa

2. **Click en "Desbloquear Caja"**
   - Debería ver teclado numérico grande

3. **Pruebe movimientos con dedo**:
   - Tocar cada botón 0-9
   - Verificar que responda rápidamente
   - Verificar que el display actualice

4. **Pruebe escribir un PIN correcto**:
   - Ingrese un PIN de un empleado existente
   - Vea el mensaje "✓ Encontrado"
   - Confirme
   - Debería entrar como ese empleado

5. **Bloquee (logout) y vuelva a intentar**:
   - Click en nombre del cajero (navbar)
   - Click en "Cerrar Sesión" o "Bloquear"
   - Vuelva al LoginScreen
   - Repita login con OTRO empleado

6. **Pruebe error consciente**:
   - Escriba PIN incorrecto
   - Vea mensaje error
   - Limpie y escriba PIN correcto
   - Confirme

7. **Mide USABILIDAD**:
   - ¿Fue más rápido que antes? ✓ ___
   - ¿Fueron los botones fáciles de tocar? ✓ ___
   - ¿Se vio bien en tablet? ✓ ___
   - ¿Sin confusión en pasos? ✓ ___

---

## 🔧 TROUBLESHOOTING

### Problema: Teclado no aparece, sigue mostrando pantalla vieja

**Causa**: Mejora no activada o caché no limpio

**Solución**:
1. Ir a Configuración POS
2. Verificar **"Usar Teclado Numérico Mejorado"** está ✓
3. Guardar
4. En navegador, limpiar caché:
   - Chrome: `Ctrl+Shift+Delete`
   - Safari: Preferencias > Privacidad > Administrar datos
   - Firefox: `Ctrl+Shift+Delete`
5. Recargar POS: `Ctrl+F5` (reload duro)
6. Intentar de nuevo

---

### Problema: Botones no responden al toucar

**Causa**: CSS o eventos no cargados correctamente

**Solución**:
1. Abrir DevTools (F12)
2. Ir a **Console**
3. Buscar errores JavaScript (iconos rojos)
4. Si hay errores, anotar y reportar
5. Puede necesitar reinstalar módulo:
   ```bash
   python odoo-bin -d database -u mejoras_restaurant --reload
   ```

---

### Problema: PIN no encuentra empleado aunque existe

**Causa**: PINs pueden estar vacíos o con espacios

**Solución**:
1. Ir a **Recursos Humanos > Empleados**
2. Abrir empleado, verificar PIN:
   - Debe tener solo dígitos
   - Mínimo 4 dígitos
   - Sin espacios al inicio/final
3. Si está mal, corregir y guardar
4. Recargar caché POS

---

### Problema: Múltiples empleados no permite seleccionar

**Causa**: SelectionPopup puede no estar cargando

**Solución**:
1. Verificar pos_hr está instalado
2. En DevTools > Network, buscar `selection_popup.js`
3. Debería tener status 200 (cargado)
4. Si hay errores 404, reinstalar punto_of_sale

---

## 📊 MONITOREO Y LOGS

### Ver logs del servidor

```bash
# Terminal donde corre Odoo
tail -f /var/log/odoo/odoo-server.log | grep -i "login\|keyboard\|cashier"
```

### Logs esperados

```
[...] El NumericKeyboardPopup se cargó correctamente
[...] SelectionPopup funciona sin errores
[...] [NumericKeyboardPopup] PIN search: "1234" → 1 match(es)
```

---

## 🎓 INSTRUCCIONES PARA USUARIOS

### Cómo usar el Teclado Numérico Mejorado (Para Mesero/Cajero)

**Primer Login**:
1. Abra el app POS en tablet
2. Toque **"Desbloquear Caja"**
3. Aparecerá teclado grande
4. **Toque los números de su PIN** (ej: 1-2-3-4)
5. Verá puntitos (• • • •) mientras escribe
6. Cuando encuentra su nombre, aparecerá mensaje verde
7. **Toque botón ✓** o presione **Enter**
8. ¡Listo! Ya está dentro

**Si comete error**:
- Toque botón **⌫** (basura) para borrar
- Reescribir el PIN
- Intentar de nuevo

**Si olvida PIN**:
- Vea botón **👥** (usuarios)
- Toque para ver lista de empleados
- Seleccione su nombre
- Ingrese PIN o continúe sin PIN (si no tiene)

---

## ✅ CHECKLIST DE VALIDACIÓN FINAL

Antes de considerar el feature como "listo para producción":

- [ ] Test 1: PIN Único - ✓ PASS
- [ ] Test 2: Múltiples Resultados - ✓ PASS
- [ ] Test 3: PIN No Encontrado - ✓ PASS
- [ ] Test 4: Búsqueda por Nombre - ✓ PASS
- [ ] Test 5: Teclado Físico - ✓ PASS
- [ ] Test 6: Mobile Responsive - ✓ PASS
- [ ] Test 7: Tablet Responsive - ✓ PASS
- [ ] Test 8: Desktop Responsive - ✓ PASS
- [ ] Test 9: Config Toggle OFF - ✓ PASS
- [ ] Test 10: Validación de Campos - ✓ PASS
- [ ] Usuarios aprueban usabilidad en tablet
- [ ] Sin errores en logs del servidor
- [ ] Sin errores en DevTools Console
- [ ] Funciona después de reiniciar Odoo

---

## 📞 SOPORTE

Si el feature no funciona como se espera:

1. **Verificar instalación**:
   ```bash
   python manage.py list | grep mejoras_restaurant
   ```

2. **Ver si está activo en Config**:
   - Ir a Parámetros POS > Configuración
   - Buscar "Usar Teclado Numérico Mejorado"

3. **Revisar logs de Odoo**:
   ```bash
   grep -i "numericKeyboard\|login\|error" odoo.log
   ```

4. **Limpiar caché y recargar**:
   ```bash
   # En navegador: Ctrl+Shift+Delete
   # En servidor: systemctl restart odoo; tail -f odoo.log
   ```

5. **Reportar con**:
   - Versión de Odoo
   - Módulos instalados
   - Captura de pantalla/video
   - Logs relevantes

---

**Implementado**: Marzo 2026
**Compatible**: Odoo 18, pos_restaurant, pos_hr
**Licencia**: LGPL-3
