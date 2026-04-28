# -*- coding: utf-8 -*-
{
    'name': 'Mejoras Restaurant - Módulo Consolidado',
    'version': '18.0.1.0.3',
    'category': 'Point of Sale',
    'summary': 'Módulo consolidado con todas las mejoras personalizadas para POS Restaurant',
    'description': """
Mejoras Restaurant - Módulo Consolidado
========================================

Este módulo consolida mejoras personalizadas para POS Restaurant:

1. **Selección de Marca de Tarjeta (Card Brand Selection)**
   - Popup para seleccionar marca de tarjeta en pagos
   - Captura de número de lote del voucher
   - Visualización en tickets y facturas
   - Validación obligatoria para métodos de pago con tarjeta

2. **Branding Personalizado del Header**
   - Reemplazo del texto de Odoo en el header del POS
   - Logo y texto personalizados

3. **Etiquetas Personalizadas de Factura/Recibo**
   - Traducción personalizada del botón Invoice
   - Cambio de "Recibo/Factura" → "Factura"

4. **Bloqueo de Líneas después de Cocina**
   - Previene eliminación/reducción de líneas enviadas a cocina
   - Requiere PIN de supervisor para modificar líneas servidas

5. **Asignación de Mesero (Floor Plan)**
   - Gestión de mesas y asignación de personal
   - Integración con pos_restaurant

Características Técnicas:
- Compatible con Odoo 18
- Integración completa con pos_restaurant
- Patches OWL organizados por funcionalidad
- Modelos extend sin conflictos
- Assets optimizados por módulo de origen

Autor: Custom Development
Licencia: LGPL-3
    """,
    'author': 'Custom Development',
    'website': 'https://www.tuempresa.com',
    'license': 'LGPL-3',
    'depends': [
        'point_of_sale',      # Base POS
        'pos_restaurant',     # Restaurant features
        'pos_hr',             # HR features para order lock
    ],
    'data': [
        # Security - POS open session restriction
        'security/ir.model.access.csv',
        'security/open_session_security.xml',
        # Views para card brand
        'views/pos_payment_method_views.xml',
        'views/pos_payment_views.xml',
        # Views para login mejorado
        'views/pos_config_improved_login.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            # Login Flow Improvements - Numeric Keyboard for tablet/mobile
            'mejoras_restaurant/static/src/js/login_flow/numeric_keyboard_popup.js',
            # 'mejoras_restaurant/static/src/js/login_flow/login_screen_override.js',  # DESACTIVADO - causaba errores de template
            'mejoras_restaurant/static/src/js/open_session_restriction/supervisor_open_register.js',
            'mejoras_restaurant/static/src/xml/login_flow/numeric_keyboard_popup.xml',
            # 'mejoras_restaurant/static/src/xml/login_flow/login_screen_pos_hr_patch.xml',  # DESACTIVADO - causaba Missing parent templates error
            'mejoras_restaurant/static/src/xml/open_session_restriction/opening_control_popup_cancel.xml',
            'mejoras_restaurant/static/src/scss/numeric_keyboard.scss',
            
            # Card Brand Selection assets
            'mejoras_restaurant/static/src/js/card_brand/models.js',
            'mejoras_restaurant/static/src/js/card_brand/card_brand_data.js',
            'mejoras_restaurant/static/src/js/card_brand/card_brand_popup.js',
            'mejoras_restaurant/static/src/js/card_brand/payment_screen.js',
            'mejoras_restaurant/static/src/xml/card_brand/card_brand_popup.xml',
            'mejoras_restaurant/static/src/xml/card_brand/payment_line.xml',
            'mejoras_restaurant/static/src/scss/card_brand_popup.scss',
            
            # Header Branding assets
            'mejoras_restaurant/static/src/js/header_branding/pos_header_patch.js',
            'mejoras_restaurant/static/src/xml/header_branding/pos_header.xml',
            
            # Order Lock After Kitchen assets
            'mejoras_restaurant/static/src/xml/order_lock/control_buttons_override.xml',
            'mejoras_restaurant/static/src/js/order_lock/control_buttons_override.js',
            'mejoras_restaurant/static/src/js/reservation/control_buttons.js',
            'mejoras_restaurant/static/src/xml/reservation/control_buttons.xml',
            'mejoras_restaurant/static/src/js/order_lock/order_summary_restriction.js',
            'mejoras_restaurant/static/src/js/order_lock/order_deletion_restriction.js',
            'mejoras_restaurant/static/src/js/order_lock/line_deletion_restriction.js',
            'mejoras_restaurant/static/src/js/order_lock/orderline_highlight.js',
            'mejoras_restaurant/static/src/scss/orderline_highlight.scss',
            
            # Waiter Assignment assets
            'mejoras_restaurant/static/src/js/waiter_assignment/floor_screen.js',
            'mejoras_restaurant/static/src/xml/waiter_assignment/floor_screen.xml',
            'mejoras_restaurant/static/src/scss/waiter_assignment.scss',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
