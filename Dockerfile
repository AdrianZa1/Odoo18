FROM odoo:18.0

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Copia tu módulo personalizado al contenedor
COPY server/addons/mejoras_restaurant /mnt/extra-addons/mejoras_restaurant

# Copia la plantilla de configuración
COPY config/odoo.conf.template /etc/odoo/odoo.conf.template
RUN chown -R odoo:odoo /mnt/extra-addons /etc/odoo

USER odoo
ENV ODOO_RC=/etc/odoo/odoo.conf
ENV DB_HOST=dpg-d7o3vgpj2pic739k5bl0-a
ENV DB_PORT=5432
ENV DB_USER=odooo18_user
ENV DB_PASSWORD=wWudyaae8FC1b87UuNljhIFMrCRQwgYp
ENV DB_NAME=odooo18
ENV ADMIN_PASSWD=admin
CMD ["bash", "-lc", "envsubst < /etc/odoo/odoo.conf.template > /etc/odoo/odoo.conf && exec odoo"]
