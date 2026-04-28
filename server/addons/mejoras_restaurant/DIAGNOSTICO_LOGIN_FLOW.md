# 📊 DIAGNÓSTICO DEL FLUJO DE LOGIN DEL POS - ODOO 18

## 1. FLUJO ACTUAL DE INICIO DE SESIÓN

### Con módulo `pos_hr` habilitado (Autenticación por PIN/Código de Barras)

```
┌─────────────────────────────────────────────────────────────────┐
│ PANTALLA 1: LoginScreen (point_of_sale base)                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │               Logo + Fecha/Hora                            │  │
│  │                                                             │  │
│  │              ┌─────────────────────────────┐               │  │
│  │              │  🛒 Open Register / Unlock   │               │  │
│  │              │      Register                │               │  │
│  │              └─────────────────────────────┘               │  │
│  │                                                             │  │
│  │         [ Logout ] (abajo)                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Acción: Usuario hace click en botón                             │
└─────────────────────────────────────────────────────────────────┘

    ↓ (si pos_hr habilitado)

┌─────────────────────────────────────────────────────────────────┐
│ PANTALLA 2: Overlay de PIN (pos_hr LoginScreen override)        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Input PIN:  [••••••••] (password, valor oculto)          │  │
│  │                                                             │  │
│  │  Buttons:  [👥 Select]  [📱 Scan]                          │  │
│  │                                                             │  │
│  │  Eventos:                                                   │  │
│  │  - Enter key con PIN: busca empleados con ese PIN         │  │
│  │  - Click Select: abre SelectionPopup                       │  │
│  │  - Barcode scan: busca por código de barras                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Problemas para TABLET:                                         │
│  ❌ Input oscuro, difícil de ver si algo se escribió            │
│  ❌ Texto "Enter your PIN" es inglés, poco amigable             │
│  ❌ Botones pequeños para toque en tablet                       │
│  ❌ Requiere usar teclado sofware de tablet (no numérico)       │
└─────────────────────────────────────────────────────────────────┘

    ↓ (si PIN escrito y Enter presionado O click en Select)

┌─────────────────────────────────────────────────────────────────┐
│ PANTALLA 3A (si múltiples coincidencias de PIN):                │
│ SelectionPopup - Seleccionar Cajero                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │      Change Cashier                          [X]            │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │                                                             │  │
│  │  ◻ Juan García               (Cajero 1)                    │  │
│  │  ◻ Juan García (backup)      (Cajero 2)                    │  │
│  │  ◻ María López               (Cajero 3)                    │  │
│  │                                                             │  │
│  │                [ Confirmar ]                               │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

    ↓ O

┌─────────────────────────────────────────────────────────────────┐
│ PANTALLA 3B (si única coincidencia O después de seleccionar):   │
│ NumberPopup - Validación de PIN final (si el empleado tiene PIN)│
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │       Password?                              [X]            │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │                                                             │  │
│  │              [••••]  (mostrar PIN con puntos)              │  │
│  │                                                             │  │
│  │   [ 1 ] [ 2 ] [ 3 ]                                         │  │
│  │   [ 4 ] [ 5 ] [ 6 ]                                         │  │
│  │   [ 7 ] [ 8 ] [ 9 ]                                         │  │
│  │   [⌫ ] [ 0 ] [ ✓ ]                                          │  │
│  │                                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

    ↓ (si PIN válido)

┌─────────────────────────────────────────────────────────────────┐
│ PANTALLA 4: ProductScreen O FloorScreen (según pos_restaurant)  │
│                                                                   │
│ ✓ Usuario logueado como: "Juan García"                          │
│ ✓ Iniciado proceso de transacción                               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. PROBLEMAS IDENTIFICADOS PARA TABLET

| Problema | Impacto | Causa |
|----------|---------|-------|
| **Múltiples pantallas** | Navegación confusa | Layout en overlay + SelectionPopup + NumberPopup |
| **Input oscuro** | No se ve el PIN | `type="password"` hace que sea invisible |
| **Botones pequeños** | Difícil pulsar en tablet | Diseño desktop-first |
| **Paso intermedio** | Tedioso | Primero pedir PIN, luego seleccionar empleado, luego confirmar PIN |
| **Teclado sofware genérico** | Lento | Usa teclado del sistema, no numérico |
| **Seleccionar empleado** | Innecesario si PIN es único | Obliga a seleccionar aunque solo haya un resultado |

## 3. ESTRUCTURA DE DATOS UTILIZADA

### Modelo de Base de Datos: `hr.employee`

```python
# En Odoo:
class HrEmployee(models.Model):
    _name = "hr.employee"
    
    pin = fields.Char(
        string="PIN",
        groups="hr.group_hr_user",
        copy=False,
        help="PIN para Check In/Out Kiosk y cambio de cajero en POS"
    )
    
    barcode = fields.Char(string="Barcode")  # Código de barras
    user_id = fields.Many2one('res.users')   # Usuario asociado
    name = fields.Char(string="Nombre")      # Nombre del empleado
    active = fields.Boolean(default=True)    # Activo/Inactivo
    
    def get_barcodes_and_pin_hashed(self):
        """Retorna PINs y códigos de barras hasheados con SHA1"""
        return [{
            'id': emp.id,
            'name': emp.name,
            'pin': Sha1.hash(emp.pin),  # En cliente: _pin
            'barcode': Sha1.hash(emp.barcode),  # En cliente: _barcode
            'user_id': emp.user_id.id if emp.user_id else False
        }]
