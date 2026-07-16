FROM nginx:alpine

RUN apk add --no-cache keepalived

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY keepalived-master.conf /tmp/master.conf
COPY keepalived-backup.conf /tmp/backup.conf

CMD ["/start.sh"]