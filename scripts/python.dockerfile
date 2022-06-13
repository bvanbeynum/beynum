FROM arm64v8/python

RUN ln -sf /usr/share/zoneinfo/America/New_York /etc/localtime

RUN pip install requests

WORKDIR /working

CMD ["python"]