```

### Datos en Cliente (JavaScript/OWL)

```javascript
// En pos.models["hr.employee"]:
{
    id: 1,
    name: "Juan García",
    user_id: {id: 5, name: "juan.garcia"},
    work_contact_id: {...},
    _role: "manager",              // Role en POS
    _user_role: "admin",           // Si es admin de Odoo
    _barcode: "a1b2c3d4e5f6...",  // SHA1(barcode original)
    _pin: "f7g8h9i0j1k2l3m4...",   // SHA1(pin original)
    active: true
}
```

### Búsqueda Actual vs. Propuesta

**Búsqueda Actual (pos_hr)**:
```javascript
// Busca toda lista de empleados y luego filtra por PIN
const allEmployees = pos.models["hr.employee"]
const pinMatches = allEmployees.filter(emp => 
    Sha1.hash(pin) === emp._pin
)
// Problema: Requiere escribir PIN primero, luego seleccionar empleado
```

**Búsqueda Propuesta (mejoras_restaurant)**:
```javascript
// Busca empleado por PIN directamente en el popup de entrada
const allEmployees = pos.models["hr.employee"]
    .filter(emp => emp.id !== pos.get_cashier()?.id)  // Excluir actual

const pin = await NumericKeyboardPopup()  // Nuevo componente

const matches = allEmployees.filter(emp => 
    Sha1.hash(pin) === emp._pin
)

