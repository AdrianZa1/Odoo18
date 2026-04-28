# -*- coding: utf-8 -*-

import logging

from odoo import _, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class PosSession(models.Model):
    _inherit = "pos.session"

    def _has_open_session_supervisor_group(self, user):
        # Transitional compatibility: accept either the new integrated group
        # or the original standalone module group while both modules coexist.
        for xmlid in (
            "mejoras_restaurant.group_pos_open_session_supervisor",
            "pos_open_session_restriction.group_pos_open_session_supervisor",
        ):
            try:
                if user.has_group(xmlid):
                    return True
            except Exception:
                continue
        return False

    def _is_employee_supervisor(self, user):
        if "employee_ids" not in user._fields:
            return False

        employees = user.sudo().employee_ids
        for emp in employees:
            job_name = (
                (emp.job_id.name or "").strip().lower()
                if "job_id" in emp._fields and emp.job_id
                else ""
            )
            job_title = (
                (emp.job_title or "").strip().lower()
                if "job_title" in emp._fields
                else ""
            )
            is_job_supervisor = "supervisor" in job_name or "supervisor" in job_title

            tag_names = []
            if "category_ids" in emp._fields:
                tag_names = [name.strip().lower() for name in emp.category_ids.mapped("name") if name]
            is_tag_supervisor = any("supervisor" in tag for tag in tag_names)

            if is_job_supervisor or is_tag_supervisor:
                return True

        return False

    def _check_open_session_permission(self):
        user = self.env.user
        allowed_group = self._has_open_session_supervisor_group(user)
        allowed_employee = self._is_employee_supervisor(user)

        if allowed_group or allowed_employee:
            _logger.info(
                "POS open allowed for user=%s (%s) by group=%s employee_supervisor=%s sessions=%s",
                user.login,
                user.id,
                allowed_group,
                allowed_employee,
                self.ids,
            )
            return

        _logger.warning("POS open denied for user=%s (%s) sessions=%s", user.login, user.id, self.ids)
        raise UserError(
            _("No tiene permisos para abrir caja. Solo un supervisor autorizado puede realizar esta accion.")
        )

    def action_pos_session_open(self):
        # Keep backend passthrough; restriction is enforced in POS frontend flow.
        return super().action_pos_session_open()

    def _set_opening_control_data(self, cashbox_value: int, notes: str):
        # Safety net for direct RPC/API usage of opening control.
        sessions_to_open = self.filtered(lambda s: s.state == "opening_control")
        if sessions_to_open:
            sessions_to_open._check_open_session_permission()
        return super()._set_opening_control_data(cashbox_value, notes)
