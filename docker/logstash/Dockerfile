FROM logstash:6.8.23

RUN logstash-plugin install logstash-output-amazon_es
RUN logstash-plugin install logstash-output-stdout

COPY ./docker/logstash/logstash.conf /etc/logstash/conf.d/logstash.conf
COPY ./docker/logstash/logstash.yml /usr/share/logstash/config/logstash.yml

CMD ["logstash", "-f", "/etc/logstash/conf.d/logstash.conf"]
