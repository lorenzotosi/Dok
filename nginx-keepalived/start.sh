#!/bin/sh

mkdir -p /etc/keepalived

if [ "$HA_ROLE" = "master" ]; then
    cp /tmp/master.conf /etc/keepalived/keepalived.conf
else
    cp /tmp/backup.conf /etc/keepalived/keepalived.conf
fi

chmod 644 /etc/keepalived/keepalived.conf

keepalived -n -l -D &

nginx -g "daemon off;"