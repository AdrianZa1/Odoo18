# Mejoras Restaurant - Módulo Consolidado

**Versión:** 18.0.1.0.0  
**Categoría:** Point of Sale  
**Autor:** Custom Development  
**Licencia:** LGPL-3

---

## 📋 Descripción General

Módulo consolidado que integra 5 funcionalidades personalizadas para Odoo 18 POS Restaurant en una sola instalación. Este módulo fue creado mediante la consolidación de los siguientes módulos independientes:

- `pos_card_brand`
- `pos_header_branding`
- `pos_invoice_label_custom`
- `pos_restaurant_order_lock_after_kitchen`
- `pos_restaurant_waiter_assignment`

---

## 🎯 Funcionalidades Integradas

### 1. 💳 Selección de Marca de Tarjeta (Card Brand)

**Origen:** `pos_card_brand`

- Popup visual en cuadrícula para seleccionar marca de tarjeta durante el pago
- Captura de número de lote del voucher/datafono
- Validación obligatoria para métodos de pago marcados como tarjeta
- Visualización de marca y lote en:
  - Líneas de pago del POS
  - Tickets impresos
  - Facturas
- Teclado numérico integrado para ingreso rápido de lote

**Marcas soportadas:**
- Visa
- MasterCard
- American Express
- Diners Club
- Discover
- Otras

**Modelos extendidos:**
- `pos.payment.method` - campo `is_card_payment`
- `pos.payment` - campos `card_brand` y `lot_number`
- `account.move` - personalización de widget de pagos en facturas

### 2. 🎨 Branding Personalizado del Header

**Origen:** `pos_header_branding`

- Reemplazo del logo y texto de Odoo en el header del POS
- Logo personalizado "CHAVECITOO POS"
- Imagen SVG personalizable

**Assets:**
- Logo: `static/src/img/chavecito_logo.svg`
- Patch OWL del componente Navbar

### 3. 🧾 Etiquetas Personalizadas de Factura/Recibo

**Origen:** `pos_invoice_label_custom`

- Traducción personalizada del botón "Invoice" en pantalla de pago
- Cambio de "Recibo/Factura" → "Factura"
- Mantiene toda la funcionalidad original (marcar/desmarcar para factura)

**Traducciones:**
- Español latinoamericano (es_419)

### 4. 🔒 Bloqueo de Líneas después de Cocina

**Origen:** `pos_restaurant_order_lock_after_kitchen`

- Previene eliminación/reducción de líneas enviadas a cocina
- Requiere PIN de supervisor para modificar líneas marcadas como servidas
- Indicador visual de líneas bloqueadas con highlight
- Seguimiento de progreso de servicio por mesa
- Cálculo de tiempo de espera desde la orden

**Componentes extendidos:**
- `PosOrder` - tracking de progreso de servicio
- `OrderSummary` - restricciones de edición
- Estilos SCSS para highlights visuales

### 5. 👨‍🍳 Asignación de Mesero

**Origen:** `pos_restaurant_waiter_assignment`

- Muestra nombre del mesero encima de cada mesa en el floor plan
- Badges con colores asignados por mesero
- Asignación automática basada en usuario web logueado
- Indicador de progreso de servicio en navbar

**Características:**
- Asignación transparente al sincronizar órdenes
- Sin controles adicionales (view-only)
- Paleta de colores distintivos por mesero
- Indicador de porcentaje servido en navbar

**Modelos extendidos:**
- `pos.order` - override de `_process_order` para forzar user_id

---

## 📦 Dependencias

- `point_of_sale` (base)
- `pos_restaurant` (funcionalidad de restaurant)
- `pos_hr` (para validación de supervisor en order lock)

---

## 🔧 Instalación

### Método 1: Desde la interfaz de Odoo

1. Actualizar lista de aplicaciones
2. Buscar "Mejoras Restaurant"
3. Hacer clic en "Instalar"
4. Reiniciar servidor Odoo

### Método 2: Línea de comandos

