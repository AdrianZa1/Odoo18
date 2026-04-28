# -*- coding: utf-8 -*-
# Part of Custom Development. See LICENSE file for full copyright and licensing details.

import logging

from odoo import api, models, fields

_logger = logging.getLogger(__name__)


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    kitchen_state = fields.Selection(
        selection=[
            ('waiting', 'Waiting for Kitchen'),
            ('ordered', 'Sent to Kitchen'),
            ('prepared', 'Ready (Kitchen)'),
            ('served', 'Served'),
        ],
        default='waiting',
        help="Track the kitchen workflow",
    )

    @api.model
    def _load_pos_data_fields(self, config_id):
        fields_to_load = list(super()._load_pos_data_fields(config_id))
        if 'kitchen_state' not in fields_to_load:
            fields_to_load.append('kitchen_state')
        return fields_to_load
