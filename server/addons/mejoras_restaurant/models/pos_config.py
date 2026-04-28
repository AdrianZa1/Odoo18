"""
Extensión de Configuración de POS para Login Mejorado
Agrega opción para activar el teclado numérico mejorado en el login
"""

from odoo import models, fields


class PosConfig(models.Model):
    _inherit = "pos.config"

    module_pos_improved_login = fields.Boolean(
        string="Usar Teclado Numérico Mejorado",
        default=False,
        help="""
        Habilita un mejor flujo de login para POS usando un teclado numérico 
        grande optimizado para tablets. 
        
        Características:
        - Teclado numérico grande y táctil
        - Búsqueda automática de empleado por PIN
        - Login directo sin pasos intermedios
        - Ideal para tablets
        
        Requiere: pos_hr habilitado
        """,
    )

    pos_header_logo_custom = fields.Binary(
        string="Logo Personalizado del Header",
        help="Imagen personalizada para mostrar en el header del POS. Si está vacío, se utilizará el logo estándar.",
    )

    _sql_constraints = [
        (
            "improved_login_requires_pos_hr",
            """
            CHECK(
                (module_pos_improved_login = false) OR 
                (module_pos_improved_login = true AND module_pos_hr = true)
            )
            """,
            "El login mejorado requiere que pos_hr esté habilitado",
        ),
    ]