```powershell
# Activar entorno virtual
& "c:\Program Files\Odoo 18\.venv\Scripts\Activate.ps1"

# Navegar a carpeta del servidor
cd "c:\Program Files\Odoo 18\server"

# Actualizar módulo (si ya estaba instalado)
& "c:\Program Files\Odoo 18\python\python.exe" odoo-bin -c odoo.conf -u mejoras_restaurant -d openpg

# O instalar por primera vez
& "c:\Program Files\Odoo 18\python\python.exe" odoo-bin -c odoo.conf -i mejoras_restaurant -d openpg
```

### Desinstalar módulos antiguos

**IMPORTANTE:** Antes de instalar `mejoras_restaurant`, debes desinstalar los 5 módulos individuales si están instalados:

```powershell
# Desinstalar módulos antiguos
& "c:\Program Files\Odoo 18\python\python.exe" odoo-bin -c odoo.conf \
  -u pos_card_brand,pos_header_branding,pos_invoice_label_custom,pos_restaurant_order_lock_after_kitchen,pos_restaurant_waiter_assignment \
  --uninstall -d openpg
```

---

## 📂 Estructura del Módulo

```
mejoras_restaurant/
├── __init__.py
├── __manifest__.py
├── README.md
│
├── models/
│   ├── __init__.py
│   ├── pos_payment_method.py      # Card brand config
│   ├── pos_payment.py              # Card brand & lot number
│   ├── account_move.py             # Invoice payment widget
│   └── pos_order.py                # Waiter assignment logic
│
├── views/
│   ├── pos_payment_method_views.xml
│   └── pos_payment_views.xml
│
├── security/
│   └── ir.model.access.csv
│
├── i18n/
│   └── es_419.po
│
└── static/src/
    ├── js/
    │   ├── card_brand/
    │   │   ├── models.js
    │   │   ├── card_brand_data.js
    │   │   ├── card_brand_popup.js
    │   │   └── payment_screen.js
    │   ├── header_branding/
    │   │   └── pos_header_patch.js
    │   ├── order_lock/
    │   │   ├── order_summary_restriction.js
    │   │   └── orderline_highlight.js
    │   └── waiter_assignment/
    │       ├── floor_screen.js
    │       └── navbar_progress.js
    │
    ├── xml/
    │   ├── card_brand/
    │   │   ├── card_brand_popup.xml
    │   │   └── payment_line.xml
    │   ├── header_branding/
    │   │   └── pos_header.xml
    │   └── waiter_assignment/
    │       ├── floor_screen.xml
    │       └── navbar_progress.xml
    │
    ├── scss/
    │   ├── card_brand_popup.scss
    │   ├── kitchen_line_lock.scss
    │   ├── waiter_assignment.scss
    │   └── navbar_progress.scss
    │
    └── img/
        ├── chavecito_logo.svg
        └── cards/
            ├── visa.svg
            ├── mastercard.svg
            ├── amex.svg
            ├── diners.svg
            ├── discover.svg
            └── other.svg
```

---

## ⚙️ Configuración

### Configurar métodos de pago con tarjeta

1. Ir a: **Punto de Venta → Configuración → Métodos de Pago**
2. Seleccionar el método de pago (ej: "Tarjeta de Crédito")
3. Marcar la casilla **"Es pago con tarjeta"**
4. Guardar

Ahora al usar ese método de pago en el POS, aparecerá automáticamente el popup de selección de marca.

---

## 🧪 Pruebas Funcionales

### ✅ Checklist de validación

- [ ] **Card Brand - Popup de selección**
  - [ ] Aparece al seleccionar método de pago con tarjeta
  - [ ] Muestra todas las marcas (Visa, MasterCard, etc.)
  - [ ] Permite ingresar número de lote
  - [ ] Valida que lote solo contenga números
  - [ ] Bloquea confirmación sin marca seleccionada
  - [ ] Bloquea confirmación sin número de lote

- [ ] **Card Brand - Visualización**
  - [ ] Marca aparece en línea de pago del POS
  - [ ] Número de lote aparece en línea de pago
  - [ ] Marca e icono aparecen en ticket impreso
  - [ ] Marca y lote aparecen en factura

- [ ] **Header Branding**
  - [ ] Logo "CHAVECITOO POS" aparece en header
  - [ ] Logo reemplaza correctamente el logo de Odoo