if (matches.length === 1) {
    // ✓ Único resultado → Login automático
    pos.set_cashier(matches[0])
} else if (matches.length > 1) {
    // Múltiples → Mostrar selección rápida
    const selected = await SelectionPopup({list: matches})
    pos.set_cashier(selected)
} else {
    // ✗ No encontrado → Reintentar en mismo popup
    showError("PIN no encontrado")
}
```

## 4. MODELOS Y COMPONENTES OWL CLAVE

### Componentes Actuales Relevantes

| Componente | Ubicación | Uso | Heredable |
|-----------|-----------|-----|----------|
| **LoginScreen** | `point_of_sale/screens/login_screen/` | Pantalla inicial | ✓ Sí (patched en pos_hr) |
| **NumberPopup** | `point_of_sale/utils/input_popups/` | Entrada numérica genérica | ✓ Sí |
| **SelectionPopup** | `point_of_sale/utils/input_popups/` | Selección de lista | ✓ Sí |
| **CashierName** | `point_of_sale/navbar/` | Botón navbar con nombre | ✗ No (es componente sidebar) |

### Mixins y Hooks Actuales

| Nombre | Ubicación | Propósito | Usa |
|--------|-----------|----------|-----|
| **useCashierSelector** | `pos_hr/app/select_cashier_mixin.js` | Lógica de selección de cajero | makeAwaitable, dialog service, Sha1 |
| **useBarcodeReader** | `point_of_sale/barcode/` | Lectura de códigos de barras | Hardware barcode scanner |
| **usePos** | `point_of_sale/store/pos_hook.js` | Hook para acceder a posStore | Estado global |

## 5. CAMPO PIN EN EMPLEADOS

### ¿Existe PIN ya?: ✅ SÍ

- **Campo**: `hr.employee.pin` (String/Char)
- **Grupo**: Solo visible para `hr.group_hr_user` (HR staff)
- **Hashing**: Se hashea con SHA1 antes de enviarse al cliente
- **Uso Actual**: Para validación de barcode scanning en pos_hr
- **¿Obligatorio?**: NO (opcional)
- **¿Único?**: NO (se permite repetir PINs)

### Validación de PIN Actual

```python
# En odoo/addons/pos_hr/models/hr_employee.py
@api.constrains('pin')
def _verify_pin(self):
    for employee in self:
        if employee.pin:
            if not employee.pin.isdigit():
                raise ValidationError("PIN must be numeric")
            if len(employee.pin) < 4:
                raise ValidationError("PIN must be at least 4 digits")
```

### Recomendación

⚠️ **No crear nuevo campo**. Reutilizar `hr.employee.pin` existente.

**Si se requiere PIN único por empleado**:
```python
# Agregar en mejoras_restaurant/models/hr_employee.py
_sql_constraints = [
    ('pin_unique', 'UNIQUE(pin)', 'PIN debe ser único por empleado'),
]
```

## 6. COMPONENTES A IMPLEMENTAR EN mejoras_restaurant

### Nuevo: NumericKeyboardPopup

**Propósito**: Popup con teclado numérico grande, optimizado para tablet

**Props**:
```javascript
{
    title: string,                    // Título del popup
    formatDisplayedValue: function,   // (opcional) Formatear display (ej: máscara)
    getPayload: function,             // Callback con valor al confirmar
    placeholder: string               // (opcional) Placeholder
    mode: 'keyboard' | 'auto'        // auto: buscar empleado al escribir
}
```

**Features**:
- Teclado numérico grande (botones 60px mínimo)
- Display grande del valor ingresado (con máscara • si es password)
- Botones: 0-9, Borrar (⌫), Confirmar (✓)
- Soporte Enter/Delete del teclado real
- Responsive (tablet, mobile, desktop)
- Cierre con ESC
- Validación de longitud MIN/MAX

### Modificación: LoginScreen (pos_hr override)

**Cambios**:
```javascript
openRegister() {
    if (pos.config.module_pos_hr && this.pos.config.module_improved_login) {
        // NUEVO: Usar NumericKeyboardPopup directo
        this.selectCashierNumeric();
    } else if (pos.config.module_pos_hr) {
        // Antiguo comportamiento pos_hr
        this.pos.login = true;
    } else {
        // Comportamiento base
        super.openRegister();
    }
}

selectCashierNumeric() {
    // 1. Abrir popup numérico
    // 2. Buscar automáticamente por PIN
    // 3. Login directo o mostrar selección
}
```

## 7. ARCHIVOS A CREAR/MODIFICAR

### Nuevos archivos en mejoras_restaurant

```
mejoras_restaurant/
├── models/
│   └── hr_employee.py                # (OPCIONAL) Para validación PIN único
├── static/src/
│   ├── js/
│   │   └── login_flow/
│   │       ├── numeric_keyboard_popup.js
│   │       └── login_screen_override.js
│   ├── xml/
│   │   └── login_flow/
│   │       └── numeric_keyboard_popup.xml
│   └── scss/
│       └── numeric_keyboard.scss
└── __manifest__.py                   # Actualizar assets
```

### Archivos a actualizar

- `__manifest__.py`: Agregar assets nuevos
- `models/__init__.py`: Importar hr_employee.py si se extiende

## 8. FLUJO DESEADO DEL USUARIO EN TABLET

```
┌──────────────────────────────────────────────────────────┐
│ PANTALLA 1: LoginScreen                                  │
│                                                          │
│         ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                     │
│         ┌──────────────────────────┐                     │
│         │  🔓 Desbloquear Caja     │                     │
│         └──────────────────────────┘                     │
│         └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘

    ↓ Click

