# -*- coding: utf-8 -*-
# Part of Custom Development. See LICENSE file for full copyright and licensing details.

import logging

from odoo import api, models

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def _process_order(self, order, existing_order):
        """Force order user_id using the current web session user.

        POS frontend can send cashier user_id (often Administrator). We replace
        it at backend sync step so new orders are always attributed to the
        logged-in Odoo user.
        """
        order = dict(order)
        original_user_id = order.get('user_id')
        forced_user_id = self.env.uid
        order['user_id'] = forced_user_id

        _logger.warning(
            "WAITER_ASSIGNMENT _process_order: forcing user_id %s -> %s (web user: %s/%s, order: %s)",
            original_user_id,
            forced_user_id,
            self.env.user.login,
            self.env.user.name,
            order.get('name'),
        )

        return super()._process_order(order, existing_order)