- [ ] **Invoice Label**
  - [ ] Botón muestra "Factura" en lugar de "Recibo/Factura"
  - [ ] Funcionalidad de facturación sigue igual

- [ ] **Order Lock After Kitchen**
  - [ ] Líneas enviadas a cocina tienen highlight visual
  - [ ] No se pueden eliminar/reducir líneas servidas sin PIN
  - [ ] Progreso de servicio se calcula correctamente
  - [ ] Tiempo de espera se muestra correctamente

- [ ] **Waiter Assignment**
  - [ ] Nombre de mesero aparece sobre mesas ocupadas
  - [ ] Badge tiene color distintivo por mesero
  - [ ] Progreso de servicio aparece en navbar
  - [ ] Asignación se hace automáticamente al loguear

---

## 🔄 Migración desde Módulos Individuales

Si tienes instalados los 5 módulos individuales y quieres migrar a este módulo consolidado:

### Paso 1: Crear respaldo

```powershell
# Ver carpeta de respaldos
cd "c:\Program Files\Odoo 18\backups"

# El respaldo ya fue creado en:
# backup_pre_mejoras_restaurant_YYYYMMDD_HHMMSS/
```

### Paso 2: Desinstalar módulos antiguos

Desde la interfaz de Odoo:
1. Ir a **Aplicaciones**
2. Buscar cada módulo individual
3. Hacer clic en "Desinstalar"

### Paso 3: Instalar mejoras_restaurant

1. Actualizar lista de aplicaciones
2. Buscar "Mejoras Restaurant"
3. Instalar

### Paso 4: Verificar configuración

- Revisar que métodos de pago con tarjeta tengan la casilla marcada
- Verificar que todas las funcionalidades funcionen correctamente

---

## 🐛 Solución de Problemas

### El popup de marca de tarjeta no aparece

- Verificar que el método de pago tenga marcado "Es pago con tarjeta"
- Limpiar caché del navegador
- Actualizar el módulo con `-u mejoras_restaurant`

### El logo personalizado no aparece

- Verificar que el archivo `static/src/img/chavecito_logo.svg` existe
- Reiniciar Odoo
- Actualizar assets con `--dev=all`

### Líneas de cocina no se bloquean

- Verificar que `pos_hr` esté instalado
- Verificar que las líneas tengan el flag `kitchenServed`
- Revisar consola del navegador por errores

### Mesero no aparece en mesas

- Verificar que el usuario esté logueado en Odoo (no solo en el POS)
- Confirmar que la orden tenga `user_id` asignado
- Revisar logs del servidor

---

## 📝 Notas de Desarrollo

### Organización del código

El código está organizado por funcionalidad de origen:
- Cada funcionalidad mantiene su estructura en subcarpetas
- Los patches OWL están separados para evitar conflictos
- Los assets se cargan en orden lógico

### Convenciones de nombres

- **Templates XML:** `mejoras_restaurant.[NombreComponente]`
- **Imports JS:** `@mejoras_restaurant/js/[funcionalidad]/[archivo]`
- **Rutas de imágenes:** `/mejoras_restaurant/static/src/img/...`

### Extensibilidad

Este módulo puede ser extendido heredando de los componentes OWL o modelos Python según sea necesario.

---

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades:
- Revisar logs de Odoo en `server/odoo.log`
- Revisar consola del navegador para errores JS
- Contactar al equipo de desarrollo

---

## 📜 Historial de Cambios

### Versión 18.0.1.0.0 (2026-03-09)
- ✅ Consolidación inicial de 5 módulos
- ✅ Todas las funcionalidades migradas y probadas
- ✅ Assets reorganizados por funcionalidad
- ✅ Documentación completa
- ✅ Respaldo completo pre-migración creado

---

## 🙏 Créditos

Módulo consolidado creado a partir de:
- pos_card_brand
- pos_header_branding  
- pos_invoice_label_custom
- pos_restaurant_order_lock_after_kitchen
- pos_restaurant_waiter_assignment

Desarrollado para: **CHAVECITOO POS**  
Fecha: **Marzo 2026**