┌──────────────────────────────────────────────────────────┐
│ POPUP 1 (ÚNICO): NumericKeyboardPopup                    │
│ ─────────────────────────────────────────────────────────│
│                                                          │
│  Ingrese su PIN:                  [X]                   │
│  ┌─────────────────────────────────┐                   │
│  │     •  •  •  •              │ Display                │
│  │ ─────────────────────────────────│                   │
│  │                                  │                   │
│  │   [ 1 ]  [ 2 ]  [ 3 ]           │  60px cada       │
│  │   [ 4 ]  [ 5 ]  [ 6 ]           │  botón           │
│  │   [ 7 ]  [ 8 ]  [ 9 ]           │                   │
│  │   [ ⌫ ]  [ 0 ]  [ ✓ ]           │  Touch-friendly   │
│  │                                  │                   │
│  └─────────────────────────────────┘                   │
│                                                          │
│  Automatizado:                                          │
│  ✓ Al escribir: busca empleado con ese PIN             │
│  ✓ Si único: muestra "Encontrado: Juan García"         │
│  ✓ Si múltiple: muestra cuenta "(2 resultados)"        │
│  ✓ Si no: muestra "PIN no encontrado"                  │
│                                                          │
└──────────────────────────────────────────────────────────┘

    ↓ (Si único) Click ✓ O espera 2 seg

┌──────────────────────────────────────────────────────────┐
│ (OPCIONAL) POPUP 2: Confirmación rápida (0.5 seg)       │
│ ─────────────────────────────────────────────────────────│
│                 ✓ Juan García                            │
│              (entrar como...)                            │
└──────────────────────────────────────────────────────────┘

    ↓ (Auto-cierra O click)

┌──────────────────────────────────────────────────────────┐
│ PANTALLA 2: FloorScreen O ProductScreen                  │
│                                                          │
│ ✓ Usuario: Juan García (en navbar)                      │
│ ✓ Listo para operar                                     │
└──────────────────────────────────────────────────────────┘
```

## 9. VALIDACIONES E INDICADORES

### Durante la entrada de PIN

- Mínimo 4 dígitos (validar en `hr_employee`)
- Máximo 8 dígitos (típicamente)
- Búsqueda en vivo mientras se escribe
- Indicadores visuales:
  - ✓ Verde: PIN encontrado
  - ⚠️ Naranja: Múltiples resultados
  - ✗ Rojo: PIN no encontrado

### Si PIN no encontrado

1. Mostrar error en el popup
2. Opción: "Buscar por nombre" (abrir SelectionPopup)
3. Permitir reintentar en el mismo popup
4. Botón "Cancelar" para volver al LoginScreen

## 10. CONSIDERACIONES FINALES

### Compatibilidad
- ✅ Odoo 18
- ✅ pos_restaurant
- ✅ pos_hr (extiende sin conflictos)
- ✅ Tablet (responsive CSS)
- ✅ Desktop (funciona igual)

### Seguridad
- ✅ PIN hasheado con SHA1 (igual que pos_hr)
- ✅ No se guarda PIN en plain text
- ✅ Validación servidor-side de PIN

### Reutilización
- ✅ Máximo reutilizar componentes existentes
- ✅ Sin duplicar lógica de pos_hr
- ✅ Extender LoginScreen, no reemplazar

### Mejoras Futuras
- [ ] Huella digital en tablet con soporte Touch ID
- [ ] RFID directamente a NumericKeyboardPopup
- [ ] Histórico de logins por empleado
- [ ] PIN con expiración
