# -*- coding: utf-8 -*-

from odoo import api, models


class HrEmployee(models.Model):
    _inherit = "hr.employee"

    @api.model
    def _load_pos_data_fields(self, config_id):
        """Expose supervisor metadata to POS frontend PIN validation logic."""
        fields = list(super()._load_pos_data_fields(config_id))
        for extra_field in ("job_id", "job_title", "category_ids"):
            if extra_field not in fields:
                fields.append(extra_field)
        return fields
